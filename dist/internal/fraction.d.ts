import type { RoundingMode } from '../rounding.js';
import type { DecimalParts } from './parse.js';
export type ScaleOptions = {
    /** Number of fraction digits in the result. */
    scale: number;
    /** How to drop digits that do not fit. Defaults to `'unnecessary'`, which throws instead. */
    rounding?: RoundingMode;
};
export declare function assertScale(scale: number): void;
/**
 * Turns `numerator / denominator` into decimal parts.
 *
 * With `options.scale` the result has exactly that many fraction digits,
 * rounded as requested. Without it, the result is the shortest decimal that
 * is exactly equal — and if no finite decimal is (1/3, 2/7, ...), it throws
 * rather than round behind the caller's back.
 */
export declare function fractionToDecimalParts(numerator: bigint, denominator: bigint, options?: ScaleOptions): DecimalParts;
//# sourceMappingURL=fraction.d.ts.map