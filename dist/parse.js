/**
 * Locale-aware number parsing. `Intl` can format but not parse, so the
 * separators of a locale are read back from `formatToParts`.
 *
 * The locale decides what the separators mean: `'1.234'` is 1.234 in `en-US`
 * but 1234 in `de-DE`. Group separators are only removed, never validated, so
 * `'1,23,4'` is accepted in `en-US` and reads as 1234.
 */
import { decimal } from './decimal.js';
import { NumberFormatError, NumericRangeError } from './errors.js';
const DEFAULT_LOCALE = 'en-US';
// LRM, RLM and Arabic letter mark: invisible direction marks some locales put around signs.
const BIDI_MARKS = /[\u200E\u200F؜]/g;
const symbolCache = new Map();
/** The decimal, group and minus symbols and the digits a locale uses. Cached per locale. */
export function localeNumberSymbols(locale) {
    let symbols = symbolCache.get(locale);
    if (!symbols) {
        const parts = new Intl.NumberFormat(locale).formatToParts(-1_234_567.89);
        const find = (type, fallback) => parts.find(part => part.type === type)?.value ?? fallback;
        const plain = new Intl.NumberFormat(locale, { useGrouping: false });
        symbols = {
            decimal: find('decimal', '.'),
            group: find('group', ','),
            minusSign: find('minusSign', '-').replaceAll(BIDI_MARKS, ''),
            digits: Array.from({ length: 10 }, (_, digit) => plain.format(digit)),
        };
        symbolCache.set(locale, symbols);
    }
    return { ...symbols, digits: [...symbols.digits] };
}
const STRICT_DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
const OUTER_SPACE = /^[ \t\n\r\f\v\u00A0\u202F]+|[ \t\n\r\f\v\u00A0\u202F]+$/g;
const GROUP_SPACES = /[ \u00A0\u202F\u2009]/g;
function normalize(input, locale) {
    const symbols = localeNumberSymbols(locale);
    const digitMap = new Map(symbols.digits.map((digit, index) => [digit, String(index)]));
    let text = input.replaceAll(OUTER_SPACE, '').replaceAll(BIDI_MARKS, '');
    text = Array.from(text, char => digitMap.get(char) ?? char).join('');
    const group = symbols.group.replaceAll(BIDI_MARKS, '');
    text = /^\s$/.test(group) ? text.replaceAll(GROUP_SPACES, '') : text.split(group).join('');
    text = text.split(symbols.decimal).join('.');
    return text
        .split(symbols.minusSign)
        .join('-')
        .replaceAll(/[\u2212\u2013]/g, '-');
}
function normalizeOrThrow(input, locale) {
    if (typeof input !== 'string')
        throw new TypeError('input must be a string');
    const normalized = normalize(input, locale);
    if (!STRICT_DECIMAL.test(normalized)) {
        throw new NumberFormatError(`Cannot parse '${input}' as a number in locale '${locale}'`);
    }
    return normalized;
}
/** Parses a locale-formatted number: `parseNumber('1.234,56', { locale: 'de-DE' })` → `1234.56`. */
export function parseNumber(input, options = {}) {
    const locale = options.locale ?? DEFAULT_LOCALE;
    const result = Number(normalizeOrThrow(input, locale));
    if (!Number.isFinite(result)) {
        throw new NumericRangeError(`'${input}' is too large for a JS number; use parseDecimal`);
    }
    return result;
}
/** Like `parseNumber` but exact: every digit survives in the returned `Decimal`. */
export function parseDecimal(input, options = {}) {
    return decimal(normalizeOrThrow(input, options.locale ?? DEFAULT_LOCALE));
}
//# sourceMappingURL=parse.js.map