
"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Zap, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounceCallback } from 'usehooks-ts'; // Using an external debounce hook

// --- Types and Constants ---
type Variable = 'voltage' | 'current' | 'resistance' | 'power';
type VoltageUnit = 'V' | 'mV' | 'kV';
type CurrentUnit = 'A' | 'mA' | 'µA';
type ResistanceUnit = 'Ω' | 'kΩ' | 'MΩ';
type PowerUnit = 'W' | 'mW' | 'kW';
type Unit = VoltageUnit | CurrentUnit | ResistanceUnit | PowerUnit;

const units: Record<Variable, Unit[]> = {
  voltage: ['V', 'mV', 'kV'],
  current: ['A', 'mA', 'µA'],
  resistance: ['Ω', 'kΩ', 'MΩ'],
  power: ['W', 'mW', 'kW'],
};

const multipliers: Record<Unit, number> = {
  V: 1, mV: 1e-3, kV: 1e3,
  A: 1, mA: 1e-3, µA: 1e-6,
  Ω: 1, kΩ: 1e3, MΩ: 1e6,
  W: 1, mW: 1e-3, kW: 1e3,
};

const defaultUnits: Record<Variable, Unit> = {
    voltage: 'V',
    current: 'A',
    resistance: 'Ω',
    power: 'W',
};

interface State {
  voltageStr: string;
  currentStr: string;
  resistanceStr: string;
  powerStr: string;
  voltageUnit: Unit;
  currentUnit: Unit;
  resistanceUnit: Unit;
  powerUnit: Unit;
  error: string | null;
  // Track the two fields actively used as input for calculation
  sourceFields: [Variable, Variable] | null;
}

const initialState: State = {
    voltageStr: "", currentStr: "", resistanceStr: "", powerStr: "",
    voltageUnit: defaultUnits.voltage, currentUnit: defaultUnits.current,
    resistanceUnit: defaultUnits.resistance, powerUnit: defaultUnits.power,
    error: null,
    sourceFields: null,
};

// --- Formatting Helper ---
const formatResult = (value: number | null, variable: Variable): { displayValue: string, unit: Unit } => {
  if (value === null || !isFinite(value) || isNaN(value)) {
      return { displayValue: '', unit: defaultUnits[variable] };
  }

  let baseValue = value;
  let bestUnit: Unit = defaultUnits[variable];
  let displayNum = baseValue;

  const availableUnits = units[variable];
  let minDiff = Infinity; // Used for finding the best unit

  // Prioritize units where the value is >= 1
  let bestFitUnit: Unit | null = null;
  let smallestMultiplier = Infinity;

  for (const u of availableUnits) {
    const multiplier = multipliers[u];
    const scaledValue = baseValue / multiplier;
    if (Math.abs(scaledValue) >= 1) {
      if (multiplier < smallestMultiplier) {
        smallestMultiplier = multiplier;
        bestFitUnit = u;
        displayNum = scaledValue;
      }
    }
  }

  if (bestFitUnit) {
      bestUnit = bestFitUnit;
  } else {
      // If all scaled values are < 1, find the unit with the largest multiplier (smallest unit like mV, µA, mW)
      let largestMultiplier = 0;
      for (const u of availableUnits) {
          const multiplier = multipliers[u];
          if (multiplier > largestMultiplier) {
              largestMultiplier = multiplier;
              bestUnit = u;
              displayNum = baseValue / multiplier;
          }
      }
  }

  // Limit precision based on magnitude
   const precision = Math.abs(displayNum) < 10 ? 3 : 4; // More precision for smaller numbers

   // Use toPrecision for better handling of very small/large numbers and avoid excessive trailing zeros
   const displayString = displayNum.toPrecision(precision);

  return {
    // Ensure the result doesn't have unnecessary trailing zeros or decimal points
    displayValue: parseFloat(displayString).toString(), // Converts "5.00" to "5"
    unit: bestUnit
  };
};


