import { ResourceLimitError } from '../errors.js';
/**
 * Resource limits, not precision limits. They stop an untrusted string like
 * `"1e999999999"` from allocating gigabytes before any arithmetic happens.
 */
export const MAX_DIGITS = 10_000;
export const MAX_SCALE = 10_000;
export function assertDigitLimit(digitCount, what) {
    if (digitCount > MAX_DIGITS) {
        throw new ResourceLimitError(`${what} has ${digitCount} digits; the limit is ${MAX_DIGITS}`);
    }
}
export function assertScaleLimit(scale, what) {
    if (!Number.isSafeInteger(scale) || Math.abs(scale) > MAX_SCALE) {
        throw new ResourceLimitError(`${what} ${scale} is outside the supported range ±${MAX_SCALE}`);
    }
}
//# sourceMappingURL=limits.js.map