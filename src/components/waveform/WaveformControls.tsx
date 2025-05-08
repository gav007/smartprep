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
import { formatResultValue } from '@/lib/units'; // Added import

interface WaveformControlsProps {
  params: WaveformParams;
  onParamsChange: (newParams: Partial<WaveformParams>) => void;
  onSamplingRateChange: (newRate: number) => void;
}

const waveformTypes: WaveformType[] = ['sine', 'square', 'triangle', 'sawtooth'];

const MIN_FREQUENCY_HZ = 1;
const MAX_FREQUENCY_HZ = 1_000_000; // 1 MHz
const MIN_SAMPLING_RATE_HZ = 100;
const MAX_SAMPLING_RATE_HZ = 10_000_000; // 10 MHz

const initialParamsForReset: WaveformParams = {
  type: 'sine', amplitude: 5, frequency: 1000, phase: 0, dcOffset: 0,
  cyclesToDisplay: 5, samplingRateHz: 20000,
};

// Helper to get appropriate step for a wide range slider (logarithmic-like behavior)
const getSmartStep = (min: number, max: number, value: number, isFine: boolean = false) => {
    const range = max - min;
    if (range <= 0) return 1;

    if (isFine) { // Finer steps for parameters like amplitude, phase, DC offset
      if (value < 10) return 0.01;
      if (value < 100) return 0.1;
      return 1;
    }

    // For frequency/sampling rate
    if (value < 100) return 1;
    if (value < 1000) return 10;
    if (value < 10000) return 100;
    if (value < 100000) return 1000;
    return 10000; // Coarser steps for very high values
};


export default function WaveformControls({ params, onParamsChange, onSamplingRateChange }: WaveformControlsProps) {

  const handleReset = () => {
    onParamsChange(initialParamsForReset); // This will update all params
    onSamplingRateChange(initialParamsForReset.samplingRateHz); // Explicitly set sampling rate via its handler
  };
  
  const handleFrequencyChange = (value: number) => {
    const newFreq = Math.max(MIN_FREQUENCY_HZ, Math.min(value, MAX_FREQUENCY_HZ));
    onParamsChange({ frequency: newFreq });
    
    // Suggest a new sampling rate based on the new frequency
    // Nyquist * 10 (or 20x frequency), capped by MAX_SAMPLING_RATE_HZ
    const suggestedSamplingRate = Math.min(MAX_SAMPLING_RATE_HZ, Math.max(MIN_SAMPLING_RATE_HZ, newFreq * 20)); 
    onSamplingRateChange(suggestedSamplingRate);
  };

  const renderSliderWithInput = (
    id: keyof WaveformParams | 'samplingRateHz', // Adjust type to include samplingRateHz directly
    label: string,
    min: number,
    max: number,
    defaultStep: number, // For direct input
    unit: string,
    tooltipText: string,
    isLogScale?: boolean, // Controls slider step behavior
    isFrequencyControl?: boolean
  ) => {
    // Adjust to handle 'samplingRateHz' which is not directly in WaveformParams but controlled via props
    const currentValue = id === 'samplingRateHz' ? params.samplingRateHz : params[id] as number;
    const sliderStep = isLogScale ? getSmartStep(min, max, currentValue) : defaultStep;
    const inputStep = (id === 'amplitude' || id === 'dcOffset') ? 0.01 : 1;

    const handleChange = (val: number) => {
        const boundedVal = Math.max(min, Math.min(val, max));
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
            <Input
            id={`${id}-input`}
            type="number"
            value={currentValue}
            onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                    handleChange(val);
                }
            }}
            className="h-7 w-24 text-xs px-1 py-0.5 ml-2"
            min={min}
            max={max}
            step={inputStep}
            />
            <span className="text-xs text-muted-foreground ml-1">{unit}</span>
        </div>
        <Slider
            id={id}
            min={min}
            max={max}
            step={sliderStep} 
            value={[currentValue]}
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

      {renderSliderWithInput('amplitude', 'Amplitude', 0.1, 20, 0.1, 'V', "Peak voltage deviation from DC offset.", false, false)}
      {renderSliderWithInput('frequency', 'Frequency', MIN_FREQUENCY_HZ, MAX_FREQUENCY_HZ, 1, 'Hz', `Number of cycles per second (1Hz to ${formatResultValue(MAX_FREQUENCY_HZ, 'frequency').displayValue}${formatResultValue(MAX_FREQUENCY_HZ, 'frequency').unit}).`, true, true)}
      {renderSliderWithInput('phase', 'Phase Shift', -180, 180, 1, '°', "Horizontal shift of the waveform in degrees.", false, false)}
      {renderSliderWithInput('dcOffset', 'DC Offset', -10, 10, 0.1, 'V', "Vertical shift of the entire waveform.", false, false)}
      
      {renderSliderWithInput('cyclesToDisplay', 'Cycles to Display', 1, 50, 1, '', "Number of waveform cycles to show in the time window.", false, false)}
      
      {renderSliderWithInput('samplingRateHz', 'Sampling Rate', MIN_SAMPLING_RATE_HZ, MAX_SAMPLING_RATE_HZ, 100, 'Hz', `Data points per second (Min 2x Frequency recommended). Max ${formatResultValue(MAX_SAMPLING_RATE_HZ, 'frequency').displayValue}${formatResultValue(MAX_SAMPLING_RATE_HZ, 'frequency').unit}.`, true, false)}

       <div className="sm:col-span-2 lg:col-span-3 flex justify-end mt-2">
            <Button variant="outline" size="sm" onClick={handleReset} className="text-xs">
                <RotateCcw size={14} className="mr-1.5" />
                Reset Controls
            </Button>
        </div>
    </div>
  );
}

