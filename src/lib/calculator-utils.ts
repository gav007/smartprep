'use client'; // Mark as client component if using browser APIs or state hooks directly, otherwise keep as server logic if possible

import type { SubnetResult, IPv4Address, ConversionResult, ConversionBase, ResistorBands, ResistorResult, ResistorBandColor, WaveformDataPoint, WaveformParams } from '@/types/calculator';
import { ResistorColorMap } from '@/types/calculator';


// --- IP Address and Subnetting Utilities ---

/**
 * Validates an IPv4 address string.
 */
export function isValidIPv4(ip: string): boolean {
  if (typeof ip !== 'string') return false;
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(part => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255 && String(num) === part;
  });
}

/**
 * Converts an IP string to an IPv4Address object.
 * Returns null if the IP is invalid.
 */
export function ipStringToObject(ip: string): IPv4Address | null {
  if (!isValidIPv4(ip)) return null;
  const parts = ip.split('.').map(Number);
  return { octet1: parts[0], octet2: parts[1], octet3: parts[2], octet4: parts[3] };
}

/**
 * Converts an IPv4Address object to a string.
 */
export function ipObjectToString(ip: IPv4Address): string {
  return `${ip.octet1}.${ip.octet2}.${ip.octet3}.${ip.octet4}`;
}

/**
 * Converts a decimal number (0-255) to an 8-bit binary string.
 */
export function decToBinaryOctet(dec: number): string {
  return dec.toString(2).padStart(8, '0');
}

/**
 * Converts an IPv4 string to its binary representation (dotted).
 */
export function ipToBinaryString(ip: string): string | null {
  const ipObj = ipStringToObject(ip);
  if (!ipObj) return null;
  return `${decToBinaryOctet(ipObj.octet1)}.${decToBinaryOctet(ipObj.octet2)}.${decToBinaryOctet(ipObj.octet3)}.${decToBinaryOctet(ipObj.octet4)}`;
}

/**
 * Converts a CIDR prefix length to a subnet mask string.
 */
export function cidrToSubnetMask(cidr: number): string {
  if (cidr < 0 || cidr > 32) throw new Error("Invalid CIDR value");
  const mask = (0xFFFFFFFF << (32 - cidr)) >>> 0; // Use >>> 0 for unsigned right shift
  return ipObjectToString({
    octet1: (mask >> 24) & 255,
    octet2: (mask >> 16) & 255,
    octet3: (mask >> 8) & 255,
    octet4: mask & 255,
  });
}

/**
 * Converts a CIDR prefix length to a wildcard mask string.
 */
export function cidrToWildcardMask(cidr: number): string {
    if (cidr < 0 || cidr > 32) throw new Error("Invalid CIDR value");
    const mask = (~(0xFFFFFFFF << (32 - cidr))) >>> 0; // Invert subnet mask bits
    return ipObjectToString({
      octet1: (mask >> 24) & 255,
      octet2: (mask >> 16) & 255,
      octet3: (mask >> 8) & 255,
      octet4: mask & 255,
    });
}


/**
 * Calculates subnet details.
 */
export function calculateSubnetDetails(ip: string, cidr: number): SubnetResult | null {
  if (!isValidIPv4(ip) || cidr < 0 || cidr > 32) return null;

  const ipNum = ipStringToNumber(ip);
  const maskNum = (0xFFFFFFFF << (32 - cidr)) >>> 0;
  const networkNum = (ipNum & maskNum) >>> 0;
  const broadcastNum = (networkNum | (~maskNum >>> 0)) >>> 0;

  const firstHostNum = networkNum + 1;
  const lastHostNum = broadcastNum - 1;

  const totalHosts = Math.pow(2, 32 - cidr);
  // For /31 and /32, usable hosts calculation differs or is 0
  let usableHosts: number;
  if (cidr >= 31) {
      usableHosts = 0; // Special cases for point-to-point or single host
  } else {
      usableHosts = totalHosts - 2;
  }


  const subnetMask = cidrToSubnetMask(cidr);
  const wildcardMask = cidrToWildcardMask(cidr);

  return {
    ipAddress: ip,
    cidr: cidr,
    subnetMask: subnetMask,
    networkAddress: ipNumberToString(networkNum),
    broadcastAddress: ipNumberToString(broadcastNum),
     // Handle edge cases for /31 and /32 where first/last might equal network/broadcast
    firstUsableHost: cidr >= 31 ? "N/A" : ipNumberToString(firstHostNum),
    lastUsableHost: cidr >= 31 ? "N/A" : ipNumberToString(lastHostNum),
    totalHosts: totalHosts,
    usableHosts: usableHosts < 0 ? 0 : usableHosts, // Ensure usableHosts is not negative
    wildcardMask: wildcardMask,
    binarySubnetMask: ipToBinaryString(subnetMask) || '',
    binaryIpAddress: ipToBinaryString(ip) || undefined,
    binaryNetworkAddress: ipToBinaryString(ipNumberToString(networkNum)) || undefined,
    binaryBroadcastAddress: ipToBinaryString(ipNumberToString(broadcastNum)) || undefined,
     // Optional fields can be calculated here if needed
     // ipClass: calculateIpClass(ip),
     // isPrivate: isPrivateIp(ip),
  };
}

