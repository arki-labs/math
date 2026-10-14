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
/**
 * `y = intercept + slope * x`, with the usual least-squares diagnostics. They use
 * n - 2 residual degrees of freedom (n - k - 1 with k = 1 predictor) and are
 * `undefined` for exactly two points, where no residual freedom is left.
 */
export type LinearFit = Fit & FitDiagnostics & {
    slope: number;
    intercept: number;
    /** Standard error of the slope: `residualStandardError / sqrt(sum((x - mean x)^2))`. */
    slopeStandardError: number | undefined;
    /** Standard error of the intercept: `residualStandardError * sqrt(1/n + mean(x)^2 / sum((x - mean x)^2))`. */
    interceptStandardError: number | undefined;
};
/**
 * Hyndman & Fan's nine sample-quantile definitions (Amer. Statistician 50(4), 1996),
 * by NumPy's names; R's `quantile(x, type = k)` is the R-k column.
 *
 * | method                     | R   | also known as                                        |
 * | -------------------------- | --- | ---------------------------------------------------- |
 * | `'inverseCdf'`             | R-1 | nearest-rank method, SAS 3                           |
 * | `'averagedInverseCdf'`     | R-2 | SAS 5; averages at the jumps (the median rule)       |
 * | `'closestObservation'`     | R-3 | SAS 2; nearest order statistic, ties to the even one |
 * | `'interpolatedInverseCdf'` | R-4 | SAS 1; linear in the empirical CDF                   |
 * | `'hazen'`                  | R-5 | piecewise linear through the midpoints               |
 * | `'weibull'`                | R-6 | Excel `PERCENTILE.EXC` / `QUARTILE.EXC`, Minitab, SPSS |
 * | `'linear'` (default)       | R-7 | Excel `PERCENTILE.INC`, NumPy and R default          |
 * | `'medianUnbiased'`         | R-8 | Hyndman & Fan's recommendation                       |
 * | `'normalUnbiased'`         | R-9 | Blom; unbiased for normal data                       |
 *
 * R-1 to R-3 always return a data value; R-4 to R-9 interpolate. Positions
 * outside the data clamp to the smallest or largest value (so R-6's `q = 0.01`
 * of ten values is the minimum, where Excel's `PERCENTILE.EXC` errors).
 */
export declare const QUANTILE_METHODS: readonly ['inverseCdf', 'averagedInverseCdf', 'closestObservation', 'interpolatedInverseCdf', 'hazen', 'weibull', 'linear', 'medianUnbiased', 'normalUnbiased'];
export type QuantileMethod = (typeof QUANTILE_METHODS)[number];
export type QuantileOptions = {
    /** Sample-quantile definition; default `'linear'` (R-7). */
    method?: QuantileMethod;
};
/**
 * A quantile method, or one of the two "median of each half" rules. They differ
 * only for an odd count, in where the middle value goes:
 * - `'tukey'`: Tukey's hinges; the median belongs to BOTH halves (R `fivenum`,
 *   `boxplot.stats`; Wikipedia's "Method 2").
 * - `'medianExcluded'`: the median belongs to NEITHER half (TI-83/TI-84
 *   `1-Var Stats`, Moore & McCabe; Wikipedia's "Method 1").
 *
 * For 6, 7, 15, 36, 39, 40, 41, 42, 43, 47, 49: `'medianExcluded'` gives Q1 = 15,
 * Q3 = 43; `'tukey'` gives Q1 = 25.5, Q3 = 42.5.
 */
export type QuartileMethod = QuantileMethod | 'tukey' | 'medianExcluded';
export type QuartileOptions = {
    /** Default `'linear'` (R-7), like `quantile`. */
    method?: QuartileMethod;
};
export type Quartiles = {
    /** First quartile (or lower hinge). */
    q1: number;
    /** The median. */
    q2: number;
    /** Third quartile (or upper hinge). */
    q3: number;
};
/**
 * How `percentileRank` counts values equal to the score (the `kind` of SciPy's
 * `percentileofscore`); with B values below and E equal, out of N:
 * - `'strict'`: B / N, the share strictly below.
 * - `'weak'`: (B + E) / N, the share at or below (the empirical CDF).
 * - `'mean'` (default): (B + E / 2) / N, the textbook percentile rank: half of the ties count as below.
 * - `'rank'`: SciPy's default, the average of the ranks the ties would take: (B + (E + 1) / 2) / N when E > 0, else B / N.
 */
export type PercentileRankKind = 'strict' | 'weak' | 'mean' | 'rank';
export type PercentileRankOptions = {
    kind?: PercentileRankKind;
};
/** Confidence-interval method: `'z'` (normal critical value) or `'t'` (Student's t, for estimated spread). */
export type IntervalMethod = 'z' | 't';
export type ConfidenceIntervalOptions = VarianceOptions & {
    /** Confidence level in (0, 1). Default 0.95. */
    level?: number;
    /** Default `'t'` with `n - 1` degrees of freedom. */
    method?: IntervalMethod;
};
export type ConfidenceInterval = {
    mean: number;
    lower: number;
    upper: number;
    marginOfError: number;
    level: number;
};
/**
 * A group known only by its size and SAMPLE spread (ddof 1): `{ n, stddev }` or
 * `{ n, variance }`. Accepted by `pooledVariance` and `pooledStddev`.
 */
