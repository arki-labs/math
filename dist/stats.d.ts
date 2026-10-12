/**
 * Descriptive statistics over plain JS numbers, or over `Decimal` values.
 *
 * `mean`, `median`, `minMax`, `variance` and `stddev` follow the element type:
 * plain numbers give a fast, approximate `number`; `Decimal` elements give an
 * exact `Decimal`. `sum` is number-only because an empty input cannot tell
 * which zero to return; use `Decimal.sum` for an exact total. `mode`,
 * `percentile`, `quantile`, `correlation` and `linearRegression` are
 * number-only: interpolation and regression are approximate by nature, so an
 * exact type would promise precision they lack.
 *
 * Every input must be finite; `NaN` and `±Infinity` throw rather than spread.
 * Inputs may be any iterable but are read once and never modified (no in-place
 * sort). Results never carry `-0`.
 */
import type { ScaleOptions } from './decimal.js';
import { Decimal } from './decimal.js';
export type VarianceOptions = {
    /** Delta degrees of freedom: 1 = sample (default), 0 = population. */
    ddof?: 0 | 1;
};
export type MinMax = {
    min: number;
    max: number;
};
export type LinearFit = {
    slope: number;
    intercept: number;
};
/**
 * Total of the values using Neumaier compensated summation. An empty input
 * gives `0`. Numbers only: for an exact total of `Decimal` values use
 * `Decimal.sum`, which returns a `Decimal` zero for an empty input.
 */
export declare function sum(values: Iterable<number>): number;
/** Arithmetic mean (compensated sum divided by the count). Throws `EmptyDataError` when empty. */
export declare function mean(values: Iterable<number>): number;
/**
 * Exact mean of `Decimal` values: the exact sum divided by the count. Like
 * `Decimal.dividedBy`, it throws `RoundingNecessaryError` when the result does
 * not terminate (`[1, 1, 2]`) unless you pass `{ scale, rounding }`.
 */
export declare function mean(values: Iterable<Decimal>, options?: ScaleOptions): Decimal;
/** Middle value; for an even count, the average of the two middle values. Throws `EmptyDataError` when empty. */
export declare function median(values: Iterable<number>): number;
/** Exact median of `Decimal` values; the midpoint of two middles, `(a + b) / 2`, is always exact in decimal. */
export declare function median(values: Iterable<Decimal>): Decimal;
/** Every most-frequent value, ascending. Ties return all tied values; an empty input gives `[]`. */
export declare function mode(values: Iterable<number>): number[];
/**
 * The `p`-th percentile, `p` in `[0, 100]`, by linear interpolation between
 * closest ranks (R-7: Excel `PERCENTILE.INC`, NumPy default). Equal to
 * `quantile(values, p / 100)`.
 * Throws `EmptyDataError` when empty and `InvalidArgumentError` when `p` is out of range.
 */
export declare function percentile(values: Iterable<number>, p: number): number;
/**
 * The `q`-th quantile, `q` in `[0, 1]`, with the same R-7 interpolation as
 * `percentile`: `quantile(values, 0.9)` equals `percentile(values, 90)`.
 * Throws `EmptyDataError` when empty and `InvalidArgumentError` when `q` is out of range.
 */
export declare function quantile(values: Iterable<number>, q: number): number;
/**
 * Variance by Welford's one-pass algorithm. Sample (`ddof: 1`, divide by n - 1)
 * by default; `ddof: 0` gives the population variance (divide by n).
 * Throws `EmptyDataError` unless there are more than `ddof` values.
 */
export declare function variance(values: Iterable<number>, options?: VarianceOptions): number;
/**
 * Exact variance of `Decimal` values, computed as
 * `(n * sum(x^2) - sum(x)^2) / (n * (n - ddof))` with a single division, so
 * nothing is rounded before the end. Like `Decimal.dividedBy`, it throws
 * `RoundingNecessaryError` when the result does not terminate unless you pass
 * `{ scale, rounding }`.
 */
export declare function variance(values: Iterable<Decimal>, options?: VarianceOptions & Partial<ScaleOptions>): Decimal;
/** Square root of `variance`, with the same `ddof` convention (sample by default). */
export declare function stddev(values: Iterable<number>, options?: VarianceOptions): number;
/**
 * Square root of the exact variance, correctly rounded at the requested scale
 * (default rounding `'halfEven'`). A square root rarely terminates, so
 * `{ scale }` is required. The variance is kept as an exact fraction and the
 * root is rounded once, so tiny variances and near-ties round correctly.
 */
export declare function stddev(values: Iterable<Decimal>, options: VarianceOptions & ScaleOptions): Decimal;
/** Smallest and largest value in a single pass. Throws `EmptyDataError` when empty. */
export declare function minMax(values: Iterable<number>): MinMax;
/** Smallest and largest `Decimal` in a single pass. Throws `EmptyDataError` when empty. */
export declare function minMax(values: Iterable<Decimal>): {
    min: Decimal;
    max: Decimal;
};
/**
 * Pearson correlation coefficient `r` in `[-1, 1]`.
 * Throws `InvalidArgumentError` for different lengths, fewer than 2 points,
 * or when either side is constant (r is undefined).
 */
export declare function correlation(x: Iterable<number>, y: Iterable<number>): number;
/**
 * Ordinary least-squares line `y = slope * x + intercept`.
 * Throws `InvalidArgumentError` for different lengths, fewer than 2 points,
 * or when x is constant (the slope is undefined).
 */
export declare function linearRegression(x: Iterable<number>, y: Iterable<number>): LinearFit;
//# sourceMappingURL=stats.d.ts.map