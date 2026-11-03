/**
 * Locale-aware number parsing. `Intl` can format but not parse, so the
 * separators of a locale are read back from `formatToParts`.
 *
 * `parseNumber` / `parseDecimal` are the LENIENT, locale-aware parsers: they
 * accept the locale's digits, group separators, decimal mark, Unicode minus and
 * surrounding spaces. `decimal()` from `./decimal.js` is the STRICT ASCII parser
 * (`'1234.56'` only, `.` as decimal mark, no grouping); use it for data you
 * control (APIs, storage) and these for text a person typed.
 *
 * The locale decides what the separators mean: `'1.234'` is 1.234 in `en-US`
 * but 1234 in `de-DE`. Group separators are only removed, never validated, so
 * `'1,23,4'` is accepted in `en-US` and reads as 1234.
 *
 * Parsers return, they do not throw: text that is not a number returns the
 * `InvalidNumber` failure, a value past the limits returns `NumberOutOfRange`.
 * Runtimes without `Intl.NumberFormat#formatToParts` (React Native's Hermes on
 * iOS) throw `UnsupportedFeatureError`, a setup fault; pass `symbols` to parse without `Intl`.
 */
import { Decimal } from './decimal.js';
export type ParseOptions = {
    /** BCP 47 locale tag. Default `'en-US'`. Ignored when `symbols` is given. */
    locale?: string;
    /**
     * The separators to read, instead of asking `Intl` for the locale's:
     * `{ decimal: ',', group: '.' }`. Minus defaults to `'-'`, digits to ASCII.
     */
    symbols?: ParseSymbols;
};
export type ParseSymbols = {
    decimal: string;
    group: string;
    minusSign?: string;
    /** The ten digits `0` to `9`. Default ASCII. */
    digits?: readonly string[];
};
export type LocaleNumberSymbols = {
    decimal: string;
    group: string;
    minusSign: string;
    /** The ten digits `0` to `9` as this locale writes them. */
    digits: string[];
};
/** The decimal, group and minus symbols and the digits a locale uses. Cached per locale. */
export declare function localeNumberSymbols(requested: string): LocaleNumberSymbols;
/**
 * Parses a locale-formatted number: `parseNumber('1.234,56', { locale: 'de-DE' })` → `1234.56`.
 * Lenient and locale-aware. Returns `InvalidNumber` for text that is not a number in the locale,
 * and `NumberOutOfRange` past the float range (use `parseDecimal` to keep every digit).
 */
export declare function parseNumber(input: string, options?: ParseOptions): number | import("@arki/failure").Failure<"math.invalid_number", undefined> | import("@arki/failure").Failure<"math.number_out_of_range", undefined>;
/**
 * Like `parseNumber` (lenient, locale-aware) but exact: every digit survives in the returned `Decimal`.
 * Returns `InvalidNumber` for text that is not a number, `NumberOutOfRange` past 10 000 digits or a scale of ±10 000.
 */
export declare function parseDecimal(input: string, options?: ParseOptions): Decimal | import("@arki/failure").Failure<"math.invalid_number", undefined> | import("@arki/failure").Failure<"math.number_out_of_range", undefined>;
//# sourceMappingURL=parse.d.ts.map