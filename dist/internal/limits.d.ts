/**
 * Resource limits, not precision limits. They stop an untrusted string like
 * `"1e999999999"` from allocating gigabytes before any arithmetic happens.
 */
export declare const MAX_DIGITS = 10000;
export declare const MAX_SCALE = 10000;
/**
 * Digit cap for plain `bigint` integer results (`factorial`, `combinations`,
 * `permutations`). Decimal and Rational keep the tighter `MAX_DIGITS`: their
 * arithmetic multiplies and rescales, so size costs more there.
 */
export declare const MAX_INTEGER_DIGITS = 100000;
export declare function assertDigitLimit(digitCount: number, what: string): void;
export declare function assertScaleLimit(scale: number, what: string): void;
//# sourceMappingURL=limits.d.ts.map