
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
    if (!color || color === 'none') {
        // Special handling for 'none' tolerance
        if (type === 'tolerance') return 20;
        return null;
    }
    const value = ResistorColorMap[color]?.[type];
    return value === undefined ? null : value;
}

function formatResistance(ohms: number | null): string {
    if (ohms === null || isNaN(ohms)) return 'N/A';
    if (ohms === 0) return '0 Ω';

    const absOhms = Math.abs(ohms);
    let value: number;
    let suffix: string;

    if (absOhms >= 1e9) {
        value = ohms / 1e9;
        suffix = ' GΩ';
    } else if (absOhms >= 1e6) {
        value = ohms / 1e6;
        suffix = ' MΩ';
    } else if (absOhms >= 1e3) {
        value = ohms / 1e3;
        suffix = ' kΩ';
    } else {
        value = ohms;
        suffix = ' Ω';
    }

    // Smart rounding: more precision for smaller values
    let precision = 2;
    if (value < 10) precision = 3;
    if (value < 1) precision = 4; // For very small values if needed, though less common with prefixes

    // Remove trailing zeros and potentially the decimal point
    let formattedValue = value.toFixed(precision).replace(/\.?0+$/, '');

    return formattedValue + suffix;
}


/**
 * Calculates resistor properties from color bands (4, 5, or 6 bands).
 * This function takes the `bands` state directly and determines the number of bands implicitly.
 */
export function calculateResistorFromBands(bands: ResistorBands, numBands: 4 | 5 | 6): ResistorResult {
    let resistance: number | null = null;
    let tolerance: number | null = null;
    let tempCoefficient: number | null = null;
    let significantDigits = '';
    let multiplierValue: number | null = null;

    const d1 = getBandValue(bands.band1, 'digit');
    const d2 = getBandValue(bands.band2, 'digit');
    const d3 = getBandValue(bands.band3, 'digit'); // Used for 5/6 band

    switch (numBands) {
        case 6:
            if (d1 !== null && d2 !== null && d3 !== null) {
                significantDigits = `${d1}${d2}${d3}`;
                multiplierValue = getBandValue(bands.multiplier, 'multiplier');
                tolerance = getBandValue(bands.tolerance, 'tolerance');
                tempCoefficient = getBandValue(bands.tempCoefficient, 'tempCoefficient');
            }
            break;
        case 5:
             if (d1 !== null && d2 !== null && d3 !== null) {
                 significantDigits = `${d1}${d2}${d3}`;
                 multiplierValue = getBandValue(bands.multiplier, 'multiplier');
                 tolerance = getBandValue(bands.tolerance, 'tolerance');
             }
            break;
        case 4:
            if (d1 !== null && d2 !== null) {
                significantDigits = `${d1}${d2}`;
                // For 4-band, the 'multiplier' field in the UI state corresponds to Band 3 (Multiplier)
                // and the 'tolerance' field corresponds to Band 4 (Tolerance)
                multiplierValue = getBandValue(bands.multiplier, 'multiplier'); // UI 'multiplier' is Band 3
                tolerance = getBandValue(bands.tolerance, 'tolerance');         // UI 'tolerance' is Band 4
            }
            break;
    }

    if (significantDigits && multiplierValue !== null) {
        resistance = parseInt(significantDigits, 10) * multiplierValue;
    }

     // Ensure tolerance is correctly assigned (handles 'none' case via getBandValue)
     if (tolerance === null && bands.tolerance) {
         tolerance = getBandValue(bands.tolerance, 'tolerance');
     }

    return {
        resistance: resistance,
        tolerance: tolerance,
        tempCoefficient: tempCoefficient,
        resistanceString: formatResistance(resistance),
    };
}

// --- Value to Bands ---
function parseResistanceValue(valueStr: string): number | null {
    if (!valueStr) return null;
    const cleanedStr = valueStr.replace(/[^0-9.kMGT]/gi, '').toUpperCase(); // Allow T for Tera, G for Giga
    let multiplier = 1;
    let numPart = cleanedStr;

    if (cleanedStr.endsWith('G')) {
        multiplier = 1e9;
        numPart = cleanedStr.slice(0, -1);
    } else if (cleanedStr.endsWith('M')) {
        multiplier = 1e6;
        numPart = cleanedStr.slice(0, -1);
    } else if (cleanedStr.endsWith('K')) {
        multiplier = 1e3;
        numPart = cleanedStr.slice(0, -1);
    } else if (cleanedStr.endsWith('T')) { // Tera-ohms (less common but possible)
        multiplier = 1e12;
        numPart = cleanedStr.slice(0, -1);
    }


    const value = parseFloat(numPart);
    if (isNaN(value)) return null;

    return value * multiplier;
}

