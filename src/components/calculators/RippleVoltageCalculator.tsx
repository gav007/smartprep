
'use client';

import React, { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Import RadioGroup components


type RectifierType = 'half-wave' | 'full-wave';
type CapacitanceUnit = 'F' | 'mF' | 'µF' | 'nF' | 'pF';
type ResistanceUnit = 'Ω' | 'kΩ' | 'MΩ';
type FrequencyUnit = 'Hz' | 'kHz'; // Ripple frequency depends on input frequency and rectifier type
type CurrentUnit = 'A' | 'mA' | 'µA';
type VoltageUnit = 'V' | 'mV';

const capUnitMultipliers: Record<CapacitanceUnit, number> = { 'F': 1, 'mF': 1e-3, 'µF': 1e-6, 'nF': 1e-9, 'pF': 1e-12 };
const resUnitMultipliers: Record<ResistanceUnit, number> = { 'Ω': 1, 'kΩ': 1e3, 'MΩ': 1e6 };
const freqUnitMultipliers: Record<FrequencyUnit, number> = { 'Hz': 1, 'kHz': 1e3 };
const currentUnitMultipliers: Record<CurrentUnit, number> = { 'A': 1, 'mA': 1e-3, 'µA': 1e-6 };

const formatVoltageResult = (value: number | null): string => {
  if (value === null || !isFinite(value)) return 'N/A';

  let unit: VoltageUnit = 'V';
  let displayValue = value;

   // Use mV for values less than 1V
  if (Math.abs(value) < 1 && Math.abs(value) !== 0) { displayValue = value * 1000; unit = 'mV'; }

  const precision = Math.abs(displayValue) < 10 ? 3 : 2;
  return `${displayValue.toFixed(precision).replace(/\.?0+$/, '')} ${unit}`;
};

export default function RippleVoltageCalculator() {
  const [rectifierType, setRectifierType] = useState<RectifierType>('full-wave');
  // Option 1: Load Current
  const [loadCurrentStr, setLoadCurrentStr] = useState<string>('');
  const [loadCurrentUnit, setLoadCurrentUnit] = useState<CurrentUnit>('mA');
  // Option 2: Load Resistance
  const [loadResistanceStr, setLoadResistanceStr] = useState<string>('');
  const [loadResistanceUnit, setLoadResistanceUnit] = useState<ResistanceUnit>('kΩ');
  const [peakVoltageStr, setPeakVoltageStr] = useState<string>(''); // Needed for resistance method
  const [peakVoltageUnit, setPeakVoltageUnit] = useState<VoltageUnit>('V'); // Needed for resistance method

  const [capacitanceStr, setCapacitanceStr] = useState<string>('');
  const [capacitanceUnit, setCapacitanceUnit] = useState<CapacitanceUnit>('µF');
  const [frequencyStr, setFrequencyStr] = useState<string>('');
  const [frequencyUnit, setFrequencyUnit] = useState<FrequencyUnit>('Hz');

  const [calculationMethod, setCalculationMethod] = useState<'current' | 'resistance'>('current');
  const [error, setError] = useState<string | null>(null);


  const rippleVoltage = useMemo(() => {
    setError(null);
    const capacitance = parseFloat(capacitanceStr) * capUnitMultipliers[capacitanceUnit];
    const inputFrequency = parseFloat(frequencyStr) * freqUnitMultipliers[frequencyUnit];

    if (isNaN(capacitance) || isNaN(inputFrequency)) {
       if (capacitanceStr || frequencyStr) setError('Enter valid capacitance and input frequency.');
      return null;
    }
     if (capacitance <= 0 || inputFrequency <= 0) {
       setError('Capacitance and frequency must be positive.');
       return null;
     }

    const rippleFrequency = rectifierType === 'full-wave' ? 2 * inputFrequency : inputFrequency;
    let loadCurrent: number | null = null;

    if (calculationMethod === 'current') {
      const iLoad = parseFloat(loadCurrentStr) * currentUnitMultipliers[loadCurrentUnit];
       if (isNaN(iLoad) || iLoad < 0) {
         if (loadCurrentStr) setError('Enter a valid non-negative load current.');
         return null;
       }
       loadCurrent = iLoad;
    } else { // resistance method
       const rLoad = parseFloat(loadResistanceStr) * resUnitMultipliers[loadResistanceUnit];
       const vPeak = parseFloat(peakVoltageStr) * (peakVoltageUnit === 'V' ? 1 : 1e-3);
       if (isNaN(rLoad) || isNaN(vPeak)) {
          if (loadResistanceStr || peakVoltageStr) setError('Enter valid load resistance and peak DC voltage.');
          return null;
       }
       if (rLoad <= 0 || vPeak < 0) {
          setError('Load resistance must be positive and peak voltage non-negative.');
          return null;
       }
       if (vPeak === 0) {
            // Handle zero voltage case - ripple is technically 0
           loadCurrent = 0;
       } else if (rLoad > 0) {
          // Approximate using peak voltage. More accurate would use average DC, but this is common.
          loadCurrent = vPeak / rLoad;
       } else {
          // Should be caught by rLoad <= 0, but belt and suspenders
          setError('Invalid load resistance.');
          return null;
       }
    }

    if (loadCurrent === null) {
       // Error set previously or default state
       return null;
    }

    // Formula: Vr = I_load / (f_ripple * C) (approximation for small ripple)
    if (rippleFrequency === 0 || capacitance === 0) {
       // Avoid division by zero, though checked above
       setError('Frequency and capacitance must be non-zero.');
       return null;
    }

    const vr = loadCurrent / (rippleFrequency * capacitance);
    return vr;

  }, [
    rectifierType, loadCurrentStr, loadCurrentUnit,
    loadResistanceStr, loadResistanceUnit, peakVoltageStr, peakVoltageUnit,
    capacitanceStr, capacitanceUnit, frequencyStr, frequencyUnit, calculationMethod
  ]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Ripple Voltage Calculator</CardTitle>
        <CardDescription>Estimate peak-to-peak ripple voltage (V<sub>r(pp)</sub> ≈ I<sub>L</sub> / (f<sub>r</sub>C))</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rectifier Type */}
        <div className="space-y-1">
           <Label htmlFor="rectifierType">Rectifier Type</Label>
           <Select value={rectifierType} onValueChange={(v) => setRectifierType(v as RectifierType)}>
            <SelectTrigger id="rectifierType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full-wave">Full-Wave</SelectItem>
              <SelectItem value="half-wave">Half-Wave</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Input Frequency */}
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="frequency">Input Frequency (f<sub>in</sub>)</Label>
            <Input
              id="frequency"
              type="number"
              step="any"
               min="0"
              value={frequencyStr}
              onChange={(e) => setFrequencyStr(e.target.value)}
              placeholder="e.g., 60"
            />
          </div>
           <Select value={frequencyUnit} onValueChange={(v) => setFrequencyUnit(v as FrequencyUnit)}>
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(freqUnitMultipliers).map(u => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter Capacitance */}
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="capacitance">Filter Capacitance (C)</Label>
            <Input
              id="capacitance"
              type="number"
              step="any"
               min="0"
              value={capacitanceStr}
              onChange={(e) => setCapacitanceStr(e.target.value)}
              placeholder="e.g., 1000"
            />
          </div>
           <Select value={capacitanceUnit} onValueChange={(v) => setCapacitanceUnit(v as CapacitanceUnit)}>
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(capUnitMultipliers).map(u => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Calculation Method */}
        <div className="space-y-1">
           <Label>Calculate using:</Label>
            <RadioGroup value={calculationMethod} onValueChange={(value) => setCalculationMethod(value as 'current' | 'resistance')} className="flex space-x-4 pt-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="current" id="calcCurrent" />
                <Label htmlFor="calcCurrent">Load Current (I<sub>L</sub>)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="resistance" id="calcResistance" />
                <Label htmlFor="calcResistance">Load Resistance (R<sub>L</sub>)</Label>
              </div>
            </RadioGroup>
        </div>

        {/* Conditional Inputs */}
        {calculationMethod === 'current' && (
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="loadCurrent">Load Current (I<sub>L</sub>)</Label>
              <Input
                id="loadCurrent"
                type="number"
                step="any"
                 min="0"
                value={loadCurrentStr}
                onChange={(e) => setLoadCurrentStr(e.target.value)}
                placeholder="e.g., 100"
              />
            </div>
             <Select value={loadCurrentUnit} onValueChange={(v) => setLoadCurrentUnit(v as CurrentUnit)}>
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(currentUnitMultipliers).map(u => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

         {calculationMethod === 'resistance' && (
             <>
                 <div className="flex items-end gap-2">
                    <div className="flex-1 space-y-1">
                        <Label htmlFor="loadResistance">Load Resistance (R<sub>L</sub>)</Label>
                        <Input
                        id="loadResistance"
                        type="number"
                        step="any"
                         min="0"
                        value={loadResistanceStr}
                        onChange={(e) => setLoadResistanceStr(e.target.value)}
                        placeholder="e.g., 1"
                        />
                    </div>
                     <Select value={loadResistanceUnit} onValueChange={(v) => setLoadResistanceUnit(v as ResistanceUnit)}>
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
                <div className="flex items-end gap-2">
                    <div className="flex-1 space-y-1">
                        <Label htmlFor="peakVoltage">Peak DC Voltage (V<sub>peak</sub> approx.)</Label>
                         <Input
                            id="peakVoltage"
                            type="number"
                            step="any"
                            min="0"
                            value={peakVoltageStr}
                            onChange={(e) => setPeakVoltageStr(e.target.value)}
                            placeholder="e.g., 12"
                        />
                    </div>
                     <Select value={peakVoltageUnit} onValueChange={(v) => setPeakVoltageUnit(v as VoltageUnit)}>
                        <SelectTrigger className="w-[80px]">
                        <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="V">V</SelectItem>
                            <SelectItem value="mV">mV</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </>
         )}

        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle size={16} /> {error}
          </p>
        )}

        {(rippleVoltage !== null && !error) && (
           <div className="pt-4 mt-4 border-t">
             <h4 className="font-semibold mb-2">Estimated Ripple Voltage (V<sub>r(pp)</sub>):</h4>
             <p className="text-xl font-bold">{formatVoltageResult(rippleVoltage)}</p>
             <p className="text-xs text-muted-foreground mt-1">Note: This is an approximation, especially for larger ripple percentages.</p>
           </div>
        )}
      </CardContent>
    </Card>
  );
}
