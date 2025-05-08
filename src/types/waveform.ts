// src/types/waveform.ts

export type WaveformType = 'sine' | 'square' | 'triangle' | 'sawtooth';

export interface WaveformParams {
  type: WaveformType;
  amplitude: number;      // Volts
  frequency: number;      // Hz (1 to 1,000,000)
  phase: number;          // Degrees
  dcOffset: number;       // Volts
  // cyclesToDisplay: number; // Removed, timeWindowMs is now primary
  samplingRateHz: number; // Samples per second (e.g., 100Hz to 10MHz)
  timeWindowMs: number; // Total time duration to plot, in milliseconds
  timeForInstantaneousVoltageMs?: number; // Specific time 't' to calculate v(t), in milliseconds
}

export interface DataPoint {
  time: number;    // Time in base unit (seconds) for calculation, converted to ms/µs/s for plot
  voltage: number; // Volts
}


