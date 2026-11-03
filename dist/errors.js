import { defineFailure } from '@arki/failure';
/**
 * Outside text is not a number in the parser's syntax. The text is not echoed back.
 *
 * @fix Show the user the field again. For `parseNumber` and `parseDecimal` check that the locale or `symbols` match the text; for `fromBase` check the base.
 * @verify cd packages/math && bun run vitest run src/parse.test.ts src/integer.test.ts src/complex.test.ts
 */
export const InvalidNumber = /* @__PURE__ */ defineFailure('math.invalid_number', {
    status: 400,
    message: 'Text is not a number in the accepted syntax.',
    remediation: 'Check the text against the syntax and locale the parser expects, then ask for the number again.',
});
/**
 * Outside text holds a number past a documented limit: more than 10 000 digits,
 * an exponent or scale past ±10 000, or a value outside the float range for a `number` result.
 *
 * @fix Reject the input as too large, or for a `number` result parse with `parseDecimal` to keep every digit.
 * @verify cd packages/math && bun run vitest run src/parse.test.ts src/integer.test.ts src/complex.test.ts
 */
export const NumberOutOfRange = /* @__PURE__ */ defineFailure('math.number_out_of_range', {
    status: 400,
    message: 'Text holds a number outside the supported digits, scale or range.',
    remediation: 'Keep values within 10 000 digits and an exponent of 10 000, or use parseDecimal for values past the float range.',
});
/**
 * A currency code is not well formed: it must be three ASCII letters (`'USD'`). `formatCurrency` and the other
 * formatters that take a currency return this failure instead of throwing the `RangeError` that `Intl` throws.
 * The code is not checked against the ISO 4217 list; an unknown but well-formed code such as `'XYZ'` is formatted.
 *
 * @fix Check the currency code the caller passed: three ASCII letters such as `'USD'`, and not an empty string.
 * @verify cd packages/math && bun run vitest run src/format.test.ts
 */
