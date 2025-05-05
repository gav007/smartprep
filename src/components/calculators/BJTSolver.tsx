
'use client';

import React, { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CircuitBoard, RotateCcw } from 'lucide-react'; // Use CircuitBoard icon

type ResistanceUnit = 'Ω' | 'kΩ' | 'MΩ';
type VoltageUnit = 'V' | 'mV' | 'kV';
type CurrentUnit = 'A' | 'mA' | 'µA' | 'nA'; // Added nA

const resUnitMultipliers: Record<ResistanceUnit, number> = { 'Ω': 1, 'kΩ': 1e3, 'MΩ': 1e6 };

interface BJTResult {
  VBE: number | null;
  IB: number | null;
  IC: number | null;
  VCE: number | null;
  ICSAT: number | null;
  IBSAT: number | null;
}

// Formatting helpers (similar to other calculators)
const formatVoltage = (v: number | null): string => {
    if (v === null || !isFinite(v)) return 'N/A';
    let unit: VoltageUnit = 'V';
    let displayValue = v;
    if (Math.abs(v) >= 1000) { displayValue = v / 1000; unit = 'kV'; }
    else if (Math.abs(v) < 1 && v !== 0) { displayValue = v * 1000; unit = 'mV'; }
    const precision = Math.abs(displayValue) < 10 ? 3 : 2;
    return `${displayValue.toFixed(precision).replace(/\.?0+$/, '')} ${unit}`;
}

const formatCurrent = (i: number | null): string => {
    if (i === null || !isFinite(i)) return 'N/A';
    let unit: CurrentUnit = 'A';
    let displayValue = i;
    if (Math.abs(i) < 1e-6 && i !== 0) { displayValue = i * 1e9; unit = 'nA'; } // Added nA for smaller currents
    else if (Math.abs(i) < 1e-3 && i !== 0) { displayValue = i * 1e6; unit = 'µA'; }
    else if (Math.abs(i) < 1 && i !== 0) { displayValue = i * 1000; unit = 'mA'; }

    // Adjust precision based on magnitude
    const precision = Math.abs(displayValue) < 10 ? 3 : (Math.abs(displayValue) < 100 ? 4 : 5);
    // Use toPrecision for potentially very small/large numbers after scaling
    return `${displayValue.toPrecision(precision)} ${unit}`;
}

const initialVBE = '0.7';

