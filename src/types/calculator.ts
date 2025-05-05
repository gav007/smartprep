/**
 * Represents an IPv4 address.
 */
export interface IPv4Address {
  octet1: number;
  octet2: number;
  octet3: number;
  octet4: number;
}

/**
 * Represents the result of a subnet calculation.
 */
export interface SubnetResult {
  ipAddress: string;
  cidr: number;
  subnetMask: string;
  networkAddress: string;
  broadcastAddress: string;
  firstUsableHost: string;
  lastUsableHost: string;
  totalHosts: number;
  usableHosts: number;
  wildcardMask: string;
  binarySubnetMask: string;
  binaryIpAddress?: string; // Optional: Binary representation of the input IP
  binaryNetworkAddress?: string; // Optional: Binary representation of the network address
  binaryBroadcastAddress?: string; // Optional: Binary representation of the broadcast address
  ipClass?: string; // Optional: A, B, C, D, E
  isPrivate?: boolean; // Optional: If the IP is in a private range
}

/**
 * Types for Base Converter
 */
export type ConversionBase = 'bin' | 'dec' | 'hex';

export interface ConversionResult {
  binary: string;
  decimal: string;
  hexadecimal: string;
}

/**
 * Types for Waveform Generator
 */
export type WaveformType = 'sine' | 'square' | 'triangle';

export interface WaveformParams {
  type: WaveformType;
  frequency: number; // Hz
  amplitude: number; // Volts Peak
  phase?: number; // Degrees (optional)
  duration?: number; // Seconds (optional, for generating data points)
  samples?: number; // Number of data points (optional)
}

export interface WaveformDataPoint {
  time: number;
  voltage: number;
}


/**
 * Types for Resistor Calculator
 */
 export type ResistorBandColor =
 | 'black' | 'brown' | 'red' | 'orange' | 'yellow'
 | 'green' | 'blue' | 'violet' | 'gray' | 'white'
 | 'gold' | 'silver' | 'none';

export interface ResistorBands {
 band1?: ResistorBandColor;
 band2?: ResistorBandColor;
 band3?: ResistorBandColor; // Digit or Multiplier (4-band)
 multiplier?: ResistorBandColor; // Band 4 (5/6-band) or Band 3 (4-band)
 tolerance?: ResistorBandColor; // Band 5 (5/6-band) or Band 4 (4-band)
 tempCoefficient?: ResistorBandColor; // Band 6 (6-band)
}

export interface ResistorResult {
 resistance: number | null; // Ohms
 tolerance: number | null; // Percentage
 tempCoefficient: number | null; // ppm/°C
 resistanceString: string; // Formatted string e.g., "4.7 kΩ"
}

export const ResistorColorMap: Record<
  ResistorBandColor,
  { digit?: number; multiplier?: number; tolerance?: number; tempCoefficient?: number }
> = {
  black: { digit: 0, multiplier: 1 },
  brown: { digit: 1, multiplier: 10, tolerance: 1, tempCoefficient: 100 },
  red: { digit: 2, multiplier: 100, tolerance: 2, tempCoefficient: 50 },
  orange: { digit: 3, multiplier: 1000, tempCoefficient: 15 },
  yellow: { digit: 4, multiplier: 10000, tempCoefficient: 25 },
  green: { digit: 5, multiplier: 100000, tolerance: 0.5 },
  blue: { digit: 6, multiplier: 1000000, tolerance: 0.25, tempCoefficient: 10 },
  violet: { digit: 7, multiplier: 10000000, tolerance: 0.1, tempCoefficient: 5 },
  gray: { digit: 8, multiplier: 100000000, tolerance: 0.05, tempCoefficient: 1 },
  white: { digit: 9, multiplier: 1000000000 },
  gold: { multiplier: 0.1, tolerance: 5 },
  silver: { multiplier: 0.01, tolerance: 10 },
  none: { tolerance: 20 },
};
