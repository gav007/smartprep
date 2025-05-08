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
import { AlertCircle } from 'lucide-react';

const initialParams: WaveformParams = {
  type: 'sine',
  amplitude: 5, // Volts
  frequency: 1, // Hz
  phase: 0, // Degrees
  dcOffset: 0, // Volts
  timeWindowMs: 1000, // Milliseconds (e.g., 1 second for 1Hz)
  samplingRateHz: 1000, // Points per second
};

export default function WaveformGenerator() {
  const [params, setParams] = useState<WaveformParams>(initialParams);
  const [waveformPoints, setWaveformPoints] = useState<DataPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generateWaveform = useCallback(() => {
    setError(null);
    const numPoints = Math.max(2, Math.floor((params.timeWindowMs / 1000) * params.samplingRateHz));
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
    if (params.timeWindowMs <=0) {
        setError("Time window must be positive.");
        setWaveformPoints([]);
        return;
    }
    if (params.samplingRateHz <=0 || params.samplingRateHz < params.frequency * 2) {
        setError("Sampling rate must be positive and at least twice the frequency (Nyquist theorem).");
        setWaveformPoints([]);
        return;
    }


    let points: DataPoint[] = [];
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
    setWaveformPoints(points);
  }, [params]);

  useEffect(() => {
    generateWaveform();
  }, [generateWaveform]);

  const handleParamsChange = (newParams: Partial<WaveformParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  };

  return (
    <div className="space-y-6">
      <WaveformControls params={params} onParamsChange={handleParamsChange} />
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <WaveformPlot data={waveformPoints} params={params} />
    </div>
  );
}
