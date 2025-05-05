"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Zap, RotateCcw } from 'lucide-react'; // Added Zap and RotateCcw icons
import { cn } from '@/lib/utils';

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
  lastChanged: Variable | null;
  error: string | null;
}

// --- Formatting Helper ---
const formatResult = (value: number | null, variable: Variable): { displayValue: string, unit: Unit } => {
  if (value === null || !isFinite(value)) return { displayValue: '', unit: defaultUnits[variable] };

  let baseValue = value;
  let bestUnit: Unit = defaultUnits[variable];
  let displayNum = baseValue;

  const availableUnits = units[variable];

  // Find the best unit to represent the value
  let minDiff = Infinity;
  for (const u of availableUnits) {
      const multiplier = multipliers[u];
      const scaledValue = baseValue / multiplier;
      // Prefer units where the value is >= 1, find the smallest such unit or the largest if all < 1
      if (Math.abs(scaledValue) >= 1) {
          if (multiplier < minDiff) { // Find smallest multiplier >= 1
              minDiff = multiplier;
              bestUnit = u;
              displayNum = scaledValue;
          }
      } else if (minDiff === Infinity) { // If all are < 1, track the largest multiplier (smallest unit)
          if (multiplier > minDiff) { // Find largest multiplier < 1
             minDiff = multiplier;
             bestUnit = u;
             displayNum = scaledValue;
          }
      }
  }
   // Fallback if something goes wrong
  if (bestUnit === undefined) bestUnit = defaultUnits[variable];
  if (displayNum === undefined) displayNum = baseValue / multipliers[bestUnit];


  const precision = Math.abs(displayNum) < 10 && Math.abs(displayNum) !== 0 ? 3 : 2;
  // Use toPrecision for better handling of very small/large numbers vs toFixed
  const displayString = parseFloat(displayNum.toPrecision(precision + 2)).toPrecision(precision); // Adjust precision slightly for toPrecision

  return {
    // Format to fixed, remove trailing zeros/decimal point if possible
    displayValue: parseFloat(displayString).toString(), // Converts "5.00" to "5"
    unit: bestUnit
  };
};


