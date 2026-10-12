/**
 * Unit conversion across eleven categories: length, mass, area, volume,
 * temperature, time, speed, data, energy, pressure and angle.
 *
 * Every factor is stored as an exact `Rational` (`1 in = 0.0254 m`,
 * `1 lb = 0.45359237 kg`, ...). `convert` rounds each pair's factor to a double
 * once, correctly, so `convert(1, 'in', 'cm') === 2.54`. `convertExact` keeps
 * the rational and never rounds.
 *
 * Unit symbols are the public identifiers and are case sensitive. Temperature
 * uses plain `'C' | 'F' | 'K'` (no `'°C'` aliases), area and volume powers are
 * written `m2`, `m3`. Volumes beyond `l`, `ml`, `cl`, `m3` are US customary.
 * Pounds, ounces and stones are avoirdupois. `cal` is the thermochemical
 * calorie (4.184 J). `kB`, `MB`, ... are decimal; `KiB`, `MiB`, ... are binary.
 *
 * Every numeric input must be finite; `NaN` and `±Infinity` throw.
 */
import { Rational } from './rational.js';
import type { RationalInput } from './rational.js';
export type LengthUnit = 'mm' | 'cm' | 'm' | 'km' | 'in' | 'ft' | 'yd' | 'mi' | 'nmi';
export type MassUnit = 'mg' | 'g' | 'kg' | 't' | 'oz' | 'lb' | 'st';
export type AreaUnit = 'mm2' | 'cm2' | 'm2' | 'ha' | 'km2' | 'in2' | 'ft2' | 'yd2' | 'ac' | 'mi2';
export type VolumeUnit = 'ml' | 'cl' | 'l' | 'm3' | 'tsp' | 'tbsp' | 'floz' | 'cup' | 'pt' | 'qt' | 'gal';
export type TemperatureUnit = 'C' | 'F' | 'K';
export type TimeUnit = 'ms' | 's' | 'min' | 'h' | 'd' | 'wk';
export type SpeedUnit = 'm/s' | 'km/h' | 'mph' | 'kn';
export type DataUnit = 'B' | 'kB' | 'MB' | 'GB' | 'TB' | 'KiB' | 'MiB' | 'GiB' | 'TiB' | 'bit';
export type EnergyUnit = 'J' | 'kJ' | 'cal' | 'kcal' | 'Wh' | 'kWh';
export type PressureUnit = 'Pa' | 'kPa' | 'bar' | 'atm' | 'psi' | 'mmHg';
export type AngleUnit = 'deg' | 'rad' | 'grad' | 'turn';
export type UnitCategory = 'length' | 'mass' | 'area' | 'volume' | 'temperature' | 'time' | 'speed' | 'data' | 'energy' | 'pressure' | 'angle';
/** Every supported unit symbol. */
export type Unit = LengthUnit | MassUnit | AreaUnit | VolumeUnit | TemperatureUnit | TimeUnit | SpeedUnit | DataUnit | EnergyUnit | PressureUnit | AngleUnit;
export type FormatUnitOptions = {
    /** BCP 47 locale; defaults to the runtime's. */
    locale?: string;
    /** `'short'` (default) → `5 km`, `'long'` → `5 kilometers`, `'narrow'` → `5km`. */
    display?: 'short' | 'long' | 'narrow';
    maximumFractionDigits?: number;
};
/** True when `value` is one of the supported unit symbols (case sensitive). */
export declare function isUnit(value: string): value is Unit;
/** The category a unit belongs to. */
export declare function unitCategory(unit: Unit): UnitCategory;
/** Every unit symbol in a category, in display order. */
export declare function unitsOf(category: UnitCategory): readonly Unit[];
/**
 * Converts `value` between two units of the same category, in doubles.
 * `convert(1, 'in', 'cm')` is exactly `2.54`; `convert(100, 'C', 'F')` is `212`.
 * Throws `InvalidArgumentError` for unknown units or units of different categories.
 */
export declare function convert(value: number, from: Unit, to: Unit): number;
/**
 * Converts exactly, returning a `Rational`. Linear categories multiply by an
 * exact ratio; temperature applies its exact affine formulas
 * (`°F = °C × 9/5 + 32`, `K = °C + 273.15`).
 *
 * Angles between `deg`, `grad` and `turn` are exact. Any conversion between
 * `rad` and another angle unit needs π and throws `RoundingNecessaryError`
 * (`rad` to `rad` is fine). Use `convert` for those.
 */
export declare function convertExact(value: RationalInput, from: Unit, to: Unit): Rational;
/**
 * Formats `value` with its unit through `Intl.NumberFormat`: `formatUnit(5, 'km')`
 * is `'5 km'`, and with `{ display: 'long' }` it is `'5 kilometers'`. Units Intl
 * has no name for (`nmi`, `psi`, `rad`, `K`, ...) print as the number, a space and
 * the symbol; `display` does not apply to them.
 */
export declare function formatUnit(value: number, unit: Unit, options?: FormatUnitOptions): string;
//# sourceMappingURL=units.d.ts.map