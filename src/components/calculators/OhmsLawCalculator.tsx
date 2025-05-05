
'use client';

import React, { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils'; // Import cn utility

type OhmsLawVariable = 'voltage' | 'current' | 'resistance';
type Unit = 'V' | 'mV' | 'kV' | 'A' | 'mA' | 'µA' | 'Ω' | 'kΩ' | 'MΩ';

const units: Record<OhmsLawVariable, Unit[]> = {
  voltage: ['V', 'mV', 'kV'],
  current: ['A', 'mA', 'µA'],
  resistance: ['Ω', 'kΩ', 'MΩ'],
};

const unitMultipliers: Record<Unit, number> = {
  V: 1, mV: 1e-3, kV: 1e3,
  A: 1, mA: 1e-3, µA: 1e-6,
  Ω: 1, kΩ: 1e3, MΩ: 1e6,
};

const defaultUnits: Record<OhmsLawVariable, Unit> = {
    voltage: 'V',
    current: 'A',
    resistance: 'Ω',
};

const initialState = {
    voltageStr: '', currentStr: '', resistanceStr: '',
    voltageUnit: defaultUnits.voltage,
    currentUnit: defaultUnits.current,
    resistanceUnit: defaultUnits.resistance,
    error: null,
};


const formatResult = (value: number | null, variable: OhmsLawVariable): string => {
  if (value === null || !isFinite(value)) return 'N/A';

  let unit: Unit = defaultUnits[variable]; // Use default unit initially
  let displayValue = value;

  switch (variable) {
    case 'voltage':
      unit = 'V';
      if (Math.abs(value) >= 1000) { displayValue = value / 1000; unit = 'kV'; }
      else if (Math.abs(value) < 1 && value !== 0) { displayValue = value * 1000; unit = 'mV'; }
      break;
    case 'current':
      unit = 'A';
       if (Math.abs(value) < 1e-3 && value !== 0) { displayValue = value * 1e6; unit = 'µA'; }
      else if (Math.abs(value) < 1 && value !== 0) { displayValue = value * 1000; unit = 'mA'; }
      break;
    case 'resistance':
      unit = 'Ω';
      if (Math.abs(value) >= 1e6) { displayValue = value / 1e6; unit = 'MΩ'; }
      else if (Math.abs(value) >= 1000) { displayValue = value / 1000; unit = 'kΩ'; }
      break;
  }

   // Limit precision for display
    const precision = Math.abs(displayValue) < 10 ? 3 : 4; // Increased precision slightly
     // Use toPrecision to handle very small/large numbers and avoid excessive zeros
    const displayString = displayValue.toPrecision(precision);
    // Convert back to number and toString to remove trailing zeros from toPrecision if needed
    return `${parseFloat(displayString)} ${unit}`;
};


export default function OhmsLawCalculator() {
  const [state, setState] = useState(initialState);
  const [calculatedField, setCalculatedField] = useState<OhmsLawVariable | null>(null);


  const calculate = () => {
    let newError: string | null = null;
    let newCalculatedField: OhmsLawVariable | null = null;
    let newVoltageStr = state.voltageStr;
    let newCurrentStr = state.currentStr;
    let newResistanceStr = state.resistanceStr;

    const vStr = state.voltageStr;
    const iStr = state.currentStr;
    const rStr = state.resistanceStr;

    const vUnit = state.voltageUnit;
    const iUnit = state.currentUnit;
    const rUnit = state.resistanceUnit;

    const inputsProvided = [vStr, iStr, rStr].filter(s => s.trim() !== '').length;

    if (inputsProvided < 2) {
        // Clear calculated field if less than 2 inputs
        setCalculatedField(null);
         // Clear error if user is just starting or cleared fields
         if (inputsProvided === 0) setState(prev => ({ ...prev, error: null }));
         else setState(prev => ({ ...prev, error: 'Enter exactly two values.' })); // Guide user if only one is entered
        return; // Not enough inputs
    }
     if (inputsProvided > 2) {
         newError = 'Enter exactly two values.'; // Should be handled by UI disabling, but good fallback
     }


    const v = parseFloat(vStr) * unitMultipliers[vUnit];
    const i = parseFloat(iStr) * unitMultipliers[iUnit];
    const r = parseFloat(rStr) * unitMultipliers[rUnit];

    try {
        if (vStr.trim() === '' && !isNaN(i) && !isNaN(r)) { // Calculate Voltage
            if (r < 0) throw new Error('Resistance cannot be negative.');
            const resultV = i * r;
            newVoltageStr = formatResult(resultV, 'voltage').split(' ')[0]; // Get only the number part
            newCalculatedField = 'voltage';
        } else if (iStr.trim() === '' && !isNaN(v) && !isNaN(r)) { // Calculate Current
             if (r === 0) {
                 if (v === 0) throw new Error('Cannot determine current when V and R are both zero.');
                 else throw new Error('Resistance cannot be zero for current calculation.');
             }
             if (r < 0) throw new Error('Resistance cannot be negative.');
            const resultI = v / r;
            newCurrentStr = formatResult(resultI, 'current').split(' ')[0];
            newCalculatedField = 'current';
        } else if (rStr.trim() === '' && !isNaN(v) && !isNaN(i)) { // Calculate Resistance
             if (i === 0) {
                  if (v === 0) throw new Error('Cannot determine resistance when V and I are both zero.');
                  else throw new Error('Current cannot be zero for resistance calculation.');
             }
            const resultR = v / i;
             if (resultR < 0) throw new Error('Calculated resistance is negative, check inputs.');
            newResistanceStr = formatResult(resultR, 'resistance').split(' ')[0];
            newCalculatedField = 'resistance';
        } else {
             // If exactly 2 inputs are provided but no field is empty, it means user entered 3 - show error
            if (inputsProvided === 2) {
                 newError = 'Calculation error: Cannot determine which value to calculate.'; // Should not happen if logic is correct
            }
        }
    } catch (e: any) {
        newError = e.message || 'Calculation error.';
        // Clear the potentially calculated field on error
        if (vStr.trim() === '') newVoltageStr = '';
        if (iStr.trim() === '') newCurrentStr = '';
        if (rStr.trim() === '') newResistanceStr = '';
        newCalculatedField = null;
    }


    setState(prev => ({
        ...prev,
        voltageStr: newVoltageStr,
        currentStr: newCurrentStr,
        resistanceStr: newResistanceStr,
        error: newError
    }));
    setCalculatedField(newCalculatedField);
  };

    // Use useMemo for calculation to avoid re-running on every render, triggered by state changes
    useMemo(() => {
       calculate();
    }, [state.voltageStr, state.currentStr, state.resistanceStr, state.voltageUnit, state.currentUnit, state.resistanceUnit]); // Dependencies


  const handleValueChange = (variable: OhmsLawVariable, value: string) => {
     // Clear the currently calculated field if user starts typing in a different field
     const inputsProvided = [state.voltageStr, state.currentStr, state.resistanceStr].filter(s => s.trim() !== '').length;

      let clearCalculated = calculatedField && variable !== calculatedField;

     setState(prev => ({
       ...prev,
       [variable + 'Str']: value,
        // If user edits a calculated field, it becomes a source field, clear others if needed
       voltageStr: (clearCalculated && calculatedField === 'voltage') ? '' : (variable === 'voltage' ? value : prev.voltageStr),
       currentStr: (clearCalculated && calculatedField === 'current') ? '' : (variable === 'current' ? value : prev.currentStr),
       resistanceStr: (clearCalculated && calculatedField === 'resistance') ? '' : (variable === 'resistance' ? value : prev.resistanceStr),
       error: null, // Clear error on new input
     }));
      // Reset calculated field state immediately when user modifies an input
      if (calculatedField && variable !== calculatedField) {
         setCalculatedField(null);
      } else if (calculatedField && variable === calculatedField) {
          // If user edits the calculated field, treat it as a new input source
          setCalculatedField(null); // No longer calculated
      }
      // Calculation will be triggered by useMemo
  };

  const handleUnitChange = (variable: OhmsLawVariable, unit: Unit) => {
      setState(prev => ({
          ...prev,
          [variable + 'Unit']: unit,
      }));
      // Calculation will be triggered by useMemo due to unit change
  };

   const handleReset = () => {
     setState(initialState);
     setCalculatedField(null);
   };


  const renderInputField = (
      label: string,
      variable: OhmsLawVariable,
      value: string,
      unit: Unit,
  ) => {
     const isCalculated = calculatedField === variable;

     return (
        <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
            <Label htmlFor={variable}>{label}</Label>
            <Input
            id={variable}
            type="number"
            step="any"
            value={value}
            onChange={(e) => handleValueChange(variable, e.target.value)}
            placeholder={`Enter ${label.split(' ')[0]}`}
            // Make calculated fields visually distinct but keep them editable
             className={cn(isCalculated ? 'bg-primary/10 border-primary/50 font-medium' : '')}
             // readOnly={isCalculated} // Keep editable
            />
        </div>
        <Select value={unit} onValueChange={(newUnit) => handleUnitChange(variable, newUnit as Unit)}>
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
        <CardTitle>Ohm's Law Calculator</CardTitle>
        <CardDescription>Calculate V=IR. Enter any two values to find the third.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderInputField('Voltage (V)', 'voltage', state.voltageStr, state.voltageUnit)}
        {renderInputField('Current (I)', 'current', state.currentStr, state.currentUnit)}
        {renderInputField('Resistance (R)', 'resistance', state.resistanceStr, state.resistanceUnit)}

        {state.error && (
          <p className="text-sm text-destructive flex items-center gap-1 pt-2">
            <AlertCircle size={16} /> {state.error}
          </p>
        )}

         <Button variant="outline" onClick={handleReset} className="w-full md:w-auto mt-2">
            <RotateCcw className="mr-2 h-4 w-4" /> Clear All
         </Button>

         {/* Display Calculated Result Summary (Optional, values are in inputs) */}
         {calculatedField && !state.error && (
             <div className="pt-4 mt-4 border-t">
                 <h4 className="font-semibold mb-2">Result:</h4>
                 {calculatedField === 'voltage' && <p><strong>Voltage:</strong> {formatResult(parseFloat(state.voltageStr) * unitMultipliers[state.voltageUnit], 'voltage')}</p>}
                 {calculatedField === 'current' && <p><strong>Current:</strong> {formatResult(parseFloat(state.currentStr) * unitMultipliers[state.currentUnit], 'current')}</p>}
                 {calculatedField === 'resistance' && <p><strong>Resistance:</strong> {formatResult(parseFloat(state.resistanceStr) * unitMultipliers[state.resistanceUnit], 'resistance')}</p>}
             </div>
         )}
      </CardContent>
    </Card>
  );
}
