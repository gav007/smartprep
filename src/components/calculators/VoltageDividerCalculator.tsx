// src/components/calculators/VoltageDividerCalculator.tsx
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Image from 'next/image';
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

const initialVinStr = '';
const initialR1Str = '';
const initialR2Str = '';


export default function VoltageDividerCalculator() {
  const [vinStr, setVinStr] = useState<string>(initialVinStr);
  const [vinUnit, setVinUnit] = useState<Unit>(initialVinUnit);
  const [r1Str, setR1Str] = useState<string>(initialR1Str);
  const [r1Unit, setR1Unit] = useState<Unit>(initialR1Unit);
  const [r2Str, setR2Str] = useState<string>(initialR2Str);
  const [r2Unit, setR2Unit] = useState<Unit>(initialR2Unit);
  const [error, setError] = useState<string | null>(null);
  const [isPristine, setIsPristine] = useState(true);

  useEffect(() => {
    // Update pristine state whenever an input changes
    const checkPristine =
      vinStr === initialVinStr &&
      r1Str === initialR1Str &&
      r2Str === initialR2Str &&
      vinUnit === initialVinUnit &&
      r1Unit === initialR1Unit &&
      r2Unit === initialR2Unit;
    setIsPristine(checkPristine);
  }, [vinStr, r1Str, r2Str, vinUnit, r1Unit, r2Unit]);

  const vout = useMemo(() => {
    setError(null);
    const vin = parseFloat(vinStr) * unitMultipliers[vinUnit];
    const r1 = parseFloat(r1Str) * unitMultipliers[r1Unit];
    const r2 = parseFloat(r2Str) * unitMultipliers[r2Unit];

    if (vinStr === '' && r1Str === '' && r2Str === '') {
        // No inputs yet, don't show error, return null
        return null;
    }

    if (isNaN(vin) || isNaN(r1) || isNaN(r2)) {
      if (vinStr || r1Str || r2Str) setError('Enter valid numbers for Vin, R1, and R2.');
      return null;
    }
    if (r1 <= 0) { // R1 must be positive
      setError('R1 must be a positive value.');
      return null;
    }
    if (r2 < 0) { // R2 can be zero
        setError('R2 must be non-negative.');
        return null;
    }
    if (vin < 0) {
        setError('Vin must be non-negative for typical divider behavior.');
        // Allow calculation for negative Vin but show warning or consider specific use case
    }
    // R1 is positive, R2 is non-negative. (R1+R2) will be positive. No div by zero.
    
    return vin * (r2 / (r1 + r2));
  }, [vinStr, vinUnit, r1Str, r1Unit, r2Str, r2Unit]);

  const handleReset = useCallback(() => {
    setVinStr(initialVinStr);
    setVinUnit(initialVinUnit);
    setR1Str(initialR1Str);
    setR1Unit(initialR1Unit);
    setR2Str(initialR2Str);
    setR2Unit(initialR2Unit);
    setError(null);
    setIsPristine(true);
  }, []);

  const { displayValue: voutDisplay, unit: voutUnit } = formatResultValue(vout, 'voltage');

  const vinDisplayForFormula = vinStr || 'Vin';
  const r1DisplayForFormula = r1Str || 'R1';
  const r2DisplayForFormula = r2Str || 'R2';
  
  const formulaPreview = (vout !== null && !error) 
    ? `Vout = ${vinDisplayForFormula}${vinUnit} * (${r2DisplayForFormula}${r2Unit} / (${r1DisplayForFormula}${r1Unit} + ${r2DisplayForFormula}${r2Unit}))`
    : `Vout = Vin * (R2 / (R1 + R2))`;


  return (
    <CalculatorCard
      title="Voltage Divider Calculator"
      description="Calculate output voltage (Vout) of a resistive voltage divider."
      icon={Sigma}
      className="w-full max-w-md mx-auto"
    >
      <div className="my-4 p-3 bg-muted/30 rounded border text-center">
        <Image
          src="https://picsum.photos/250/120" // Placeholder - replace with actual diagram
          alt="Voltage Divider Circuit Diagram"
          width={250}
          height={120}
          className="mx-auto mb-2 object-contain rounded"
          data-ai-hint="voltage divider circuit resistors"
          priority={false}
        />
        <p className="font-mono text-sm font-semibold">{formulaPreview}</p>
         {vout !== null && !error && (
           <p className="font-mono text-xs text-muted-foreground">
            = {voutDisplay} {voutUnit}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <CalculatorInput
          id="vin"
          label="Input Voltage (Vin)"
          value={vinStr}
          onChange={(val) => { setVinStr(val); setIsPristine(false); }}
          unit={vinUnit}
          unitOptions={voltageUnitOptions}
          onUnitChange={(unit) => { setVinUnit(unit); setIsPristine(false); }}
          placeholder="e.g., 12"
          tooltip="The input supply voltage to the divider circuit (V or mV or kV)."
          min="0"
          error={!!error && (isNaN(parseFloat(vinStr)) || parseFloat(vinStr) < 0)}
        />
        <CalculatorInput
          id="r1"
          label="Resistor R1"
          value={r1Str}
          onChange={(val) => { setR1Str(val); setIsPristine(false); }}
          unit={r1Unit}
          unitOptions={resistanceUnitOptions}
          onUnitChange={(unit) => { setR1Unit(unit); setIsPristine(false); }}
          placeholder="e.g., 10"
          tooltip="The first resistor in the divider, connected between Vin and Vout (Ω, kΩ, MΩ)."
          min="0" // Will be validated to be >0 in logic
          error={!!error && (isNaN(parseFloat(r1Str)) || parseFloat(r1Str) <= 0)}
        />
        <CalculatorInput
          id="r2"
          label="Resistor R2"
          value={r2Str}
          onChange={(val) => { setR2Str(val); setIsPristine(false); }}
          unit={r2Unit}
          unitOptions={resistanceUnitOptions}
          onUnitChange={(unit) => { setR2Unit(unit); setIsPristine(false); }}
          placeholder="e.g., 10"
          tooltip="The second resistor in the divider, connected between Vout and Ground. Output voltage is across R2 (Ω, kΩ, MΩ)."
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
        <div className="pt-4 mt-4 border-t text-center md:text-left"> {/* Center text on mobile, left on md+ */}
          <h4 className="font-semibold mb-1 md:mb-2">Output Voltage (Vout):</h4>
          <p className="text-xl md:text-2xl font-bold">{voutDisplay} {voutUnit}</p>
        </div>
      )}
       {/* Placeholder if no result and no error */}
      {vout === null && !error && (vinStr || r1Str || r2Str) && (
        <div className="pt-4 mt-4 border-t text-center">
            <p className="text-muted-foreground italic">Enter all values to calculate Vout.</p>
        </div>
      )}


      {/* Reset Button */}
      <Button variant="outline" onClick={handleReset} className="w-full md:w-auto mt-6" disabled={isPristine}>
        <RotateCcw className="mr-2 h-4 w-4" /> Reset
      </Button>
    </CalculatorCard>
  );
}
