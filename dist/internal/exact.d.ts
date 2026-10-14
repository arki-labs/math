/**
 * `Decimal` and `Rational` live in one file because each converts to the
 * other (`toRational()` / `toDecimal()`); two modules importing each other
 * would create a load-order cycle. The public entry points are
 * `../decimal.ts` and `../rational.ts`.
 */
import type { RoundingMode } from '../rounding.js';
import type { ScaleOptions } from './fraction.js';
export type { ScaleOptions } from './fraction.js';
export type DecimalInput = Decimal | string | number | bigint;
export type RationalInput = Rational | DecimalInput;
export type IntegerInput = string | number | bigint;
/**
 * An exact finite decimal: `coefficient × 10^-scale`. The scale is retained,
 * so `'1.10'` stays `1.10` and `'1.10' × 3` is `3.30` — what a
 * person expects from money and measurements. Equality is numeric:
 * `decimal('1.0').eq('1.00')` is `true`.
 *
 * Immutable: methods never modify their operands and the fields are `readonly`.
 * Instances are not frozen — `Object.freeze` per result cost 5–7× in hot loops,
 * and no peer library (decimal.js, big.js, fraction.js, complex.js) freezes —
 * but the shared constants arithmetic can return are frozen.
 */
export declare class Decimal {
    readonly coefficient: bigint;
    readonly scale: number;
    private constructor();
    static from(value: DecimalInput): Decimal;
    /** Exact sum; accumulates one coefficient instead of allocating a Decimal per element. */
    static sum(values: Iterable<DecimalInput>): Decimal;
    /** Comparator for sorting: `prices.sort(Decimal.compare)`. */
    static compare(a: DecimalInput, b: DecimalInput): -1 | 0 | 1;
    static max(first: DecimalInput, ...rest: DecimalInput[]): Decimal;
    static min(first: DecimalInput, ...rest: DecimalInput[]): Decimal;
    plus(other: DecimalInput): Decimal;
    minus(other: DecimalInput): Decimal;
    times(other: DecimalInput): Decimal;
    /**
     * Exact when the result terminates (`1 ÷ 8 = 0.125`). When it does not
     * (`1 ÷ 3`), throws `RoundingNecessaryError` unless you say how to round:
     * `dividedBy(3, { scale: 4, rounding: 'halfEven' })`.
     */
    dividedBy(other: DecimalInput, options?: ScaleOptions): Decimal;
    /** Remainder with the sign of the dividend, like JavaScript's `%`. */
    mod(other: DecimalInput): Decimal;
    /** Integer exponent. Negative exponents must terminate (`2^-2 = 0.25`) or they throw. */
    pow(exponent: number): Decimal;
    abs(): Decimal;
    negated(): Decimal;
    /**
     * Changes the number of fraction digits. Adding digits is always exact;
     * dropping non-zero digits needs a rounding mode or it throws.
     */
    toScale(scale: number, rounding?: RoundingMode): Decimal;
    /** `toScale` with the display-friendly default: half-up. `round(2)` on `1.005` gives `1.01`. */
    round(places?: number, rounding?: RoundingMode): Decimal;
    /**
     * Rounds to `digits` significant figures: `decimal('123456').roundToSignificant(2)` → `120000`,
     * `decimal('0.012345').roundToSignificant(3)` → `0.0123`. Fewer digits than that are left as is. Default half-up.
     */
    roundToSignificant(digits: number, rounding?: RoundingMode): Decimal;
    /** Rounds to the nearest multiple of `step`: `decimal('1.23').roundTo('0.05')` → `1.25`. Default half-up. */
    roundTo(step: DecimalInput, rounding?: RoundingMode): Decimal;
    /** Drops trailing zeros: `1.500` → `1.5`, `2.00` → `2`. */
    trim(): Decimal;
    compareTo(other: DecimalInput): -1 | 0 | 1;
    eq(other: DecimalInput): boolean;
    lt(other: DecimalInput): boolean;
    lte(other: DecimalInput): boolean;
    gt(other: DecimalInput): boolean;
    gte(other: DecimalInput): boolean;
    isZero(): boolean;
    isPositive(): boolean;
    isNegative(): boolean;
    isInteger(): boolean;
    sign(): -1 | 0 | 1;
    /** Plain notation, never exponent form: `'0.000001'`, `'-12.30'`. */
    toString(): string;
    /** Like `Number.prototype.toFixed`, but on the exact value and with a chosen rounding mode. */
    toFixed(places: number, rounding?: RoundingMode): string;
    /** The nearest double. Throws if that would overflow or collapse a non-zero value to zero. */
    toNumber(): number;
    /** Requires an integral value; round first if needed. */
    toBigInt(): bigint;
    toRational(): Rational;
    toJSON(): string;
    /** Throws. A `Decimal` never silently becomes a float. */
    valueOf(): never;
    [Symbol.toPrimitive](hint: 'string' | 'number' | 'default'): string;
    readonly [Symbol.toStringTag] = "Decimal";
}
export declare function decimal(value: DecimalInput): Decimal;
export declare function isDecimal(value: unknown): value is Decimal;
/** A mixed number: `7/2` is `{ whole: 3n, fraction: 1/2 }`. The fraction carries the sign of the value. */
export type MixedNumber = {
    whole: bigint;
    fraction: Rational;
};
/**
 * An exact fraction of two bigints, always reduced, denominator always
 * positive, zero always `0/1`. Where `Decimal` must throw (`1 ÷ 3`), a
 * `Rational` just keeps going.
 *
 * Immutable: methods never modify their operands and the fields are `readonly`.
 * Instances are not frozen — `Object.freeze` per result cost 5–7× in hot loops,
 * and no peer library (decimal.js, big.js, fraction.js, complex.js) freezes —
 * but the shared constants arithmetic can return are frozen.
 */
