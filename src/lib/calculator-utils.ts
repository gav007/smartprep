// src/lib/calculator-utils.ts
'use client'; // Mark as client component if using browser APIs or state hooks directly, otherwise keep as server logic if possible

import type { SubnetResult, IPv4Address, ConversionResult, ConversionBase, ResistorBands, ResistorResult, ResistorBandColor } from '@/types/calculator';
import { unitMultipliers } from './units'; // Import centralized unit multipliers

// --- IP Address and Subnetting Utilities ---

export function isValidIPv4(ip: string): boolean {
  if (typeof ip !== 'string') return false;
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(part => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255 && String(num) === part;
  });
}

export function ipStringToObject(ip: string): IPv4Address | null {
  if (!isValidIPv4(ip)) return null;
  const parts = ip.split('.').map(Number);
  return { octet1: parts[0], octet2: parts[1], octet3: parts[2], octet4: parts[3] };
}

export function ipObjectToString(ip: IPv4Address): string {
  return `${ip.octet1}.${ip.octet2}.${ip.octet3}.${ip.octet4}`;
}

export function decToBinaryOctet(dec: number): string {
   if (isNaN(dec) || dec < 0 || dec > 255) {
       console.error("Invalid decimal for octet conversion:", dec);
       return '00000000';
   }
  return dec.toString(2).padStart(8, '0');
}

export function ipToBinaryString(ip: string): string | null {
  const ipObj = ipStringToObject(ip);
  if (!ipObj) return null;
  return `${decToBinaryOctet(ipObj.octet1)}.${decToBinaryOctet(ipObj.octet2)}.${decToBinaryOctet(ipObj.octet3)}.${decToBinaryOctet(ipObj.octet4)}`;
}

export function cidrToSubnetMask(cidr: number): string {
  if (cidr < 0 || cidr > 32 || isNaN(cidr)) throw new Error("Invalid CIDR value");
  if (cidr === 0) return '0.0.0.0';
  const mask = (0xFFFFFFFF << (32 - cidr)) >>> 0;
  return ipObjectToString({
    octet1: (mask >>> 24) & 255,
    octet2: (mask >>> 16) & 255,
    octet3: (mask >>> 8) & 255,
    octet4: mask & 255,
  });
}

export function cidrToWildcardMask(cidr: number): string {
    if (cidr < 0 || cidr > 32 || isNaN(cidr)) throw new Error("Invalid CIDR value");
    if (cidr === 32) return '0.0.0.0';
    if (cidr === 0) return '255.255.255.255';
    const mask = (~(0xFFFFFFFF << (32 - cidr))) >>> 0;
    return ipObjectToString({
      octet1: (mask >>> 24) & 255,
      octet2: (mask >>> 16) & 255,
      octet3: (mask >>> 8) & 255,
      octet4: mask & 255,
    });
}

export function calculateSubnetDetails(ip: string, cidr: number): SubnetResult | null {
  if (!isValidIPv4(ip)) throw new Error('Invalid IPv4 address format.');
  if (cidr < 0 || cidr > 32 || isNaN(cidr)) throw new Error('Invalid CIDR value (must be 0-32).');

  const ipNum = ipStringToNumber(ip);
  const maskNum = cidr === 0 ? 0 : (0xFFFFFFFF << (32 - cidr)) >>> 0;
  const networkNum = (ipNum & maskNum) >>> 0;
  const broadcastNum = cidr === 32 ? networkNum : (networkNum | (~maskNum >>> 0)) >>> 0;

  const firstHostNum = cidr >= 31 ? networkNum : networkNum + 1;
  const lastHostNum = cidr >= 31 ? networkNum : broadcastNum - 1;

  const totalHosts = Math.pow(2, 32 - cidr);
  let usableHosts: number;
  if (cidr >= 31) usableHosts = 0;
  else usableHosts = totalHosts - 2;

  const subnetMask = cidrToSubnetMask(cidr);
  const wildcardMask = cidrToWildcardMask(cidr);
  const networkAddress = ipNumberToString(networkNum);
  const broadcastAddress = ipNumberToString(broadcastNum);

  return {
    ipAddress: ip,
    cidr: cidr,
    subnetMask: subnetMask,
    networkAddress: networkAddress,
    broadcastAddress: broadcastAddress,
    firstUsableHost: cidr >= 31 ? "N/A" : ipNumberToString(firstHostNum),
    lastUsableHost: cidr >= 31 ? "N/A" : ipNumberToString(lastHostNum),
    totalHosts: totalHosts,
    usableHosts: Math.max(0, usableHosts),
    wildcardMask: wildcardMask,
    binarySubnetMask: ipToBinaryString(subnetMask) || '',
    binaryIpAddress: ipToBinaryString(ip) || undefined,
    binaryNetworkAddress: ipToBinaryString(networkAddress) || undefined,
    binaryBroadcastAddress: ipToBinaryString(broadcastAddress) || undefined,
  };
}

