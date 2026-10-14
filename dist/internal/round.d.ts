/**
 * The exact rounding of `round` / `roundTo`: parse the number's shortest
 * decimal text into a bigint coefficient, divide with the rounding mode, and
 * convert back. Slow (a string round trip and bigint maths) but obviously
 * right, so it handles every case the float fast path in `number.ts` cannot
 * prove, and it is the oracle the fast path is tested against.
 */
import type { RoundingMode } from '../rounding.js';
/** `round(x, places, mode)` on the shortest decimal text of `x`. Arguments are already validated. */
export declare function roundExact(x: number, places: number, mode: RoundingMode): number;
/** `roundTo(x, step, mode)` on the shortest decimal text of both. Arguments are already validated. */
export declare function roundToExact(x: number, step: number, mode: RoundingMode): number;
//# sourceMappingURL=round.d.ts.map