export declare class Rational {
    readonly numerator: bigint;
    readonly denominator: bigint;
    private constructor();
    /** Normalizes sign and reduces by the GCD. */
    static fromParts(numerator: bigint, denominator: bigint): Rational;
    static from(value: RationalInput): Rational;
    /** Knuth's addition: reduce through the denominators' GCD instead of the full product. */
    plus(other: RationalInput): Rational;
    minus(other: RationalInput): Rational;
    /** Cross-cancels before multiplying, so the products never carry common factors. */
    times(other: RationalInput): Rational;
    /** Cross-cancels like `times`, so the result is reduced before its size is checked. */
    dividedBy(other: RationalInput): Rational;
    /** Integer exponent; negative exponents invert. */
    pow(exponent: number): Rational;
    /** The reciprocal: `2/3` → `3/2`. */
    inverse(): Rational;
    abs(): Rational;
    negated(): Rational;
    /**
     * The closest fraction whose denominator is at most `maxDenominator`
     * (continued-fraction search, like Python's `limit_denominator`):
     * `ratio('3.14159').approximate(1000)` → `355/113`.
     */
    approximate(maxDenominator: IntegerInput): Rational;
    compareTo(other: RationalInput): -1 | 0 | 1;
    eq(other: RationalInput): boolean;
    lt(other: RationalInput): boolean;
    lte(other: RationalInput): boolean;
    gt(other: RationalInput): boolean;
    gte(other: RationalInput): boolean;
    isZero(): boolean;
    isPositive(): boolean;
    isNegative(): boolean;
    isInteger(): boolean;
    sign(): -1 | 0 | 1;
    /** Exact when the fraction terminates; otherwise needs `{ scale, rounding }` or it throws. */
    toDecimal(options?: ScaleOptions): Decimal;
    /** `7/2` → `{ whole: 3n, fraction: 1/2 }`; `-7/2` → `{ whole: -3n, fraction: -1/2 }`. */
    toMixed(): MixedNumber;
    /**
     * The nearest double, ties to even, by rounding in binary (never through a
     * decimal string, which could round twice). Throws on overflow, or when a
     * non-zero value would underflow to zero.
     */
    toNumber(): number;
    /** Requires an integral value. */
    toBigInt(): bigint;
    /** `'1/3'`, `'-7/2'`, or just `'4'` for integers. */
    toString(): string;
    toJSON(): string;
    /** Throws. A `Rational` never silently becomes a float. */
    valueOf(): never;
    [Symbol.toPrimitive](hint: 'string' | 'number' | 'default'): string;
    readonly [Symbol.toStringTag] = "Rational";
}
export declare function ratio(value: RationalInput): Rational;
export declare function ratio(numerator: IntegerInput, denominator: IntegerInput): Rational;
export declare function isRational(value: unknown): value is Rational;
//# sourceMappingURL=exact.d.ts.map