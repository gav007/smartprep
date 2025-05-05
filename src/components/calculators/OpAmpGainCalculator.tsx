
'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, GitCommitHorizontal, RotateCcw } from 'lucide-react'; // Using GitCommitHorizontal for OpAmp symbol

type OpAmpConfig = 'inverting' | 'non-inverting';
type ResistanceUnit = 'Ω' | 'kΩ' | 'MΩ';

const resUnitMultipliers: Record<ResistanceUnit, number> = { 'Ω': 1, 'kΩ': 1e3, 'MΩ': 1e6 };

// Simple image paths - adjust if needed based on your public folder structure
const imagePaths = {
    inverting: '/assets/images/opamp_inverting.png', // Assuming images are in public/assets/images
    nonInverting: '/assets/images/opamp_non_inverting.png'
};

const initialConfig: OpAmpConfig = 'inverting';
const initialR1Unit: ResistanceUnit = 'kΩ';
const initialR2Unit: ResistanceUnit = 'kΩ';

export default function OpAmpGainCalculator() {
  const [configType, setConfigType] = useState<OpAmpConfig>(initialConfig);
  const [r1Str, setR1Str] = useState<string>('');
  const [r1Unit, setR1Unit] = useState<ResistanceUnit>(initialR1Unit);
  const [r2Str, setR2Str] = useState<string>(''); // R2 is Rf for inverting
  const [r2Unit, setR2Unit] = useState<ResistanceUnit>(initialR2Unit);

  const [error, setError] = useState<string | null>(null);

  const gain = useMemo(() => {
    setError(null);
    const r1 = parseFloat(r1Str) * resUnitMultipliers[r1Unit];
    const r2 = parseFloat(r2Str) * resUnitMultipliers[r2Unit]; // r2 represents Rf or R2 based on config

    if (isNaN(r1) || isNaN(r2)) {
      if (r1Str || r2Str) {
        // setError('Please enter valid numbers for both resistances.'); // Hide error initially
      }
      return null;
    }

    if (r1 <= 0 || r2 <= 0) {
       // Allow R1=0 for non-inverting (voltage follower), but R2 (Rf) must be > 0 if R1=0 for inverting?
       // Let's require positive resistances for simplicity in standard gain calcs.
       if (configType === 'inverting' && r1 === 0) {
            setError('Input resistance (Rᵢ) cannot be zero for standard inverting configuration.');
            return null;
       }
       // Allow R1=0 for non-inverting if intended (results in gain=1), but R2 must be > 0 if R1=0.
        // Simplified: require positive for now
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

   const handleReset = () => {
       setConfigType(initialConfig);
       setR1Str('');
       setR1Unit(initialR1Unit);
       setR2Str('');
       setR2Unit(initialR2Unit);
       setError(null);
   };

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
             <noscript>
                 <p className="text-sm text-muted-foreground italic mb-2">(Diagram for {configType} op-amp)</p>
             </noscript>
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

         {/* Reset Button */}
         <Button variant="outline" onClick={handleReset} className="w-full md:w-auto mt-2">
             <RotateCcw className="mr-2 h-4 w-4" /> Reset
         </Button>
      </CardContent>
    </Card>
  );
}
