import { DivisionByZeroError, RoundingNecessaryError } from '../errors.js';
export function abs(n) {
    return n < 0n ? -n : n;
}
export function sign(n) {
    return n < 0n ? -1 : n > 0n ? 1 : 0;
}
const POW10 = [1n];
/** Powers up to this exponent are memoized (≈130 KB total); larger ones are computed on demand. */
const POW10_CACHE_LIMIT = 512;
export function pow10(exponent) {
    if (exponent > POW10_CACHE_LIMIT)
        return 10n ** BigInt(exponent);
    for (let i = POW10.length; i <= exponent; i++)
        POW10.push(POW10[i - 1] * 10n);
    return POW10[exponent];
}
/** Number of decimal digits in |n|; zero has one digit. */
export function digitCount(n) {
    return abs(n).toString().length;
}
export function gcd(a, b) {
    a = abs(a);
    b = abs(b);
    while (b !== 0n)
        [a, b] = [b, a % b];
    return a;
}
/** Floor division (toward −∞), like Python's `//`. */
export function floorDiv(a, b) {
    const q = a / b;
    return a % b !== 0n && a < 0n !== b < 0n ? q - 1n : q;
}
/** Splits `n` into `[rest, count]` where `n = rest * factor^count`. */
export function stripFactor(n, factor) {
    let count = 0;
    while (n !== 0n && n % factor === 0n) {
        n /= factor;
        count++;
    }
    return [n, count];
}
/**
 * The one place rounding happens. Returns `numerator / denominator` as an
 * integer, rounded with `mode`. Every rounding helper in the package reduces
 * its problem to this call.
 */
export function divideRounded(numerator, denominator, mode) {
    if (denominator === 0n)
        throw new DivisionByZeroError('Division by zero');
    const resultSign = sign(numerator) * sign(denominator);
    const n = abs(numerator);
    const d = abs(denominator);
    const quotient = n / d;
    const remainder = n % d;
    if (remainder === 0n)
        return resultSign < 0 ? -quotient : quotient;
    const half = sign(remainder * 2n - d); // -1 below half, 0 exactly half, 1 above half
    let roundUp;
    switch (mode) {
        case 'unnecessary': {
            throw new RoundingNecessaryError('The exact result has more digits than requested; pass a rounding mode such as "halfEven"');
        }
        case 'down': {
            roundUp = false;
            break;
        }
        case 'up': {
            roundUp = true;
            break;
        }
        case 'ceiling': {
            roundUp = resultSign > 0;
            break;
        }
        case 'floor': {
            roundUp = resultSign < 0;
            break;
        }
        case 'halfUp': {
            roundUp = half >= 0;
            break;
        }
        case 'halfDown': {
            roundUp = half > 0;
            break;
        }
        case 'halfEven': {
            roundUp = half > 0 || (half === 0 && quotient % 2n === 1n);
            break;
        }
    }
    const magnitude = roundUp ? quotient + 1n : quotient;
    return resultSign < 0 ? -magnitude : magnitude;
}
//# sourceMappingURL=bigint.js.map