export const InvalidCurrency = /* @__PURE__ */ defineFailure('math.invalid_currency', {
    status: 400,
    message: 'Currency code is not three ASCII letters.',
    remediation: 'Pass an ISO 4217 style code of three letters, such as USD or EUR.',
});
/** Every failure a `@arki/math` parser returns. The one list; {@link MathParseFailure} is derived from it. */
export const MATH_PARSE_FAILURES = [InvalidNumber, NumberOutOfRange];
/** Stable error codes of `@arki/math`. */
export const MATH_ERROR_CODES = {
    /**
     * A string is not a number in the accepted syntax.
     *
     * @fix Pass a plain ASCII decimal string such as `'12.5'` or `'1e3'`, or parse locale text with `@arki/math/parse`.
     * @verify cd packages/math && bun run vitest run src/errors.test.ts
     */
    numberFormat: 'ARKI_MATH_E001',
    /**
     * An argument is outside what the function accepts.
     *
     * @fix Read the message for the argument and fix its value: bounds in order, a positive step, a probability from 0 to 1.
     * @verify cd packages/math && bun run vitest run src/errors.test.ts
     */
    invalidArgument: 'ARKI_MATH_E002',
    /**
     * Division by zero, or zero raised to a negative power.
     *
     * @fix Check the divisor before the call, or choose a result for the zero case in your own code.
     * @verify cd packages/math && bun run vitest run src/errors.test.ts
     */
    divisionByZero: 'ARKI_MATH_E003',
    /**
     * The exact result needs rounding and no rounding mode was given.
     *
     * @fix Pass a scale and a rounding mode, for example `{ scale: 4, rounding: 'halfEven' }`.
     * @verify cd packages/math && bun run vitest run src/errors.test.ts
     */
    roundingNecessary: 'ARKI_MATH_E004',
    /**
     * A value cannot be represented in the target type.
     *
     * @fix Use a `bigint` or `Decimal` input, or keep the value inside the safe integer and finite float range.
     * @verify cd packages/math && bun run vitest run src/errors.test.ts
     */
    numericRange: 'ARKI_MATH_E005',
    /**
     * A statistic was asked of an empty or too small data set.
     *
     * @fix Check the data length first. Most statistics need one value; variance and regression need more.
     * @verify cd packages/math && bun run vitest run src/errors.test.ts
     */
    emptyData: 'ARKI_MATH_E006',
    /**
     * An input or result exceeds the documented digit limits.
     *
     * @fix Keep values within 10 000 digits and an exponent of 10 000. These limits guard against hostile input.
     * @verify cd packages/math && bun run vitest run src/errors.test.ts
     */
    resourceLimit: 'ARKI_MATH_E007',
    /**
     * The runtime lacks an `Intl` feature this call depends on.
     *
     * @fix Pass `symbols` to parse without `Intl`, or use a runtime with the feature (Hermes on iOS lacks `formatToParts`).
     * @verify cd packages/math && bun run vitest run src/errors.test.ts
     */
    unsupportedFeature: 'ARKI_MATH_E008',
    /**
     * A matrix is singular to working precision.
     *
     * @fix Check the matrix with `conditionNumber` or `rank`, or use `leastSquares` or `pseudoInverse`.
     * @verify cd packages/math && bun run vitest run src/errors.test.ts
     */
    singularMatrix: 'ARKI_MATH_E009',
    /**
     * An iterative method did not reach its tolerance.
     *
     * @fix Read `.best` for the best estimate, widen the tolerance or iteration limit, or give a better starting bracket.
     * @verify cd packages/math && bun run vitest run src/errors.test.ts
     */
    convergence: 'ARKI_MATH_E010',
    /**
     * A matrix that must be symmetric positive definite is not.
     *
     * @fix Pass a symmetric positive definite matrix, or use LU or QR decomposition instead of Cholesky.
     * @verify cd packages/math && bun run vitest run src/errors.test.ts
     */
    notPositiveDefinite: 'ARKI_MATH_E011',
};
export class MathError extends Error {
    constructor(message, options) {
        super(message, options);
        this.name = new.target.name;
    }
}
/** The input string is not a number in the accepted syntax. */
export class NumberFormatError extends MathError {
    code = MATH_ERROR_CODES.numberFormat;
    remediation = 'Pass a string in the documented number syntax, or validate user input before parsing.';
}
/** An argument is outside what the function accepts (reversed bounds, negative step, ...). */
export class InvalidArgumentError extends MathError {
    code = MATH_ERROR_CODES.invalidArgument;
    remediation = 'Check the argument against the documented range in the function reference.';
}
/** Division by zero, or zero raised to a negative power. */
export class DivisionByZeroError extends MathError {
    code = MATH_ERROR_CODES.divisionByZero;
    remediation = 'Check the divisor for zero before dividing.';
}
/** The exact result cannot be represented without rounding and no rounding mode was given. */
export class RoundingNecessaryError extends MathError {
    code = MATH_ERROR_CODES.roundingNecessary;
    remediation = 'Pass a scale and a rounding mode so the result can be rounded.';
}
/** A value cannot be represented in the target type (non-finite, unsafe integer, overflow, underflow). */
export class NumericRangeError extends MathError {
    code = MATH_ERROR_CODES.numericRange;
    remediation = 'Use decimal or bigint arithmetic, or keep the value inside the safe range.';
}
/** A statistic was asked of an empty (or too small) data set. */
export class EmptyDataError extends MathError {
    code = MATH_ERROR_CODES.emptyData;
    remediation = 'Pass at least as many values as the statistic needs.';
}
/** An input or result exceeds the documented digit limits. */
export class ResourceLimitError extends MathError {
    code = MATH_ERROR_CODES.resourceLimit;
    remediation = 'Reduce the number of digits or the size of the exponent.';
}
/** The runtime lacks an `Intl` feature this call depends on. */
export class UnsupportedFeatureError extends MathError {
    code = MATH_ERROR_CODES.unsupportedFeature;
    remediation = 'Run on a runtime whose Intl supports the feature, or avoid the locale-dependent option.';
}
/** A matrix is singular to working precision, so it has no inverse and `A·x = b` has no unique solution. */
export class SingularMatrixError extends MathError {
    code = MATH_ERROR_CODES.singularMatrix;
    remediation = 'Check that the matrix has full rank, or use a least-squares method.';
}
/** An iterative method did not reach its tolerance within its iteration limit. */
export class ConvergenceError extends MathError {
    code = MATH_ERROR_CODES.convergence;
    remediation = 'Loosen the tolerance, raise the iteration limit, or pass a better starting point.';
    /** Iterations, sweeps or evaluations spent before the method stopped. */
    iterations;
    constructor(message, iterations) {
        super(message);
        this.iterations = iterations;
    }
}
/**
 * A numeric method got valid input and still did not reach its tolerance in its iteration limit: a function with no
 * limit at the point, an integrand that is not integrable, a matrix whose QR or SVD iteration stalls. `cause` is the
 * `ConvergenceError` with `iterations`; the root, integral and limit errors also carry `best`, the last estimate.
 *
 * @fix Show the user that the method did not settle; loosen the tolerance, raise the iteration limit, or start elsewhere, and use `cause.best` if a rough value is enough.
 * @verify cd packages/math && bun run vitest run src/errors.test.ts src/roots.test.ts src/integrate.test.ts
 */
export const NotConverged = /* @__PURE__ */ defineFailure('math.not_converged', {
    status: 422,
    message: 'The method did not converge within its iteration limit.',
    remediation: 'Loosen the tolerance, raise the iteration limit, or pass a better starting point.',
});
/**
 * Runs an iterative method and returns {@link NotConverged} when it throws a {@link ConvergenceError} (with the error
 * as `cause`). Invalid input and every other error are still thrown.
 */
export function orNotConverged(run) {
    try {
        return run();
    }
    catch (error) {
        if (error instanceof ConvergenceError)
            return NotConverged({ cause: error });
        throw error;
    }
}
/** A matrix that must be symmetric positive definite (for a Cholesky factorization) is not. */
export class NotPositiveDefiniteError extends MathError {
    code = MATH_ERROR_CODES.notPositiveDefinite;
    remediation = 'Pass a symmetric positive definite matrix, or use a general factorization such as LU.';
}
//# sourceMappingURL=errors.js.map