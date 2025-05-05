
'use client';

import React, { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from 'lucide-react';

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

const formatResult = (value: number | null, variable: OhmsLawVariable): string => {
  if (value === null || !isFinite(value)) return 'N/A';

  let unit: Unit = 'V'; // Default
  let displayValue = value;

  switch (variable) {
    case 'voltage':
      unit = 'V';
      if (Math.abs(value) >= 1000) { displayValue = value / 1000; unit = 'kV'; }
      else if (Math.abs(value) < 1) { displayValue = value * 1000; unit = 'mV'; }
      break;
    case 'current':
      unit = 'A';
      if (Math.abs(value) < 1) { displayValue = value * 1000; unit = 'mA'; }
      if (Math.abs(value) < 1e-3) { displayValue = value * 1e6; unit = 'µA'; }
      break;
    case 'resistance':
      unit = 'Ω';
      if (Math.abs(value) >= 1e6) { displayValue = value / 1e6; unit = 'MΩ'; }
      else if (Math.abs(value) >= 1000) { displayValue = value / 1000; unit = 'kΩ'; }
      break;
  }

   // Limit precision for display
    const precision = Math.abs(displayValue) < 10 ? 3 : 2;
    return `${displayValue.toFixed(precision).replace(/\.?0+$/, '')} ${unit}`;
};


export default function OhmsLawCalculator() {
  const [voltageStr, setVoltageStr] = useState<string>('');
  const [currentStr, setCurrentStr] = useState<string>('');
  const [resistanceStr, setResistanceStr] = useState<string>('');

  const [voltageUnit, setVoltageUnit] = useState<Unit>('V');
  const [currentUnit, setCurrentUnit] = useState<Unit>('A');
  const [resistanceUnit, setResistanceUnit] = useState<Unit>('Ω');

  const [error, setError] = useState<string | null>(null);

  const calculate = (known1: OhmsLawVariable, known2: OhmsLawVariable): number | null => {
    const v = parseFloat(voltageStr) * unitMultipliers[voltageUnit];
    const i = parseFloat(currentStr) * unitMultipliers[currentUnit];
    const r = parseFloat(resistanceStr) * unitMultipliers[resistanceUnit];

    const inputs = [voltageStr, currentStr, resistanceStr].filter(s => s !== '').length;
    if (inputs !== 2) {
        setError('Enter exactly two values to calculate the third.');
        return null;
    }
    setError(null);

    if (known1 === 'voltage' && known2 === 'current') {
      if (isNaN(v) || isNaN(i)) { setError("Invalid input values."); return null; }
      if (i === 0) { setError("Current cannot be zero for this calculation."); return null; }
      return v / i; // Calculate Resistance
    }
    if ((known1 === 'voltage' && known2 === 'resistance') || (known1 === 'resistance' && known2 === 'voltage')) {
        if (isNaN(v) || isNaN(r)) { setError("Invalid input values."); return null; }
        if (r === 0) { setError("Resistance cannot be zero for this calculation."); return null; }
        return v / r; // Calculate Current
    }
    if ((known1 === 'current' && known2 === 'resistance') || (known1 === 'resistance' && known2 === 'current')) {
        if (isNaN(i) || isNaN(r)) { setError("Invalid input values."); return null; }
        return i * r; // Calculate Voltage
    }

    setError('Invalid combination of inputs.'); // Should not happen
    return null;
  };

  const result = useMemo(() => {
    const inputsProvided = [voltageStr, currentStr, resistanceStr].filter(s => s !== '').length;
    if (inputsProvided !== 2) {
      return { voltage: null, current: null, resistance: null };
    }

    let calculatedVoltage: number | null = null;
    let calculatedCurrent: number | null = null;
    let calculatedResistance: number | null = null;

    if (voltageStr === '') calculatedVoltage = calculate('current', 'resistance');
    if (currentStr === '') calculatedCurrent = calculate('voltage', 'resistance');
    if (resistanceStr === '') calculatedResistance = calculate('voltage', 'current');

    return {
      voltage: calculatedVoltage,
      current: calculatedCurrent,
      resistance: calculatedResistance,
    };
  }, [voltageStr, currentStr, resistanceStr, voltageUnit, currentUnit, resistanceUnit]);


  const renderInputField = (
      label: string,
      variable: OhmsLawVariable,
      value: string,
      setValue: (val: string) => void,
      unit: Unit,
      setUnit: (unit: Unit) => void, // Corrected type definition
      calculatedValue: number | null
  ) => (
    <div className="flex items-end gap-2">
      <div className="flex-1 space-y-1">
        <Label htmlFor={variable}>{label}</Label>
        <Input
          id={variable}
          type="number"
          step="any"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`Enter ${label.toLowerCase()}`}
          disabled={calculatedValue !== null} // Disable if it's the calculated value
           className={calculatedValue !== null ? 'bg-muted/50 font-semibold' : ''}
        />
      </div>
      <Select value={unit} onValueChange={(newUnit) => setUnit(newUnit as Unit)} disabled={calculatedValue !== null}>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ohm's Law Calculator</CardTitle>
        <CardDescription>Calculate V=IR. Enter any two values to find the third.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderInputField(
            'Voltage (V)', 'voltage', voltageStr, setVoltageStr, voltageUnit, setVoltageUnit, result.voltage
        )}
        {renderInputField(
            'Current (I)', 'current', currentStr, setCurrentStr, currentUnit, setCurrentUnit, result.current
        )}
         {renderInputField(
            'Resistance (R)', 'resistance', resistanceStr, setResistanceStr, resistanceUnit, setResistanceUnit, result.resistance
        )}

        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle size={16} /> {error}
          </p>
        )}

         {/* Display Calculated Result */}
         {(result.voltage !== null || result.current !== null || result.resistance !== null) && !error && ( // Added !error check here
             <div className="pt-4 mt-4 border-t">
                 <h4 className="font-semibold mb-2">Calculated Result:</h4>
                 {result.voltage !== null && <p><strong>Voltage:</strong> {formatResult(result.voltage, 'voltage')}</p>}
                 {result.current !== null && <p><strong>Current:</strong> {formatResult(result.current, 'current')}</p>}
                 {result.resistance !== null && <p><strong>Resistance:</strong> {formatResult(result.resistance, 'resistance')}</p>}
             </div>
         )}
      </CardContent>
    </Card>
  );
}

