/**
 * Integer and number-theory helpers with matching `number` and `bigint`
 * overloads. Operands must share a type; the `number` forms require safe
 * integers and refuse to return an unsafe one (use `bigint` instead).
 */
import { DivisionByZeroError, InvalidArgumentError, NumericRangeError, ResourceLimitError, } from './errors.js';
import { abs as absBigInt, digitCount, floorDiv, gcd as gcdBigInt } from './internal/bigint.js';
import { assertDigitLimit, MAX_DIGITS } from './internal/limits.js';
function assertSafeInteger(value, name) {
    if (!Number.isSafeInteger(value)) {
        throw new InvalidArgumentError(`${name} must be a safe integer, got ${value}`);
    }
}
function assertSameKind(a, b) {
    if (typeof a !== typeof b) {
        throw new TypeError(`Cannot mix ${typeof a} and ${typeof b}; convert one side first`);
    }
}
export function gcd(a, b) {
    assertSameKind(a, b);
    if (typeof a === 'bigint')
        return gcdBigInt(a, b);
    assertSafeInteger(a, 'a');
    assertSafeInteger(b, 'b');
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y !== 0)
        [x, y] = [y, x % y];
    return x;
}
export function lcm(a, b) {
    assertSameKind(a, b);
    if (typeof a === 'bigint') {
        const bb = b;
        if (a === 0n || bb === 0n)
            return 0n;
        const product = (a / gcdBigInt(a, bb)) * bb;
        return product < 0n ? -product : product;
    }
    const bn = b;
    if (a === 0 || bn === 0)
        return gcd(a, bn) * 0; // validates inputs, returns 0
    const result = Math.abs((a / gcd(a, bn)) * bn);
    if (!Number.isSafeInteger(result)) {
        throw new NumericRangeError(`lcm(${a}, ${bn}) exceeds Number.MAX_SAFE_INTEGER; use bigint`);
    }
    return result;
}
export function divmod(a, b) {
    assertSameKind(a, b);
    if (typeof a === 'bigint') {
        const bb = b;
        if (bb === 0n)
            throw new DivisionByZeroError('Division by zero');
        const quotient = floorDiv(a, bb);
        return [quotient, a - quotient * bb];
    }
    const bn = b;
    assertSafeInteger(a, 'a');
    assertSafeInteger(bn, 'b');
    if (bn === 0)
        throw new DivisionByZeroError('Division by zero');
    // `%` on doubles is exact; correct its sign to follow the divisor.
    let remainder = a % bn;
    if (remainder !== 0 && remainder < 0 !== bn < 0)
        remainder += bn;
    const rest = a - remainder;
    // `rest` is an exact multiple of `bn`, but can leave the safe range by up to |bn|; then divide in bigint.
    const quotient = Number.isSafeInteger(rest) ? rest / bn : Number(floorDiv(BigInt(a), BigInt(bn)));
    return [quotient === 0 ? 0 : quotient, remainder === 0 ? 0 : remainder];
}
// Every bigint result honours MAX_DIGITS (10,000 digits), like Decimal and Rational do.
// 3248! has 9,998 digits; 3249! is the first to cross the limit.
const MAX_BIGINT_FACTORIAL = 3248;
// Caps the loop length; the result's digit count is checked exactly afterwards.
const MAX_BIGINT_TERMS = 10_000;
// F(47,851) has 10,000 digits; F(47,852) is the first to cross the limit.
const MAX_FIBONACCI = 47_851;
/** Cheap pre-check: a product of `terms` factors each below `n` has at most `terms · digits(n)` digits. */
function assertProductFits(terms, n, what) {
    if (terms * BigInt(digitCount(n)) > BigInt(MAX_DIGITS) * 4n) {
        throw new ResourceLimitError(`${what} would exceed ${MAX_DIGITS} digits`);
    }
}
function assertBigInt(value, what) {
    if (typeof value !== 'bigint')
        throw new TypeError(`${what} must be a bigint`);
}
const TWO_POW_64 = 1n << 64n;
const TRIAL_LIMIT = 1_000_000;
/** Miller–Rabin bases that are deterministic for every n < 2^64. */
const MILLER_RABIN_BASES = [2n, 325n, 9375n, 28178n, 450775n, 9780504n, 1795265022n];
function unsafeResult(what) {
    return new NumericRangeError(`${what} exceeds Number.MAX_SAFE_INTEGER; use bigint`);
}
export function factorial(n) {
    if (typeof n === 'bigint') {
        if (n < 0n)
            throw new InvalidArgumentError('factorial requires n >= 0');
        if (n > BigInt(MAX_BIGINT_FACTORIAL)) {
            throw new ResourceLimitError(`factorial is limited to n <= ${MAX_BIGINT_FACTORIAL}`);
        }
        let result = 1n;
        for (let i = 2n; i <= n; i++)
            result *= i;
        return result;
    }
    assertSafeInteger(n, 'n');
    if (n < 0)
        throw new InvalidArgumentError('factorial requires n >= 0');
    if (n > 18)
        throw unsafeResult(`factorial(${n})`);
    let result = 1;
    for (let i = 2; i <= n; i++)
        result *= i;
    return result;
}
export function combinations(n, k) {
    assertSameKind(n, k);
    if (typeof n === 'bigint') {
        const kb = k;
        if (n < 0n)
            throw new InvalidArgumentError('combinations requires n >= 0');
        if (kb < 0n || kb > n)
            return 0n;
        let steps = kb;
        if (n - kb < steps)
            steps = n - kb;
        if (steps > BigInt(MAX_BIGINT_TERMS)) {
            throw new ResourceLimitError(`combinations is limited to min(k, n - k) <= ${MAX_BIGINT_TERMS}`);
        }
        const base = n - steps;
        assertProductFits(steps, n, `combinations(${n}, ${kb})`);
        let result = 1n;
        for (let i = 1n; i <= steps; i++)
            result = (result * (base + i)) / i;
        assertDigitLimit(digitCount(result), `combinations(${n}, ${kb})`);
        return result;
    }
    const kn = k;
    assertSafeInteger(n, 'n');
    assertSafeInteger(kn, 'k');
    if (n < 0)
        throw new InvalidArgumentError('combinations requires n >= 0');
    if (kn < 0 || kn > n)
        return 0;
    const steps = Math.min(kn, n - kn);
    const base = n - steps;
    let result = 1;
    for (let i = 1; i <= steps; i++) {
        // result = C(base + i - 1, i - 1); the next value is result * (base + i) / i.
        // Dividing the common factor first keeps every intermediate an exact integer.
        const g = gcd(result, i);
        const next = (result / g) * ((base + i) / (i / g));
        if (!Number.isSafeInteger(next))
            throw unsafeResult(`combinations(${n}, ${kn})`);
        result = next;
    }
    return result;
}
export function permutations(n, k) {
    assertSameKind(n, k);
    if (typeof n === 'bigint') {
        const kb = k;
        if (n < 0n)
            throw new InvalidArgumentError('permutations requires n >= 0');
        if (kb < 0n || kb > n)
            return 0n;
        if (kb > BigInt(MAX_BIGINT_TERMS)) {
            throw new ResourceLimitError(`permutations is limited to k <= ${MAX_BIGINT_TERMS}`);
        }
        assertProductFits(kb, n, `permutations(${n}, ${kb})`);
        let result = 1n;
        for (let i = 0n; i < kb; i++)
            result *= n - i;
        assertDigitLimit(digitCount(result), `permutations(${n}, ${kb})`);
        return result;
    }
    const kn = k;
    assertSafeInteger(n, 'n');
    assertSafeInteger(kn, 'k');
    if (n < 0)
        throw new InvalidArgumentError('permutations requires n >= 0');
    if (kn < 0 || kn > n)
        return 0;
    let result = 1;
    for (let i = 0; i < kn; i++) {
        result *= n - i;
        if (!Number.isSafeInteger(result))
            throw unsafeResult(`permutations(${n}, ${kn})`);
    }
    return result;
}
/**
 * `base ** exponent mod modulus`, in `[0, modulus)`. Requires
 * `exponent >= 0` and `modulus > 0`. Square-and-multiply.
 */
