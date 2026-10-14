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
import type { AngleUnit } from './units.js';
export type AngleOptions = {
    /** Unit of every angle in and out. Default `'rad'`. */
    angleUnit?: AngleUnit;
};
/**
 * Known parts of a triangle. Side `a` is opposite angle `A`, `b` opposite `B`,
 * `c` opposite `C`. Give exactly three parts, at least one of them a side.
 */
export type TriangleParts = {
    readonly a?: number;
    readonly b?: number;
    readonly c?: number;
    readonly A?: number;
    readonly B?: number;
    readonly C?: number;
};
export type TriangleOptions = AngleOptions & {
    /**
     * Relative tolerance (as in `approxEqual`) for classification and for the
     * SSA case where the given side exactly reaches the base. Default `1e-9`.
     */
    tolerance?: number;
};
export type TriangleSideType = 'equilateral' | 'isosceles' | 'scalene';
export type TriangleAngleType = 'acute' | 'right' | 'obtuse';
/** A solved triangle. Angles are in the requested `angleUnit`. */
export type Triangle = {
    readonly a: number;
    readonly b: number;
    readonly c: number;
    readonly A: number;
    readonly B: number;
    readonly C: number;
    readonly area: number;
    readonly perimeter: number;
    readonly sideType: TriangleSideType;
    readonly angleType: TriangleAngleType;
};
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
export declare function solveTriangles(parts: TriangleParts, options?: TriangleOptions): readonly Triangle[];
/**
 * The one triangle that fits the given parts. Throws `InvalidArgumentError`
 * when the parts describe no triangle, or when they are an ambiguous SSA case
 * that fits two (use `solveTriangles` for that).
 *
 * ```ts
 * solveTriangle({ a: 3, b: 4, c: 5 }); // area 6, angleType 'right'
 * ```
 */
export declare function solveTriangle(parts: TriangleParts, options?: TriangleOptions): Triangle;
export type Circle = {
    readonly radius: number;
    readonly diameter: number;
    readonly circumference: number;
    readonly area: number;
};
/** Diameter, circumference and area of a circle. */
export declare function circle(radius: number): Circle;
export type CircleSector = {
    readonly arcLength: number;
    readonly chordLength: number;
    readonly sectorArea: number;
    /** Area between the arc and its chord. */
    readonly segmentArea: number;
};
/**
 * Arc, chord, sector and segment of a circle cut by a central angle in
 * (0, one full turn].
 */
export declare function circleSector(sector: {
    readonly radius: number;
    readonly angle: number;
}, options?: AngleOptions): CircleSector;
export type Ellipse = {
    readonly area: number;
    /** Exact to double precision (arithmetic-geometric mean), not an approximation. */
    readonly perimeter: number;
    /** 0 for a circle, approaching 1 as the ellipse flattens. */
    readonly eccentricity: number;
};
/** Area, perimeter and eccentricity of an ellipse with the given semi-axes (either order). */
export declare function ellipse(axes: {
    readonly semiAxisX: number;
    readonly semiAxisY: number;
}): Ellipse;
export type RegularPolygon = {
    readonly perimeter: number;
    readonly area: number;
    /** Distance from the centre to the middle of a side (inradius). */
    readonly apothem: number;
    /** Distance from the centre to a vertex. */
    readonly circumradius: number;
    readonly interiorAngle: number;
    /** Equal to the central angle: one turn divided by the side count. */
    readonly exteriorAngle: number;
};
/** A regular polygon with `sides` (an integer ≥ 3) sides of length `sideLength`. */
export declare function regularPolygon(polygon: {
    readonly sides: number;
    readonly sideLength: number;
}, options?: AngleOptions): RegularPolygon;
export type Solid = {
    readonly volume: number;
    /** Total surface area, bases included. */
    readonly surfaceArea: number;
};
/** A solid with a curved or slanted side: `lateralArea` excludes the bases. */
export type LateralSolid = Solid & {
    readonly lateralArea: number;
};
/** A cone, pyramid or frustum: `slantHeight` runs along the side from base edge to apex (or top edge). */
export type SlantSolid = LateralSolid & {
    readonly slantHeight: number;
};
export type Box = Solid & {
    readonly spaceDiagonal: number;
};
export declare function sphere(radius: number): Solid;
export declare function cylinder(dimensions: {
    readonly radius: number;
    readonly height: number;
}): LateralSolid;
export declare function cone(dimensions: {
    readonly radius: number;
    readonly height: number;
}): SlantSolid;
/** A conical frustum: a cone with its tip cut off parallel to the base. */
export declare function frustum(dimensions: {
    readonly bottomRadius: number;
    readonly topRadius: number;
    readonly height: number;
}): SlantSolid;
export declare function cube(side: number): Box;
/** A rectangular box. */
export declare function cuboid(dimensions: {
    readonly length: number;
    readonly width: number;
    readonly height: number;
}): Box;
/** A right pyramid on a square base; `slantHeight` is the height of each triangular face. */
export declare function squarePyramid(dimensions: {
    readonly baseSide: number;
    readonly height: number;
}): SlantSolid;
/**
 * A ring torus: `majorRadius` from the centre to the tube's centre,
 * `minorRadius` of the tube. Requires `majorRadius ≥ minorRadius`; a spindle
 * torus overlaps itself and these formulas would count the overlap twice.
 */
export declare function torus(dimensions: {
    readonly majorRadius: number;
    readonly minorRadius: number;
}): Solid;
export type Point2 = readonly [x: number, y: number];
export type Point3 = readonly [x: number, y: number, z: number];
/** Euclidean distance between two points of the same dimension. */
export declare function distance(a: Point2, b: Point2): number;
export declare function distance(a: Point3, b: Point3): number;
/** The point halfway between two points of the same dimension. */
export declare function midpoint(a: Point2, b: Point2): Point2;
export declare function midpoint(a: Point3, b: Point3): Point3;
/**
 * Signed area of a simple polygon by the shoelace formula: positive when the
 * vertices run counterclockwise (with y pointing up), negative when clockwise.
 * Do not repeat the first vertex at the end (it is harmless if you do). For a
 * self-intersecting polygon the result is the net of its oppositely wound parts.
 */
export declare function signedPolygonArea(vertices: Iterable<Point2>): number;
/** Area of a simple polygon (shoelace formula), regardless of vertex order. */
export declare function polygonArea(vertices: Iterable<Point2>): number;
/**
 * Whether three positive integers are a Pythagorean triple, in any order
 * (the largest is taken as the hypotenuse). Exact: `number` inputs are
 * squared as `bigint`, so large integers are not misjudged by rounding.
 * Non-integers and non-positive values are simply not triples.
 */
export declare function isPythagoreanTriple(a: number, b: number, c: number): boolean;
export declare function isPythagoreanTriple(a: bigint, b: bigint, c: bigint): boolean;
export type PythagoreanTriple = readonly [a: number, b: number, c: number];
/**
 * Every Pythagorean triple `[a, b, c]` with `a < b < c ≤ limit`, generated by
 * Euclid's formula (a = m² − n², b = 2mn, c = m² + n²), sorted by `c` then `a`.
 * With `primitive: true`, only triples whose sides share no common factor.
 * `limit` must be a non-negative safe integer; the result has roughly
 * `limit · ln(limit) / 2π` entries, so very large limits need a lot of memory.
 */
export declare function pythagoreanTriples(limit: number, options?: {
    primitive?: boolean;
}): PythagoreanTriple[];
//# sourceMappingURL=geometry.d.ts.map