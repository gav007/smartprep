// src/components/waveform/WaveformControls.tsx
'use client';

import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import type { WaveformType, WaveformParams } from '@/types/waveform';
import { RotateCcw, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatResultValue, timeUnitOptions, unitMultipliers } from '@/lib/units';
import type { TimeUnit, Unit } from '@/lib/units';
import { cn } from '@/lib/utils';

interface WaveformControlsProps {
  params: WaveformParams;
  onParamsChange: (newParams: Partial<WaveformParams>) => void;
  onSamplingRateChange: (newRate: number) => void;
  onTimeForInstantaneousVoltageChange: (newTimeMs?: number) => void;
  onTimeForInstantaneousVoltageUnitChange: (newUnit: TimeUnit) => void;
}

const waveformTypes: WaveformType[] = ['sine', 'square', 'triangle', 'sawtooth'];

const MIN_FREQUENCY_HZ = 0.1; 
const MAX_FREQUENCY_HZ = 500_000;
const MIN_SAMPLING_RATE_HZ = 2; 
const MAX_SAMPLING_RATE_HZ = 10_000_000;
const MIN_TIME_WINDOW_MS = 0.001; 
const MAX_TIME_WINDOW_MS = 1000;  
const MIN_AMPLITUDE_V = 0.001; 
const MAX_AMPLITUDE_V = 400; // Increased max amplitude
const MIN_DC_OFFSET_V = -MAX_AMPLITUDE_V; // Symmetrical DC offset
const MAX_DC_OFFSET_V = MAX_AMPLITUDE_V;


const initialParamsForReset: WaveformParams = {
  type: 'sine', amplitude: 12, frequency: 5000, phase: 0, dcOffset: 0,
  timeWindowMs: 0.4, 
  samplingRateHz: 100000, 
  timeForInstantaneousVoltageMs: undefined,
  timeForInstantaneousVoltageUnit: 'ms', // Default unit for 't'
};

const getSmartStep = (min: number, max: number, value: number, isFine: boolean = false) => {
    const range = max - min;
    if (range <= 0) return isFine ? 0.001 : 0.1; 

    const relativeValue = Math.abs(value / max); // Use absolute for relative comparison

    if (isFine) { // For Amplitude, DC Offset, Phase
      if (Math.abs(value) < 1) return 0.001;
      if (Math.abs(value) < 10) return 0.01;
      if (Math.abs(value) < 100) return 0.1;
      return 1;
    }

    // For Frequency, Sampling Rate, Time Window (wider ranges, potentially log-like behavior needed for slider)
    if (max <= 1) return 0.00001; // e.g. 10ns for 1µs window
    if (max <= 10) return 0.0001; 
    if (max <= 100) return 0.001; 
    if (max <= 1000) return relativeValue < 0.01 ? 0.01 : (relativeValue < 0.1 ? 0.1 : 1);
    if (max <= 10000) return relativeValue < 0.01 ? 0.1 : (relativeValue < 0.1 ? 1 : 10);
    if (max <= 100000) return relativeValue < 0.01 ? 1 : (relativeValue < 0.1 ? 10 : 100);
    return relativeValue < 0.01 ? 10 : (relativeValue < 0.1 ? 100 : 1000); 
};


