/**
 * Every failure this package raises on purpose extends `MathError`, so callers
 * can catch the whole family with one `instanceof`. Wrong runtime types (a
 * string where a number was required, or `decimal('2') + 1`) throw the
 * built-in `TypeError` instead. Nothing in this package returns `NaN` or
 * `null` as a hidden failure channel.
 */
export declare class MathError extends Error {
    constructor(message: string, options?: ErrorOptions);
}
/** The input string is not a number in the accepted syntax. */
export declare class NumberFormatError extends MathError {
}
/** An argument is outside what the function accepts (reversed bounds, negative step, ...). */
export declare class InvalidArgumentError extends MathError {
}
/** Division by zero, or zero raised to a negative power. */
export declare class DivisionByZeroError extends MathError {
}
/** The exact result cannot be represented without rounding and no rounding mode was given. */
export declare class RoundingNecessaryError extends MathError {
}
/** A value cannot be represented in the target type (non-finite, unsafe integer, overflow, underflow). */
export declare class NumericRangeError extends MathError {
}
/** A statistic was asked of an empty (or too small) data set. */
export declare class EmptyDataError extends MathError {
}
/** An input or result exceeds the documented digit limits. */
export declare class ResourceLimitError extends MathError {
}
/** The runtime lacks an `Intl` feature this call depends on. */
export declare class UnsupportedFeatureError extends MathError {
}
/** A matrix is singular to working precision, so it has no inverse and `A·x = b` has no unique solution. */
export declare class SingularMatrixError extends MathError {
}
/** An iterative method did not reach its tolerance within its iteration limit. */
export declare class ConvergenceError extends MathError {
}
//# sourceMappingURL=errors.d.ts.map