// src/types/calculator.ts
import type { Unit, VariableCategory } from '@/lib/units'; // Import central Unit type & VariableCategory

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
  binaryIpAddress?: string;
  binaryNetworkAddress?: string;
  binaryBroadcastAddress?: string;
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
 * Types for Resistor Calculator
 */
 export type ResistorBandColor =
 | 'black' | 'brown' | 'red' | 'orange' | 'yellow'
 | 'green' | 'blue' | 'violet' | 'gray' | 'white'
 | 'gold' | 'silver' | 'none';

// ResistorBands uses optional fields, allowing calculation logic to handle missing bands based on numBands.
export interface ResistorBands {
 band1?: ResistorBandColor;
 band2?: ResistorBandColor;
 band3?: ResistorBandColor; // Digit (5/6) OR Multiplier (4)
 multiplier?: ResistorBandColor; // Multiplier (5/6) OR Tolerance (4)
 tolerance?: ResistorBandColor; // Tolerance (5/6)
 tempCoefficient?: ResistorBandColor; // TempCo (6)
}

export interface ResistorResult {
 resistance: number | null; // Ohms
 tolerance: number | null; // Percentage
 tempCoefficient: number | null; // ppm/°C
 resistanceString: string; // Formatted string e.g., "4.7 kΩ"
}


/**
 * Types for Converter Game
 */
export interface GameOption {
  key: string; // e.g., 'A', 'B', 'C'
  label: string; // Formatted string, e.g., "2000 µA"
  valueInTargetUnit: number; // The numerical value corresponding to the label, in the target unit's base magnitude
}

export interface ConverterGameQuestion {
  id: string;
  originalValue: number; 
  originalUnit: Unit;    
  targetUnit: Unit;      
  category: VariableCategory; // Added category for formatting context
  promptText: string;    
  options: GameOption[];
  correctAnswerKey: string;
  difficulty: number; 
}

