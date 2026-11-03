/** A finite decimal as `coefficient × 10^-scale`, scale ≥ 0. */
export type DecimalParts = {
    coefficient: bigint;
    scale: number;
};
/**
 * Strict ASCII decimal syntax: optional sign, digits, optional fraction,
 * optional exponent. No whitespace, grouping, localized separators, hex,
 * `Infinity` or `NaN` — those belong to `@arki/math/parse`. Returns
 * `InvalidNumber` for other text and `NumberOutOfRange` past the digit or
 * scale limit; builders go through {@link decimalParts}, which throws.
 */
export declare function parseDecimalString(input: string): DecimalParts | import("@arki/failure").Failure<"math.invalid_number", undefined> | import("@arki/failure").Failure<"math.number_out_of_range", undefined>;
/** The builders' strict parse: {@link parseDecimalString}, with its failures thrown as the errors builders document. */
export declare function decimalParts(input: string): DecimalParts;
/**
 * A JS number is read through its shortest decimal spelling, so
 * `0.1` means exactly 1/10 — what the developer wrote, not the binary
 * approximation. It cannot undo earlier float arithmetic: `0.1 + 0.2` is
 * already `0.30000000000000004` by the time it gets here.
 */
export declare function partsFromNumber(value: number): DecimalParts;
export declare function partsFromBigInt(value: bigint): DecimalParts;
//# sourceMappingURL=parse.d.ts.map