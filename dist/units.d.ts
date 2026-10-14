/**
 * Unit conversion across twenty-two categories: length, mass, area, volume,
 * temperature, time, speed, data, energy, pressure, angle, solid angle, power,
 * frequency, force, torque, fuel economy, data rate, electric current,
 * illuminance, radioactivity, dynamic viscosity and kinematic viscosity.
 *
 * Every factor is stored as an exact `Rational` (`1 in = 0.0254 m`,
 * `1 lb = 0.45359237 kg`, ...). `convert` rounds each pair's factor to a double
 * once, correctly, so `convert(1, 'in', 'cm') === 2.54`. `convertExact` keeps
 * the rational and never rounds.
 *
 * `pc` is the IAU 2015 parsec, 648000/π au: it involves π, so like `rad` it converts
 * with `convert` and makes `convertExact` throw. `fathom` is 6 ft, `ct` the metric
 * carat (0.2 g), `ton_us` the short ton (2000 lb) and `ton_uk` the long ton (2240 lb).
 * `kcal/h` uses the thermochemical kilocalorie, like `kcal`; `ft*lbf` is foot-pound-force.
 *
 * Unit symbols are the public identifiers and are case sensitive. Temperature
 * uses plain `'C' | 'F' | 'K'` (no `'°C'` aliases), area and volume powers are
 * written `m2`, `m3`. Volumes beyond `l`, `ml`, `cl`, `m3` are US customary.
 * Pounds, ounces and stones are avoirdupois. `cal` is the thermochemical
 * calorie (4.184 J). `kB`, `MB`, ... are decimal; `KiB`, `MiB`, ... are binary.
 *
 * `hp` is the mechanical (imperial) horsepower and `hp_metric` the metric one
 * (PS). `mpg` is the US miles per US gallon, `mpg_imp` miles per imperial gallon.
 * Fuel economy is the one reciprocal category: `l/100km` is litres per distance,
 * so it converts to the others by `100 / x`, and zero has no counterpart.
 *
 * `µ` is the micro sign U+00B5 (`µm`, `µA`, `µCi`). `month` and `year` follow the
 * convention of most unit converters: the Julian year of 365.25 days (31 557 600 s)
 * and a month of one twelfth of it (30.4375 days); calendar months and years vary,
 * so use a date library for those. `au` is the IAU 2012 value, `ly` the light year
 * of one Julian year at c. `gal_imp`, `qt_imp`, `pt_imp`, `floz_imp` are imperial;
 * `Torr` is 101325/760 Pa. `fc` (foot-candle) is one lumen per square foot, `Ci`
 * (curie) is 3.7e10 Bq. Dynamic viscosity (`Pa*s`, `P`) and kinematic viscosity
 * (`m2/s`, `St`) are different quantities and separate categories.
 *
 * Every numeric input must be finite; `NaN` and `±Infinity` throw.
 */
