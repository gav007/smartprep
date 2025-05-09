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
export type AngularFrequencyUnit = 'rad/s'; // New

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
  | ToleranceUnit
  | AngularFrequencyUnit; // Added

// Multipliers for conversion to base units (V, A, Ω, W, F, Hz, s, rad/s)
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
  degrees: 1, 
  radians: 1,
  // Tolerance
  '%': 1,
  ppm: 1e-6, 
  // Angular Frequency
  'rad/s': 1,
};

// Options for select dropdowns
export const voltageUnitOptions: VoltageUnit[] = ['V', 'mV', 'kV'];
export const currentUnitOptions: CurrentUnit[] = ['A', 'mA', 'µA', 'nA'];
export const resistanceUnitOptions: ResistanceUnit[] = ['Ω', 'kΩ', 'MΩ', 'GΩ'];
export const powerUnitOptions: PowerUnit[] = ['W', 'mW', 'kW'];
export const capacitanceUnitOptions: CapacitanceUnit[] = ['F', 'mF', 'µF' | 'nF', 'pF'];
export const frequencyUnitOptions: FrequencyUnit[] = ['Hz', 'kHz', 'MHz', 'GHz'];
export const timeUnitOptions: TimeUnit[] = ['s', 'ms', 'µs', 'ns'];
export const angleUnitOptions: AngleUnit[] = ['degrees', 'radians'];
export const toleranceUnitOptions: ToleranceUnit[] = ['%', 'ppm']; 
export const angularFrequencyUnitOptions: AngularFrequencyUnit[] = ['rad/s'];


export type VariableCategory = 'voltage' | 'current' | 'resistance' | 'power' | 'capacitance' | 'frequency' | 'time' | 'angle' | 'tolerance' | 'angularFrequency' | 'gain' | 'other';

export function getUnitOptions(variableType: VariableCategory): Unit[] {
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
    case 'angularFrequency': return angularFrequencyUnitOptions;
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
    angularFrequency: 'rad/s' as AngularFrequencyUnit,
};


export function formatResultValue(
    value: number | null | undefined,
    variableType: VariableCategory,
    inputUnit?: Unit 
): { displayValue: string, unit: Unit | string } {
    if (value === null || value === undefined || isNaN(value)) {
        return { displayValue: '', unit: inputUnit || '' };
    }
    if (!isFinite(value)) {
         return { displayValue: value === Infinity ? '∞' : '-∞', unit: inputUnit || '' };
    }

    let baseValue = value;
    let options: Unit[] = [];
    let baseUnit: Unit | string = '';
    let useSignificantDigits = 4; // Default significant digits

    switch (variableType) {
        case 'voltage': options = voltageUnitOptions; baseUnit = 'V'; break;
        case 'current': options = currentUnitOptions; baseUnit = 'A'; break;
        case 'resistance': options = resistanceUnitOptions; baseUnit = 'Ω'; break;
        case 'power': options = powerUnitOptions; baseUnit = 'W'; break;
        case 'capacitance': options = capacitanceUnitOptions; baseUnit = 'F'; break;
        case 'frequency': options = frequencyUnitOptions; baseUnit = 'Hz'; break;
        case 'time': options = timeUnitOptions; baseUnit = 's'; break;
        case 'angularFrequency': return { displayValue: value.toLocaleString(undefined, { maximumSignificantDigits: 5, useGrouping: false }), unit: 'rad/s' };
        case 'gain': return { displayValue: value.toLocaleString(undefined, { maximumSignificantDigits: 4, useGrouping: false }), unit: '(Unitless)' };
        case 'tolerance': return { displayValue: value.toString(), unit: '%' };
        default: return { displayValue: value.toLocaleString(undefined, { maximumSignificantDigits: 4, useGrouping: false }), unit: '' };
    }

    if (options.length === 0) {
         return { displayValue: value.toLocaleString(undefined, { maximumSignificantDigits: useSignificantDigits, useGrouping: false }), unit: baseUnit };
    }
    
    let bestUnit: Unit = (inputUnit && options.includes(inputUnit)) ? inputUnit : options[0];
    let bestFitValue = baseValue / (unitMultipliers[bestUnit] || 1);

    if (inputUnit && options.includes(inputUnit)) {
        const scaledValue = baseValue / unitMultipliers[inputUnit];
        return {
          displayValue: scaledValue.toLocaleString(undefined, {
            maximumFractionDigits: 3,
            minimumFractionDigits: 0,
            useGrouping: false,
          }),
          unit: inputUnit,
        };
      }
      

     for (const u of options) {
         const multiplier = unitMultipliers[u];
         if (!multiplier) continue; 
         const scaledValue = baseValue / multiplier;

         if (Math.abs(scaledValue) >= 0.1 && Math.abs(scaledValue) < 10000) { // Prefer values in a "nice" range
            if (Math.abs(scaledValue) < Math.abs(bestFitValue) || (Math.abs(bestFitValue) < 0.1 && Math.abs(scaledValue) >=0.1) || (Math.abs(bestFitValue) >= 10000 && Math.abs(scaledValue) < 10000) ) {
                 bestFitValue = scaledValue;
                 bestUnit = u;
            }
         } else if (Math.abs(bestFitValue) < 0.1 || Math.abs(bestFitValue) >= 10000) { // If current best is outside "nice" range
             if (Math.abs(scaledValue - baseValue) < Math.abs(bestFitValue - baseValue)) { // Choose unit that results in value closest to original base value if all are "bad"
                  bestFitValue = scaledValue;
                  bestUnit = u;
             }
         }
     }
    
     if (baseValue === 0) {
         bestFitValue = 0;
         bestUnit = (inputUnit && options.includes(inputUnit)) ? inputUnit : (options.find(u => unitMultipliers[u] === 1) || options[0]);
     }

    let displayString: string;
    try {
        // Adjust precision based on unit for very small or very large numbers
        let maxFracDigits = 3;
        if (bestUnit === 'ns' || bestUnit === 'µs' || bestUnit === 'nA' || bestUnit === 'µA' || bestUnit === 'pF') maxFracDigits = 0;
        else if (bestUnit === 'mV' || bestUnit === 'mW' || bestUnit === 'ms') maxFracDigits = 2;
        else if (bestUnit === 'kV' || bestUnit === 'kW' || bestUnit === 'kHz' || bestUnit === 'MHz' || bestUnit === 'GHz' || bestUnit === 'kΩ' || bestUnit === 'MΩ' || bestUnit === 'GΩ') maxFracDigits = 3;


        displayString = bestFitValue.toLocaleString(undefined, {
            maximumFractionDigits: maxFracDigits,
            minimumFractionDigits: 0, // Don't force decimals if whole number
            useGrouping: false 
        });
        
         if (Math.abs(bestFitValue) > 1e-6 && Math.abs(bestFitValue) < 1e6 && displayString.includes('e')) {
            displayString = bestFitValue.toFixed(maxFracDigits);
         }

    } catch {
        displayString = bestFitValue.toPrecision(useSignificantDigits);
    }

    if (displayString.includes('.')) {
        displayString = displayString.replace(/(\.[0-9]*[1-9])0+$/, '$1'); 
        displayString = displayString.replace(/\.$/, ''); 
    }

    return {
        displayValue: displayString,
        unit: bestUnit
    };
}