export type SampleSummary = {
    n: number;
    stddev: number;
    variance?: never;
} | {
    n: number;
    variance: number;
    stddev?: never;
};
export type MarginOfErrorInput = {
    /** Standard deviation of the data (sample, unless you know the population value). */
    stddev: number;
    /** Number of observations. */
    n: number;
    level?: number;
    method?: IntervalMethod;
};
/** Sample size for estimating a mean to within `marginOfError`, given the spread `stddev`. */
export type MeanSampleSizeInput = {
    marginOfError: number;
    stddev: number;
    level?: number;
    proportion?: never;
};
/** Sample size for estimating a proportion; `proportion` defaults to 0.5, the worst case. */
export type ProportionSampleSizeInput = {
    marginOfError: number;
    proportion?: number;
    level?: number;
    stddev?: never;
};
/** A fitted curve: its fit quality and a function to evaluate it. */
type Fit = {
    /** Coefficient of determination `1 - SSres / SStot`, measured on the original y values. */
    r2: number;
    predict(x: number): number;
};
/**
 * Least-squares diagnostics with k predictors and n points, on df = n - k - 1
 * residual degrees of freedom. Both are `undefined` when df is 0 (the fit
 * passes through every point, so the scatter around it cannot be estimated).
 */
type FitDiagnostics = {
    /** `1 - (1 - r2) * (n - 1) / (n - k - 1)`: r2 penalised for the number of predictors. */
    adjustedR2: number | undefined;
    /** Standard error of the estimate (R's "residual standard error", Excel `STEYX`): `sqrt(SSres / (n - k - 1))`. */
    residualStandardError: number | undefined;
};
/** `y = a * e^(b * x)`. */
export type ExponentialFit = Fit & {
    a: number;
    b: number;
};
/** `y = a + b * ln(x)`. */
export type LogarithmicFit = Fit & {
    a: number;
    b: number;
};
/** `y = a * x^b`. */
export type PowerFit = Fit & {
    a: number;
    b: number;
};
/**
 * `y = c[0] + c[1] * x + c[2] * x^2 + ...`, lowest degree first. Diagnostics use
 * k = degree predictors, so n - degree - 1 residual degrees of freedom.
 */
