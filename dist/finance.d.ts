/**
 * Time-value-of-money helpers that follow the conventions of Excel and Google
 * Sheets, so formulas port over directly.
 *
 * - `rate` is per period, as a fraction: `0.05` is 5 %. Monthly loan at 6 %
 *   a year → `0.06 / 12` (as a Decimal, not a float).
 * - `periods` is a non-negative safe integer everywhere (`InvalidArgumentError`
 *   otherwise). For fractional or negative periods, growth too large for exact
 *   digits, or tight loops, use the float layer `@arki/math/finance/float`: the
 *   same function names and sign conventions on plain `number`.
 * - Cash outflows are negative and inflows positive in `netPresentValue` and
 *   `internalRateOfReturn`. `payment` is the one exception: it returns a
 *   positive number for a positive principal (Excel's `PMT` returns it negated).
 * - `timing` follows Excel's `type` argument: `'end'` is 0, `'begin'` is 1.
 * - `futureValue` and `presentValue` return balances, not Excel cash flows:
 *   `futureValue(pv, rate, n, { payment, timing })` is `-FV(rate, n, payment,
 *   pv, type)` and `presentValue(fv, rate, n, { payment, timing, scale })` is
 *   `-PV(rate, n, payment, fv, type)`. Same-sign inputs add up; a negative
 *   `payment` is a withdrawal or a loan repayment.
 *
 * `payment`, `netPresentValue`, `futureValue`, `presentValue`,
 * `compoundInterest`, `effectiveRate` and `simpleInterest` are exact: every
 * intermediate step stays exact and the result is rounded once, at the end,
 * with the `{ scale, rounding }` you pass, so `rounding: 'unnecessary'` throws
 * exactly when the true result does not fit. `rounding` defaults to
 * `'halfEven'` (banker's rounding). `nominalRate` needs an n-th root, which it
 * computes with guard digits (see its doc for the one caveat).
 * `internalRateOfReturn` and `periodsToReach` are float functions, approximate
 * by nature (a root and a logarithm, which no exact type holds); they are
 * re-exported from the float layer. `periodsToReach` with `{ payment }` is
 * Excel `NPER`.
 */
import type { DecimalInput, ScaleOptions } from './decimal.js';
import type { PaymentTiming } from './finance-float.js';
import { Decimal } from './decimal.js';
export type { PaymentTiming } from './finance-float.js';
export { internalRateOfReturn, periodsToReach } from './finance-float.js';
/** Options for `payment` and `amortizationSchedule`. */
export type PaymentOptions = ScaleOptions & {
    timing?: PaymentTiming;
};
/** A level payment made every period, added to the balance (negative to withdraw). */
export type AnnuityOptions = {
    /** Paid in (positive) or taken out (negative) every period. Defaults to 0. */
    payment?: DecimalInput;
    /** When in the period the payment falls. Defaults to `'end'`. */
    timing?: PaymentTiming;
};
/** `futureValue` options: an optional payment, and `{ scale, rounding }` only together. */
export type FutureValueOptions = AnnuityOptions & (ScaleOptions | {
    scale?: undefined;
    rounding?: undefined;
});
/** `presentValue` options: an optional payment and the required `{ scale }`. */
export type PresentValueOptions = AnnuityOptions & ScaleOptions;
/** One line of an amortization schedule. */
export type AmortizationRow = {
    /** 1-based period number. */
    period: number;
    /** Total paid this period: `interest + principal`. */
    payment: Decimal;
    /** Interest part of the payment. */
    interest: Decimal;
    /** Part of the payment that reduces the debt. */
    principal: Decimal;
    /** Debt left after this payment. */
    balance: Decimal;
};
/**
 * Balance after `periods`: `principal × (1 + rate)^periods`, plus each
 * `payment` grown to the end (Excel `FV`, negated; see the module doc).
 *
 * Exact; pass `{ scale }` to round the result once. `periods` must be a
 * non-negative safe integer. For fractional periods, use
 * `@arki/math/finance/float`.
 */
