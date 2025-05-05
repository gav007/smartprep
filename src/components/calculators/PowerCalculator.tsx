
"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Zap, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounceCallback } from 'usehooks-ts';

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

interface Values {
  voltage: string;
  current: string;
  resistance: string;
  power: string;
}
interface Units {
    voltage: Unit;
    current: Unit;
    resistance: Unit;
    power: Unit;
}

const initialValues: Values = { voltage: "", current: "", resistance: "", power: "" };
const initialUnits: Units = {
    voltage: defaultUnits.voltage, current: defaultUnits.current,
    resistance: defaultUnits.resistance, power: defaultUnits.power,
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
  let smallestMultiplier = Infinity;
  let bestFitUnit: Unit | null = null;

  // Find the best unit where scaled value >= 1
  for (const u of availableUnits) {
    const multiplier = multipliers[u];
    const scaledValue = baseValue / multiplier;
    if (Math.abs(scaledValue) >= 1) {
      // Prefer the largest unit (smallest multiplier) that keeps the value >= 1
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
    // If all scaled values are < 1, find the unit with the smallest multiplier (largest unit prefix like m, µ)
    let largestMultiplierValue = 0; // Track the multiplier value itself
    let smallestUnitFound: Unit | null = null;
    for (const u of availableUnits) {
        const multiplier = multipliers[u];
         // Find the unit with the largest multiplier (e.g., k=1000, M=1e6) if baseValue > 1
         // or smallest multiplier (e.g., m=0.001, u=1e-6) if baseValue < 1
         // This logic needs refinement. Let's simplify: choose unit that makes number closest to 1-1000 range.

         // Try finding the unit where the scaled value is closest to 1, but still < 1 if necessary
         const scaledValue = baseValue / multiplier;
         if (Math.abs(scaledValue) < 1 && multiplier < smallestMultiplier) {
              smallestMultiplier = multiplier; // Smallest multiplier means largest prefix (m, µ)
              bestUnit = u;
              displayNum = scaledValue;
         } else if (!smallestUnitFound) { // Fallback if no unit makes it < 1
             bestUnit = u;
             displayNum = scaledValue;
         }
    }
  }

   // Limit precision based on magnitude
   const precision = Math.abs(displayNum) < 10 ? 3 : (Math.abs(displayNum) < 1000 ? 4 : 5);

   // Use toPrecision for better handling of very small/large numbers and avoid excessive trailing zeros
   const displayString = displayNum.toPrecision(precision);

  return {
    // Ensure the result doesn't have unnecessary trailing zeros or decimal points
    displayValue: parseFloat(displayString).toString(), // Converts "5.00" to "5"
    unit: bestUnit
  };
};


export default function PowerCalculator() {
  const [values, setValues] = useState<Values>(initialValues);
  const [unitsState, setUnitsState] = useState<Units>(initialUnits);
  const [error, setError] = useState<string | null>(null);
  // Track the last *two* fields actively edited by the user
  const lastEditedFieldsRef = useRef<Variable[]>([]);

  // --- Calculation Logic ---
  const calculateAndUpdate = useCallback(() => {
    setError(null);
    let calculated: Partial<Values> = {}; // Store updates for calculated fields
    let newUnitsState: Partial<Units> = {}; // Store unit updates for calculated fields

    const getNumericValue = (variable: Variable): number | null => {
        const strVal = values[variable];
        const unit = unitsState[variable];
        const multiplier = multipliers[unit];
        const num = parseFloat(strVal);
        return isNaN(num) ? null : num * multiplier;
    };

    const numInputs = Object.values(values).filter(v => v !== '').length;
    const activeInputs = lastEditedFieldsRef.current;

     // Only calculate if exactly two fields have been actively edited recently
     if (activeInputs.length !== 2 || numInputs < 2) {
         // If fewer than 2 inputs total, don't show error, just clear calculations maybe?
         // Or if more than 2 inputs but only 1 active edit, don't calculate.
          // Reset non-active fields if only one active field remains?
         if (activeInputs.length < 2 && numInputs > 0) {
             // Maybe clear fields that are *not* in activeInputs?
             const newVals = { ...values };
             Object.keys(newVals).forEach(key => {
                  if (!activeInputs.includes(key as Variable)) {
                      newVals[key as Variable] = '';
                  }
             });
             setValues(newVals);
         }
         return; // Not enough active inputs
     }

     const val1Var = activeInputs[0];
     const val2Var = activeInputs[1];
     const val1 = getNumericValue(val1Var);
     const val2 = getNumericValue(val2Var);


    if (val1 === null || val2 === null) {
      setError("Invalid input values.");
      // Clear fields that were NOT the source of the invalid input
      const newVals = { ...values };
      Object.keys(newVals).forEach(key => {
           if (key !== val1Var && key !== val2Var) {
               newVals[key as Variable] = '';
           }
      });
      setValues(newVals);
      return;
    }

    let newV: number | null = null, newI: number | null = null, newR: number | null = null, newP: number | null = null;
    const knownSet = new Set(activeInputs);

    try {
        if (knownSet.has('voltage') && knownSet.has('current')) {
            newP = val1 * val2; // P = V * I
            if (val2 === 0) { if (val1 !== 0) setError("Current cannot be zero for resistance calculation."); newR = Infinity; }
            else { newR = val1 / val2; } // R = V / I
        } else if (knownSet.has('voltage') && knownSet.has('resistance')) {
            if (val2 <= 0) { setError("Resistance must be positive."); newI = null; newP = null; }
            else { newI = val1 / val2; newP = (val1 * val1) / val2; } // I = V / R, P = V^2 / R
        } else if (knownSet.has('voltage') && knownSet.has('power')) {
            if (val1 === 0 && val2 !== 0) { setError("Voltage cannot be zero if power is non-zero."); newI = null; newR = null; }
            else if (val1 === 0 && val2 === 0) { newI = 0; newR = Infinity; } // Assume 0 current, infinite resistance
            else { newI = val2 / val1; newR = (val1 * val1) / val2; } // I = P / V, R = V^2 / P
        } else if (knownSet.has('current') && knownSet.has('resistance')) {
            if (val2 < 0) { setError("Resistance cannot be negative."); newV = null; newP = null; }
            else { newV = val1 * val2; newP = (val1 * val1) * val2; } // V = I * R, P = I^2 * R
        } else if (knownSet.has('current') && knownSet.has('power')) {
            if (val1 === 0 && val2 !== 0) { setError("Current cannot be zero if power is non-zero."); newV = null; newR = null; }
            else if (val1 === 0 && val2 === 0) { newV = 0; newR = Infinity; } // Assume 0 voltage, infinite resistance
            else { newV = val2 / val1; newR = val2 / (val1 * val1); } // V = P / I, R = P / I^2
        } else if (knownSet.has('resistance') && knownSet.has('power')) {
            if (val1 <= 0) { setError("Resistance must be positive."); newV = null; newI = null; }
            else if (val2 < 0) { setError("Power cannot be negative."); newV = null; newI = null; } // Resistance is always positive
            else { newI = Math.sqrt(val2 / val1); newV = Math.sqrt(val2 * val1); } // I = sqrt(P/R), V = sqrt(P*R)
        }

        // Format and stage updates ONLY for calculated fields
        if (newV !== null && !knownSet.has('voltage')) {
            const formatted = formatResult(newV, 'voltage');
            calculated.voltage = formatted.displayValue;
            newUnitsState.voltage = formatted.unit;
        }
        if (newI !== null && !knownSet.has('current')) {
            const formatted = formatResult(newI, 'current');
            calculated.current = formatted.displayValue;
            newUnitsState.current = formatted.unit;
        }
        if (newR !== null && !knownSet.has('resistance')) {
            const formatted = formatResult(newR, 'resistance');
            calculated.resistance = formatted.displayValue;
            newUnitsState.resistance = formatted.unit;
        }
        if (newP !== null && !knownSet.has('power')) {
            const formatted = formatResult(newP, 'power');
            calculated.power = formatted.displayValue;
            newUnitsState.power = formatted.unit;
        }

        // Handle Infinity for Resistance
        if (newR === Infinity) {
            calculated.resistance = ''; // Display empty for infinity
            setError(prevError => prevError ? `${prevError} Resistance is infinite.` : 'Resistance is infinite.');
        }
         if (newI === null || newV === null || newR === null || newP === null) {
            // If any calculation resulted in null (due to validation), ensure error is set.
            if (!error) setError("Calculation resulted in invalid values (e.g., division by zero).");
        }


    } catch (e: any) {
      console.error("Calculation error:", e);
      setError("Calculation failed.");
       // Clear calculated fields on error
       Object.keys(values).forEach(key => {
           if (!knownSet.has(key as Variable)) {
               calculated[key as Variable] = '';
           }
       });
    }

    // Update state: merge new values and units for calculated fields only
     setValues(prev => ({ ...prev, ...calculated }));
     setUnitsState(prev => ({ ...prev, ...newUnitsState }));

  }, [values, unitsState, error]); // Dependencies

  const debouncedCalculateAndUpdate = useDebounceCallback(calculateAndUpdate, 300);

  useEffect(() => {
    debouncedCalculateAndUpdate();
  }, [values, unitsState, debouncedCalculateAndUpdate]); // Trigger on value or unit changes


  // --- Input Handlers ---
  const handleValueChange = (variable: Variable, value: string) => {
      // Update the ref tracking the last two edited fields
      const currentActive = lastEditedFieldsRef.current;
      let newActive: Variable[];
      if (currentActive.includes(variable)) {
          // If already active, move it to the end (most recent)
          newActive = [...currentActive.filter(f => f !== variable), variable];
      } else {
          // If not active, add it and potentially remove the oldest
          newActive = [...currentActive.slice(-1), variable]; // Keep last, add new
      }
      lastEditedFieldsRef.current = newActive;

      // Update the specific value field
      setValues(prev => ({
          ...prev,
          [variable]: value
      }));
      // Debounced calculation will run via useEffect
  };

  const handleUnitChange = (variable: Variable, unit: Unit) => {
    setUnitsState(prev => ({
      ...prev,
      [variable]: unit,
    }));
     // Debounced calculation will run via useEffect
  };

  // --- Clear Handler ---
  const handleClear = () => {
      setValues(initialValues);
      setUnitsState(initialUnits);
      setError(null);
      lastEditedFieldsRef.current = []; // Clear active fields
  };

  // --- Render Input Field Helper ---
  const renderInputField = (
      label: string,
      variable: Variable
  ) => {
     const valueStr = values[variable];
     const unit = unitsState[variable];
     // A field is considered 'calculated' if it has a value but wasn't one of the last two edited
     const isCalculated = valueStr !== '' && !lastEditedFieldsRef.current.includes(variable);

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
                  isCalculated ? 'bg-muted/50 border-input font-medium' : '', // Subtle indication for calculated
                  // Add error styling if needed
                  // error && (values[variable] === '' && lastEditedFieldsRef.current.length === 2) ? 'border-destructive' : ''
              )}
              readOnly={false} // Always editable
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
        {renderInputField('Voltage (V)', 'voltage')}
        {renderInputField('Current (I)', 'current')}
        {renderInputField('Resistance (R)', 'resistance')}
        {renderInputField('Power (P)', 'power')}

        {error && (
          <p className="text-sm text-destructive flex items-center gap-1 pt-2">
            <AlertCircle size={16} /> {error}
          </p>
        )}

        <Button variant="outline" onClick={handleClear} className="w-full md:w-auto mt-2">
            <RotateCcw className="mr-2 h-4 w-4" /> Clear All
        </Button>

        {/* Display Results - Now integrated into input fields, summary below confirms */}
         <div className="mt-6 pt-4 border-t">
            <h3 className="font-semibold mb-2">Summary:</h3>
             {/* Check if at least two *active* fields have values before showing summary */}
             {lastEditedFieldsRef.current.length === 2 && values[lastEditedFieldsRef.current[0]] && values[lastEditedFieldsRef.current[1]] && !error ? (
                 <div className="grid grid-cols-2 gap-2 text-sm">
                    {/* Format the *current* state values for the summary */}
                    <p><strong>Voltage:</strong> {values.voltage || 'N/A'} {unitsState.voltage}</p>
                    <p><strong>Current:</strong> {values.current || 'N/A'} {unitsState.current}</p>
                    <p><strong>Resistance:</strong> {values.resistance || 'N/A'} {unitsState.resistance}</p>
                    <p><strong>Power:</strong> {values.power || 'N/A'} {unitsState.power}</p>
                 </div>
             ) : (
                <p className="text-sm text-muted-foreground italic">Enter two valid values above to see results.</p>
             )}
         </div>

      </CardContent>
    </Card>
  );
}
