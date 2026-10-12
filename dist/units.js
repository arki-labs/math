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
import { InvalidArgumentError, RoundingNecessaryError } from './errors.js';
import { ratio } from './internal/exact.js';
import { assertFinite } from './number.js';
import { Rational } from './rational.js';
const UNITS_BY_CATEGORY = {
    length: ['mm', 'cm', 'm', 'km', 'in', 'ft', 'yd', 'mi', 'nmi'],
    mass: ['mg', 'g', 'kg', 't', 'oz', 'lb', 'st'],
    area: ['mm2', 'cm2', 'm2', 'ha', 'km2', 'in2', 'ft2', 'yd2', 'ac', 'mi2'],
    volume: ['ml', 'cl', 'l', 'm3', 'tsp', 'tbsp', 'floz', 'cup', 'pt', 'qt', 'gal'],
    temperature: ['C', 'F', 'K'],
    time: ['ms', 's', 'min', 'h', 'd', 'wk'],
    speed: ['m/s', 'km/h', 'mph', 'kn'],
    data: ['B', 'kB', 'MB', 'GB', 'TB', 'KiB', 'MiB', 'GiB', 'TiB', 'bit'],
    energy: ['J', 'kJ', 'cal', 'kcal', 'Wh', 'kWh'],
    pressure: ['Pa', 'kPa', 'bar', 'atm', 'psi', 'mmHg'],
    angle: ['deg', 'rad', 'grad', 'turn'],
};
const CATEGORY_OF = new Map(Object.entries(UNITS_BY_CATEGORY).flatMap(([category, units]) => units.map((unit) => [unit, category])));
const lin = (r) => ({ r, pi: 0 });
// Exact definitions -----------------------------------------------------------
const M_PER_IN = ratio('0.0254'); // international inch, 1959
const KG_PER_LB = ratio('0.45359237'); // international avoirdupois pound, 1959
const G_STANDARD = ratio('9.80665'); // standard gravity, m/s², exact by definition (CGPM 1901)
const M_PER_FT = M_PER_IN.times(12);
const M_PER_YD = M_PER_FT.times(3);
const M_PER_MI = M_PER_YD.times(1760);
const M_PER_NMI = ratio(1852); // international nautical mile
const L_PER_IN3 = M_PER_IN.pow(3).times(1000); // 1 l = 1 dm³ = 0.001 m³
const L_PER_GAL = L_PER_IN3.times(231); // US liquid gallon = 231 in³
const L_PER_QT = L_PER_GAL.dividedBy(4);
const L_PER_PT = L_PER_QT.dividedBy(2);
const L_PER_CUP = L_PER_PT.dividedBy(2);
const L_PER_FLOZ = L_PER_CUP.dividedBy(8);
const L_PER_TBSP = L_PER_FLOZ.dividedBy(2);
const L_PER_TSP = L_PER_TBSP.dividedBy(3);
const PA_PER_ATM = ratio(101_325); // standard atmosphere, exact by definition
const SECONDS_PER_HOUR = ratio(3600);
function lengthFactors() {
    return {
        mm: lin(ratio(1, 1000)),
        cm: lin(ratio(1, 100)),
        m: lin(ratio(1)),
        km: lin(ratio(1000)),
        in: lin(M_PER_IN),
        ft: lin(M_PER_FT),
        yd: lin(M_PER_YD),
        mi: lin(M_PER_MI),
        nmi: lin(M_PER_NMI),
    };
}
function massFactors() {
    return {
        mg: lin(ratio(1, 1_000_000)),
        g: lin(ratio(1, 1000)),
        kg: lin(ratio(1)),
        t: lin(ratio(1000)),
        oz: lin(KG_PER_LB.dividedBy(16)),
        lb: lin(KG_PER_LB),
        st: lin(KG_PER_LB.times(14)),
    };
}
function areaFactors() {
    const sq = (metres) => lin(metres.pow(2));
    return {
        mm2: sq(ratio(1, 1000)),
        cm2: sq(ratio(1, 100)),
        m2: sq(ratio(1)),
        ha: lin(ratio(10_000)),
        km2: sq(ratio(1000)),
        in2: sq(M_PER_IN),
        ft2: sq(M_PER_FT),
        yd2: sq(M_PER_YD),
        ac: lin(M_PER_YD.pow(2).times(4840)),
        mi2: sq(M_PER_MI),
    };
}
function volumeFactors() {
    return {
        ml: lin(ratio(1, 1000)),
        cl: lin(ratio(1, 100)),
        l: lin(ratio(1)),
        m3: lin(ratio(1000)),
        tsp: lin(L_PER_TSP),
        tbsp: lin(L_PER_TBSP),
        floz: lin(L_PER_FLOZ),
        cup: lin(L_PER_CUP),
        pt: lin(L_PER_PT),
        qt: lin(L_PER_QT),
        gal: lin(L_PER_GAL),
    };
}
function timeFactors() {
    return {
        ms: lin(ratio(1, 1000)),
        s: lin(ratio(1)),
        min: lin(ratio(60)),
        h: lin(SECONDS_PER_HOUR),
        d: lin(ratio(86_400)),
        wk: lin(ratio(604_800)),
    };
}
function speedFactors() {
    return {
        'm/s': lin(ratio(1)),
        'km/h': lin(ratio(1000).dividedBy(SECONDS_PER_HOUR)),
        mph: lin(M_PER_MI.dividedBy(SECONDS_PER_HOUR)),
        kn: lin(M_PER_NMI.dividedBy(SECONDS_PER_HOUR)),
    };
}
function dataFactors() {
    return {
        B: lin(ratio(1)),
        kB: lin(ratio(1000)),
        MB: lin(ratio(1000).pow(2)),
        GB: lin(ratio(1000).pow(3)),
        TB: lin(ratio(1000).pow(4)),
        KiB: lin(ratio(1024)),
        MiB: lin(ratio(1024).pow(2)),
        GiB: lin(ratio(1024).pow(3)),
        TiB: lin(ratio(1024).pow(4)),
        bit: lin(ratio(1, 8)),
    };
}
function energyFactors() {
    const calorie = ratio('4.184'); // thermochemical calorie
    return {
        J: lin(ratio(1)),
        kJ: lin(ratio(1000)),
        cal: lin(calorie),
        kcal: lin(calorie.times(1000)),
        Wh: lin(SECONDS_PER_HOUR),
        kWh: lin(SECONDS_PER_HOUR.times(1000)),
    };
}
function pressureFactors() {
    return {
        Pa: lin(ratio(1)),
        kPa: lin(ratio(1000)),
        bar: lin(ratio(100_000)),
        atm: lin(PA_PER_ATM),
        // 1 psi = 1 lbf / 1 in², with 1 lbf = 1 lb × standard gravity.
        psi: lin(KG_PER_LB.times(G_STANDARD).dividedBy(M_PER_IN.pow(2))),
        mmHg: lin(PA_PER_ATM.dividedBy(760)),
    };
}
/** Base unit is the radian: `deg = π/180`, `grad = π/200`, `turn = 2π`. */
function angleFactors() {
    return {
        deg: { r: ratio(1, 180), pi: 1 },
        rad: { r: ratio(1), pi: 0 },
        grad: { r: ratio(1, 200), pi: 1 },
        turn: { r: ratio(2), pi: 1 },
    };
}
const FACTOR_BUILDERS = {
    length: lengthFactors,
    mass: massFactors,
    area: areaFactors,
    volume: volumeFactors,
    time: timeFactors,
    speed: speedFactors,
    data: dataFactors,
    energy: energyFactors,
    pressure: pressureFactors,
    angle: angleFactors,
};
// Tables are built on first use of their category, so importing the module costs nothing.
const factorTables = new Map();
function factorOf(category, unit) {
    let table = factorTables.get(category);
    if (table === undefined) {
        table = FACTOR_BUILDERS[category]();
        factorTables.set(category, table);
    }
    const factor = table[unit];
    if (factor === undefined)
        throw new InvalidArgumentError(`Unknown ${category} unit "${unit}"`);
    return factor;
}
// Temperature (affine, exact rationals) ----------------------------------------
const KELVIN_OFFSET = ratio('273.15');
const NINE_FIFTHS = ratio(9, 5);
const FIVE_NINTHS = ratio(5, 9);
function toCelsiusExact(value, from) {
    if (from === 'C')
        return value;
    if (from === 'K')
        return value.minus(KELVIN_OFFSET);
    return value.minus(32).times(FIVE_NINTHS);
}
function fromCelsiusExact(celsius, to) {
    if (to === 'C')
        return celsius;
    if (to === 'K')
        return celsius.plus(KELVIN_OFFSET);
    return celsius.times(NINE_FIFTHS).plus(32);
}
function toCelsius(value, from) {
    if (from === 'C')
        return value;
    if (from === 'K')
        return value - 273.15;
    return (value - 32) * (5 / 9);
}
function fromCelsius(celsius, to) {
    if (to === 'C')
        return celsius;
    if (to === 'K')
        return celsius + 273.15;
    return celsius * 1.8 + 32;
}
// Public API -------------------------------------------------------------------
/** True when `value` is one of the supported unit symbols (case sensitive). */
export function isUnit(value) {
    return CATEGORY_OF.has(value);
}
/** The category a unit belongs to. */
export function unitCategory(unit) {
    const category = CATEGORY_OF.get(unit);
    if (category === undefined)
        throw new InvalidArgumentError(`Unknown unit "${unit}"`);
    return category;
}
/** Every unit symbol in a category, in display order. */
export function unitsOf(category) {
    return UNITS_BY_CATEGORY[category];
}
function sharedCategory(from, to) {
    const fromCategory = CATEGORY_OF.get(from);
    const toCategory = CATEGORY_OF.get(to);
    if (fromCategory === undefined && toCategory === undefined) {
        throw new InvalidArgumentError(`Unknown units "${from}" and "${to}"`);
    }
    if (fromCategory === undefined || toCategory === undefined) {
        const known = fromCategory ?? toCategory;
        const bad = fromCategory === undefined ? from : to;
        if (known === undefined)
            throw new InvalidArgumentError(`Unknown unit "${bad}"`);
        throw new InvalidArgumentError(`Unknown unit "${bad}"; ${known} units are: ${unitsOf(known).join(', ')}`);
    }
    if (fromCategory !== toCategory) {
        throw new InvalidArgumentError(`Cannot convert ${fromCategory} ("${from}") to ${toCategory} ("${to}")`);
    }
    return fromCategory;
}
// Rounded once per (from, to) pair; a conversion is then a single multiply.
const pairFactors = new Map();
function pairFactor(category, from, to) {
    const key = `${from}\u0000${to}`;
    const cached = pairFactors.get(key);
    if (cached !== undefined)
        return cached;
    const f = factorOf(category, from);
    const t = factorOf(category, to);
    const exact = f.r.dividedBy(t.r).toNumber();
    const power = f.pi - t.pi;
    const factor = power === 0 ? exact : power > 0 ? exact * Math.PI : exact / Math.PI;
    pairFactors.set(key, factor);
    return factor;
}
/**
 * Converts `value` between two units of the same category, in doubles.
 * `convert(1, 'in', 'cm')` is exactly `2.54`; `convert(100, 'C', 'F')` is `212`.
 * Throws `InvalidArgumentError` for unknown units or units of different categories.
 */
