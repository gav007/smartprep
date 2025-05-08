// src/lib/waveform-utils.ts
import type { DataPoint, WaveformParams } from '@/types/waveform';

const generatePoints = (numPoints: number, timeWindowMs: number, generatorFunc: (tSeconds: number) => number): DataPoint[] => {
  const points: DataPoint[] = [];
  const timeWindowSeconds = timeWindowMs / 1000;
  const timeStepSeconds = numPoints > 1 ? timeWindowSeconds / (numPoints - 1) : 0;


  for (let i = 0; i < numPoints; i++) {
    const tSeconds = i * timeStepSeconds;
    points.push({ time: tSeconds, voltage: generatorFunc(tSeconds) });
  }
   // Ensure the last point is exactly at timeWindowSeconds if numPoints > 1 and timeWindow > 0
   if (numPoints > 1 && timeWindowSeconds > 0 && points.length > 0 && points[points.length-1].time !== timeWindowSeconds) {
      // Adjust last point or add if slightly off due to floating point arithmetic
      // This can be tricky; for simplicity, we rely on the loop generating close enough points.
      // Or, ensure the loop runs up to and including timeWindowSeconds:
      // for (let tSeconds = 0; tSeconds <= timeWindowSeconds; tSeconds += timeStepSeconds) { ... }
      // but this might generate more points than numPoints.
      // Let's accept minor float deviations for now or adjust if critical.
   }


  return points;
};

export const generateSineWave = (params: WaveformParams & {timeWindowMs: number}, numPoints: number): DataPoint[] => {
  const { amplitude, frequency, phase, dcOffset, timeWindowMs } = params;
  const phaseRad = phase * (Math.PI / 180); 
  const omega = 2 * Math.PI * frequency;
  return generatePoints(numPoints, timeWindowMs, (t) => 
    amplitude * Math.sin(omega * t + phaseRad) + dcOffset
  );
};

export const generateSquareWave = (params: WaveformParams & {timeWindowMs: number}, numPoints: number): DataPoint[] => {
  const { amplitude, frequency, phase, dcOffset, timeWindowMs } = params;
  if (frequency === 0) { // DC line if frequency is zero
    return generatePoints(numPoints, timeWindowMs, () => amplitude + dcOffset);
  }
  const period = 1 / frequency;
  const phaseSeconds = (phase / 360) * period; 

  return generatePoints(numPoints, timeWindowMs, (t) => {
    const timeIntoCycle = (t + phaseSeconds + period) % period; // Ensure positive for modulo
    const value = timeIntoCycle < period / 2 ? amplitude : -amplitude;
    return value + dcOffset;
  });
};

export const generateTriangleWave = (params: WaveformParams & {timeWindowMs: number}, numPoints: number): DataPoint[] => {
  const { amplitude, frequency, phase, dcOffset, timeWindowMs } = params;
  if (frequency === 0) { // DC line if frequency is zero
      return generatePoints(numPoints, timeWindowMs, () => dcOffset); // Triangle at f=0 is just offset
  }
  const period = 1 / frequency;
  const phaseSeconds = (phase / 360) * period;

  return generatePoints(numPoints, timeWindowMs, (t) => {
    const timeIntoCycle = (t + phaseSeconds + period) % period;
    let value;
    if (timeIntoCycle < period / 2) {
      value = (4 * amplitude / period) * timeIntoCycle - amplitude;
    } else {
      value = (-4 * amplitude / period) * (timeIntoCycle - (period / 2)) + amplitude;
    }
    return value + dcOffset;
  });
};

export const generateSawtoothWave = (params: WaveformParams & {timeWindowMs: number}, numPoints: number): DataPoint[] => {
  const { amplitude, frequency, phase, dcOffset, timeWindowMs } = params;
  if (frequency === 0) { // DC line if frequency is zero
      return generatePoints(numPoints, timeWindowMs, () => dcOffset); // Sawtooth at f=0 is just offset
  }
  const period = 1 / frequency;
  const phaseSeconds = (phase / 360) * period; 

  return generatePoints(numPoints, timeWindowMs, (t) => {
    const timeIntoCycle = (t + phaseSeconds + period) % period;
    const value = (2 * amplitude / period) * timeIntoCycle - amplitude;
    return value + dcOffset;
  });
};
