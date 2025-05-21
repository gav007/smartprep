// src/components/calculators/ACVoltageCalculator.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Waves, RotateCcw } from 'lucide-react'; // Using Waves icon
import CalculatorCard from './CalculatorCard';
import CalculatorInput from './CalculatorInput';
import type { Unit } from '@/lib/units';
import {
    frequencyUnitOptions,
    timeUnitOptions,
    angleUnitOptions,
    unitMultipliers,
    defaultUnits,
    formatResultValue
} from '@/lib/units';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from '@/components/ui/label';

type VoltageType = 'peak' | 'rms';

const initialVoltageType: VoltageType = 'peak';
const initialFrequencyUnit: Unit = defaultUnits.frequency;
const initialTimeUnit: Unit = defaultUnits.time;
const initialPhaseUnit: Unit = defaultUnits.angle;

export default function ACVoltageCalculator() {
  const [voltageStr, setVoltageStr] = useState<string>('');
  const [voltageType, setVoltageType] = useState<VoltageType>(initialVoltageType);
  const [frequencyStr, setFrequencyStr] = useState<string>('');
  const [frequencyUnit, setFrequencyUnit] = useState<Unit>(initialFrequencyUnit);
  const [timeStr, setTimeStr] = useState<string>('');
  const [timeUnit, setTimeUnit] = useState<Unit>(initialTimeUnit);
  const [phaseStr, setPhaseStr] = useState<string>('0'); // Default phase 0
  const [phaseUnit, setPhaseUnit] = useState<Unit>(initialPhaseUnit);
  const [error, setError] = useState<string | null>(null);

  const instantaneousVoltage = useMemo(() => {
    setError(null);
    const voltageInput = parseFloat(voltageStr);
    const frequency = parseFloat(frequencyStr) * unitMultipliers[frequencyUnit];
    const time = parseFloat(timeStr) * unitMultipliers[timeUnit];
    const phaseInput = parseFloat(phaseStr);

    if (isNaN(voltageInput) || isNaN(frequency) || isNaN(time) || isNaN(phaseInput)) {
      if (voltageStr || frequencyStr || timeStr || phaseStr !== '0') {
        // Show error only if some input has been entered beyond the default phase
         setError('Enter valid numbers for Voltage, Frequency, and Time.');
      }
      return null;
    }
    if (frequency <= 0) {
      setError('Frequency must be a positive value.');
      return null;
    }
    if (voltageInput < 0 && voltageType === 'rms') {
      setError('RMS voltage cannot be negative.');
      return null;
    }

    const peakVoltage = voltageType === 'peak' ? voltageInput : voltageInput * Math.sqrt(2);
    const angularFrequency = 2 * Math.PI * frequency;
    const phaseRad = phaseUnit === 'degrees' ? phaseInput * (Math.PI / 180) : phaseInput;

    return peakVoltage * Math.sin(angularFrequency * time + phaseRad);
  }, [voltageStr, voltageType, frequencyStr, frequencyUnit, timeStr, timeUnit, phaseStr, phaseUnit]);

  const handleReset = () => {
    setVoltageStr('');
    setVoltageType(initialVoltageType);
    setFrequencyStr('');
    setFrequencyUnit(initialFrequencyUnit);
    setTimeStr('');
    setTimeUnit(initialTimeUnit);
    setPhaseStr('0');
    setPhaseUnit(initialPhaseUnit);
    setError(null);
  };

  const { displayValue: voltageDisplay, unit: voltageDisplayUnit } = formatResultValue(instantaneousVoltage, 'voltage');

  return (
    <CalculatorCard
      title="AC Instantaneous Voltage"
      description="Calculate v(t) = V_peak * sin(ωt + φ)"
      icon={Waves}
    >
      <div className="space-y-3">
         {/* Voltage Input with Type Selector */}
         <div className="grid grid-cols-3 items-end gap-2">
            <Label htmlFor="voltage" className="col-span-1 pt-2">Voltage</Label>
             <div className="col-span-2">
                <CalculatorInput
                id="voltage"
                label="" // Label handled externally
                value={voltageStr}
                onChange={setVoltageStr}
                placeholder="Enter Voltage"
                tooltip="Voltage magnitude (Peak or RMS)"
                />
</div>
             <div className="col-span-1">
                 <Select value={voltageType} onValueChange={(v) => setVoltageType(v as VoltageType)}>
                    <SelectTrigger className="w-full md:w-[100px]">
                    <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="peak">V<sub>peak</sub></SelectItem>
                    <SelectItem value="rms">V<sub>RMS</sub></SelectItem>
                    </SelectContent>
                </Select>
             </div>
         </div>

        <CalculatorInput
          id="frequency"
          label="Frequency (f)"
          value={frequencyStr}
          onChange={setFrequencyStr}
          unit={frequencyUnit}
          unitOptions={frequencyUnitOptions}
          onUnitChange={setFrequencyUnit}
          placeholder="Enter Frequency"
          tooltip="Frequency of the AC signal"
          min="0"
        />
        <CalculatorInput
          id="time"
          label="Time (t)"
          value={timeStr}
          onChange={setTimeStr}
          unit={timeUnit}
          unitOptions={timeUnitOptions}
          onUnitChange={setTimeUnit}
          placeholder="Enter Time"
          tooltip="Specific time point for calculation"
        />
        <CalculatorInput
          id="phase"
          label="Phase Angle (φ)"
          value={phaseStr}
          onChange={setPhaseStr}
          unit={phaseUnit}
          unitOptions={angleUnitOptions}
          onUnitChange={setPhaseUnit}
          placeholder="Enter Phase Angle"
          tooltip="Phase shift of the waveform"
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
      {(instantaneousVoltage !== null && !error) && (
        <div className="pt-4 mt-4 border-t">
          <h4 className="font-semibold mb-2">Instantaneous Voltage v(t):</h4>
          <p className="text-xl font-bold">{voltageDisplay} {voltageDisplayUnit}</p>
        </div>
      )}

      {/* Reset Button */}
      <Button variant="outline" onClick={handleReset} className="w-full md:w-auto mt-4">
        <RotateCcw className="mr-2 h-4 w-4" /> Reset
      </Button>
    </CalculatorCard>
  );
}
