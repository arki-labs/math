/**
 * Helpers for ordinary JS numbers: the fast, approximate 80% case (UI, geometry,
 * charts). For money or anything that must be exact, use `@arki/math/decimal`.
 *
 * Every input must be finite; `NaN` and `±Infinity` throw rather than spread.
 * Results never carry `-0`.
 */
import type { Decimal } from './internal/exact.js';
import type { RoundingMode } from './rounding.js';
/** Interval notation: `[` / `]` include the bound, `(` / `)` exclude it. */
export type Bounds = '[]' | '[)' | '(]' | '()';
/**
 * Numbers from `start` up to but excluding `end`, `step` apart (default 1):
 * `range(5)` → `[0, 1, 2, 3, 4]`, `range(0, 1, 0.25)` → `[0, 0.25, 0.5, 0.75]`.
 * A negative `step` counts down (`range(3, 0, -1)` → `[3, 2, 1]`). Each element
 * is `start + i * step`, so fractional steps do not drift. A step pointing away
 * from `end` gives `[]`. Throws `InvalidArgumentError` for a zero or non-finite
 * step and `ResourceLimitError` past 10,000,000 elements.
 */
export declare function range(end: number): number[];
export declare function range(start: number, end: number, step?: number): number[];
/**
 * `count` evenly spaced numbers from `start` to `end`, both included:
 * `linspace(0, 1, 5)` → `[0, 0.25, 0.5, 0.75, 1]`. `count` 1 gives `[start]`,
 * 0 gives `[]`. The first element is exactly `start` and the last exactly `end`;
 * the span may exceed the float range (`linspace(-1e308, 1e308, 3)` works). Throws `InvalidArgumentError`
 * unless `count` is a non-negative safe integer and `ResourceLimitError` past
 * 10,000,000 elements.
 */
export declare function linspace(start: number, end: number, count: number): number[];
/** Limits `x` to `[min, max]`, both ends included. */
export declare function clamp(x: number, min: number, max: number): number;
/** Linear interpolation. `t` outside `[0, 1]` extrapolates. Exact at both ends. */
export declare function lerp(start: number, end: number, t: number): number;
/** The `t` for which `lerp(start, end, t) === x`. */
export declare function inverseLerp(start: number, end: number, x: number): number;
/** Maps `x` from one range onto another: `remap(5, 0, 10, 0, 100)` → `50`. */
export declare function remap(x: number, inStart: number, inEnd: number, outStart: number, outEnd: number): number;
/** Is `x` inside the interval? Defaults to `[min, max)`, the usual half-open range. */
export declare function inRange(x: number, min: number, max: number, bounds?: Bounds): boolean;
/**
 * Rounds the number you typed, not its binary approximation:
 * `round(1.005, 2)` is `1.01` (plain `Math.round(1.005 * 100) / 100` gives `1`).
 * Negative `places` round to tens, hundreds, ...
 *
 * Most calls take a float fast path that is proven to give the same result as
 * exact decimal rounding; only values within a few ulps of a tie (or of a whole
 * unit, for the directed modes) pay for the exact path.
 */
export declare function round(x: number, places?: number, mode?: RoundingMode): number;
/** Rounds to the nearest multiple of `step`, measured from zero: `roundTo(127.3, 5)` → `125`. */
export declare function roundTo(x: number, step: number, mode?: RoundingMode): number;
/**
 * Rounds to `digits` significant figures, on the number you typed:
 * `roundToSignificant(123_456, 2)` is `120000`, `roundToSignificant(0.012_345, 3)`
 * is `0.0123`. A number with fewer digits is returned as is (nothing is padded).
 * Works for every finite double, from subnormals to `6.02214076e23` and beyond:
 * the digits are those of the number's shortest decimal text, `String(x)`.
 * Throws `NumericRangeError` only when rounding up past the largest double
 * (`roundToSignificant(1.7976931348623157e308, 1)` would be `2e308`).
 */
export declare function roundToSignificant(x: number, digits: number, mode?: RoundingMode): number;
/**
 * Counts the significant figures in a written number by the textbook rules:
 * leading zeros never count, zeros between digits always count, and trailing
 * zeros count only when there is a decimal point.
 * `'1200'` → 2, `'1200.'` → 4, `'0.00120'` → 3, `'1.20e3'` → 3. The exponent
 * is ignored. Zero counts its written zeros after the point (`'0'` → 1, `'0.00'` → 2).
 * Pass the text (or a `Decimal`, whose scale is its written precision):
 * a JS number cannot tell `1.20` from `1.2`. Anything else throws `NumberFormatError`.
 */
export declare function significantDigits(value: string | Decimal): number;
/**
 * Tolerant equality for floats. `tolerance` is relative to the larger
 * magnitude (and absolute near zero), so it works for both `0.1 + 0.2 ≈ 0.3`
 * and `1e12 + 0.001 ≈ 1e12`.
 */
export declare function approxEqual(a: number, b: number, tolerance?: number): boolean;
//# sourceMappingURL=number.d.ts.map