export function convert(value, from, to) {
    assertFinite(value, 'value');
    const category = sharedCategory(from, to);
    if (from === to)
        return value;
    if (category === 'temperature') {
        return fromCelsius(toCelsius(value, from), to);
    }
    return value * pairFactor(category, from, to);
}
/**
 * Converts exactly, returning a `Rational`. Linear categories multiply by an
 * exact ratio; temperature applies its exact affine formulas
 * (`°F = °C × 9/5 + 32`, `K = °C + 273.15`).
 *
 * Angles between `deg`, `grad` and `turn` are exact. Any conversion between
 * `rad` and another angle unit needs π and throws `RoundingNecessaryError`
 * (`rad` to `rad` is fine). Use `convert` for those.
 */
export function convertExact(value, from, to) {
    const input = Rational.from(value);
    const category = sharedCategory(from, to);
    if (from === to)
        return input;
    if (category === 'temperature') {
        return fromCelsiusExact(toCelsiusExact(input, from), to);
    }
    const f = factorOf(category, from);
    const t = factorOf(category, to);
    if (f.pi !== t.pi) {
        throw new RoundingNecessaryError(`Converting ${from} to ${to} involves π and has no exact rational result`);
    }
    return input.times(f.r).dividedBy(t.r);
}
// formatUnit -------------------------------------------------------------------
/** Our symbols mapped to the identifiers `Intl.NumberFormat` accepts for `style: 'unit'`. */
const INTL_UNITS = {
    mm: 'millimeter',
    cm: 'centimeter',
    m: 'meter',
    km: 'kilometer',
    in: 'inch',
    ft: 'foot',
    yd: 'yard',
    mi: 'mile',
    g: 'gram',
    kg: 'kilogram',
    oz: 'ounce',
    lb: 'pound',
    st: 'stone',
    ha: 'hectare',
    ac: 'acre',
    ml: 'milliliter',
    l: 'liter',
    floz: 'fluid-ounce',
    gal: 'gallon',
    C: 'celsius',
    F: 'fahrenheit',
    ms: 'millisecond',
    s: 'second',
    min: 'minute',
    h: 'hour',
    d: 'day',
    wk: 'week',
    'm/s': 'meter-per-second',
    'km/h': 'kilometer-per-hour',
    mph: 'mile-per-hour',
    B: 'byte',
    kB: 'kilobyte',
    MB: 'megabyte',
    GB: 'gigabyte',
    TB: 'terabyte',
    bit: 'bit',
    deg: 'degree',
};
const MAX_FORMATTERS = 256;
const formatters = new Map();
/** Bounded cache: past 256 entries the oldest insertion is evicted. */
function getFormatter(locale, intlUnit, display, maximumFractionDigits) {
    const key = `${locale ?? ''}|${intlUnit ?? ''}|${display}|${maximumFractionDigits ?? ''}`;
    const cached = formatters.get(key);
    if (cached)
        return cached;
    const created = intlUnit === undefined
        ? new Intl.NumberFormat(locale, { maximumFractionDigits })
        : new Intl.NumberFormat(locale, { style: 'unit', unit: intlUnit, unitDisplay: display, maximumFractionDigits });
    if (formatters.size >= MAX_FORMATTERS) {
        const oldest = formatters.keys().next();
        // eslint-disable-next-line drizzle/enforce-delete-with-where -- Map.delete, not a SQL delete
        if (!oldest.done)
            formatters.delete(oldest.value);
    }
    formatters.set(key, created);
    return created;
}
/**
 * Formats `value` with its unit through `Intl.NumberFormat`: `formatUnit(5, 'km')`
 * is `'5 km'`, and with `{ display: 'long' }` it is `'5 kilometers'`. Units Intl
 * has no name for (`nmi`, `psi`, `rad`, `K`, ...) print as the number, a space and
 * the symbol; `display` does not apply to them.
 */
export function formatUnit(value, unit, options = {}) {
    assertFinite(value, 'value');
    unitCategory(unit);
    const { locale, display = 'short', maximumFractionDigits } = options;
    const intlUnit = INTL_UNITS[unit];
    if (intlUnit === undefined) {
        const number = getFormatter(locale, undefined, 'short', maximumFractionDigits).format(value);
        return `${number} ${unit}`;
    }
    return getFormatter(locale, intlUnit, display, maximumFractionDigits).format(value);
}
//# sourceMappingURL=units.js.map