// src/types/waveform.ts

export type WaveformType = 'sine' | 'square' | 'triangle' | 'sawtooth';

export interface WaveformParams {
  type: WaveformType;
  amplitude: number;      // Volts
  frequency: number;      // Hz
  phase: number;          // Degrees
  dcOffset: number;       // Volts
  timeWindowMs: number;   // Milliseconds
  samplingRateHz: number; // Samples per second
}

export interface DataPoint {
  time: number;    // Milliseconds
  voltage: number; // Volts
}
