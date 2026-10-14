/**
 * Plane and solid geometry on ordinary JS numbers.
 *
 * - Triangles: `solveTriangle` / `solveTriangles` take any three parts (SSS,
 *   SAS, ASA, AAS, SSA) and return every side, angle, the area, the perimeter
 *   and a classification. SSA is the ambiguous case: `solveTriangles` returns
 *   0, 1 or 2 triangles; `solveTriangle` returns the one triangle or throws.
 * - Plane figures: `circle`, `circleSector`, `ellipse`, `regularPolygon`.
 * - Solids: `sphere`, `cylinder`, `cone`, `cube`, `cuboid`, `squarePyramid`,
 *   `frustum`, `torus` (volume, surface area and the lengths they depend on).
 * - Points: `distance` and `midpoint` in 2D or 3D, `polygonArea` and
 *   `signedPolygonArea` (shoelace formula).
 * - Pythagorean triples: `isPythagoreanTriple` (exact, `number` or `bigint`)
 *   and `pythagoreanTriples` (Euclid's formula).
 *
 * Angles are radians unless an `angleUnit` option says otherwise
 * (`'deg' | 'rad' | 'grad' | 'turn'`, the names `@arki/math/units` uses).
 * Angles you pass in come back exactly as you gave them; computed angles are
 * converted to the same unit.
 *
 * Lengths are unitless: results are in the unit of the inputs (squared for
 * areas, cubed for volumes). Every input must be finite and every length
 * positive; bad input throws `InvalidArgumentError`. Results never carry `-0`.
 */
