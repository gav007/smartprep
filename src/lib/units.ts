// src/lib/units.ts

/**
 * Centralized unit definitions and multipliers for calculators.
 */

// Define common types for units
export type VoltageUnit = 'V' | 'mV' | 'kV';
export type CurrentUnit = 'A' | 'mA' | 'µA' | 'nA';
export type ResistanceUnit = 'Ω' | 'kΩ' | 'MΩ' | 'GΩ';
export type PowerUnit = 'W' | 'mW' | 'kW';
export type CapacitanceUnit = 'F' | 'mF' | 'µF' | 'nF' | 'pF';
export type FrequencyUnit = 'Hz' | 'kHz' | 'MHz' | 'GHz';
export type TimeUnit = 's' | 'ms' | 'µs' | 'ns';
export type AngleUnit = 'degrees' | 'radians';
export type ToleranceUnit = '%' | 'ppm';

// Combined type for any unit used in calculators
export type Unit =
  | VoltageUnit
  | CurrentUnit
  | ResistanceUnit
  | PowerUnit
  | CapacitanceUnit
  | FrequencyUnit
  | TimeUnit
  | AngleUnit
  | ToleranceUnit;

// Multipliers for conversion to base units (V, A, Ω, W, F, Hz, s)
export const unitMultipliers: Record<Unit, number> = {
  // Voltage
  V: 1,
  mV: 1e-3,
  kV: 1e3,
  // Current
  A: 1,
  mA: 1e-3,
  µA: 1e-6,
  nA: 1e-9,
  // Resistance
  Ω: 1,
  kΩ: 1e3,
  MΩ: 1e6,
  GΩ: 1e9,
  // Power
  W: 1,
  mW: 1e-3,
  kW: 1e3,
  // Capacitance
  F: 1,
  mF: 1e-3,
  µF: 1e-6,
  nF: 1e-9,
  pF: 1e-12,
  // Frequency
  Hz: 1,
  kHz: 1e3,
  MHz: 1e6,
  GHz: 1e9,
  // Time
  s: 1,
  ms: 1e-3,
  µs: 1e-6,
  ns: 1e-9,
  // Angle
  degrees: 1, // Special handling needed (deg to rad)
  radians: 1,
  // Tolerance
  '%': 1,
  ppm: 1e-6, // Parts per million
};

// Options for select dropdowns
export const voltageUnitOptions: VoltageUnit[] = ['V', 'mV', 'kV'];
export const currentUnitOptions: CurrentUnit[] = ['A', 'mA', 'µA', 'nA'];
export const resistanceUnitOptions: ResistanceUnit[] = ['Ω', 'kΩ', 'MΩ', 'GΩ'];
export const powerUnitOptions: PowerUnit[] = ['W', 'mW', 'kW'];
export const capacitanceUnitOptions: CapacitanceUnit[] = ['F', 'mF', 'µF', 'nF', 'pF'];
export const frequencyUnitOptions: FrequencyUnit[] = ['Hz', 'kHz', 'MHz', 'GHz'];
export const timeUnitOptions: TimeUnit[] = ['s', 'ms', 'µs', 'ns'];
export const angleUnitOptions: AngleUnit[] = ['degrees', 'radians'];
export const toleranceUnitOptions: ToleranceUnit[] = ['%', 'ppm']; // Mainly for future use

// Function to get options based on variable type (example)
export function getUnitOptions(variableType: 'voltage' | 'current' | 'resistance' | 'power' | 'capacitance' | 'frequency' | 'time' | 'angle' | 'tolerance'): Unit[] {
  switch (variableType) {
    case 'voltage': return voltageUnitOptions;
    case 'current': return currentUnitOptions;
    case 'resistance': return resistanceUnitOptions;
    case 'power': return powerUnitOptions;
    case 'capacitance': return capacitanceUnitOptions;
    case 'frequency': return frequencyUnitOptions;
    case 'time': return timeUnitOptions;
    case 'angle': return angleUnitOptions;
    case 'tolerance': return toleranceUnitOptions;
    default: return [];
  }
}

// Default units for initialization
export const defaultUnits = {
    voltage: 'V' as VoltageUnit,
    current: 'A' as CurrentUnit,
    resistance: 'Ω' as ResistanceUnit,
    power: 'W' as PowerUnit,
    capacitance: 'µF' as CapacitanceUnit,
    frequency: 'Hz' as FrequencyUnit,
    time: 'ms' as TimeUnit,
    angle: 'degrees' as AngleUnit,
    tolerance: '%' as ToleranceUnit,
};


/**
 * Formats a numeric result into a string with appropriate units and precision.
 */