import type { RationalInput } from './rational.js';
import type { RoundingMode } from './rounding.js';
import { Rational } from './rational.js';
export type LengthUnit = 'nm' | 'µm' | 'mm' | 'cm' | 'dm' | 'm' | 'km' | 'in' | 'ft' | 'yd' | 'fathom' | 'mi' | 'nmi' | 'au' | 'ly' | 'pc';
export type MassUnit = 'mg' | 'ct' | 'g' | 'kg' | 't' | 'oz' | 'lb' | 'st' | 'ton_us' | 'ton_uk';
export type AreaUnit = 'mm2' | 'cm2' | 'm2' | 'ha' | 'km2' | 'in2' | 'ft2' | 'yd2' | 'ac' | 'mi2';
export type VolumeUnit = 'ml' | 'cl' | 'l' | 'cm3' | 'm3' | 'in3' | 'ft3' | 'yd3' | 'tsp' | 'tbsp' | 'floz' | 'cup' | 'pt' | 'qt' | 'gal' | 'floz_imp' | 'pt_imp' | 'qt_imp' | 'gal_imp';
export type TemperatureUnit = 'C' | 'F' | 'K';
export type TimeUnit = 'ms' | 's' | 'min' | 'h' | 'd' | 'wk' | 'month' | 'year';
export type SpeedUnit = 'm/s' | 'km/h' | 'mph' | 'kn' | 'ft/s';
export type DataUnit = 'B' | 'kB' | 'MB' | 'GB' | 'TB' | 'PB' | 'EB' | 'KiB' | 'MiB' | 'GiB' | 'TiB' | 'PiB' | 'EiB' | 'bit' | 'kbit' | 'Mbit' | 'Gbit' | 'Kibit' | 'Mibit' | 'Gibit';
export type EnergyUnit = 'J' | 'kJ' | 'cal' | 'kcal' | 'Wh' | 'kWh' | 'MJ' | 'GJ' | 'BTU' | 'eV' | 'ft*lbf';
export type PressureUnit = 'Pa' | 'kPa' | 'MPa' | 'bar' | 'atm' | 'psi' | 'mmHg' | 'Torr';
export type AngleUnit = 'deg' | 'rad' | 'grad' | 'turn' | 'arcmin' | 'arcsec';
export type SolidAngleUnit = 'sr' | 'deg2';
export type PowerUnit = 'W' | 'kW' | 'MW' | 'hp' | 'hp_metric' | 'BTU/h' | 'kcal/h';
export type FrequencyUnit = 'Hz' | 'kHz' | 'MHz' | 'GHz' | 'rpm';
export type ForceUnit = 'N' | 'kN' | 'lbf' | 'kgf' | 'dyn';
export type TorqueUnit = 'N*m' | 'lbf*ft' | 'kgf*m';
export type FuelEconomyUnit = 'km/l' | 'l/100km' | 'mpg' | 'mpg_imp';
export type DataRateUnit = 'bit/s' | 'kbit/s' | 'Mbit/s' | 'Gbit/s' | 'B/s' | 'kB/s' | 'MB/s' | 'GB/s' | 'MiB/s';
export type ElectricCurrentUnit = 'µA' | 'mA' | 'A' | 'kA';
export type IlluminanceUnit = 'lx' | 'fc';
export type RadioactivityUnit = 'Bq' | 'kBq' | 'MBq' | 'µCi' | 'mCi' | 'Ci';
export type DynamicViscosityUnit = 'Pa*s' | 'mPa*s' | 'P' | 'cP';
export type KinematicViscosityUnit = 'm2/s' | 'cSt' | 'St';
export type UnitCategory = 'length' | 'mass' | 'area' | 'volume' | 'temperature' | 'time' | 'speed' | 'data' | 'energy' | 'pressure' | 'angle' | 'solidAngle' | 'power' | 'frequency' | 'force' | 'torque' | 'fuelEconomy' | 'dataRate' | 'electricCurrent' | 'illuminance' | 'radioactivity' | 'dynamicViscosity' | 'kinematicViscosity';
/** Every supported unit symbol. */
export type Unit = LengthUnit | MassUnit | AreaUnit | VolumeUnit | TemperatureUnit | TimeUnit | SpeedUnit | DataUnit | EnergyUnit | PressureUnit | AngleUnit | SolidAngleUnit | PowerUnit | FrequencyUnit | ForceUnit | TorqueUnit | FuelEconomyUnit | DataRateUnit | ElectricCurrentUnit | IlluminanceUnit | RadioactivityUnit | DynamicViscosityUnit | KinematicViscosityUnit;
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
 * Throws `InvalidArgumentError` for unknown units or units of different categories,
 * and for `0` to or from `l/100km` (zero fuel use or zero distance per litre is infinite).
 */