function findColorForValue(
    value: number | undefined,
    type: 'digit' | 'multiplier' | 'tolerance' | 'tempCoefficient',
    preferredColors?: ResistorBandColor[] // Optional: Prefer colors from this list if multiple match
): ResistorBandColor | undefined {
    if (value === undefined) return undefined;

    let matches: ResistorBandColor[] = [];
    for (const color in ResistorColorMap) {
        const bandData = ResistorColorMap[color as ResistorBandColor];
        if (bandData[type] === value) {
            matches.push(color as ResistorBandColor);
        }
    }

    if (matches.length === 0) return undefined;
    if (matches.length === 1) return matches[0];

    // If multiple matches, check preferred colors
    if (preferredColors) {
        for (const prefColor of preferredColors) {
            if (matches.includes(prefColor)) {
                return prefColor;
            }
        }
    }

    // Fallback: return the first match if no preference is found
    // Consider prioritizing standard E-series colors if needed
    return matches[0];
}

/**
 * Tries to find the standard resistor color bands for a given resistance value and tolerance.
 * Prioritizes standard E-series representations (e.g., 47k not 470 * 100).
 * @param resistanceStr Resistance value string (e.g., "4.7k", "220", "1M").
 * @param tolerancePercent Desired tolerance percentage (e.g., 5, 1, 10).
 * @param preferredBandCounts Array of preferred band counts to try (e.g., [4, 5]).
 * @returns An object containing the calculated bands or an error message.
 */
export function findResistorBandsFromValue(
    resistanceStr: string,
    tolerancePercent: number,
    preferredBandCounts: (4 | 5)[] = [4, 5] // Default preference
): { bands?: ResistorBands; error?: string } {
    const resistanceOhms = parseResistanceValue(resistanceStr);

    if (resistanceOhms === null || resistanceOhms < 0) {
        return { error: "Invalid resistance value." };
    }
     if (resistanceOhms === 0 && resistanceStr !== '0') {
         // Allow '0' explicitly, otherwise invalid
          return { error: "Invalid resistance value." };
     }

    const toleranceColor = findColorForValue(tolerancePercent, 'tolerance', ['gold', 'silver', 'brown', 'red', 'green', 'blue', 'violet', 'gray', 'none']);
    if (!toleranceColor && tolerancePercent !== 20) { // 'none' maps to 20%
        return { error: `No standard color band found for tolerance ±${tolerancePercent}%.` };
    }
     const actualToleranceColor = tolerancePercent === 20 ? 'none' : toleranceColor; // Use 'none' for 20%


    for (const numBands of preferredBandCounts) {
        let band1: ResistorBandColor | undefined;
        let band2: ResistorBandColor | undefined;
        let band3: ResistorBandColor | undefined; // Only for 5-band
        let multiplier: ResistorBandColor | undefined;
        let significantDigitsStr = '';
        let powerOfTen = 0;

        if (resistanceOhms === 0) {
             significantDigitsStr = '0';
             powerOfTen = 0; // Black multiplier
        } else {
             // Find the best representation (e.g., 47k -> 47 * 10^3)
             powerOfTen = Math.floor(Math.log10(resistanceOhms));
             let baseValue = resistanceOhms / Math.pow(10, powerOfTen);

             // Adjust for standard E-series representation (usually 2 or 3 significant digits)
             if (numBands === 4) {
                 // Try to represent with 2 digits
                 significantDigitsStr = (baseValue * 10).toFixed(0); // Get first two digits roughly
                 // Check if we can represent exactly
                 if (significantDigitsStr.length > 2) {
                     significantDigitsStr = significantDigitsStr.substring(0, 2);
                 }
                 // Recalculate powerOfTen based on the 2 digits
                 powerOfTen = Math.floor(Math.log10(resistanceOhms / parseInt(significantDigitsStr, 10)));

                 // Handle cases like 1 Ohm (10 * 10^-1) -> digits 1, 0, multiplier gold
                 if (resistanceOhms < 10 && resistanceOhms >= 1) {
                      significantDigitsStr = resistanceOhms.toFixed(0) + '0'; // e.g. 1 -> 10
                      powerOfTen = -1; // Silver multiplier
                 } else if (resistanceOhms < 1) {
                      significantDigitsStr = (resistanceOhms * 100).toFixed(0); // e.g., 0.47 -> 47
                       powerOfTen = -2; // Gold multiplier
                 }


             } else { // numBands === 5
                 // Try to represent with 3 digits
                 significantDigitsStr = (baseValue * 100).toFixed(0);
                  if (significantDigitsStr.length > 3) {
                     significantDigitsStr = significantDigitsStr.substring(0, 3);
                 }
                 // Recalculate powerOfTen based on the 3 digits
                 powerOfTen = Math.floor(Math.log10(resistanceOhms / parseInt(significantDigitsStr, 10)));

                 if (resistanceOhms < 10 && resistanceOhms >= 1) {
                      significantDigitsStr = (resistanceOhms*10).toFixed(0) + '0'; // e.g. 4.7 -> 470
                      powerOfTen = -2; // Gold multiplier? No, silver for 47 * 0.1
                       // Let's rethink: 4.7 -> 47 * 10^-1 -> digits 4, 7, 0, mult gold? No. 4,7,x mult silver?
                       // Standard 5-band: 4.7 ohm = yellow, violet, silver (mult 0.01), [tolerance] -> 47*0.01 = 0.47 WRONG
                       // 4.7 ohm = yellow, violet, black (digit 0), silver (mult 0.01) -> 470 * 0.01 = 4.7 CORRECT
                       significantDigitsStr = '470'; // Use 3 digits
                       powerOfTen = -2; // Multiplier silver
                 } else if (resistanceOhms < 1) {
                      // 0.47 ohm = yellow, violet, black (digit 0), gold (mult 0.1) -> 470 * 0.1 = 47 WRONG
                       // 0.47 ohm = yellow, violet, brown (digit 1), gold (mult 0.1) -> 471 * 0.1 = 47.1 WRONG
                       // Let's stick to precision
                       significantDigitsStr = (resistanceOhms * 1000).toFixed(0); // e.g., 0.47 -> 470
                       if(significantDigitsStr.length > 3) significantDigitsStr = significantDigitsStr.substring(0,3);
                        powerOfTen = -3; // Find closest multiplier, might need refinement
                        // Or maybe 0.47 -> 47 * 10^-2 -> digits 4, 7, 0, mult gold?
                         significantDigitsStr = '470'; // Assume 3 digits
                         powerOfTen = -2; // silver
                 }
             }
        }


        // Find multiplier color
        multiplier = findColorForValue(Math.pow(10, powerOfTen), 'multiplier', ['black','brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gold', 'silver']);

         // Handle edge case where calculated multiplier might be slightly off due to float precision
         if (!multiplier) {
            const closestMultiplierPower = Math.round(Math.log10(resistanceOhms / parseInt(significantDigitsStr)));
             multiplier = findColorForValue(Math.pow(10, closestMultiplierPower), 'multiplier', ['black','brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gold', 'silver']);
         }


        if (!multiplier) continue; // Cannot find multiplier for this band count, try next

        // Find digit colors
        const digits = significantDigitsStr.split('').map(d => parseInt(d, 10));

        if (numBands === 4 && digits.length === 2) {
            band1 = findColorForValue(digits[0], 'digit', ['brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white']);
            band2 = findColorForValue(digits[1], 'digit');
            if (!band1 || !band2) continue; // Invalid digit color

            return {
                bands: { band1, band2, multiplier, tolerance: actualToleranceColor }
            };
        } else if (numBands === 5 && digits.length === 3) {
            band1 = findColorForValue(digits[0], 'digit', ['brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white']);
            band2 = findColorForValue(digits[1], 'digit');
            band3 = findColorForValue(digits[2], 'digit');
            if (!band1 || !band2 || !band3) continue; // Invalid digit color

            return {
                 bands: { band1, band2, band3, multiplier, tolerance: actualToleranceColor }
            };
        }
    }

    return { error: "Could not determine standard bands for this value. Try adjusting precision or tolerance." };
}



