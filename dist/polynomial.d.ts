/**
 * Polynomials over plain JS floats, stored as coefficient arrays.
 *
 * Order: highest degree first, so the array reads like the written
 * polynomial — `[1, -6, 11, -6]` is `x³ - 6x² + 11x - 6`. This is the order
 * of MATLAB `polyval`/`roots` and NumPy `polyval`/`roots`, and it matches the
 * argument order of `quadraticRoots(a, b, c)` and `cubicRoots(a, b, c, d)`,
 * so one convention holds across the module.
 *
 * Inputs may carry leading zeros (`[0, 1, 2]` is `x + 2`); results never do.
 * The zero polynomial is `[0]`. Every coefficient must be finite. Inputs are
 * never modified, and results never carry `-0`.
 *
 * Root finders return a tagged result so callers know at compile time whether
 * they got real numbers or `Complex` values: check `kind` first.
 */
import { Complex } from './complex.js';
/** Coefficients, highest degree first. */
export type Coefficients = readonly number[];
/**
 * Two real roots in ascending order (a double root is listed twice), or a
 * conjugate pair (positive imaginary part first). `discriminant` is `b² - 4ac`;
 * its sign is what chose `kind` (`>= 0` real, `< 0` complex).
 */
export type QuadraticRoots = {
    readonly kind: 'real';
    readonly roots: readonly [number, number];
    readonly discriminant: number;
} | {
    readonly kind: 'complex';
    readonly roots: readonly [Complex, Complex];
    readonly discriminant: number;
};
/**
 * Three real roots in ascending order (repeated roots listed by multiplicity),
 * or one real root plus a conjugate pair (positive imaginary part first).
 */
export type CubicRoots = {
    readonly kind: 'real';
    readonly roots: readonly [number, number, number];
} | {
    readonly kind: 'mixed';
    readonly real: number;
    readonly complex: readonly [Complex, Complex];
};
/**
 * The value at `x` by Horner's rule (one multiply and one add per
 * coefficient). A `Complex` point gives a `Complex` value.
 */
export declare function evaluatePolynomial(coefficients: Coefficients, x: number): number;
export declare function evaluatePolynomial(coefficients: Coefficients, x: Complex): Complex;
/** The derivative. A constant's derivative is `[0]`. */
export declare function polynomialDerivative(coefficients: Coefficients): number[];
/** The sum `p + q`. */
export declare function addPolynomials(p: Coefficients, q: Coefficients): number[];
/** The product `p × q` (coefficient convolution). */
export declare function multiplyPolynomials(p: Coefficients, q: Coefficients): number[];
/**
 * Roots of `ax² + bx + c` (`a ≠ 0`). Uses `q = -(b + sign(b)·√D) / 2`,
 * then `q / a` and `c / q`, so neither root suffers cancellation — the small
 * root of `x² - 1e8·x + 1` comes out to full precision. The discriminant is
 * computed with exact products, so near-double roots stay accurate: for
 * Kahan's `94906265.625x² - 189812534x + 94906268.375` it is the exact `7.5625`
 * where the plain float formula gives `0` (a false double root).
 *
 * The returned `discriminant` is that same value, and its sign decides `kind`.
 * It is formed on the coefficients rescaled by a power of two (exact), so the
 * decision is right even when `b² - 4ac` itself is out of range; only then does
 * the reported value overflow to `±Infinity` or underflow to `0`.
 */
export declare function quadraticRoots(a: number, b: number, c: number): QuadraticRoots;
/**
 * Roots of `ax³ + bx² + cx + d` (`a ≠ 0`).
 *
 * The case is chosen by the sign of the discriminant formed from the
 * original coefficients (exact for moderate integer coefficients), not from
 * the shifted cubic, so `x³ - 4x² + 5x - 2` is recognised as a double root.
 * Three distinct real roots use the trigonometric method (no complex cube
 * roots); one real root uses Cardano's formula in its cancellation-free form.
 * Real roots are then polished with Newton steps.
 */
export declare function cubicRoots(a: number, b: number, c: number, d: number): CubicRoots;
/**
 * All roots of a polynomial of any degree, as `Complex` values listed by
 * multiplicity and sorted by real part, then imaginary part.
 *
 * Zero roots are factored out exactly; degree 1–3 use the closed forms above.
 * Degree 4 and up use the Aberth–Ehrlich iteration, which refines all roots
 * at once. Each root stops once `|p(z)|` is within the rounding noise of
 * evaluating `p` at `z`, so it is as accurate as the polynomial's
 * conditioning allows: simple roots to near full precision, a root of
 * multiplicity m to about 16/m digits. A real or imaginary part below
 * `1e-14 × |z|` is set to exactly 0, so real roots report `isReal()`.
 *
 * A constant has no roots (`[]`); the zero polynomial throws, because every
 * number is a root.
 */
export declare function polynomialRoots(coefficients: Coefficients): Complex[];
//# sourceMappingURL=polynomial.d.ts.map