export declare function futureValue(principal: DecimalInput, rate: DecimalInput, periods: number, options?: FutureValueOptions): Decimal;
/**
 * Today's worth of `amount` due after `periods`, plus each `payment`
 * discounted to today (Excel `PV`, negated; see the module doc):
 * `(amount + payment × timing × ((1 + rate)^periods − 1) ÷ rate) ÷ (1 + rate)^periods`.
 *
 * Always needs `{ scale }` because the division rarely terminates; the one
 * division is the only rounding. `periods` must be a non-negative safe integer
 * (see `futureValue` for fractional periods).
 */
export declare function presentValue(amount: DecimalInput, rate: DecimalInput, periods: number, options: PresentValueOptions): Decimal;
/**
 * Excel `PMT`: the level payment that pays off a loan of `principal` over
 * `periods` at `rate` per period.
 *
 * Sign: a positive principal gives a positive payment. Excel returns it
 * negated; multiply by -1 if you need that.
 *
 * `(1 + rate)^periods` is computed exactly with `Decimal#pow`, and the whole
 * formula is one fraction, so there is exactly one rounding: the single division
 * at the end, with your `{ scale, rounding }`. A rate of 0 gives
 * `principal ÷ periods`. `timing: 'begin'` (Excel `type` 1) divides the payment
 * by `1 + rate`.
 */
export declare function payment(principal: DecimalInput, rate: DecimalInput, periods: number, options: PaymentOptions): Decimal;
/**
 * Full repayment schedule, one row per period.
 *
 * The payment is `payment(...)` rounded to `scale`. Each period's interest is
 * `balance × rate`, rounded to `scale` with your `rounding`; the principal part
 * is `payment − interest`. The last row absorbs the accumulated rounding: its
 * principal is whatever balance is left, so the final balance is exactly 0 and
 * the principal parts sum to the loan (the usual bank convention).
 *
 * With `timing: 'begin'` each payment falls at the start of its period, so the
 * first row has no interest (nothing has accrued yet), as in Excel `IPMT`.
 *
 * At most 100 000 periods; more throws `ResourceLimitError` before any work.
 */
export declare function amortizationSchedule(principal: DecimalInput, rate: DecimalInput, periods: number, options: PaymentOptions): AmortizationRow[];
/**
 * Net present value of `cashFlows` at t = 1..n, like Excel `NPV`: the first
 * flow is discounted one full period. Add a t = 0 flow yourself:
 * `initial.plus(netPresentValue(rate, flows, options))`.
 *
 * Evaluated as one exact fraction (Horner on the numerator), so rounding
 * happens once.
 */
export declare function netPresentValue(rate: DecimalInput, cashFlows: readonly DecimalInput[], options: ScaleOptions): Decimal;
/**
 * Effective annual rate from a nominal rate compounded `periodsPerYear` times:
 * `(1 + nominal ÷ n)^n − 1`. Computed as an exact fraction and rounded once
 * with `{ scale }`. Without options the exact value is returned when it
 * terminates, and `RoundingNecessaryError` is thrown when it does not.
 */
export declare function effectiveRate(nominalRate: DecimalInput, periodsPerYear: number, options?: ScaleOptions): Decimal;
/**
 * Nominal annual rate that compounds `periodsPerYear` times to the given
 * effective rate: `n × ((1 + effective)^(1/n) − 1)`.
 *
 * The n-th root is exact when one exists (`nominalRate(7, 3, …)` is exactly
 * 3) and is otherwise truncated to `scale + 10 + digits(n)` places, so `n ×`
 * its error stays below `10^-(scale + 10)`. The result is then rounded once to
 * `scale`. It is correctly rounded except when the exact value sits within
 * `10^-(scale + 10)` of a rounding boundary.
 */
export declare function nominalRate(effectiveRate: DecimalInput, periodsPerYear: number, options: ScaleOptions): Decimal;
/**
 * Interest earned only: `futureValue − principal`. Exact; with `{ scale }` it
 * is rounded once. `periods` must be a non-negative safe integer.
 */
export declare function compoundInterest(principal: DecimalInput, rate: DecimalInput, periods: number, options?: ScaleOptions): Decimal;
/** `principal × rate × periods`, exact. `periods` may be fractional (pass it as a string or Decimal). */
export declare function simpleInterest(principal: DecimalInput, rate: DecimalInput, periods: DecimalInput): Decimal;
//# sourceMappingURL=finance.d.ts.map