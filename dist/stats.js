/**
 * Descriptive statistics over plain JS numbers, or over `Decimal` values.
 *
 * `mean`, `median`, `minMax`, `variance` and `stddev` follow the element type:
 * plain numbers give a fast, approximate `number`; `Decimal` elements give an
 * exact `Decimal`. `sum` is number-only because an empty input cannot tell
 * which zero to return; use `Decimal.sum` for an exact total. `mode`,
 * `percentile`, `quantile`, `correlation` and `linearRegression` are
 * number-only: interpolation and regression are approximate by nature, so an
 * exact type would promise precision they lack.
 *
 * Every input must be finite; `NaN` and `±Infinity` throw rather than spread.
 * Inputs may be any iterable but are read once and never modified (no in-place
 * sort). Results never carry `-0`.
 */
import { Decimal, isDecimal } from './decimal.js';
import { EmptyDataError, InvalidArgumentError, NumericRangeError, RoundingNecessaryError } from './errors.js';
import { divideRounded, pow10 } from './internal/bigint.js';
import { assertScale } from './internal/fraction.js';
import { assertFinite } from './number.js';
function mixedInputs() {
    return new TypeError('mixed number and Decimal inputs; convert one side');
}
/** Reads the input once into an array (an array input is returned as-is). */
function materialize(values) {
    return Array.isArray(values) ? values : [...values];
}
/**
 * The first element, to pick the number or `Decimal` path, plus the whole
 * sequence for a single pass. Nothing is copied; a one-shot iterable (a
 * generator) is resumed rather than restarted.
 */
function peek(values) {
    if (Array.isArray(values))
        return { first: values[0], all: values };
    const iterator = values[Symbol.iterator]();
    const head = iterator.next();
    if (head.done === true)
        return { first: undefined, all: [] };
    function* resumed() {
        yield head.value;
        for (let next = iterator.next(); next.done !== true; next = iterator.next())
            yield next.value;
    }
    return { first: head.value, all: resumed() };
}
/** `ddof` checked once for both the number and the `Decimal` path. */
function ddofOf(options) {
    const ddof = options.ddof ?? 1;
    if (ddof !== 0 && ddof !== 1)
        throw new InvalidArgumentError(`ddof must be 0 or 1, got ${String(ddof)}`);
    return ddof;
}
/** The number path's entry: rejects any `Decimal` element, then validates as before. */
function numbersFrom(items, name) {
    if (items.every((item) => typeof item === 'number'))
        return toNumbers(items, name);
    const index = items.findIndex((item) => typeof item !== 'number');
    if (isDecimal(items[index]))
        throw mixedInputs();
    throw new TypeError(`${name}[${index}] must be a number`);
}
function decimalsFrom(items) {
    const out = [];
    for (const item of items) {
        if (!isDecimal(item))
            throw mixedInputs();
        out.push(item);
    }
    return out;
}
function scaleOptionsOf(options) {
    if (options?.scale === undefined)
        return undefined;
    return options.rounding === undefined ? { scale: options.scale } : { scale: options.scale, rounding: options.rounding };
}
function noNegativeZero(value) {
    return value === 0 ? 0 : value;
}
/**
 * Validates every element and returns them as an array. An array input is
 * returned as-is (never mutated by this module — sorting goes through
 * `toSorted`), so the common case allocates nothing.
 */
function toNumbers(values, name) {
    const out = Array.isArray(values) ? values : [...values];
    let index = 0;
    for (const value of out) {
        // Cheap check first; the message is only built for the failing element.
        if (typeof value !== 'number' || !Number.isFinite(value))
            assertFinite(value, `${name}[${index}]`);
        index++;
    }
    return out;
}
function sumOf(values) {
    let total = 0;
    let compensation = 0;
    for (const value of values) {
        const next = total + value;
        compensation += Math.abs(total) >= Math.abs(value) ? total - next + value : value - next + total;
        total = next;
    }
    return total + compensation;
}
function assertRepresentable(value, what) {
    if (!Number.isFinite(value))
        throw new NumericRangeError(`${what} is too large to represent`);
    return value;
}
/**
 * Mean that cannot overflow: the compensated sum divided by the count, or,
 * when the sum itself overflows, the sum of the values each divided by the
 * count (the mean of finite numbers is always finite).
 */
