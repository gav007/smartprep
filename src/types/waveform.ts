// src/types/waveform.ts

export type WaveformType = 'sine' | 'square' | 'triangle' | 'sawtooth';

export interface WaveformParams {
  type: WaveformType;
  amplitude: number;      // Volts
  frequency: number;      // Hz (1 to 1,000,000)
  phase: number;          // Degrees
  dcOffset: number;       // Volts
  timeWindowMs: number;   // Milliseconds (0.001 ms for 1µs, up to 1000 ms for 1s)
  samplingRateHz: number; // Samples per second (up to 10,000,000)
}

export interface DataPoint {
  time: number;    // Milliseconds (for plot X-axis)
  voltage: number; // Volts
}