import { InvalidArgumentError } from './errors.js';
import { gcd } from './integer.js';
import { approxEqual, assertFinite } from './number.js';
/** A half turn (π radians) in each angle unit. */
const HALF_TURN = {
    deg: 180,
    rad: Math.PI,
    grad: 200,
    turn: 0.5,
    arcmin: 10_800,
    arcsec: 648_000,
};
const ANGLE_UNITS = new Set(['deg', 'rad', 'grad', 'turn', 'arcmin', 'arcsec']);
function angleUnitOf(options) {
    const unit = options?.angleUnit ?? 'rad';
    if (!ANGLE_UNITS.has(unit))
        throw new InvalidArgumentError(`Unknown angle unit: ${String(unit)}`);
    return unit;
}
function toRadians(value, unit) {
    return unit === 'rad' ? value : (value * Math.PI) / HALF_TURN[unit];
}
function fromRadians(value, unit) {
    return unit === 'rad' ? value : (value * HALF_TURN[unit]) / Math.PI;
}
function assertPositive(value, name) {
    assertFinite(value, name);
    if (value <= 0)
        throw new InvalidArgumentError(`${name} must be positive, got ${value}`);
}
const SIDE_KEYS = ['a', 'b', 'c'];
const ANGLE_KEYS = ['A', 'B', 'C'];
const DEFAULT_TOLERANCE = 1e-9;
/** A slot the solver has already filled; reaching an empty one is a bug in this module. */
function at(values, index) {
    const value = values[index];
    if (value === undefined)
        throw new RangeError(`triangle part ${index} is unknown`);
    return value;
}
function mapTriple(values, fn) {
    return [fn(values[0], 0), fn(values[1], 1), fn(values[2], 2)];
}
function filled(values) {
    return mapTriple(values, (_, i) => at(values, i));
}
function sortedDescending(values) {
    const [p = 0, q = 0, r = 0] = [...values].sort((x, y) => y - x);
    return [p, q, r];
}
function readPart(parts, key) {
    const value = parts[key];
    if (value !== undefined)
        assertPositive(value, key);
    return value;
}
/** Kahan's numerically stable form of Heron's formula. */
function heronArea(sides) {
    const [p, q, r] = sortedDescending(sides);
    const product = (p + (q + r)) * (r - (p - q)) * (r + (p - q)) * (p + (q - r));
    return Math.sqrt(Math.max(0, product)) / 4;
}
function buildTriangle(sides, radians, given, unit, tolerance) {
    const area = heronArea(sides);
    const angles = mapTriple(radians, (angle, i) => {
        if (angle !== undefined)
            return angle;
        const opposite = at(sides, i);
        const p = at(sides, (i + 1) % 3);
        const q = at(sides, (i + 2) % 3);
        // tan A = 4K / (b² + c² − a²): stable for tiny and obtuse angles alike.
        return Math.atan2(4 * area, p * p + q * q - opposite * opposite);
    });
    const out = mapTriple(angles, (angle, i) => given[i] ?? fromRadians(angle, unit));
    const [a, b, c] = sides;
    const equalPairs = [approxEqual(a, b, tolerance), approxEqual(b, c, tolerance), approxEqual(a, c, tolerance)].filter(Boolean).length;
    const sideType = equalPairs === 3 ? 'equilateral' : equalPairs > 0 ? 'isosceles' : 'scalene';
    const largest = Math.max(...angles);
    const angleType = approxEqual(largest, Math.PI / 2, tolerance)
        ? 'right'
        : largest > Math.PI / 2
            ? 'obtuse'
            : 'acute';
    return {
        a,
        b,
        c,
        A: out[0],
        B: out[1],
        C: out[2],
        area,
        perimeter: a + b + c,
        sideType,
        angleType,
    };
}
function solveParts(parts, options) {
    const unit = angleUnitOf(options);
    const tolerance = options?.tolerance ?? DEFAULT_TOLERANCE;
    assertFinite(tolerance, 'tolerance');
    if (tolerance < 0)
        throw new InvalidArgumentError('tolerance must be non-negative');
    const sides = mapTriple(SIDE_KEYS, key => readPart(parts, key));
    const given = mapTriple(ANGLE_KEYS, key => readPart(parts, key));
    const radians = mapTriple(given, value => (value === undefined ? undefined : toRadians(value, unit)));
    for (const [i, angle] of radians.entries()) {
        if (angle !== undefined && angle >= Math.PI) {
            throw new InvalidArgumentError(`angle ${ANGLE_KEYS[i]} must be less than a half turn, got ${given[i]}`);
        }
    }
    const sideCount = sides.filter(side => side !== undefined).length;
    const angleCount = radians.filter(angle => angle !== undefined).length;
    if (sideCount + angleCount !== 3) {
        throw new InvalidArgumentError(`A triangle needs exactly three parts, got ${sideCount + angleCount}`);
    }
    if (sideCount === 0)
        throw new InvalidArgumentError('Three angles fix the shape but not the size; give a side');
    const build = (s, r) => buildTriangle(s, r, given, unit, tolerance);
    const none = (reason) => ({ triangles: [], reason });
    // SSS
    if (sideCount === 3) {
        const known = filled(sides);
        const [p, q, r] = sortedDescending(known);
        if (q + r <= p)
            return none(`sides ${known.join(', ')} violate the triangle inequality`);
        return { triangles: [build(known, radians)], reason: '' };
    }
    // ASA / AAS: the third angle is π minus the other two, then the law of sines.
    if (sideCount === 1) {
        const sum = radians.reduce((total, angle) => total + (angle ?? 0), 0);
        if (sum >= Math.PI)
            return none('the two given angles add up to a half turn or more');
        const angles = mapTriple(radians, angle => angle ?? Math.PI - sum);
        const knownSide = sides.findIndex(side => side !== undefined);
        const ratio = at(sides, knownSide) / Math.sin(at(angles, knownSide));
        const solved = mapTriple(sides, (side, i) => side ?? ratio * Math.sin(at(angles, i)));
        return { triangles: [build(solved, angles)], reason: '' };
    }
    const angleIndex = radians.findIndex(angle => angle !== undefined);
    const angle = at(radians, angleIndex);
    // SAS: the angle sits between the two sides. Stable law of cosines:
    // c² = (a − b)² + 4ab·sin²(C/2) has no cancellation for small C.
    if (sides[angleIndex] === undefined) {
        const p = at(sides, (angleIndex + 1) % 3);
        const q = at(sides, (angleIndex + 2) % 3);
        const half = Math.sin(angle / 2);
        const third = Math.sqrt((p - q) ** 2 + 4 * p * q * half * half);
        const solved = mapTriple(sides, side => side ?? third);
        return { triangles: [build(solved, radians)], reason: '' };
    }
    // SSA: side x faces the known angle X, side y faces unknown angle Y.
    const x = at(sides, angleIndex);
    const yIndex = sides.findIndex((side, i) => side !== undefined && i !== angleIndex);
    const y = at(sides, yIndex);
    const zIndex = 3 - angleIndex - yIndex;
    const sinY = (y * Math.sin(angle)) / x;
    let candidates;
    if (angle >= Math.PI / 2) {
        // Y must be acute and smaller than X, so x must be the longer side.
        candidates = x > y && !approxEqual(x, y, tolerance) ? [Math.asin(sinY)] : [];
    }
    else if (approxEqual(sinY, 1, tolerance)) {
        candidates = [Math.PI / 2]; // x exactly reaches the base: one right triangle
    }
    else if (sinY > 1) {
        candidates = [];
    }
    else {
        const acute = Math.asin(sinY);
        // The obtuse twin π − Y fits only when x is the shorter side.
        candidates = y > x && !approxEqual(x, y, tolerance) ? [acute, Math.PI - acute] : [acute];
    }
    if (candidates.length === 0) {
        const name = `${SIDE_KEYS[angleIndex]}=${x}, ${SIDE_KEYS[yIndex]}=${y}, ${ANGLE_KEYS[angleIndex]}=${given[angleIndex]}`;
        return none(`SSA parts ${name}: side ${SIDE_KEYS[angleIndex]} is too short to close a triangle`);
    }
    const triangles = candidates.map(yAngle => {
        const zAngle = Math.PI - angle - yAngle;
        const angles = [0, 0, 0];
        angles[angleIndex] = angle;
        angles[yIndex] = yAngle;
        angles[zIndex] = zAngle;
        const solved = [0, 0, 0];
        solved[angleIndex] = x;
        solved[yIndex] = y;
        solved[zIndex] = (x * Math.sin(zAngle)) / Math.sin(angle);
        return build(solved, angles);
    });
    return { triangles, reason: '' };
}
/**
 * Every triangle that fits the given parts (exactly three, at least one a
 * side). SSS, SAS, ASA and AAS give one triangle; SSA gives 0, 1 or 2, the
 * acute solution first. Parts that describe no triangle (triangle inequality
 * broken, angles summing to a half turn or more, SSA side too short) give
 * `[]`. Malformed input (wrong part count, non-positive or non-finite values,
 * an angle of a half turn or more, no side at all) throws `InvalidArgumentError`.
 *
 * ```ts
 * solveTriangles({ a: 7, b: 10, A: 30 }, { angleUnit: 'deg' }); // two triangles: B ≈ 45.58° or ≈ 134.42°
 * ```
 */
