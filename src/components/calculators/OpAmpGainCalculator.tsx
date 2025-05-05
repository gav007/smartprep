
'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, GitCommitHorizontal } from 'lucide-react'; // Using GitCommitHorizontal for OpAmp symbol

type OpAmpConfig = 'inverting' | 'non-inverting';
type ResistanceUnit = 'Ω' | 'kΩ' | 'MΩ';

const resUnitMultipliers: Record<ResistanceUnit, number> = { 'Ω': 1, 'kΩ': 1e3, 'MΩ': 1e6 };

// Simple image paths - adjust if needed based on your public folder structure
const imagePaths = {
    inverting: '/images/opamp_inverting.png', // Placeholder paths
    nonInverting: '/images/opamp_non_inverting.png'
};

export default function OpAmpGainCalculator() {
  const [configType, setConfigType] = useState<OpAmpConfig>('inverting');
  const [r1Str, setR1Str] = useState<string>('');
  const [r1Unit, setR1Unit] = useState<ResistanceUnit>('kΩ');
  const [r2Str, setR2Str] = useState<string>(''); // R2 is Rf for inverting
  const [r2Unit, setR2Unit] = useState<ResistanceUnit>('kΩ');

  const [error, setError] = useState<string | null>(null);

  const gain = useMemo(() => {
    setError(null);
    const r1 = parseFloat(r1Str) * resUnitMultipliers[r1Unit];
    const r2 = parseFloat(r2Str) * resUnitMultipliers[r2Unit]; // r2 represents Rf or R2 based on config

    if (isNaN(r1) || isNaN(r2)) {
      if (r1Str || r2Str) {
        setError('Please enter valid numbers for both resistances.');
      }
      return null;
    }

    if (r1 <= 0 || r2 <= 0) {
       // Allow R1=0 for non-inverting (voltage follower), but R2 (Rf) must be > 0 if R1=0 for inverting?
       // Let's require positive resistances for simplicity in standard gain calcs.
       if (configType === 'inverting' && r1 === 0) {
            setError('Input resistance (R1) cannot be zero for standard inverting configuration.');
            return null;
       }
        if (r1 <=0 || r2 <=0) {
             setError('Resistances must be positive values.');
             return null;
        }
    }


    if (configType === 'inverting') {
      // Gain = -Rf / R1 (Here R2 represents Rf)
      return - (r2 / r1);
    } else { // non-inverting
      // Gain = 1 + (R2 / R1)
      return 1 + (r2 / r1);
    }
  }, [configType, r1Str, r1Unit, r2Str, r2Unit]);

   const formula = configType === 'inverting' ? 'Gain (Aᵥ) = - Rբ / Rᵢ' : 'Gain (Aᵥ) = 1 + R₂ / R₁';
   const r1Label = configType === 'inverting' ? 'Input Resistor (Rᵢ)' : 'Resistor R₁';
   const r2Label = configType === 'inverting' ? 'Feedback Resistor (Rբ)' : 'Resistor R₂';
   const imageSrc = configType === 'inverting' ? imagePaths.inverting : imagePaths.nonInverting;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><GitCommitHorizontal size={20}/> Op-Amp Gain Calculator</CardTitle>
        <CardDescription>Calculate voltage gain for basic op-amp configurations.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
           <Label htmlFor="configType">Configuration</Label>
           <Select value={configType} onValueChange={(v) => setConfigType(v as OpAmpConfig)}>
            <SelectTrigger id="configType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inverting">Inverting Amplifier</SelectItem>
              <SelectItem value="non-inverting">Non-Inverting Amplifier</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Display Diagram and Formula */}
        <div className="my-4 p-4 bg-muted/30 rounded border text-center">
            {/* Placeholder for Image - Replace with actual Image component */}
             <Image
                src={imageSrc}
                alt={`${configType === 'inverting' ? 'Inverting' : 'Non-Inverting'} Op-Amp Configuration`}
                 width={250} height={150} // Adjust size as needed
                className="mx-auto mb-2 object-contain"
                 data-ai-hint={`${configType} operational amplifier circuit diagram`}
                // Add placeholder styling if image fails to load
                onError={(e) => (e.currentTarget.style.display = 'none')} // Hide on error
            />
             {/* Fallback text if image fails */}
             {/* <p className="text-sm text-muted-foreground italic mb-2">(Diagram Placeholder)</p> */}
             <p className="font-mono text-sm font-semibold">{formula}</p>
        </div>

        {/* R1 Input */}
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="r1">{r1Label}</Label>
            <Input
              id="r1"
              type="number"
              step="any"
              min="0"
              value={r1Str}
              onChange={(e) => setR1Str(e.target.value)}
              placeholder="Enter Resistance"
            />
          </div>
           <Select value={r1Unit} onValueChange={(v) => setR1Unit(v as ResistanceUnit)}>
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(resUnitMultipliers).map(u => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* R2 / Rf Input */}
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="r2">{r2Label}</Label>
            <Input
              id="r2"
              type="number"
              step="any"
               min="0"
              value={r2Str}
              onChange={(e) => setR2Str(e.target.value)}
              placeholder="Enter Resistance"
            />
          </div>
           <Select value={r2Unit} onValueChange={(v) => setR2Unit(v as ResistanceUnit)}>
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(resUnitMultipliers).map(u => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle size={16} /> {error}
          </p>
        )}

        {(gain !== null && !error) && (
           <div className="pt-4 mt-4 border-t">
             <h4 className="font-semibold mb-2">Calculated Voltage Gain (A<sub>v</sub>):</h4>
             {/* Format gain */}
             <p className="text-xl font-bold">
                 {gain.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                 {/* Optionally add (Unitless) */}
             </p>
           </div>
        )}
      </CardContent>
    </Card>
  );
}
