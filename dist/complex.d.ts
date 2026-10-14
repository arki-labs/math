/**
 * Complex numbers on plain JS floats (`number`). A `Complex` is an immutable
 * value with finite `re` and `im` parts, and it uses the same verbs as
 * `Decimal`: `plus`, `minus`, `times`, `dividedBy`, `negated`, `abs`, `pow`,
 * `eq`.
 *
 * Results are approximate like any float math, with one rule kept exact:
 * an integer power is computed by repeated multiplication, so
 * `complex(1, 1).pow(2)` is exactly `2i`.
 *
 * There is no `NaN` or `Infinity` channel. Division by zero throws
 * `DivisionByZeroError`; a result too large for a float throws
 * `NumericRangeError`. Results never carry `-0`, so the principal argument
 * is always in `(-π, π]` and `ln(-1)` is `πi`, never `-πi`.
 *
 * Text format: `toString()` prints `3 + 4i`, `3 - 4i`, `-2i`, `i`, `5`.
 * Each part uses JS shortest round-trip number text (`1e-7`, `1e+21`), so
 * `Complex.from(z.toString())` gives back `z` exactly. The parser accepts
 * that format with or without spaces around the middle sign (`3+4i`), and
 * rejects anything else (`i4`, `3 + -4i`, `NaN`, `Infinity`, `3+4j`).
 */
/** Anything `Complex.from` accepts: a `Complex`, a finite number, or text like `'3+4i'`. */
export type ComplexInput = Complex | number | string;
/** Polar form: modulus `r` (≥ 0) and argument `theta` in radians. */
export type Polar = {
    r: number;
    theta: number;
};
/**
 * An immutable complex number `re + im·i` with finite float parts. Create one
 * with `complex(3, 4)`, `complex('3+4i')` or `Complex.fromPolar(r, theta)`.
 * Equality (`eq`) is exact; use `approxEqual` after float arithmetic.
 */
export declare class Complex {
    static readonly ZERO: Complex;
    static readonly ONE: Complex;
    static readonly I: Complex;
    readonly re: number;
    readonly im: number;
    private constructor();
    /** Builds `re + im·i` from finite parts. `-0` becomes `0`. */
    static fromParts(re: number, im: number): Complex;
    /** Converts a number, a `Complex`, or text such as `'3+4i'`, `'-2i'`, `'5'`. */
    static from(value: ComplexInput): Complex;
    /** `r·(cos θ + i·sin θ)`. `r` must be ≥ 0; both must be finite. */
    static fromPolar(r: number, theta: number): Complex;
    plus(other: ComplexInput): Complex;
    minus(other: ComplexInput): Complex;
    times(other: ComplexInput): Complex;
    /** Smith's algorithm, which avoids overflow in `|divisor|²`. Throws on a zero divisor. */
    dividedBy(other: ComplexInput): Complex;
    /** `1 / z`. Throws `DivisionByZeroError` for zero. */
    inverse(): Complex;
    negated(): Complex;
    /** `re - im·i`. */
    conjugate(): Complex;
    /** Modulus `|z|`, via `Math.hypot` so large parts do not overflow. */
    abs(): number;
    /** Principal argument in `(-π, π]`. The argument of zero is `0`, as in C's `carg`. */
    arg(): number;
    toPolar(): Polar;
    /** `e^z`. */
    exp(): Complex;
    /** Principal natural logarithm `ln|z| + i·arg(z)`. Throws `InvalidArgumentError` for zero. */
    ln(): Complex;
    /** Principal logarithm in `base`: `ln(z) / ln(base)`. `base` must not be 0 or 1. */
    log(base: ComplexInput): Complex;
    /** Principal square root: the root with `re > 0`, or `im ≥ 0` when `re` is 0. */
    sqrt(): Complex;
    /**
     * Principal power `z^w = e^(w·ln z)`. An integer `w` uses repeated
     * multiplication (exact for small Gaussian integers); a real `w` uses polar
     * form (`|z|^w` at angle `w·arg z`). `0^w` is `1` for `w = 0` and `0` when
     * `re(w) > 0`; otherwise it throws `DivisionByZeroError`.
     */
    pow(exponent: ComplexInput): Complex;
    private integerPower;
    /**
     * All `n` complex `n`-th roots, counter-clockwise from the principal root
     * (index 0, the one `pow(1/n)` returns). Zero has `n` roots, all zero.
     */
    nthRoots(n: number): Complex[];
    isReal(): boolean;
    isZero(): boolean;
    /** Exact equality of both parts. */
    eq(other: ComplexInput): boolean;
    /**
     * `|z - w| ≤ tolerance × max(1, |z|, |w|)`: absolute near zero, relative
     * for large values, like `approxEqual` for numbers.
     */
    approxEqual(other: ComplexInput, tolerance?: number): boolean;
    /** `3 + 4i`, `3 - 4i`, `-2i`, `i`, `5` (see the module notes for the grammar). */
    toString(): string;
    toJSON(): string;
    /** Throws. A `Complex` never silently becomes a float. */
    valueOf(): never;
    [Symbol.toPrimitive](hint: 'string' | 'number' | 'default'): string;
    readonly [Symbol.toStringTag] = "Complex";
}
/** `complex(3, 4)` is `3 + 4i`; `complex(5)` is real; `complex('3+4i')` parses. */
export declare function complex(re: number, im?: number): Complex;
export declare function complex(value: Complex | string): Complex;
export declare function isComplex(value: unknown): value is Complex;
//# sourceMappingURL=complex.d.ts.map