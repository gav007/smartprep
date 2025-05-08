// src/lib/waveform-utils.ts
import type { DataPoint, WaveformParams } from '@/types/waveform';

const generatePoints = (numPoints: number, timeWindowMs: number, generatorFunc: (tSeconds: number) => number): DataPoint[] => {
  const points: DataPoint[] = [];
  const timeStepSeconds = (timeWindowMs / 1000) / (numPoints - 1 > 0 ? numPoints -1 : 1); // Time step in seconds
  for (let i = 0; i < numPoints; i++) {
    const tSeconds = i * timeStepSeconds;
    const tMilliseconds = tSeconds * 1000; // For X-axis display
    points.push({ time: tMilliseconds, voltage: generatorFunc(tSeconds) });
  }
  return points;
};

export const generateSineWave = (params: WaveformParams, numPoints: number): DataPoint[] => {
  const { amplitude, frequency, phase, dcOffset, timeWindowMs } = params;
  const phaseRad = phase * (Math.PI / 180); // Convert phase from degrees to radians
  return generatePoints(numPoints, timeWindowMs, (t) => 
    amplitude * Math.sin(2 * Math.PI * frequency * t + phaseRad) + dcOffset
  );
};

export const generateSquareWave = (params: WaveformParams, numPoints: number): DataPoint[] => {
  const { amplitude, frequency, phase, dcOffset, timeWindowMs } = params;
  const period = 1 / frequency;
  const phaseSeconds = (phase / 360) * period; // Phase shift in seconds

  return generatePoints(numPoints, timeWindowMs, (t) => {
    const timeIntoCycle = (t + phaseSeconds) % period;
    const value = timeIntoCycle < period / 2 ? amplitude : -amplitude;
    return value + dcOffset;
  });
};

export const generateTriangleWave = (params: WaveformParams, numPoints: number): DataPoint[] => {
  const { amplitude, frequency, phase, dcOffset, timeWindowMs } = params;
  const period = 1 / frequency;
  const phaseSeconds = (phase / 360) * period;

  return generatePoints(numPoints, timeWindowMs, (t) => {
    const timeIntoCycle = (t + phaseSeconds) % period;
    let value;
    if (timeIntoCycle < period / 2) {
      // Rising edge
      value = (4 * amplitude / period) * timeIntoCycle - amplitude;
    } else {
      // Falling edge
      value = (-4 * amplitude / period) * (timeIntoCycle - period / 2) + amplitude;
    }
    return value + dcOffset;
  });
};

export const generateSawtoothWave = (params: WaveformParams, numPoints: number): DataPoint[] => {
  const { amplitude, frequency, phase, dcOffset, timeWindowMs } = params;
  const period = 1 / frequency;
  const phaseSeconds = (phase / 360) * period;

  return generatePoints(numPoints, timeWindowMs, (t) => {
    const timeIntoCycle = (t + phaseSeconds) % period;
    // Linear ramp from -A to +A
    const value = (2 * amplitude / period) * timeIntoCycle - amplitude;
    return value + dcOffset;
  });
};