function ipStringToNumber(ip: string): number {
  return ip.split('.').reduce((res, octet) => (res * 256) + parseInt(octet, 10), 0);
}

function ipNumberToString(ipNum: number): string {
  return `${(ipNum >>> 24)}.${(ipNum >>> 16) & 255}.${(ipNum >>> 8) & 255}.${ipNum & 255}`;
}

// --- Base Conversion Utilities ---

export function convertBase(value: string, fromBase: ConversionBase, toBase: ConversionBase): string | null {
  if (!value) return '';
  let decimalValue: bigint;

  try {
    switch (fromBase) {
      case 'bin':
        if (!/^[01]+$/.test(value)) return null;
        decimalValue = BigInt(`0b${value}`);
        break;
      case 'dec':
        if (!/^\d+$/.test(value)) return null;
        decimalValue = BigInt(value);
        break;
      case 'hex':
        if (!/^[0-9a-fA-F]+$/.test(value)) return null;
        decimalValue = BigInt(`0x${value}`);
        break;
      default: return null;
    }
  } catch (e) {
    console.error("Error parsing input value:", e);
    return null;
  }

  try {
    switch (toBase) {
      case 'bin': return decimalValue.toString(2);
      case 'dec': return decimalValue.toString(10);
      case 'hex': return decimalValue.toString(16).toUpperCase();
      default: return null;
    }
  } catch (e) {
     console.error("Error converting to target base:", e);
     return null;
  }
}

export function performConversions(inputValue: string, inputBase: ConversionBase): ConversionResult | null {
    if (!inputValue) {
        return { binary: '', decimal: '', hexadecimal: '' };
    }
    const binary = inputBase === 'bin' ? inputValue : convertBase(inputValue, inputBase, 'bin');
    const decimal = inputBase === 'dec' ? inputValue : convertBase(inputValue, inputBase, 'dec');
    const hexadecimal = inputBase === 'hex' ? inputValue.toUpperCase() : convertBase(inputValue, inputBase, 'hex');

    if (binary === null || decimal === null || hexadecimal === null) {
        return null;
    }
    return { binary, decimal, hexadecimal };
}

export function formatBinaryString(binary: string, bits: number = 8): string {
  if (!binary) return '';
  const desiredLength = Math.ceil(binary.length / bits) * bits;
  const paddedBinary = binary.padStart(desiredLength, '0');
  const regex = new RegExp(`.{1,${bits}}`, 'g');
  const chunks = paddedBinary.match(regex);
  return chunks ? chunks.join(' ') : '';
}

export function formatIpBinaryString(binary?: string): string {
  if (!binary) return 'N/A';
  const fullBinary = binary.replace(/\s|\./g, '').padStart(32, '0');
  if (fullBinary.length !== 32) return 'Invalid Binary Length';
  const octet1 = fullBinary.substring(0, 8);
  const octet2 = fullBinary.substring(8, 16);
  const octet3 = fullBinary.substring(16, 24);
  const octet4 = fullBinary.substring(24, 32);
  return `${octet1}.${octet2}.${octet3}.${octet4}`;
}

