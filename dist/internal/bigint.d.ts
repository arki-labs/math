import type { RoundingMode } from '../rounding.js';
export declare function abs(n: bigint): bigint;
export declare function sign(n: bigint): -1 | 0 | 1;
export declare function pow10(exponent: number): bigint;
/** Number of decimal digits in |n|; zero has one digit. */
export declare function digitCount(n: bigint): number;
/**
 * `a × b`, refused with `ResourceLimitError` before it is built when the operand digits add up
 * past `MAX_INTEGER_DIGITS` (Hermes allocates by operand size, so it fails even for a small result).
 */
export declare function multiplyChecked(a: bigint, b: bigint, what: string): bigint;
/** `value × 10^exponent` (exponent ≥ 0), refused before it is built when it would pass `MAX_INTEGER_DIGITS`. */
export declare function timesPow10(value: bigint, exponent: number, what: string): bigint;
export declare function gcd(a: bigint, b: bigint): bigint;
/** Floor division (toward −∞), like Python's `//`. */
export declare function floorDiv(a: bigint, b: bigint): bigint;
/** Splits `n` into `[rest, count]` where `n = rest * factor^count`. */
export declare function stripFactor(n: bigint, factor: bigint): [rest: bigint, count: number];
/**
 * The one place rounding happens. Returns `numerator / denominator` as an
 * integer, rounded with `mode`. Every rounding helper in the package reduces
 * its problem to this call.
 */
export declare function divideRounded(numerator: bigint, denominator: bigint, mode: RoundingMode): bigint;
//# sourceMappingURL=bigint.d.ts.map