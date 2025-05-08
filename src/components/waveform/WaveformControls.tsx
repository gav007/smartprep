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
}

const waveformTypes: WaveformType[] = ['sine', 'square', 'triangle', 'sawtooth'];

const initialParamsForReset: WaveformParams = {
  type: 'sine', amplitude: 5, frequency: 1, phase: 0, dcOffset: 0,
  timeWindowMs: 1000, samplingRateHz: 1000,
};

export default function WaveformControls({ params, onParamsChange }: WaveformControlsProps) {

  const handleReset = () => {
    onParamsChange(initialParamsForReset);
  };

  const renderSliderWithInput = (
    id: keyof WaveformParams,
    label: string,
    min: number,
    max: number,
    step: number,
    unit: string,
    tooltipText: string
  ) => (
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
          value={params[id]}
          onChange={(e) => onParamsChange({ [id]: parseFloat(e.target.value) || 0 })}
          className="h-7 w-20 text-xs px-1 py-0.5 ml-2"
          min={min}
          max={max}
          step={step}
        />
         <span className="text-xs text-muted-foreground ml-1">{unit}</span>
      </div>
      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        value={[params[id] as number]}
        onValueChange={(value) => onParamsChange({ [id]: value[0] })}
        className="my-1"
      />
    </div>
  );

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
      {renderSliderWithInput('frequency', 'Frequency', 0.1, 100, 0.1, 'Hz', "Number of cycles per second.")}
      {renderSliderWithInput('phase', 'Phase Shift', -180, 180, 1, '°', "Horizontal shift of the waveform in degrees.")}
      {renderSliderWithInput('dcOffset', 'DC Offset', -10, 10, 0.1, 'V', "Vertical shift of the entire waveform.")}
      
      <div className="space-y-1 lg:col-span-1">
         {renderSliderWithInput('timeWindowMs', 'Time Window', 10, 5000, 10, 'ms', "Total duration of time displayed on the X-axis.")}
      </div>
       <div className="space-y-1 lg:col-span-1">
         {renderSliderWithInput('samplingRateHz', 'Sampling Rate', 100, 10000, 100, 'Hz', "Number of data points calculated per second.")}
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