export function solveTriangles(parts, options) {
    return solveParts(parts, options).triangles;
}
/**
 * The one triangle that fits the given parts. Throws `InvalidArgumentError`
 * when the parts describe no triangle, or when they are an ambiguous SSA case
 * that fits two (use `solveTriangles` for that).
 *
 * ```ts
 * solveTriangle({ a: 3, b: 4, c: 5 }); // area 6, angleType 'right'
 * ```
 */
export function solveTriangle(parts, options) {
    const { triangles, reason } = solveParts(parts, options);
    const [first] = triangles;
    if (first === undefined)
        throw new InvalidArgumentError(`No triangle fits: ${reason}`);
    if (triangles.length > 1) {
        throw new InvalidArgumentError('These SSA parts fit two triangles; use solveTriangles to get both');
    }
    return first;
}
/** Diameter, circumference and area of a circle. */
export function circle(radius) {
    assertPositive(radius, 'radius');
    return { radius, diameter: 2 * radius, circumference: 2 * Math.PI * radius, area: Math.PI * radius * radius };
}
/**
 * Arc, chord, sector and segment of a circle cut by a central angle in
 * (0, one full turn].
 */
export function circleSector(sector, options) {
    const { radius, angle } = sector;
    assertPositive(radius, 'radius');
    assertPositive(angle, 'angle');
    const theta = toRadians(angle, angleUnitOf(options));
    if (theta > 2 * Math.PI * (1 + 1e-15))
        throw new InvalidArgumentError(`angle must be at most one full turn`);
    // θ − sin θ cancels for small θ; its Taylor series does not.
    const t2 = theta * theta;
    const thetaMinusSin = theta < 1e-2 ? ((theta * t2) / 6) * (1 - (t2 / 20) * (1 - (t2 / 42) * (1 - t2 / 72))) : theta - Math.sin(theta);
    return {
        arcLength: radius * theta,
        chordLength: Math.abs(2 * radius * Math.sin(theta / 2)),
        sectorArea: (radius * radius * theta) / 2,
        segmentArea: Math.max(0, (radius * radius * thetaMinusSin) / 2),
    };
}
/** Area, perimeter and eccentricity of an ellipse with the given semi-axes (either order). */
export function ellipse(axes) {
    const { semiAxisX, semiAxisY } = axes;
    assertPositive(semiAxisX, 'semiAxisX');
    assertPositive(semiAxisY, 'semiAxisY');
    const major = Math.max(semiAxisX, semiAxisY);
    const minor = Math.min(semiAxisX, semiAxisY);
    // Gauss–Kummer AGM: P = 2π / AGM(a, b) · (a² − Σ 2^(n−1) cₙ²), c₀² = a² − b², cₙ₊₁ = (aₙ − bₙ)/2.
    let an = major;
    let bn = minor;
    let sum = ((major - minor) * (major + minor)) / 2;
    let weight = 1;
    for (let i = 0; i < 64 && an - bn > an * Number.EPSILON; i++) {
        const c = (an - bn) / 2;
        sum += weight * c * c;
        weight *= 2;
        [an, bn] = [(an + bn) / 2, Math.sqrt(an * bn)];
    }
    const agm = (an + bn) / 2;
    const ratio = minor / major;
    return {
        area: Math.PI * major * minor,
        perimeter: ((2 * Math.PI) / agm) * (major * major - sum),
        eccentricity: Math.sqrt((1 - ratio) * (1 + ratio)),
    };
}
/** A regular polygon with `sides` (an integer ≥ 3) sides of length `sideLength`. */
export function regularPolygon(polygon, options) {
    const { sides, sideLength } = polygon;
    if (!Number.isSafeInteger(sides) || sides < 3) {
        throw new InvalidArgumentError(`sides must be an integer of at least 3, got ${sides}`);
    }
    assertPositive(sideLength, 'sideLength');
    const unit = angleUnitOf(options);
    const half = Math.PI / sides;
    const apothem = sideLength / (2 * Math.tan(half));
    const perimeter = sides * sideLength;
    return {
        perimeter,
        area: (perimeter * apothem) / 2,
        apothem,
        circumradius: sideLength / (2 * Math.sin(half)),
        // In the target unit directly, so a hexagon's interior angle is exactly 120°.
        interiorAngle: (HALF_TURN[unit] * (sides - 2)) / sides,
        exteriorAngle: (2 * HALF_TURN[unit]) / sides,
    };
}
export function sphere(radius) {
    assertPositive(radius, 'radius');
    return { volume: (4 / 3) * Math.PI * radius ** 3, surfaceArea: 4 * Math.PI * radius * radius };
}
export function cylinder(dimensions) {
    const { radius, height } = dimensions;
    assertPositive(radius, 'radius');
    assertPositive(height, 'height');
    const base = Math.PI * radius * radius;
    const lateralArea = 2 * Math.PI * radius * height;
    return { volume: base * height, lateralArea, surfaceArea: lateralArea + 2 * base };
}
export function cone(dimensions) {
    const { radius, height } = dimensions;
    assertPositive(radius, 'radius');
    assertPositive(height, 'height');
    const base = Math.PI * radius * radius;
    const slantHeight = Math.hypot(radius, height);
    const lateralArea = Math.PI * radius * slantHeight;
    return { volume: (base * height) / 3, slantHeight, lateralArea, surfaceArea: lateralArea + base };
}
/** A conical frustum: a cone with its tip cut off parallel to the base. */
export function frustum(dimensions) {
    const { bottomRadius: r1, topRadius: r2, height } = dimensions;
    assertPositive(r1, 'bottomRadius');
    assertPositive(r2, 'topRadius');
    assertPositive(height, 'height');
    const slantHeight = Math.hypot(r1 - r2, height);
    const lateralArea = Math.PI * (r1 + r2) * slantHeight;
    return {
        volume: (Math.PI * height * (r1 * r1 + r1 * r2 + r2 * r2)) / 3,
        slantHeight,
        lateralArea,
        surfaceArea: lateralArea + Math.PI * (r1 * r1 + r2 * r2),
    };
}
export function cube(side) {
    assertPositive(side, 'side');
    return { volume: side ** 3, surfaceArea: 6 * side * side, spaceDiagonal: Math.sqrt(3) * side };
}
/** A rectangular box. */
export function cuboid(dimensions) {
    const { length, width, height } = dimensions;
    assertPositive(length, 'length');
    assertPositive(width, 'width');
    assertPositive(height, 'height');
    return {
        volume: length * width * height,
        surfaceArea: 2 * (length * width + width * height + length * height),
        spaceDiagonal: Math.hypot(length, width, height),
    };
}
/** A right pyramid on a square base; `slantHeight` is the height of each triangular face. */
export function squarePyramid(dimensions) {
    const { baseSide, height } = dimensions;
    assertPositive(baseSide, 'baseSide');
    assertPositive(height, 'height');
    const base = baseSide * baseSide;
    const slantHeight = Math.hypot(baseSide / 2, height);
    const lateralArea = 2 * baseSide * slantHeight;
    return { volume: (base * height) / 3, slantHeight, lateralArea, surfaceArea: lateralArea + base };
}
/**
 * A ring torus: `majorRadius` from the centre to the tube's centre,
 * `minorRadius` of the tube. Requires `majorRadius ≥ minorRadius`; a spindle
 * torus overlaps itself and these formulas would count the overlap twice.
 */
