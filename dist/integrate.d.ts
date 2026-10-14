/**
 * Definite integrals of a function of one real variable,
 * `f: (x: number) => number`, over finite or infinite intervals, on float64.
 *
 * **Methods.** `integrate(f, [a, b])` picks one with `{ method }`:
 * - `'gaussKronrod'` (the default) is globally adaptive Gauss–Kronrod
 *   quadrature with the 7-point Gauss / 15-point Kronrod pair, as in QUADPACK
 *   `qag`/`qagi` (Piessens et al. 1983; SciPy `quad`). Each sub-interval gets a
 *   15-point estimate and an error estimate from its difference to the
 *   embedded 7-point Gauss rule; the sub-interval with the largest error is
 *   bisected next (a priority queue), until the summed error estimate meets the
 *   tolerance. The error estimate is QUADPACK's
 *   `resasc · min(1, (200 · |K15 − G7| / resasc)^1.5)`, floored at
 *   `50 · ε · ∫|f|`: deliberately pessimistic for smooth integrands. There is
 *   no Wynn epsilon extrapolation (`qags`), so integrable endpoint
 *   singularities converge by brute subdivision; prefer `'tanhSinh'` for them.
 *   Best for smooth, oscillatory or piecewise-smooth integrands; split `[a, b]`
 *   at known interior kinks or jumps.
 * - `'tanhSinh'` is double-exponential quadrature (Takahasi & Mori 1974; Boost
 *   `tanh_sinh`, mpmath `quad`): the substitution `x = c + h·tanh(π/2·sinh t)`
 *   makes the integrand decay double-exponentially, so the trapezoidal rule in
 *   `t` converges very fast even with integrable endpoint singularities such as
 *   `x^(−1/2)` or `log x`. The step in `t` is halved per level (reusing every
 *   point) and the error estimate is the change between the last two levels,
 *   plus the size of the outermost terms (the truncated tails) and a rounding
 *   term `ε · ∫|f|`; at least four levels run before it may stop. It is poor
 *   for oscillatory integrands and for singularities inside `(a, b)`. The
 *   nodes are computed from their distance to the nearer endpoint, so they get
 *   within about `1e-308` of an endpoint at `0` but only within one unit in the
 *   last place of any other endpoint: put a singularity at `0` (substitute
 *   `u = x − a`) for full accuracy. A singularity anywhere else shows up as a
 *   large error estimate, never as a silently wrong value.
 *
 * **Infinite intervals.** `±Infinity` bounds are allowed (`[-Infinity,
 * Infinity]` too); the integrand must decay fast enough to be integrable.
 * Gauss–Kronrod maps them onto `(0, 1]` as QUADPACK `qagi` does:
 * `∫_a^∞ f(x) dx = ∫_0^1 f(a + (1 − t)/t) / t² dt`, with `f(b − u)` for
 * `(−∞, b]` and `f(u) + f(−u)` for the whole line. Tanh-sinh uses its own
 * double-exponential maps instead: `x = a + exp(π/2·sinh t)` (exp-sinh) for a
 * half line and `x = sinh(π/2·sinh t)` (sinh-sinh) for the whole line.
 *
 * **Tolerance.** Converged means `errorEstimate ≤ max(absoluteTolerance,
 * relativeTolerance · |value|)`; the defaults are `1e-12` and `1e-10`, and
 * they cannot both be 0. `maxEvaluations` (default 20,000) bounds the calls of
 * `f`; at least one 15-point rule, or four tanh-sinh levels, always run. The
 * error estimate is an estimate, not a bound: no method that only samples `f`
 * can bound the error of an arbitrary function (a narrow spike between the
 * sample points is invisible), but on the test suite it is never smaller than
 * the actual error.
 *
 * **Results and failures.** `integrate` returns `{ value, errorEstimate,
 * evaluations }`. Reversed bounds give the negated integral
 * (`∫_b^a = −∫_a^b`); equal finite bounds give exactly 0 without calling `f`.
 * Failures are typed errors, never `NaN`:
 * - `f` returning `NaN` or `±Infinity` at a sample point throws
 *   `NumericRangeError` naming the point (a non-integrable singularity usually
 *   ends this way), as does a sum that overflows;
 * - missing the tolerance within `maxEvaluations`, or a Gauss–Kronrod
 *   sub-interval too narrow to bisect, throws `IntegrationConvergenceError`, a
 *   `ConvergenceError` whose `best` field holds the best value and error
 *   estimate reached, so a caller that can live with less accuracy can still
 *   use it on purpose;
 * - `NaN` bounds, equal infinite bounds or bad options throw
 *   `InvalidArgumentError`.
 */
import type { RealFunction } from './internal/calculus.js';
import { ConvergenceError } from './errors.js';
export type { RealFunction } from './internal/calculus.js';
export type IntegrationMethod = 'gaussKronrod' | 'tanhSinh';
export type IntegrateOptions = {
    /** `'gaussKronrod'` (default, adaptive G7–K15) or `'tanhSinh'` (double-exponential, for endpoint singularities). */
    readonly method?: IntegrationMethod;
    /** Absolute tolerance on the error estimate (default `1e-12`). */
    readonly absoluteTolerance?: number;
    /** Relative tolerance, times `|value|` (default `1e-10`). */
    readonly relativeTolerance?: number;
    /** Most calls of `f` before `IntegrationConvergenceError` (default 20,000). */
    readonly maxEvaluations?: number;
};
export type IntegrationResult = {
    readonly value: number;
    /** Estimated absolute error of `value`. */
    readonly errorEstimate: number;
    /** Calls of `f`. */
    readonly evaluations: number;
};
/** `integrate` missed its tolerance; `best` is the best estimate it reached. */
export declare class IntegrationConvergenceError extends ConvergenceError {
    /** The best value, its error estimate and the evaluations spent (sign already applied for reversed bounds). */
    readonly best: IntegrationResult;
    constructor(message: string, best: IntegrationResult);
}
/**
 * `∫ f(x) dx` from `bounds[0]` to `bounds[1]`, with an error estimate. Either
 * bound may be infinite. See the module docs for the methods, the tolerance and
 * the failure policy.
 *
 * @example
 * integrate(Math.sin, [0, Math.PI]).value; // 2
 * integrate(x => 1 / Math.sqrt(x), [0, 1], { method: 'tanhSinh' }).value; // 2
 * integrate(x => Math.exp(-x * x), [0, Infinity]).value; // 0.886226925452758 (√π/2)
 */
export declare function integrate(f: RealFunction, bounds: readonly [number, number], options?: IntegrateOptions): IntegrationResult;
//# sourceMappingURL=integrate.d.ts.map