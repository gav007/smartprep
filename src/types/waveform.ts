// src/types/waveform.ts

export type WaveformType = 'sine' | 'square' | 'triangle' | 'sawtooth';

export interface WaveformParams {
  type: WaveformType;
  amplitude: number;      // Volts (can be string for input control)
  frequency: number;      // Hz (1 to 500,000) (can be string for input control)
  phase: number;          // Degrees
  dcOffset: number;       // Volts (can be string for input control)
  samplingRateHz: number; // Samples per second (e.g., 100Hz to 10MHz)
  timeWindowMs: number; // Total time duration to plot, in milliseconds
  timeForInstantaneousVoltageMs?: number; // Specific time 't' to calculate v(t), in milliseconds
}

export interface DataPoint {
  time: number;    // Time in base unit (seconds)
  voltage: number; // Volts
}
