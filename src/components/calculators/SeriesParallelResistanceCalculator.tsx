
'use client';

import React, { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2, AlertCircle } from 'lucide-react';
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

  const precision = Math.abs(displayValue) < 10 ? 3 : 2;
  return `${displayValue.toFixed(precision).replace(/\.?0+$/, '')} ${unit}`;
};

export default function SeriesParallelResistanceCalculator() {
  const [mode, setMode] = useState<'series' | 'parallel'>('series');
  const [resistors, setResistors] = useState<ResistorValue[]>([{ id: Date.now(), valueStr: '', unit: 'Ω' }]);
  const [error, setError] = useState<string | null>(null);

  const handleAddResistor = () => {
    setResistors([...resistors, { id: Date.now(), valueStr: '', unit: 'Ω' }]);
  };

  const handleRemoveResistor = (id: number) => {
    if (resistors.length <= 1) return; // Keep at least one resistor
    setResistors(resistors.filter(r => r.id !== id));
  };

  const handleValueChange = (id: number, valueStr: string) => {
    setResistors(resistors.map(r => r.id === id ? { ...r, valueStr } : r));
  };

  const handleUnitChange = (id: number, unit: ResistanceUnit) => {
    setResistors(resistors.map(r => r.id === id ? { ...r, unit } : r));
  };

  const totalResistance = useMemo(() => {
    setError(null);
    const valuesInOhms = resistors.map(r => {
      const val = parseFloat(r.valueStr);
      return isNaN(val) ? null : val * unitMultipliers[r.unit];
    });

    if (valuesInOhms.some(v => v === null || v < 0)) {
      setError('Invalid resistance value(s) entered. Values must be non-negative numbers.');
      return null;
    }
    // Filter out any null values that might have slipped through (though the check above should prevent it)
    const validValues = valuesInOhms.filter((v): v is number => v !== null);

     if (validValues.length < 2) {
       setError('Enter at least two valid resistance values.');
       return null; // Need at least two resistors for calculation usually
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
             // This should only happen if all inputs were 0, caught above, or potentially Infinity
             setError('Cannot calculate parallel resistance with these values.');
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
            <Label htmlFor="series">Series</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="parallel" id="parallel" />
            <Label htmlFor="parallel">Parallel</Label>
          </div>
        </RadioGroup>

        <div className="space-y-2">
          <Label>Resistor Values</Label>
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
                disabled={resistors.length <= 1}
                aria-label="Remove Resistor"
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={handleAddResistor}>
          <Plus className="mr-2 h-4 w-4" /> Add Resistor
        </Button>

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