function meanOf(values) {
    const n = values.length;
    const total = sumOf(values);
    if (Number.isFinite(total))
        return total / n;
    let scaled = 0;
    let compensation = 0;
    for (const value of values) {
        const part = value / n;
        const next = scaled + part;
        compensation += Math.abs(scaled) >= Math.abs(part) ? scaled - next + part : part - next + scaled;
        scaled = next;
    }
    return scaled + compensation;
}
/** Linear interpolation that stays finite when `high - low` would overflow. */
function interpolate(low, high, fraction) {
    const span = high - low;
    return Number.isFinite(span) ? low + span * fraction : low * (1 - fraction) + high * fraction;
}
function sortedCopy(values) {
    return values.toSorted((a, b) => a - b);
}
function pairs(x, y) {
    const xs = toNumbers(x, 'x');
    const ys = toNumbers(y, 'y');
    if (xs.length !== ys.length) {
        throw new InvalidArgumentError(`x and y must have the same length, got ${xs.length} and ${ys.length}`);
    }
    if (xs.length < 2)
        throw new InvalidArgumentError('at least 2 points are required');
    return { xs, ys };
}
/**
 * Centered sums of squares and cross-products. The sums are in units of `kx`
 * (for x) and `ky` (for y): the plain path has `kx = ky = 1`; when the plain
 * sums overflow, the data is rescaled by its largest magnitude, which leaves
 * correlation unchanged and slope recoverable as `sxy / sxx * ky / kx`.
 */
function centeredSums(xs, ys) {
    const meanX = meanOf(xs);
    const meanY = meanOf(ys);
    let sxx = 0;
    let syy = 0;
    let sxy = 0;
    for (const [i, x] of xs.entries()) {
        const dx = x - meanX;
        const dy = (ys[i] ?? 0) - meanY;
        sxx += dx * dx;
        syy += dy * dy;
        sxy += dx * dy;
    }
    if (Number.isFinite(sxx) && Number.isFinite(syy) && Number.isFinite(sxy)) {
        return { sxx, syy, sxy, meanX, meanY, kx: 1, ky: 1 };
    }
    const kx = xs.reduce((m, v) => Math.max(m, Math.abs(v)), 0) || 1;
    const ky = ys.reduce((m, v) => Math.max(m, Math.abs(v)), 0) || 1;
    sxx = 0;
    syy = 0;
    sxy = 0;
    for (const [i, x] of xs.entries()) {
        const dx = x / kx - meanX / kx;
        const dy = (ys[i] ?? 0) / ky - meanY / ky;
        sxx += dx * dx;
        syy += dy * dy;
        sxy += dx * dy;
    }
    return { sxx, syy, sxy, meanX, meanY, kx, ky };
}
/** Exact total and count of `Decimal` values in one pass, at the running largest scale; rejects numbers. */
function decimalTotal(values) {
    let coefficient = 0n;
    let scale = 0;
    let count = 0;
    for (const value of values) {
        if (!isDecimal(value))
            throw mixedInputs();
        if (value.scale > scale) {
            coefficient *= pow10(value.scale - scale);
            scale = value.scale;
        }
        coefficient += value.coefficient * pow10(scale - value.scale);
        count++;
    }
    return { total: Decimal.fromParts({ coefficient, scale }), count };
}
/** floor(sqrt(n)) for n >= 0, by Newton's iteration from above. */
function isqrt(n) {
    if (n < 2n)
        return n;
    // 2^ceil(bits / 2) >= sqrt(n), and Newton's step decreases monotonically to the floor from above.
    let x = 1n << BigInt(Math.ceil(n.toString(2).length / 2));
    for (;;) {
        const next = (x + n / x) >> 1n;
        if (next >= x)
            return x;
        x = next;
    }
}
/**
 * sqrt(numerator / denominator) rounded to an integer with `mode`, correctly:
 * the decision is made on exact integers, never on a rounded intermediate.
 * Both arguments are non-negative; `denominator` is positive.
 *
 * sqrt(N / D) = sqrt(N * D) / D. When N * D is a perfect square the value is
 * the rational root / D, which `divideRounded` rounds exactly (ties included).
 * Otherwise the value is irrational, so it is never on a tie: it lies strictly
 * between f = floor(root / D) and f + 1, and strictly above the half exactly
 * when 4 * N * D > ((2f + 1) * D)^2. A stand-in rational on the same side of
 * the half, (4f + 3) / 4 or (4f + 1) / 4, then rounds identically in every mode
 * (and makes `'unnecessary'` throw).
 */
