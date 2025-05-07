// src/components/calculators/VoltageDividerCalculator.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle, Sigma, RotateCcw } from 'lucide-react';
import CalculatorCard from './CalculatorCard';
import CalculatorInput from './CalculatorInput';
import type { Unit } from '@/lib/units';
import {
    voltageUnitOptions,
    resistanceUnitOptions,
    unitMultipliers,
    defaultUnits,
    formatResultValue
} from '@/lib/units';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const initialVinUnit: Unit = defaultUnits.voltage;
const initialR1Unit: Unit = defaultUnits.resistance;
const initialR2Unit: Unit = defaultUnits.resistance;

export default function VoltageDividerCalculator() {
  const [vinStr, setVinStr] = useState<string>('');
  const [vinUnit, setVinUnit] = useState<Unit>(initialVinUnit);
  const [r1Str, setR1Str] = useState<string>('');
  const [r1Unit, setR1Unit] = useState<Unit>(initialR1Unit);
  const [r2Str, setR2Str] = useState<string>('');
  const [r2Unit, setR2Unit] = useState<Unit>(initialR2Unit);
  const [error, setError] = useState<string | null>(null);

  const vout = useMemo(() => {
    setError(null);
    const vin = parseFloat(vinStr) * unitMultipliers[vinUnit];
    const r1 = parseFloat(r1Str) * unitMultipliers[r1Unit];
    const r2 = parseFloat(r2Str) * unitMultipliers[r2Unit];

    if (isNaN(vin) || isNaN(r1) || isNaN(r2)) {
      if (vinStr || r1Str || r2Str) setError('Enter valid numbers for Vin, R1, and R2.');
      return null;
    }
    if (vin < 0 || r1 <= 0 || r2 < 0) { // R1 must be >0 to avoid division by zero with R2=0
      setError('Vin and R2 must be non-negative. R1 must be positive.');
      return null;
    }
    if ((r1 + r2) === 0) {
        setError('Total resistance (R1 + R2) cannot be zero.');
        return null;
    }

    return vin * (r2 / (r1 + r2));
  }, [vinStr, vinUnit, r1Str, r1Unit, r2Str, r2Unit]);

  const handleReset = useCallback(() => {
    setVinStr('');
    setVinUnit(initialVinUnit);
    setR1Str('');
    setR1Unit(initialR1Unit);
    setR2Str('');
    setR2Unit(initialR2Unit);
    setError(null);
  }, []);

  const { displayValue: voutDisplay, unit: voutUnit } = formatResultValue(vout, 'voltage');

  return (
    <CalculatorCard
      title="Voltage Divider Calculator"
      description="Vout = Vin * (R2 / (R1 + R2))"
      icon={Sigma}
      className="w-full max-w-md mx-auto" // Added max-width for better appearance
    >
      <div className="space-y-3">
        <CalculatorInput
          id="vin"
          label="Input Voltage (Vin)"
          value={vinStr}
          onChange={setVinStr}
          unit={vinUnit}
          unitOptions={voltageUnitOptions}
          onUnitChange={setVinUnit}
          placeholder="e.g., 12"
          tooltip="The input voltage to the divider circuit"
          min="0"
          error={!!error && isNaN(parseFloat(vinStr))}
        />
        <CalculatorInput
          id="r1"
          label="Resistor R1"
          value={r1Str}
          onChange={setR1Str}
          unit={r1Unit}
          unitOptions={resistanceUnitOptions}
          onUnitChange={setR1Unit}
          placeholder="e.g., 10"
          tooltip="The first resistor in the divider (connected to Vin)"
          min="0" 
          error={!!error && (isNaN(parseFloat(r1Str)) || parseFloat(r1Str) <= 0)}
        />
        <CalculatorInput
          id="r2"
          label="Resistor R2"
          value={r2Str}
          onChange={setR2Str}
          unit={r2Unit}
          unitOptions={resistanceUnitOptions}
          onUnitChange={setR2Unit}
          placeholder="e.g., 10"
          tooltip="The second resistor in the divider (output voltage is across R2)"
          min="0"
          error={!!error && (isNaN(parseFloat(r2Str)) || parseFloat(r2Str) < 0)}
        />
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Result Display */}
      {(vout !== null && !error) && (
        <div className="pt-4 mt-4 border-t">
          <h4 className="font-semibold mb-2">Output Voltage (Vout):</h4>
          <p className="text-xl font-bold">{voutDisplay} {voutUnit}</p>
        </div>
      )}

      {/* Reset Button */}
      <Button variant="outline" onClick={handleReset} className="w-full md:w-auto mt-4">
        <RotateCcw className="mr-2 h-4 w-4" /> Reset
      </Button>
    </CalculatorCard>
  );
}
