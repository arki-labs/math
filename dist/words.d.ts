/**
 * Numbers as words and ordinals — the part of Laravel's `Number::spell` /
 * `ordinal` that `Intl` never shipped. Grammar lives in per-locale rule
 * objects; English is built in, other locales are opt-in subpath imports
 * (`@arki/math/words/ro`, `/de`, `/fr`, `/es`, `/it`) so an app only bundles
 * the languages it uses. There is no registry and no global locale: pass the
 * rules you imported.
 */
import type { DecimalInput } from './decimal.js';
export type Gender = 'masculine' | 'feminine' | 'neuter';
export type WordsContext = {
    /** Grammatical gender of the thing being counted, where the language cares (`una`/`unu`, `première`/`premier`). */
    gender: Gender | undefined;
};
/**
 * The contract a locale implements. All inputs are non-negative integers;
 * the core handles sign, fractions and thresholds.
 *
 * Locales are objects you import (`import { ro } from '@arki/math/words/ro'`),
 * not Intl-style strings (`'ro'`). A string would need a registry that holds
 * every language's grammar, so every app would bundle all of them. An imported
 * object lets the bundler keep only the languages you actually reference.
 */
export type NumberWordsLocale = {
    /** BCP 47 tag, also used for digit formatting. */
    readonly code: string;
    /** The word placed before a negative number: `minus`. */
    readonly negative: string;
    /** The word read for the decimal separator: `point`, `virgulă`, `Komma`. */
    readonly decimalSeparator: string;
    /**
     * How many base-1000 groups the locale can spell (`en`: 12, up to 10^36 − 1).
     * The core rejects longer integers with `NumericRangeError` by digit count,
     * before any grouping work is done.
     */
    readonly maxGroups: number;
    /** Cardinal words for `n ≥ 0`. Throws `NumericRangeError` beyond the locale's largest scale word. */
    spell(n: bigint, context: WordsContext): string;
    /** Ordinal words for `n ≥ 1`: `twenty-first`, `al douăzeci și unulea`. */
    spellOrdinal(n: bigint, context: WordsContext): string;
    /** Ordinal with digits for `n ≥ 1`: `21st`, `21.`, `al 21-lea`. `digits` is `n` already formatted for the locale. */
    ordinal(n: bigint, digits: string, context: WordsContext): string;
};
export type SpellOptions = {
    locale?: NumberWordsLocale;
    gender?: Gender;
    /**
     * Numbers are spelled when `after < |value| ≤ until`; the rest come back as
     * formatted digits that keep the exact value (every fraction digit is kept).
     * `until` is the inclusive upper bound of the spelled range.
     */
    until?: number;
    /** The exclusive lower bound of the spelled range (see `until`). */
    after?: number;
};
export type OrdinalOptions = {
    locale?: NumberWordsLocale;
    gender?: Gender;
};
/**
 * Splits a non-negative integer into base-1000 groups, most significant
 * first: `1234567n` → `[1, 234, 567]`. The building block every locale uses.
 */
export declare function thousandsGroups(n: bigint): number[];
/**
 * `spellNumber(102)` → `'one hundred two'`; `spellNumber('3.14')` →
 * `'three point one four'`; `spellNumber(-5)` → `'minus five'`.
 * Fractions are read digit by digit, as people do. Numbers are read through
 * `decimal()`, so `0.1` is "zero point one", never its binary expansion.
 */
export declare function spellNumber(value: DecimalInput, options?: SpellOptions): string;
/** `spellOrdinal(21)` → `'twenty-first'`. Positive integers only. */
export declare function spellOrdinal(value: DecimalInput, options?: OrdinalOptions): string;
/** `formatOrdinal(21)` → `'21st'`; `formatOrdinal(1000)` → `'1,000th'`. Positive integers only. */
export declare function formatOrdinal(value: DecimalInput, options?: OrdinalOptions): string;
/** American English: `one hundred two`, `two thousand twenty-six`. */
export declare const en: NumberWordsLocale;
/** British English: `one hundred and two`, `one thousand and five`. */
export declare const enGB: NumberWordsLocale;
//# sourceMappingURL=words.d.ts.map