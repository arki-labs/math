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
 * Trigonometric and hyperbolic functions — `sin`, `cos`, `tan`, `sinh`,
 * `cosh`, `tanh` and their inverses — follow C99 Annex G and W. Kahan,
 * "Branch Cuts for Complex Elementary Functions, or Much Ado About Nothing's
 * Sign Bit" (1987). The inverses return principal values, with these cuts:
 *
 * - `asin`, `acos`, `atanh`: the real axis outside [-1, 1] (`atanh(±1)` is a pole)
 * - `atan`, `asinh`: the imaginary axis outside [-i, i] (`atan(±i)` is a pole)
 * - `acosh`: the real axis left of 1
 *
 * C99 picks the side of a cut from the sign of a zero part. With no `-0`, a
 * point ON a cut takes Kahan's counter-clockwise continuity: the limit met
 * while circling the cut's branch point counter-clockwise — the rule `sqrt`
 * and `ln` already follow (`ln(-1)` is `πi`). So `asin(2)` is
 * `π/2 - 1.3170i` (from below), `asin(-2)` is `-π/2 + 1.3170i` (from above),
 * `atan(2i)` is `π/2 + 0.5493i` (from the right) and `acosh(-2)` is
 * `1.3170 + πi`. This matches Mathematica, mpmath and Common Lisp, and keeps
 * the odd functions odd on their cuts. C, NumPy and Python's `cmath` read a
 * zero part as `+0`, so they differ on half of the cuts: `asin`, `acos` and
 * `atanh` right of 1, `atan` and `asinh` below `-i`. Off the cuts
 * `f(conj z) = conj f(z)`; on a cut `conj z` is `z`, so it cannot hold there.
 * Poles throw `InvalidArgumentError`, like `ln(0)`.
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
 * A complex number `re + im·i` with finite float parts. Create one with
 * `complex(3, 4)`, `complex('3+4i')` or `Complex.fromPolar(r, theta)`.
 * Equality (`eq`) is exact; use `approxEqual` after float arithmetic.
 *
 * Immutable: methods never modify their operands and the fields are `readonly`.
 * Instances are not frozen — `Object.freeze` per result cost 5–7× in hot loops,
 * and no peer library (decimal.js, big.js, fraction.js, complex.js) freezes —
 * but the shared constants arithmetic can return are frozen.
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
    /**
     * Robust complex division (Baudin & Smith 2012, "A Robust Complex Division
     * in Scilab"): Smith's algorithm, which avoids overflow in `|divisor|²`,
     * plus exact power-of-two scaling when a part is near overflow or underflow,
     * so `(1e308 + 1e308i) / (1e308 + 1e308i)` is `1`. Throws on a zero divisor,
     * and `NumericRangeError` only when the quotient itself is out of range.
     */
    dividedBy(other: ComplexInput): Complex;
    /** `1 / z`. Throws `DivisionByZeroError` for zero. */
    inverse(): Complex;
    negated(): Complex;
    /** `re - im·i`. */
    conjugate(): Complex;
    /**
     * Modulus `|z|`, via `Math.hypot` so large parts do not overflow. Throws
     * `NumericRangeError` when `|z|` itself is beyond the float range, which
     * finite parts allow (up to √2 × `Number.MAX_VALUE`, as for `1e308 + 1e308i`).
     */
    abs(): number;
    /** Principal argument in `(-π, π]`. The argument of zero is `0`, as in C's `carg`. */
    arg(): number;
    /** `{ r: abs(), theta: arg() }`; throws `NumericRangeError` where `abs` does. */
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
    /** sin(x + iy) = sin x cosh y + i cos x sinh y; overflows (`NumericRangeError`) only when the result does. */
    sin(): Complex;
    /** cos(x + iy) = cos x cosh y − i sin x sinh y. */
    cos(): Complex;
    /** tan z = −i·tanh(iz), by Kahan's cancellation-free formula; never overflows. */
    tan(): Complex;
    /** sinh z = −i·sin(iz) = sinh x cos y + i cosh x sin y. */
    sinh(): Complex;
    /** cosh z = cos(iz) = cosh x cos y + i sinh x sin y. */
    cosh(): Complex;
    /** tanh z by Kahan's formula: (βρs + it) / (1 + βs²) with t = tan y, β = 1 + t², s = sinh x, ρ = √(1 + s²). */
    tanh(): Complex;
    /**
     * Principal arcsine, real part in [-π/2, π/2]. Cuts: the real axis outside
     * [-1, 1]; `asin(2)` is `π/2 - 1.3170i`, `asin(-2)` is `-π/2 + 1.3170i`.
     */
    asin(): Complex;
    /**
     * Principal arccosine, real part in [0, π]; `acos z = π/2 − asin z`, same
     * cuts. `acos(2)` is `1.3170i`, `acos(-2)` is `π - 1.3170i`.
     */
    acos(): Complex;
    /**
     * Principal arctangent, real part in [-π/2, π/2]; `atan z = −i·atanh(iz)`.
     * Cuts: the imaginary axis outside [-i, i]; `atan(2i)` is `π/2 + 0.5493i`,
     * `atan(-2i)` is `-π/2 - 0.5493i`. `atan(±i)` throws `InvalidArgumentError`.
     */
    atan(): Complex;
    /**
     * Principal inverse hyperbolic sine, `asinh z = −i·asin(iz)`. Cuts: the
     * imaginary axis outside [-i, i]; `asinh(2i)` is `1.3170 + π/2·i`.
     */
    asinh(): Complex;
    /**
     * Principal inverse hyperbolic cosine, real part ≥ 0 and imaginary part in
     * [-π, π]. Cut: the real axis left of 1, valued from above: `acosh(0.5)` is
     * `1.0472i`, `acosh(-2)` is `1.3170 + πi`.
     */
    acosh(): Complex;
    /**
     * Principal inverse hyperbolic tangent, imaginary part in [-π/2, π/2]. Cuts:
     * the real axis outside [-1, 1]; `atanh(2)` is `0.5493 - π/2·i`,
     * `atanh(-2)` is `-0.5493 + π/2·i`. `atanh(±1)` throws `InvalidArgumentError`.
     */
    atanh(): Complex;
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