// --- Waveform Generation Utilities ---

/**
 * Generates data points for a given waveform.
 */
export function generateWaveformData(params: WaveformParams): WaveformDataPoint[] {
  const { type, frequency, amplitude, phase = 0, duration = (1 / frequency) * 2, samples = 100 } = params;
  const data: WaveformDataPoint[] = [];
   // Basic validation
   if (frequency <= 0 || amplitude <= 0 || samples < 2 || duration <= 0) {
      console.warn("Invalid waveform parameters:", params);
      return [];
   }

  const angularFrequency = 2 * Math.PI * frequency;
  const phaseRad = phase * (Math.PI / 180);
  const timeStep = duration / (samples - 1);
  const period = 1 / frequency;

  for (let i = 0; i < samples; i++) {
    const time = i * timeStep;
    let voltage = 0;
    const timeWithPhase = time + phaseRad / angularFrequency; // Apply phase offset

    switch (type) {
      case 'sine':
        voltage = amplitude * Math.sin(angularFrequency * time + phaseRad);
        break;
      case 'square':
         const cycleTimeSquare = timeWithPhase % period;
         voltage = cycleTimeSquare < period / 2 ? amplitude : -amplitude;
        break;
      case 'triangle':
         const timeInCycleTriangle = timeWithPhase % period;
          // Normalize time within the cycle to handle negative results from modulo with phase
         const normalizedTime = (timeInCycleTriangle + period) % period;

         if (normalizedTime < period / 2) {
             // Rising edge: from -A to +A over period/2
             voltage = -amplitude + (amplitude - (-amplitude)) * (normalizedTime / (period / 2));
         } else {
             // Falling edge: from +A to -A over period/2
             voltage = amplitude + ((-amplitude) - amplitude) * ((normalizedTime - period / 2) / (period / 2));
         }
        break;
    }
    // Clamp voltage to amplitude limits just in case of calculation quirks
    voltage = Math.max(-amplitude, Math.min(amplitude, voltage));
    data.push({ time, voltage });
  }
  return data;
}

