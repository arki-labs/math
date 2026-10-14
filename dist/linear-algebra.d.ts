/**
 * Lean dense linear algebra over plain JS numbers (float64): vectors, small to
 * medium matrices, LU with partial pivoting, QR with column pivoting,
 * Cholesky, the singular value decomposition, least squares, eigenvalues and
 * eigenvectors. For symbolic algebra or sparse storage, reach for a full CAS
 * such as mathjs.
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
 * exactly singular. Rank decisions use one rule everywhere, NumPy's
 * `matrix_rank`: a singular value counts as zero at or below
 * `max(m, n) · Number.EPSILON · σ₁` (σ₁ the largest). `rank`, `pseudoInverse`
 * and the rank-deficient path of `leastSquares` apply it to singular values;
 * `qrDecompose` and the full-rank test of `leastSquares` apply it to the
 * diagonal of a column-pivoted `R`, where `|r₀₀|` stands in for σ₁ (it is
 * within a factor `√n` of it). Each function takes `{ tolerance }` to replace
 * the default with an absolute threshold. `determinant` never throws for a
 * singular matrix; it returns the product of the pivots, which may be tiny
 * rather than exactly zero.
 *
 * **Orthogonal factorizations and least squares.** `qrDecompose` is
 * Householder QR with column pivoting (LAPACK `dgeqp3`; `{ pivoting: false }`
 * for plain QR). `choleskyDecompose` / `choleskySolve` factor a symmetric
 * positive definite matrix as `L·Lᵀ` (`dpotrf`); a matrix that is not throws
 * `NotPositiveDefiniteError`. `singularValues` / `singularValueDecompose` are
 * Golub–Kahan–Reinsch: Householder bidiagonalization and implicit-shift QR
 * (LINPACK `dsvdc`, as in JAMA), backward stable, singular values descending.
 * `leastSquares` solves `min ‖A·x − b‖₂` by pivoted QR and, when `A` is
 * rank-deficient or wide, returns the minimum-norm solution from the SVD;
 * neither path forms the normal equations `AᵀA`, which square the condition
 * number. Column pivoting reveals rank on all but contrived inputs (Kahan's
 * matrix defeats it); the SVD never misses. `conditionNumber` is `σ₁ / σₖ`;
 * `pseudoInverse` is `V·Σ⁺·Uᵀ`. The SVD's QR iteration is capped at 75 sweeps
 * per singular value (typically 2 or 3 are needed); past the cap it throws
 * `ConvergenceError`. Like the eigen routines, all of these work on a copy
 * scaled by a power of two, so entries near the float64 limits neither
 * overflow nor underflow.
 *
 * **Eigenvalues.** Four functions, named like `luDecompose`:
 * `symmetricEigenvalues` / `symmetricEigenDecompose` for a symmetric matrix,
 * `eigenvalues` / `eigenDecompose` for any real square matrix. The symmetric
 * pair returns real `number`s sorted ascending with orthonormal eigenvectors;
 * it accepts `A` when every `|a[i][j] − a[j][i]|` is at most
 * `n · Number.EPSILON · ‖A‖∞` (or `{ tolerance }`, absolute) and works on
 * `(A + Aᵀ) / 2`; otherwise it throws `InvalidArgumentError`. The general pair
 * always returns `Complex` values (from `@arki/math/complex`) sorted by real
 * part, then imaginary part, as `polynomialRoots` does: a real eigenvalue has
 * an imaginary part of exactly `0` (so `isReal()` is true), and complex
 * eigenvalues come in conjugate pairs. Eigenvectors are a list: `vectors[k]`
 * belongs to `values[k]` (call `transpose` for the matrix with eigenvectors as
 * columns). Each has unit Euclidean length and its largest-magnitude entry (the
 * first, on an exact tie) is real and positive, so results are reproducible.
 * Algorithms are the LAPACK/EISPACK routes: Householder tridiagonalization plus
 * implicit QL with Wilkinson shifts (`dsyev`/`tql2`) for symmetric input;
 * balancing, Householder reduction to Hessenberg form and Francis double-shift
 * QR (`dgeev`/`dgebal`/`dlahqr`) for general input. The matrix is first scaled
 * by a power of two (exact) so entries near the float64 limits neither overflow
 * nor underflow. Results are backward stable: each eigenpair satisfies
 * `‖A·v − λ·v‖ ≈ n · ε · ‖A‖`. Balancing trades a little of that for accuracy
 * when it rescales strongly: a nearly defective or graded matrix keeps far more
 * accurate eigenvalues, with residuals up to a few hundred `n · ε · ‖A‖`, as
 * LAPACK's `dgeev` gives. Entries far below `ε · ‖A‖` (round-off left over from
 * a cancellation, say) can make balancing rescale a whole row, and then the
 * eigenvectors may be poor, as in LAPACK and MATLAB: zero such entries first. Eigenvalues of a defective matrix (a Jordan
 * block) are as accurate as the problem allows, about `ε^(1/k)` for a block of
 * size `k`, so a double root may come out as a close real pair or a tiny
 * complex pair, as in every float library; their eigenvectors are then nearly
 * parallel. The QR iteration is capped (30 sweeps per eigenvalue for the
 * symmetric case, `30 · max(10, n)` per eigenvalue for the general case, with
 * exceptional shifts at 10 and 30); past the cap it throws `ConvergenceError`.
 */