// --- Resistor Calculation Utilities ---

// Move ResistorColorMap here to be self-contained within calculator-utils
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
  gray: { digit: 8, multiplier: 100000000, tolerance: 0.05, tempCoefficient: 1 }, // Added gray tempco
  white: { digit: 9, multiplier: 1000000000 },
  gold: { multiplier: 0.1, tolerance: 5 },
  silver: { multiplier: 0.01, tolerance: 10 },
  none: { tolerance: 20 },
};


function getBandValue(color: ResistorBandColor | undefined, type: 'digit' | 'multiplier' | 'tolerance' | 'tempCoefficient'): number | null {
    if (!color) return null;
    if (color === 'none') return type === 'tolerance' ? 20 : null;
    const colorData = ResistorColorMap[color];
    if (!colorData || !(type in colorData)) return null;
    const value = colorData[type];
    return value === undefined ? null : value;
}

function formatResistance(ohms: number | null): string {
    if (ohms === null || !isFinite(ohms)) return 'N/A';
    if (ohms === 0) return '0 Ω';
    const absOhms = Math.abs(ohms);
    let value: number;
    let suffix: string;

    if (absOhms >= 1e9) { value = ohms / 1e9; suffix = ' GΩ'; }
    else if (absOhms >= 1e6) { value = ohms / 1e6; suffix = ' MΩ'; }
    else if (absOhms >= 1e3) { value = ohms / 1e3; suffix = ' kΩ'; }
    else { value = ohms; suffix = ' Ω'; }

    let precision = 2;
    if (Math.abs(value) < 10) precision = 3;
    if (Math.abs(value) < 1) precision = 4;

    let formattedValue = parseFloat(value.toFixed(precision)).toString();
    return formattedValue + suffix;
}

export function calculateResistorFromBands(bands: ResistorBands, numBands: 4 | 5 | 6): ResistorResult {
    let resistance: number | null = null;
    let tolerance: number | null = null;
    let tempCoefficient: number | null = null;
    let significantDigits = '';
    let multiplierValue: number | null = null;

    const d1 = getBandValue(bands.band1, 'digit');
    const d2 = getBandValue(bands.band2, 'digit');

    if (d1 === null || d2 === null) {
        return { resistance: null, tolerance: null, tempCoefficient: null, resistanceString: 'N/A' };
    }

    const multiplierBandKey: keyof ResistorBands = numBands === 4 ? 'band3' : 'multiplier';
    const toleranceBandKey: keyof ResistorBands = numBands === 4 ? 'multiplier' : 'tolerance';

    const mult = getBandValue(bands[multiplierBandKey], 'multiplier');
    const tol = getBandValue(bands[toleranceBandKey], 'tolerance');

    if (numBands === 4) {
        if (mult === null || tol === null) {
             return { resistance: null, tolerance: tol, tempCoefficient: null, resistanceString: 'N/A' }; // Allow tolerance display even if multiplier invalid
        }
        significantDigits = `${d1}${d2}`;
        multiplierValue = mult;
        tolerance = tol;
    } else { // 5 or 6 bands
        const d3 = getBandValue(bands.band3, 'digit');
        if (d3 === null || mult === null || tol === null) {
            return { resistance: null, tolerance: tol, tempCoefficient: null, resistanceString: 'N/A' };
        }
        significantDigits = `${d1}${d2}${d3}`;
        multiplierValue = mult;
        tolerance = tol;
        if (numBands === 6) {
            tempCoefficient = getBandValue(bands.tempCoefficient, 'tempCoefficient'); // Optional
        }
    }

    if (significantDigits && multiplierValue !== null && isFinite(multiplierValue)) {
        resistance = parseInt(significantDigits, 10) * multiplierValue;
    } else {
        resistance = null;
    }

    return {
        resistance: resistance,
        tolerance: tolerance,
        tempCoefficient: tempCoefficient,
        resistanceString: formatResistance(resistance),
    };
}

