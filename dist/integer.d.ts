/**
 * Integer and number-theory helpers with matching `number` and `bigint`
 * overloads. Operands must share a type; the `number` forms require safe
 * integers and refuse to return an unsafe one (use `bigint` instead).
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
/**
 * `n!`. The `number` form works up to `n = 18`; above that the result is
 * unsafe and it throws `NumericRangeError`. The `bigint` form is capped at
 * `n = 10_000` (`ResourceLimitError`).
 */
export declare function factorial(n: number): number;
export declare function factorial(n: bigint): bigint;
/**
 * Binomial coefficient C(n, k), the number of ways to choose `k` of `n`.
 * Returns `0` when `k` is outside `0..n`. Uses the multiplicative formula,
 * dividing at every step so values stay integral. The `bigint` form allows
 * at most 10_000 steps (`ResourceLimitError`).
 */
export declare function combinations(n: number, k: number): number;
export declare function combinations(n: bigint, k: bigint): bigint;
/**
 * Ordered selections P(n, k) = n! / (n − k)!. Returns `0` when `k` is
 * outside `0..n`. The `bigint` form allows at most 10_000 terms.
 */
export declare function permutations(n: number, k: number): number;
export declare function permutations(n: bigint, k: bigint): bigint;
/**
 * `base ** exponent mod modulus`, in `[0, modulus)`. Requires
 * `exponent >= 0` and `modulus > 0`. Square-and-multiply.
 */
export declare function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint;
/**
 * Modular inverse of `a` mod `modulus` in `[0, modulus)`, by extended
 * Euclid. Throws `InvalidArgumentError` when `gcd(a, modulus) !== 1`.
 */
export declare function modInverse(a: bigint, modulus: bigint): bigint;
/**
 * Exact primality test by Miller–Rabin with a fixed base set that is
 * deterministic for every `n < 2^64`. Values below 2 are not prime. At or
 * above 2^64 it throws `NumericRangeError` rather than guess.
 */
export declare function isPrime(n: number): boolean;
export declare function isPrime(n: bigint): boolean;
/**
 * Prime factors in ascending order, with multiplicity: `360` gives
 * `[2, 2, 2, 3, 3, 5]`. Values below 2 give `[]`; negatives throw
 * `InvalidArgumentError`. Trial division by 2, 3 and `6k ± 1` up to 1e6,
 * then Pollard's rho (Brent) with Miller–Rabin. Throws `NumericRangeError`
 * for `n >= 2^64`.
 */
export declare function primeFactors(n: number): number[];
export declare function primeFactors(n: bigint): bigint[];
/**
 * All positive divisors in ascending order: `divisors(28)` is
 * `[1, 2, 4, 7, 14, 28]`. Requires `n >= 1`. Built from the prime
 * factorization, so `bigint` input is limited to `n < 2^64`.
 */
export declare function divisors(n: number): number[];
export declare function divisors(n: bigint): bigint[];
/** True when `n` is divisible by 2. Zero is even. */
export declare function isEven(n: number | bigint): boolean;
/** True when `n` is not divisible by 2. Negative odd numbers are odd. */
export declare function isOdd(n: number | bigint): boolean;
/** Sum of the decimal digits of `|n|`: `digitSum(-123)` is `6`. */
export declare function digitSum(n: number | bigint): number;
/**
 * The n-th Fibonacci number (`F(0) = 0`, `F(1) = 1`) by fast doubling.
 * Always returns a `bigint`. `n` must be a non-negative safe integer at most
 * 100_000 (`ResourceLimitError` above).
 */
export declare function fibonacci(n: number): bigint;
//# sourceMappingURL=integer.d.ts.map