// src/components/waveform/WaveformGenerator.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import WaveformControls from './WaveformControls';
import WaveformPlot from './WaveformPlot';
import type { WaveformType, WaveformParams, DataPoint } from '@/types/waveform';
import {
  generateSineWave,
  generateSquareWave,
  generateTriangleWave,
  generateSawtoothWave,
} from '@/lib/waveform-utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Sigma, FunctionSquare, Zap } from 'lucide-react'; 
import { formatResultValue } from '@/lib/units';
import type { TimeUnit } from '@/lib/units';

const MAX_POINTS_FOR_PLOT = 5000; 
const MIN_SAMPLING_RATE_HZ = 2; 
const MIN_FREQUENCY_HZ = 0.1; 
const MAX_FREQUENCY_HZ = 500_000; 
const MAX_SAMPLING_RATE_HZ = 10_000_000;

const initialParams: WaveformParams = {
  type: 'sine',
  amplitude: 12,      
  frequency: 5000,    
  phase: 0,
  dcOffset: 0,
  timeWindowMs: 0.4, 
  samplingRateHz: 100000, 
  timeForInstantaneousVoltageMs: undefined,
  timeForInstantaneousVoltageUnit: 'ms', // Added default unit
};

export default function WaveformGenerator() {
  const [params, setParams] = useState<WaveformParams>(initialParams);
  const [waveformPoints, setWaveformPoints] = useState<DataPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const angularFrequency = useMemo(() => 2 * Math.PI * params.frequency, [params.frequency]);
  const periodSeconds = useMemo(() => params.frequency > 0 ? 1 / params.frequency : Infinity, [params.frequency]);
  
  const instantaneousVoltageResult = useMemo(() => {
    if (params.timeForInstantaneousVoltageMs === undefined || params.timeForInstantaneousVoltageMs === null || isNaN(params.timeForInstantaneousVoltageMs)) {
      return null;
    }
    // timeForInstantaneousVoltageMs is already in MS from the controls
    const tSeconds = params.timeForInstantaneousVoltageMs / 1000;
    const phaseRad = params.phase * (Math.PI / 180);
    
    let v_t: number;
    // Always use the formula for sine for instantaneous voltage, as other waveforms are less standard for v(t) point calc.
    // This could be expanded if specific formulas for other types at 't' are required.
    v_t = params.amplitude * Math.sin(angularFrequency * tSeconds + phaseRad) + params.dcOffset;
    
    if (params.frequency === 0) { // Handle DC case
      if (params.type === 'sine') {
        v_t = params.amplitude * Math.sin(phaseRad) + params.dcOffset;
      } else if (params.type === 'square') {
        v_t = params.amplitude + params.dcOffset; // Square wave at f=0 is at its peak (or -peak depending on definition)
      } else { // Triangle, Sawtooth at f=0 is just DC offset (or A + DC if it starts at peak)
        v_t = params.dcOffset; 
      }
    }


    return v_t;
  }, [params.amplitude, params.frequency, params.phase, params.dcOffset, params.type, params.timeForInstantaneousVoltageMs, angularFrequency]);

  // Vrms Calculation
  const Vrms = useMemo(() => {
    if (params.amplitude === 0) return 0; // Vrms is 0 if amplitude is 0
    if (params.frequency === 0) return Math.abs(params.amplitude + params.dcOffset); // For DC, Vrms = |Vdc| (assuming sine at f=0 means constant A*sin(phi)+DC)
                                                                                // For square at f=0, Vrms = |A+DC|
                                                                                // For others at f=0, Vrms = |DC|
    switch (params.type) {
      case 'sine':
        return params.amplitude / Math.sqrt(2);
      case 'square':
        return params.amplitude; // RMS of an ideal square wave (ignoring DC for this definition)
      case 'triangle':
        return params.amplitude / Math.sqrt(3);
      case 'sawtooth':
        return params.amplitude / Math.sqrt(3);
      default:
        return null;
    }
  }, [params.type, params.amplitude, params.frequency, params.dcOffset]);


  const generateWaveform = useCallback(() => {
    setError(null);
    setWarning(null);
    let currentWarning: string | null = null;

    const { amplitude, frequency, timeWindowMs, samplingRateHz } = params;

    if (amplitude < 0) { setError("Amplitude must be non-negative."); setWaveformPoints([]); return; }
    if (frequency < 0 ) { setError(`Frequency must be non-negative.`); setWaveformPoints([]); return; } // Allow 0 for DC
    if (frequency > MAX_FREQUENCY_HZ) { setError(`Frequency cannot exceed ${formatResultValue(MAX_FREQUENCY_HZ, 'frequency').displayValue}${formatResultValue(MAX_FREQUENCY_HZ, 'frequency').unit}.`); setWaveformPoints([]); return; }

    if (timeWindowMs <= 0) { setError("Time window must be positive."); setWaveformPoints([]); return;}
    if (samplingRateHz < MIN_SAMPLING_RATE_HZ || samplingRateHz > MAX_SAMPLING_RATE_HZ) { setError(`Sampling rate must be between ${formatResultValue(MIN_SAMPLING_RATE_HZ, 'frequency').displayValue}${formatResultValue(MIN_SAMPLING_RATE_HZ, 'frequency').unit} and ${formatResultValue(MAX_SAMPLING_RATE_HZ, 'frequency').displayValue}${formatResultValue(MAX_SAMPLING_RATE_HZ, 'frequency').unit}.`); setWaveformPoints([]); return; }

    let samplesPerCycle = Infinity;
    if (frequency > 0) {
      samplesPerCycle = samplingRateHz / frequency;
      if (samplesPerCycle < 2) {
        currentWarning = `Nyquist criterion severely violated: Sampling rate (${formatResultValue(samplingRateHz, 'frequency').displayValue}) must be at least 2x Frequency (${formatResultValue(2 * frequency, 'frequency').displayValue}) to avoid aliasing. Waveform will be incorrect.`;
      } else if (samplesPerCycle < 20) { // Changed from 10 to 20 as per prompt
        currentWarning = (currentWarning ? currentWarning + " " : "") + `Low samples per cycle (${samplesPerCycle.toFixed(1)}). Waveform shape may be distorted. Recommended >= 20.`;
      }
    }
    
    let numPointsToGenerate = Math.floor((timeWindowMs / 1000) * samplingRateHz);
    numPointsToGenerate = Math.max(2, numPointsToGenerate); 

    let pointsToPlot: DataPoint[];
    let allGeneratedPoints: DataPoint[];

    if (frequency === 0 && amplitude === 0) { // True DC line at offset
        allGeneratedPoints = [
            { time: 0, voltage: params.dcOffset },
            { time: timeWindowMs/1000, voltage: params.dcOffset }
        ];
    } else if (frequency === 0 && params.type === 'sine') { // "DC" from sine at specific phase
        const dcValue = params.amplitude * Math.sin(params.phase * (Math.PI/180)) + params.dcOffset;
        allGeneratedPoints = [ {time: 0, voltage: dcValue }, { time: timeWindowMs/1000, voltage: dcValue }];
    } else if (frequency === 0 && params.type === 'square') { // "DC" from square wave (at positive peak)
        allGeneratedPoints = [ {time: 0, voltage: params.amplitude + params.dcOffset }, { time: timeWindowMs/1000, voltage: params.amplitude + params.dcOffset }];
    } else if (frequency === 0) { // Other DC lines (triangle, sawtooth at f=0 are effectively just offset)
        allGeneratedPoints = [ {time: 0, voltage: params.dcOffset }, { time: timeWindowMs/1000, voltage: params.dcOffset }];
    }
     else { // AC waveforms
        try {
            switch (params.type) {
                case 'sine': allGeneratedPoints = generateSineWave(params, numPointsToGenerate); break;
                case 'square': allGeneratedPoints = generateSquareWave(params, numPointsToGenerate); break;
                case 'triangle': allGeneratedPoints = generateTriangleWave(params, numPointsToGenerate); break;
                case 'sawtooth': allGeneratedPoints = generateSawtoothWave(params, numPointsToGenerate); break;
                default: setError('Unknown waveform type.'); setWaveformPoints([]); return;
            }
        } catch (e: any) {
            setError(`Error generating waveform: ${e.message}`); setWaveformPoints([]); return;
        }
    }
    
    if (allGeneratedPoints.length > MAX_POINTS_FOR_PLOT) {
        const decimationFactor = Math.ceil(allGeneratedPoints.length / MAX_POINTS_FOR_PLOT);
        pointsToPlot = allGeneratedPoints.filter((_, index) => index % decimationFactor === 0);
        currentWarning = (currentWarning ? currentWarning + " " : "") + `Waveform decimated for performance. Displaying ${pointsToPlot.length.toLocaleString()} of ${allGeneratedPoints.length.toLocaleString()} points.`;
    } else {
        pointsToPlot = allGeneratedPoints;
    }
    
    setWarning(currentWarning);
    setWaveformPoints(pointsToPlot);
  }, [params]);

  useEffect(() => {
    const handler = setTimeout(() => {
        generateWaveform();
    }, 150); 
    return () => clearTimeout(handler);
  }, [generateWaveform]);


  const handleParamsChange = (newParams: Partial<WaveformParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  };
  
  const handleSamplingRateChange = (newRate: number) => {
    setParams(prev => ({...prev, samplingRateHz: Math.max(MIN_SAMPLING_RATE_HZ, Math.min(newRate, MAX_SAMPLING_RATE_HZ))}));
  };

  const handleTimeForInstantaneousVoltageChange = (newTimeMs?: number) => {
    setParams(prev => ({ ...prev, timeForInstantaneousVoltageMs: newTimeMs }));
  };

  const handleTimeForInstantaneousVoltageUnitChange = (newUnit: TimeUnit) => {
    setParams(prev => ({ ...prev, timeForInstantaneousVoltageUnit: newUnit }));
    // When unit changes, re-interpret the existing numeric input for timeForInstantaneousVoltageMs
    // This assumes the numeric part of the input string remains the same, and we just change its unit interpretation.
    if (prev.timeForInstantaneousVoltageMs !== undefined && prev.timeForInstantaneousVoltageMs !== null) {
        const currentNumericValue = prev.timeForInstantaneousVoltageMs / (unitMultipliers[prev.timeForInstantaneousVoltageUnit || 'ms'] / unitMultipliers['ms']);
        const newTimeInMs = currentNumericValue * (unitMultipliers[newUnit] / unitMultipliers['ms']);
        handleTimeForInstantaneousVoltageChange(newTimeInMs);
    }
  };


  const getWaveformEquation = () => {
    const { amplitude: A, frequency: f, phase: phiDeg, dcOffset: Vdc, type } = params;
    const ampStr = A.toLocaleString(undefined, {minimumFractionDigits:1, maximumFractionDigits: 3});
    const omegaNum = 2 * Math.PI * f;
    // Use toLocaleString for omega to avoid scientific notation for reasonably small/large numbers
    const omegaStr = omegaNum.toLocaleString(undefined, { maximumSignificantDigits: 5, useGrouping: false });
    const dcStr = Vdc.toLocaleString(undefined, {minimumFractionDigits:1, maximumFractionDigits: 3});

    let funcPart = "";
    const phaseTerm = phiDeg !== 0 ? (phiDeg > 0 ? ` + ${Math.abs(phiDeg)}°` : ` - ${Math.abs(Math.round(phiDeg*10)/10)}°`) : '';
    
    if (f === 0) { // DC case
        if (type === 'sine') return `v(t) = ${formatResultValue(A * Math.sin(phiDeg * (Math.PI/180)) + Vdc, 'voltage', 'V').displayValue} V (DC from Sine)`;
        if (type === 'square') return `v(t) = ${formatResultValue(A + Vdc, 'voltage', 'V').displayValue} V (DC from Square)`;
        return `v(t) = ${formatResultValue(Vdc, 'voltage', 'V').displayValue} V (DC)`; // Triangle, Sawtooth default to offset at f=0
    }

    if (type === 'sine') {
      funcPart = `sin(${omegaStr}t${phaseTerm})`;
    } else { 
      const freqDisplay = formatResultValue(f, 'frequency');
      funcPart = `${type}(2π × ${freqDisplay.displayValue}${freqDisplay.unit} × t${phaseTerm})`;
    }
    const dcTerm = Vdc !== 0 ? (parseFloat(dcStr) > 0 ? ` + ${dcStr}` : ` - ${Math.abs(parseFloat(dcStr))}`) : '';
    
    return `v(t) = ${ampStr} ${funcPart}${dcTerm} V`;
  };
  
  const samplesPerCycle = params.frequency > 0 ? params.samplingRateHz / params.frequency : Infinity;

  return (
    <div className="space-y-6">
      <WaveformControls 
        params={params} 
        onParamsChange={handleParamsChange} 
        onSamplingRateChange={handleSamplingRateChange}
        onTimeForInstantaneousVoltageChange={handleTimeForInstantaneousVoltageChange}
        onTimeForInstantaneousVoltageUnitChange={handleTimeForInstantaneousVoltageUnitChange}
      />
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {warning && !error && ( 
        <Alert variant="default" className="border-amber-500/50 text-amber-700 dark:text-amber-400 dark:border-amber-500/50 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      )}
      <WaveformPlot data={waveformPoints} params={params} Vrms={Vrms}/>
       <div className="mt-4 p-3 border rounded-md bg-muted/30 text-xs space-y-3">
            <div>
                <h4 className="font-semibold mb-1 text-sm flex items-center"><FunctionSquare size={14} className="mr-1.5 text-primary"/> General Waveform Expression:</h4>
                <p className="font-mono text-[10px] sm:text-xs break-all">{getWaveformEquation()}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">
                <h4 className="font-semibold text-sm col-span-full sm:col-span-2 md:col-span-3 mt-1 mb-0.5 flex items-center"><Sigma size={14} className="mr-1.5 text-primary"/> Calculated Parameters:</h4>
                <p><strong>Angular Freq. (ω):</strong> {params.frequency > 0 ? formatResultValue(angularFrequency, 'angularFrequency').displayValue : 'N/A'} rad/s</p>
                <p><strong>Period (T):</strong> {formatResultValue(periodSeconds, 'time').displayValue} {formatResultValue(periodSeconds, 'time').unit}</p>
                {Vrms !== null && <p className="flex items-center gap-1"><strong>V<sub>RMS</sub>:</strong> {formatResultValue(Vrms, 'voltage', 'V').displayValue} V <Zap size={10} className="text-amber-500"/></p>}
                
                {params.timeForInstantaneousVoltageMs !== undefined && instantaneousVoltageResult !== null && !isNaN(instantaneousVoltageResult) && (
                    <p className="font-semibold text-primary dark:text-primary col-span-full sm:col-span-1">
                        <strong>
                        v(t={formatResultValue(params.timeForInstantaneousVoltageMs / 1000, 'time', params.timeForInstantaneousVoltageUnit).displayValue}
                        {formatResultValue(params.timeForInstantaneousVoltageMs / 1000, 'time', params.timeForInstantaneousVoltageUnit).unit}
                        ):
                        </strong>
                        {' '}{formatResultValue(instantaneousVoltageResult, 'voltage', 'V').displayValue} V
                    </p>
                )}
            </div>

            <div>
                <h4 className="font-semibold mb-1 text-sm">Current Plot Settings:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-0.5">
                    <p><strong>Amplitude:</strong> {formatResultValue(params.amplitude, 'voltage', 'V').displayValue} V</p>
                    <p><strong>Frequency:</strong> {formatResultValue(params.frequency, 'frequency').displayValue} {formatResultValue(params.frequency, 'frequency').unit}</p>
                    <p><strong>Phase:</strong> {params.phase}°</p>
                    <p><strong>DC Offset:</strong> {formatResultValue(params.dcOffset, 'voltage', 'V').displayValue} V</p>
                    <p><strong>Time Window:</strong> {formatResultValue(params.timeWindowMs / 1000, 'time').displayValue} {formatResultValue(params.timeWindowMs / 1000, 'time').unit}</p>
                    <p><strong>Sampling Rate:</strong> {formatResultValue(params.samplingRateHz, 'frequency').displayValue} {formatResultValue(params.samplingRateHz, 'frequency').unit}</p>
                    <p><strong>Points Plotted:</strong> {waveformPoints.length.toLocaleString()}</p>
                    <p><strong>Samples/Cycle:</strong> {isFinite(samplesPerCycle) ? samplesPerCycle.toFixed(1) : (params.frequency === 0 ? 'DC' : 'N/A')}</p>
                </div>
            </div>
      </div>
    </div>
  );
}

