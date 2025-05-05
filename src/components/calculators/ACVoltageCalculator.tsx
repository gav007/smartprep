
'use client';

import React, { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, RotateCcw } from 'lucide-react';

type VoltageType = 'peak' | 'rms';
type AngleUnit = 'degrees' | 'radians';
type TimeUnit = 's' | 'ms' | 'µs';
type FrequencyUnit = 'Hz' | 'kHz' | 'MHz';
type VoltageResultUnit = 'V' | 'mV' | 'kV';

const freqUnitMultipliers: Record<FrequencyUnit, number> = { 'Hz': 1, 'kHz': 1e3, 'MHz': 1e6 };
const timeUnitMultipliers: Record<TimeUnit, number> = { 's': 1, 'ms': 1e-3, 'µs': 1e-6 };

const formatVoltageResult = (value: number | null): string => {
  if (value === null || !isFinite(value)) return 'N/A';

  let unit: VoltageResultUnit = 'V';
  let displayValue = value;

  if (Math.abs(value) >= 1000) { displayValue = value / 1000; unit = 'kV'; }
  else if (Math.abs(value) < 1 && Math.abs(value) !== 0) { displayValue = value * 1000; unit = 'mV'; }

  const precision = Math.abs(displayValue) < 10 ? 3 : 2;
   // Ensure -0 shows as 0
  if (Object.is(displayValue, -0)) displayValue = 0;
  return `${displayValue.toFixed(precision).replace(/\.?0+$/, '')} ${unit}`;
};

export default function ACVoltageCalculator() {
  const [voltageStr, setVoltageStr] = useState<string>('');
  const [voltageType, setVoltageType] = useState<VoltageType>('peak');
  const [frequencyStr, setFrequencyStr] = useState<string>('');
  const [frequencyUnit, setFrequencyUnit] = useState<FrequencyUnit>('Hz');
  const [timeStr, setTimeStr] = useState<string>('');
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('ms');
  const [phaseStr, setPhaseStr] = useState<string>('0');
  const [phaseUnit, setPhaseUnit] = useState<AngleUnit>('degrees');

  const [error, setError] = useState<string | null>(null);

  const instantaneousVoltage = useMemo(() => {
    setError(null);
    const voltageInput = parseFloat(voltageStr);
    const frequency = parseFloat(frequencyStr) * freqUnitMultipliers[frequencyUnit];
    const time = parseFloat(timeStr) * timeUnitMultipliers[timeUnit];
    const phaseInput = parseFloat(phaseStr);

    if (isNaN(voltageInput) || isNaN(frequency) || isNaN(time) || isNaN(phaseInput)) {
      if (voltageStr || frequencyStr || timeStr || phaseStr !== '0') {
        // Only show error if some input has been entered
         // setError('Please enter valid numbers for all fields.'); // Hide error on initial load
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
    setVoltageType('peak');
    setFrequencyStr('');
    setFrequencyUnit('Hz');
    setTimeStr('');
    setTimeUnit('ms');
    setPhaseStr('0');
    setPhaseUnit('degrees');
    setError(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AC Instantaneous Voltage</CardTitle>
        <CardDescription>Calculate v(t) = V<sub>peak</sub> * sin(ωt + φ)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voltage Input */}
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="voltage">Voltage</Label>
            <Input
              id="voltage"
              type="number"
              step="any"
              value={voltageStr}
              onChange={(e) => setVoltageStr(e.target.value)}
              placeholder="Enter Voltage"
            />
          </div>
          <Select value={voltageType} onValueChange={(v) => setVoltageType(v as VoltageType)}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="peak">V<sub>peak</sub></SelectItem>
              <SelectItem value="rms">V<sub>RMS</sub></SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Frequency Input */}
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="frequency">Frequency (f)</Label>
            <Input
              id="frequency"
              type="number"
              step="any"
               min="0" // Technically > 0
              value={frequencyStr}
              onChange={(e) => setFrequencyStr(e.target.value)}
              placeholder="Enter Frequency"
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

        {/* Time Input */}
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="time">Time (t)</Label>
            <Input
              id="time"
              type="number"
              step="any"
              value={timeStr}
              onChange={(e) => setTimeStr(e.target.value)}
              placeholder="Enter Time"
            />
          </div>
          <Select value={timeUnit} onValueChange={(v) => setTimeUnit(v as TimeUnit)}>
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
               {Object.keys(timeUnitMultipliers).map(u => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Phase Input */}
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="phase">Phase Angle (φ)</Label>
            <Input
              id="phase"
              type="number"
              step="any"
              value={phaseStr}
              onChange={(e) => setPhaseStr(e.target.value)}
              placeholder="Enter Phase Angle"
            />
          </div>
          <Select value={phaseUnit} onValueChange={(v) => setPhaseUnit(v as AngleUnit)}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="degrees">Degrees (°)</SelectItem>
              <SelectItem value="radians">Radians (rad)</SelectItem>
            </SelectContent>
          </Select>
        </div>


        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle size={16} /> {error}
          </p>
        )}

        {(instantaneousVoltage !== null && !error) && (
           <div className="pt-4 mt-4 border-t">
             <h4 className="font-semibold mb-2">Instantaneous Voltage v(t):</h4>
             <p className="text-xl font-bold">{formatVoltageResult(instantaneousVoltage)}</p>
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
