
'use client';

import React, { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Zap } from 'lucide-react'; // Zap icon for Power
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group" // Import RadioGroup components


// Define types for units to ensure consistency
type VoltageUnit = 'V' | 'mV' | 'kV';
type CurrentUnit = 'A' | 'mA' | 'µA';
type ResistanceUnit = 'Ω' | 'kΩ' | 'MΩ';
type PowerUnit = 'W' | 'mW' | 'kW'; // Added Power units

// Define multipliers for unit conversions
const voltageMultipliers: Record<VoltageUnit, number> = { V: 1, mV: 1e-3, kV: 1e3 };
const currentMultipliers: Record<CurrentUnit, number> = { A: 1, mA: 1e-3, µA: 1e-6 };
const resistanceMultipliers: Record<ResistanceUnit, number> = { Ω: 1, kΩ: 1e3, MΩ: 1e6 };
const powerMultipliers: Record<PowerUnit, number> = { W: 1, mW: 1e-3, kW: 1e3 }; // Added Power multipliers


// Helper function to format the power result with appropriate units
const formatPowerResult = (value: number | null): string => {
  if (value === null || !isFinite(value)) return 'N/A';

  let unit: PowerUnit = 'W';
  let displayValue = value;

  if (Math.abs(value) >= 1000) { displayValue = value / 1000; unit = 'kW'; }
  else if (Math.abs(value) < 1 && Math.abs(value) !== 0) { displayValue = value * 1000; unit = 'mW'; }

  const precision = Math.abs(displayValue) < 10 ? 3 : 2;
  return `${displayValue.toFixed(precision).replace(/\.?0+$/, '')} ${unit}`;
};

// Helper function to format basic electrical units (V, A, R)
const formatVarResult = (value: number | null, variable: 'voltage' | 'current' | 'resistance'): string => {
    if (value === null || !isFinite(value)) return 'N/A';

    let displayValue = value;
    let unit: string = '';

    switch (variable) {
        case 'voltage':
            unit = 'V';
            if (Math.abs(value) >= 1000) { displayValue = value / 1000; unit = 'kV'; }
            else if (Math.abs(value) < 1 && value !== 0) { displayValue = value * 1000; unit = 'mV'; }
            break;
        case 'current':
            unit = 'A';
            if (Math.abs(value) < 1 && value !== 0) { displayValue = value * 1000; unit = 'mA'; }
            if (Math.abs(value) < 1e-3 && value !== 0) { displayValue = value * 1e6; unit = 'µA'; }
            break;
        case 'resistance':
            unit = 'Ω';
            if (Math.abs(value) >= 1e6) { displayValue = value / 1e6; unit = 'MΩ'; }
            else if (Math.abs(value) >= 1000) { displayValue = value / 1000; unit = 'kΩ'; }
            break;
    }
     const precision = Math.abs(displayValue) < 10 ? 3 : 2;
     return `${displayValue.toFixed(precision).replace(/\.?0+$/, '')} ${unit}`;
}