export type PolynomialFit = Fit & FitDiagnostics & {
    coefficients: readonly number[];
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
 * The `p`-th percentile, `p` in `[0, 100]`. By default linear interpolation
 * between closest ranks (R-7: Excel `PERCENTILE.INC`, NumPy default); pass
 * `{ method }` for any other Hyndman–Fan definition (see `QUANTILE_METHODS`).
 * Equal to `quantile(values, p / 100, options)`.
 * Throws `EmptyDataError` when empty and `InvalidArgumentError` when `p` is out of range.
 */
export declare function percentile(values: Iterable<number>, p: number, options?: QuantileOptions): number;
/**
 * The `q`-th quantile, `q` in `[0, 1]`, with the same methods as `percentile`
 * (default R-7): `quantile(values, 0.9)` equals `percentile(values, 90)`.
 * Throws `EmptyDataError` when empty and `InvalidArgumentError` when `q` is out of range.
 */
export declare function quantile(values: Iterable<number>, q: number, options?: QuantileOptions): number;
/**
 * The three quartiles in one sort. `method` is any `quantile` method (default
 * `'linear'`, R-7), or a "median of each half" rule (see `QuartileMethod`):
 * `'tukey'` (the box-plot hinges of R's `fivenum`, the middle value in both
 * halves when the count is odd) or `'medianExcluded'` (the TI-83 rule, the
 * middle value in neither half). A single value is all three quartiles.
 * Throws `EmptyDataError` when empty.
 */
export declare function quartiles(values: Iterable<number>, options?: QuartileOptions): Quartiles;
/**
 * Where `score` falls in `values`, as a percentage in `[0, 100]` — the inverse
 * of `percentile`. `kind` says how values equal to the score count (see
 * `PercentileRankKind`); the default `'mean'` counts half of them, so the
 * median of distinct values ranks 50. `score` need not be one of the values.
 * Matches SciPy's `percentileofscore(values, score, kind)`.
 * Throws `EmptyDataError` when empty.
 */
export declare function percentileRank(values: Iterable<number>, score: number, options?: PercentileRankOptions): number;
/**
 * Variance by the corrected two-pass algorithm. Sample (`ddof: 1`, divide by n - 1)
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
/**
 * Pooled variance of two or more groups that share one spread: the within-group
 * sums of squared deviations, added, over the pooled degrees of freedom,
 * `sum(SS_i) / (N - g * ddof)` for g groups of N values in all. The default
 * `ddof: 1` is the textbook pooled sample variance
 * `sum((n_i - 1) * s_i^2) / sum(n_i - 1)` (the two-sample t-test's s_p^2, ANOVA's
 * mean square within); `ddof: 0` divides by N. A group of one value adds no
 * spread and, with `ddof: 1`, no degrees of freedom.
 *
 * A group is its raw values, or a `SampleSummary` (`{ n, stddev }` or
 * `{ n, variance }`) when only summary data is at hand. A summary's spread is
 * read as a sample spread (ddof 1, what calculators and papers report), so it
 * stands for `(n - 1) * s^2` squared deviations whatever `ddof` you pool with;
 * a summary gives the same result as the raw values it summarizes.
 *
 * Throws `EmptyDataError` for no groups, an empty group, or no degrees of
 * freedom left, and `InvalidArgumentError` for a bad summary.
 */
export declare function pooledVariance(samples: Iterable<Iterable<number> | SampleSummary>, options?: VarianceOptions): number;
/** Square root of `pooledVariance`, with the same groups and `ddof` convention (sample by default). */
export declare function pooledStddev(samples: Iterable<Iterable<number> | SampleSummary>, options?: VarianceOptions): number;
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
/**
 * How many standard deviations `value` lies from `mean`: `(value - mean) / stddev`.
 * Throws `InvalidArgumentError` unless `stddev` is positive.
 */
export declare function zScore(value: number, mean: number, stddev: number): number;
/**
 * Standard error of the mean, `stddev / sqrt(n)`. Pass the data (its `stddev`
 * uses `ddof`, sample by default) or a known `{ stddev, n }`.
 * Throws `EmptyDataError` when the data has too few values.
 */
export declare function standardError(values: Iterable<number> | {
    stddev: number;
    n: number;
}, options?: VarianceOptions): number;
/**
 * Half-width of a confidence interval for a mean: critical value times the
 * standard error. `method` is `'t'` by default (needs `n >= 2`), `level` 0.95.
 */
export declare function marginOfError({ stddev: spread, n, level, method }: MarginOfErrorInput): number;
/**
 * Confidence interval for the mean of `values`, from the exact critical value
 * of the normal (`'z'`) or Student t with `n - 1` degrees of freedom (`'t'`,
 * the default). The spread is the sample standard deviation (`ddof` 1) unless
 * you pass `ddof: 0`. Needs at least 2 values.
 */
export declare function confidenceInterval(values: Iterable<number>, options?: ConfidenceIntervalOptions): ConfidenceInterval;
/**
 * Smallest sample size, rounded up, that keeps the margin of error at or below
 * `marginOfError` with the given `level` (default 0.95), using the normal
 * critical value `z`. For a mean pass `stddev`: `n = (z * stddev / E)^2`. For a
 * proportion pass `proportion` (default 0.5, the worst case):
 * `n = z^2 * p * (1 - p) / E^2`.
 */
export declare function sampleSize(input: MeanSampleSizeInput | ProportionSampleSizeInput): number;
/**
 * Exponential fit `y = a * e^(b * x)`, by least squares on `ln y` against x
 * (so large y weigh less than in a direct fit). `r2` is measured on the original y.
 * Throws `InvalidArgumentError` unless every y is positive, plus `linearRegression`'s conditions.
 */
export declare function exponentialRegression(x: Iterable<number>, y: Iterable<number>): ExponentialFit;
/**
 * Logarithmic fit `y = a + b * ln(x)`, by least squares on `ln x`. `r2` is
 * measured on the original y. Throws `InvalidArgumentError` unless every x is
 * positive; `predict` does too.
 */
export declare function logarithmicRegression(x: Iterable<number>, y: Iterable<number>): LogarithmicFit;
/**
 * Power fit `y = a * x^b`, by least squares on `ln y` against `ln x`. `r2` is
 * measured on the original y. Throws `InvalidArgumentError` unless every x and
 * y is positive; `predict` needs a positive x.
 */
export declare function powerRegression(x: Iterable<number>, y: Iterable<number>): PowerFit;
/**
 * Least-squares polynomial of the given `degree`, by the normal equations.
 * Coefficients are lowest degree first (`[c0, c1, ...]`); `r2` is measured on
 * the original y.
 *
 * x is centered and scaled to `u = (x - center) / halfRange`, which spans
 * [-1, 1], before solving, so data far from zero (years 2015 to 2024, say) is
 * as well conditioned as data around zero. `predict` and the diagnostics
 * evaluate the fit in that centered basis, which is the accurate path.
 * `coefficients` are mapped back to powers of x for display and reuse; for x
 * far from zero relative to its spread they are inherently sensitive (each one
 * is a sum of large terms that nearly cancel), so evaluating them by hand can
 * lose digits that `predict` keeps.
 *
 * Throws `InvalidArgumentError` for a non-integer or negative degree, or fewer
 * distinct x values than `degree + 1`, and `NumericRangeError` when the system
 * is numerically singular.
 */
export declare function polynomialRegression(x: Iterable<number>, y: Iterable<number>, degree: number): PolynomialFit;
export {};
//# sourceMappingURL=stats.d.ts.map