/**
 * Immutable fluent wrapper for ordinary JS numbers, the counterpart of
 * `str()` in `@arki/string`. Arithmetic here is float arithmetic — fast and
 * approximate. Hop to the exact types with `.toDecimal()` / `.toRatio()`
 * when a result must be exact. Extract with `.value()`.
 */
import type { InvalidCurrencyFailure } from './errors.js';
import type { CompactOptions, CurrencyOptions, FormatOptions } from './format.js';
import type { Bounds } from './number.js';
import type { RoundingMode } from './rounding.js';
import { Decimal, Rational } from './internal/exact.js';
export declare class NumberValue {
    #private;
    constructor(value: number);
    plus(other: number): NumberValue;
    minus(other: number): NumberValue;
    times(other: number): NumberValue;
    dividedBy(other: number): NumberValue;
    abs(): NumberValue;
    negated(): NumberValue;
    clamp(min: number, max: number): NumberValue;
    lerp(end: number, t: number): NumberValue;
    remap(inStart: number, inEnd: number, outStart: number, outEnd: number): NumberValue;
    round(places?: number, mode?: RoundingMode): NumberValue;
    roundTo(step: number, mode?: RoundingMode): NumberValue;
    inRange(min: number, max: number, bounds?: Bounds): boolean;
    approxEqual(other: number, tolerance?: number): boolean;
    isZero(): boolean;
    isPositive(): boolean;
    isNegative(): boolean;
    isInteger(): boolean;
    formatNumber(options?: FormatOptions): string;
    /** A malformed currency code returns `InvalidCurrency`. */
    formatCurrency(currency: string, options?: CurrencyOptions): string | InvalidCurrencyFailure;
    /** The wrapped value is a fraction: `num(0.125).formatPercent()` → `'12.5%'`. */
    formatPercent(options?: FormatOptions): string;
    formatCompact(options?: CompactOptions & {
        currency?: undefined;
    }): string;
    /** With `currency` the result is compact money, and a malformed code returns `InvalidCurrency`. */
    formatCompact(options: CompactOptions): string | InvalidCurrencyFailure;
    /** Exact decimal of the shortest spelling: `num(0.1).toDecimal()` is exactly 1/10. */
    toDecimal(): Decimal;
    toRatio(): Rational;
    value(): number;
    toString(): string;
    toJSON(): number;
    /** Throws. Use `.value()`; implicit coercion hides the wrapper's boundary. */
    valueOf(): never;
    [Symbol.toPrimitive](hint: 'string' | 'number' | 'default'): string;
    readonly [Symbol.toStringTag] = "NumberValue";
}
export declare function num(value: number): NumberValue;
//# sourceMappingURL=fluent.d.ts.map