export default function WaveformControls({ 
    params, 
    onParamsChange, 
    onSamplingRateChange, 
    onTimeForInstantaneousVoltageChange,
    onTimeForInstantaneousVoltageUnitChange
}: WaveformControlsProps) {

  // Local state for direct input value of t for v(t), to allow typing before conversion
  const [timeForVInstInputStr, setTimeForVInstInputStr] = useState<string>(
    params.timeForInstantaneousVoltageMs !== undefined ? (params.timeForInstantaneousVoltageMs / unitMultipliers[params.timeForInstantaneousVoltageUnit || 'ms'] * 1000).toString() : ''
  );
  
  // Sync local input string when params.timeForInstantaneousVoltageMs changes from outside
  React.useEffect(() => {
    if (params.timeForInstantaneousVoltageMs === undefined) {
      setTimeForVInstInputStr('');
    } else {
      // Convert ms from params back to the selected unit for display in input
      const displayVal = params.timeForInstantaneousVoltageMs / (unitMultipliers[params.timeForInstantaneousVoltageUnit || 'ms'] / unitMultipliers['ms']);
      setTimeForVInstInputStr(displayVal.toString());
    }
  }, [params.timeForInstantaneousVoltageMs, params.timeForInstantaneousVoltageUnit]);


  const handleReset = () => {
    onParamsChange(initialParamsForReset);
    onSamplingRateChange(initialParamsForReset.samplingRateHz);
    onTimeForInstantaneousVoltageChange(initialParamsForReset.timeForInstantaneousVoltageMs);
    onTimeForInstantaneousVoltageUnitChange(initialParamsForReset.timeForInstantaneousVoltageUnit || 'ms');
    setTimeForVInstInputStr('');
  };
  
  const handleFrequencyChange = (value: number | string) => {
    const numVal = typeof value === 'string' ? parseFloat(value) : value;
     if (typeof value === 'string' && value.trim() === '') {
        onParamsChange({ frequency: MIN_FREQUENCY_HZ }); // Default to min if cleared, or handle as error
        onSamplingRateChange(MIN_FREQUENCY_HZ * 20);
        return;
    }
    if (isNaN(numVal) || numVal < 0) return; // Allow 0 for DC, validation is in WaveformGenerator

    const newFreq = Math.min(numVal, MAX_FREQUENCY_HZ); // Apply max bound here
    onParamsChange({ frequency: newFreq });
    
    // Adjust sampling rate only if newFreq is valid and above MIN_FREQUENCY_HZ
    if (newFreq >= MIN_FREQUENCY_HZ) {
        const suggestedSamplingRate = Math.min(MAX_SAMPLING_RATE_HZ, Math.max(MIN_SAMPLING_RATE_HZ, newFreq * 20)); 
        onSamplingRateChange(suggestedSamplingRate);
    }
  };

  const handleTimeForVInstInputChange = (valueStr: string) => {
    setTimeForVInstInputStr(valueStr);
    if (valueStr.trim() === '') {
      onTimeForInstantaneousVoltageChange(undefined);
      return;
    }
    const numVal = parseFloat(valueStr);
    if (!isNaN(numVal)) {
      const timeInSelectedUnit = numVal;
      const timeInMs = timeInSelectedUnit * (unitMultipliers[params.timeForInstantaneousVoltageUnit || 'ms'] / unitMultipliers['ms']);
      onTimeForInstantaneousVoltageChange(timeInMs);
    } else {
      onTimeForInstantaneousVoltageChange(undefined); // Invalid input
    }
  };

  const handleTimeForVInstUnitChange = (newUnit: Unit) => {
    onTimeForInstantaneousVoltageUnitChange(newUnit as TimeUnit);
    // Re-evaluate current input string with new unit
    const numVal = parseFloat(timeForVInstInputStr);
    if (!isNaN(numVal)) {
      const timeInNewUnit = numVal;
      const timeInMs = timeInNewUnit * (unitMultipliers[newUnit] / unitMultipliers['ms']);
      onTimeForInstantaneousVoltageChange(timeInMs);
    }
  };

  const renderSliderWithInput = (
    id: keyof WaveformParams | 'samplingRateHz',
    label: string,
    min: number,
    max: number,
    defaultSliderStep: number, 
    inputStep: number,
    unit: string,
    tooltipText: string,
    isLogScale?: boolean, 
    isFrequencyControl?: boolean,
  ) => {
    const currentValue = id === 'samplingRateHz' ? params.samplingRateHz : params[id as keyof WaveformParams] as number | string;
    const sliderStep = getSmartStep(min, max, typeof currentValue === 'number' ? currentValue : (min + max) / 2, id === 'amplitude' || id === 'dcOffset' || id === 'phase' || id === 'timeWindowMs');

    const handleChange = (val: number | string) => {
        if (typeof val === 'string' && val.trim() === '') {
            // Allow clearing fields, handle default/min in validation or WaveformGenerator
            if (id === 'frequency') { 
                onParamsChange({ [id]: MIN_FREQUENCY_HZ }); // Reset to min if cleared to avoid issues
                onSamplingRateChange(MIN_FREQUENCY_HZ); // Also reset sampling rate
            } else if (id !== 'samplingRateHz') {
                onParamsChange({ [id]: min } as Partial<WaveformParams>); // Default to min if cleared
            }
            return;
        }

        const numVal = typeof val === 'string' ? parseFloat(val) : val;
        if (isNaN(numVal)) return; // Do nothing for NaN

        // Apply bounds AFTER input, not strictly during typing if it prevents user flow
        const boundedVal = Math.max(min, Math.min(numVal, max));

        if (isFrequencyControl) {
            handleFrequencyChange(boundedVal);
        } else if (id === 'samplingRateHz') {
            onSamplingRateChange(boundedVal);
        } else {
            onParamsChange({ [id]: boundedVal } as Partial<WaveformParams>);
        }
    };

    return (
        <div className="space-y-2">
        <div className="flex justify-between items-center">
            <Label htmlFor={id} className="text-xs flex items-center">
            {label}
            <TooltipProvider delayDuration={100}>
                <Tooltip>
                <TooltipTrigger asChild>
                    <button type="button" aria-label={`Info for ${label}`} className="ml-1 text-muted-foreground hover:text-foreground cursor-help"><HelpCircle size={12} /></button>
                </TooltipTrigger>
                <TooltipContent><p>{tooltipText}</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
            </Label>
            <div className="flex items-center gap-1">
                 <Input
                    id={`${id}-input`}
                    type="number"
                    value={currentValue === '' ? '' : (currentValue ?? '')}
                    onChange={(e) => handleChange(e.target.value)}
                    className="h-7 w-24 text-xs px-1 py-0.5"
                    // min={min} // Avoid strict HTML5 min/max if they interfere with typing flow
                    // max={max}
                    step={inputStep}
                />
                <span className="text-xs text-muted-foreground min-w-[30px] text-right">{unit}</span>
            </div>
        </div>
         <Slider
            id={id}
            min={min}
            max={max}
            step={sliderStep} 
            value={[typeof currentValue === 'number' && isFinite(currentValue) ? currentValue : min]} 
            onValueChange={(value) => {
                handleChange(value[0]);
            }}
            className="my-1"
          />
        </div>
    );
    };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 p-4 border rounded-lg bg-muted/50">
      <div className="space-y-1">
        <Label htmlFor="waveform-type" className="text-xs">Waveform Type</Label>
        <Select
          value={params.type}
          onValueChange={(value) => onParamsChange({ type: value as WaveformType })}
        >
          <SelectTrigger id="waveform-type" className="h-9 text-xs">
            <SelectValue placeholder="Select Type" />
          </SelectTrigger>
          <SelectContent>
            {waveformTypes.map(type => (
              <SelectItem key={type} value={type} className="text-xs">
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {renderSliderWithInput('amplitude', 'Amplitude', MIN_AMPLITUDE_V, MAX_AMPLITUDE_V, 0.1, 0.001, 'V', `Peak voltage deviation from DC offset (${MIN_AMPLITUDE_V}V to ${MAX_AMPLITUDE_V}V).`)}
      {renderSliderWithInput('frequency', 'Frequency', MIN_FREQUENCY_HZ, MAX_FREQUENCY_HZ, 1, 0.01, 'Hz', `Signal frequency (${formatResultValue(MIN_FREQUENCY_HZ, 'frequency').displayValue}${formatResultValue(MIN_FREQUENCY_HZ, 'frequency').unit} to ${formatResultValue(MAX_FREQUENCY_HZ, 'frequency').displayValue}${formatResultValue(MAX_FREQUENCY_HZ, 'frequency').unit}). Allows 0 for DC.`, true, true)}
      {renderSliderWithInput('phase', 'Phase Shift', -180, 180, 1, 0.1, '°', "Horizontal shift of the waveform in degrees.")}
      {renderSliderWithInput('dcOffset', 'DC Offset', MIN_DC_OFFSET_V, MAX_DC_OFFSET_V, 0.1, 0.001, 'V', `Vertical shift of the waveform (${MIN_DC_OFFSET_V}V to ${MAX_DC_OFFSET_V}V).`)}
      
      {renderSliderWithInput('timeWindowMs', 'Time Window', MIN_TIME_WINDOW_MS, MAX_TIME_WINDOW_MS, 0.001, 0.0001, 'ms', `Total time duration displayed on X-axis (${formatResultValue(MIN_TIME_WINDOW_MS / 1000, 'time').displayValue}${formatResultValue(MIN_TIME_WINDOW_MS / 1000, 'time').unit} to ${formatResultValue(MAX_TIME_WINDOW_MS / 1000, 'time').displayValue}${formatResultValue(MAX_TIME_WINDOW_MS / 1000, 'time').unit}).`, true)}
      
      {renderSliderWithInput('samplingRateHz', 'Sampling Rate', MIN_SAMPLING_RATE_HZ, MAX_SAMPLING_RATE_HZ, 100, 1, 'Hz', `Data points per second (Min ${formatResultValue(MIN_SAMPLING_RATE_HZ, 'frequency').displayValue}${formatResultValue(MIN_SAMPLING_RATE_HZ, 'frequency').unit}. Recommended >= 20x Frequency). Max ${formatResultValue(MAX_SAMPLING_RATE_HZ, 'frequency').displayValue}${formatResultValue(MAX_SAMPLING_RATE_HZ, 'frequency').unit}.`, true)}

       {/* Calc v(t) at time - Input with Unit Selector */}
       <div className="space-y-2">
        <div className="flex justify-between items-center">
            <Label htmlFor="timeForVInst" className="text-xs flex items-center">
            Calc v(t) at time
            <TooltipProvider delayDuration={100}>
                <Tooltip>
                <TooltipTrigger asChild>
                    <button type="button" aria-label="Info for Calc v(t) at time" className="ml-1 text-muted-foreground hover:text-foreground cursor-help"><HelpCircle size={12} /></button>
                </TooltipTrigger>
                <TooltipContent><p>Time 't' to calculate instantaneous voltage v(t). Must be within current Time Window.</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
            </Label>
            <div className="flex items-center gap-1">
                 <Input
                    id="timeForVInst-input"
                    type="number"
                    value={timeForVInstInputStr}
                    onChange={(e) => handleTimeForVInstInputChange(e.target.value)}
                    className="h-7 w-24 text-xs px-1 py-0.5"
                    min={0}
                    max={params.timeWindowMs * (unitMultipliers['ms'] / (unitMultipliers[params.timeForInstantaneousVoltageUnit || 'ms']))} // Max in selected unit
                    step={getSmartStep(0, params.timeWindowMs, parseFloat(timeForVInstInputStr || '0'), true)}
                />
                <Select 
                    value={params.timeForInstantaneousVoltageUnit || 'ms'}
                    onValueChange={(newUnit) => handleTimeForVInstUnitChange(newUnit as TimeUnit)}
                >
                    <SelectTrigger className="h-7 w-[60px] text-xs px-1">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {timeUnitOptions.map(u => <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>
         {/* No slider for 't' input for now, direct input is better for specific time points */}
       </div>


       <div className="sm:col-span-2 lg:col-span-3 flex justify-end mt-2">
            <Button variant="outline" size="sm" onClick={handleReset} className="text-xs">
                <RotateCcw size={14} className="mr-1.5" />
                Reset Controls
            </Button>
        </div>
    </div>
  );
}

