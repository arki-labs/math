/**
 * Random numbers that behave the same on every JavaScript runtime.
 *
 * `createRandom()` with no seed draws from the platform's secure generator
 * (`crypto.getRandomValues`) when it exists, and falls back to `Math.random`
 * where it does not. `createRandom(seed)` gives a repeatable stream: the same
 * seed always produces the same numbers, on every runtime. Seeded streams are
 * for tests, games and simulations. They are not secure.
 */
/** A random-number source with helpers for the common draws. */
export type Random = {
    /** Uniform float in [0, 1), 53 bits of randomness. */
    next(this: void): number;
    /** Uniform integer in [min, max], both ends included. Safe integers only; unbiased (rejection sampling, never `Math.floor(next() * range)` bias). */
    int(this: void, min: number, max: number): number;
    /** Uniform float in [min, max). Defaults to [0, 1). */
    float(this: void, min?: number, max?: number): number;
    /** `true` with the given probability (default 0.5). */
    bool(this: void, probability?: number): boolean;
    /** One element, uniformly. EmptyDataError on empty. */
    pick<T>(this: void, items: readonly T[]): T;
    /** A shuffled copy (Fisher–Yates). Input is never mutated. */
    shuffle<T>(this: void, items: readonly T[]): T[];
    /** `count` distinct elements without replacement, in random order. InvalidArgumentError if count > length or negative. */
    sample<T>(this: void, items: readonly T[], count: number): T[];
    /** Normally distributed value (Box–Muller). */
    gaussian(this: void, mean?: number, stddev?: number): number;
};
/**
 * Seeded → deterministic xoshiro128** stream (seed via splitmix32; string seeds hashed with cyrb53).
 * Unseeded → crypto-backed when available, `Math.random` otherwise.
 * Numeric seeds must be finite. The number `1` and the string `'1'` give the same stream.
 */
export declare function createRandom(seed?: number | string): Random;
/** The default, unseeded generator. */
export declare const random: Random;
/** Uniform integer in [min, max], both ends included, from the default generator. */
export declare const randomInt: Random['int'];
/** Uniform float in [min, max) (default [0, 1)) from the default generator. */
export declare const randomFloat: Random['float'];
/** `true` with the given probability (default 0.5), from the default generator. */
export declare const randomBool: Random['bool'];
/** One element chosen uniformly by the default generator. Throws `EmptyDataError` on an empty array. */
export declare const pick: Random['pick'];
/** A shuffled copy of the input, from the default generator. */
export declare const shuffle: Random['shuffle'];
/** `count` distinct elements in random order, from the default generator. */
export declare const sample: Random['sample'];
//# sourceMappingURL=random.d.ts.map