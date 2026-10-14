/**
 * Roots, logarithms, exponentials and the constants π and e on `Decimal`,
 * to any number of fraction digits up to the package limits.
 *
 * Every result is *correctly rounded*: the returned digits are exactly what
 * you get by rounding the true mathematical value to `scale` fraction digits
 * with the chosen mode. How:
 *
 * - Roots use integer Newton iteration on the scaled coefficient. The integer
 *   root is exact, so one extra "sticky" digit tells whether anything was cut
 *   off, and rounding is exact with no guessing.
 * - Everything else is computed in bigint fixed point with at least
 *   `scale + 10` fraction digits (plus internal headroom for the size of the
 *   result and the error each step adds), so the approximation is within
 *   2 units of its last digit. If rounding both ends of that interval gives
 *   the same answer, that answer is correct. If not, the true value sits
 *   within a hair of a rounding boundary: the guard digits double and the
 *   value is recomputed (Ziv's strategy), up to 2560 guard digits.
 * - Results that can be exact (`ln(1)`, `exp(0)`, `log(8, 2)`, `pow(4, '0.5')`)
 *   are detected exactly, so `rounding: 'unnecessary'` returns them and
 *   throws `RoundingNecessaryError` for everything else.
 *
 * Limits: a result obeys the same cap as every `Decimal` — at most 10 000
 * digits in its coefficient, counting integer digits and the `scale` fraction
 * digits (leading zeros of a value below 1 do not count). So `scale` can reach
 * 10 000 only for results below 1: `exp(-1, { scale: 10000 })` works,
 * `exp(1, { scale: 10000 })` and `PI(10000)` (10 001 digits) throw
 * `ResourceLimitError`, as does `exp(100000, { scale: 10 })`. The guard digits
 * used inside never count against the cap, and a result that surely breaks it
 * is refused before any work. Cost grows faster than linearly with `scale`: about
 * a millisecond at 50 digits, about 10 ms at 1 000, and a few seconds for a
 * logarithm at 10 000.
 */
import type { DecimalInput, ScaleOptions } from './decimal.js';
import { Decimal } from './decimal.js';
/**
 * Square root. Without options the result must be exact or it throws
 * `RoundingNecessaryError`: `sqrt(16)` → `4`, `sqrt('2.25')` → `1.5`,
 * `sqrt(2)` throws. The exact result of a value with scale s has scale s/2,
 * after padding an odd s with one zero: `sqrt('1.00')` → `1.0`,
 * `sqrt('0.0001')` → `0.01`, `sqrt('0.4')` (= √0.40) throws.
 *
 * With `{ scale }`, the correctly rounded value at that scale (default
 * rounding `'halfEven'`): `sqrt(2, { scale: 3, rounding: 'floor' })` → `1.414`.
 * Negative input throws `InvalidArgumentError`.
 */
export declare function sqrt(value: DecimalInput, options?: ScaleOptions): Decimal;
/**
 * Cube root; negative input gives a negative root. Same exact-or-throw rule
 * as `sqrt` (scale s padded up to a multiple of 3, then divided by 3):
 * `cbrt('-27')` → `-3`, `cbrt(2, { scale: 5 })` → `1.25992`.
 */
export declare function cbrt(value: DecimalInput, options?: ScaleOptions): Decimal;
/**
 * The n-th root for a positive safe integer `n`. Same exact-or-throw rule as
 * `sqrt` (scale padded up to a multiple of n, then divided by n):
 * `nthRoot('1024', 10)` → `2`. Even roots of negative values throw
 * `InvalidArgumentError`; odd roots keep the sign. Intermediates are capped at
 * 200 000 digits (`ResourceLimitError`), which bounds `n × scale`.
 */
export declare function nthRoot(value: DecimalInput, n: number, options?: ScaleOptions): Decimal;
/**
 * e^x, correctly rounded to `scale` fraction digits. `exp(0)` is exactly 1;
 * every other result is irrational, so `rounding: 'unnecessary'` throws.
 * Results with more than 10 000 digits (`scale` + integer digits; about
 * x > 23 000 at small scales) throw `ResourceLimitError`. Very negative x
 * rounds to zero (or one unit for `'up'`/`'ceiling'`).
 */
export declare function exp(value: DecimalInput, options: ScaleOptions): Decimal;
/**
 * Natural logarithm, correctly rounded to `scale` fraction digits.
 * `ln(1)` is exactly 0; values ≤ 0 throw `InvalidArgumentError`.
 * `ln 2` and `ln 10` are computed once per precision and reused.
 */
export declare function ln(value: DecimalInput, options: ScaleOptions): Decimal;
/**
 * Logarithm of `value` in `base` (> 0, ≠ 1), correctly rounded to `scale`
 * fraction digits. Exact results are detected — `log(8, 2)` → `3`,
 * `log(8, 4)` → `1.5` — so `rounding: 'unnecessary'` accepts them.
 */
export declare function log(value: DecimalInput, base: DecimalInput, options: ScaleOptions): Decimal;
/** Base-10 logarithm, correctly rounded: `log10(1000, { scale: 5 })` → `3.00000`. */
export declare function log10(value: DecimalInput, options: ScaleOptions): Decimal;
/** Base-2 logarithm, correctly rounded: `log2(1024, { scale: 5 })` → `10.00000`. */
export declare function log2(value: DecimalInput, options: ScaleOptions): Decimal;
/**
 * `base` raised to `exponent`.
 *
 * - Integer exponent: exact, through `Decimal#pow` (`pow(2, 10)` → `1024`,
 *   `0^0` → `1`). With options the result is correctly rounded to `scale`
 *   and the exact power is only an intermediate: a negative exponent divides
 *   with rounding (`pow(3, -1, { scale: 3 })` → `0.333`) instead of throwing,
 *   and `pow('0.5', 20000, { scale: 10 })` → `0.0000000000`. Exponents of any
 *   size work (`pow(1, '1e9999', { scale: 2 })` → `1.00`).
 * - Non-integer exponent: requires options (`InvalidArgumentError` otherwise)
 *   and a base ≥ 0 (`InvalidArgumentError` for negative bases); computed as
 *   exp(exponent · ln(base)) and correctly rounded. `0^positive` is 0. Exact
 *   cases are detected: `pow(4, '0.5', { scale: 2 })` → `2.00`.
 * - Results over 10 000 digits throw `ResourceLimitError` (see the module doc).
 */
export declare function pow(base: DecimalInput, exponent: DecimalInput, options?: ScaleOptions): Decimal;
/** π to `scale` fraction digits, rounded half-even. Machin's formula, cached per precision. */
export declare function PI(scale: number): Decimal;
/** e to `scale` fraction digits, rounded half-even. Σ 1/k!, cached per precision. */
export declare function E(scale: number): Decimal;
//# sourceMappingURL=decimal-math.d.ts.map