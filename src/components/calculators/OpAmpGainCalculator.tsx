// src/components/calculators/OpAmpGainCalculator.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle, GitCommitHorizontal, RotateCcw } from 'lucide-react';
import CalculatorCard from './CalculatorCard';
import CalculatorInput from './CalculatorInput';
import type { Unit } from '@/lib/units';
import { resistanceUnitOptions, unitMultipliers, defaultUnits, formatResultValue } from '@/lib/units';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type OpAmpConfig = 'inverting' | 'non-inverting';

// Simple image paths - adjust if needed based on your public folder structure
const imagePaths = {
    inverting: '/assets/images/opamp_inverting.png',
    nonInverting: '/assets/images/opamp_non_inverting.png'
};

const initialConfig: OpAmpConfig = 'inverting';
const initialR1Unit: Unit = defaultUnits.resistance;
const initialR2Unit: Unit = defaultUnits.resistance;

export default function OpAmpGainCalculator() {
  const [configType, setConfigType] = useState<OpAmpConfig>(initialConfig);
  const [r1Str, setR1Str] = useState<string>('');
  const [r1Unit, setR1Unit] = useState<Unit>(initialR1Unit);
  const [r2Str, setR2Str] = useState<string>(''); // R2 is Rf for inverting
  const [r2Unit, setR2Unit] = useState<Unit>(initialR2Unit);
  const [error, setError] = useState<string | null>(null);

  const gain = useMemo(() => {
    setError(null);
    const r1 = parseFloat(r1Str) * unitMultipliers[r1Unit];
    const r2 = parseFloat(r2Str) * unitMultipliers[r2Unit];

    if (isNaN(r1) || isNaN(r2)) {
      if (r1Str || r2Str) setError('Enter valid numbers for both resistances.');
      return null;
    }
    if (r1 <= 0 || r2 <= 0) {
        // R1 can technically be 0 for voltage follower (non-inverting gain=1), but let's enforce >0 for standard gain calcs
        if (configType === 'inverting' && r1 === 0) {
             setError('Input resistance (Rᵢ) must be positive for standard inverting configuration.');
             return null;
        }
        if (r1 <= 0 || r2 <= 0) { // Simplified: require positive R for both types for now
             setError('Resistances must be positive values.');
             return null;
        }
    }

    if (configType === 'inverting') return - (r2 / r1); // Gain = -Rf / R1
    else return 1 + (r2 / r1); // Gain = 1 + R2 / R1

  }, [configType, r1Str, r1Unit, r2Str, r2Unit]);

  const formula = configType === 'inverting' ? 'Gain (Aᵥ) = - Rբ / Rᵢ' : 'Gain (Aᵥ) = 1 + R₂ / R₁';
  const r1Label = configType === 'inverting' ? 'Input Resistor (Rᵢ)' : 'Resistor R₁';
  const r2Label = configType === 'inverting' ? 'Feedback Resistor (Rբ)' : 'Resistor R₂';
  const imageSrc = configType === 'inverting' ? imagePaths.inverting : imagePaths.nonInverting;

  const handleReset = useCallback(() => {
    setConfigType(initialConfig);
    setR1Str('');
    setR1Unit(initialR1Unit);
    setR2Str('');
    setR2Unit(initialR2Unit);
    setError(null);
  }, []);

   const { displayValue: gainDisplay } = formatResultValue(gain, 'gain'); // Use 'gain' type

  return (
    <CalculatorCard
      title="Op-Amp Gain Calculator"
      description="Calculate voltage gain for basic op-amp configurations."
      icon={GitCommitHorizontal}
    >
      {/* Configuration Type */}
      <div className="space-y-1 mb-4">
        <Label htmlFor="configType">Configuration</Label>
        <Select value={configType} onValueChange={(v) => setConfigType(v as OpAmpConfig)}>
          <SelectTrigger id="configType"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="inverting">Inverting Amplifier</SelectItem>
            <SelectItem value="non-inverting">Non-Inverting Amplifier</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Diagram and Formula */}
      <div className="my-4 p-4 bg-muted/30 rounded border text-center">
        <Image
          src={imageSrc}
          alt={`${configType === 'inverting' ? 'Inverting' : 'Non-Inverting'} Op-Amp Configuration`}
          width={250} height={150}
          className="mx-auto mb-2 object-contain"
          data-ai-hint={`${configType} operational amplifier circuit diagram`}
          onError={(e) => (e.currentTarget.style.display = 'none')}
          priority={false} // Not critical for initial load usually
        />
        <noscript><p className="text-sm text-muted-foreground italic mb-2">(Diagram for {configType} op-amp)</p></noscript>
        <p className="font-mono text-sm font-semibold">{formula}</p>
      </div>

      {/* Inputs */}
      <div className="space-y-3">
        <CalculatorInput
          id="r1"
          label={r1Label}
          value={r1Str}
          onChange={setR1Str}
          unit={r1Unit}
          unitOptions={resistanceUnitOptions}
          onUnitChange={setR1Unit}
          placeholder="Enter Resistance"
          min="0"
           error={!!error && (isNaN(parseFloat(r1Str)) || parseFloat(r1Str) <= 0)}
        />
        <CalculatorInput
          id="r2"
          label={r2Label}
          value={r2Str}
          onChange={setR2Str}
          unit={r2Unit}
          unitOptions={resistanceUnitOptions}
          onUnitChange={setR2Unit}
          placeholder="Enter Resistance"
           min="0"
           error={!!error && (isNaN(parseFloat(r2Str)) || parseFloat(r2Str) <= 0)}
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
      {(gain !== null && !error) && (
        <div className="pt-4 mt-4 border-t">
          <h4 className="font-semibold mb-2">Calculated Voltage Gain (A<sub>v</sub>):</h4>
          <p className="text-xl font-bold">{gainDisplay} <span className="text-sm text-muted-foreground">(Unitless)</span></p>
        </div>
      )}

      {/* Reset Button */}
      <Button variant="outline" onClick={handleReset} className="w-full md:w-auto mt-4">
        <RotateCcw className="mr-2 h-4 w-4" /> Reset
      </Button>
    </CalculatorCard>
  );
}
