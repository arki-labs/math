/**
 * Real roots of a function of one real variable, `f: (x: number) => number`,
 * on float64.
 *
 * **Methods.**
 * - `findRoot(f, [a, b])` is Brent's method (Brent 1973; netlib `zeroin`, the
 *   algorithm behind SciPy `brentq` and MATLAB `fzero`). It mixes inverse
 *   quadratic interpolation and secant steps with bisection, and keeps the root
 *   bracketed the whole time, so it converges for every continuous `f` that
 *   changes sign on `[a, b]`, usually in a handful of steps, and never much
 *   slower than bisection. Start here.
 * - `bisect(f, [a, b])` halves the bracket every step: slower (one bit per
 *   evaluation), but the simplest guarantee there is.
 * - `newton(f, df, x0)` uses the derivative `df` and converges quadratically
 *   near a simple root. It needs no bracket, and it is the only method here
 *   that can reach a root of even multiplicity (`(x - 1)²` touches zero without
 *   changing sign). Unbracketed, every step is damped: when the full step
 *   `-f(x)/f'(x)` does not reduce `|f|`, it is halved until it does, which tames
 *   the classic overshoots (`atan(x)` from `x0 = 1.5`, `cbrt(x)`). With
 *   `{ bracket }` it is the safeguarded Newton of Numerical Recipes (`rtsafe`):
 *   any step that would leave the bracket, or shrinks it too slowly, becomes a
 *   bisection step, so it converges whenever bisection would.
 * - `findRoots(f, [a, b], { samples })` evaluates `f` on `samples + 1` evenly
 *   spaced points and runs Brent's method on every sub-interval where the sign
 *   changes. It is a scan, not a proof of completeness: it **misses roots of
 *   even multiplicity** (no sign change) and **pairs of roots closer together
 *   than the grid spacing** (their sign changes cancel). Raise `samples` or
 *   narrow the interval when that matters.
 *
 * **Tolerance.** A method stops once its error estimate is at most
 * `absoluteTolerance + relativeTolerance · |root|`. The defaults, `2e-12` and
 * `4 · Number.EPSILON`, are SciPy's `brentq` defaults; pass
 * `absoluteTolerance: 0` to iterate to full float64 precision (Brent's method
 * then stops within a few units in the last place). `maxIterations` (default
 * 200) bounds the number of steps; an iteration is one evaluation of `f` (one
 * of `f` and one of `df` for Newton).
 *
 * **Results.** Every method returns `{ root, errorEstimate, iterations,
 * evaluations }` (`evaluations` counts calls of `f` and `df` together). For
 * the bracketed methods `errorEstimate` is the width of the final sign-change
 * bracket around `root`: a true bound on the distance to a root whenever `f` is
 * continuous. It is `0` when `f(root)` is exactly `0`. For unbracketed Newton
 * it is the length of the last step, an estimate that is usually pessimistic
 * near a simple root but not a bound.
 *
 * **Failures** are typed errors, never `NaN`:
 * - a bracket whose ends have the same sign throws `InvalidArgumentError`
 *   (as does a reversed, empty or non-finite bracket);
 * - `f` (or `df`) returning `NaN` or `±Infinity` throws `NumericRangeError`
 *   naming the point;
 * - no convergence within `maxIterations`, or a Newton step that cannot make
 *   progress (zero derivative, overflow, a local minimum of `|f|` that is not a
 *   root), throws `RootConvergenceError`, a `ConvergenceError` whose `best`
 *   field holds the last iterate and its error estimate.
 *
 * A sign change across a pole looks exactly like a root to every bracketed
 * method: `findRoot(x => Math.tan(x), [1, 2])` converges to `π/2`, where `tan`
 * is unbounded. Check `|f(root)|` when `f` may be discontinuous.
 */
import type { RealFunction } from './internal/calculus.js';
import { ConvergenceError } from './errors.js';
export type { RealFunction } from './internal/calculus.js';
export type RootOptions = {
    /** Absolute part of the stopping tolerance (default `2e-12`). */
    readonly absoluteTolerance?: number;
    /** Relative part of the stopping tolerance, times `|root|` (default `4 · Number.EPSILON`). */
    readonly relativeTolerance?: number;
    /** Most steps before `RootConvergenceError` (default 200). */
    readonly maxIterations?: number;
};
export type NewtonOptions = RootOptions & {
    /** A sign-change bracket containing `x0`; turns on the bisection fallback of `rtsafe`. */
    readonly bracket?: readonly [number, number];
};
export type FindRootsOptions = RootOptions & {
    /** Number of equal sub-intervals scanned for a sign change (default 100). */
    readonly samples?: number;
};
export type RootResult = {
    readonly root: number;
    /** Bracket width for `findRoot`/`bisect` (a bound); last step length for unbracketed `newton` (an estimate). */
    readonly errorEstimate: number;
    readonly iterations: number;
    /** Calls of `f` (plus `df` for Newton), including the bracket ends. */
    readonly evaluations: number;
};
/** A root-finding method stopped before its tolerance; `best` is where it stopped. */
export declare class RootConvergenceError extends ConvergenceError {
    /** The last iterate and its error estimate (`Infinity` when there is none). */
    readonly best: RootResult;
    constructor(message: string, best: RootResult);
}
/**
 * The root of a continuous `f` inside `bracket`, by Brent's method. `f(a)` and
 * `f(b)` must have opposite signs (or one of them be 0). `errorEstimate` is the
 * width of the final bracket, so `root` is within it of a sign change.
 *
 * @example
 * findRoot(x => x ** 3 - 2 * x - 5, [2, 3]).root; // 2.0945514815423265 (Wallis's cubic)
 */
export declare function findRoot(f: RealFunction, bracket: readonly [number, number], options?: RootOptions): RootResult;
/**
 * The root of a continuous `f` inside `bracket`, by bisection. Each step halves
 * the bracket, so reaching a tolerance `t` from width `w` takes
 * `ceil(log2(w / t))` steps; `errorEstimate` bounds the distance to a sign
 * change.
 */
export declare function bisect(f: RealFunction, bracket: readonly [number, number], options?: RootOptions): RootResult;
/**
 * A root of `f` near `x0` by Newton's method, given the derivative `df`.
 * Unbracketed steps are damped (halved until `|f|` decreases); with
 * `{ bracket }` the method falls back to bisection whenever Newton would leave
 * the bracket or stall, and `errorEstimate` is at most the bracket width.
 *
 * @example
 * newton(x => x * x - 2, x => 2 * x, 1).root; // 1.4142135623730951
 */
export declare function newton(f: RealFunction, df: RealFunction, x0: number, options?: NewtonOptions): RootResult;
/**
 * Every root that a sign-change scan of `interval` can see, ascending. `f` is
 * evaluated on `samples + 1` evenly spaced points (default `samples` 100);
 * grid points where `f` is exactly 0 are reported as they are, and each
 * sub-interval whose ends differ in sign is refined by Brent's method. The
 * `iterations`/`evaluations` of each result count only its refinement; the scan
 * itself costs `samples + 1` evaluations.
 *
 * It can miss roots: a root of even multiplicity never changes sign, and two
 * roots inside one sub-interval cancel each other's sign change.
 */
export declare function findRoots(f: RealFunction, interval: readonly [number, number], options?: FindRootsOptions): RootResult[];
//# sourceMappingURL=roots.d.ts.map