export default function BJTSolver() {
  const [vbbStr, setVbbStr] = useState<string>('');
  const [rbStr, setRbStr] = useState<string>('');
  const [rbUnit, setRbUnit] = useState<ResistanceUnit>('kΩ');
  const [vccStr, setVccStr] = useState<string>('');
  const [rcStr, setRcStr] = useState<string>('');
  const [rcUnit, setRcUnit] = useState<ResistanceUnit>('kΩ');
  const [betaStr, setBetaStr] = useState<string>('');
  const [vbeStr, setVbeStr] = useState<string>(initialVBE); // Default VBE

  const [result, setResult] = useState<BJTResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = () => {
    setError(null);
    setResult(null);

    const VBB = parseFloat(vbbStr);
    const RB = parseFloat(rbStr) * resUnitMultipliers[rbUnit];
    const VCC = parseFloat(vccStr);
    const RC = parseFloat(rcStr) * resUnitMultipliers[rcUnit];
    const beta = parseFloat(betaStr);
    const VBE = parseFloat(vbeStr || initialVBE); // Use default if empty

    // Basic Input Validation
    const inputs = [VBB, RB, VCC, RC, beta, VBE];
    if (inputs.some(isNaN)) {
      setError('Please enter valid numbers for all fields.');
      return;
    }
    if (RB <= 0 || RC <= 0 || beta <= 0) {
      setError('RB, RC, and Beta (β) must be positive values.');
      return;
    }
     if (VBE < 0) {
         setError('VBE should typically be non-negative (e.g., 0.7V for silicon).');
         // Allow calculation but warn user
     }
      if (VBB <= VBE) {
           setError('VBB must be greater than VBE for base current to flow (cutoff condition).');
           // Set results indicating cutoff
            const ICSAT = VCC / RC;
            const IBSAT = ICSAT / (beta / 5); // Or: IBSAT_min = ICSAT / beta
            setResult({ VBE, IB: 0, IC: 0, VCE: VCC, ICSAT, IBSAT });
           return;
      }


    // Calculations
    let calculatedResult: BJTResult | null = null;
    try {
        const IB = (VBB - VBE) / RB;
        const IC = beta * IB;
        const VCE = VCC - (IC * RC);

        const ICSAT = VCC / RC;
        const betaForced = beta / 5; // As per user's provided formula
        const IBSAT = ICSAT / betaForced; // Or: IBSAT_min = ICSAT / beta

        calculatedResult = { VBE, IB, IC, VCE, ICSAT, IBSAT };

        // Check Operating Region (basic checks)
        if (VCE <= 0.2) { // Approx VCE(sat) for silicon
             // Likely in saturation, recalculate IC based on saturation
             const IC_Sat_Actual = VCC / RC; // Collector current is limited by RC and VCC
             const VCE_Sat_Actual = 0.2; // Assume VCEsat ~ 0.2V
             // IB remains as calculated from VBB/RB
              calculatedResult.IC = IC_Sat_Actual; // Update IC to saturation value
              calculatedResult.VCE = VCE_Sat_Actual; // Update VCE to saturation value
              // Keep the original IB calculation but add a warning
              setError("Warning: Transistor likely in Saturation. IC is limited by VCC/RC. (VCE ≈ 0.2V)");
        } else if (IB <= 0) { // Should be caught by VBB <= VBE check, but keep for robustness
             // Cutoff
             calculatedResult = { VBE, IB: 0, IC: 0, VCE: VCC, ICSAT, IBSAT };
             setError("Transistor is in Cutoff (IB ≈ 0).");
        }
        // If VCE > 0.2 and IB > 0, assume active region


    } catch (e: any) {
        setError(`Calculation error: ${e.message}`);
        return;
    }


    setResult(calculatedResult);
  };

  const handleReset = () => {
      setVbbStr('');
      setRbStr('');
      setRbUnit('kΩ');
      setVccStr('');
      setRcStr('');
      setRcUnit('kΩ');
      setBetaStr('');
      setVbeStr(initialVBE);
      setResult(null);
      setError(null);
  };

  const renderInput = (
      id: string,
      label: string,
      value: string,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
      unit?: ResistanceUnit,
      onUnitChange?: (u: ResistanceUnit) => void,
      placeholder?: string,
      min?: string | number,
      step?: string | number
  ) => (
    <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
            <Label htmlFor={id}>{label}</Label>
            <Input
            id={id}
            type="number"
            value={value}
            onChange={onChange}
            placeholder={placeholder || `Enter ${label}`}
            min={min}
            step={step || "any"}
            />
        </div>
        {unit && onUnitChange && (
             <Select value={unit} onValueChange={(newUnit) => onUnitChange(newUnit as ResistanceUnit)}>
                <SelectTrigger className="w-[80px]">
                <SelectValue />
                </SelectTrigger>
                <SelectContent>
                {Object.keys(resUnitMultipliers).map(u => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
                </SelectContent>
            </Select>
        )}
        {!unit && <div className="w-[80px] flex-shrink-0"></div>} {/* Placeholder for alignment */}
    </div>
  );


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CircuitBoard size={20}/> BJT Solver (Fixed Bias)</CardTitle>
        <CardDescription>Calculate parameters for a common-emitter fixed-bias BJT circuit.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
         {/* Inputs */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {renderInput('vbb', 'VBB (V)', vbbStr, (e) => setVbbStr(e.target.value), undefined, undefined, "e.g., 5")}
             {renderInput('rb', 'RB', rbStr, (e) => setRbStr(e.target.value), rbUnit, setRbUnit, "e.g., 47", 0)}
             {renderInput('vcc', 'VCC (V)', vccStr, (e) => setVccStr(e.target.value), undefined, undefined, "e.g., 12")}
             {renderInput('rc', 'RC', rcStr, (e) => setRcStr(e.target.value), rcUnit, setRcUnit, "e.g., 2.2", 0)}
             {renderInput('beta', 'Beta (β)', betaStr, (e) => setBetaStr(e.target.value), undefined, undefined, "e.g., 100", 0)}
             {renderInput('vbe', 'VBE (V)', vbeStr, (e) => setVbeStr(e.target.value), undefined, undefined, "Default: 0.7", 0, 0.01)}
         </div>

         <div className="flex flex-col md:flex-row gap-2 pt-2">
             <Button onClick={handleCalculate} className="w-full md:w-auto">Calculate</Button>
             <Button variant="outline" onClick={handleReset} className="w-full md:w-auto">
                 <RotateCcw className="mr-2 h-4 w-4" /> Reset
             </Button>
         </div>

        {error && (
          <p className="text-sm text-destructive flex items-center gap-1 mt-2">
            <AlertCircle size={16} /> {error}
          </p>
        )}

        {result && (
           <div className="pt-4 mt-4 border-t">
             <h4 className="font-semibold mb-2">Calculated Results:</h4>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                 <p><strong>VBE:</strong> {formatVoltage(result.VBE)}</p>
                 <p><strong>IB:</strong> {formatCurrent(result.IB)}</p>
                 <p><strong>IC:</strong> {formatCurrent(result.IC)}</p>
                 <p><strong>VCE:</strong> {formatVoltage(result.VCE)}</p>
                 <p><strong>IC(SAT):</strong> {formatCurrent(result.ICSAT)}</p>
                 <p><strong>IB(SAT):</strong> {formatCurrent(result.IBSAT)}</p>
             </div>
              <p className="text-xs text-muted-foreground mt-2">IB(SAT) calculated using β_forced = β / 5.</p>
           </div>
        )}
      </CardContent>
    </Card>
  );
}
