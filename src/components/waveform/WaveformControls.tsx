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

interface WaveformControlsProps {
  params: WaveformParams;
  onParamsChange: (newParams: Partial<WaveformParams>) => void;
  onSamplingRateChange: (newRate: number) => void; // Specific handler for sampling rate
}

const waveformTypes: WaveformType[] = ['sine', 'square', 'triangle', 'sawtooth'];

const initialParamsForReset: WaveformParams = {
  type: 'sine', amplitude: 5, frequency: 1000, phase: 0, dcOffset: 0,
  timeWindowMs: 1, samplingRateHz: 20000, // Default to 1ms window, 20kHz sampling for 1kHz signal
};

// Helper to get appropriate step for a wide range slider (logarithmic-like behavior)
const getSmartStep = (min: number, max: number, value: number) => {
    if (max / min > 10000) { // Very wide range
        if (value < min * 100) return Math.max(1, min); // Finer steps for smaller values
        if (value < max / 100) return Math.max(1, Math.floor(value / 100));
        return Math.max(1, Math.floor(max / 1000));
    }
    return Math.max(1, (max - min) / 200); // Default step for narrower ranges
};


export default function WaveformControls({ params, onParamsChange, onSamplingRateChange }: WaveformControlsProps) {

  const handleReset = () => {
    onParamsChange(initialParamsForReset);
    onSamplingRateChange(initialParamsForReset.samplingRateHz);
  };
  
  const handleFrequencyChange = (value: number) => {
    const newFreq = Math.max(1, value); // Ensure frequency is at least 1 Hz
    onParamsChange({ frequency: newFreq });
    // Suggest a new sampling rate (Nyquist * 10, or 20x)
    // Capping to 10M for slider, actual cap in generator
    const suggestedSamplingRate = Math.min(10_000_000, Math.max(100, newFreq * 20)); 
    onSamplingRateChange(suggestedSamplingRate);
  };

  const renderSliderWithInput = (
    id: keyof WaveformParams,
    label: string,
    min: number,
    max: number,
    defaultStep: number,
    unit: string,
    tooltipText: string,
    isLogScale?: boolean, // Optional flag for log-like behavior on sliders
    isFrequencyControl?: boolean
  ) => {
    const currentValue = params[id] as number;
    const step = isLogScale ? getSmartStep(min, max, currentValue) : defaultStep;

    return (
        <div className="space-y-2">
        <div className="flex justify-between items-center">
            <Label htmlFor={id} className="text-xs flex items-center">
            {label}
            <TooltipProvider delayDuration={100}>
                <Tooltip>
                <TooltipTrigger asChild>
                    <HelpCircle size={12} className="inline ml-1 text-muted-foreground cursor-help" />
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
                    if (isFrequencyControl) {
                         handleFrequencyChange(val);
                    } else if (id === 'samplingRateHz') {
                        onSamplingRateChange(Math.max(100, val)); // Min sampling rate 100 Hz
                    }
                    else {
                        onParamsChange({ [id]: val });
                    }
                }
            }}
            className="h-7 w-24 text-xs px-1 py-0.5 ml-2" // Increased width slightly
            min={min}
            max={max} // HTML5 max
            step={defaultStep} // Input step can be finer
            />
            <span className="text-xs text-muted-foreground ml-1">{unit}</span>
        </div>
        <Slider
            id={id}
            min={min}
            max={max}
            step={step} // Slider step can be dynamic for log-like feel
            value={[currentValue]}
            onValueChange={(value) => {
                 if (isFrequencyControl) {
                    handleFrequencyChange(value[0]);
                } else if (id === 'samplingRateHz') {
                    onSamplingRateChange(value[0]);
                }
                else {
                    onParamsChange({ [id]: value[0] });
                }
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

      {renderSliderWithInput('amplitude', 'Amplitude', 0.1, 20, 0.1, 'V', "Peak voltage deviation from DC offset.")}
      {/* Frequency: 1Hz to 1MHz. Slider for common range, input for precise high values. */}
      {renderSliderWithInput('frequency', 'Frequency', 1, 1000000, 1, 'Hz', "Number of cycles per second. Slider for 1Hz-10kHz, input up to 1MHz.", true, true)}
      {renderSliderWithInput('phase', 'Phase Shift', -180, 180, 1, '°', "Horizontal shift of the waveform in degrees.")}
      {renderSliderWithInput('dcOffset', 'DC Offset', -10, 10, 0.1, 'V', "Vertical shift of the entire waveform.")}
      
      {/* Time Window: 1µs (0.001ms) to 1s (1000ms). Slider for common range in ms. */}
       {renderSliderWithInput('timeWindowMs', 'Time Window', 0.001, 1000, 0.001, 'ms', "Total duration displayed on X-axis (1µs to 1s). Input in ms.", true)}
      
      {/* Sampling Rate: User adjustable, with a suggested default logic. */}
       {renderSliderWithInput('samplingRateHz', 'Sampling Rate', 100, 10000000, 100, 'Hz', "Data points per second. Min 2x Frequency. Slider for 100Hz-1MHz, input up to 10MHz.", true)}


       <div className="sm:col-span-2 lg:col-span-3 flex justify-end mt-2">
            <Button variant="outline" size="sm" onClick={handleReset} className="text-xs">
                <RotateCcw size={14} className="mr-1.5" />
                Reset Controls
            </Button>
        </div>
    </div>
  );
}
