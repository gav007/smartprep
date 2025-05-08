// src/components/waveform/WaveformControls.tsx
'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import type { WaveformType, WaveformParams } from '@/types/waveform';
import { RotateCcw, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatResultValue, timeUnitOptions } from '@/lib/units';
import type { TimeUnit } from '@/lib/units';

interface WaveformControlsProps {
  params: WaveformParams;
  onParamsChange: (newParams: Partial<WaveformParams>) => void;
  onSamplingRateChange: (newRate: number) => void;
  onTimeForInstantaneousVoltageChange: (newTime?: number) => void; // New handler
}

const waveformTypes: WaveformType[] = ['sine', 'square', 'triangle', 'sawtooth'];

const MIN_FREQUENCY_HZ = 1;
const MAX_FREQUENCY_HZ = 500_000; // Adjusted to 500 kHz as per prompt
const MIN_SAMPLING_RATE_HZ = 100;
const MAX_SAMPLING_RATE_HZ = 10_000_000; // 10 MHz
const MIN_TIME_WINDOW_MS = 0.001; // 1 µs
const MAX_TIME_WINDOW_MS = 1000;  // 1 s

const initialParamsForReset: WaveformParams = {
  type: 'sine', amplitude: 12, frequency: 5000, phase: 0, dcOffset: 0,
  timeWindowMs: 0.2, // 0.2ms to show a few cycles of 5kHz (T=0.2ms, so 1 cycle)
  samplingRateHz: 100000, // 20x 5kHz
  timeForInstantaneousVoltageMs: undefined, // Optional, example: 23.23 / 1000 for µs -> ms
};

// Helper to get appropriate step for a wide range slider (logarithmic-like behavior)
const getSmartStep = (min: number, max: number, value: number, isFine: boolean = false) => {
    const range = max - min;
    if (range <= 0) return isFine ? 0.01 : 1;

    if (isFine) { // Finer steps for parameters like amplitude, phase, DC offset
      if (value < 10) return 0.01;
      if (value < 100) return 0.1;
      return 1;
    }

    // For frequency/sampling rate/time window
    if (value < 0.1) return 0.001; // For time window in µs range
    if (value < 1) return 0.01;   // For time window in sub-ms range
    if (value < 100) return value < 10 ? 0.1 : 1;
    if (value < 1000) return 10;
    if (value < 10000) return 100;
    if (value < 100000) return 1000;
    return 10000; // Coarser steps for very high values
};