export function torus(dimensions) {
    const { majorRadius: big, minorRadius: small } = dimensions;
    assertPositive(big, 'majorRadius');
    assertPositive(small, 'minorRadius');
    if (big < small)
        throw new InvalidArgumentError('majorRadius must be at least minorRadius');
    return { volume: 2 * Math.PI ** 2 * big * small * small, surfaceArea: 4 * Math.PI ** 2 * big * small };
}
function assertPoint(point, name, dimensions = [2, 3]) {
    if (!Array.isArray(point) || !dimensions.includes(point.length)) {
        throw new InvalidArgumentError(`${name} must be a ${dimensions.join('D or ')}D point`);
    }
    for (const [i, value] of point.entries())
        assertFinite(value, `${name}[${i}]`);
}
function assertSameDimension(a, b) {
    assertPoint(a, 'a');
    assertPoint(b, 'b');
    if (a.length !== b.length)
        throw new InvalidArgumentError(`Cannot mix a ${a.length}D and a ${b.length}D point`);
}
export function distance(a, b) {
    assertSameDimension(a, b);
    return Math.hypot(...a.map((value, i) => (b[i] ?? 0) - value));
}
export function midpoint(a, b) {
    assertSameDimension(a, b);
    const mid = (i) => {
        const p = a[i] ?? 0;
        const q = b[i] ?? 0;
        const half = (p + q) / 2;
        // (p + q) overflows only near ±MAX_VALUE; halving first is then exact enough.
        return (Number.isFinite(half) ? half : p / 2 + q / 2) + 0;
    };
    return a.length === 3 ? [mid(0), mid(1), mid(2)] : [mid(0), mid(1)];
}
/**
 * Signed area of a simple polygon by the shoelace formula: positive when the
 * vertices run counterclockwise (with y pointing up), negative when clockwise.
 * Do not repeat the first vertex at the end (it is harmless if you do). For a
 * self-intersecting polygon the result is the net of its oppositely wound parts.
 */