function roundedSqrtOfRatio(numerator, denominator, mode) {
    const product = numerator * denominator;
    const root = isqrt(product);
    if (root * root === product)
        return divideRounded(root, denominator, mode);
    const floor = root / denominator;
    const twiceHalfway = (2n * floor + 1n) * denominator;
    const aboveHalf = 4n * product > twiceHalfway * twiceHalfway;
    return divideRounded(4n * floor + (aboveHalf ? 3n : 1n), 4n, mode);
}
/**
 * Standard deviation of `Decimal` values, correctly rounded at `scale`. With
 * every value at the common scale S (coefficients c), the variance is the
 * exact fraction (n * sum(c^2) - sum(c)^2) / (n * (n - ddof) * 10^(2S)); the
 * result's coefficient is the square root of that fraction times 10^(2 * scale),
 * rounded once.
 */
function decimalStddev(values, ddof, target) {
    const n = values.length;
    if (n <= ddof)
        throw new EmptyDataError(`variance needs more than ${ddof} value(s), got ${n}`);
    assertScale(target.scale);
    let common = 0;
    for (const value of values)
        if (value.scale > common)
            common = value.scale;
    let total = 0n;
    let squares = 0n;
    for (const value of values) {
        const coefficient = value.coefficient * pow10(common - value.scale);
        total += coefficient;
        squares += coefficient * coefficient;
    }
    const count = BigInt(n);
    const numerator = (count * squares - total * total) * pow10(2 * target.scale);
    const denominator = count * (count - BigInt(ddof)) * pow10(2 * common);
    const coefficient = roundedSqrtOfRatio(numerator, denominator, target.rounding ?? 'halfEven');
    return Decimal.fromParts({ coefficient, scale: target.scale });
}
/** Welford's one-pass variance of validated numbers. */
function numberVariance(data, ddof) {
    if (data.length <= ddof) {
        throw new EmptyDataError(`variance needs more than ${ddof} value(s), got ${data.length}`);
    }
    let count = 0;
    let runningMean = 0;
    let m2 = 0;
    for (const value of data) {
        count++;
        const delta = value - runningMean;
        runningMean += delta / count;
        m2 += delta * (value - runningMean);
    }
    return noNegativeZero(assertRepresentable(m2 / (count - ddof), 'variance'));
}
function decimalVariance(values, ddof, options) {
    const n = values.length;
    if (n <= ddof)
        throw new EmptyDataError(`variance needs more than ${ddof} value(s), got ${n}`);
    const total = Decimal.sum(values);
    const squares = Decimal.sum(values.map((value) => value.times(value)));
    const numerator = squares.times(n).minus(total.times(total));
    try {
        return numerator.dividedBy(n * (n - ddof), options);
    }
    catch (error) {
        if (error instanceof RoundingNecessaryError && options === undefined) {
            throw new RoundingNecessaryError('variance does not terminate in decimal; pass { scale, rounding } to round it');
        }
        throw error;
    }
}
/**
 * Total of the values using Neumaier compensated summation. An empty input
 * gives `0`. Numbers only: for an exact total of `Decimal` values use
 * `Decimal.sum`, which returns a `Decimal` zero for an empty input.
 */
export function sum(values) {
    const items = materialize(values);
    if (isDecimal(items[0]))
        throw new TypeError('sum takes numbers; use Decimal.sum for Decimal values');
    return noNegativeZero(assertRepresentable(sumOf(numbersFrom(items, 'values')), 'sum'));
}
export function mean(values, options) {
    const { first, all } = peek(values);
    if (isDecimal(first)) {
        const { total, count } = decimalTotal(all);
        return total.dividedBy(count, options);
    }
    const data = numbersFrom(materialize(all), 'values');
    if (data.length === 0)
        throw new EmptyDataError('mean of an empty data set');
    return noNegativeZero(meanOf(data));
}
export function median(values) {
    const items = materialize(values);
    if (isDecimal(items[0])) {
        const ordered = decimalsFrom(items).toSorted((a, b) => a.compareTo(b));
        const middle = ordered.length >> 1;
        return ordered.length % 2 === 1 ? ordered[middle] : ordered[middle - 1].plus(ordered[middle]).dividedBy(2);
    }
    const sorted = sortedCopy(numbersFrom(items, 'values'));
    const n = sorted.length;
    if (n === 0)
        throw new EmptyDataError('median of an empty data set');
    const mid = n >> 1;
    return noNegativeZero(n % 2 === 1 ? sorted[mid] : sorted[mid - 1] / 2 + sorted[mid] / 2);
}
/** Every most-frequent value, ascending. Ties return all tied values; an empty input gives `[]`. */
export function mode(values) {
    const counts = new Map();
    let best = 0;
    for (const value of toNumbers(values, 'values')) {
        const key = noNegativeZero(value);
        const count = (counts.get(key) ?? 0) + 1;
        counts.set(key, count);
        if (count > best)
            best = count;
    }
    const result = [];
    for (const [value, count] of counts)
        if (count === best)
            result.push(value);
    return result.toSorted((a, b) => a - b);
}
/**
 * The `p`-th percentile, `p` in `[0, 100]`, by linear interpolation between
 * closest ranks (R-7: Excel `PERCENTILE.INC`, NumPy default). Equal to
 * `quantile(values, p / 100)`.
 * Throws `EmptyDataError` when empty and `InvalidArgumentError` when `p` is out of range.
 */