export default function WaveformControls({ params, onParamsChange, onSamplingRateChange, onTimeForInstantaneousVoltageChange }: WaveformControlsProps) {

  const handleReset = () => {
    onParamsChange(initialParamsForReset);
    onSamplingRateChange(initialParamsForReset.samplingRateHz);
    onTimeForInstantaneousVoltageChange(initialParamsForReset.timeForInstantaneousVoltageMs);
  };
  
  const handleFrequencyChange = (value: number) => {
    const newFreq = Math.max(MIN_FREQUENCY_HZ, Math.min(value, MAX_FREQUENCY_HZ));
    onParamsChange({ frequency: newFreq });
    
    const suggestedSamplingRate = Math.min(MAX_SAMPLING_RATE_HZ, Math.max(MIN_SAMPLING_RATE_HZ, newFreq * 20)); 
    onSamplingRateChange(suggestedSamplingRate);
  };

  const renderSliderWithInput = (
    id: keyof Pick<WaveformParams, 'amplitude' | 'phase' | 'dcOffset' | 'timeWindowMs'> | 'samplingRateHz' | 'timeForInstantaneousVoltageMs',
    label: string,
    min: number,
    max: number,
    defaultStep: number, // For direct input
    unit: string,
    tooltipText: string,
    isLogScale?: boolean,
    isFrequencyControl?: boolean,
    unitOptionsList?: TimeUnit[] // Optional unit options for timeForInstantaneousVoltage
  ) => {
    const currentValue = id === 'samplingRateHz' ? params.samplingRateHz :
                         id === 'timeForInstantaneousVoltageMs' ? (params.timeForInstantaneousVoltageMs ?? '') : // Handle undefined
                         params[id as keyof WaveformParams] as number;
    
    const sliderStep = isLogScale ? getSmartStep(min, max, typeof currentValue === 'number' ? currentValue : 0) : defaultStep;
    const inputStep = (id === 'amplitude' || id === 'dcOffset' || id === 'timeWindowMs' || id === 'timeForInstantaneousVoltageMs') ? 0.001 : 1; // Allow finer input for time

    const handleChange = (val: number | string) => { // Allow string for input field empty state
        const numVal = typeof val === 'string' ? parseFloat(val) : val;

        if (typeof val === 'string' && val.trim() === '' && id === 'timeForInstantaneousVoltageMs') {
            onTimeForInstantaneousVoltageChange(undefined);
            return;
        }

        if (isNaN(numVal)) return; // Don't proceed if parsing fails

        const boundedVal = Math.max(min, Math.min(numVal, max));
        if (isFrequencyControl) {
            handleFrequencyChange(boundedVal);
        } else if (id === 'samplingRateHz') {
            onSamplingRateChange(boundedVal);
        } else if (id === 'timeForInstantaneousVoltageMs') {
            onTimeForInstantaneousVoltageChange(boundedVal);
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
                    value={currentValue}
                    onChange={(e) => handleChange(e.target.value)}
                    className="h-7 w-24 text-xs px-1 py-0.5"
                    min={min}
                    max={max}
                    step={inputStep}
                />
                {unitOptionsList && id === 'timeForInstantaneousVoltageMs' ? (
                     <Select 
                        value={unit} // Assuming unit state is managed elsewhere or passed for this specific input
                        onValueChange={(newUnit) => {
                            // This would require more complex state if unit for timeForInstantaneousVoltage needs to be selectable
                            // For now, let's assume 'ms' for input, display logic can handle conversions
                            console.log("Unit change for t:", newUnit);
                         }}
                         disabled // Keep it simple: input in ms, display handles conversion
                     >
                        <SelectTrigger className="h-7 w-[60px] text-xs px-1">
                            <SelectValue defaultValue="ms" />
                        </SelectTrigger>
                        <SelectContent>
                            {unitOptionsList.map(u => <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>)}
                        </SelectContent>
                    </Select>
                ) : (
                     <span className="text-xs text-muted-foreground min-w-[30px] text-right">{unit}</span>
                )}
            </div>
        </div>
        {id !== 'timeForInstantaneousVoltageMs' && ( // No slider for 't' input
            <Slider
                id={id}
                min={min}
                max={max}
                step={sliderStep} 
                value={[typeof currentValue === 'number' ? currentValue : 0]} // Ensure value is number
                onValueChange={(value) => {
                    handleChange(value[0]);
                }}
                className="my-1"
            />
        )}
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

      {renderSliderWithInput('amplitude', 'Amplitude', 0.1, 20, 0.1, 'V', "Peak voltage deviation from DC offset.", false, false)}
      {renderSliderWithInput('frequency', 'Frequency', MIN_FREQUENCY_HZ, MAX_FREQUENCY_HZ, 1, 'Hz', `Signal frequency (1Hz to ${formatResultValue(MAX_FREQUENCY_HZ, 'frequency').displayValue}${formatResultValue(MAX_FREQUENCY_HZ, 'frequency').unit}).`, true, true)}
      {renderSliderWithInput('phase', 'Phase Shift', -180, 180, 1, '°', "Horizontal shift of the waveform in degrees.", false, false)}
      {renderSliderWithInput('dcOffset', 'DC Offset', -10, 10, 0.1, 'V', "Vertical shift of the entire waveform.", false, false)}
      
      {renderSliderWithInput('timeWindowMs', 'Time Window', MIN_TIME_WINDOW_MS, MAX_TIME_WINDOW_MS, 0.001, 'ms', `Total time duration displayed on X-axis (1µs to 1s).`, true, false)}
      
      {renderSliderWithInput('samplingRateHz', 'Sampling Rate', MIN_SAMPLING_RATE_HZ, MAX_SAMPLING_RATE_HZ, 100, 'Hz', `Data points per second (Min 2x Frequency recommended). Max ${formatResultValue(MAX_SAMPLING_RATE_HZ, 'frequency').displayValue}${formatResultValue(MAX_SAMPLING_RATE_HZ, 'frequency').unit}.`, true, false)}

      {/* New Input for time 't' for instantaneous voltage calculation */}
       {renderSliderWithInput('timeForInstantaneousVoltageMs', 'Calc v(t) at time', 0, params.timeWindowMs, 0.001, 'ms', "Time 't' (in ms) to calculate instantaneous voltage v(t). Must be within current Time Window.", false, false, timeUnitOptions.filter(u => u ==='ms' || u === 'µs') as TimeUnit[])}


       <div className="sm:col-span-2 lg:col-span-3 flex justify-end mt-2">
            <Button variant="outline" size="sm" onClick={handleReset} className="text-xs">
                <RotateCcw size={14} className="mr-1.5" />
                Reset Controls
            </Button>
        </div>
    </div>
  );
}
