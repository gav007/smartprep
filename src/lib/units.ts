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
 * Handles null, undefined, NaN, and Infinity gracefully.
 */
export function formatResultValue(
    value: number | null | undefined,
    variableType: 'voltage' | 'current' | 'resistance' | 'power' | 'capacitance' | 'frequency' | 'time' | 'gain' | 'tolerance' | 'other',
    inputUnit?: Unit // Optional: Base unit preference
): { displayValue: string, unit: Unit | string } {
    // Handle edge cases first
    if (value === null || value === undefined || isNaN(value)) {
        return { displayValue: '', unit: inputUnit || '' };
    }
    if (!isFinite(value)) {
         // Display Infinity or -Infinity symbolically or as text
         return { displayValue: value === Infinity ? '∞' : '-∞', unit: inputUnit || '' };
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
        case 'gain': return { displayValue: value.toLocaleString(undefined, { maximumSignificantDigits: 4 }), unit: '(Unitless)' }; // Use significant digits
        case 'tolerance': return { displayValue: value.toString(), unit: '%' }; // Assuming % for now
        default: return { displayValue: value.toLocaleString(undefined, { maximumSignificantDigits: 4 }), unit: '' }; // Generic fallback
    }

    if (options.length === 0) {
         return { displayValue: value.toLocaleString(undefined, { maximumSignificantDigits: 4 }), unit: baseUnit };
    }

    let bestUnit: Unit = (inputUnit && options.includes(inputUnit)) ? inputUnit : options[0];
    let bestFitValue = baseValue / (unitMultipliers[bestUnit] || 1); // Handle potential missing multiplier

    // Find the best unit: prefer values >= 1, otherwise choose the one closest to 1
     for (const u of options) {
         const multiplier = unitMultipliers[u];
         if (!multiplier) continue; // Skip if unit multiplier is not defined
         const scaledValue = baseValue / multiplier;

         if (Math.abs(scaledValue) >= 1) {
             // Prefer smaller numbers >= 1
             if (Math.abs(bestFitValue) < 1 || Math.abs(scaledValue) < Math.abs(bestFitValue)) {
                 bestFitValue = scaledValue;
                 bestUnit = u;
             }
         } else {
             // If all are < 1, prefer the largest magnitude (closest to 1)
             if (Math.abs(bestFitValue) < 1 && Math.abs(scaledValue) > Math.abs(bestFitValue)) {
                 bestFitValue = scaledValue;
                 bestUnit = u;
             }
         }
     }

     // If after optimization, the value is still extremely small (e.g., < 1e-9 for current),
     // consider reverting to base unit with exponential notation or the smallest available unit.
     if (Math.abs(bestFitValue) < 1e-12 && bestFitValue !== 0) { // Extremely small
        bestFitValue = baseValue / (unitMultipliers[options[options.length-1]] || 1); // Use smallest unit
        bestUnit = options[options.length-1];
     }
     // Or handle cases like exactly zero
     if (baseValue === 0) {
         bestFitValue = 0;
         // Keep input unit if provided, otherwise use base unit
         bestUnit = (inputUnit && options.includes(inputUnit)) ? inputUnit : options[0];
     }


    // Determine precision using toLocaleString for better handling of significant digits/decimals
    let displayString: string;
    try {
        displayString = bestFitValue.toLocaleString(undefined, {
            maximumSignificantDigits: 4, // Adjust significant digits as needed
            useGrouping: false // Avoid commas for easier parsing if needed elsewhere
        });
         // Further cleanup might be needed if toLocaleString introduces issues
         // e.g., ensuring it doesn't use scientific notation unexpectedly for reasonable numbers
         if (Math.abs(bestFitValue) > 1e-4 && Math.abs(bestFitValue) < 1e6 && displayString.includes('e')) {
            // Fallback to fixed precision if scientific notation appears unexpectedly
            displayString = bestFitValue.toFixed(3);
         }

    } catch {
        // Fallback if toLocaleString fails (e.g., very large/small numbers in some environments)
        displayString = bestFitValue.toPrecision(4);
    }

    // Final cleanup for display: remove trailing zeros after decimal, remove trailing decimal point
    if (displayString.includes('.')) {
        displayString = displayString.replace(/(\.\d*?[1-9])0+$/, '$1');
        displayString = displayString.replace(/\.$/, '');
    }

    return {
        displayValue: displayString,
        unit: bestUnit
    };
}
