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
import { CurrencyMismatchError, InvalidArgumentError, NumberFormatError } from './errors.js';
import { Decimal } from './decimal.js';
import { formatCurrency } from './format.js';
import { pow10 } from './internal/bigint.js';
const BRAND = Symbol('Money');
const DEFAULT_ROUNDING = 'halfEven';
const CODE = /^[A-Z]{3}$/;
const scaleCache = new Map();
let knownCodes;
/**
 * Known ISO 4217 codes from `Intl.supportedValuesOf('currency')`, built once.
 * `null` when the runtime lacks that function; then `currencyScale` falls back
 * to the `Intl.NumberFormat` probe, which accepts any well-formed code.
 */
function getKnownCodes() {
    if (knownCodes !== undefined)
        return knownCodes;
    try {
        knownCodes = typeof Intl.supportedValuesOf === 'function' ? new Set(Intl.supportedValuesOf('currency')) : null;
    }
    catch {
        knownCodes = null;
    }
    return knownCodes;
}
function normalizeCurrency(currency) {
    const code = typeof currency === 'string' ? currency.toUpperCase() : '';
    if (!CODE.test(code)) {
        throw new InvalidArgumentError(`Currency must be a 3-letter ISO 4217 code, got ${JSON.stringify(currency)}`);
    }
    return code;
}
/**
 * Number of minor-unit digits for a currency, from the runtime's `Intl` data:
 * `currencyScale('EUR')` → `2`, `'JPY'` → `0`, `'BHD'` → `3`.
 * Throws `InvalidArgumentError` for a code that is not 3 letters or is unknown to `Intl`.
 */
