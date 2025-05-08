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
  onTimeForInstantaneousVoltageChange: (newTime?: number) => void;
}

const waveformTypes: WaveformType[] = ['sine', 'square', 'triangle', 'sawtooth'];

const MIN_FREQUENCY_HZ = 0.01; // Allow very low frequencies for educational purposes
const MAX_FREQUENCY_HZ = 500_000;
const MIN_SAMPLING_RATE_HZ = 2; // Min 2 samples for any waveform
const MAX_SAMPLING_RATE_HZ = 10_000_000;
const MIN_TIME_WINDOW_MS = 0.001; // 1 µs
const MAX_TIME_WINDOW_MS = 1000;  // 1 s
const MIN_AMPLITUDE_V = 0.001; // Allow very small amplitudes
const MAX_AMPLITUDE_V = 400;
const MIN_DC_OFFSET_V = -400;
const MAX_DC_OFFSET_V = 400;


const initialParamsForReset: WaveformParams = {
  type: 'sine', amplitude: 12, frequency: 5000, phase: 0, dcOffset: 0,
  timeWindowMs: 0.4, 
  samplingRateHz: 100000, 
  timeForInstantaneousVoltageMs: undefined,
};

const getSmartStep = (min: number, max: number, value: number, isFine: boolean = false) => {
    const range = max - min;
    if (range <= 0) return isFine ? 0.001 : 0.1; // Finer base step for fine controls

    const relativeValue = value / max; // Position within the range

    if (isFine) {
      if (Math.abs(value) < 1) return 0.001;
      if (Math.abs(value) < 10) return 0.01;
      if (Math.abs(value) < 100) return 0.1;
      return 1;
    }

    // For frequency/sampling rate/time window (wider ranges)
    if (max <= 1) return 0.0001; // For time window in µs range (e.g. 0.001ms)
    if (max <= 10) return 0.001; 
    if (max <= 100) return 0.01;
    if (max <= 1000) return relativeValue < 0.1 ? 0.1 : 1;
    if (max <= 10000) return relativeValue < 0.1 ? 1 : 10;
    if (max <= 100000) return relativeValue < 0.1 ? 10 : 100;
    return relativeValue < 0.1 ? 100 : 1000; // Coarser steps for very high values
};


