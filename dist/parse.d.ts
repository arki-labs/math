/**
 * Locale-aware number parsing. `Intl` can format but not parse, so the
 * separators of a locale are read back from `formatToParts`.
 *
 * The locale decides what the separators mean: `'1.234'` is 1.234 in `en-US`
 * but 1234 in `de-DE`. Group separators are only removed, never validated, so
 * `'1,23,4'` is accepted in `en-US` and reads as 1234.
 */
import type { Decimal } from './decimal.js';
export type ParseOptions = {
    /** BCP 47 locale tag. Default `'en-US'`. */
    locale?: string;
};
export type LocaleNumberSymbols = {
    decimal: string;
    group: string;
    minusSign: string;
    /** The ten digits `0` to `9` as this locale writes them. */
    digits: string[];
};
/** The decimal, group and minus symbols and the digits a locale uses. Cached per locale. */
export declare function localeNumberSymbols(locale: string): LocaleNumberSymbols;
/** Parses a locale-formatted number: `parseNumber('1.234,56', { locale: 'de-DE' })` → `1234.56`. */
export declare function parseNumber(input: string, options?: ParseOptions): number;
/** Like `parseNumber` but exact: every digit survives in the returned `Decimal`. */
export declare function parseDecimal(input: string, options?: ParseOptions): Decimal;
//# sourceMappingURL=parse.d.ts.map