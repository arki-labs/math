/**
 * Shared argument checks for the numerical calculus modules (`roots`,
 * `integrate`, `differentiate`). Every user function is called through `call`,
 * so a `NaN` or `±Infinity` from it becomes a typed error that names the point,
 * never a silently wrong result.
 */
import { InvalidArgumentError, NumericRangeError } from '../errors.js';
export function assertFunction(f, name) {
    if (typeof f !== 'function')
        throw new TypeError(`${name} must be a function`);
}
/** `f(x)`, which must be a finite number. */
export function call(f, x, name = 'f') {
    const y = f(x);
    if (typeof y !== 'number')
        throw new TypeError(`${name}(${x}) returned ${typeof y}, expected a number`);
    if (!Number.isFinite(y)) {
        throw new NumericRangeError(`${name}(${x}) is ${y}; the function must be finite at every point it is evaluated`);
    }
    return y;
}
/** A `[lower, upper]` pair of numbers, never `NaN`; infinities only when `allowInfinite`. Order is the caller's rule. */
export function readBounds(bounds, name, allowInfinite) {
    if (!Array.isArray(bounds) || bounds.length !== 2)
        throw new TypeError(`${name} must be a [lower, upper] pair`);
    const [lower, upper] = bounds;
    if (typeof lower !== 'number' || typeof upper !== 'number')
        throw new TypeError(`${name} must hold two numbers`);
    for (const value of [lower, upper]) {
        if (Number.isNaN(value) || (!allowInfinite && !Number.isFinite(value))) {
            throw new InvalidArgumentError(`${name} must hold ${allowInfinite ? 'non-NaN' : 'finite'} numbers, got ${value}`);
        }
    }
    return [lower, upper];
}
/** A finite, non-negative tolerance, or `fallback` when omitted. */
export function readTolerance(value, name, fallback) {
    if (value === undefined)
        return fallback;
    if (typeof value !== 'number')
        throw new TypeError(`${name} must be a number`);
    if (!Number.isFinite(value) || value < 0) {
        throw new InvalidArgumentError(`${name} must be a finite number >= 0, got ${value}`);
    }
    return value;
}
/** A positive safe integer (an iteration or evaluation budget), or `fallback` when omitted. */
export function readCount(value, name, fallback) {
    if (value === undefined)
        return fallback;
    if (typeof value !== 'number')
        throw new TypeError(`${name} must be a number`);
    if (!Number.isSafeInteger(value) || value < 1) {
        throw new InvalidArgumentError(`${name} must be a positive integer, got ${value}`);
    }
    return value;
}
/** A finite, strictly positive number (a step length), or `fallback` when omitted. */
export function readStep(value, name, fallback) {
    if (value === undefined)
        return fallback;
    if (typeof value !== 'number')
        throw new TypeError(`${name} must be a number`);
    if (!Number.isFinite(value) || value <= 0)
        throw new InvalidArgumentError(`${name} must be finite and > 0, got ${value}`);
    return value;
}
/** `+0` for `-0`; every other value unchanged. */
export function noNegativeZero(value) {
    return value === 0 ? 0 : value;
}
//# sourceMappingURL=calculus.js.map