export default function WaveformControls({ params, onParamsChange, onSamplingRateChange, onTimeForInstantaneousVoltageChange }: WaveformControlsProps) {

  const handleReset = () => {
    onParamsChange(initialParamsForReset);
    onSamplingRateChange(initialParamsForReset.samplingRateHz);
    onTimeForInstantaneousVoltageChange(initialParamsForReset.timeForInstantaneousVoltageMs);
  };
  
  const handleFrequencyChange = (value: number | string) => {
    const numVal = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof value === 'string' && value.trim() === '') {
        onParamsChange({ frequency: 0 }); // Treat empty as 0 temporarily for input, validation handles actual 0
        return;
    }
    if (isNaN(numVal)) return;

    const newFreq = Math.max(MIN_FREQUENCY_HZ, Math.min(numVal, MAX_FREQUENCY_HZ));
    onParamsChange({ frequency: newFreq });
    
    const suggestedSamplingRate = Math.min(MAX_SAMPLING_RATE_HZ, Math.max(MIN_SAMPLING_RATE_HZ, newFreq * 20)); 
    onSamplingRateChange(suggestedSamplingRate);
  };

  const renderSliderWithInput = (
    id: keyof WaveformParams | 'samplingRateHz' | 'timeForInstantaneousVoltageMs',
    label: string,
    min: number,
    max: number,
    defaultSliderStep: number, // For direct input
    inputStep: number,
    unit: string,
    tooltipText: string,
    isLogScale?: boolean, // For slider visual scaling, actual step determined by getSmartStep
    isFrequencyControl?: boolean,
    unitOptionsList?: TimeUnit[]
  ) => {
    const currentValue = id === 'samplingRateHz' ? params.samplingRateHz :
                         id === 'timeForInstantaneousVoltageMs' ? (params.timeForInstantaneousVoltageMs ?? '') :
                         params[id as keyof WaveformParams] as number | string; // Allow string for controlled input
    
    // Determine smart step for slider based on current value and range for more intuitive control
    const sliderStep = getSmartStep(min, max, typeof currentValue === 'number' ? currentValue : (min + max) / 2, id === 'amplitude' || id === 'dcOffset' || id === 'phase' || id === 'timeWindowMs' || id === 'timeForInstantaneousVoltageMs');


    const handleChange = (val: number | string) => {
        const isTimeForVInst = id === 'timeForInstantaneousVoltageMs';
        if (typeof val === 'string' && val.trim() === '') {
            if (isTimeForVInst) onTimeForInstantaneousVoltageChange(undefined);
            else if (id === 'frequency') handleFrequencyChange(0); // Allow temporary 0 for frequency
            else if (id !== 'samplingRateHz') onParamsChange({ [id]: '' } as Partial<WaveformParams>); // Allow clearing other fields
            return;
        }

        const numVal = typeof val === 'string' ? parseFloat(val) : val;
        if (isNaN(numVal)) return;

        const boundedVal = Math.max(min, Math.min(numVal, max));

        if (isFrequencyControl) {
            handleFrequencyChange(boundedVal);
        } else if (id === 'samplingRateHz') {
            onSamplingRateChange(boundedVal);
        } else if (isTimeForVInst) {
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
                    value={currentValue === '' && id !== 'timeForInstantaneousVoltageMs' ? '' : (currentValue ?? '')} // Handle null/undefined for timeForV
                    onChange={(e) => handleChange(e.target.value)}
                    className="h-7 w-24 text-xs px-1 py-0.5"
                    min={min} // HTML5 min
                    max={max} // HTML5 max
                    step={inputStep}
                />
                {unitOptionsList && id === 'timeForInstantaneousVoltageMs' ? (
                     <Select 
                        value={unit}
                        onValueChange={(newUnit) => {
                            // Unit selection for 't' could be added here if display needs to change
                            console.log("Unit change for t:", newUnit);
                         }}
                         disabled // For now, input 't' is always in ms
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
        {id !== 'timeForInstantaneousVoltageMs' && ( // No slider for 't' input for now
            <Slider
                id={id}
                min={min}
                max={max}
                step={sliderStep} 
                value={[typeof currentValue === 'number' && isFinite(currentValue) ? currentValue : min]} // Ensure value is valid number for slider
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

      {renderSliderWithInput('amplitude', 'Amplitude', MIN_AMPLITUDE_V, MAX_AMPLITUDE_V, 0.1, 0.001, 'V', `Peak voltage deviation from DC offset (${MIN_AMPLITUDE_V}V to ${MAX_AMPLITUDE_V}V).`, false, false)}
      {renderSliderWithInput('frequency', 'Frequency', MIN_FREQUENCY_HZ, MAX_FREQUENCY_HZ, 1, 0.01, 'Hz', `Signal frequency (${formatResultValue(MIN_FREQUENCY_HZ, 'frequency').displayValue}${formatResultValue(MIN_FREQUENCY_HZ, 'frequency').unit} to ${formatResultValue(MAX_FREQUENCY_HZ, 'frequency').displayValue}${formatResultValue(MAX_FREQUENCY_HZ, 'frequency').unit}).`, true, true)}
      {renderSliderWithInput('phase', 'Phase Shift', -180, 180, 1, 0.1, '°', "Horizontal shift of the waveform in degrees.", false, false)}
      {renderSliderWithInput('dcOffset', 'DC Offset', MIN_DC_OFFSET_V, MAX_DC_OFFSET_V, 0.1, 0.001, 'V', `Vertical shift of the waveform (${MIN_DC_OFFSET_V}V to ${MAX_DC_OFFSET_V}V).`, false, false)}
      
      {renderSliderWithInput('timeWindowMs', 'Time Window', MIN_TIME_WINDOW_MS, MAX_TIME_WINDOW_MS, 0.001, 0.0001, 'ms', `Total time duration displayed on X-axis (${formatResultValue(MIN_TIME_WINDOW_MS / 1000, 'time').displayValue}${formatResultValue(MIN_TIME_WINDOW_MS / 1000, 'time').unit} to ${formatResultValue(MAX_TIME_WINDOW_MS / 1000, 'time').displayValue}${formatResultValue(MAX_TIME_WINDOW_MS / 1000, 'time').unit}).`, true, false)}
      
      {renderSliderWithInput('samplingRateHz', 'Sampling Rate', MIN_SAMPLING_RATE_HZ, MAX_SAMPLING_RATE_HZ, 100, 1, 'Hz', `Data points per second (Min ${formatResultValue(MIN_SAMPLING_RATE_HZ, 'frequency').displayValue}${formatResultValue(MIN_SAMPLING_RATE_HZ, 'frequency').unit}. Recommended >= 20x Frequency). Max ${formatResultValue(MAX_SAMPLING_RATE_HZ, 'frequency').displayValue}${formatResultValue(MAX_SAMPLING_RATE_HZ, 'frequency').unit}.`, true, false)}

       {renderSliderWithInput('timeForInstantaneousVoltageMs', 'Calc v(t) at time', 0, params.timeWindowMs, 0.001, 0.0001, 'ms', `Time 't' to calculate v(t). Must be within current Time Window. Input as milliseconds.`, false, false, timeUnitOptions.filter(u => u ==='ms' || u === 'µs' || u === 'ns') as TimeUnit[])}


       <div className="sm:col-span-2 lg:col-span-3 flex justify-end mt-2">
            <Button variant="outline" size="sm" onClick={handleReset} className="text-xs">
                <RotateCcw size={14} className="mr-1.5" />
                Reset Controls
            </Button>
        </div>
    </div>
  );
}
