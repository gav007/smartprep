// src/components/calculators/SeriesParallelResistanceCalculator.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, AlertCircle, RotateCcw, Link2 } from 'lucide-react'; // Using Link2 icon
import CalculatorCard from './CalculatorCard';
import CalculatorInput from './CalculatorInput'; // Import shared input
import type { Unit } from '@/lib/units';
import { resistanceUnitOptions, unitMultipliers, defaultUnits, formatResultValue } from '@/lib/units';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ResistorValue {
  id: number;
  valueStr: string;
  unit: Unit; // Use generic Unit type
}

const initialMode = 'series';
const initialResistors: ResistorValue[] = [
    { id: Date.now(), valueStr: '', unit: defaultUnits.resistance }, // Start with default Ω or kΩ? Let's use Ω.
    { id: Date.now() + 1, valueStr: '', unit: defaultUnits.resistance }
];

export default function SeriesParallelResistanceCalculator() {
  const [mode, setMode] = useState<'series' | 'parallel'>(initialMode);
  const [resistors, setResistors] = useState<ResistorValue[]>(initialResistors);
  const [error, setError] = useState<string | null>(null);

  const handleAddResistor = () => {
    setResistors([...resistors, { id: Date.now(), valueStr: '', unit: defaultUnits.resistance }]);
  };

  const handleRemoveResistor = (id: number) => {
    if (resistors.length <= 2) return;
    setResistors(resistors.filter(r => r.id !== id));
  };

  const handleValueChange = (id: number, valueStr: string) => {
    setResistors(resistors.map(r => r.id === id ? { ...r, valueStr } : r));
    setError(null);
  };

  const handleUnitChange = (id: number, unit: Unit) => {
    setResistors(resistors.map(r => r.id === id ? { ...r, unit } : r));
    setError(null);
  };

  const handleReset = useCallback(() => {
      setMode(initialMode);
      // Reset to two empty resistors with default unit
      setResistors([
          { id: Date.now(), valueStr: '', unit: defaultUnits.resistance },
          { id: Date.now() + 1, valueStr: '', unit: defaultUnits.resistance }
      ]);
      setError(null);
  }, []);

  const totalResistance = useMemo(() => {
    setError(null);
    const valuesInOhms = resistors.map(r => {
      const val = parseFloat(r.valueStr);
      // Validate each resistor value
      if (isNaN(val) || val < 0) return null;
      return val * unitMultipliers[r.unit];
    });

    const validValues = valuesInOhms.filter((v): v is number => v !== null);

     if (validValues.length < resistors.length) {
         if (resistors.some(r => r.valueStr.trim() !== '')) {
             setError('Enter valid non-negative numbers for all resistors.');
         }
         return null;
     }
     if (validValues.length < 2) {
       if (resistors.length >= 2) {
          setError('Enter at least two valid resistance values.');
       }
       return null;
     }

    if (mode === 'series') {
      return validValues.reduce((sum, val) => sum + val, 0);
    } else { // parallel
      if (validValues.some(v => v === 0)) {
        setError('Resistance cannot be zero for parallel calculation.');
        return null;
      }
      const sumOfInverses = validValues.reduce((sum, val) => sum + (1 / val), 0);
       if (sumOfInverses === 0) {
            // This should only happen if all inputs were zero, already handled
            setError('Cannot calculate parallel resistance (division by zero).');
            return null;
        }
      return 1 / sumOfInverses;
    }
  }, [resistors, mode]);

   const { displayValue: totalResDisplay, unit: totalResUnit } = formatResultValue(totalResistance, 'resistance');


  return (
    <CalculatorCard
      title="Series & Parallel Resistance"
      description="Calculate the total resistance for resistors connected in series or parallel."
      icon={Link2}
    >
      {/* Mode Selector */}
      <RadioGroup value={mode} onValueChange={(value) => setMode(value as 'series' | 'parallel')} className="flex space-x-4 mb-4">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="series" id="series" />
          <Label htmlFor="series">Series (R<sub>T</sub> = R₁ + R₂ + ...)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="parallel" id="parallel" />
          <Label htmlFor="parallel">Parallel (1/R<sub>T</sub> = 1/R₁ + 1/R₂ + ...)</Label>
        </div>
      </RadioGroup>

      {/* Resistor Inputs */}
      <div className="space-y-3 border-t pt-4">
        <Label className="font-medium text-lg">Resistor Values</Label>
        {resistors.map((resistor, index) => (
          <div key={resistor.id} className="flex items-center gap-2">
            {/* Use CalculatorInput for each resistor */}
            <div className="flex-grow">
                <CalculatorInput
                    id={`resistor-${resistor.id}`}
                    label={`R${index + 1}`}
                    value={resistor.valueStr}
                    onChange={(v) => handleValueChange(resistor.id, v)}
                    unit={resistor.unit}
                    unitOptions={resistanceUnitOptions}
                    onUnitChange={(u) => handleUnitChange(resistor.id, u)}
                    placeholder={`Value for R${index + 1}`}
                    min="0"
                />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveResistor(resistor.id)}
              disabled={resistors.length <= 2}
              aria-label={`Remove Resistor R${index + 1}`}
              className="text-muted-foreground hover:text-destructive disabled:text-muted-foreground/50 shrink-0 mt-auto mb-[2px]" // Align button
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row gap-2 mt-4">
        <Button variant="outline" size="sm" onClick={handleAddResistor}>
          <Plus className="mr-2 h-4 w-4" /> Add Resistor
        </Button>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="mr-2 h-4 w-4" /> Reset All
        </Button>
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
      {(totalResistance !== null && !error) && (
        <div className="pt-4 mt-4 border-t">
          <h4 className="font-semibold mb-2">Total Resistance (R<sub>T</sub>):</h4>
          <p className="text-xl font-bold">{totalResDisplay} {totalResUnit}</p>
        </div>
      )}
    </CalculatorCard>
  );
}
