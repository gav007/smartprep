// src/components/calculators/PowerCalculator.tsx
"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Zap, RotateCcw } from 'lucide-react';
import CalculatorCard from './CalculatorCard';
import CalculatorInput from './CalculatorInput';
import { useCalculatorState } from '@/hooks/useCalculatorState';
import type { Unit } from '@/lib/units';
import {
    voltageUnitOptions,
    currentUnitOptions,
    resistanceUnitOptions,
    powerUnitOptions,
    defaultUnits,
    formatResultValue,
    unitMultipliers, // Import unitMultipliers
} from '@/lib/units';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type PowerVariable = 'voltage' | 'current' | 'resistance' | 'power';

const initialValues: Record<PowerVariable, string> = { voltage: "", current: "", resistance: "", power: "" };
const initialUnits: Record<PowerVariable, Unit> = {
    voltage: defaultUnits.voltage,
    current: defaultUnits.current,
    resistance: defaultUnits.resistance,
    power: defaultUnits.power,
};
const variableOrder: PowerVariable[] = ['voltage', 'current', 'resistance', 'power'];
const requiredInputs = 2; // Need 2 inputs to calculate others

// Calculation logic function to be passed to the hook
const calculatePowerValues = (
    numericValues: Record<PowerVariable, number | null>,
    lockedFields: Set<PowerVariable>
): { results: Partial<Record<PowerVariable, number | null>>, error?: string | null } => {
    const { voltage: v, current: i, resistance: r, power: p } = numericValues;
    const results: Partial<Record<PowerVariable, number | null>> = {};
    let error: string | null = null;

     // Calculation logic remains the same as before, but the hook handles *when* it's called
     if (lockedFields.size !== requiredInputs) {
         return { results, error: null }; // Let hook handle hint error
     }

    try {
        // Calculate missing values based on which fields are locked
        if (lockedFields.has('voltage') && lockedFields.has('current')) {
            if (v !== null && i !== null) {
                results.power = v * i;
                if (i === 0) {
                    if (v !== 0) error = "Current is zero, resistance is infinite.";
                    results.resistance = Infinity; // Use Infinity for calculation logic
                } else {
                    results.resistance = v / i;
                }
            }
        } else if (lockedFields.has('voltage') && lockedFields.has('resistance')) {
            if (v !== null && r !== null) {
                if (r <= 0) { error = "Resistance must be positive."; results.current = null; results.power = null; }
                else { results.current = v / r; results.power = (v * v) / r; }
            }
        } else if (lockedFields.has('voltage') && lockedFields.has('power')) {
             if (v !== null && p !== null) {
                if (v === 0) {
                    if (p !== 0) { error = "Voltage is zero, cannot have non-zero power."; results.current = null; results.resistance = null; }
                    else { results.current = 0; results.resistance = Infinity; }
                } else {
                    results.current = p / v;
                    results.resistance = (v * v) / p;
                     if (p < 0 && v !== 0 && !error) {
                         error = "Negative power with non-zero voltage implies negative resistance.";
                     }
                }
            }
        } else if (lockedFields.has('current') && lockedFields.has('resistance')) {
            if (i !== null && r !== null) {
                if (r < 0) { error = "Resistance cannot be negative."; results.voltage = null; results.power = null; }
                else { results.voltage = i * r; results.power = (i * i) * r; }
            }
        } else if (lockedFields.has('current') && lockedFields.has('power')) {
             if (i !== null && p !== null) {
                if (i === 0) {
                     if (p !== 0) { error = "Current is zero, cannot have non-zero power."; results.voltage = null; results.resistance = null; }
                    else { results.voltage = 0; results.resistance = Infinity; }
                } else {
                    results.voltage = p / i;
                    results.resistance = p / (i * i);
                    if (p < 0 && i !== 0 && !error) {
                         error = "Negative power with non-zero current implies negative resistance.";
                    }
                 }
            }
        } else if (lockedFields.has('resistance') && lockedFields.has('power')) {
             if (r !== null && p !== null) {
                if (r <= 0) { error = "Resistance must be positive."; results.voltage = null; results.current = null; }
                else if (p < 0) { error = "Power cannot be negative if resistance is positive."; results.voltage = null; results.current = null; }
                else {
                    results.voltage = Math.sqrt(p * r);
                    results.current = Math.sqrt(p / r);
                }
            }
        }

        // --- Final Checks ---
        if (results.resistance !== undefined && results.resistance !== null && results.resistance < 0 && !error) {
             error = "Calculation resulted in negative resistance. Check inputs.";
             if (!lockedFields.has('voltage')) results.voltage = null;
             if (!lockedFields.has('current')) results.current = null;
             if (!lockedFields.has('power')) results.power = null;
        }
         if (results.resistance === Infinity) {
             results.resistance = null; // Don't display infinity in the input
             if (!error || !error.includes("infinite")) {
                 error = error ? `${error} Resistance is infinite.` : "Resistance is infinite.";
             }
         }

    } catch (e: any) {
        console.error("Power calculation error:", e);
        error = "Calculation failed. Check inputs.";
    }

    return { results, error };
};


