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
import { AlertCircle, Sigma, FunctionSquare } from 'lucide-react'; // Added FunctionSquare
import { formatResultValue } from '@/lib/units';

const MAX_POINTS_FOR_PLOT = 5000; // Max points to send to the plotting component for performance
const MIN_SAMPLING_RATE_HZ = 100;
const MIN_FREQUENCY_HZ = 1;
const MAX_FREQUENCY_HZ = 500_000; // Matched with controls
const MAX_SAMPLING_RATE_HZ = 10_000_000;

const initialParams: WaveformParams = {
  type: 'sine',
  amplitude: 12,      // Example: 12V Peak
  frequency: 5000,    // Example: 5 kHz
  phase: 0,
  dcOffset: 0,
  timeWindowMs: 0.4, // Show 2 cycles of 5kHz (T = 1/5000s = 0.2ms)
  samplingRateHz: 100000, // 20x frequency
  timeForInstantaneousVoltageMs: undefined, // Initially undefined
};

export default function WaveformGenerator() {
  const [params, setParams] = useState<WaveformParams>(initialParams);
  const [waveformPoints, setWaveformPoints] = useState<DataPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  // Calculated exam-style values
  const angularFrequency = useMemo(() => 2 * Math.PI * params.frequency, [params.frequency]);
  const periodSeconds = useMemo(() => 1 / params.frequency, [params.frequency]);
  
  const instantaneousVoltageResult = useMemo(() => {
    if (params.timeForInstantaneousVoltageMs === undefined || params.timeForInstantaneousVoltageMs === null || isNaN(params.timeForInstantaneousVoltageMs)) {
      return null;
    }
    const tSeconds = params.timeForInstantaneousVoltageMs / 1000; // Convert ms to s for calculation
    const phaseRad = params.phase * (Math.PI / 180);
    // Only for sine wave as per prompt focus, extend if other types needed for v(t) calculation
    if (params.type === 'sine') {
      return params.amplitude * Math.sin(angularFrequency * tSeconds + phaseRad) + params.dcOffset;
    }
    return null; // Or calculate for other types if specified
  }, [params.amplitude, params.phase, params.dcOffset, params.type, params.timeForInstantaneousVoltageMs, angularFrequency]);


  const generateWaveform = useCallback(() => {
    setError(null);
    setWarning(null);
    let currentWarning: string | null = null;

    const { amplitude, frequency, timeWindowMs, samplingRateHz } = params;

    if (amplitude <= 0) { setError("Amplitude must be positive."); setWaveformPoints([]); return; }
    if (frequency < MIN_FREQUENCY_HZ || frequency > MAX_FREQUENCY_HZ) { setError(`Frequency must be between ${MIN_FREQUENCY_HZ} Hz and ${formatResultValue(MAX_FREQUENCY_HZ, 'frequency').displayValue} ${formatResultValue(MAX_FREQUENCY_HZ, 'frequency').unit}.`); setWaveformPoints([]); return; }
    if (timeWindowMs <= 0) { setError("Time window must be positive."); setWaveformPoints([]); return;}
    if (samplingRateHz < MIN_SAMPLING_RATE_HZ || samplingRateHz > MAX_SAMPLING_RATE_HZ) { setError(`Sampling rate must be between ${MIN_SAMPLING_RATE_HZ} Hz and ${formatResultValue(MAX_SAMPLING_RATE_HZ, 'frequency').displayValue} ${formatResultValue(MAX_SAMPLING_RATE_HZ, 'frequency').unit}.`); setWaveformPoints([]); return; }

    // Nyquist and samples per cycle validation
    const samplesPerCycle = samplingRateHz / frequency;
    if (samplesPerCycle < 2) {
      currentWarning = `Nyquist criterion severely violated: Sampling rate (${formatResultValue(samplingRateHz, 'frequency').displayValue} ${formatResultValue(samplingRateHz, 'frequency').unit}) must be at least 2x Frequency (${formatResultValue(2 * frequency, 'frequency').displayValue} ${formatResultValue(2 * frequency, 'frequency').unit}) to avoid aliasing.`;
    } else if (samplesPerCycle < 20) {
      currentWarning = (currentWarning ? currentWarning + " " : "") + `Low samples per cycle (${samplesPerCycle.toFixed(1)}). Waveform shape may be distorted. Recommended >= 20.`;
    }
    
    let numPointsToGenerate = Math.floor((timeWindowMs / 1000) * samplingRateHz);
    numPointsToGenerate = Math.max(2, numPointsToGenerate); 

    let pointsToPlot: DataPoint[];
    let allGeneratedPoints: DataPoint[];

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

    if (numPointsToGenerate > MAX_POINTS_FOR_PLOT) {
      const decimationFactor = Math.ceil(numPointsToGenerate / MAX_POINTS_FOR_PLOT);
      pointsToPlot = allGeneratedPoints.filter((_, index) => index % decimationFactor === 0);
      currentWarning = (currentWarning ? currentWarning + " " : "") + `Waveform decimated for performance. Displaying ${pointsToPlot.length.toLocaleString()} of ${numPointsToGenerate.toLocaleString()} points.`;
    } else {
      pointsToPlot = allGeneratedPoints;
    }
    
    setWarning(currentWarning);
    setWaveformPoints(pointsToPlot);
  }, [params]);

  useEffect(() => {
    generateWaveform();
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

  const getWaveformEquation = () => {
    const { amplitude: A, frequency: f, phase: phiDeg, dcOffset: Vdc, type } = params;
    const ampStr = A.toLocaleString(undefined, {minimumFractionDigits:1, maximumFractionDigits: 2});
    const omegaStr = angularFrequency.toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits: 2});
    const dcStr = Vdc.toLocaleString(undefined, {minimumFractionDigits:1, maximumFractionDigits: 2});

    let funcPart = "";
    const phaseTerm = phiDeg !== 0 ? (phiDeg > 0 ? ` + ${Math.abs(phiDeg)}°` : ` - ${Math.abs(phiDeg)}°`) : '';
    
    // For sine, use ω notation
    if (type === 'sine') {
      funcPart = `sin(${omegaStr}t${phaseTerm})`;
    } else { // For other types, use f for simplicity in the general expression
      const freqDisplay = formatResultValue(f, 'frequency');
      funcPart = `${type}(2π × ${freqDisplay.displayValue}${freqDisplay.unit} × t${phaseTerm})`;
    }
    const dcTerm = Vdc !== 0 ? (Vdc > 0 ? ` + ${dcStr}` : ` - ${Math.abs(parseFloat(dcStr))}`) : '';
    return `v(t) = ${ampStr} ${funcPart}${dcTerm} V`;
  };
  
  const samplesPerCycle = params.samplingRateHz / params.frequency;

  return (
    <div className="space-y-6">
      <WaveformControls 
        params={params} 
        onParamsChange={handleParamsChange} 
        onSamplingRateChange={handleSamplingRateChange}
        onTimeForInstantaneousVoltageChange={handleTimeForInstantaneousVoltageChange}
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
      <WaveformPlot data={waveformPoints} params={params} />
       <div className="mt-4 p-3 border rounded-md bg-muted/30 text-xs space-y-3">
            <div>
                <h4 className="font-semibold mb-1 text-sm flex items-center"><FunctionSquare size={14} className="mr-1.5 text-primary"/> General Waveform Expression:</h4>
                <p className="font-mono text-[10px] sm:text-xs break-all">{getWaveformEquation()}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">
                <h4 className="font-semibold text-sm col-span-full sm:col-span-2 md:col-span-3 mt-1 mb-0.5 flex items-center"><Sigma size={14} className="mr-1.5 text-primary"/> Calculated Parameters:</h4>
                <p><strong>Angular Freq. (ω):</strong> {formatResultValue(angularFrequency, 'other').displayValue} rad/s</p>
                <p><strong>Period (T):</strong> {formatResultValue(periodSeconds, 'time').displayValue} {formatResultValue(periodSeconds, 'time').unit}</p>
                {params.timeForInstantaneousVoltageMs !== undefined && instantaneousVoltageResult !== null && (
                    <p className="font-semibold text-primary dark:text-primary">
                        <strong>
                        v(t={formatResultValue(params.timeForInstantaneousVoltageMs / 1000, 'time').displayValue}
                        {formatResultValue(params.timeForInstantaneousVoltageMs / 1000, 'time').unit}
                        ):
                        </strong>
                        {' '}{formatResultValue(instantaneousVoltageResult, 'voltage').displayValue} V
                    </p>
                )}
            </div>

            <div>
                <h4 className="font-semibold mb-1 text-sm">Current Plot Settings:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-0.5">
                    <p><strong>Amplitude:</strong> {formatResultValue(params.amplitude, 'voltage').displayValue} V</p>
                    <p><strong>Frequency:</strong> {formatResultValue(params.frequency, 'frequency').displayValue} {formatResultValue(params.frequency, 'frequency').unit}</p>
                    <p><strong>Phase:</strong> {params.phase}°</p>
                    <p><strong>DC Offset:</strong> {formatResultValue(params.dcOffset, 'voltage').displayValue} V</p>
                    <p><strong>Time Window:</strong> {formatResultValue(params.timeWindowMs / 1000, 'time').displayValue} {formatResultValue(params.timeWindowMs / 1000, 'time').unit}</p>
                    <p><strong>Sampling Rate:</strong> {formatResultValue(params.samplingRateHz, 'frequency').displayValue} {formatResultValue(params.samplingRateHz, 'frequency').unit}</p>
                    <p><strong>Points Plotted:</strong> {waveformPoints.length.toLocaleString()}</p>
                    <p><strong>Samples/Cycle:</strong> {isFinite(samplesPerCycle) ? samplesPerCycle.toFixed(1) : 'N/A'}</p>
                </div>
            </div>
      </div>
    </div>
  );
}
