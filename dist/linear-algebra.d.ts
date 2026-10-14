/**
 * Lean dense linear algebra over plain JS numbers (float64): vectors, small to
 * medium matrices, LU with partial pivoting. For symbolic algebra, sparse
 * storage or eigenvalues, reach for a full CAS such as mathjs.
 *
 * **Representation.** Vectors are `readonly number[]` and matrices are
 * `readonly (readonly number[])[]` (an array of rows), not a `Matrix` class.
 * Plain arrays cost nothing to create, serialize to JSON as-is, and pass
 * straight to charts, other libraries and API payloads. A
 * class would add an allocation and a conversion at every boundary and buy
 * only cached shape checks, which are O(n·m) against O(n³) for the work that
 * matters. The `readonly` input types promise that nothing is modified; every
 * result is a fresh `number[]` / `number[][]` that never aliases an input.
 *
 * **Validation.** Every call checks its inputs: arrays only (`TypeError`
 * otherwise), non-empty, rectangular, finite entries, matching dimensions
 * (`InvalidArgumentError` otherwise). A result that overflows to `±Infinity`
 * throws `NumericRangeError`. Results never carry `NaN` or `-0`.
 *
 * **Tolerance.** `solve` and `inverse` factor `A` as `P·A = L·U` with partial
 * pivoting and throw `SingularMatrixError` when a pivot satisfies
 * `|u_kk| <= n · Number.EPSILON · ‖A‖∞` (‖A‖∞ = largest absolute row sum).
 * That is the point where the matrix is singular to working precision: a
 * perturbation of `A` the size of its own rounding error could make it
 * exactly singular. `rank` counts pivots above `max(m, n) · Number.EPSILON ·
 * ‖A‖∞`, the same rule NumPy's `matrix_rank` applies to singular values. Each
 * function takes `{ tolerance }` to replace the default with an absolute
 * threshold. `determinant` never throws for a singular matrix; it returns the
 * product of the pivots, which may be tiny rather than exactly zero.
 * Gaussian elimination is a fast, good-enough rank test; for rank decisions on
 * badly conditioned data, use an SVD.
 */
/** A vector: a non-empty array of finite numbers. */
export type Vector = readonly number[];
/** A matrix: a non-empty array of equally long, non-empty rows of finite numbers. */
export type Matrix = readonly Vector[];
export type ToleranceOptions = {
    /**
     * Absolute pivot threshold. A pivot whose magnitude is at or below it
     * counts as zero. Defaults to the size-and-norm-relative rule in the module
     * docs; `0` treats only exact zeros as zero.
     */
    tolerance?: number;
};
/** `P·A = L·U`, from `luDecompose`. */
export type LuDecomposition = {
    /** Unit lower-triangular factor `L` (ones on the diagonal). */
    lower: number[][];
    /** Upper-triangular factor `U`; a zero (or tiny) diagonal entry means `A` is singular. */
    upper: number[][];
    /** Row `i` of `P·A` is row `permutation[i]` of `A`. */
    permutation: number[];
    /** Sign of the permutation: `1` for an even number of row swaps, `-1` for odd. */
    sign: 1 | -1;
};
/** Dot product `Σ aᵢ·bᵢ`. Throws `InvalidArgumentError` for different lengths. */
export declare function dot(a: Vector, b: Vector): number;
/** Cross product of two 3-vectors; perpendicular to both, right-handed. */
export declare function cross(a: Vector, b: Vector): number[];
/**
 * The p-norm `(Σ |vᵢ|^p)^(1/p)`: Euclidean length by default, `1` for the
 * taxicab sum, `Infinity` for the largest magnitude. `p` must be at least 1
 * (below 1 it is not a norm). Scaled by the largest magnitude first, so
 * `norm([3e200, 4e200])` is `5e200` instead of overflowing.
 */
export declare function norm(v: Vector, p?: number): number;
/** The unit vector in the direction of `v`. Throws `DivisionByZeroError` for the zero vector. */
export declare function normalize(v: Vector): number[];
/**
 * The angle between two vectors in radians, in `[0, π]`. Uses Kahan's
 * `2·atan2(‖û − v̂‖, ‖û + v̂‖)` on the unit vectors, which stays accurate for
 * nearly parallel and nearly opposite vectors where `acos(cos θ)` loses half
 * its digits. Throws `DivisionByZeroError` if either vector is zero.
 */
