/**
 * Time-value-of-money on plain `number`: the float layer of
 * `@arki/math/finance`.
 *
 * **Naming rule: same name, different import path.** Every function here has
 * the same name, argument order and sign convention as its exact twin in
 * `@arki/math/finance` (on `Decimal`). Only the import path says which layer
 * you get, as with `@arki/math/decimal` and `@arki/math/number`. To use both in
 * one file, import one layer as a namespace:
 * `import * as float from '@arki/math/finance/float'`.
 *
 * Use this layer when the exact one cannot serve: periods that are fractional
 * or negative (7.5 years, a `periodsToReach` result fed back in), growth
 * factors too large for exact digits (daily compounding over decades), or
 * loops that run thousands of times (projection tables). Use the exact layer
 * for amounts that must be right to the cent and be reproducible.
 *
 * Conventions, shared with the exact layer:
 * - `rate` is per period, as a fraction (`0.05` is 5 %), and must be greater
 *   than -1. `periods` may be any finite number unless a function says so.
 * - Results are balances, not Excel cash flows: same-sign inputs add up.
 *   `futureValue(pv, rate, n, { payment, timing })` is `-FV(rate, n, payment,
 *   pv, type)`, `presentValue(fv, rate, n, { payment, timing })` is
 *   `-PV(rate, n, payment, fv, type)`, and `payment(pv, rate, n)` is
 *   `-PMT(rate, n, pv)`. A loan is a positive principal paid off by negative
 *   payments: `futureValue(p, r, n, { payment: -payment(p, r, n) })` is 0.
 * - `timing` is Excel's `type`: `'end'` (0, the default) or `'begin'` (1).
 *
 * Accuracy: `(1 + rate)^periods` is `exp(periods × log1p(rate))`, and the
 * annuity factor `((1 + rate)^n − 1) ÷ rate` is built from `expm1` and
 * `log1p`, so a rate of `1e-12` keeps full precision and a rate of 0 gives
 * the exact limit `n` instead of `0 ÷ 0`.
 *
 * Nothing here returns `NaN` or `±Infinity`: non-finite inputs and a rate of
 * -100 % or lower throw `InvalidArgumentError`, and a result beyond the float
 * range throws `NumericRangeError`.
 */
/** When in the period payments fall: `'end'` is Excel `type` 0, `'begin'` is `type` 1. */
export type PaymentTiming = 'end' | 'begin';
/** A level payment made every period, added to the balance (negative to withdraw). */
export type AnnuityOptions = {
    /** Paid in (positive) or taken out (negative) every period. Defaults to 0. */
    payment?: number;
    /** When in the period the payment falls. Defaults to `'end'`. */
    timing?: PaymentTiming;
};
/** One line of an amortization schedule. */
export type AmortizationRow = {
    /** 1-based period number. */
    period: number;
    /** Total paid this period: `interest + principal`. */
    payment: number;
    /** Interest part of the payment. */
    interest: number;
    /** Part of the payment that reduces the debt. */
    principal: number;
    /** Debt left after this payment. */
    balance: number;
};
/**
 * Balance after `periods`: `principal × (1 + rate)^periods`, plus each
 * `payment` grown to the end (Excel `FV`, negated). `periods` may be
 * fractional or negative (negative discounts).
 */
export declare function futureValue(principal: number, rate: number, periods: number, options?: AnnuityOptions): number;
/**
 * Today's worth of `amount` due after `periods`, plus each `payment`
 * discounted to today (Excel `PV`, negated): `amount ÷ (1 + rate)^periods +
 * payment × (1 − (1 + rate)^-periods) ÷ rate`. `periods` may be fractional or
 * negative.
 */
export declare function presentValue(amount: number, rate: number, periods: number, options?: AnnuityOptions): number;
/**
 * Excel `PMT`, negated: the level payment that pays off `principal` over
 * `periods` at `rate` per period. `periods` must be positive and may be
 * fractional. A rate of 0 gives `principal ÷ periods`; `timing: 'begin'`
 * divides the payment by `1 + rate`.
 */