export function signedPolygonArea(vertices) {
    const points = [...vertices];
    if (points.length < 3)
        throw new InvalidArgumentError(`A polygon needs at least 3 vertices, got ${points.length}`);
    // A fan of triangles from the first vertex: same sum as the textbook
    // shoelace, with less cancellation for polygons far from the origin.
    let origin;
    let previous;
    let twice = 0;
    for (const [i, point] of points.entries()) {
        assertPoint(point, `vertices[${i}]`, [2]);
        if (origin === undefined)
            origin = point;
        else if (i >= 2 && previous !== undefined) {
            const [x0, y0] = origin;
            twice += (previous[0] - x0) * (point[1] - y0) - (point[0] - x0) * (previous[1] - y0);
        }
        previous = point;
    }
    return twice / 2 + 0;
}
/** Area of a simple polygon (shoelace formula), regardless of vertex order. */
export function polygonArea(vertices) {
    return Math.abs(signedPolygonArea(vertices));
}
// ---------------------------------------------------------------------------
// Pythagorean triples
// ---------------------------------------------------------------------------
function toExactInteger(value) {
    if (typeof value === 'bigint')
        return value;
    if (typeof value !== 'number')
        throw new TypeError('Pythagorean triple sides must be numbers or bigints');
    return Number.isInteger(value) ? BigInt(value) : undefined;
}
export function isPythagoreanTriple(a, b, c) {
    if (typeof a !== typeof b || typeof b !== typeof c) {
        throw new TypeError(`Cannot mix ${typeof a}, ${typeof b} and ${typeof c}; convert first`);
    }
    const sides = [toExactInteger(a), toExactInteger(b), toExactInteger(c)];
    const exact = [];
    for (const side of sides) {
        if (side === undefined || side <= 0n)
            return false;
        exact.push(side);
    }
    exact.sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
    const [p = 0n, q = 0n, r = 0n] = exact;
    return p * p + q * q === r * r;
}
/**
 * Every Pythagorean triple `[a, b, c]` with `a < b < c ≤ limit`, generated by
 * Euclid's formula (a = m² − n², b = 2mn, c = m² + n²), sorted by `c` then `a`.
 * With `primitive: true`, only triples whose sides share no common factor.
 * `limit` must be a non-negative safe integer; the result has roughly
 * `limit · ln(limit) / 2π` entries, so very large limits need a lot of memory.
 */
export function pythagoreanTriples(limit, options) {
    if (!Number.isSafeInteger(limit) || limit < 0) {
        throw new InvalidArgumentError(`limit must be a non-negative safe integer, got ${limit}`);
    }
    const primitiveOnly = options?.primitive ?? false;
    const triples = [];
    for (let m = 2; m * m + 1 <= limit; m++) {
        for (let n = 1; n < m; n++) {
            const c = m * m + n * n;
            if (c > limit)
                break;
            if ((m - n) % 2 === 0 || gcd(m, n) !== 1)
                continue;
            const odd = m * m - n * n;
            const even = 2 * m * n;
            const [a, b] = odd < even ? [odd, even] : [even, odd];
            for (let k = 1; k * c <= limit; k++) {
                triples.push([k * a, k * b, k * c]);
                if (primitiveOnly)
                    break;
            }
        }
    }
    return triples.sort((x, y) => x[2] - y[2] || x[0] - y[0]);
}
//# sourceMappingURL=geometry.js.map