export declare function angleBetween(a: Vector, b: Vector): number;
/**
 * The vector projection of `v` onto `onto`: `(v·onto / onto·onto)·onto`.
 * Throws `DivisionByZeroError` when `onto` is the zero vector.
 */
export declare function projection(v: Vector, onto: Vector): number[];
/** Element-wise sum of two vectors, or of two matrices of the same shape. */
export declare function plus(a: Vector, b: Vector): number[];
export declare function plus(a: Matrix, b: Matrix): number[][];
/** Element-wise difference `a − b` of two vectors, or of two matrices of the same shape. */
export declare function minus(a: Vector, b: Vector): number[];
export declare function minus(a: Matrix, b: Matrix): number[][];
/** Every element multiplied by the scalar `k`. For the matrix product, see `multiply`. */
export declare function times(a: Vector, k: number): number[];
export declare function times(a: Matrix, k: number): number[][];
/**
 * A validated copy of `rows`: throws unless it is a non-empty, rectangular
 * array of non-empty rows of finite numbers. Use it at a trust boundary
 * (parsed JSON, user input); every other function validates on its own.
 */
export declare function matrix(rows: Matrix): number[][];
/** The `n × n` identity matrix. Throws `ResourceLimitError` past 10,000,000 elements. */
export declare function identity(n: number): number[][];
/** Rows become columns: `transpose(A)[j][i] === A[i][j]`. */
export declare function transpose(a: Matrix): number[][];
/** Sum of the diagonal of a square matrix. */
export declare function trace(a: Matrix): number;
/**
 * The matrix product `A·B` (`m×n` times `n×p` gives `m×p`), or the
 * matrix-vector product `A·v` (an `m`-vector). For a row vector times a
 * matrix, use `multiply(transpose(A), v)`. For scaling by a number, see
 * `times`.
 */
export declare function multiply(a: Matrix, b: Matrix): number[][];
export declare function multiply(a: Matrix, b: Vector): number[];
/**
 * `P·A = L·U` for a square matrix, with partial pivoting (the largest
 * remaining entry in each column becomes the pivot, so every multiplier in `L`
 * has magnitude at most 1). Never throws for a singular matrix: `upper` then
 * has a zero, or tiny, diagonal entry.
 */
export declare function luDecompose(a: Matrix): LuDecomposition;
/**
 * The determinant, as `sign(P) · Π u_kk` from an LU factorization: O(n³),
 * where cofactor expansion is O(n!). A singular matrix gives `0` or a value
 * tiny next to the entries; it never throws for that. Throws
 * `NumericRangeError` if the product overflows.
 */
export declare function determinant(a: Matrix): number;
/**
 * Solves `A·x = b` for a square `A`, by LU with partial pivoting. `b` is a
 * vector (gives `x`) or a matrix of right-hand-side columns (gives a matrix
 * of solution columns). Throws `SingularMatrixError` when `A` is singular to
 * working precision; see the module docs for the tolerance.
 */
export declare function solve(a: Matrix, b: Vector, options?: ToleranceOptions): number[];
export declare function solve(a: Matrix, b: Matrix, options?: ToleranceOptions): number[][];
/**
 * The inverse `A⁻¹`, so that `A·A⁻¹ = I`. Throws `SingularMatrixError` when
 * `A` is singular to working precision. To solve `A·x = b`, call `solve`: it
 * is faster and more accurate than `multiply(inverse(A), b)`.
 */
export declare function inverse(a: Matrix, options?: ToleranceOptions): number[][];
/**
 * The number of linearly independent rows (equivalently, columns) of any
 * `m×n` matrix, by row echelon form with partial pivoting. A pivot at or below
 * `max(m, n) · Number.EPSILON · ‖A‖∞` counts as zero; pass `{ tolerance }` to
 * set an absolute threshold instead.
 */
export declare function rank(a: Matrix, options?: ToleranceOptions): number;
//# sourceMappingURL=linear-algebra.d.ts.map