export declare function convert(value: number, from: Unit, to: Unit): number;
/**
 * Converts exactly, returning a `Rational`. Linear categories multiply by an
 * exact ratio; temperature applies its exact affine formulas
 * (`°F = °C × 9/5 + 32`, `K = °C + 273.15`); `l/100km` takes the exact
 * reciprocal (`mpg` → `l/100km` is `100 / km-per-litre`).
 *
 * π splits three categories in two: `rad` from the other angle units
 * (`deg` = π/180 rad), `sr` from `deg2` (= (π/180)² sr), and `pc` (= 648000/π
 * au) from every other length. Conversions within one side are exact: `deg`,
 * `grad`, `turn`, `arcmin` and `arcsec` among themselves, `sr` to `sr`, `deg2`
 * to `deg2`, `pc` to `pc`, and the other lengths among themselves. Crossing the
 * split — `rad` ↔ `deg`, `sr` ↔ `deg2`, `pc` ↔ `ly` or `m` — needs π and throws
 * `RoundingNecessaryError`. Use `convert` for those.
 */
export declare function convertExact(value: RationalInput, from: Unit, to: Unit): Rational;
/** One part of a composite value, such as the `7 in` of "5 ft 7 in". */
export type UnitPart = {
    readonly unit: Unit;
    readonly value: number;
};
export type SplitUnitsOptions = {
    /**
     * Fraction digits kept on the last part. Leave it out to keep the exact remainder
     * (as a double). The value is rounded once, in the last unit, before it is split,
     * so a rounded-up remainder carries into the larger parts: 5 ft 11.6 in at
     * `scale: 0` is 6 ft 0 in, never 5 ft 12 in.
     */
    scale?: number;
    /** How to round to `scale`. Defaults to `'halfUp'`. Ignored without `scale`. */
    rounding?: RoundingMode;
};
/**
 * Splits a value into whole parts of larger units plus a remainder, for display like
 * "5 ft 7 in", "1 h 30 min" or "3 lb 4 oz". `units` go largest first and share one
 * category: `splitUnits(67, 'in', ['ft', 'in'])` is `[{ unit: 'ft', value: 5 }, { unit: 'in', value: 7 }]`.
 *
 * Every part but the last is an integer; the last holds the remainder. The parts add up
 * to the input exactly (`joinUnits` is the inverse), because the arithmetic uses the exact
 * rational factors, not doubles. A negative value puts its sign on the first non-zero
 * part only, so `-67 in` is `-5 ft` and `7 in`, meaning minus (5 ft + 7 in); `joinUnits` reads it back the same way.
 *
 * Throws `InvalidArgumentError` for an empty list, unknown or mixed categories, units not
 * strictly largest-first, temperature and fuel economy (not additive), or a non-finite
 * `value`; `RoundingNecessaryError` for units that mix π (`rad` with `deg`, `pc` with `ly`).
 */
export declare function splitUnits(value: RationalInput, from: Unit, units: readonly Unit[], options?: SplitUnitsOptions): UnitPart[];
/**
 * Adds composite parts back into one number in `to`: `joinUnits([{ unit: 'ft', value: 5 },
 * { unit: 'in', value: 7 }], 'in')` is `67`. Parts may come in any order and may be fractional.
 * It reads parts the way `splitUnits` writes them: the sign of the first non-zero part applies
 * to the whole value, so `-5 ft 7 in` is minus (5 ft + 7 in), `-67 in`. Later parts must not
 * be negative (`InvalidArgumentError`); that would be ambiguous. The sum is exact, rounded to
 * a double once at the end.
 */
export declare function joinUnits(parts: readonly UnitPart[], to: Unit): number;
/**
 * Formats `value` with its unit through `Intl.NumberFormat`: `formatUnit(5, 'km')`
 * is `'5 km'`, and with `{ display: 'long' }` it is `'5 kilometers'`. Units Intl
 * has no name for (`nmi`, `psi`, `rad`, `K`, ...) print as the number, a space and
 * the symbol; `display` does not apply to them. Power, frequency, force, torque,
 * fuel economy and data rates all take this path (`Intl` names none of them),
 * with `hp_metric` shown as `PS` and `N*m` as `N·m`.
 */
export declare function formatUnit(value: number, unit: Unit, options?: FormatUnitOptions): string;
//# sourceMappingURL=units.d.ts.map