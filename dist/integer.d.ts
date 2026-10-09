/**
 * Integer helpers with matching `number` and `bigint` overloads. Both
 * arguments must share a type; the `number` forms require safe integers and
 * refuse to return an unsafe one.
 */
/** Greatest common divisor, always non-negative. `gcd(0, 0)` is `0`. */
export declare function gcd(a: number, b: number): number;
export declare function gcd(a: bigint, b: bigint): bigint;
/** Least common multiple, always non-negative. Zero in → zero out. */
export declare function lcm(a: number, b: number): number;
export declare function lcm(a: bigint, b: bigint): bigint;
/**
 * Floor division and remainder, like Python's `divmod`: the quotient rounds
 * toward −∞ and the remainder takes the sign of the divisor, so
 * `divmod(-7, 2)` is `[-4, 1]` and `divmod(7, -2)` is `[-4, -1]`.
 */
export declare function divmod(a: number, b: number): [quotient: number, remainder: number];
export declare function divmod(a: bigint, b: bigint): [quotient: bigint, remainder: bigint];
//# sourceMappingURL=integer.d.ts.map