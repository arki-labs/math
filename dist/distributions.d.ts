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
    /** Survival function P(X > x) = 1 − cdf(x), computed on the accurate side where the distribution allows. */
    sf(x: number): number;
    /**
     * Quantile: the x with cdf(x) = p, p in (0, 1), solved until |cdf(x) − p| ≤ 1e-12·max(p, 1 − p);
     * p = 0 / 1 return the support bounds (±Infinity where unbounded).
     */
    quantile(p: number): number;
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
    /** Survival function P(X > k) = 1 − cdf(k), computed on the accurate side. */
    sf(k: number): number;
    /**
     * Quantile: exactly the smallest integer k with `cdf(k) >= p`, using this object's own `cdf`
     * (no tolerance), so `quantile(cdf(k)) === k`. p = 0 gives 0; p = 1 gives the support's upper bound.
     */
    quantile(p: number): number;
    /** Expected value. */
    readonly mean: number;
    /** Variance. */
    readonly variance: number;
};
/** Natural log of the gamma function, ln Γ(x), for x > 0 (Lanczos, g = 7, ~1e-15). */
export declare function gammaLn(x: number): number;
/**
 * The gamma function Γ(x) for finite `x`. `Γ(n + 1) = n!`, so this is the float
 * factorial for `n > 18`. Positive integers up to 171 are exact products;
 * other values use Lanczos (relative error ~1e-15) with the reflection formula
 * for `x < 0.5`. Poles (`0` and the negative integers) throw
 * `InvalidArgumentError`; a result beyond the double range (`x` above about
 * 171.62, or `x` within ~1e-308 of a pole) throws `NumericRangeError`.
 * Very negative `x` whose true value is below the smallest double returns `0`.
 */
export declare function gamma(x: number): number;
/** ln B(a, b) = ln Γ(a) + ln Γ(b) − ln Γ(a + b), for `a, b > 0`. */
export declare function betaLn(a: number, b: number): number;
/** The beta function B(a, b) = Γ(a)Γ(b) / Γ(a + b), for `a, b > 0`. Underflows to `0` for very large arguments. */
export declare function beta(a: number, b: number): number;
/** Regularized lower incomplete gamma P(a, x) = γ(a, x) / Γ(a), for a > 0 and x ≥ 0. */
export declare function regularizedGammaP(a: number, x: number): number;
/** Regularized incomplete beta I_x(a, b) for x in [0, 1] and a, b > 0. */
export declare function regularizedBeta(x: number, a: number, b: number): number;
/** The error function erf(x) = 2/√π ∫₀ˣ e^(−t²) dt (Cody's rational approximations, ~1e-16). */
export declare function erf(x: number): number;
/** The complementary error function erfc(x) = 1 − erf(x), accurate in the far tail. */
export declare function erfc(x: number): number;
/** Inverse error function: the x with erf(x) = p, for p in [−1, 1] (±1 give ±Infinity). */
export declare function erfInv(p: number): number;
/** Normal distribution N(mean, stddev²). Defaults to the standard normal. */
export declare function normal(mean?: number, stddev?: number): ContinuousDistribution;
/** Student's t distribution with `df > 0` degrees of freedom. */
export declare function studentT(df: number): ContinuousDistribution;
/**
 * Largest |ncp| `noncentralT` accepts: beyond it `exp(−ncp²/2)` underflows in
 * the AS 243 series. Power is already 1 (or 0) to double precision there, so
 * callers can clamp to this value without changing any visible result.
 */
export declare const MAX_NONCENTRALITY = 37.62;
/**
 * Noncentral t distribution with `df > 0` degrees of freedom and noncentrality
 * `ncp` (|ncp| ≤ 37.62). `cdf` is Lenth's (1989) AS 243 series (~1e-14; a normal
 * approximation is used for df > 4e5); it returns the exact limits 1 / 0 once
 * df/x² underflows. `pdf` uses the Johnson–Kotz–Balakrishnan power series on
 * the side of 0 where x and ncp share a sign (all terms positive) and close to
 * 0 on the other side; elsewhere it uses the identity
 * f(x) = df/x · [F(x·√(1+2/df); df+2) − F(x; df)], where the cdf difference no
 * longer cancels (accurate to ~1e-15 absolute, so relative accuracy fades only
 * where the density itself is below ~1e-13). `quantile` is the safeguarded Newton solver.
 * With `ncp = 0` it equals `studentT(df)`.
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