export declare function payment(principal: number, rate: number, periods: number, options?: {
    timing?: PaymentTiming;
}): number;
/**
 * Interest earned only: `principal × ((1 + rate)^periods − 1)`, via `expm1`
 * so tiny rates do not cancel to 0. `periods` may be fractional or negative.
 */
export declare function compoundInterest(principal: number, rate: number, periods: number): number;
/**
 * Effective annual rate (Excel `EFFECT`) from a nominal rate compounded
 * `periodsPerYear` times: `(1 + nominal ÷ n)^n − 1`. `periodsPerYear` must be
 * positive and may be fractional (0.5 compounds every two years).
 */
export declare function effectiveRate(nominalRate: number, periodsPerYear: number): number;
/**
 * Nominal annual rate (Excel `NOMINAL`) that compounds `periodsPerYear` times
 * to the given effective rate: `n × ((1 + effective)^(1/n) − 1)`.
 */
export declare function nominalRate(effectiveRate: number, periodsPerYear: number): number;
/**
 * Net present value of `cashFlows` at t = 1..n, like Excel `NPV`: the first
 * flow is discounted one full period. Add a t = 0 flow yourself:
 * `initial + netPresentValue(rate, flows)`.
 */
export declare function netPresentValue(rate: number, cashFlows: readonly number[]): number;
/**
 * Full repayment schedule, one row per period, unrounded (round for display
 * with `round` from `@arki/math/number`).
 *
 * The payment is `payment(...)`. Each period's interest is `balance × rate`;
 * the principal part is `payment − interest`. The last row's principal is
 * whatever balance is left, so the final balance is exactly 0 despite float
 * drift. With `timing: 'begin'` the first row has no interest, as in Excel
 * `IPMT`.
 *
 * `periods` must be a positive safe integer, at most 100 000; more throws
 * `ResourceLimitError` before any work.
 */
export declare function amortizationSchedule(principal: number, rate: number, periods: number, options?: {
    timing?: PaymentTiming;
}): AmortizationRow[];
/**
 * Internal rate of return as a JS number (the rate that makes NPV zero), like
 * Excel `IRR`. Cash flows start at t = 0 and need at least one negative and one
 * positive value.
 *
 * Inherently approximate: Newton's method from `guess` (default 0.1), falling
 * back to a bracketed bisection. `tolerance` (default `1e-10`) is Newton's step
 * size at convergence, and the check every answer must pass: the NPV at the
 * returned rate is at most `tolerance` times the sum of the absolute
 * discounted flows. Throws `InvalidArgumentError` when there is no sign change
 * or no rate passes that check.
 *
 * The same function is exported from `@arki/math/finance`.
 */
export declare function internalRateOfReturn(cashFlows: readonly number[], options?: {
    guess?: number;
    tolerance?: number;
}): number;
/**
 * Periods until the balance goes from `principal` to `target` at `rate` per
 * period: the `periods` that makes `futureValue(principal, rate, periods,
 * options)` equal `target`. Approximate and possibly fractional; round up
 * yourself for whole months. The result can be passed straight back to
 * `futureValue`.
 *
 * Without a payment it is `ln(target ÷ principal) ÷ ln(1 + rate)`, and
 * `principal` and `target` must be positive and `rate` non-zero.
 *
 * With `{ payment, timing }` it is Excel `NPER(rate, payment, principal,
 * -target, type)`, under the balance sign rule: paying off a card of 5000 at
 * 200 a month is `periodsToReach(5000, 0, 0.18 / 12, { payment: -200 })`, and
 * saving 100 a month from 0 to 10 000 is `periodsToReach(0, 10_000, 0.005,
 * { payment: 100 })`. At rate 0 it is exactly `(target − principal) ÷ payment`.
 *
 * Throws `InvalidArgumentError` when the target is never reached, including
 * a payment that only covers (or does not cover) the interest.
 *
 * The same function is exported from `@arki/math/finance`.
 */
export declare function periodsToReach(principal: number, target: number, rate: number, options?: AnnuityOptions): number;
//# sourceMappingURL=finance-float.d.ts.map