export function modPow(base, exponent, modulus) {
    assertBigInt(base, 'base');
    assertBigInt(exponent, 'exponent');
    assertBigInt(modulus, 'modulus');
    if (modulus <= 0n)
        throw new InvalidArgumentError('modulus must be positive');
    if (exponent < 0n)
        throw new InvalidArgumentError('exponent must be non-negative');
    if (modulus === 1n)
        return 0n;
    let result = 1n;
    let b = ((base % modulus) + modulus) % modulus;
    let e = exponent;
    while (e > 0n) {
        if (e & 1n)
            result = (result * b) % modulus;
        b = (b * b) % modulus;
        e >>= 1n;
    }
    return result;
}
/**
 * Modular inverse of `a` mod `modulus` in `[0, modulus)`, by extended
 * Euclid. Throws `InvalidArgumentError` when `gcd(a, modulus) !== 1`.
 */
export function modInverse(a, modulus) {
    assertBigInt(a, 'a');
    assertBigInt(modulus, 'modulus');
    if (modulus <= 0n)
        throw new InvalidArgumentError('modulus must be positive');
    let [r0, r1] = [modulus, ((a % modulus) + modulus) % modulus];
    let [t0, t1] = [0n, 1n];
    while (r1 !== 0n) {
        const q = r0 / r1;
        [r0, r1] = [r1, r0 - q * r1];
        [t0, t1] = [t1, t0 - q * t1];
    }
    if (r0 !== 1n)
        throw new InvalidArgumentError(`${a} has no inverse modulo ${modulus}`);
    return ((t0 % modulus) + modulus) % modulus;
}
function assertDeterministicRange(n) {
    if (n >= TWO_POW_64) {
        throw new NumericRangeError(`${n} is out of the deterministic range (n < 2^64)`);
    }
}
function isPrimeBigInt(n) {
    if (n < 2n)
        return false;
    assertDeterministicRange(n);
    for (const p of [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n]) {
        if (n === p)
            return true;
        if (n % p === 0n)
            return false;
    }
    let d = n - 1n;
    let s = 0;
    while ((d & 1n) === 0n) {
        d >>= 1n;
        s++;
    }
    witness: for (const base of MILLER_RABIN_BASES) {
        const a = base % n;
        if (a === 0n)
            continue;
        let x = modPow(a, d, n);
        if (x === 1n || x === n - 1n)
            continue;
        for (let i = 1; i < s; i++) {
            x = (x * x) % n;
            if (x === n - 1n)
                continue witness;
        }
        return false;
    }
    return true;
}
export function isPrime(n) {
    if (typeof n === 'bigint')
        return isPrimeBigInt(n);
    assertSafeInteger(n, 'n');
    return isPrimeBigInt(BigInt(n));
}
/** Brent's variant of Pollard's rho: returns a non-trivial factor of composite odd `n`. */
function pollardBrent(n) {
    for (let c = 1n;; c++) {
        let y = 2n;
        let x = y;
        let ys = y;
        let q = 1n;
        let g = 1n;
        let r = 1;
        const batch = 128;
        while (g === 1n) {
            x = y;
            for (let i = 0; i < r; i++)
                y = (y * y + c) % n;
            let k = 0;
            while (k < r && g === 1n) {
                ys = y;
                const limit = Math.min(batch, r - k);
                for (let i = 0; i < limit; i++) {
                    y = (y * y + c) % n;
                    q = (q * absBigInt(x - y)) % n;
                }
                g = gcdBigInt(q, n);
                k += batch;
            }
            r *= 2;
        }
        if (g === n) {
            // The batch overshot; redo it one step at a time.
            do {
                ys = (ys * ys + c) % n;
                g = gcdBigInt(absBigInt(x - ys), n);
            } while (g === 1n);
        }
        if (g !== n)
            return g;
    }
}
function factorLarge(n, out) {
    if (n === 1n)
        return;
    if (isPrimeBigInt(n)) {
        out.push(n);
        return;
    }
    const d = pollardBrent(n);
    factorLarge(d, out);
    factorLarge(n / d, out);
}
function primeFactorsBigInt(input) {
    if (input < 0n)
        throw new InvalidArgumentError('primeFactors requires n >= 0');
    if (input < 2n)
        return [];
    assertDeterministicRange(input);
    const out = [];
    let n = input;
    for (const p of [2n, 3n]) {
        while (n % p === 0n) {
            out.push(p);
            n /= p;
        }
    }
    const limit = BigInt(TRIAL_LIMIT);
    for (let p = 5n; p <= limit && p * p <= n; p += 6n) {
        for (const f of [p, p + 2n]) {
            while (n % f === 0n) {
                out.push(f);
                n /= f;
            }
        }
    }
    if (n > 1n) {
        if (n <= limit * limit)
            out.push(n);
        else {
            const rest = [];
            factorLarge(n, rest);
            rest.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
            out.push(...rest);
        }
    }
    return out;
}
export function primeFactors(n) {
    if (typeof n === 'bigint')
        return primeFactorsBigInt(n);
    assertSafeInteger(n, 'n');
    if (n < 0)
        throw new InvalidArgumentError('primeFactors requires n >= 0');
    return primeFactorsBigInt(BigInt(n)).map(Number);
}
export function divisors(n) {
    if (typeof n === 'number') {
        assertSafeInteger(n, 'n');
        if (n < 1)
            throw new InvalidArgumentError('divisors requires n >= 1');
        return divisorsBigInt(BigInt(n)).map(Number);
    }
    return divisorsBigInt(n);
}
function divisorsBigInt(n) {
    if (n < 1n)
        throw new InvalidArgumentError('divisors requires n >= 1');
    let result = [1n];
    const factors = primeFactorsBigInt(n);
    for (let i = 0; i < factors.length;) {
        const p = factors[i];
        let j = i;
        while (j < factors.length && factors[j] === p)
            j++;
        const next = [...result];
        let power = 1n;
        for (let e = i; e < j; e++) {
            power *= p;
            for (const d of result)
                next.push(d * power);
        }
        result = next;
        i = j;
    }
    return result.toSorted((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}
/** True when `n` is divisible by 2. Zero is even. */
export function isEven(n) {
    if (typeof n === 'bigint')
        return n % 2n === 0n;
    assertSafeInteger(n, 'n');
    return n % 2 === 0;
}
/** True when `n` is not divisible by 2. Negative odd numbers are odd. */
export function isOdd(n) {
    return !isEven(n);
}
/** Sum of the decimal digits of `|n|`: `digitSum(-123)` is `6`. */
export function digitSum(n) {
    let digits;
    if (typeof n === 'bigint')
        digits = absBigInt(n).toString();
    else {
        assertSafeInteger(n, 'n');
        digits = Math.abs(n).toString();
    }
    let sum = 0;
    for (const ch of digits)
        sum += Number(ch);
    return sum;
}
function fibonacciPair(n) {
    if (n === 0)
        return [0n, 1n];
    const [a, b] = fibonacciPair(n >> 1);
    const c = a * (2n * b - a);
    const d = a * a + b * b;
    return n % 2 === 0 ? [c, d] : [d, c + d];
}
/**
 * The n-th Fibonacci number (`F(0) = 0`, `F(1) = 1`) by fast doubling.
 * Always returns a `bigint`. `n` must be a non-negative safe integer at most
 * 100_000 (`ResourceLimitError` above).
 */
export function fibonacci(n) {
    assertSafeInteger(n, 'n');
    if (n < 0)
        throw new InvalidArgumentError('fibonacci requires n >= 0');
    if (n > MAX_FIBONACCI) {
        throw new ResourceLimitError(`fibonacci is limited to n <= ${MAX_FIBONACCI}`);
    }
    const result = fibonacciPair(n)[0];
    assertDigitLimit(digitCount(result), `fibonacci(${n})`);
    return result;
}
//# sourceMappingURL=integer.js.map