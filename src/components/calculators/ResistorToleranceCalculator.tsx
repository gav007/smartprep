// src/components/calculators/ResistorToleranceCalculator.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle, Sigma, RotateCcw } from 'lucide-react';
import CalculatorCard from './CalculatorCard';
import CalculatorInput from './CalculatorInput';
import type { Unit } from '@/lib/units';
import { resistanceUnitOptions, unitMultipliers, defaultUnits, formatResultValue } from '@/lib/units';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const initialResistanceUnit: Unit = defaultUnits.resistance; // Using Ω
const initialToleranceStr: string = '5'; // Default 5%

export default function ResistorToleranceCalculator() {
  const [nominalResistanceStr, setNominalResistanceStr] = useState<string>('');
  const [resistanceUnit, setResistanceUnit] = useState<Unit>(initialResistanceUnit);
  const [toleranceStr, setToleranceStr] = useState<string>(initialToleranceStr);
  const [error, setError] = useState<string | null>(null);

  const toleranceRange = useMemo(() => {
    setError(null);
    const nominalR = parseFloat(nominalResistanceStr);
    const tolerancePercent = parseFloat(toleranceStr);

    if (isNaN(nominalR) || isNaN(tolerancePercent)) {
      if (nominalResistanceStr || toleranceStr) setError('Enter valid numbers for resistance and tolerance.');
      return { min: null, max: null };
    }
    if (nominalR < 0 || tolerancePercent < 0) {
      setError('Resistance and tolerance percentage must be non-negative.');
      return { min: null, max: null };
    }

    const nominalRInOhms = nominalR * unitMultipliers[resistanceUnit];
    const toleranceValue = nominalRInOhms * (tolerancePercent / 100);
    const minResistance = nominalRInOhms - toleranceValue;
    const maxResistance = nominalRInOhms + toleranceValue;
    const effectiveMin = Math.max(0, minResistance); // Ensure min is not negative

    return { min: effectiveMin, max: maxResistance };
  }, [nominalResistanceStr, resistanceUnit, toleranceStr]);

  const handleReset = useCallback(() => {
    setNominalResistanceStr('');
    setResistanceUnit(initialResistanceUnit);
    setToleranceStr(initialToleranceStr);
    setError(null);
  }, []);

  const { displayValue: minDisplay, unit: minUnit } = formatResultValue(toleranceRange.min, 'resistance');
  const { displayValue: maxDisplay, unit: maxUnit } = formatResultValue(toleranceRange.max, 'resistance');

  return (
    <CalculatorCard
      title="Resistor Tolerance Range"
      description="Calculate the minimum and maximum resistance based on tolerance."
      icon={Sigma}
    >
      <div className="space-y-3">
        <CalculatorInput
          id="nominalResistance"
          label="Nominal Resistance"
          value={nominalResistanceStr}
          onChange={setNominalResistanceStr}
          unit={resistanceUnit}
          unitOptions={resistanceUnitOptions}
          onUnitChange={setResistanceUnit}
          placeholder="e.g., 4.7"
          tooltip="The stated resistance value of the component"
          min="0"
          error={!!error && isNaN(parseFloat(nominalResistanceStr))}
        />
        <CalculatorInput
          id="tolerance"
          label="Tolerance"
          value={toleranceStr}
          onChange={setToleranceStr}
          unit="%" // Tolerance is always % in this calculator
          // No unitOptions needed if unit is fixed
          placeholder="e.g., 5"
          tooltip="The allowable deviation from the nominal value, in percent"
          min="0"
          error={!!error && isNaN(parseFloat(toleranceStr))}
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
      {(toleranceRange.min !== null && toleranceRange.max !== null && !error) && (
        <div className="pt-4 mt-4 border-t">
          <h4 className="font-semibold mb-2">Resistance Range:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
             <p><strong>Min:</strong> {minDisplay} {minUnit}</p>
             <p><strong>Max:</strong> {maxDisplay} {maxUnit}</p>
          </div>
        </div>
      )}

      {/* Reset Button */}
      <Button variant="outline" onClick={handleReset} className="w-full md:w-auto mt-4">
        <RotateCcw className="mr-2 h-4 w-4" /> Reset
      </Button>
    </CalculatorCard>
  );
}