export default function PowerCalculator() {
  const [voltageStr, setVoltageStr] = useState<string>('');
  const [currentStr, setCurrentStr] = useState<string>('');
  const [resistanceStr, setResistanceStr] = useState<string>('');
  const [powerStr, setPowerStr] = useState<string>(''); // Added Power state

  const [voltageUnit, setVoltageUnit] = useState<VoltageUnit>('V');
  const [currentUnit, setCurrentUnit] = useState<CurrentUnit>('A');
  const [resistanceUnit, setResistanceUnit] = useState<ResistanceUnit>('Ω');
  const [powerUnit, setPowerUnit] = useState<PowerUnit>('W'); // Added Power unit state

  const [error, setError] = useState<string | null>(null);

  // Central calculation logic
  const results = useMemo(() => {
    const inputsProvided = [voltageStr, currentStr, resistanceStr, powerStr].filter(s => s !== '').length;
     // Reset error at the start of each calculation attempt
     setError(null);

    if (inputsProvided !== 2) {
       if (inputsProvided > 0) { // Only show error if user has started typing
           setError('Please enter exactly two values.');
       }
      return { voltage: null, current: null, resistance: null, power: null };
    }

    // Parse inputs to base units (V, A, Ω, W)
    const V = voltageStr ? parseFloat(voltageStr) * voltageMultipliers[voltageUnit] : NaN;
    const I = currentStr ? parseFloat(currentStr) * currentMultipliers[currentUnit] : NaN;
    const R = resistanceStr ? parseFloat(resistanceStr) * resistanceMultipliers[resistanceUnit] : NaN;
    const P = powerStr ? parseFloat(powerStr) * powerMultipliers[powerUnit] : NaN;

    let finalV: number | null = !isNaN(V) ? V : null;
    let finalI: number | null = !isNaN(I) ? I : null;
    let finalR: number | null = !isNaN(R) ? R : null;
    let finalP: number | null = !isNaN(P) ? P : null;

     // Check for invalid number parsing (e.g., empty string parsed)
     if ((voltageStr && isNaN(V)) || (currentStr && isNaN(I)) || (resistanceStr && isNaN(R)) || (powerStr && isNaN(P))) {
         setError("Invalid number format entered.");
         return { voltage: null, current: null, resistance: null, power: null };
     }


    // Calculate missing values based on pairs
    try {
        if (!isNaN(V) && !isNaN(I)) { // V, I given
            finalR = V / I; if (I === 0) throw new Error("Current cannot be zero.");
            finalP = V * I;
        } else if (!isNaN(V) && !isNaN(R)) { // V, R given
            if (R === 0) throw new Error("Resistance cannot be zero.");
            finalI = V / R;
            finalP = (V * V) / R;
        } else if (!isNaN(V) && !isNaN(P)) { // V, P given
            finalI = P / V; if (V === 0) throw new Error("Voltage cannot be zero.");
            finalR = (V * V) / P; if (P === 0 && V !== 0) finalR = Infinity; else if (P === 0 && V === 0) throw new Error("Cannot determine resistance if P and V are zero.");
        } else if (!isNaN(I) && !isNaN(R)) { // I, R given
            finalV = I * R;
            finalP = (I * I) * R;
        } else if (!isNaN(I) && !isNaN(P)) { // I, P given
             if (I === 0 && P !== 0) throw new Error("Inconsistent input: Non-zero power with zero current.");
             if (I === 0 && P === 0) { // Undefined R, V = 0
                 finalV = 0;
                 finalR = null; // Cannot determine R
             } else {
                 finalR = P / (I * I);
                 finalV = P / I;
             }
        } else if (!isNaN(R) && !isNaN(P)) { // R, P given
            if (P < 0 && R > 0) throw new Error("Power cannot be negative for positive resistance.");
             if (R === 0 && P !== 0) throw new Error("Inconsistent input: Non-zero power with zero resistance.");
             if (R === 0 && P === 0) { // V=0, I undefined
                 finalV = 0;
                 finalI = null; // Cannot determine I
             } else if (R > 0) {
                finalI = Math.sqrt(Math.abs(P) / R); // Current could be +/- if P>0
                finalV = Math.sqrt(Math.abs(P) * R); // Voltage could be +/- if P>0
                // Note: We calculate magnitude here. Sign depends on convention.
             } else { // Negative resistance (theoretical)
                 // Handle complex cases or forbid negative R? For simplicity, let's assume R >= 0
                 if (R < 0) throw new Error("Negative resistance is not physically typical.");
             }

        }
    } catch (e: any) {
        setError(e.message || "Calculation error.");
        return { voltage: null, current: null, resistance: null, power: null };
    }

     // Final validation for NaN or Infinity results where they are errors
     if (finalR !== null && (!isFinite(finalR) && Math.abs(finalP ?? 0) > 0)) { // Allow infinite R if P=0
          setError("Resulting resistance is infinite or invalid.");
          finalR = null;
     }
      if (finalI !== null && !isFinite(finalI)) {
          setError("Resulting current is infinite or invalid.");
          finalI = null;
     }
       if (finalV !== null && !isFinite(finalV)) {
          setError("Resulting voltage is infinite or invalid.");
          finalV = null;
     }
        if (finalP !== null && !isFinite(finalP)) {
          setError("Resulting power is infinite or invalid.");
          finalP = null;
     }


    return { voltage: finalV, current: finalI, resistance: finalR, power: finalP };

  }, [voltageStr, currentStr, resistanceStr, powerStr, voltageUnit, currentUnit, resistanceUnit, powerUnit]);

  // Helper to render input fields
  const renderInputField = (
    label: string,
    variable: 'voltage' | 'current' | 'resistance' | 'power',
    value: string,
    setValue: (val: string) => void,
    unit: VoltageUnit | CurrentUnit | ResistanceUnit | PowerUnit,
    setUnit: (unit: any) => void, // Corrected type definition
    unitOptions: Record<string, number>,
    calculatedValue: number | null
  ) => {
    const isDisabled = calculatedValue !== null && [voltageStr, currentStr, resistanceStr, powerStr].filter(s => s !== '').length === 2;
    return (
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <Label htmlFor={variable}>{label}</Label>
          <Input
            id={variable}
            type="number"
            step="any"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Enter ${variable}`}
            disabled={isDisabled}
            className={isDisabled ? 'bg-muted/50 font-semibold border-dashed' : ''}
          />
        </div>
        <Select value={unit} onValueChange={(newUnit) => setUnit(newUnit)} disabled={isDisabled}>
          <SelectTrigger className="w-[80px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(unitOptions).map(u => (
              <SelectItem key={u} value={u}>{u}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Zap size={20} /> Electrical Power Calculator</CardTitle>
        <CardDescription>Calculate Power (P), Voltage (V), Current (I), or Resistance (R). Enter any two values.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderInputField('Voltage (V)', 'voltage', voltageStr, setVoltageStr, voltageUnit, setVoltageUnit, voltageMultipliers, results.voltage)}
        {renderInputField('Current (I)', 'current', currentStr, setCurrentStr, currentUnit, setCurrentUnit, currentMultipliers, results.current)}
        {renderInputField('Resistance (R)', 'resistance', resistanceStr, setResistanceStr, resistanceUnit, setResistanceUnit, resistanceMultipliers, results.resistance)}
        {renderInputField('Power (P)', 'power', powerStr, setPowerStr, powerUnit, setPowerUnit, powerMultipliers, results.power)}

        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle size={16} /> {error}
          </p>
        )}

        {/* Display Calculated Results */}
         {([results.voltage, results.current, results.resistance, results.power].filter(v => v !== null).length >= 1 && !error) && (
             <div className="pt-4 mt-4 border-t">
                 <h4 className="font-semibold mb-2">Results:</h4>
                 <div className="grid grid-cols-2 gap-2 text-sm">
                     <p><strong>Voltage:</strong> {formatVarResult(results.voltage, 'voltage')}</p>
                     <p><strong>Current:</strong> {formatVarResult(results.current, 'current')}</p>
                     <p><strong>Resistance:</strong> {formatVarResult(results.resistance, 'resistance')}</p>
                     <p><strong>Power:</strong> {formatPowerResult(results.power)}</p>
                 </div>
             </div>
         )}
      </CardContent>
    </Card>
  );
}
