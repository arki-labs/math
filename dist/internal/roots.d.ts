/**
 * Integer n-th roots for `decimal-math` and `finance`. Shared here so a caller that
 * adds its own guard digits (finance's `nominalRate`) can take a root without
 * building it as a Decimal: guard digits are exact intermediates, not results,
 * and do not count against the 10 000-digit result cap.
 */
/** ⌊value^(1/k)⌋ for value ≥ 0, by Newton's iteration from a float seed above the root. */
export declare function integerRoot(value: bigint, k: number): bigint;
export declare function assertRadicandSize(digits: number): void;
/**
 * ⌊x^(1/n) × 10^precision⌋ for x = magnitude × 10^-scale ≥ 0, and whether that
 * truncation is the exact root. Fixed point: the bigint stands for root × 10^-precision.
 */
export declare function rootAt(magnitude: bigint, scale: number, n: number, precision: number): {
    root: bigint;
    exact: boolean;
};
//# sourceMappingURL=roots.d.ts.map