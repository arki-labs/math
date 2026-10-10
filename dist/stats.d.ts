/**
 * Descriptive statistics over plain JS numbers.
 *
 * Every input must be finite; `NaN` and `±Infinity` throw rather than spread.
 * Inputs may be any iterable but are read once and never modified (no in-place
 * sort). Results never carry `-0`.
 */
export type VarianceOptions = {
    /** Delta degrees of freedom: 1 = sample (default), 0 = population. */
    ddof?: 0 | 1;
};
/** @deprecated Renamed to `VarianceOptions`. */
export type SpreadOptions = VarianceOptions;
export type MinMax = {
    min: number;
    max: number;
};
export type LinearFit = {
    slope: number;
    intercept: number;
};
/** Total of the values using Neumaier compensated summation. An empty input gives `0`. */
export declare function sum(values: Iterable<number>): number;
/** Arithmetic mean (compensated sum divided by the count). Throws `EmptyDataError` when empty. */
export declare function mean(values: Iterable<number>): number;
/** Middle value; for an even count, the average of the two middle values. Throws `EmptyDataError` when empty. */
export declare function median(values: Iterable<number>): number;
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
/** Square root of `variance`, with the same `ddof` convention (sample by default). */
export declare function stddev(values: Iterable<number>, options?: VarianceOptions): number;
/** Smallest and largest value in a single pass. Throws `EmptyDataError` when empty. */
export declare function minMax(values: Iterable<number>): MinMax;
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