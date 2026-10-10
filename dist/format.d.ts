/**
 * Presentation helpers built on `Intl.NumberFormat`. Numbers are formatted
 * for people, never for storage: the output depends on the locale and must not
 * be parsed back with `Number()` (use `parseNumber` from `./parse.js`).
 *
 * `Decimal` and numeric-string inputs are handed to `Intl` as exact decimal
 * strings, so no digit is lost on the way. `Intl.NumberFormat` instances are
 * cached because constructing one is slow.
 */
import type { Decimal } from './decimal.js';
import type { RoundingMode } from './rounding.js';
/** A formattable value. A string must be a number in plain decimal syntax (`'-1234.50'`). */
export type FormatValue = number | bigint | Decimal | string;
export type FormatOptions = {
    /** BCP 47 locale tag. Default `'en-US'`. */
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    useGrouping?: boolean;
    /** How digits beyond `maximumFractionDigits` are dropped. Default `'halfUp'`. */
    rounding?: Exclude<RoundingMode, 'unnecessary'>;
    signDisplay?: 'auto' | 'always' | 'exceptZero' | 'negative' | 'never';
};
export type CurrencyOptions = {
    currencyDisplay?: 'symbol' | 'narrowSymbol' | 'code' | 'name';
    /** Show negatives in accounting style: `($5.00)` instead of `-$5.00`. */
    accounting?: boolean;
} & FormatOptions;
export type CompactOptions = {
    /** `'short'` gives `1.2M`, `'long'` gives `1.2 million`. Default `'short'`. */
    display?: 'short' | 'long';
} & FormatOptions;
export type FileSizeOptions = {
    /** `'si'` uses powers of 1000 (`kB`), `'iec'` powers of 1024 (`KiB`). Default `'si'`. */
    system?: 'si' | 'iec';
} & FormatOptions;
/** Formats a number for display: `formatNumber(1234.5)` → `'1,234.5'`. Intl defaults: 0–3 fraction digits. */
export declare function formatNumber(value: FormatValue, options?: FormatOptions): string;
/**
 * Formats money. Fraction digits come from the currency (2 for USD, 0 for JPY)
 * unless overridden: `formatCurrency(1234.5, 'EUR', { locale: 'de-DE' })` → `'1.234,50 €'`.
 */
export declare function formatCurrency(value: FormatValue, currency: string, options?: CurrencyOptions): string;
/**
 * Formats a FRACTION as a percent. The input is a fraction, NOT a percentage:
 * `formatPercent(0.125)` → `'12.5%'`, while `formatPercent(12.5)` → `'1,250%'`.
 * Default 0–2 fraction digits.
 */
export declare function formatPercent(fraction: FormatValue, options?: FormatOptions): string;
/** Short or long compact form: `formatCompact(1230000)` → `'1.2M'`. Default max 1 fraction digit. */
export declare function formatCompact(value: FormatValue, options?: CompactOptions): string;
/**
 * Human file size: `formatFileSize(1536)` → `'1.5 kB'`. Picks the largest unit
 * where the value is at least 1. The number part is locale-aware; the unit label
 * is appended in English (`Intl` has no IEC units). Very large bigints lose
 * precision beyond 2^53, which is invisible at one fraction digit.
 * Rounding can show `'1000 kB'` for 999999 bytes; it does not promote to MB.
 */
export declare function formatFileSize(bytes: number | bigint, options?: FileSizeOptions): string;
export type Formatter = {
    formatNumber(value: FormatValue, options?: FormatOptions): string;
    formatPercent(value: FormatValue, options?: FormatOptions): string;
    formatCompact(value: FormatValue, options?: CompactOptions): string;
    formatFileSize(bytes: number | bigint, options?: FileSizeOptions): string;
    /** Uses the bound currency. */
    formatCurrency(value: FormatValue, options?: CurrencyOptions): string;
    /** An explicit currency overrides the bound one. */
    formatCurrency(value: FormatValue, currency: string, options?: CurrencyOptions): string;
};
/**
 * Binds a default locale (and optionally a currency) once. The defaults are
 * copied at creation, so later changes to the caller's object have no effect.
 * Per-call `locale` overrides the default; an explicit currency overrides the
 * bound one. Calls without per-call options reuse a pre-resolved
 * `Intl.NumberFormat` and skip cache-key building.
 * `formatCurrency` with no currency anywhere throws `InvalidArgumentError`.
 */
export declare function createFormatter(defaults: {
    locale?: string;
    currency?: string;
}): Formatter;
//# sourceMappingURL=format.d.ts.map