// Helper to convert IP string to a 32-bit number
function ipStringToNumber(ip: string): number {
  return ip.split('.').reduce((res, octet) => (res << 8) | parseInt(octet, 10), 0) >>> 0;
}

// Helper to convert a 32-bit number to an IP string
function ipNumberToString(ipNum: number): string {
  return `${(ipNum >>> 24)}.${(ipNum >> 16) & 255}.${(ipNum >> 8) & 255}.${ipNum & 255}`;
}


// --- Base Conversion Utilities ---

/**
 * Converts a value from one base to another.
 * Handles potential errors and returns null if conversion fails.
 */
export function convertBase(value: string, fromBase: ConversionBase, toBase: ConversionBase): string | null {
  if (!value) return ''; // Handle empty input gracefully

  let decimalValue: number;

  try {
    switch (fromBase) {
      case 'bin':
         // Validate binary string
        if (!/^[01]+$/.test(value)) return null; // Invalid binary input
        decimalValue = parseInt(value, 2);
        break;
      case 'dec':
         // Validate decimal string
        if (!/^\d+$/.test(value)) return null; // Invalid decimal input
        decimalValue = parseInt(value, 10);
        break;
      case 'hex':
         // Validate hex string
        if (!/^[0-9a-fA-F]+$/.test(value)) return null; // Invalid hex input
        decimalValue = parseInt(value, 16);
        break;
      default:
        return null; // Should not happen
    }

    // Check if parsing resulted in NaN (e.g., for very large numbers exceeding limits)
    if (isNaN(decimalValue)) {
       return null;
    }

  } catch (e) {
    return null; // Error during parsing
  }


  try {
    switch (toBase) {
      case 'bin':
        return decimalValue.toString(2);
      case 'dec':
        return decimalValue.toString(10);
      case 'hex':
        return decimalValue.toString(16).toUpperCase();
      default:
        return null; // Should not happen
    }
  } catch (e) {
     return null; // Error during conversion to target base (less likely but possible)
  }
}

/**
 * Performs all three base conversions for a given input value and its base.
 */
export function performConversions(inputValue: string, inputBase: ConversionBase): ConversionResult | null {
    if (!inputValue) {
        return { binary: '', decimal: '', hexadecimal: '' };
    }

    const binary = inputBase === 'bin' ? inputValue : convertBase(inputValue, inputBase, 'bin');
    const decimal = inputBase === 'dec' ? inputValue : convertBase(inputValue, inputBase, 'dec');
    const hexadecimal = inputBase === 'hex' ? inputValue.toUpperCase() : convertBase(inputValue, inputBase, 'hex');

    // If any conversion failed, return null to indicate error
    if (binary === null || decimal === null || hexadecimal === null) {
        return null;
    }

    return { binary, decimal, hexadecimal };
}

/**
 * Formats a binary string into 8-bit chunks.
 */
export function formatBinaryString(binary: string): string {
  if (!binary) return '';
  // Pad with leading zeros if needed to make length a multiple of 8
  const paddedBinary = binary.padStart(Math.ceil(binary.length / 8) * 8, '0');
  return paddedBinary.match(/.{1,8}/g)?.join(' ') || '';
}


// --- Resistor Calculation Utilities ---

function getBandValue(color: ResistorBandColor | undefined, type: 'digit' | 'multiplier' | 'tolerance' | 'tempCoefficient'): number | null {
    if (!color || color === 'none') return null;
    const value = ResistorColorMap[color]?.[type];
    return value === undefined ? null : value;
}

function formatResistance(ohms: number | null): string {
    if (ohms === null) return 'N/A';
    if (ohms >= 1e9) return (ohms / 1e9).toFixed(2) + ' GΩ';
    if (ohms >= 1e6) return (ohms / 1e6).toFixed(2) + ' MΩ';
    if (ohms >= 1e3) return (ohms / 1e3).toFixed(2) + ' kΩ';
    return ohms.toFixed(2) + ' Ω';
}


