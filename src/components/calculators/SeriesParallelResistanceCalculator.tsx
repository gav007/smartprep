
'use client';

import React, { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2, AlertCircle, RotateCcw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ResistanceUnit = 'Ω' | 'kΩ' | 'MΩ';

const unitMultipliers: Record<ResistanceUnit, number> = {
  'Ω': 1, 'kΩ': 1e3, 'MΩ': 1e6,
};

interface ResistorValue {
  id: number;
  valueStr: string;
  unit: ResistanceUnit;
}

const formatResistanceResult = (value: number | null): string => {
  if (value === null || !isFinite(value)) return 'N/A';

  let unit: ResistanceUnit = 'Ω';
  let displayValue = value;

  if (Math.abs(value) >= 1e6) { displayValue = value / 1e6; unit = 'MΩ'; }
  else if (Math.abs(value) >= 1000) { displayValue = value / 1000; unit = 'kΩ'; }

  const precision = Math.abs(displayValue) < 10 ? 3 : (Math.abs(displayValue) < 100 ? 4 : 5);
  const displayString = displayValue.toPrecision(precision);

  return `${parseFloat(displayString)} ${unit}`;
};

const initialMode = 'series';
const initialResistors: ResistorValue[] = [
    { id: Date.now(), valueStr: '', unit: 'kΩ' },
    { id: Date.now() + 1, valueStr: '', unit: 'kΩ' } // Start with two empty resistors
];

export default function SeriesParallelResistanceCalculator() {
  const [mode, setMode] = useState<'series' | 'parallel'>(initialMode);
  const [resistors, setResistors] = useState<ResistorValue[]>(initialResistors);
  const [error, setError] = useState<string | null>(null);

  const handleAddResistor = () => {
     // Add with default kΩ unit
    setResistors([...resistors, { id: Date.now(), valueStr: '', unit: 'kΩ' }]);
  };

  const handleRemoveResistor = (id: number) => {
    if (resistors.length <= 2) return; // Keep at least two resistors
    setResistors(resistors.filter(r => r.id !== id));
  };

  const handleValueChange = (id: number, valueStr: string) => {
    setResistors(resistors.map(r => r.id === id ? { ...r, valueStr } : r));
     setError(null); // Clear error on input change
  };

  const handleUnitChange = (id: number, unit: ResistanceUnit) => {
    setResistors(resistors.map(r => r.id === id ? { ...r, unit } : r));
     setError(null); // Clear error on unit change
  };

  const handleReset = () => {
      setMode(initialMode);
      setResistors([ // Reset to two empty resistors with default unit
          { id: Date.now(), valueStr: '', unit: 'kΩ' },
          { id: Date.now() + 1, valueStr: '', unit: 'kΩ' }
      ]);
      setError(null);
  };

  const totalResistance = useMemo(() => {
    setError(null); // Clear error before recalculation
    const valuesInOhms = resistors.map(r => {
      const val = parseFloat(r.valueStr);
      return isNaN(val) || val < 0 ? null : val * unitMultipliers[r.unit]; // Ensure non-negative
    });

    const validValues = valuesInOhms.filter((v): v is number => v !== null);

     if (validValues.length < resistors.length) {
         // If there are fewer valid values than resistors, it means some inputs are invalid or empty
         if (resistors.some(r => r.valueStr.trim() !== '')) { // Show error only if some input exists
            setError('Enter valid non-negative numbers for all resistors.');
         }
        return null;
     }

     if (validValues.length < 2) {
       // Don't show error if only one resistor exists, just no result
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
            setError('Cannot calculate parallel resistance (division by zero).');
            return null;
        }
        return 1 / sumOfInverses;
    }
  }, [resistors, mode]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Series & Parallel Resistance</CardTitle>
        <CardDescription>Calculate the total resistance for resistors connected in series or parallel.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={mode} onValueChange={(value) => setMode(value as 'series' | 'parallel')} className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="series" id="series" />
            <Label htmlFor="series">Series (R<sub>T</sub> = R₁ + R₂ + ...)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="parallel" id="parallel" />
            <Label htmlFor="parallel">Parallel (1/R<sub>T</sub> = 1/R₁ + 1/R₂ + ...)</Label>
          </div>
        </RadioGroup>

        <div className="space-y-2 border-t pt-4">
          <Label className="font-medium">Resistor Values</Label>
          {resistors.map((resistor, index) => (
            <div key={resistor.id} className="flex items-center gap-2">
              <Input
                type="number"
                step="any"
                min="0"
                value={resistor.valueStr}
                onChange={(e) => handleValueChange(resistor.id, e.target.value)}
                placeholder={`R${index + 1}`}
                className="flex-1"
              />
               <Select value={resistor.unit} onValueChange={(newUnit) => handleUnitChange(resistor.id, newUnit as ResistanceUnit)}>
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(unitMultipliers).map(u => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveResistor(resistor.id)}
                disabled={resistors.length <= 2} // Keep minimum 2 inputs
                aria-label="Remove Resistor"
                className="text-muted-foreground hover:text-destructive disabled:text-muted-foreground/50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-2">
             <Button variant="outline" size="sm" onClick={handleAddResistor}>
                 <Plus className="mr-2 h-4 w-4" /> Add Resistor
             </Button>
             <Button variant="outline" size="sm" onClick={handleReset}>
                 <RotateCcw className="mr-2 h-4 w-4" /> Reset All
             </Button>
        </div>


        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle size={16} /> {error}
          </p>
        )}

        {totalResistance !== null && !error && (
           <div className="pt-4 mt-4 border-t">
             <h4 className="font-semibold mb-2">Total Resistance (R<sub>T</sub>):</h4>
             <p className="text-xl font-bold">{formatResistanceResult(totalResistance)}</p>
           </div>
        )}
      </CardContent>
    </Card>
  );
}
