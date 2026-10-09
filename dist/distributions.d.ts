/**
 * Probability distributions and the special functions behind them, over plain
 * JS numbers. Pure TypeScript, no platform APIs.
 *
 * Parameters are validated and throw `InvalidArgumentError`. `pdf`/`cdf`/`pmf`
 * accept `±Infinity` (they are legitimate arguments) but reject `NaN`. Results
 * never carry `-0`. Where a moment does not exist (for example the mean of a
 * Cauchy-like t with `df <= 1`) it is `undefined`, or `Infinity` when it diverges.
 */
/** A continuous probability distribution. */
export type ContinuousDistribution = {
    /** Probability density at x. */
    pdf(x: number): number;
    /** P(X ≤ x). */
    cdf(x: number): number;
    /** Quantile: the x with cdf(x) = p, p in (0, 1); p = 0 / 1 return the support bounds (±Infinity where unbounded). */
    inv(p: number): number;
    /** Expected value, or `undefined` when the distribution has none. */
    readonly mean: number | undefined;
    /** Variance: `Infinity` when it diverges, `undefined` when the distribution has none. */
    readonly variance: number | undefined;
};
/** A discrete probability distribution over the non-negative integers. */
export type DiscreteDistribution = {
    /** P(X = k) for integer k (0 for any other k). */
    pmf(k: number): number;
    /** P(X ≤ k). */
    cdf(k: number): number;
    /** Smallest k with cdf(k) ≥ p (compared with a 1e-12 relative tolerance). */
    inv(p: number): number;
    /** Expected value. */
    readonly mean: number;
    /** Variance. */
    readonly variance: number;
};
/** Natural log of the gamma function, ln Γ(x), for x > 0 (Lanczos, g = 7, ~1e-15). */
export declare function gammaLn(x: number): number;
/** Regularized lower incomplete gamma P(a, x) = γ(a, x) / Γ(a), for a > 0 and x ≥ 0. */
export declare function regularizedGammaP(a: number, x: number): number;
/** Regularized incomplete beta I_x(a, b) for x in [0, 1] and a, b > 0. */
export declare function regularizedBeta(x: number, a: number, b: number): number;
/** The error function erf(x) = 2/√π ∫₀ˣ e^(−t²) dt (via the incomplete gamma function, ~1e-15). */
export declare function erf(x: number): number;
/** The complementary error function erfc(x) = 1 − erf(x), accurate in the far tail. */
export declare function erfc(x: number): number;
/** Inverse error function: the x with erf(x) = p, for p in [−1, 1] (±1 give ±Infinity). */
export declare function erfInv(p: number): number;
/** Normal distribution N(mean, stddev²). Defaults to the standard normal. */
export declare function normal(mean?: number, stddev?: number): ContinuousDistribution;
/** Student's t distribution with `df > 0` degrees of freedom. */
export declare function studentT(df: number): ContinuousDistribution;
/** Largest |ncp| the AS 243 series handles before exp(−ncp²/2) underflows. */
/**
 * Largest |ncp| `noncentralT` accepts: beyond it `exp(−ncp²/2)` underflows in
 * the AS 243 series. Power is already 1 (or 0) to double precision there, so
 * callers can clamp to this value without changing any visible result.
 */
export declare const MAX_NONCENTRALITY = 37.62;
/**
 * Noncentral t distribution with `df > 0` degrees of freedom and noncentrality
 * `ncp` (|ncp| ≤ 37.62). `cdf` is Lenth's (1989) AS 243 series (~1e-12; a normal
 * approximation is used for df > 4e5). `pdf` uses the exact identity
 * f(x) = df/x · [F(x·√(1+2/df); df+2) − F(x; df)]. `inv` brackets then bisects
 * the cdf to ~1e-15 in x. With `ncp = 0` it equals `studentT(df)`.
 */
export declare function noncentralT(df: number, ncp: number): ContinuousDistribution;
/** Chi-square distribution with `df > 0` degrees of freedom. */
export declare function chiSquare(df: number): ContinuousDistribution;
/** Fisher's F distribution with `df1, df2 > 0` degrees of freedom. */
export declare function fisherF(df1: number, df2: number): ContinuousDistribution;
/** Exponential distribution with `rate > 0`. */
export declare function exponential(rate: number): ContinuousDistribution;
/** Continuous uniform distribution on `[min, max]`, with `min < max`. */
export declare function uniform(min: number, max: number): ContinuousDistribution;
/** Binomial distribution: `n` trials (non-negative safe integer), success probability `p` in [0, 1]. */
export declare function binomial(n: number, p: number): DiscreteDistribution;
/** Poisson distribution with rate `lambda > 0`. */
export declare function poisson(lambda: number): DiscreteDistribution;
/** The standard normal, N(0, 1), shared so callers do not rebuild it on every call. */
export declare const standardNormal: ContinuousDistribution;
//# sourceMappingURL=distributions.d.ts.map