export default function PowerCalculator() {
  const [state, setState] = useState<State>(initialState);
  const calculatingRef = useRef(false); // Ref to prevent re-entry during calculation

   // --- Calculation Logic ---
  const calculateAndUpdate = useCallback(() => {
     if (calculatingRef.current) return; // Prevent re-entry

     calculatingRef.current = true;
     let errorMsg: string | null = null;
     let calculated: Partial<State> = {}; // Store updates temporarily

     // Get current values based on state strings and units
     const parseValue = (variable: Variable): number => {
         const strVal = state[`${variable}Str` as keyof State] as string;
         const unit = state[`${variable}Unit` as keyof State] as Unit;
         return parseFloat(strVal) * (multipliers[unit] || 1);
     };

     const values = {
        voltage: parseValue('voltage'),
        current: parseValue('current'),
        resistance: parseValue('resistance'),
        power: parseValue('power'),
     };

     const sources = state.sourceFields;

     // Proceed only if we have exactly two source fields defined
     if (!sources || sources.length !== 2) {
         calculatingRef.current = false;
         return; // Not enough info to calculate
     }

     const [source1, source2] = sources;
     const val1 = values[source1];
     const val2 = values[source2];

     // Check if source values are valid numbers
     if (isNaN(val1) || isNaN(val2)) {
         errorMsg = "Invalid input values.";
         // Clear calculated fields but keep source fields
         Object.keys(defaultUnits).forEach(key => {
             if (!sources.includes(key as Variable)) {
                 calculated[`${key}Str` as keyof State] = '';
             }
         });
     } else {
         // Determine which pair of sources we have and calculate others
         let newV: number | null = null, newI: number | null = null, newR: number | null = null, newP: number | null = null;

         try {
             const knownSet = new Set(sources);

             if (knownSet.has('voltage') && knownSet.has('current')) {
                 newP = val1 * val2; // P = V * I
                 if (val2 === 0) { errorMsg = "Current cannot be zero for resistance calculation."; newR = Infinity; }
                 else { newR = val1 / val2; } // R = V / I
             } else if (knownSet.has('voltage') && knownSet.has('resistance')) {
                 if (val2 <= 0) { errorMsg = "Resistance must be positive."; newI = NaN; newP = NaN; }
                 else { newI = val1 / val2; newP = (val1 * val1) / val2; } // I = V / R, P = V^2 / R
             } else if (knownSet.has('voltage') && knownSet.has('power')) {
                 if (val1 === 0 && val2 !== 0) { errorMsg = "Voltage cannot be zero if power is non-zero."; newI = NaN; newR = NaN; }
                 else if (val1 === 0 && val2 === 0) { newI = NaN; newR = NaN; } // Indeterminate
                 else { newI = val2 / val1; newR = (val1 * val1) / val2; } // I = P / V, R = V^2 / P
             } else if (knownSet.has('current') && knownSet.has('resistance')) {
                 if (val2 < 0) { errorMsg = "Resistance cannot be negative."; newV = NaN; newP = NaN; }
                 else { newV = val1 * val2; newP = (val1 * val1) * val2; } // V = I * R, P = I^2 * R
             } else if (knownSet.has('current') && knownSet.has('power')) {
                 if (val1 === 0 && val2 !== 0) { errorMsg = "Current cannot be zero if power is non-zero."; newV = NaN; newR = NaN; }
                 else if (val1 === 0 && val2 === 0) { newV = NaN; newR = NaN; } // Indeterminate
                 else { newV = val2 / val1; newR = val2 / (val1 * val1); } // V = P / I, R = P / I^2
             } else if (knownSet.has('resistance') && knownSet.has('power')) {
                 if (val1 <= 0) { errorMsg = "Resistance must be positive."; newV = NaN; newI = NaN; }
                 else if (val2 < 0) { errorMsg = "Power cannot be negative with only resistance known."; newV = NaN; newI = NaN; }
                 else { newI = Math.sqrt(val2 / val1); newV = Math.sqrt(val2 * val1); } // I = sqrt(P/R), V = sqrt(P*R)
             }

             // Format and stage updates for calculated fields
             if (newV !== null && !knownSet.has('voltage')) {
                 const formatted = formatResult(newV, 'voltage');
                 calculated.voltageStr = formatted.displayValue;
                 calculated.voltageUnit = formatted.unit;
             }
             if (newI !== null && !knownSet.has('current')) {
                 const formatted = formatResult(newI, 'current');
                 calculated.currentStr = formatted.displayValue;
                 calculated.currentUnit = formatted.unit;
             }
             if (newR !== null && !knownSet.has('resistance')) {
                 const formatted = formatResult(newR, 'resistance');
                 calculated.resistanceStr = formatted.displayValue;
                 calculated.resistanceUnit = formatted.unit;
             }
             if (newP !== null && !knownSet.has('power')) {
                 const formatted = formatResult(newP, 'power');
                 calculated.powerStr = formatted.displayValue;
                 calculated.powerUnit = formatted.unit;
             }

         } catch (e: any) {
             console.error("Calculation error:", e);
             errorMsg = "Calculation failed.";
             // Clear calculated fields on error
             Object.keys(defaultUnits).forEach(key => {
                 if (!sources.includes(key as Variable)) {
                     calculated[`${key}Str` as keyof State] = '';
                 }
             });
         }
     }

      // Apply staged updates and error message
     setState(prev => ({ ...prev, ...calculated, error: errorMsg }));

     // Use queueMicrotask to ensure state update happens before resetting the flag
     queueMicrotask(() => {
         calculatingRef.current = false;
     });

  }, [state.sourceFields, state.voltageStr, state.currentStr, state.resistanceStr, state.powerStr, state.voltageUnit, state.currentUnit, state.resistanceUnit, state.powerUnit]); // Dependencies

   // Debounce the calculation function
   const debouncedCalculateAndUpdate = useDebounceCallback(calculateAndUpdate, 300);

   // Trigger calculation whenever relevant state changes
   useEffect(() => {
       debouncedCalculateAndUpdate();
   }, [debouncedCalculateAndUpdate]); // Only depends on the debounced function itself


  // --- Input Handlers ---
  const handleValueChange = (variable: Variable, value: string) => {
    setState(prev => {
      let newSourceFields = prev.sourceFields;
      const currentSources = prev.sourceFields || [];

      if (!currentSources.includes(variable)) {
          // If this variable is not a source, make it one.
          if (currentSources.length < 2) {
              // If less than 2 sources, just add it.
              newSourceFields = [...currentSources, variable] as [Variable, Variable];
          } else {
              // If 2 sources already exist, replace the 'older' one (first in the array).
              newSourceFields = [currentSources[1], variable] as [Variable, Variable];
          }
      }
      // If it already is a source, the sources remain the same.

      // Clear the calculated fields when a source value changes significantly
      // (or always clear them when source changes to be safe?)
      const updates: Partial<State> = {
          [`${variable}Str`]: value,
          sourceFields: newSourceFields,
          error: null // Clear error on new input
      };

      // Clear values of fields that are NOT the current variable and NOT the other source
       Object.keys(defaultUnits).forEach(key => {
           if (key !== variable && !newSourceFields?.includes(key as Variable)) {
                updates[`${key}Str` as keyof State] = '';
           }
       });


      return { ...prev, ...updates };
    });
  };

  const handleUnitChange = (variable: Variable, unit: Unit) => {
    setState(prev => ({
      ...prev,
      [`${variable}Unit`]: unit,
      // Keep sourceFields the same, changing unit should trigger recalc via useEffect
    }));
  };

  // --- Clear Handler ---
  const handleClear = () => {
      setState(initialState);
      calculatingRef.current = false; // Reset calculation flag
  };

  // --- Render Input Field Helper ---
 const renderInputField = (
      label: string,
      variable: Variable,
      valueStr: string,
      unit: Unit
  ) => {
     // Determine if this field is one of the active calculation sources
     const isSource = state.sourceFields?.includes(variable) ?? false;
     // Determine if this field was calculated (i.e., has a value but is not a source)
     const isCalculated = valueStr !== '' && !isSource;

      return (
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor={variable}>{label}</Label>
            <Input
              id={variable}
              type="number"
              step="any"
              value={valueStr}
              onChange={(e) => handleValueChange(variable, e.target.value)}
              placeholder={`Enter ${label.split(' ')[0]}`}
              className={cn(
                  // Style calculated fields differently
                  isCalculated ? 'bg-muted/30 font-medium border-primary/30' : '',
                  // Indicate source fields subtly? Optional.
                  // isSource ? 'border-blue-300' : ''
              )}
               // Inputs are always editable
               readOnly={false}
            />
          </div>
          <Select
              value={unit}
              onValueChange={(newUnit) => handleUnitChange(variable, newUnit as Unit)}
              >
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {units[variable].map(u => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Zap size={20}/> Electrical Power Calculator</CardTitle>
        <CardDescription>Enter any two values (V, I, R, P) to calculate the others.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderInputField('Voltage (V)', 'voltage', state.voltageStr, state.voltageUnit)}
        {renderInputField('Current (I)', 'current', state.currentStr, state.currentUnit)}
        {renderInputField('Resistance (R)', 'resistance', state.resistanceStr, state.resistanceUnit)}
        {renderInputField('Power (P)', 'power', state.powerStr, state.powerUnit)}

        {state.error && (
          <p className="text-sm text-destructive flex items-center gap-1 pt-2">
            <AlertCircle size={16} /> {state.error}
          </p>
        )}

        <Button variant="outline" onClick={handleClear} className="w-full md:w-auto mt-2">
            <RotateCcw className="mr-2 h-4 w-4" /> Clear All
        </Button>

        {/* Display Results - Integrated into input fields */}
         <div className="mt-6 pt-4 border-t">
            <h3 className="font-semibold mb-2">Summary:</h3>
             {(state.voltageStr || state.currentStr || state.resistanceStr || state.powerStr) && !state.error ? (
                 <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><strong>Voltage:</strong> {state.voltageStr || 'N/A'} {state.voltageUnit}</p>
                    <p><strong>Current:</strong> {state.currentStr || 'N/A'} {state.currentUnit}</p>
                    <p><strong>Resistance:</strong> {state.resistanceStr || 'N/A'} {state.resistanceUnit}</p>
                    <p><strong>Power:</strong> {state.powerStr || 'N/A'} {state.powerUnit}</p>
                 </div>
             ) : (
                <p className="text-sm text-muted-foreground italic">Enter two valid values above to see results.</p>
             )}
         </div>

      </CardContent>
    </Card>
  );
}

    
    