export default function PowerCalculator() {
  const [state, setState] = useState<State>({
    voltageStr: "", currentStr: "", resistanceStr: "", powerStr: "",
    voltageUnit: defaultUnits.voltage, currentUnit: defaultUnits.current,
    resistanceUnit: defaultUnits.resistance, powerUnit: defaultUnits.power,
    lastChanged: null, error: null,
  });
  const [calculating, setCalculating] = useState(false); // Prevent infinite loops

  // --- Calculation Logic ---
  useEffect(() => {
     if (calculating) return; // Skip if calculation is already in progress

    const { voltageStr, currentStr, resistanceStr, powerStr,
            voltageUnit, currentUnit, resistanceUnit, powerUnit,
            lastChanged } = state;

    const values = {
      voltage: parseFloat(voltageStr) * (multipliers[voltageUnit] || 1),
      current: parseFloat(currentStr) * (multipliers[currentUnit] || 1),
      resistance: parseFloat(resistanceStr) * (multipliers[resistanceUnit] || 1),
      power: parseFloat(powerStr) * (multipliers[powerUnit] || 1),
    };

    const knownValues = (Object.keys(values) as Variable[]).filter(key => !isNaN(values[key]));

    // Only proceed if exactly two values are known and valid
    if (knownValues.length !== 2) {
      // Clear only the *calculated* fields if less than 2 inputs
      if (knownValues.length < 2 && lastChanged) {
           const newState: Partial<State> = {};
           (Object.keys(state) as (keyof State)[])
             .filter(k => k.endsWith('Str') && k !== `${lastChanged}Str`)
             .forEach(k => newState[k] = '');
            setState(prev => ({ ...prev, ...newState, error: null }));
      } else if (knownValues.length > 2 && state.error?.includes('Enter exactly two')) {
           // Clear general error if user provides enough input
           setState(prev => ({ ...prev, error: null }));
      }
      return; // Exit if not exactly 2 known values
    }

     // --- Start Calculation ---
     setCalculating(true);
     let errorMsg: string | null = null;
     let calculated: Partial<State> = {};

     try {
        const v = values.voltage;
        const i = values.current;
        const r = values.resistance;
        const p = values.power;

        let newV: number | null = null, newI: number | null = null, newR: number | null = null, newP: number | null = null;

        if (knownValues.includes('voltage') && knownValues.includes('current')) {
             if (i === 0) { errorMsg = "Current cannot be zero for resistance calculation."; }
             else { newR = v / i; }
             newP = v * i;
        } else if (knownValues.includes('voltage') && knownValues.includes('resistance')) {
            if (r <= 0) { errorMsg = "Resistance must be positive for current/power calculation."; }
             else { newI = v / r; newP = (v * v) / r; }
        } else if (knownValues.includes('current') && knownValues.includes('resistance')) {
            if (r < 0) { errorMsg = "Resistance cannot be negative."; }
            else { newV = i * r; newP = (i * i) * r; }
        } else if (knownValues.includes('voltage') && knownValues.includes('power')) {
             if (v === 0 && p !== 0) { errorMsg = "Voltage cannot be zero if power is non-zero."; }
             else if (v === 0 && p === 0) { newI = NaN; newR = NaN; } // Indeterminate
             else { newI = p / v; newR = (v * v) / p; }
        } else if (knownValues.includes('current') && knownValues.includes('power')) {
             if (i === 0 && p !== 0) { errorMsg = "Current cannot be zero if power is non-zero."; }
             else if (i === 0 && p === 0) { newV = NaN; newR = NaN; } // Indeterminate
             else { newV = p / i; newR = p / (i * i); }
        } else if (knownValues.includes('resistance') && knownValues.includes('power')) {
            if (r <= 0) { errorMsg = "Resistance must be positive."; }
             else if (p < 0) { errorMsg = "Power cannot be negative with only resistance known."; } // P = I^2 * R
             else { newI = Math.sqrt(p / r); newV = Math.sqrt(p * r); }
        }

        // Update state for calculated values
        if (newV !== null) {
            const formatted = formatResult(newV, 'voltage');
            calculated.voltageStr = formatted.displayValue;
            calculated.voltageUnit = formatted.unit;
        }
        if (newI !== null) {
            const formatted = formatResult(newI, 'current');
            calculated.currentStr = formatted.displayValue;
            calculated.currentUnit = formatted.unit;
        }
        if (newR !== null) {
             const formatted = formatResult(newR, 'resistance');
             calculated.resistanceStr = formatted.displayValue;
             calculated.resistanceUnit = formatted.unit;
        }
        if (newP !== null) {
             const formatted = formatResult(newP, 'power');
             calculated.powerStr = formatted.displayValue;
             calculated.powerUnit = formatted.unit;
        }

         // Apply updates
         setState(prev => ({ ...prev, ...calculated, error: errorMsg }));

     } catch (e: any) {
         console.error("Calculation error:", e);
         setState(prev => ({ ...prev, error: "Calculation failed." }));
     } finally {
         // Ensure calculating flag is unset after state updates
         queueMicrotask(() => setCalculating(false));
     }

  }, [ state.voltageStr, state.currentStr, state.resistanceStr, state.powerStr,
       state.voltageUnit, state.currentUnit, state.resistanceUnit, state.powerUnit,
       state.lastChanged, calculating ]); // Include calculating in deps


  // --- Input Handlers ---
  const handleValueChange = (variable: Variable, value: string) => {
    // When user types, clear the OTHER fields to allow recalculation
     const newState: Partial<State> = { [`${variable}Str`]: value, lastChanged: variable };
     // Clear other value strings, keep units
    (Object.keys(defaultUnits) as Variable[])
        .filter(v => v !== variable)
        .forEach(v => newState[`${v}Str`] = '');

    setState(prev => ({ ...prev, ...newState, error: null })); // Also clear error on new input
  };

  const handleUnitChange = (variable: Variable, unit: Unit) => {
     // Changing a unit should also trigger recalculation
    setState(prev => ({
      ...prev,
      [`${variable}Unit`]: unit,
      lastChanged: variable, // Treat unit change like value change for recalc trigger
      // Decide if changing unit should clear other fields?
      // Let's keep them for now and let useEffect recalculate.
    }));
  };

  // --- Clear Handler ---
  const handleClear = () => {
      setState({
        voltageStr: "", currentStr: "", resistanceStr: "", powerStr: "",
        voltageUnit: defaultUnits.voltage, currentUnit: defaultUnits.current,
        resistanceUnit: defaultUnits.resistance, powerUnit: defaultUnits.power,
        lastChanged: null, error: null,
      });
      setCalculating(false); // Ensure flag is reset
  };

  // --- Render Input Field Helper ---
 const renderInputField = (
      label: string,
      variable: Variable,
      valueStr: string,
      unit: Unit,
      isCalculated: boolean // Check if this field was just calculated
  ) => (
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
          // Use readOnly instead of disabled to allow focus/selection but prevent typing
          // readOnly={isCalculated && state.lastChanged !== variable}
          // Or style differently if calculated
          className={cn(isCalculated && state.lastChanged !== variable ? 'bg-muted/50 font-semibold border-primary/30' : '')}
        />
      </div>
      <Select
          value={unit}
          onValueChange={(newUnit) => handleUnitChange(variable, newUnit as Unit)}
          // Disable unit change for calculated fields? Maybe not, let user change target unit?
          // disabled={isCalculated && state.lastChanged !== variable}
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

  // Determine which fields were calculated in the last step
   const calculatedFields = (Object.keys(defaultUnits) as Variable[])
       .filter(v => state[`${v}Str`] !== '' && v !== state.lastChanged && // Has a value
                   (Object.keys(values) as Variable[]).filter(key => !isNaN(values[key])).length === 2 // And exactly 2 were input initially
       );


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Zap size={20}/> Electrical Power Calculator</CardTitle>
        <CardDescription>Enter any two values (V, I, R, P) to calculate the others.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderInputField('Voltage', 'voltage', state.voltageStr, state.voltageUnit, calculatedFields.includes('voltage'))}
        {renderInputField('Current', 'current', state.currentStr, state.currentUnit, calculatedFields.includes('current'))}
        {renderInputField('Resistance', 'resistance', state.resistanceStr, state.resistanceUnit, calculatedFields.includes('resistance'))}
        {renderInputField('Power', 'power', state.powerStr, state.powerUnit, calculatedFields.includes('power'))}

        {state.error && (
          <p className="text-sm text-destructive flex items-center gap-1 pt-2">
            <AlertCircle size={16} /> {state.error}
          </p>
        )}

        <Button variant="outline" onClick={handleClear} className="w-full md:w-auto mt-2">
            <RotateCcw className="mr-2 h-4 w-4" /> Clear All
        </Button>

        {/* Display Results - Already shown in input fields */}
         <div className="mt-6 pt-4 border-t">
            <h3 className="font-semibold mb-2">Summary:</h3>
             {(state.voltageStr || state.currentStr || state.resistanceStr || state.powerStr) ? (
                 <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><strong>Voltage:</strong> {state.voltageStr || 'N/A'} {state.voltageUnit}</p>
                    <p><strong>Current:</strong> {state.currentStr || 'N/A'} {state.currentUnit}</p>
                    <p><strong>Resistance:</strong> {state.resistanceStr || 'N/A'} {state.resistanceUnit}</p>
                    <p><strong>Power:</strong> {state.powerStr || 'N/A'} {state.powerUnit}</p>
                 </div>
             ) : (
                <p className="text-sm text-muted-foreground italic">Enter two values above to see results.</p>
             )}
         </div>

      </CardContent>
    </Card>
  );
}

    
    