export default function PowerCalculator() {
  const {
    values,
    units,
    error,
    lockedFields,
    handleValueChange,
    handleUnitChange,
    handleBlur, // Get blur handler from hook
    handleReset,
  } = useCalculatorState({
    initialValues,
    initialUnits,
    calculationFn: calculatePowerValues,
    variableOrder,
    requiredInputs, // Pass the number of required inputs
  });

   const getFormattedSummaryValue = (variable: PowerVariable): string => {
       const numValueStr = values[variable];
       const unit = units[variable];
       // Avoid converting if value is empty or invalid
       if (numValueStr === null || numValueStr.trim() === '' || isNaN(parseFloat(numValueStr))) return 'N/A';
       // Convert based on the *current* unit for consistent display
        // Use the imported unitMultipliers here
       const numValue = parseFloat(numValueStr) * (unitMultipliers[unit] ?? 1);
       if (isNaN(numValue) || !isFinite(numValue)) return 'N/A';
       const { displayValue, unit: displayUnit } = formatResultValue(numValue, variable, units[variable]);
       return `${displayValue} ${displayUnit}`;
   };

  return (
    <CalculatorCard
      title="Electrical Power Calculator"
      description={`Enter any ${requiredInputs} values (V, I, R, P) to calculate the others.`}
      icon={Zap}
    >
      <div className="space-y-3">
        <CalculatorInput
          id="voltage"
          label="Voltage (V)"
          value={values.voltage}
          onChange={(v) => handleValueChange('voltage', v)}
          onBlur={() => handleBlur('voltage')} // Add onBlur handler
          unit={units.voltage as Unit}
          unitOptions={voltageUnitOptions}
          onUnitChange={(u) => handleUnitChange('voltage', u)}
          placeholder="Enter Voltage"
          tooltip="Voltage (V or E)"
          isCalculated={values.voltage !== '' && !lockedFields.has('voltage')}
        />
        <CalculatorInput
          id="current"
          label="Current (I)"
          value={values.current}
          onChange={(v) => handleValueChange('current', v)}
          onBlur={() => handleBlur('current')} // Add onBlur handler
          unit={units.current as Unit}
          unitOptions={currentUnitOptions}
          onUnitChange={(u) => handleUnitChange('current', u)}
          placeholder="Enter Current"
          tooltip="Current (I or A)"
          isCalculated={values.current !== '' && !lockedFields.has('current')}
        />
        <CalculatorInput
          id="resistance"
          label="Resistance (R)"
          value={values.resistance}
          onChange={(v) => handleValueChange('resistance', v)}
          onBlur={() => handleBlur('resistance')} // Add onBlur handler
          unit={units.resistance as Unit}
          unitOptions={resistanceUnitOptions}
          onUnitChange={(u) => handleUnitChange('resistance', u)}
          placeholder="Enter Resistance"
          tooltip="Resistance (R or Ω)"
          min="0"
          isCalculated={values.resistance !== '' && !lockedFields.has('resistance')}
        />
        <CalculatorInput
          id="power"
          label="Power (P)"
          value={values.power}
          onChange={(v) => handleValueChange('power', v)}
          onBlur={() => handleBlur('power')} // Add onBlur handler
          unit={units.power as Unit}
          unitOptions={powerUnitOptions}
          onUnitChange={(u) => handleUnitChange('power', u)}
          placeholder="Enter Power"
          tooltip="Power (P or W)"
          min="0" // Typically power is positive unless dealing with sources/sinks explicitly
          isCalculated={values.power !== '' && !lockedFields.has('power')}
        />
      </div>

       {/* Error Display - Show calculation errors or input hints */}
        {error && (
          <Alert variant={error.startsWith("Enter") ? "default" : "destructive"} className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{error.startsWith("Enter") ? "Input Needed" : "Error"}</AlertTitle>
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
        {/* Show summary only if calculation was successful (no error or just input hint) */}
        {lockedFields.size >= requiredInputs && (!error || error.startsWith("Enter")) ? (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p><strong>Voltage:</strong> {getFormattedSummaryValue('voltage')}</p>
            <p><strong>Current:</strong> {getFormattedSummaryValue('current')}</p>
            <p><strong>Resistance:</strong> {getFormattedSummaryValue('resistance')}</p>
            <p><strong>Power:</strong> {getFormattedSummaryValue('power')}</p>
          </div>
        ) : (
          // Don't show "Enter values" here if the error message already says it
          !error?.startsWith("Enter") && (
             <p className="text-sm text-muted-foreground italic">Enter {requiredInputs} valid values above to see results.</p>
          )
        )}
      </div>
    </CalculatorCard>
  );
}
