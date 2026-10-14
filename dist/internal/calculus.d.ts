/**
 * Shared argument checks for the numerical calculus modules (`roots`,
 * `integrate`, `differentiate`). Every user function is called through `call`,
 * so a `NaN` or `±Infinity` from it becomes a typed error that names the point,
 * never a silently wrong result.
 */
/** A real function of one real variable, evaluated on float64. */
export type RealFunction = (x: number) => number;
export declare function assertFunction(f: unknown, name: string): asserts f is RealFunction;
/** `f(x)`, which must be a finite number. */
export declare function call(f: RealFunction, x: number, name?: string): number;
/** A `[lower, upper]` pair of numbers, never `NaN`; infinities only when `allowInfinite`. Order is the caller's rule. */
export declare function readBounds(bounds: unknown, name: string, allowInfinite: boolean): [number, number];
/** A finite, non-negative tolerance, or `fallback` when omitted. */
export declare function readTolerance(value: number | undefined, name: string, fallback: number): number;
/** A positive safe integer (an iteration or evaluation budget), or `fallback` when omitted. */
export declare function readCount(value: number | undefined, name: string, fallback: number): number;
/** A finite, strictly positive number (a step length), or `fallback` when omitted. */
export declare function readStep(value: number | undefined, name: string, fallback: number): number;
/** `+0` for `-0`; every other value unchanged. */
export declare function noNegativeZero(value: number): number;
//# sourceMappingURL=calculus.d.ts.map