/**
 * Calculates resistor properties from color bands (4, 5, or 6 bands).
 */
export function calculateResistorFromBands(bands: ResistorBands): ResistorResult {
    let resistance: number | null = null;
    let tolerance: number | null = null;
    let tempCoefficient: number | null = null;
    let significantDigits = '';
    let multiplierValue: number | null = null;

    const d1 = getBandValue(bands.band1, 'digit');
    const d2 = getBandValue(bands.band2, 'digit');
    const d3 = getBandValue(bands.band3, 'digit'); // Only for 5/6 band

    if (bands.tempCoefficient !== undefined) { // 6-band resistor
        if (d1 !== null && d2 !== null && d3 !== null) {
            significantDigits = `${d1}${d2}${d3}`;
            multiplierValue = getBandValue(bands.multiplier, 'multiplier');
            tolerance = getBandValue(bands.tolerance, 'tolerance');
            tempCoefficient = getBandValue(bands.tempCoefficient, 'tempCoefficient');
        }
    } else if (bands.tolerance !== undefined && bands.multiplier !== undefined) { // 5-band resistor
        if (d1 !== null && d2 !== null && d3 !== null) {
            significantDigits = `${d1}${d2}${d3}`;
            multiplierValue = getBandValue(bands.multiplier, 'multiplier');
            tolerance = getBandValue(bands.tolerance, 'tolerance');
        }
    } else { // 4-band resistor (assume band3 is multiplier, band4 is tolerance)
        if (d1 !== null && d2 !== null) {
            significantDigits = `${d1}${d2}`;
            // In 4-band, band3 is the multiplier, band4 is tolerance
            multiplierValue = getBandValue(bands.band3, 'multiplier');
            tolerance = getBandValue(bands.multiplier, 'tolerance'); // Use multiplier field which holds band 4 for 4-band case
        }
    }


    if (significantDigits && multiplierValue !== null) {
        resistance = parseInt(significantDigits, 10) * multiplierValue;
    }


     // Handle 'none' color explicitly for tolerance if needed by design
     if (bands.tolerance === 'none') {
         tolerance = 20;
     } else if (tolerance === null && bands.tolerance) {
         tolerance = getBandValue(bands.tolerance, 'tolerance'); // Re-check if tolerance band exists but value was initially null
     }

     // Special case for 4-band, where multiplier field holds tolerance color
     if (!bands.tempCoefficient && !bands.multiplier && bands.band3) {
         // If it's likely a 4 band (no explicit multiplier/tolerance fields set, but band3 exists)
         // Check if band4 (stored in multiplier field in the input 'bands' object for 4-band case) gives a tolerance
         const potentialTol = getBandValue(bands.multiplier, 'tolerance');
         if (potentialTol !== null) {
            tolerance = potentialTol;
         } else if (bands.multiplier === 'none') {
            tolerance = 20;
         }
     }


    return {
        resistance: resistance,
        tolerance: tolerance,
        tempCoefficient: tempCoefficient,
        resistanceString: formatResistance(resistance),
    };
}


// --- Waveform Generation Utilities ---

/**
 * Generates data points for a given waveform.
 */
export function generateWaveformData(params: WaveformParams): WaveformDataPoint[] {
  const { type, frequency, amplitude, phase = 0, duration = 1 / frequency * 2, samples = 100 } = params;
  const data: WaveformDataPoint[] = [];
  const angularFrequency = 2 * Math.PI * frequency;
  const phaseRad = phase * (Math.PI / 180);
  const timeStep = duration / (samples - 1);

  for (let i = 0; i < samples; i++) {
    const time = i * timeStep;
    let voltage = 0;

    switch (type) {
      case 'sine':
        voltage = amplitude * Math.sin(angularFrequency * time + phaseRad);
        break;
      case 'square':
        // Approximation: use sine and check sign, or use modulo for sharp edges
        // voltage = amplitude * Math.sign(Math.sin(angularFrequency * time + phaseRad));
         const cycleTime = time % (1 / frequency);
         voltage = cycleTime < (0.5 / frequency) ? amplitude : -amplitude;
        break;
      case 'triangle':
         const period = 1 / frequency;
         const timeInCycle = (time + phaseRad / angularFrequency) % period;
         if (timeInCycle < period / 2) {
             // Rising edge
             voltage = -amplitude + (4 * amplitude / period) * timeInCycle;
         } else {
             // Falling edge
             voltage = 3 * amplitude - (4 * amplitude / period) * timeInCycle;
         }
        break;
    }
    data.push({ time, voltage });
  }
  return data;
}
