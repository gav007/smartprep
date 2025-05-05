// src/components/calculators/BJTSolver.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle, CircuitBoard, RotateCcw } from 'lucide-react';
import CalculatorCard from './CalculatorCard';
import CalculatorInput from './CalculatorInput';
import type { Unit } from '@/lib/units';
import {
    resistanceUnitOptions,
    voltageUnitOptions,
    unitMultipliers,
    defaultUnits,
    formatResultValue
} from '@/lib/units';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from '@/components/ui/label'; // Import Label

// Types specific to BJT Solver
interface BJTResult {
  VBE: number | null;
  IB: number | null;
  IC: number | null;
  VCE: number | null;
  ICSAT: number | null;
  IBSAT: number | null;
  Region: 'Cutoff' | 'Active' | 'Saturation' | 'Undefined';
}

// Initial state values
const initialRbUnit: Unit = defaultUnits.resistance; // Using Ω
const initialRcUnit: Unit = defaultUnits.resistance; // Using Ω
const initialVbeStr = '0.7'; // Default VBE for silicon

export default function BJTSolver() {
  const [vbbStr, setVbbStr] = useState<string>('');
  const [rbStr, setRbStr] = useState<string>('');
  const [rbUnit, setRbUnit] = useState<Unit>(initialRbUnit);
  const [vccStr, setVccStr] = useState<string>('');
  const [rcStr, setRcStr] = useState<string>('');
  const [rcUnit, setRcUnit] = useState<Unit>(initialRcUnit);
  const [betaStr, setBetaStr] = useState<string>('');
  const [vbeStr, setVbeStr] = useState<string>(initialVbeStr); // Default VBE

  const [result, setResult] = useState<BJTResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = useCallback(() => {
    setError(null);
    setResult(null);

    const VBB = parseFloat(vbbStr);
    const RB = parseFloat(rbStr) * unitMultipliers[rbUnit];
    const VCC = parseFloat(vccStr);
    const RC = parseFloat(rcStr) * unitMultipliers[rcUnit];
    const beta = parseFloat(betaStr);
    const VBE = parseFloat(vbeStr || initialVbeStr); // Use default if empty

    const inputs = { VBB, RB, VCC, RC, beta, VBE };
    const numericInputs = Object.values(inputs);

    if (numericInputs.some(isNaN)) {
      setError('Enter valid numbers for all required fields.');
      return;
    }
    if (RB <= 0 || RC <= 0 || beta <= 0) {
      setError('RB, RC, and Beta (β) must be positive.');
      return;
    }
     if (VBE < 0) {
         // Allow calculation but show warning/info
         setError("Info: VBE is negative, ensure this is intended.");
     }

    let calculatedResult: BJTResult = { VBE, IB: null, IC: null, VCE: null, ICSAT: null, IBSAT: null, Region: 'Undefined' };
    let region: BJTResult['Region'] = 'Undefined';
    let calculationError: string | null = null;

    try {
        // Calculate Saturation values first
        const ICSAT = VCC / RC;
        // Using β_forced = β / 5 for IB(SAT) might be confusing.
        // A more standard approach is IB(SAT)_min = IC(SAT) / β. Let's calculate min required base current.
        const IBSAT_min = ICSAT / beta;
        calculatedResult.ICSAT = ICSAT;
        calculatedResult.IBSAT = IBSAT_min; // Store the minimum required base current for saturation

        // Check for Cutoff
        if (VBB <= VBE) {
            calculatedResult.IB = 0;
            calculatedResult.IC = 0;
            calculatedResult.VCE = VCC;
            region = 'Cutoff';
            calculationError = "Transistor in Cutoff (VBB ≤ VBE).";
        } else {
            // Calculate potential Active region values
            const IB_active = (VBB - VBE) / RB;
            const IC_active = beta * IB_active;
            const VCE_active = VCC - (IC_active * RC);

            // Determine actual operating region
            if (VCE_active <= 0.2) { // Approximate VCE(sat) for silicon
                region = 'Saturation';
                calculatedResult.IB = IB_active; // Base current is still driven by VBB/RB
                calculatedResult.IC = ICSAT; // Collector current is limited
                calculatedResult.VCE = 0.2; // Assume VCEsat
                calculationError = "Transistor in Saturation (VCE ≤ 0.2V).";
            } else {
                region = 'Active';
                calculatedResult.IB = IB_active;
                calculatedResult.IC = IC_active;
                calculatedResult.VCE = VCE_active;
            }
        }

         calculatedResult.Region = region;
         // Set final error state (calculationError might contain info/warnings)
         setError(calculationError);

    } catch (e: any) {
        setError(`Calculation error: ${e.message}`);
        return; // Stop if calculation itself fails
    }

    setResult(calculatedResult);
  }, [vbbStr, rbStr, rbUnit, vccStr, rcStr, rcUnit, betaStr, vbeStr]); // Dependencies

  const handleReset = useCallback(() => {
      setVbbStr('');
      setRbStr('');
      setRbUnit(initialRbUnit);
      setVccStr('');
      setRcStr('');
      setRcUnit(initialRcUnit);
      setBetaStr('');
      setVbeStr(initialVbeStr);
      setResult(null);
      setError(null);
  }, []);

  // Formatting results using the central helper
    const format = (value: number | null, type: 'voltage' | 'current') => {
        const { displayValue, unit } = formatResultValue(value, type);
        return displayValue ? `${displayValue} ${unit}` : 'N/A';
    };

  return (
    <CalculatorCard
      title="BJT Solver (Fixed Bias)"
      description="Calculate parameters for a common-emitter fixed-bias BJT circuit."
      icon={CircuitBoard}
    >
      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CalculatorInput
          id="vbb" label="VBB (Base Supply)" value={vbbStr} onChange={setVbbStr}
          unit="V" // Fixed unit for simplicity
          placeholder="e.g., 5" tooltip="Voltage source connected to the base resistor"
        />
        <CalculatorInput
          id="rb" label="RB (Base Resistor)" value={rbStr} onChange={setRbStr}
          unit={rbUnit} unitOptions={resistanceUnitOptions} onUnitChange={setRbUnit}
          placeholder="e.g., 47" tooltip="Resistance connected to the base" min="0"
        />
        <CalculatorInput
          id="vcc" label="VCC (Collector Supply)" value={vccStr} onChange={setVccStr}
          unit="V" // Fixed unit
          placeholder="e.g., 12" tooltip="Voltage source connected to the collector resistor"
        />
        <CalculatorInput
          id="rc" label="RC (Collector Resistor)" value={rcStr} onChange={setRcStr}
          unit={rcUnit} unitOptions={resistanceUnitOptions} onUnitChange={setRcUnit}
          placeholder="e.g., 2.2" tooltip="Resistance connected to the collector" min="0"
        />
        <CalculatorInput
          id="beta" label="Beta (β / hFE)" value={betaStr} onChange={setBetaStr}
          placeholder="e.g., 100" tooltip="DC current gain of the transistor" min="0" type="number"
        />
        <CalculatorInput
          id="vbe" label="VBE (Base-Emitter Voltage)" value={vbeStr} onChange={setVbeStr}
          unit="V" // Fixed unit
          placeholder="Default: 0.7" tooltip="Base-Emitter forward voltage drop (typically ~0.7V for silicon)"
          step="0.01"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row gap-2 pt-4">
        <Button onClick={handleCalculate} className="w-full md:w-auto">Calculate</Button>
        <Button variant="outline" onClick={handleReset} className="w-full md:w-auto">
          <RotateCcw className="mr-2 h-4 w-4" /> Reset
        </Button>
      </div>

      {/* Error/Info Display */}
      {error && (
        <Alert variant={error.includes("Error") || error.includes("must be") ? "destructive" : "default"} className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{error.includes("Error") || error.includes("must be") ? "Error" : "Info"}</AlertTitle>
          <AlertDescription>{error.replace("Info: ", "")}</AlertDescription>
        </Alert>
      )}

      {/* Result Display */}
      {result && (
        <div className="pt-4 mt-4 border-t">
          <h4 className="font-semibold mb-2 flex justify-between items-center">
             <span>Calculated Results:</span>
             <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                 result.Region === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                 result.Region === 'Saturation' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                 result.Region === 'Cutoff' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                 'bg-muted text-muted-foreground'
             }`}>
                Region: {result.Region}
            </span>
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
            {/* Display VBE used */}
            <p><strong>VBE:</strong> {format(result.VBE, 'voltage')}</p>
            <p><strong>IB:</strong> {format(result.IB, 'current')}</p>
            <p><strong>IC:</strong> {format(result.IC, 'current')}</p>
            <p><strong>VCE:</strong> {format(result.VCE, 'voltage')}</p>
            <p title="Collector Current at Saturation"><strong>IC(SAT):</strong> {format(result.ICSAT, 'current')}</p>
            <p title="Minimum Base Current for Saturation"><strong>IB(SAT)min:</strong> {format(result.IBSAT, 'current')}</p>
          </div>
          {/* Optionally add more detailed explanations based on region */}
           {result.Region === 'Saturation' && <p className="text-xs text-muted-foreground mt-2">In saturation, IC is limited by VCC/RC, and VCE is approximately 0.2V.</p>}
           {result.Region === 'Cutoff' && <p className="text-xs text-muted-foreground mt-2">In cutoff, both IB and IC are approximately zero, and VCE is approximately VCC.</p>}
           {result.Region === 'Active' && <p className="text-xs text-muted-foreground mt-2">In the active region, IC = β * IB and VCE = VCC - IC * RC.</p>}

        </div>
      )}
    </CalculatorCard>
  );
}
