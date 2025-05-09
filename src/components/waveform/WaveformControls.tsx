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

const MIN_FREQUENCY_HZ = 0; 
const MAX_FREQUENCY_HZ = 50000; 
const MIN_SAMPLING_RATE_HZ = 2; 
const MAX_SAMPLING_RATE_HZ = 10_000_000;
const MIN_TIME_WINDOW_MS = 0.001; 
const MAX_TIME_WINDOW_MS = 1000;  
const MIN_AMPLITUDE_V = 0.001; 
const MAX_AMPLITUDE_V = 400;
const MIN_DC_OFFSET_V = -MAX_AMPLITUDE_V;
const MAX_DC_OFFSET_V = MAX_AMPLITUDE_V;


const initialParamsForReset: WaveformParams = {
  type: 'sine', amplitude: 12, frequency: 1000, phase: 0, dcOffset: 0,
  timeWindowMs: 1, 
  samplingRateHz: 20000, 
  timeForInstantaneousVoltageMs: undefined,
  timeForInstantaneousVoltageUnit: 'ms',
};

const getSmartStep = (id: keyof WaveformParams | 'samplingRateHz', min: number, max: number, value: number, isFine: boolean = false) => {
    const range = max - min;
    if (range <= 0) return isFine ? 0.001 : 0.1; 

    // For frequency, make steps larger as value increases
    if (id === 'frequency') {
        if (value < 100) return 1;
        if (value < 1000) return 10;
        if (value < 10000) return 100;
        return 1000;
    }
    
    const relativeValue = Math.abs(value / max);

    if (isFine) { 
      if (Math.abs(value) < 1) return 0.001;
      if (Math.abs(value) < 10) return 0.01;
      if (Math.abs(value) < 100) return 0.1;
      return 1;
    }

    if (max <= 1) return 0.00001;
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

  const [timeForVInstInputStr, setTimeForVInstInputStr] = useState<string>(
    params.timeForInstantaneousVoltageMs !== undefined ? (params.timeForInstantaneousVoltageMs / unitMultipliers[params.timeForInstantaneousVoltageUnit || 'ms'] * 1000).toString() : ''
  );
  
  React.useEffect(() => {
    if (params.timeForInstantaneousVoltageMs === undefined) {
      setTimeForVInstInputStr('');
    } else {
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
        onParamsChange({ frequency: 0 }); 
        onSamplingRateChange(MIN_SAMPLING_RATE_HZ); 
        return;
    }
    if (isNaN(numVal) || numVal < 0) return; 

    const newFreq = Math.min(numVal, MAX_FREQUENCY_HZ);
    onParamsChange({ frequency: newFreq });
    
    if (newFreq > 0) { 
        const suggestedSamplingRate = Math.min(MAX_SAMPLING_RATE_HZ, Math.max(MIN_SAMPLING_RATE_HZ, newFreq * 20)); 
        onSamplingRateChange(suggestedSamplingRate);
    } else { 
        onSamplingRateChange(MIN_SAMPLING_RATE_HZ);
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
      onTimeForInstantaneousVoltageChange(undefined); 
    }
  };

  const handleTimeForVInstUnitChange = (newUnit: Unit) => {
    onTimeForInstantaneousVoltageUnitChange(newUnit as TimeUnit);
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
    const sliderStep = getSmartStep(id, min, max, typeof currentValue === 'number' ? currentValue : (min + max) / 2, id === 'amplitude' || id === 'dcOffset' || id === 'phase' || id === 'timeWindowMs' || id === 'frequency');


    const handleChange = (val: number | string) => {
        let numValToSet: number;

        if (typeof val === 'string') {
            if (val.trim() === '') {
                numValToSet = Math.max(min, 0); 
            } else {
                const parsed = parseFloat(val);
                if (isNaN(parsed)) return; 
                numValToSet = parsed;
            }
        } else {
            numValToSet = val;
        }

        const boundedVal = Math.max(min, Math.min(numValToSet, max));

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
                    onBlur={() => { 
                        if (String(currentValue).trim() === '') {
                            handleChange(min);
                        }
                    }}
                    className="h-7 w-24 text-xs px-1 py-0.5"
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
                    max={params.timeWindowMs * (unitMultipliers['ms'] / (unitMultipliers[params.timeForInstantaneousVoltageUnit || 'ms']))} 
                    step={getSmartStep('timeWindowMs', 0, params.timeWindowMs, parseFloat(timeForVInstInputStr || '0'), true)} // Pass ID 'timeWindowMs' for step calculation context
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