export function currencyScale(currency) {
    const code = normalizeCurrency(currency);
    const cached = scaleCache.get(code);
    if (cached !== undefined)
        return cached;
    const known = getKnownCodes();
    if (known !== null && !known.has(code)) {
        throw new InvalidArgumentError(`Unknown currency code "${code}"`);
    }
    try {
        const digits = new Intl.NumberFormat('en', { style: 'currency', currency: code }).resolvedOptions()
            .maximumFractionDigits;
        const scale = digits ?? 2;
        scaleCache.set(code, scale);
        return scale;
    }
    catch (error) {
        throw new InvalidArgumentError(`Unknown currency code: ${code}`, { cause: error });
    }
}
function refuseCoercion() {
    throw new TypeError('Money cannot be coerced to a primitive; use toString(), toNumber() or toDecimal()');
}
/** An immutable amount of money in one currency. Create it with `money()` or `Money.from()`. */
export class Money {
    /** Always at the currency's scale. */
    amount;
    /** Upper-case ISO 4217 code. */
    currency;
    constructor(amount, currency, brand) {
        if (brand !== BRAND)
            throw new TypeError('Use money(amount, currency) instead of new Money()');
        this.amount = amount;
        this.currency = currency;
        Object.freeze(this);
    }
    /**
     * Rounds `amount` to the currency scale using `options.rounding`. With no
     * `rounding`, extra precision throws `RoundingNecessaryError`:
     * `money('1.005', 'EUR')` throws, `money('1.005', 'EUR', { rounding: 'halfEven' })` → `1.00 EUR`.
     * A `Money` input must already be in the same currency.
     */
    static from(amount, currency, options = {}) {
        const code = normalizeCurrency(currency);
        const scale = currencyScale(code);
        let value;
        if (amount instanceof Money) {
            if (amount.currency !== code) {
                throw new CurrencyMismatchError(`Cannot treat ${amount.currency} as ${code}`);
            }
            value = amount.amount;
        }
        else {
            value = Decimal.from(amount);
        }
        return new Money(value.toScale(scale, options.rounding ?? 'unnecessary'), code, BRAND);
    }
    /** `fromMinorUnits(1999n, 'EUR')` → `19.99 EUR`. A `number` must be a safe integer. */
    static fromMinorUnits(minor, currency) {
        if (typeof minor !== 'bigint' && typeof minor !== 'number') {
            throw new TypeError('Minor units must be a bigint or a safe integer number');
        }
        if (typeof minor === 'number' && !Number.isSafeInteger(minor)) {
            throw new InvalidArgumentError(`Minor units must be a safe integer, got ${minor}`);
        }
        const code = normalizeCurrency(currency);
        const scale = currencyScale(code);
        const amount = Decimal.from(BigInt(minor)).dividedBy(pow10(scale), { scale });
        return new Money(amount, code, BRAND);
    }
    /**
     * Adds up values of one currency. An empty list needs `currency` (the result
     * is zero); otherwise it throws `InvalidArgumentError`.
     */
    static sum(values, currency) {
        let code = currency === undefined ? undefined : normalizeCurrency(currency);
        const amounts = [];
        for (const value of values) {
            if (!isMoney(value))
                throw new TypeError('Money.sum expects Money values');
            if (code === undefined)
                code = value.currency;
            else if (value.currency !== code) {
                throw new CurrencyMismatchError(`Cannot combine ${code} with ${value.currency}`);
            }
            amounts.push(value.amount);
        }
        if (code === undefined) {
            throw new InvalidArgumentError('Money.sum of an empty list needs a currency');
        }
        return new Money(Decimal.sum(amounts).toScale(currencyScale(code), 'unnecessary'), code, BRAND);
    }
    /** Comparator for sorting: `prices.sort(Money.compare)`. Throws on mixed currencies. */
    static compare(a, b) {
        return a.compareTo(b);
    }
    /** Reads `'19.99 EUR'` or `'EUR 19.99'`. Extra precision throws `RoundingNecessaryError`. */
    static parse(text) {
        const trimmed = typeof text === 'string' ? text.trim() : '';
        const amountFirst = /^([+-]?\d+(?:\.\d+)?)\s+([A-Z]{3})$/i.exec(trimmed);
        const codeFirst = /^([A-Z]{3})\s+([+-]?\d+(?:\.\d+)?)$/i.exec(trimmed);
        const amount = amountFirst?.[1] ?? codeFirst?.[2];
        const code = amountFirst?.[2] ?? codeFirst?.[1];
        if (amount === undefined || code === undefined) {
            throw new NumberFormatError(`Cannot parse ${JSON.stringify(text)} as money; expected '19.99 EUR'`);
        }
        return Money.from(amount, code);
    }
    static fromJSON(value) {
        if (typeof value !== 'object' ||
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- untrusted JSON can be null
            value === null ||
            typeof value.amount !== 'string' ||
            typeof value.currency !== 'string') {
            throw new InvalidArgumentError('Expected { amount: string, currency: string }');
        }
        return Money.from(value.amount, value.currency);
    }
    // Arithmetic -------------------------------------------------------------
    plus(other) {
        this.assertSame(other);
        return new Money(this.amount.plus(other.amount), this.currency, BRAND);
    }
    minus(other) {
        this.assertSame(other);
        return new Money(this.amount.minus(other.amount), this.currency, BRAND);
    }
    /** Exact product, then rounded to the currency scale (default `'halfEven'`). */
    times(factor, options = {}) {
        return this.withAmount(this.amount.times(factor), options);
    }
    /** Divides and rounds to the currency scale (default `'halfEven'`). Zero throws `DivisionByZeroError`. */
    dividedBy(divisor, options = {}) {
        const amount = this.amount.dividedBy(divisor, {
            scale: this.amount.scale,
            rounding: options.rounding ?? DEFAULT_ROUNDING,
        });
        return new Money(amount, this.currency, BRAND);
    }
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
    allocate(ratios) {
        if (ratios.length === 0)
            throw new InvalidArgumentError('allocate needs at least one ratio');
        const weights = [];
        let commonScale = 0;
        for (const ratio of ratios) {
            const weight = Decimal.from(ratio);
            if (weight.isNegative())
                throw new InvalidArgumentError(`Ratios must be non-negative, got ${weight.toString()}`);
            commonScale = Math.max(commonScale, weight.scale);
            weights.push(weight);
        }
        const parts = weights.map((w) => w.toScale(commonScale).coefficient);
        const total = parts.reduce((a, b) => a + b, 0n);
        if (total === 0n)
            throw new InvalidArgumentError('Ratios must not all be zero');
        const minor = this.amount.coefficient;
        const magnitude = minor < 0n ? -minor : minor;
        const shares = parts.map((p) => (magnitude * p) / total);
        const remainders = parts.map((p, i) => ({ index: i, rest: (magnitude * p) % total }));
        let left = magnitude - shares.reduce((a, b) => a + b, 0n);
        remainders.sort((a, b) => (a.rest === b.rest ? a.index - b.index : a.rest < b.rest ? 1 : -1));
        for (const { index } of remainders) {
            if (left === 0n)
                break;
            shares[index] = (shares[index] ?? 0n) + 1n;
            left -= 1n;
        }
        const direction = minor < 0n ? -1n : 1n;
        return shares.map((share) => Money.fromMinorUnits(share * direction, this.currency));
    }
    /** `money(200, 'EUR').percentage(15)` → `30.00 EUR`. Same as `times(percent / 100)`. */
    percentage(percent, options = {}) {
        return this.times(Decimal.from(percent).dividedBy(100), options);
    }
    negated() {
        return new Money(this.amount.negated(), this.currency, BRAND);
    }
    abs() {
        return new Money(this.amount.abs(), this.currency, BRAND);
    }
    // Comparison -------------------------------------------------------------
    compareTo(other) {
        this.assertSame(other);
        return this.amount.compareTo(other.amount);
    }
    eq(other) {
        return this.compareTo(other) === 0;
    }
    lt(other) {
        return this.compareTo(other) < 0;
    }
    lte(other) {
        return this.compareTo(other) <= 0;
    }
    gt(other) {
        return this.compareTo(other) > 0;
    }
    gte(other) {
        return this.compareTo(other) >= 0;
    }
    isZero() {
        return this.amount.isZero();
    }
    isPositive() {
        return this.amount.isPositive();
    }
    isNegative() {
        return this.amount.isNegative();
    }
    hasSameCurrency(other) {
        return this.currency === other.currency;
    }
    // Conversion -------------------------------------------------------------
    toDecimal() {
        return this.amount;
    }
    /** `19.99 EUR` → `1999n`. */
    toMinorUnits() {
        return this.amount.coefficient;
    }
    /** The nearest double. Fine for display math, not for further money math. */
    toNumber() {
        return this.amount.toNumber();
    }
    /** Locale-free and round-trippable through `Money.parse`: `'19.99 EUR'`. */
    toString() {
        return `${this.amount.toString()} ${this.currency}`;
    }
    /** Localized text via `formatCurrency`: `'$19.99'` by default, `'19,99 €'` with `{ locale: 'de-DE' }`. */
    format(options) {
        return formatCurrency(this.amount, this.currency, options);
    }
    toJSON() {
        return { amount: this.amount.toString(), currency: this.currency };
    }
    /** Throws. A `Money` never silently becomes a float. */
    valueOf() {
        return refuseCoercion();
    }
    [Symbol.toPrimitive](hint) {
        return hint === 'string' ? this.toString() : refuseCoercion();
    }
    [Symbol.for('nodejs.util.inspect.custom')]() {
        return `Money(${this.toString()})`;
    }
    [Symbol.for('Deno.customInspect')]() {
        return `Money(${this.toString()})`;
    }
    [Symbol.toStringTag] = 'Money';
    withAmount(amount, options) {
        const scaled = amount.toScale(this.amount.scale, options.rounding ?? DEFAULT_ROUNDING);
        return new Money(scaled, this.currency, BRAND);
    }
    assertSame(other) {
        if (this.currency !== other.currency) {
            throw new CurrencyMismatchError(`Cannot combine ${this.currency} with ${other.currency}`);
        }
    }
}
/** Shorthand for `Money.from`. */
export function money(amount, currency, options) {
    return Money.from(amount, currency, options);
}
export function isMoney(value) {
    return value instanceof Money;
}
//# sourceMappingURL=money.js.map