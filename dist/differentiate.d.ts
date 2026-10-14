/**
 * Numerical derivatives and limits of a function of one real variable,
 * `f: (x: number) => number`, by Richardson extrapolation on float64.
 *
 * Both functions return **numerical estimates with an error estimate**, never
 * proofs. They sample `f` at a shrinking sequence of steps and extrapolate the
 * samples to step 0, assuming `f` is smooth there (a power series in the
 * step). A function that is not, such as `sin(1/x)` near 0, may fail to
 * converge or converge to a wrong value; the error estimate measures how well
 * the samples agree, not what happens between them.
 *
 * - `derivative(f, x)` is Ridders' method (Ridders 1982; Numerical Recipes
 *   `dfridr`): central differences `(f(x + h) − f(x − h)) / 2h` for
 *   `h = step, step/1.4, step/1.4², …` (10 steps), extrapolated in `h²` with a
 *   Neville tableau. It stops early once the error estimate grows, which is
 *   where rounding error starts to dominate. It typically reaches 10–13
 *   correct digits. `step` (default `max(0.1, 0.001 · |x|)`) should be about
 *   the distance over which `f` changes appreciably, not tiny; `f` must be
 *   defined on `[x − step, x + step]`. Complex-step differentiation is not
 *   offered: it needs `f` on complex numbers.
 * - `limit(f, x0)` samples `f(x0 ± h)` for `h = step, step/2, …, step/2¹¹`
 *   (default `step` as above) and extrapolates in powers of `h`. It never
 *   evaluates `f(x0)` itself, so it works where `f` is undefined at `x0`
 *   (`sin(x)/x` at 0). `side` is `'left'`, `'right'` or `'both'` (default):
 *   `'both'` computes both one-sided limits and requires them to agree within
 *   their error estimates, returning their mean. `x0` may be `±Infinity`: the
 *   samples are then `f(±1/h)`, extrapolated in powers of `1/x`, and `side`
 *   must be omitted or name the finite side (`'left'` for `+Infinity`).
 *
 * **Error estimate.** Twice the disagreement between neighbouring entries
 * of the extrapolation tableau, plus a rounding floor (4× the largest rounding
 * noise of one sample: `ε · |f|`, divided by the spacing for a difference
 * quotient). Cancellation inside `f` itself is invisible to the floor and only
 * shows through the tableau.
 *
 * **Tolerance and failures.** An estimate is accepted when `errorEstimate ≤
 * max(absoluteTolerance, relativeTolerance · |value|)`, defaults `1e-10` and
 * `1e-8`. Otherwise `ExtrapolationConvergenceError` (a `ConvergenceError`)
 * is thrown with the best estimate in `best`; so are one-sided limits that
 * disagree. `f` returning `NaN` or `±Infinity` at a sample point throws
 * `NumericRangeError` naming the point; bad arguments throw
 * `InvalidArgumentError`. Results are `{ value, errorEstimate, evaluations }`.
 */
import type { RealFunction } from './internal/calculus.js';
import { ConvergenceError } from './errors.js';
export type { RealFunction } from './internal/calculus.js';
export type ExtrapolationOptions = {
    /** First (largest) sample step (default `max(0.1, 0.001 · |x|)`). */
    readonly step?: number;
    /** Absolute tolerance on the error estimate (default `1e-10`). */
    readonly absoluteTolerance?: number;
    /** Relative tolerance, times `|value|` (default `1e-8`). */
    readonly relativeTolerance?: number;
};
export type LimitSide = 'left' | 'right' | 'both';
export type LimitOptions = ExtrapolationOptions & {
    /** Approach `x0` from below, above, or both (default). */
    readonly side?: LimitSide;
};
export type ExtrapolationResult = {
    readonly value: number;
    /** Estimated absolute error of `value`, from the agreement of the extrapolation tableau. */
    readonly errorEstimate: number;
    /** Calls of `f`. */
    readonly evaluations: number;
};
/** `derivative` or `limit` missed its tolerance; `best` is the best estimate it reached. */
export declare class ExtrapolationConvergenceError extends ConvergenceError {
    /** The best value, its error estimate and the evaluations spent. */
    readonly best: ExtrapolationResult;
    constructor(message: string, best: ExtrapolationResult);
}
/**
 * The derivative `f'(x)`, by Ridders' extrapolation of central differences.
 *
 * @example
 * derivative(Math.exp, 1).value; // 2.718281828459045 (to about 1e-12)
 */
export declare function derivative(f: RealFunction, x: number, options?: ExtrapolationOptions): ExtrapolationResult;
/**
 * `lim f(x)` as `x → x0`, by Richardson extrapolation of `f(x0 ± h)`. A
 * numerical estimate, not a proof that the limit exists.
 *
 * @example
 * limit(x => Math.sin(x) / x, 0).value; // 1
 * limit(x => (1 + 1 / x) ** x, Infinity).value; // 2.718281828… (to about 1e-9)
 */
export declare function limit(f: RealFunction, x0: number, options?: LimitOptions): ExtrapolationResult;
//# sourceMappingURL=differentiate.d.ts.map