// --- Value to Bands ---
export function parseResistanceValue(valueStr: string): number | null {
    if (!valueStr) return null;
    const cleanedStr = valueStr.trim().replace(/,/g, '').toUpperCase();
    let multiplier = 1;
    let numPart = cleanedStr.replace(/Ω|OHMS?/i, '');

    const prefixes: { [key: string]: number } = { T: 1e12, G: 1e9, M: 1e6, K: 1e3 };

    for (const prefix in prefixes) {
        if (numPart.endsWith(prefix)) {
            multiplier = prefixes[prefix];
            numPart = numPart.slice(0, -prefix.length);
            break;
        }
    }
    if (multiplier === 1) {
        for (const prefix in prefixes) {
            const index = numPart.indexOf(prefix);
             if (index > 0 && index < numPart.length - 1 && /^\d$/.test(numPart[index-1]) && /^\d$/.test(numPart[index+1])) {
                multiplier = prefixes[prefix];
                numPart = numPart.replace(prefix, '.');
                break;
            }
        }
    }
    const value = parseFloat(numPart);
    if (isNaN(value)) return null;
    return value * multiplier;
}

function findColorForValue(
    value: number | undefined | null,
    type: 'digit' | 'multiplier' | 'tolerance' | 'tempCoefficient',
    preferredColors?: ResistorBandColor[]
): ResistorBandColor | undefined {
     if (value === undefined || value === null || !isFinite(value)) return undefined;
    let matches: ResistorBandColor[] = [];
    const tolerance = 1e-9;

    for (const color in ResistorColorMap) {
        const bandData = ResistorColorMap[color as ResistorBandColor];
        const colorValue = bandData[type];
        if (colorValue === undefined || colorValue === null) continue;
        if (type === 'multiplier' || type === 'tolerance') {
             if (Math.abs(colorValue - value) < tolerance) matches.push(color as ResistorBandColor);
        } else if (colorValue === value) {
             matches.push(color as ResistorBandColor);
        }
    }

    if (matches.length === 0) return undefined;
    if (matches.length === 1) return matches[0];
    if (preferredColors) {
        for (const prefColor of preferredColors) if (matches.includes(prefColor)) return prefColor;
    }
    if (type === 'multiplier') {
        const nonFractionalMatch = matches.find(c => c !== 'gold' && c !== 'silver');
        if (nonFractionalMatch) return nonFractionalMatch;
    }
    return matches[0];
}

function getSignificandAndMultiplier(resistanceOhms: number, numSigDigits: 2 | 3): { significandStr: string, multiplier: number } | null {
    if (resistanceOhms < 0) return null;
    if (resistanceOhms === 0) return { significandStr: '0'.repeat(numSigDigits), multiplier: 1 };

    let significandStr = '';
    let multiplier = 1;
    const standardMultipliers = [1e9, 1e8, 1e7, 1e6, 1e5, 1e4, 1e3, 100, 10, 1, 0.1, 0.01];

    for (const mult of standardMultipliers) {
        let significand = resistanceOhms / mult;
        let significandCheckStr = significand.toPrecision(numSigDigits);
        let significandRounded = parseFloat(significandCheckStr);

        if (Math.abs(significandRounded * mult - resistanceOhms) / resistanceOhms < 0.005) { // 0.5% tolerance
            significandStr = significandRounded.toString().replace('.', '').padEnd(numSigDigits, '0').substring(0, numSigDigits);
             // Final check: ensure the derived string * mult is close
             if (Math.abs(parseInt(significandStr) * mult - resistanceOhms) / resistanceOhms < 0.01) {
                 multiplier = mult;
                 return { significandStr, multiplier };
             }
        }
    }

    // Fallback using scientific notation if standard multipliers didn't fit well
    const exponent = Math.floor(Math.log10(resistanceOhms));
    const significandSci = resistanceOhms / Math.pow(10, exponent);
    significandStr = significandSci.toPrecision(numSigDigits).replace('.', '').padEnd(numSigDigits, '0').substring(0, numSigDigits);

    let powerOf10 = Math.pow(10, exponent);
    let closestMult = standardMultipliers.reduce((prev, curr) =>
        Math.abs(curr - powerOf10) < Math.abs(prev - powerOf10) ? curr : prev
    );

    let finalSignificand = resistanceOhms / closestMult;
    significandStr = finalSignificand.toPrecision(numSigDigits).replace('.', '').padEnd(numSigDigits, '0').substring(0, numSigDigits);
    multiplier = closestMult;

    if (significandStr.length !== numSigDigits || !/^\d+$/.test(significandStr)) {
         console.error("Fallback failed to produce valid digits", {resistanceOhms, numSigDigits, significandStr, multiplier});
         return null;
    }
    return { significandStr, multiplier };
}