import { Complex } from './complex.js';
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
/** Options for `rank`. */
export type RankOptions = ToleranceOptions & {
    /**
     * `'svd'` (the default) counts singular values above the tolerance, the
     * reliable rank test. `'elimination'` counts pivots of row echelon form with
     * partial pivoting: several times faster, but on badly conditioned input it
     * can miss a near-dependence that the singular values show.
     */
    method?: 'svd' | 'elimination';
};
/**
 * The number of linearly independent rows (equivalently, columns) of any
 * `m×n` matrix. By default it counts the singular values above
 * `max(m, n) · Number.EPSILON · σ₁` (σ₁ the largest), the rule of NumPy's
 * `matrix_rank`, so `rank`, `pseudoInverse` and `leastSquares` agree.
 * `{ method: 'elimination' }` counts row echelon pivots above
 * `max(m, n) · Number.EPSILON · ‖A‖∞` instead. `{ tolerance }` replaces the
 * default with an absolute threshold for whichever quantity is counted.
 */
export declare function rank(a: Matrix, options?: RankOptions): number;
/** Options for the symmetric eigen solvers. */
export type SymmetryOptions = {
    /**
     * Largest accepted `|a[i][j] − a[j][i]|`, absolute. Defaults to
     * `n · Number.EPSILON · ‖A‖∞`, which accepts the rounding noise of a
     * matrix computed in floating point; `0` demands exact symmetry.
     */
    tolerance?: number;
};
/** `A = V·Λ·Vᵀ`, from `symmetricEigenDecompose`. */
export type SymmetricEigenDecomposition = {
    /** The eigenvalues, ascending, repeated by multiplicity. */
    values: number[];
    /** `vectors[k]` is the unit eigenvector for `values[k]`; together they are orthonormal. */
    vectors: number[][];
};
/** Eigenpairs of a general real matrix, from `eigenDecompose`. */
export type EigenDecomposition = {
    /** The eigenvalues, sorted by real part, then imaginary part; a real one has `im === 0`. */
    values: Complex[];
    /** `vectors[k]` is a unit eigenvector for `values[k]` (real entries for a real eigenvalue). */
    vectors: Complex[][];
};
/**
 * The eigenvalues of a symmetric matrix, ascending, repeated by multiplicity.
 * Throws `InvalidArgumentError` when `A` is not symmetric within the tolerance
 * (see the module docs, or pass `{ tolerance }`), and `ConvergenceError` if
 * the QL iteration stalls. Faster than `symmetricEigenDecompose`: no
 * eigenvectors are accumulated.
 */
export declare function symmetricEigenvalues(a: Matrix, options?: SymmetryOptions): number[];
/**
 * Eigenvalues and orthonormal eigenvectors of a symmetric matrix, so that
 * `A = V·Λ·Vᵀ` with `V = transpose(vectors)`. Values ascend; `vectors[k]`
 * belongs to `values[k]`, has unit length, and its largest-magnitude entry is
 * positive. Throws like `symmetricEigenvalues`.
 */
export declare function symmetricEigenDecompose(a: Matrix, options?: SymmetryOptions): SymmetricEigenDecomposition;
/**
 * The eigenvalues of any real square matrix, as `Complex` values sorted by
 * real part, then imaginary part, repeated by multiplicity. A real eigenvalue
 * has an imaginary part of exactly `0`; complex ones come in conjugate pairs.
 * For a symmetric matrix, `symmetricEigenvalues` is faster and returns plain
 * numbers. Throws `ConvergenceError` if the QR iteration stalls.
 */
