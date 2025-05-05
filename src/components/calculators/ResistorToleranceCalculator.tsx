
'use client';

import React, { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Sigma } from 'lucide-react'; // Sigma icon for Tolerance

type ResistanceUnit = 'Ω' | 'kΩ' | 'MΩ';
type ToleranceUnit = '%' | 'ppm'; // Allow PPM for tempco later if needed

const resUnitMultipliers: Record<ResistanceUnit, number> = { 'Ω': 1, 'kΩ': 1e3, 'MΩ': 1e6 };

const formatResistanceResult = (value: number | null, baseUnit: ResistanceUnit = 'Ω'): string => {
    if (value === null || !isFinite(value)) return 'N/A';

    let displayValue = value;
    let unit = baseUnit; // Start with the input's unit or base Ω

    // Convert value to base ohms first for consistent comparison
    const valueInOhms = value; // Assume value is already in Ohms for range calculation

    if (Math.abs(valueInOhms) >= 1e6) {
        displayValue = valueInOhms / 1e6; unit = 'MΩ';
    } else if (Math.abs(valueInOhms) >= 1000) {
        displayValue = valueInOhms / 1000; unit = 'kΩ';
    } else {
         displayValue = valueInOhms; unit = 'Ω'; // Already in Ohms or less than 1k
    }

    const precision = Math.abs(displayValue) < 10 ? 3 : 2;
    return `${displayValue.toFixed(precision).replace(/\.?0+$/, '')} ${unit}`;
};


export default function ResistorToleranceCalculator() {
  const [nominalResistanceStr, setNominalResistanceStr] = useState<string>('');
  const [resistanceUnit, setResistanceUnit] = useState<ResistanceUnit>('kΩ');
  const [toleranceStr, setToleranceStr] = useState<string>('5'); // Default to 5%
  // const [toleranceUnit, setToleranceUnit] = useState<ToleranceUnit>('%'); // Currently only %

  const [error, setError] = useState<string | null>(null);

  const toleranceRange = useMemo(() => {
    setError(null);
    const nominalR = parseFloat(nominalResistanceStr);
    const tolerancePercent = parseFloat(toleranceStr);

    if (isNaN(nominalR) || isNaN(tolerancePercent)) {
      if (nominalResistanceStr || toleranceStr) {
         setError('Please enter valid numbers for resistance and tolerance.');
      }
      return { min: null, max: null };
    }

    if (nominalR < 0 || tolerancePercent < 0) {
      setError('Resistance and tolerance percentage must be non-negative.');
      return { min: null, max: null };
    }

    const nominalRInOhms = nominalR * resUnitMultipliers[resistanceUnit];
    const toleranceValue = nominalRInOhms * (tolerancePercent / 100);

    const minResistance = nominalRInOhms - toleranceValue;
    const maxResistance = nominalRInOhms + toleranceValue;

    return { min: minResistance, max: maxResistance };
  }, [nominalResistanceStr, resistanceUnit, toleranceStr]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sigma size={20}/> Resistor Tolerance Range</CardTitle>
        <CardDescription>Calculate the minimum and maximum resistance based on tolerance.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nominal Resistance Input */}
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="nominalResistance">Nominal Resistance</Label>
            <Input
              id="nominalResistance"
              type="number"
              step="any"
              min="0"
              value={nominalResistanceStr}
              onChange={(e) => setNominalResistanceStr(e.target.value)}
              placeholder="e.g., 4.7"
            />
          </div>
           <Select value={resistanceUnit} onValueChange={(v) => setResistanceUnit(v as ResistanceUnit)}>
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

        {/* Tolerance Input */}
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="tolerance">Tolerance (%)</Label>
            <Input
              id="tolerance"
              type="number"
              step="any"
              min="0"
              value={toleranceStr}
              onChange={(e) => setToleranceStr(e.target.value)}
              placeholder="e.g., 5"
            />
          </div>
           <span className="pb-2 text-muted-foreground">%</span> {/* Indicate unit */}
           {/* Select for % or ppm if needed later
           <Select value={toleranceUnit} onValueChange={(v) => setToleranceUnit(v as ToleranceUnit)}>
             <SelectTrigger className="w-[80px]"> <SelectValue /> </SelectTrigger>
             <SelectContent>
               <SelectItem value="%">%</SelectItem>
               <SelectItem value="ppm">ppm</SelectItem>
             </SelectContent>
           </Select> */}
        </div>

        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle size={16} /> {error}
          </p>
        )}

        {(toleranceRange.min !== null && toleranceRange.max !== null && !error) && (
           <div className="pt-4 mt-4 border-t">
             <h4 className="font-semibold mb-2">Resistance Range:</h4>
             <p><strong>Min:</strong> {formatResistanceResult(toleranceRange.min)}</p>
             <p><strong>Max:</strong> {formatResistanceResult(toleranceRange.max)}</p>
           </div>
        )}
      </CardContent>
    </Card>
  );
}