export function percentile(values, p) {
    assertFinite(p, 'p');
    if (p < 0 || p > 100)
        throw new InvalidArgumentError(`p must be within [0, 100], got ${p}`);
    return quantileOf(values, p / 100, 'percentile');
}
/**
 * The `q`-th quantile, `q` in `[0, 1]`, with the same R-7 interpolation as
 * `percentile`: `quantile(values, 0.9)` equals `percentile(values, 90)`.
 * Throws `EmptyDataError` when empty and `InvalidArgumentError` when `q` is out of range.
 */
export function quantile(values, q) {
    assertFinite(q, 'q');
    if (q < 0 || q > 1)
        throw new InvalidArgumentError(`q must be within [0, 1], got ${q}`);
    return quantileOf(values, q, 'quantile');
}
function quantileOf(values, q, label) {
    const sorted = sortedCopy(toNumbers(values, 'values'));
    const n = sorted.length;
    if (n === 0)
        throw new EmptyDataError(`${label} of an empty data set`);
    const rank = (n - 1) * q;
    const lower = Math.floor(rank);
    const fraction = rank - lower;
    const low = sorted[lower];
    if (fraction === 0)
        return noNegativeZero(low);
    return noNegativeZero(interpolate(low, sorted[lower + 1], fraction));
}
export function variance(values, options = {}) {
    const ddof = ddofOf(options);
    const items = materialize(values);
    if (isDecimal(items[0]))
        return decimalVariance(decimalsFrom(items), ddof, scaleOptionsOf(options));
    return numberVariance(numbersFrom(items, 'values'), ddof);
}
export function stddev(values, options = {}) {
    const ddof = ddofOf(options);
    const items = materialize(values);
    if (isDecimal(items[0])) {
        const target = scaleOptionsOf(options);
        if (target === undefined)
            throw new InvalidArgumentError('stddev of Decimal values needs { scale, rounding }');
        return decimalStddev(decimalsFrom(items), ddof, target);
    }
    return noNegativeZero(Math.sqrt(numberVariance(numbersFrom(items, 'values'), ddof)));
}
export function minMax(values) {
    const items = materialize(values);
    if (isDecimal(items[0])) {
        const decimals = decimalsFrom(items);
        let low = decimals[0];
        let high = low;
        for (const value of decimals) {
            if (value.lt(low))
                low = value;
            if (value.gt(high))
                high = value;
        }
        return { min: low, max: high };
    }
    const data = numbersFrom(items, 'values');
    if (data.length === 0)
        throw new EmptyDataError('minMax of an empty data set');
    let min = data[0];
    let max = min;
    for (const value of data) {
        if (value < min)
            min = value;
        if (value > max)
            max = value;
    }
    return { min: noNegativeZero(min), max: noNegativeZero(max) };
}
/**
 * Pearson correlation coefficient `r` in `[-1, 1]`.
 * Throws `InvalidArgumentError` for different lengths, fewer than 2 points,
 * or when either side is constant (r is undefined).
 */
export function correlation(x, y) {
    const { xs, ys } = pairs(x, y);
    const { sxx, syy, sxy } = centeredSums(xs, ys);
    if (sxx === 0 || syy === 0)
        throw new InvalidArgumentError('correlation is undefined when x or y is constant');
    const r = sxy / Math.sqrt(sxx) / Math.sqrt(syy);
    return noNegativeZero(Math.min(1, Math.max(-1, r)));
}
/**
 * Ordinary least-squares line `y = slope * x + intercept`.
 * Throws `InvalidArgumentError` for different lengths, fewer than 2 points,
 * or when x is constant (the slope is undefined).
 */
export function linearRegression(x, y) {
    const { xs, ys } = pairs(x, y);
    const { sxx, sxy, meanX, meanY, kx, ky } = centeredSums(xs, ys);
    if (sxx === 0)
        throw new InvalidArgumentError('linear regression is undefined when x is constant');
    const slope = assertRepresentable(((sxy / sxx) * ky) / kx, 'slope');
    const intercept = assertRepresentable(meanY - slope * meanX, 'intercept');
    return { slope: noNegativeZero(slope), intercept: noNegativeZero(intercept) };
}
//# sourceMappingURL=stats.js.map