export function formatResultValue(
    value: number | null | undefined,
    variableType: 'voltage' | 'current' | 'resistance' | 'power' | 'capacitance' | 'frequency' | 'time' | 'gain' | 'tolerance' | 'other',
    inputUnit?: Unit // Optional: Base unit preference
): { displayValue: string, unit: Unit | string } {
    if (value === null || value === undefined || !isFinite(value) || isNaN(value)) {
        return { displayValue: '', unit: inputUnit || '' };
    }

    let baseValue = value;
    let options: Unit[] = [];
    let baseUnit: Unit | string = '';

    // Determine appropriate units based on type
    switch (variableType) {
        case 'voltage': options = voltageUnitOptions; baseUnit = 'V'; break;
        case 'current': options = currentUnitOptions; baseUnit = 'A'; break;
        case 'resistance': options = resistanceUnitOptions; baseUnit = 'Ω'; break;
        case 'power': options = powerUnitOptions; baseUnit = 'W'; break;
        case 'capacitance': options = capacitanceUnitOptions; baseUnit = 'F'; break;
        case 'frequency': options = frequencyUnitOptions; baseUnit = 'Hz'; break;
        case 'time': options = timeUnitOptions; baseUnit = 's'; break;
        case 'gain': return { displayValue: value.toLocaleString(undefined, { maximumFractionDigits: 3 }), unit: '(Unitless)' }; // Special case
        case 'tolerance': return { displayValue: value.toString(), unit: '%' }; // Assuming % for now
        default: return { displayValue: value.toLocaleString(undefined, { maximumFractionDigits: 3 }), unit: '' }; // Generic fallback
    }

    if (options.length === 0) {
         return { displayValue: value.toLocaleString(undefined, { maximumFractionDigits: 3 }), unit: baseUnit };
    }

    let bestUnit: Unit = (inputUnit && options.includes(inputUnit)) ? inputUnit : options[0];
    let displayNum = baseValue / unitMultipliers[bestUnit]; // Start with preferred or base unit

    // Find best unit where scaled value is >= 1 or smallest unit otherwise
    let bestFitValue = displayNum;
    let currentBestUnit = bestUnit;

    for (const u of options) {
        const multiplier = unitMultipliers[u];
        const scaledValue = baseValue / multiplier;

         // Prefer units that result in a value >= 1
         if (Math.abs(scaledValue) >= 1) {
             // If this is the first suitable unit, or if it makes the number smaller (closer to 1), choose it
             if (Math.abs(bestFitValue) < 1 || Math.abs(scaledValue) < Math.abs(bestFitValue)) {
                 bestFitValue = scaledValue;
                 currentBestUnit = u;
             }
         } else {
             // If all values are < 1, prefer the unit that makes the number largest (closest to 1)
             if (Math.abs(bestFitValue) < 1 && Math.abs(scaledValue) > Math.abs(bestFitValue)) {
                 bestFitValue = scaledValue;
                 currentBestUnit = u;
             }
         }
    }

    // Override if the base unit keeps the value very small (e.g. 0.000001 A should be 1 µA)
     if (Math.abs(baseValue) < 1e-6 && variableType === 'current') { currentBestUnit = 'µA'; bestFitValue = baseValue * 1e6; }
     if (Math.abs(baseValue) < 1e-9 && variableType === 'current') { currentBestUnit = 'nA'; bestFitValue = baseValue * 1e9; }
     // Add similar overrides for other types like capacitance (pF, nF)

    // Determine precision
    const absDisplayNum = Math.abs(bestFitValue);
    let precision = 3; // Default significant figures
    if (absDisplayNum === 0) precision = 1;
    else if (absDisplayNum < 10) precision = 3;
    else if (absDisplayNum < 1000) precision = 4;
    else precision = 5; // More precision for larger numbers


    // Format using toPrecision and clean up
    let displayString = bestFitValue.toPrecision(precision);
    // Remove trailing zeros after decimal point, but keep integer zeros
    if (displayString.includes('.')) {
        displayString = displayString.replace(/(\.\d*?[1-9])0+$/, '$1'); // Remove trailing zeros
        displayString = displayString.replace(/\.$/, ''); // Remove trailing decimal point
    }

    // Handle very small numbers that might become "0" after precision
    if (parseFloat(displayString) === 0 && baseValue !== 0) {
        // If the original value wasn't zero, try exponential notation
         displayString = baseValue.toExponential(2);
         return { displayValue: displayString, unit: baseUnit }; // Revert to base unit for exponential
    }

    return {
        displayValue: displayString,
        unit: currentBestUnit
    };
}
