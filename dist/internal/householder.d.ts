/**
 * Householder QR kernels shared by `linear-algebra` (`qrDecompose`,
 * `leastSquares`) and `stats` (`polynomialRegression`).
 *
 * A matrix is held by columns: `columns[j]` is column `j` of an `m×n` matrix,
 * a `Float64Array` of length `m` (callers allocate them as views on one
 * buffer). Every hot loop then walks one contiguous column, and a column
 * swap is a swap of two references. Callers scale the input first (by a power
 * of two, or to unit column norms) so the plain sums of squares below cannot
 * overflow.
 *
 * After `householderQr`, the LAPACK `dgeqp3` layout holds: for `i ≤ j`,
 * `columns[j][i]` is `r_ij` of `R`; below the diagonal, `columns[j][j+1..]`
 * is the tail of the `j`-th Householder vector (its head is an implied 1).
 */
export type HouseholderQr = {
    /** `τ` of each reflector `H_k = I − τ_k·v_k·v_kᵀ`; `0` means `H_k = I`. */
    tau: Float64Array;
    /** `columns[j]` now holds original column `permutation[j]`. */
    permutation: number[];
};
/**
 * Factors `A·P = Q·R` in place, with Householder reflectors. With `pivoting`,
 * each step moves the remaining column of largest norm to the front (LAPACK
 * `dgeqp3`), so `|r_kk|` falls along the diagonal and reveals the numerical
 * rank; the partial column norms are downdated, and recomputed when the
 * downdate has cancelled too far (the `dlaqp2` safeguard).
 */
export declare function householderQr(columns: Float64Array[], m: number, pivoting: boolean): HouseholderQr;
/** Overwrites `y` (length `m`) with `Qᵀ·y`, from the reflectors `householderQr` left in `columns`. */
export declare function applyQTranspose(columns: readonly Float64Array[], tau: Float64Array, m: number, y: Float64Array): void;
/**
 * Solves `R₁₁·z = c` for the leading `size×size` block of `R` in place
 * (`c` becomes `z`), column by column so each inner loop walks one column.
 */
export declare function backSubstitute(columns: readonly Float64Array[], size: number, c: Float64Array): void;
//# sourceMappingURL=householder.d.ts.map