export function valueToResistorBands(
    resistanceStr: string,
    tolerancePercent: number | null,
    preferredBandCounts: (4 | 5 | 6)[] = [4, 5, 6]
): { bands?: ResistorBands; error?: string; numBands?: 4 | 5 | 6 } {
    const resistanceOhms = parseResistanceValue(resistanceStr);
    if (resistanceOhms === null || resistanceOhms < 0) {
        return { error: "Invalid resistance value." };
    }

    let actualToleranceColor: ResistorBandColor | undefined = undefined;
    if (tolerancePercent !== null) {
        actualToleranceColor = findColorForValue(tolerancePercent, 'tolerance', ['brown', 'red', 'green', 'blue', 'violet', 'gray', 'gold', 'silver', 'none']);
        if (!actualToleranceColor) return { error: `No standard color band found for tolerance ±${tolerancePercent}%.` };
        if (tolerancePercent === 20) actualToleranceColor = 'none';
    }

    for (const numBands of preferredBandCounts) {
        const numSigDigits = (numBands === 4) ? 2 : 3;
        const representation = getSignificandAndMultiplier(resistanceOhms, numSigDigits);
        if (!representation) continue;

        const { significandStr, multiplier } = representation;
        const digits = significandStr.split('').map(d => parseInt(d, 10));

        const band1 = findColorForValue(digits[0], 'digit');
        const band2 = findColorForValue(digits[1], 'digit');
        const band3_digit = (numBands >= 5 && digits.length > 2) ? findColorForValue(digits[2], 'digit') : undefined;
        const multiplierColor = findColorForValue(multiplier, 'multiplier', ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white', 'gold', 'silver']);

        if (!band1 || !band2 || !multiplierColor) continue;
        if (numBands >= 5 && !band3_digit) continue;

        let finalToleranceColor: ResistorBandColor | undefined = undefined;
        if (numBands === 4) {
            finalToleranceColor = actualToleranceColor ?? 'gold'; // Default 4-band tol to gold if unspecified
            if (finalToleranceColor === 'none') finalToleranceColor = undefined; // Don't include 'none' explicitly unless 20% was selected
            return { bands: { band1, band2, band3: multiplierColor, multiplier: finalToleranceColor }, numBands: 4 };
        } else { // 5 or 6 bands
             finalToleranceColor = actualToleranceColor ?? (numBands === 5 ? 'gold' : 'brown'); // Default 5-band to gold, 6-band to brown
            if (finalToleranceColor === 'none') finalToleranceColor = undefined;
            if (!finalToleranceColor) continue;

            if (numBands === 5) {
                 return { bands: { band1, band2, band3: band3_digit, multiplier: multiplierColor, tolerance: finalToleranceColor }, numBands: 5 };
            } else { // 6 bands
                 const band6_tempCoefficient = findColorForValue(100, 'tempCoefficient', ['brown']) || 'brown'; // Default TempCo to Brown (100ppm)
                 return { bands: { band1, band2, band3: band3_digit, multiplier: multiplierColor, tolerance: finalToleranceColor, tempCoefficient: band6_tempCoefficient }, numBands: 6 };
            }
        }
    }
    return { error: "Could not determine standard bands for this value." };
}

// Waveform Utilities Removed as requested
