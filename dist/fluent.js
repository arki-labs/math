/**
 * Immutable fluent wrapper for ordinary JS numbers, the counterpart of
 * `str()` in `@arki/string`. Arithmetic here is float arithmetic — fast and
 * approximate. Hop to the exact types with `.toDecimal()` / `.toRatio()`
 * when a result must be exact. Extract with `.value()`.
 */
import { DivisionByZeroError, NumericRangeError } from './errors.js';
import { formatCompact, formatCurrency, formatNumber, formatPercent } from './format.js';
import { Decimal, Rational } from './internal/exact.js';
import { approxEqual, assertFinite, clamp, inRange, lerp, remap, round, roundTo } from './number.js';
function finiteResult(value) {
    if (!Number.isFinite(value))
        throw new NumericRangeError('result is too large to represent');
    return value;
}
export class NumberValue {
    #value;
    constructor(value) {
        assertFinite(value, 'value');
        this.#value = value === 0 ? 0 : value;
    }
    // Float arithmetic ---------------------------------------------------------
    plus(other) {
        assertFinite(other, 'other');
        return num(finiteResult(this.#value + other));
    }
    minus(other) {
        assertFinite(other, 'other');
        return num(finiteResult(this.#value - other));
    }
    times(other) {
        assertFinite(other, 'other');
        return num(finiteResult(this.#value * other));
    }
    dividedBy(other) {
        assertFinite(other, 'other');
        if (other === 0)
            throw new DivisionByZeroError('Division by zero');
        return num(finiteResult(this.#value / other));
    }
    abs() {
        return num(Math.abs(this.#value));
    }
    negated() {
        return num(-this.#value);
    }
    // Shaping ------------------------------------------------------------------
    clamp(min, max) {
        return num(clamp(this.#value, min, max));
    }
    lerp(end, t) {
        return num(lerp(this.#value, end, t));
    }
    remap(inStart, inEnd, outStart, outEnd) {
        return num(remap(this.#value, inStart, inEnd, outStart, outEnd));
    }
    round(places, mode) {
        return num(round(this.#value, places, mode));
    }
    roundTo(step, mode) {
        return num(roundTo(this.#value, step, mode));
    }
    // Queries ------------------------------------------------------------------
    inRange(min, max, bounds) {
        return inRange(this.#value, min, max, bounds);
    }
    approxEqual(other, tolerance) {
        return approxEqual(this.#value, other, tolerance);
    }
    isZero() {
        return this.#value === 0;
    }
    isPositive() {
        return this.#value > 0;
    }
    isNegative() {
        return this.#value < 0;
    }
    isInteger() {
        return Number.isInteger(this.#value);
    }
    // Presentation -------------------------------------------------------------
    formatNumber(options) {
        return formatNumber(this.#value, options);
    }
    formatCurrency(currency, options) {
        return formatCurrency(this.#value, currency, options);
    }
    /** The wrapped value is a fraction: `num(0.125).formatPercent()` → `'12.5%'`. */
    formatPercent(options) {
        return formatPercent(this.#value, options);
    }
    formatCompact(options) {
        return formatCompact(this.#value, options);
    }
    // Extraction ---------------------------------------------------------------
    /** Exact decimal of the shortest spelling: `num(0.1).toDecimal()` is exactly 1/10. */
    toDecimal() {
        return Decimal.from(this.#value);
    }
    toRatio() {
        return Rational.from(this.#value);
    }
    value() {
        return this.#value;
    }
    toString() {
        return String(this.#value);
    }
    toJSON() {
        return this.#value;
    }
    /** Throws. Use `.value()`; implicit coercion hides the wrapper's boundary. */
    valueOf() {
        throw new TypeError('A NumberValue cannot be used as a number; call .value()');
    }
    [Symbol.toPrimitive](hint) {
        if (hint === 'string')
            return this.toString();
        throw new TypeError('A NumberValue cannot be used as a number; call .value()');
    }
    /** Console display in Node and Bun: `NumberValue(3)`. */
    [Symbol.for('nodejs.util.inspect.custom')]() {
        return `NumberValue(${this.toString()})`;
    }
    /** Console display in Deno. */
    [Symbol.for('Deno.customInspect')]() {
        return `NumberValue(${this.toString()})`;
    }
    [Symbol.toStringTag] = 'NumberValue';
}
export function num(value) {
    return new NumberValue(value);
}
//# sourceMappingURL=fluent.js.map