export declare function eigenvalues(a: Matrix): Complex[];
/**
 * Eigenvalues and eigenvectors of any real square matrix: `A·v = λ·v` for
 * `λ = values[k]`, `v = vectors[k]`. Values are sorted as in `eigenvalues`.
 * Each vector has unit length with its largest-magnitude entry real and
 * positive; a real eigenvalue's vector has real entries, and conjugate
 * eigenvalues have conjugate vectors. For a defective matrix the vectors of a
 * repeated eigenvalue are (nearly) parallel: there is no full basis to find.
 * Throws `ConvergenceError` if the QR iteration stalls.
 */
export declare function eigenDecompose(a: Matrix): EigenDecomposition;
/** Options for `qrDecompose`. */
export type QrOptions = ToleranceOptions & {
    /**
     * Column pivoting (default `true`): each step takes the remaining column of
     * largest norm, so `|r_kk|` falls along the diagonal and `rank` is reliable.
     * `false` gives plain Householder QR of `A` itself (`permutation` is then the
     * identity).
     */
    pivoting?: boolean;
};
/** `A·P = Q·R`, from `qrDecompose`; `k = min(m, n)` for an `m×n` matrix `A`. */
export type QrDecomposition = {
    /** `Q`, `m×k` with orthonormal columns. */
    orthogonal: number[][];
    /** `R`, `k×n` upper triangular (trapezoidal when `n > m`), with a non-negative diagonal. */
    upper: number[][];
    /** Column `j` of `A·P` is column `permutation[j]` of `A`. */
    permutation: number[];
    /** The number of diagonal entries of `R` above the tolerance: the numerical rank, with pivoting. */
    rank: number;
};
/** `A = L·Lᵀ`, from `choleskyDecompose`. */
export type CholeskyDecomposition = {
    /** Lower-triangular `L` with a positive diagonal. */
    lower: number[][];
};
/** `A = Σₖ values[k] · left[k] · right[k]ᵀ`, from `singularValueDecompose`. */
export type SingularValueDecomposition = {
    /** The `min(m, n)` singular values, descending, all `≥ 0`. */
    values: number[];
    /** `left[k]` is the unit left singular vector (length `m`) for `values[k]`; together they are orthonormal. */
    left: number[][];
    /** `right[k]` is the unit right singular vector (length `n`) for `values[k]`; together they are orthonormal. */
    right: number[][];
};
/**
 * `A·P = Q·R` for any `m×n` matrix, by Householder reflections (LAPACK
 * `dgeqp3`, or `dgeqrf` with `{ pivoting: false }`). `Q` is the thin `m×k`
 * factor with `k = min(m, n)`; `R` is `k×n`. Each diagonal entry of `R` is made
 * non-negative (flipping the matching column of `Q`), so without pivoting the
 * factorization of a full-rank `A` is unique. `rank` counts the `|r_kk|` above
 * `max(m, n) · Number.EPSILON · |r₀₀|`, or above `{ tolerance }` (absolute).
 * Backward stable: `‖A·P − Q·R‖ ≈ n · ε · ‖A‖`. Never throws for a
 * rank-deficient matrix.
 */
export declare function qrDecompose(a: Matrix, options?: QrOptions): QrDecomposition;
/**
 * `A = L·Lᵀ` for a symmetric positive definite matrix (LAPACK `dpotrf`): about
 * half the work of LU, and no pivoting is needed. Symmetry is checked like
 * `symmetricEigenvalues` (`InvalidArgumentError` beyond the tolerance; the
 * factorization uses `(A + Aᵀ) / 2`). Throws `NotPositiveDefiniteError` when a
 * diagonal pivot is `≤ 0`, the LAPACK rule, which makes this the standard
 * positive-definiteness test. A singular positive semidefinite matrix may pass
 * with a tiny diagonal entry or throw, depending on rounding.
 */
