// src/components/calculators/OhmsLawCalculator.tsx
"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from 'lucide-react';
import CalculatorCard from './CalculatorCard';
import CalculatorInput from './CalculatorInput';
import { useCalculatorState } from '@/hooks/useCalculatorState';
import type { Unit } from '@/lib/units';
import {
    voltageUnitOptions,
    currentUnitOptions,
    resistanceUnitOptions,
    defaultUnits,
    formatResultValue,
    unitMultipliers,
} from '@/lib/units';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert components

type OhmsLawVariable = 'voltage' | 'current' | 'resistance';

const initialValues = { voltage: "", current: "", resistance: "" };
const initialUnits = {
    voltage: defaultUnits.voltage,
    current: defaultUnits.current,
    resistance: defaultUnits.resistance,
};
const variableOrder: OhmsLawVariable[] = ['voltage', 'current', 'resistance'];

// Calculation logic function
const calculateOhmsLawValues = (
    numericValues: Record<OhmsLawVariable, number | null>,
    lockedFields: Set<OhmsLawVariable>
): { results: Partial<Record<OhmsLawVariable, number | null>>, error?: string | null } => {
    const { voltage: v, current: i, resistance: r } = numericValues;
    const results: Partial<Record<OhmsLawVariable, number | null>> = {};
    let error: string | null = null;

    try {
        if (lockedFields.has('current') && lockedFields.has('resistance')) {
            if (i !== null && r !== null) {
                 if (r < 0) { error = "Resistance cannot be negative."; results.voltage = null; }
                 else results.voltage = i * r;
            }
        } else if (lockedFields.has('voltage') && lockedFields.has('resistance')) {
             if (v !== null && r !== null) {
                if (r === 0) {
                    error = "Resistance cannot be zero for current calculation."; results.current = null;
                } else if (r < 0) {
                     error = "Resistance cannot be negative."; results.current = null;
                }
                else results.current = v / r;
            }
        } else if (lockedFields.has('voltage') && lockedFields.has('current')) {
             if (v !== null && i !== null) {
                if (i === 0) {
                    if (v === 0) { error = "Cannot determine resistance when V and I are both zero."; results.resistance = null; }
                    else { error = "Current cannot be zero for resistance calculation."; results.resistance = Infinity; } // Treat as infinite resistance
                } else {
                    results.resistance = v / i;
                     // Check for negative resistance result
                    if (results.resistance < 0 && !error) {
                        error = "Calculation resulted in negative resistance. Check inputs.";
                        results.resistance = null; // Invalidate result
                    }
                }
            }
        }
         // Handle Infinity resistance explicitly
         if (results.resistance === Infinity) {
             results.resistance = null; // Don't display infinity in the input
             error = error ? `${error} Resistance is infinite.` : "Resistance is infinite.";
         }

    } catch (e: any) {
        console.error("Ohm's Law calculation error:", e);
        error = "Calculation failed. Check inputs.";
    }

    return { results, error };
};

export default function OhmsLawCalculator() {
  const {
    values,
    units,
    error,
    lockedFields,
    handleValueChange,
    handleUnitChange,
    handleReset,
  } = useCalculatorState({
    initialValues,
    initialUnits,
    calculationFn: calculateOhmsLawValues,
    variableOrder,
  });

   const getFormattedSummaryValue = (variable: OhmsLawVariable): string => {
       const numValue = parseFloat(values[variable]) * unitMultipliers[units[variable]];
       if (isNaN(numValue) || !isFinite(numValue)) return 'N/A';
       const { displayValue, unit } = formatResultValue(numValue, variable, units[variable]);
       return `${displayValue} ${unit}`;
   };

  return (
    <CalculatorCard
      title="Ohm's Law Calculator"
      description="Calculate V=IR. Enter any two values to find the third."
      // Optional Icon: import { Sigma } from 'lucide-react'; icon={Sigma}
    >
      <div className="space-y-3">
        <CalculatorInput
          id="voltage"
          label="Voltage (V)"
          value={values.voltage}
          onChange={(v) => handleValueChange('voltage', v)}
          unit={units.voltage as Unit}
          unitOptions={voltageUnitOptions}
          onUnitChange={(u) => handleUnitChange('voltage', u)}
          placeholder="Enter Voltage"
          tooltip="Voltage (V or E)"
          isCalculated={values.voltage !== '' && !lockedFields.has('voltage')}
           error={!!error && values.voltage === '' && lockedFields.size === 2}
        />
        <CalculatorInput
          id="current"
          label="Current (I)"
          value={values.current}
          onChange={(v) => handleValueChange('current', v)}
          unit={units.current as Unit}
          unitOptions={currentUnitOptions}
          onUnitChange={(u) => handleUnitChange('current', u)}
          placeholder="Enter Current"
          tooltip="Current (I or A)"
          isCalculated={values.current !== '' && !lockedFields.has('current')}
          error={!!error && values.current === '' && lockedFields.size === 2}
        />
        <CalculatorInput
          id="resistance"
          label="Resistance (R)"
          value={values.resistance}
          onChange={(v) => handleValueChange('resistance', v)}
          unit={units.resistance as Unit}
          unitOptions={resistanceUnitOptions}
          onUnitChange={(u) => handleUnitChange('resistance', u)}
          placeholder="Enter Resistance"
          tooltip="Resistance (R or Ω)"
          min="0" // Resistance cannot be negative
          isCalculated={values.resistance !== '' && !lockedFields.has('resistance')}
          error={!!error && values.resistance === '' && lockedFields.size === 2}
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

      {/* Reset Button */}
      <Button variant="outline" onClick={handleReset} className="w-full md:w-auto mt-4">
        <RotateCcw className="mr-2 h-4 w-4" /> Clear All
      </Button>

      {/* Summary Section */}
        <div className="mt-6 pt-4 border-t">
            <h3 className="font-semibold mb-2">Summary:</h3>
            {lockedFields.size >= 2 && !error ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    <p><strong>Voltage:</strong> {getFormattedSummaryValue('voltage')}</p>
                    <p><strong>Current:</strong> {getFormattedSummaryValue('current')}</p>
                    <p><strong>Resistance:</strong> {getFormattedSummaryValue('resistance')}</p>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground italic">Enter two valid values to see results.</p>
            )}
        </div>
    </CalculatorCard>
  );
}
