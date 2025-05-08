// src/types/waveform.ts

export type WaveformType = 'sine' | 'square' | 'triangle' | 'sawtooth';

export interface WaveformParams {
  type: WaveformType;
  amplitude: number;      // Volts
  frequency: number;      // Hz (1 to 1,000,000)
  phase: number;          // Degrees
  dcOffset: number;       // Volts
  cyclesToDisplay: number; // Number of cycles to show in the time window
  samplingRateHz: number; // Samples per second (e.g., 100Hz to 10MHz)
  // timeWindowMs is now derived from frequency and cyclesToDisplay in the generator component
}

export interface DataPoint {
  time: number;    // Time in base unit (seconds) for calculation, converted to ms/µs/s for plot
  voltage: number; // Volts
}

