// src/types/waveform.ts
import type { TimeUnit } from '@/lib/units';

export type WaveformType = 'sine' | 'square' | 'triangle' | 'sawtooth';

export interface WaveformParams {
  type: WaveformType;
  amplitude: number;      
  frequency: number;      
  phase: number;          
  dcOffset: number;       
  samplingRateHz: number; 
  timeWindowMs: number; 
  timeForInstantaneousVoltageMs?: number; 
  timeForInstantaneousVoltageUnit?: TimeUnit; // Added to store the selected unit for 't'
}

export interface DataPoint {
  time: number;    // Time in base unit (seconds)
  voltage: number; // Volts
}

