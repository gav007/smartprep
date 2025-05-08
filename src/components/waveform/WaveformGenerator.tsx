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
import { AlertCircle, Sigma } from 'lucide-react';
import { formatResultValue } from '@/lib/units';

const MAX_POINTS_FOR_PLOT = 5000; // Max points to send to the plotting component for performance
const MIN_SAMPLING_RATE_HZ = 100; // Minimum allowed sampling rate
const MIN_FREQUENCY_HZ = 1;
const MAX_FREQUENCY_HZ = 1_000_000;
const MAX_SAMPLING_RATE_HZ = 10_000_000;

const initialParams: WaveformParams = {
  type: 'sine',
  amplitude: 5,
  frequency: 1000,   // 1 kHz
  phase: 0,
  dcOffset: 0,
  cyclesToDisplay: 5, // Show 5 cycles by default
  samplingRateHz: 20000, // 20x frequency
};

export default function WaveformGenerator() {
  const [params, setParams] = useState<WaveformParams>(initialParams);
  const [waveformPoints, setWaveformPoints] = useState<DataPoint[]>([]);
  const [effectiveTimeWindowMs, setEffectiveTimeWindowMs] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const generateWaveform = useCallback(() => {
    setError(null);
    setWarning(null);
    let currentWarning: string | null = null;

    const { amplitude, frequency, cyclesToDisplay, samplingRateHz } = params;

    if (amplitude <= 0) { setError("Amplitude must be positive."); setWaveformPoints([]); return; }
    if (frequency < MIN_FREQUENCY_HZ || frequency > MAX_FREQUENCY_HZ) { setError(`Frequency must be between ${MIN_FREQUENCY_HZ} Hz and ${formatResultValue(MAX_FREQUENCY_HZ, 'frequency').displayValue} ${formatResultValue(MAX_FREQUENCY_HZ, 'frequency').unit}.`); setWaveformPoints([]); return; }
    if (cyclesToDisplay <= 0) { setError("Cycles to display must be positive."); setWaveformPoints([]); return; }
    if (samplingRateHz < MIN_SAMPLING_RATE_HZ || samplingRateHz > MAX_SAMPLING_RATE_HZ) { setError(`Sampling rate must be between ${MIN_SAMPLING_RATE_HZ} Hz and ${formatResultValue(MAX_SAMPLING_RATE_HZ, 'frequency').displayValue} ${formatResultValue(MAX_SAMPLING_RATE_HZ, 'frequency').unit}.`); setWaveformPoints([]); return; }

    const calculatedTimeWindowMs = (cyclesToDisplay / frequency) * 1000;
    setEffectiveTimeWindowMs(calculatedTimeWindowMs);

    // Nyquist and samples per cycle validation
    const samplesPerCycle = samplingRateHz / frequency;
    if (samplesPerCycle < 2) {
      currentWarning = `Nyquist criterion severely violated: Sampling rate (${formatResultValue(samplingRateHz, 'frequency').displayValue} ${formatResultValue(samplingRateHz, 'frequency').unit}) must be at least 2x Frequency (${formatResultValue(2 * frequency, 'frequency').displayValue} ${formatResultValue(2 * frequency, 'frequency').unit}) to avoid aliasing.`;
    } else if (samplesPerCycle < 20) {
      currentWarning = (currentWarning ? currentWarning + " " : "") + `Low samples per cycle (${samplesPerCycle.toFixed(1)}). Waveform shape may be distorted. Recommended >= 20.`;
    }
    
    let numPointsToGenerate = Math.floor((calculatedTimeWindowMs / 1000) * samplingRateHz);
    numPointsToGenerate = Math.max(2, numPointsToGenerate); // Ensure at least 2 points

    let pointsToPlot: DataPoint[];
    let allGeneratedPoints: DataPoint[];

    // Generate full set of points based on sampling rate
    const tempParamsForGeneration = { ...params, timeWindowMs: calculatedTimeWindowMs }; // Pass derived timeWindowMs

    try {
        switch (params.type) {
            case 'sine': allGeneratedPoints = generateSineWave(tempParamsForGeneration, numPointsToGenerate); break;
            case 'square': allGeneratedPoints = generateSquareWave(tempParamsForGeneration, numPointsToGenerate); break;
            case 'triangle': allGeneratedPoints = generateTriangleWave(tempParamsForGeneration, numPointsToGenerate); break;
            case 'sawtooth': allGeneratedPoints = generateSawtoothWave(tempParamsForGeneration, numPointsToGenerate); break;
            default: setError('Unknown waveform type.'); setWaveformPoints([]); return;
        }
    } catch (e: any) {
        setError(`Error generating waveform: ${e.message}`); setWaveformPoints([]); return;
    }

    // Decimate if too many points for plotting
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

  const getWaveformEquation = () => {
    const { amplitude: A, frequency: f, phase: phiDeg, dcOffset: Vdc, type } = params;
    // Use toFixed for better control over decimal places
    const ampStr = A.toLocaleString(undefined, {minimumFractionDigits:1, maximumFractionDigits: 2});
    const freqStr = formatResultValue(f, 'frequency');
    const dcStr = Vdc.toLocaleString(undefined, {minimumFractionDigits:1, maximumFractionDigits: 2});

    let funcPart = "";
    const phaseTerm = phiDeg !== 0 ? (phiDeg > 0 ? ` + ${Math.abs(phiDeg)}°` : ` - ${Math.abs(phiDeg)}°`) : '';
    
    switch (type) {
        case 'sine': funcPart = `sin(2π × ${freqStr.displayValue}${freqStr.unit} × t${phaseTerm})`; break;
        case 'square': funcPart = `sq(2π × ${freqStr.displayValue}${freqStr.unit} × t${phaseTerm})`; break;
        case 'triangle': funcPart = `tri(2π × ${freqStr.displayValue}${freqStr.unit} × t${phaseTerm})`; break;
        case 'sawtooth': funcPart = `saw(2π × ${freqStr.displayValue}${freqStr.unit} × t${phaseTerm})`; break;
    }
    const dcTerm = Vdc !== 0 ? (Vdc > 0 ? ` + ${dcStr}` : ` - ${Math.abs(parseFloat(dcStr))}`) : '';
    return `v(t) = ${ampStr} ${funcPart} ${dcTerm} V`;
  };
  
  const samplesPerCycle = params.samplingRateHz / params.frequency;


  return (
    <div className="space-y-6">
      <WaveformControls params={params} onParamsChange={handleParamsChange} onSamplingRateChange={handleSamplingRateChange}/>
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
      <WaveformPlot data={waveformPoints} params={{...params, timeWindowMs: effectiveTimeWindowMs}} /> {/* Pass effectiveTimeWindowMs */}
       <div className="mt-4 p-3 border rounded-md bg-muted/30 text-xs space-y-2">
            <div>
                <h4 className="font-semibold mb-1 text-sm flex items-center"><Sigma size={14} className="mr-1.5 text-primary"/> Waveform Equation:</h4>
                <p className="font-mono text-[10px] sm:text-xs break-all">{getWaveformEquation()}</p>
            </div>
            <div>
                <h4 className="font-semibold mb-1 text-sm">Current Parameters:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-0.5">
                    <p><strong>Type:</strong> <span className="capitalize">{params.type}</span></p>
                    <p><strong>Amplitude:</strong> {formatResultValue(params.amplitude, 'voltage').displayValue} V</p>
                    <p><strong>Frequency:</strong> {formatResultValue(params.frequency, 'frequency').displayValue} {formatResultValue(params.frequency, 'frequency').unit}</p>
                    <p><strong>Phase:</strong> {params.phase}°</p>
                    <p><strong>DC Offset:</strong> {formatResultValue(params.dcOffset, 'voltage').displayValue} V</p>
                    <p><strong>Time Window:</strong> {formatResultValue(effectiveTimeWindowMs / 1000, 'time').displayValue} {formatResultValue(effectiveTimeWindowMs / 1000, 'time').unit}</p>
                    <p><strong>Sampling Rate:</strong> {formatResultValue(params.samplingRateHz, 'frequency').displayValue} {formatResultValue(params.samplingRateHz, 'frequency').unit}</p>
                    <p><strong>Points Plotted:</strong> {waveformPoints.length.toLocaleString()}</p>
                    <p><strong>Samples/Cycle:</strong> {isFinite(samplesPerCycle) ? samplesPerCycle.toFixed(1) : 'N/A'}</p>
                </div>
            </div>
      </div>
    </div>
  );
}

