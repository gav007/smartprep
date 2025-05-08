// src/components/waveform/WaveformGenerator.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { AlertCircle, Sigma } from 'lucide-react'; // Using Sigma for equation icon
import { formatResultValue } from '@/lib/units'; // Import centralized formatter

const initialParams: WaveformParams = {
  type: 'sine',
  amplitude: 5,      // Volts
  frequency: 1000,   // Hz (Default to 1kHz)
  phase: 0,          // Degrees
  dcOffset: 0,       // Volts
  timeWindowMs: 1,   // Milliseconds (e.g., 1ms for 1kHz to see one cycle)
  samplingRateHz: 20000, // Samples per second (Default 20x frequency for 1kHz)
};

const MAX_POINTS = 10_000_000; // Cap for total points

export default function WaveformGenerator() {
  const [params, setParams] = useState<WaveformParams>(initialParams);
  const [waveformPoints, setWaveformPoints] = useState<DataPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const generateWaveform = useCallback(() => {
    setError(null);
    setWarning(null);

    if (params.amplitude <= 0) {
      setError("Amplitude must be positive.");
      setWaveformPoints([]);
      return;
    }
    if (params.frequency <= 0) {
      setError("Frequency must be positive.");
      setWaveformPoints([]);
      return;
    }
    if (params.timeWindowMs <= 0) {
        setError("Time window must be positive.");
        setWaveformPoints([]);
        return;
    }
    if (params.samplingRateHz <= 0) {
        setError("Sampling rate must be positive.");
        setWaveformPoints([]);
        return;
    }

    // Nyquist validation
    if (params.samplingRateHz < 2 * params.frequency) {
      setWarning(`Nyquist criterion not met: Sampling rate (${params.samplingRateHz} Hz) should be at least 2 × Frequency (${2 * params.frequency} Hz) to avoid aliasing.`);
      // Continue to plot but show warning
    }
    
    // Calculate number of points, respecting MAX_POINTS cap
    let numPoints = Math.floor((params.timeWindowMs / 1000) * params.samplingRateHz);
    if (numPoints > MAX_POINTS) {
        numPoints = MAX_POINTS;
        setWarning((prev) => (prev ? prev + " " : "") + `Point count capped at ${MAX_POINTS.toLocaleString()} to maintain performance.`);
    }
    numPoints = Math.max(2, numPoints); // Ensure at least 2 points for a line

    let points: DataPoint[] = [];
    try {
      switch (params.type) {
        case 'sine':
          points = generateSineWave(params, numPoints);
          break;
        case 'square':
          points = generateSquareWave(params, numPoints);
          break;
        case 'triangle':
          points = generateTriangleWave(params, numPoints);
          break;
        case 'sawtooth':
          points = generateSawtoothWave(params, numPoints);
          break;
        default:
          setError('Unknown waveform type selected.');
          setWaveformPoints([]);
          return;
      }
    } catch (e: any) {
      setError(`Error generating waveform: ${e.message}`);
      setWaveformPoints([]);
      return;
    }
    setWaveformPoints(points);
  }, [params]);

  useEffect(() => {
    generateWaveform();
  }, [generateWaveform]);

  const handleParamsChange = (newParams: Partial<WaveformParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  };

  // Specific handler for sampling rate to manage suggestions
  const handleSamplingRateChange = (newRate: number) => {
    setParams(prev => ({...prev, samplingRateHz: newRate}));
  };

  // Generate dynamic equation string
  const getWaveformEquation = () => {
    const { amplitude: A, frequency: f, phase: phiDeg, dcOffset: Vdc, type } = params;
    const phiRad = (phiDeg * Math.PI / 180).toFixed(2); // Phase in radians
    const omega = (2 * Math.PI * f).toLocaleString(undefined, {maximumSignificantDigits:4});
    
    let funcPart = "";
    switch (type) {
        case 'sine': funcPart = `sin(${omega}t ${phiDeg !== 0 ? (phiDeg > 0 ? `+ ${Math.abs(phiDeg)}°` : `- ${Math.abs(phiDeg)}°`) : ''})`; break;
        case 'square': funcPart = `sq(${omega}t ${phiDeg !== 0 ? (phiDeg > 0 ? `+ ${Math.abs(phiDeg)}°` : `- ${Math.abs(phiDeg)}°`) : ''})`; break;
        case 'triangle': funcPart = `tri(${omega}t ${phiDeg !== 0 ? (phiDeg > 0 ? `+ ${Math.abs(phiDeg)}°` : `- ${Math.abs(phiDeg)}°`) : ''})`; break;
        case 'sawtooth': funcPart = `saw(${omega}t ${phiDeg !== 0 ? (phiDeg > 0 ? `+ ${Math.abs(phiDeg)}°` : `- ${Math.abs(phiDeg)}°`) : ''})`; break;
    }
    return `v(t) = ${A.toFixed(1)} ${funcPart} ${Vdc !== 0 ? (Vdc > 0 ? `+ ${Math.abs(Vdc).toFixed(1)}` : `- ${Math.abs(Vdc).toFixed(1)}`) : ''} V`;
  };

  const formatDisplay = (value: number | null | undefined, type: 'frequency' | 'time' | 'voltage') => {
      const { displayValue, unit } = formatResultValue(value, type);
      return value === null || value === undefined || !isFinite(value) ? 'N/A' : `${displayValue} ${unit}`;
  };

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
      {warning && !error && ( // Show warning if no critical error
        <Alert variant="default" className="border-amber-500/50 text-amber-700 dark:text-amber-400 dark:border-amber-500/50 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      )}
      <WaveformPlot data={waveformPoints} params={params} />
       <div className="mt-4 p-3 border rounded-md bg-muted/30 text-xs space-y-2">
            <div>
                <h4 className="font-semibold mb-1 text-sm flex items-center"><Sigma size={14} className="mr-1.5 text-primary"/> Waveform Equation:</h4>
                <p className="font-mono text-[11px] sm:text-xs break-all">{getWaveformEquation()}</p>
            </div>
            <div>
                <h4 className="font-semibold mb-1 text-sm">Current Parameters:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-0.5">
                    <p><strong>Type:</strong> <span className="capitalize">{params.type}</span></p>
                    <p><strong>Amplitude:</strong> {formatDisplay(params.amplitude, 'voltage')}</p>
                    <p><strong>Frequency:</strong> {formatDisplay(params.frequency, 'frequency')}</p>
                    <p><strong>Phase:</strong> {params.phase}°</p>
                    <p><strong>DC Offset:</strong> {formatDisplay(params.dcOffset, 'voltage')}</p>
                    <p><strong>Time Window:</strong> {formatDisplay(params.timeWindowMs / 1000, 'time')}</p> {/* Convert ms to s for display */}
                    <p><strong>Sampling Rate:</strong> {formatDisplay(params.samplingRateHz, 'frequency')}</p>
                    <p><strong>Points:</strong> {waveformPoints.length.toLocaleString()}</p>
                </div>
            </div>
      </div>
    </div>
  );
}
