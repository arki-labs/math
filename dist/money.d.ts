/**
 * Exact money: a `Decimal` amount tied to an ISO 4217 currency, always held at
 * the currency's own number of minor-unit digits (2 for EUR, 0 for JPY, 3 for BHD).
 *
 * Rules that protect you from silent loss:
 * - Building a `Money` from a value with more precision than the currency
 *   throws `RoundingNecessaryError` unless you pass a `rounding` mode.
 * - Mixing currencies throws `CurrencyMismatchError`. There is no conversion here.
 * - `allocate` splits an amount so the parts add back to the whole, to the cent.
 * - Where rounding is chosen for you (`times`, `dividedBy`, `percentage`) the
 *   default is `'halfEven'` (banker's rounding), the usual choice for money.
 * - A `Money` never turns into a float by accident: `+money` throws.
 */
import { Decimal } from './decimal.js';
import type { DecimalInput } from './decimal.js';
import type { CurrencyOptions as CurrencyFormatOptions } from './format.js';
import type { RoundingMode } from './rounding.js';
export type MoneyInput = Money | DecimalInput;
export type MoneyOptions = {
    /** How to drop digits beyond the currency scale. `Money.from` throws when omitted; `times`/`dividedBy` default to `'halfEven'`. */
    rounding?: RoundingMode;
};
/**
 * Number of minor-unit digits for a currency, from the runtime's `Intl` data:
 * `currencyScale('EUR')` → `2`, `'JPY'` → `0`, `'BHD'` → `3`.
 * Throws `InvalidArgumentError` for a code that is not 3 letters or is unknown to `Intl`.
 */
export declare function currencyScale(currency: string): number;
/** An immutable amount of money in one currency. Create it with `money()` or `Money.from()`. */
export declare class Money {
    /** Always at the currency's scale. */
    readonly amount: Decimal;
    /** Upper-case ISO 4217 code. */
    readonly currency: string;
    private constructor();
    /**
     * Rounds `amount` to the currency scale using `options.rounding`. With no
     * `rounding`, extra precision throws `RoundingNecessaryError`:
     * `money('1.005', 'EUR')` throws, `money('1.005', 'EUR', { rounding: 'halfEven' })` → `1.00 EUR`.
     * A `Money` input must already be in the same currency.
     */
    static from(amount: MoneyInput, currency: string, options?: MoneyOptions): Money;
    /** `fromMinorUnits(1999n, 'EUR')` → `19.99 EUR`. A `number` must be a safe integer. */
    static fromMinorUnits(minor: bigint | number, currency: string): Money;
    /**
     * Adds up values of one currency. An empty list needs `currency` (the result
     * is zero); otherwise it throws `InvalidArgumentError`.
     */
    static sum(values: Iterable<Money>, currency?: string): Money;
    /** Comparator for sorting: `prices.sort(Money.compare)`. Throws on mixed currencies. */
    static compare(a: Money, b: Money): -1 | 0 | 1;
    /** Reads `'19.99 EUR'` or `'EUR 19.99'`. Extra precision throws `RoundingNecessaryError`. */
    static parse(text: string): Money;
    static fromJSON(value: {
        amount: string;
        currency: string;
    }): Money;
    plus(other: Money): Money;
    minus(other: Money): Money;
    /** Exact product, then rounded to the currency scale (default `'halfEven'`). */
    times(factor: DecimalInput, options?: MoneyOptions): Money;
    /** Divides and rounds to the currency scale (default `'halfEven'`). Zero throws `DivisionByZeroError`. */
    dividedBy(divisor: DecimalInput, options?: MoneyOptions): Money;
    /**
     * Splits into `ratios.length` parts that add up to this amount exactly.
     * Each part first gets `floor(amount × ratio ÷ total)` minor units. The
     * minor units left over go one each to the parts with the largest
     * remainder; equal remainders favor the earlier part.
     * `money(100, 'EUR').allocate([1, 1, 1])` → `[33.34, 33.33, 33.33]`.
     * Ratios must be finite and non-negative, and not all zero. Fractions such
     * as `0.5` are fine. A negative amount is split as a positive one and
     * re-signed, so the earlier parts take the extra unit there too.
     */
    allocate(ratios: readonly number[] | readonly bigint[]): Money[];
    /** `money(200, 'EUR').percentage(15)` → `30.00 EUR`. Same as `times(percent / 100)`. */
    percentage(percent: DecimalInput, options?: MoneyOptions): Money;
    negated(): Money;
    abs(): Money;
    compareTo(other: Money): -1 | 0 | 1;
    eq(other: Money): boolean;
    lt(other: Money): boolean;
    lte(other: Money): boolean;
    gt(other: Money): boolean;
    gte(other: Money): boolean;
    isZero(): boolean;
    isPositive(): boolean;
    isNegative(): boolean;
    hasSameCurrency(other: Money): boolean;
    toDecimal(): Decimal;
    /** `19.99 EUR` → `1999n`. */
    toMinorUnits(): bigint;
    /** The nearest double. Fine for display math, not for further money math. */
    toNumber(): number;
    /** Locale-free and round-trippable through `Money.parse`: `'19.99 EUR'`. */
    toString(): string;
    /** Localized text via `formatCurrency`: `'$19.99'` by default, `'19,99 €'` with `{ locale: 'de-DE' }`. */
    format(options?: CurrencyFormatOptions): string;
    toJSON(): {
        amount: string;
        currency: string;
    };
    /** Throws. A `Money` never silently becomes a float. */
    valueOf(): never;
    [Symbol.toPrimitive](hint: 'string' | 'number' | 'default'): string;
    readonly [Symbol.toStringTag] = "Money";
    private withAmount;
    private assertSame;
}
/** Shorthand for `Money.from`. */
export declare function money(amount: MoneyInput, currency: string, options?: MoneyOptions): Money;
export declare function isMoney(value: unknown): value is Money;
//# sourceMappingURL=money.d.ts.map