export declare function choleskyDecompose(a: Matrix, options?: SymmetryOptions): CholeskyDecomposition;
/**
 * Solves `A·x = b` for a symmetric positive definite `A` by Cholesky: about
 * twice as fast as `solve`, and as accurate. `b` is a vector or a matrix of
 * right-hand-side columns, as for `solve`. Symmetry is checked with the
 * default tolerance (see `choleskyDecompose`). A pivot `d` with
 * `|d| ≤ n · Number.EPSILON · ‖A‖∞` (or `{ tolerance }`, absolute; the same
 * quantity `solve` tests, since for this matrix `d` equals LU's pivot) throws
 * `SingularMatrixError`; a pivot below `−tolerance` throws
 * `NotPositiveDefiniteError`.
 */
export declare function choleskySolve(a: Matrix, b: Vector, options?: ToleranceOptions): number[];
export declare function choleskySolve(a: Matrix, b: Matrix, options?: ToleranceOptions): number[][];
/**
 * The singular values of any `m×n` matrix: `min(m, n)` of them, descending,
 * all `≥ 0` (the square roots of the eigenvalues of `AᵀA`, computed without
 * forming it). Golub–Kahan–Reinsch: backward stable, so each value is within
 * about `max(m, n) · ε · σ₁` of the exact one. Throws `ConvergenceError` if
 * the QR iteration stalls (see the module docs). Faster than
 * `singularValueDecompose`: no singular vectors are accumulated.
 */
export declare function singularValues(a: Matrix): number[];
/**
 * `A = U·Σ·Vᵀ` for any `m×n` matrix, in thin form: `values` holds the
 * `k = min(m, n)` singular values, descending; `left[k]` and `right[k]` are the
 * matching unit singular vectors, so `transpose(left)` is the `m×k` factor `U`
 * and `right` is `Vᵀ` (NumPy's `Vh`). Each pair's sign is fixed so that the
 * largest-magnitude entry of `left[k]` (the first, on a tie) is positive.
 * Throws like `singularValues`.
 */
export declare function singularValueDecompose(a: Matrix): SingularValueDecomposition;
/**
 * The 2-norm condition number `σ₁ / σₖ` (largest over smallest singular
 * value) of any `m×n` matrix: about how many times a relative error in `A` or
 * `b` can be magnified in the solution of `A·x = b` or a least-squares fit.
 * `1` for an orthogonal matrix; `Infinity` (as NumPy's `cond` returns) when
 * the smallest singular value is exactly `0`, the one case in this module
 * that returns a non-finite number, since the condition number of a singular
 * matrix is infinite by definition.
 */
export declare function conditionNumber(a: Matrix): number;
/**
 * The Moore–Penrose pseudo-inverse `A⁺` (`n×m` for an `m×n` matrix) from the
 * SVD: `V·Σ⁺·Uᵀ`, where `Σ⁺` inverts the singular values above
 * `max(m, n) · Number.EPSILON · σ₁` (NumPy's `pinv` default) and zeroes the
 * rest; `{ tolerance }` sets an absolute cut-off instead. `A⁺·b` is the
 * minimum-norm least-squares solution, but `leastSquares` computes that faster
 * and more accurately.
 */
export declare function pseudoInverse(a: Matrix, options?: ToleranceOptions): number[][];
/**
 * The least-squares solution of `A·x ≈ b` for any `m×n` matrix: the `x` that
 * minimizes `‖A·x − b‖₂`. `b` is a vector (gives `x`, length `n`) or a matrix
 * of right-hand-side columns (gives an `n`-row matrix of solution columns).
 *
 * Solved by Householder QR with column pivoting, never the normal equations
 * `AᵀA·x = Aᵀb` (which square the condition number). When `R` shows `A` has
 * full column rank (every `|r_kk|` above `max(m, n) · Number.EPSILON · |r₀₀|`,
 * or above `{ tolerance }`, absolute), `x` is unique and comes from `R`. Otherwise
 * (rank-deficient, or fewer rows than columns) infinitely many `x` fit equally
 * well, and the one of smallest norm is returned, as NumPy's `lstsq` does: it
 * is computed from the SVD, dropping singular values at or below
 * `max(m, n) · Number.EPSILON · σ₁` (or `{ tolerance }`). Never throws for a
 * singular or rank-deficient `A`.
 */
export declare function leastSquares(a: Matrix, b: Vector, options?: ToleranceOptions): number[];
export declare function leastSquares(a: Matrix, b: Matrix, options?: ToleranceOptions): number[][];
//# sourceMappingURL=linear-algebra.d.ts.map