// src/components/calculators/RippleVoltageCalculator.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle, Waves, RotateCcw } from 'lucide-react'; // Using Waves icon
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import CalculatorCard from './CalculatorCard';
import CalculatorInput from './CalculatorInput';
import type { Unit } from '@/lib/units';
import {
    capacitanceUnitOptions,
    resistanceUnitOptions,
    frequencyUnitOptions,
    currentUnitOptions,
    voltageUnitOptions,
    unitMultipliers,
    defaultUnits,
    formatResultValue
} from '@/lib/units';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type RectifierType = 'half-wave' | 'full-wave';
type CalculationMethod = 'current' | 'resistance';

// Initial state values
const initialRectifierType: RectifierType = 'full-wave';
const initialLoadCurrentUnit: Unit = defaultUnits.current; // Using 'A'
const initialLoadResistanceUnit: Unit = defaultUnits.resistance; // Using 'Ω'
const initialPeakVoltageUnit: Unit = defaultUnits.voltage; // Using 'V'
const initialCapacitanceUnit: Unit = defaultUnits.capacitance; // Using 'µF'
const initialFrequencyUnit: Unit = defaultUnits.frequency; // Using 'Hz'
const initialCalculationMethod: CalculationMethod = 'current';

export default function RippleVoltageCalculator() {
  const [rectifierType, setRectifierType] = useState<RectifierType>(initialRectifierType);
  const [loadCurrentStr, setLoadCurrentStr] = useState<string>('');
  const [loadCurrentUnit, setLoadCurrentUnit] = useState<Unit>(initialLoadCurrentUnit);
  const [loadResistanceStr, setLoadResistanceStr] = useState<string>('');
  const [loadResistanceUnit, setLoadResistanceUnit] = useState<Unit>(initialLoadResistanceUnit);
  const [peakVoltageStr, setPeakVoltageStr] = useState<string>('');
  const [peakVoltageUnit, setPeakVoltageUnit] = useState<Unit>(initialPeakVoltageUnit);
  const [capacitanceStr, setCapacitanceStr] = useState<string>('');
  const [capacitanceUnit, setCapacitanceUnit] = useState<Unit>(initialCapacitanceUnit);
  const [frequencyStr, setFrequencyStr] = useState<string>('');
  const [frequencyUnit, setFrequencyUnit] = useState<Unit>(initialFrequencyUnit);
  const [calculationMethod, setCalculationMethod] = useState<CalculationMethod>(initialCalculationMethod);
  const [error, setError] = useState<string | null>(null);

  const rippleVoltage = useMemo(() => {
    setError(null);
    const capacitance = parseFloat(capacitanceStr) * unitMultipliers[capacitanceUnit];
    const inputFrequency = parseFloat(frequencyStr) * unitMultipliers[frequencyUnit];

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
      const iLoad = parseFloat(loadCurrentStr) * unitMultipliers[loadCurrentUnit];
      if (isNaN(iLoad) || iLoad < 0) {
        if (loadCurrentStr) setError('Enter a valid non-negative load current.');
        return null;
      }
      loadCurrent = iLoad;
    } else { // resistance method
      const rLoad = parseFloat(loadResistanceStr) * unitMultipliers[loadResistanceUnit];
      const vPeak = parseFloat(peakVoltageStr) * unitMultipliers[peakVoltageUnit];
      if (isNaN(rLoad) || isNaN(vPeak)) {
        if (loadResistanceStr || peakVoltageStr) setError('Enter valid load resistance and peak DC voltage.');
        return null;
      }
      if (rLoad <= 0 || vPeak < 0) {
        setError('Load resistance must be positive and peak voltage non-negative.');
        return null;
      }
       if (rLoad > 0) loadCurrent = vPeak / rLoad;
       else { setError('Invalid load resistance.'); return null; } // Handle division by zero for R
    }

    if (loadCurrent === null) return null;

    // Formula: Vr = I_load / (f_ripple * C) (approximation for small ripple)
    if (rippleFrequency === 0 || capacitance === 0) {
      setError('Ripple frequency and capacitance must be non-zero.');
      return null;
    }

    const vr = loadCurrent / (rippleFrequency * capacitance);

     // Add a warning if ripple is large (e.g., > 1V or > 10% of Vpeak)
     const vPeakNum = parseFloat(peakVoltageStr) * unitMultipliers[peakVoltageUnit];
     if (!isNaN(vPeakNum) && vPeakNum > 0 && (vr > 1 || vr / vPeakNum > 0.1) && calculationMethod === 'resistance') {
         setError(prev => prev ? `${prev} Warning: Ripple voltage is high, approximation may be less accurate.` : "Warning: Ripple voltage is high, approximation may be less accurate.");
     } else if (vr > 1 && calculationMethod === 'current') {
          setError(prev => prev ? `${prev} Warning: Ripple voltage is high (>1V), approximation may be less accurate.` : "Warning: Ripple voltage is high (>1V), approximation may be less accurate.");
     }


    return vr;
  }, [
    rectifierType, loadCurrentStr, loadCurrentUnit,
    loadResistanceStr, loadResistanceUnit, peakVoltageStr, peakVoltageUnit,
    capacitanceStr, capacitanceUnit, frequencyStr, frequencyUnit, calculationMethod
  ]);

  const handleReset = () => {
    setRectifierType(initialRectifierType);
    setLoadCurrentStr('');
    setLoadCurrentUnit(initialLoadCurrentUnit);
    setLoadResistanceStr('');
    setLoadResistanceUnit(initialLoadResistanceUnit);
    setPeakVoltageStr('');
    setPeakVoltageUnit(initialPeakVoltageUnit);
    setCapacitanceStr('');
    setCapacitanceUnit(initialCapacitanceUnit);
    setFrequencyStr('');
    setFrequencyUnit(initialFrequencyUnit);
    setCalculationMethod(initialCalculationMethod);
    setError(null);
  };

  const { displayValue: rippleDisplayValue, unit: rippleUnit } = formatResultValue(rippleVoltage, 'voltage');

  return (
    <CalculatorCard
      title="Ripple Voltage Calculator"
      description="Estimate peak-to-peak ripple voltage (V_r(pp) ≈ I_L / (f_r * C))"
      icon={Waves}
    >
      {/* Rectifier Type Radio Group */}
      <div className="space-y-1">
          <Label>Rectifier Type</Label>
          <RadioGroup value={rectifierType} onValueChange={(v) => setRectifierType(v as RectifierType)} className="flex space-x-4 pt-1">
              <div className="flex items-center space-x-2">
                  <RadioGroupItem value="full-wave" id="rect-full" />
                  <Label htmlFor="rect-full">Full-Wave (f<sub>r</sub> = 2 * f<sub>in</sub>)</Label>
              </div>
              <div className="flex items-center space-x-2">
                  <RadioGroupItem value="half-wave" id="rect-half" />
                  <Label htmlFor="rect-half">Half-Wave (f<sub>r</sub> = f<sub>in</sub>)</Label>
              </div>
          </RadioGroup>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 gap-3">
          <CalculatorInput
            id="frequency"
            label="Input Frequency (f_in)"
            value={frequencyStr}
            onChange={setFrequencyStr}
            unit={frequencyUnit}
            unitOptions={frequencyUnitOptions}
            onUnitChange={setFrequencyUnit}
            placeholder="e.g., 60"
            tooltip="Frequency of the AC input signal"
            min="0"
          />
          <CalculatorInput
            id="capacitance"
            label="Filter Capacitance (C)"
            value={capacitanceStr}
            onChange={setCapacitanceStr}
            unit={capacitanceUnit}
            unitOptions={capacitanceUnitOptions}
            onUnitChange={setCapacitanceUnit}
            placeholder="e.g., 1000"
            tooltip="Value of the filter capacitor"
            min="0"
          />
      </div>

        {/* Calculation Method Toggle */}
        <div className="space-y-1 border-t pt-4">
           <Label>Calculate using:</Label>
            <RadioGroup value={calculationMethod} onValueChange={(value) => setCalculationMethod(value as CalculationMethod)} className="flex space-x-4 pt-1">
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
       <div className="grid grid-cols-1 gap-3 border-t pt-4">
        {calculationMethod === 'current' && (
           <CalculatorInput
             id="loadCurrent"
             label="Load Current (I_L)"
             value={loadCurrentStr}
             onChange={setLoadCurrentStr}
             unit={loadCurrentUnit}
             unitOptions={currentUnitOptions}
             onUnitChange={setLoadCurrentUnit}
             placeholder="e.g., 100"
             tooltip="DC current drawn by the load"
             min="0"
           />
        )}

         {calculationMethod === 'resistance' && (
             <>
                <CalculatorInput
                  id="loadResistance"
                  label="Load Resistance (R_L)"
                  value={loadResistanceStr}
                  onChange={setLoadResistanceStr}
                  unit={loadResistanceUnit}
                  unitOptions={resistanceUnitOptions}
                  onUnitChange={setLoadResistanceUnit}
                  placeholder="e.g., 1"
                  tooltip="Resistance of the load connected to the output"
                  min="0"
                />
                <CalculatorInput
                  id="peakVoltage"
                  label="Peak DC Voltage (V_peak)"
                  value={peakVoltageStr}
                  onChange={setPeakVoltageStr}
                  unit={peakVoltageUnit}
                  unitOptions={voltageUnitOptions.filter(u => u !== 'kV')} // Limit peak voltage units for typical scenarios
                  onUnitChange={setPeakVoltageUnit}
                  placeholder="e.g., 12"
                  tooltip="Approximate peak DC voltage across the load (used to estimate current)"
                  min="0"
                />
            </>
         )}
       </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{error.includes("Warning") ? "Warning" : "Error"}</AlertTitle>
          <AlertDescription>{error.replace("Warning: ", "")}</AlertDescription>
        </Alert>
      )}

      {/* Result Display */}
      {(rippleVoltage !== null && !error) && (
        <div className="pt-4 mt-4 border-t">
          <h4 className="font-semibold mb-2">Estimated Ripple Voltage (V<sub>r(pp)</sub>):</h4>
          <p className="text-xl font-bold">{rippleDisplayValue} {rippleUnit}</p>
           {/* Show warning here too if ripple is high */}
            {error && error.includes("Warning") && (
                 <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Note: Approximation less accurate for high ripple.</p>
            )}
        </div>
      )}

      {/* Reset Button */}
      <Button variant="outline" onClick={handleReset} className="w-full md:w-auto mt-4">
        <RotateCcw className="mr-2 h-4 w-4" /> Reset
      </Button>
    </CalculatorCard>
  );
}
