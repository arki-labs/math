/**
 * Numbers as words and ordinals — the part of Laravel's `Number::spell` /
 * `ordinal` that `Intl` never shipped. Grammar lives in per-locale rule
 * objects; English is built in, other locales are opt-in subpath imports
 * (`@arki/math/words/ro`, `/de`, `/fr`, `/es`, `/it`) so an app only bundles
 * the languages it uses. There is no registry and no global locale: pass the
 * rules you imported.
 */
import { Decimal } from './decimal.js';
import { InvalidArgumentError, NumericRangeError } from './errors.js';
import { formatNumber } from './format.js';
/**
 * Splits a non-negative integer into base-1000 groups, most significant
 * first: `1234567n` → `[1, 234, 567]`. The building block every locale uses.
 */
export function thousandsGroups(n) {
    if (n < 0n)
        throw new InvalidArgumentError('thousandsGroups expects a non-negative integer');
    if (n === 0n)
        return [0];
    const groups = [];
    while (n > 0n) {
        groups.unshift(Number(n % 1000n));
        n /= 1000n;
    }
    return groups;
}
function toInteger(value, name) {
    if (typeof value === 'bigint')
        return value;
    const d = Decimal.from(value);
    if (!d.isInteger())
        throw new InvalidArgumentError(`${name} must be an integer, got ${d.toString()}`);
    return d.toBigInt();
}
/**
 * `spellNumber(102)` → `'one hundred two'`; `spellNumber('3.14')` →
 * `'three point one four'`; `spellNumber(-5)` → `'minus five'`.
 * Fractions are read digit by digit, as people do. Numbers are read through
 * `decimal()`, so `0.1` is "zero point one", never its binary expansion.
 */
export function spellNumber(value, options = {}) {
    const locale = options.locale ?? en;
    const context = { gender: options.gender };
    const d = Decimal.from(value).trim();
    const magnitude = d.abs();
    if (options.until !== undefined && magnitude.gt(options.until))
        return formatNumber(d, { locale: locale.code });
    if (options.after !== undefined && magnitude.lte(options.after))
        return formatNumber(d, { locale: locale.code });
    const integer = magnitude.toScale(0, 'down').toBigInt();
    const words = [locale.spell(integer, context)];
    if (magnitude.scale > 0) {
        const text = magnitude.toString();
        const fraction = text.slice(text.indexOf('.') + 1);
        words.push(locale.decimalSeparator, ...[...fraction].map(digit => locale.spell(BigInt(digit), context)));
    }
    if (d.isNegative())
        words.unshift(locale.negative);
    return words.join(' ');
}
/** `spellOrdinal(21)` → `'twenty-first'`. Positive integers only. */
export function spellOrdinal(value, options = {}) {
    const n = toInteger(value, 'value');
    if (n < 1n)
        throw new InvalidArgumentError(`Ordinals start at 1, got ${n}`);
    return (options.locale ?? en).spellOrdinal(n, { gender: options.gender });
}
/** `formatOrdinal(21)` → `'21st'`; `formatOrdinal(1000)` → `'1,000th'`. Positive integers only. */
export function formatOrdinal(value, options = {}) {
    const n = toInteger(value, 'value');
    if (n < 1n)
        throw new InvalidArgumentError(`Ordinals start at 1, got ${n}`);
    const locale = options.locale ?? en;
    return locale.ordinal(n, formatNumber(n, { locale: locale.code }), { gender: options.gender });
}
// ---------------------------------------------------------------------------
// English (built in)
// ---------------------------------------------------------------------------
const EN_ONES = [
    'zero',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
];
const EN_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
/** Short scale, up to 10^36 − 1. */
const EN_SCALES = [
    '',
    'thousand',
    'million',
    'billion',
    'trillion',
    'quadrillion',
    'quintillion',
    'sextillion',
    'septillion',
    'octillion',
    'nonillion',
    'decillion',
];
const EN_ORDINAL_IRREGULAR = {
    one: 'first',
    two: 'second',
    three: 'third',
    five: 'fifth',
    eight: 'eighth',
    nine: 'ninth',
    twelve: 'twelfth',
};
function enBelowHundred(n) {
    if (n < 20)
        return EN_ONES[n];
    const unit = n % 10;
    return unit === 0 ? EN_TENS[Math.floor(n / 10)] : `${EN_TENS[Math.floor(n / 10)]}-${EN_ONES[unit]}`;
}
function enGroup(n, and) {
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    if (hundreds === 0)
        return enBelowHundred(rest);
    if (rest === 0)
        return `${EN_ONES[hundreds]} hundred`;
    return `${EN_ONES[hundreds]} hundred ${and ? 'and ' : ''}${enBelowHundred(rest)}`;
}
function enSpell(n, and) {
    if (n === 0n)
        return 'zero';
    const groups = thousandsGroups(n);
    if (groups.length > EN_SCALES.length) {
        throw new NumericRangeError(`${n} is beyond the largest English scale word (decillion)`);
    }
    const words = [];
    for (const [index, group] of groups.entries()) {
        if (group === 0)
            continue;
        const isLast = index === groups.length - 1;
        const needsAnd = and && isLast && words.length > 0 && group < 100;
        const scale = EN_SCALES[groups.length - 1 - index];
        words.push(`${needsAnd ? 'and ' : ''}${enGroup(group, and)}${scale ? ` ${scale}` : ''}`);
    }
    return words.join(' ');
}
function enOrdinalWord(word) {
    const irregular = EN_ORDINAL_IRREGULAR[word];
    if (irregular)
        return irregular;
    if (word.endsWith('y'))
        return `${word.slice(0, -1)}ieth`;
    return `${word}th`;
}
function enSpellOrdinal(n, and) {
    const cardinal = enSpell(n, and);
    // Only the last word changes: "twenty-one" → "twenty-first", "one hundred" → "one hundredth".
    const separator = Math.max(cardinal.lastIndexOf(' '), cardinal.lastIndexOf('-'));
    return cardinal.slice(0, separator + 1) + enOrdinalWord(cardinal.slice(separator + 1));
}
const EN_SUFFIX = {
    one: 'st',
    two: 'nd',
    few: 'rd',
    other: 'th',
    zero: 'th',
    many: 'th',
};
const enPlural = new Intl.PluralRules('en', { type: 'ordinal' });
function enOrdinal(n, digits) {
    // PluralRules takes a number; only the last two digits decide the suffix.
    return `${digits}${EN_SUFFIX[enPlural.select(Number(n % 100n))]}`;
}
/** American English: `one hundred two`, `two thousand twenty-six`. */
export const en = {
    code: 'en-US',
    negative: 'minus',
    decimalSeparator: 'point',
    spell: n => enSpell(n, false),
    spellOrdinal: n => enSpellOrdinal(n, false),
    ordinal: (n, digits) => enOrdinal(n, digits),
};
/** British English: `one hundred and two`, `one thousand and five`. */
export const enGB = {
    code: 'en-GB',
    negative: 'minus',
    decimalSeparator: 'point',
    spell: n => enSpell(n, true),
    spellOrdinal: n => enSpellOrdinal(n, true),
    ordinal: (n, digits) => enOrdinal(n, digits),
};
//# sourceMappingURL=words.js.map