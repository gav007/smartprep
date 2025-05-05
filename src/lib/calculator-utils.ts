
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
    // Ensure part is numeric, within range, and has no leading zeros (unless it's just "0")
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
   if (isNaN(dec) || dec < 0 || dec > 255) {
       console.error("Invalid decimal for octet conversion:", dec);
       return '00000000'; // Return default or throw error
   }
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
  if (cidr < 0 || cidr > 32 || isNaN(cidr)) throw new Error("Invalid CIDR value");
  // Handle CIDR 0 specifically
  if (cidr === 0) return '0.0.0.0';
  const mask = (0xFFFFFFFF << (32 - cidr)) >>> 0; // Use >>> 0 for unsigned right shift
  return ipObjectToString({
    octet1: (mask >>> 24) & 255,
    octet2: (mask >>> 16) & 255,
    octet3: (mask >>> 8) & 255,
    octet4: mask & 255,
  });
}

/**
 * Converts a CIDR prefix length to a wildcard mask string.
 */
export function cidrToWildcardMask(cidr: number): string {
    if (cidr < 0 || cidr > 32 || isNaN(cidr)) throw new Error("Invalid CIDR value");
    // Handle CIDR 32 specifically
    if (cidr === 32) return '0.0.0.0';
    // Handle CIDR 0 specifically
    if (cidr === 0) return '255.255.255.255';
    const mask = (~(0xFFFFFFFF << (32 - cidr))) >>> 0; // Invert subnet mask bits
    return ipObjectToString({
      octet1: (mask >>> 24) & 255,
      octet2: (mask >>> 16) & 255,
      octet3: (mask >>> 8) & 255,
      octet4: mask & 255,
    });
}


/**
 * Calculates subnet details.
 */
export function calculateSubnetDetails(ip: string, cidr: number): SubnetResult | null {
  if (!isValidIPv4(ip) || cidr < 0 || cidr > 32 || isNaN(cidr)) return null;

  const ipNum = ipStringToNumber(ip);
  const maskNum = cidr === 0 ? 0 : (0xFFFFFFFF << (32 - cidr)) >>> 0;
  const networkNum = (ipNum & maskNum) >>> 0;
  // Calculate broadcast: network OR inverted mask
  const broadcastNum = cidr === 32 ? networkNum : (networkNum | (~maskNum >>> 0)) >>> 0;


  const firstHostNum = cidr >= 31 ? networkNum : networkNum + 1;
  const lastHostNum = cidr >= 31 ? networkNum : broadcastNum - 1;

  const totalHosts = Math.pow(2, 32 - cidr);
  let usableHosts: number;
  if (cidr >= 31) {
      usableHosts = 0; // /31 is debated (2 hosts, 0 usable by old standards), /32 is 1 host, 0 usable
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
    firstUsableHost: cidr >= 31 ? "N/A" : ipNumberToString(firstHostNum),
    lastUsableHost: cidr >= 31 ? "N/A" : ipNumberToString(lastHostNum),
    totalHosts: totalHosts,
    usableHosts: Math.max(0, usableHosts), // Ensure usableHosts is not negative
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
   // Ensure conversion handles potential large unsigned values correctly
  return ip.split('.').reduce((res, octet) => (res * 256) + parseInt(octet, 10), 0);
}

// Helper to convert a 32-bit number to an IP string
function ipNumberToString(ipNum: number): string {
   // Use bitwise operations for clarity and potential performance
  return `${(ipNum >>> 24)}.${(ipNum >>> 16) & 255}.${(ipNum >>> 8) & 255}.${ipNum & 255}`;
}


// --- Base Conversion Utilities ---

/**
 * Converts a value from one base to another.
 * Handles potential errors and returns null if conversion fails.
 */
export function convertBase(value: string, fromBase: ConversionBase, toBase: ConversionBase): string | null {
  if (!value) return ''; // Handle empty input gracefully

  let decimalValue: bigint; // Use BigInt for larger numbers

  try {
    switch (fromBase) {
      case 'bin':
         // Validate binary string
        if (!/^[01]+$/.test(value)) return null; // Invalid binary input
        decimalValue = BigInt(`0b${value}`);
        break;
      case 'dec':
         // Validate decimal string
        if (!/^\d+$/.test(value)) return null; // Invalid decimal input
        decimalValue = BigInt(value);
        break;
      case 'hex':
         // Validate hex string
        if (!/^[0-9a-fA-F]+$/.test(value)) return null; // Invalid hex input
        decimalValue = BigInt(`0x${value}`);
        break;
      default:
        return null; // Should not happen
    }

    // Check if parsing resulted in NaN or error (less likely with BigInt, but good practice)
    // BigInt throws errors directly rather than returning NaN
  } catch (e) {
    console.error("Error parsing input value:", e);
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
     console.error("Error converting to target base:", e);
     return null; // Error during conversion to target base
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
 * Formats a binary string into 8-bit chunks, padding the last chunk if necessary.
 * Example: "101010" -> "00101010", "11111111000000001" -> "00000001 11111111 000000001" (incorrect, should pad to 8)
 * Corrected Example: "1" -> "00000001", "101010101" -> "00000001 01010101"
 */
export function formatBinaryString(binary: string, bits: number = 8): string {
  if (!binary) return '';

  const desiredLength = Math.ceil(binary.length / bits) * bits;
  const paddedBinary = binary.padStart(desiredLength, '0');

  // Use regex to split into chunks of 'bits' length
   const regex = new RegExp(`.{1,${bits}}`, 'g');
   const chunks = paddedBinary.match(regex);

   return chunks ? chunks.join(' ') : '';
}


/**
 * Formats a binary string representing an IP address (expected 32 bits)
 * into four 8-bit octets separated by dots. Pads if input is shorter.
 */
export function formatIpBinaryString(binary?: string): string {
  if (!binary) return 'N/A';
  const fullBinary = binary.replace(/\s|\./g, '').padStart(32, '0'); // Remove spaces/dots, ensure 32 bits
  if (fullBinary.length !== 32) return 'Invalid Binary Length'; // Or handle differently

  const octet1 = fullBinary.substring(0, 8);
  const octet2 = fullBinary.substring(8, 16);
  const octet3 = fullBinary.substring(16, 24);
  const octet4 = fullBinary.substring(24, 32);

  return `${octet1}.${octet2}.${octet3}.${octet4}`;
}


// --- Resistor Calculation Utilities ---

function getBandValue(color: ResistorBandColor | undefined, type: 'digit' | 'multiplier' | 'tolerance' | 'tempCoefficient'): number | null {
    if (!color) return null; // Return null if color is undefined

    // Special handling for 'none' tolerance
    if (color === 'none') {
        return type === 'tolerance' ? 20 : null;
    }

    // Check if the color exists in the map and the type exists for that color
     const colorData = ResistorColorMap[color];
    if (!colorData || !(type in colorData)) {
         return null; // Color or specific property not found
    }
    const value = colorData[type];
    // Explicitly check for undefined because 0 is a valid digit/multiplier value
    return value === undefined ? null : value;
}

function formatResistance(ohms: number | null): string {
    if (ohms === null || !isFinite(ohms)) return 'N/A'; // Handle null and Infinity/-Infinity
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
    if (Math.abs(value) < 10) precision = 3;
    if (Math.abs(value) < 1) precision = 4; // For very small values if needed

    // Remove trailing zeros and potentially the decimal point
     let formattedValue = parseFloat(value.toFixed(precision)).toString();

    return formattedValue + suffix;
}


/**
 * Calculates resistor properties from color bands (4, 5, or 6 bands).
 * Now explicitly handles band roles based on numBands.
 */
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

    switch (numBands) {
        case 6:
            const d3_6 = getBandValue(bands.band3, 'digit');
            const mult_6 = getBandValue(bands.multiplier, 'multiplier');
            const tol_6 = getBandValue(bands.tolerance, 'tolerance');
            const tc_6 = getBandValue(bands.tempCoefficient, 'tempCoefficient');
            if (d3_6 === null || mult_6 === null || tol_6 === null) break; // Required bands missing
            significantDigits = `${d1}${d2}${d3_6}`;
            multiplierValue = mult_6;
            tolerance = tol_6;
            tempCoefficient = tc_6; // Can be null/undefined if not selected
            break;
        case 5:
            const d3_5 = getBandValue(bands.band3, 'digit');
            const mult_5 = getBandValue(bands.multiplier, 'multiplier');
            const tol_5 = getBandValue(bands.tolerance, 'tolerance');
            if (d3_5 === null || mult_5 === null || tol_5 === null) break; // Required bands missing
            significantDigits = `${d1}${d2}${d3_5}`;
            multiplierValue = mult_5;
            tolerance = tol_5;
            break;
        case 4:
            // Band 3 is Multiplier, Band 4 (mapped to `bands.multiplier`) is Tolerance
            const mult_4 = getBandValue(bands.band3, 'multiplier'); // Band 3 = Multiplier
            const tol_4 = getBandValue(bands.multiplier, 'tolerance'); // Band 4 = Tolerance (using multiplier key)
            if (mult_4 === null || tol_4 === null) break; // Required bands missing
            significantDigits = `${d1}${d2}`;
            multiplierValue = mult_4;
            tolerance = tol_4;
            break;
    }

    if (significantDigits && multiplierValue !== null && isFinite(multiplierValue)) {
        resistance = parseInt(significantDigits, 10) * multiplierValue;
    } else {
        // Ensure resistance is null if calculation wasn't possible
        resistance = null;
    }

    return {
        resistance: resistance,
        tolerance: tolerance, // Might be null if not found/applicable
        tempCoefficient: tempCoefficient, // Might be null
        resistanceString: formatResistance(resistance),
    };
}

// --- Value to Bands ---
function parseResistanceValue(valueStr: string): number | null {
    if (!valueStr) return null;
    const cleanedStr = valueStr.trim().replace(/,/g, '').toUpperCase();
    let multiplier = 1;
    let numPart = cleanedStr.replace(/Ω|OHMS?/i, '');

    const prefixes: { [key: string]: number } = { T: 1e12, G: 1e9, M: 1e6, K: 1e3 };

    // Check for prefix at the end first (e.g., 10K, 4.7M)
    for (const prefix in prefixes) {
        if (numPart.endsWith(prefix)) {
            multiplier = prefixes[prefix];
            numPart = numPart.slice(0, -prefix.length);
            break;
        }
    }

    // Check for prefix acting as decimal (e.g., 4k7) - more restrictive check
    if (multiplier === 1) { // Only if end-prefix wasn't found
        for (const prefix in prefixes) {
            const index = numPart.indexOf(prefix);
            // Ensure prefix is between digits and not at the start/end
            if (index > 0 && index < numPart.length - 1 && /^\d+$/.test(numPart[index-1]) && /^\d+$/.test(numPart[index+1])) {
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
    // Define a small tolerance for floating-point comparisons
    const tolerance = 1e-9;

    for (const color in ResistorColorMap) {
        const bandData = ResistorColorMap[color as ResistorBandColor];
        const colorValue = bandData[type];

        if (colorValue === undefined || colorValue === null) continue; // Skip if the property doesn't exist

         if (type === 'multiplier' || type === 'tolerance') {
             // Use tolerance for floating point numbers
             if (Math.abs(colorValue - value) < tolerance) {
                 matches.push(color as ResistorBandColor);
             }
         } else if (colorValue === value) { // Exact match for digits, tempCo
            matches.push(color as ResistorBandColor);
        }
    }

    if (matches.length === 0) return undefined;
    if (matches.length === 1) return matches[0];

    // --- Prioritization Logic ---
    // 1. Preferred Colors
    if (preferredColors) {
        for (const prefColor of preferredColors) {
            if (matches.includes(prefColor)) {
                return prefColor;
            }
        }
    }

    // 2. Standard Multiplier Preference (avoid gold/silver if others match)
    if (type === 'multiplier') {
        const nonFractionalMatch = matches.find(c => c !== 'gold' && c !== 'silver');
        if (nonFractionalMatch) return nonFractionalMatch;
    }

    // 3. Digit Preference (avoid leading zero 'black' unless value is 0)
    // This should be handled in the calling function based on digit position

    // 4. Default: Return first match if no other criteria met
    return matches[0];
}


/**
 * Finds the best representation (significant digits and multiplier) for a resistance value
 * based on the number of significant digits required (2 for 4-band, 3 for 5/6-band).
 * Tries to align with standard E-series multiplier conventions.
 */
function getSignificandAndMultiplier(resistanceOhms: number, numSigDigits: 2 | 3): { significandStr: string, multiplier: number } | null {
    if (resistanceOhms < 0) return null;
    if (resistanceOhms === 0) return { significandStr: '0'.repeat(numSigDigits), multiplier: 1 }; // Represent 0 as 00*1 or 000*1

    let significandStr = '';
    let multiplier = 1;

    // Iterate through possible standard multipliers (powers of 10, plus gold/silver)
    const standardMultipliers = [
        1e9, 1e8, 1e7, 1e6, 1e5, 1e4, 1e3, 100, 10, 1, 0.1, 0.01
    ];

    for (const mult of standardMultipliers) {
        let significand = resistanceOhms / mult;

        // Check if the significand is within the range representable by the digits
        // e.g., for 3 digits, range is [1.00, 999]. For 2 digits, range is [1.0, 99]
        const minSignificand = 1;
         // Max significand needs to account for rounding, e.g., 9.9 for 2 digits, 99.9 for 3 digits? Let's use precision.
        const maxSignificand = Math.pow(10, numSigDigits); // e.g., 100 for 3 digits, 1000 for 4? No, 100 for 2, 1000 for 3.

        // Check if significand has roughly the correct number of digits BEFORE decimal
         // Use precision check: represent significand with `numSigDigits` precision.
         let significandCheckStr = significand.toPrecision(numSigDigits);
         let significandRounded = parseFloat(significandCheckStr);

        // Check if after rounding, multiplying back gives the original value (within tolerance)
         if (Math.abs(significandRounded * mult - resistanceOhms) / resistanceOhms < 0.001) { // 0.1% tolerance
             // Convert the rounded significand to the required digit string format
             let tempStr = significandRounded.toString();
             let decimalIndex = tempStr.indexOf('.');
             let integerPart = decimalIndex === -1 ? tempStr : tempStr.substring(0, decimalIndex);
             let fractionalPart = decimalIndex === -1 ? '' : tempStr.substring(decimalIndex + 1);

             // Combine and pad/truncate to exact numSigDigits
             significandStr = (integerPart + fractionalPart).padEnd(numSigDigits, '0').substring(0, numSigDigits);

             // Ensure the derived string * multiplier is close to original value
             if (Math.abs(parseInt(significandStr) * mult - resistanceOhms) / resistanceOhms < 0.01) { // Relax tolerance slightly
                 multiplier = mult;
                 return { significandStr, multiplier };
             }
         }

         // Alternative check: Round significand to appropriate decimal places based on multiplier
         let decimalPlaces = 0;
         if (mult === 0.1) decimalPlaces = numSigDigits; // e.g., 1.23 * 0.1 -> need 3 digits total
         else if (mult === 0.01) decimalPlaces = numSigDigits + 1;
         else decimalPlaces = Math.max(0, numSigDigits - Math.floor(Math.log10(significand)+1));

          let roundedSig = parseFloat(significand.toFixed(decimalPlaces));
          if (Math.abs(roundedSig * mult - resistanceOhms) / resistanceOhms < 0.001) {
                significandStr = roundedSig.toString().replace('.', '').padEnd(numSigDigits, '0').substring(0, numSigDigits);
                 if (Math.abs(parseInt(significandStr) * mult - resistanceOhms) / resistanceOhms < 0.01) {
                    multiplier = mult;
                    return { significandStr, multiplier };
                 }
          }
    }


    // Fallback if no standard multiplier works well (e.g., very precise value)
    // Use scientific notation approach
    const exponent = Math.floor(Math.log10(resistanceOhms));
    const significand = resistanceOhms / Math.pow(10, exponent);
    significandStr = significand.toPrecision(numSigDigits).replace('.', '').padEnd(numSigDigits, '0').substring(0, numSigDigits);
     // Find closest standard multiplier for the calculated exponent
     let powerOf10 = Math.pow(10, exponent);
     let closestMult = standardMultipliers.reduce((prev, curr) =>
         Math.abs(curr - powerOf10) < Math.abs(prev - powerOf10) ? curr : prev
     );

     // Recalculate significand string based on closest standard multiplier
     let finalSignificand = resistanceOhms / closestMult;
     significandStr = finalSignificand.toPrecision(numSigDigits).replace('.', '').padEnd(numSigDigits, '0').substring(0, numSigDigits);
     multiplier = closestMult;


    if (significandStr.length !== numSigDigits || !/^\d+$/.test(significandStr)) {
         console.error("Fallback failed to produce valid digits", {resistanceOhms, numSigDigits, significandStr, multiplier});
         return null; // Could not determine representation
    }

    return { significandStr, multiplier };
}

/**
 * Tries to find the standard resistor color bands for a given resistance value and tolerance.
 */
export function valueToResistorBands(
    resistanceStr: string,
    tolerancePercent: number | null,
    preferredBandCounts: (4 | 5 | 6)[] = [4, 5, 6]
): { bands?: ResistorBands; error?: string; numBands?: 4 | 5 | 6 } {
    const resistanceOhms = parseResistanceValue(resistanceStr);

    if (resistanceOhms === null || resistanceOhms < 0) {
        return { error: "Invalid resistance value." };
    }

    // Find tolerance color FIRST
    let actualToleranceColor: ResistorBandColor | undefined = undefined;
    let isToleranceRequired = tolerancePercent !== null;
    if (isToleranceRequired) {
         const preferredTolColors: ResistorBandColor[] = ['brown', 'red', 'green', 'blue', 'violet', 'gray', 'gold', 'silver', 'none'];
        actualToleranceColor = findColorForValue(tolerancePercent, 'tolerance', preferredTolColors);
         if (!actualToleranceColor) {
             return { error: `No standard color band found for tolerance ±${tolerancePercent}%. Common values are 1, 2, 0.5, 0.25, 0.1, 0.05, 5, 10, 20.` };
         }
         // Map 20% back to 'none' color
         if (tolerancePercent === 20) actualToleranceColor = 'none';
    }


    for (const numBands of preferredBandCounts) {
        const numSigDigits = (numBands === 4) ? 2 : 3;
        const representation = getSignificandAndMultiplier(resistanceOhms, numSigDigits);

        if (!representation) continue; // Try next band count if representation failed

        const { significandStr, multiplier } = representation;
        const digits = significandStr.split('').map(d => parseInt(d, 10));

        const band1 = findColorForValue(digits[0], 'digit');
        const band2 = findColorForValue(digits[1], 'digit');
        const band3_digit = (numBands >= 5 && digits.length > 2) ? findColorForValue(digits[2], 'digit') : undefined;

        // Multiplier color preference: Avoid gold/silver if a power-of-10 matches
        const preferredMultiplierColors: ResistorBandColor[] = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white', 'gold', 'silver'];
        const multiplierColor = findColorForValue(multiplier, 'multiplier', preferredMultiplierColors);

        // Validate required colors are found
        if (!band1 || !band2 || !multiplierColor) continue;
        if (numBands >= 5 && !band3_digit) continue; // Need 3rd digit for 5/6 band

        // Determine tolerance color based on band count and if it was specified
         let finalToleranceColor: ResistorBandColor | undefined = undefined;
         if (numBands === 4) {
             // 4-band: Use specified tolerance, default to 'none' (20%) if not specified
             finalToleranceColor = actualToleranceColor ?? 'none';
             // Map the tolerance color to the 'multiplier' field in the result for 4-band structure
             return {
                 bands: { band1, band2, band3: multiplierColor, multiplier: finalToleranceColor },
                 numBands: 4
             };
         } else if (numBands === 5) {
             // 5-band: Use specified tolerance, default to 'gold' (5%) if not specified
             finalToleranceColor = actualToleranceColor ?? 'gold';
             if (!finalToleranceColor) continue; // Should have been found earlier if required
             return {
                 bands: { band1, band2, band3: band3_digit, multiplier: multiplierColor, tolerance: finalToleranceColor },
                 numBands: 5
             };
         } else if (numBands === 6) {
             // 6-band: Use specified tolerance, default to 'brown' (1%) if not specified
             finalToleranceColor = actualToleranceColor ?? 'brown';
             if (!finalToleranceColor) continue; // Should have been found earlier if required
             // TempCo needs to be specified or defaulted (using 100ppm/Brown)
             const band6_tempCoefficient = findColorForValue(100, 'tempCoefficient', ['brown']) || 'brown';
             return {
                 bands: { band1, band2, band3: band3_digit, multiplier: multiplierColor, tolerance: finalToleranceColor, tempCoefficient: band6_tempCoefficient },
                 numBands: 6
             };
         }
    }

    return { error: "Could not determine standard bands for this value with the preferred band counts." };
}


// --- Waveform Generation Utilities ---

/**
 * Generates data points for a given waveform.
 */
export function generateWaveformData(params: WaveformParams): WaveformDataPoint[] {
  const { type, frequency, amplitude, phase = 0, duration, samples = 200 } = params; // Default samples to 200
  const data: WaveformDataPoint[] = [];

   // Validate required parameters
   if (frequency === undefined || amplitude === undefined || type === undefined) {
        console.error("Missing required waveform parameters (frequency, amplitude, type).");
        return [];
   }
    // Basic validation
    if (frequency <= 0 || samples < 2) {
        console.warn("Invalid waveform parameters: frequency must be > 0, samples >= 2.", params);
        return [];
    }
    // Amplitude can be zero or negative, representing DC offset or inversion.

  const effectiveDuration = duration !== undefined && duration > 0 ? duration : (1 / frequency) * 2; // Default to 2 cycles if duration invalid/missing
  const period = 1 / frequency;
   if (effectiveDuration <= 0) {
        console.warn("Invalid duration, defaulting to 2 cycles.");
        // The fallback is already handled above.
   }


  const angularFrequency = 2 * Math.PI * frequency;
  const phaseRad = phase * (Math.PI / 180);
  const timeStep = effectiveDuration / (samples - 1);


  for (let i = 0; i < samples; i++) {
    const time = i * timeStep;
    let voltage = 0;
     const phaseShift = phaseRad; // Apply phase directly inside the trigonometric/periodic function

    switch (type) {
      case 'sine':
        voltage = amplitude * Math.sin(angularFrequency * time + phaseShift);
        break;
      case 'square':
         const cyclePosSquare = (angularFrequency * time + phaseShift) / (2 * Math.PI);
         let timeInCycleSquare = (cyclePosSquare % 1) * period;
         if (timeInCycleSquare < 0) timeInCycleSquare += period;
         voltage = timeInCycleSquare < period / 2 ? amplitude : -amplitude;
        break;
      case 'triangle':
          const cyclePosTriangle = (angularFrequency * time + phaseShift) / (2 * Math.PI);
          let timeInCycleTriangle = (cyclePosTriangle % 1) * period;
           if (timeInCycleTriangle < 0) timeInCycleTriangle += period;

         if (timeInCycleTriangle < period / 2) {
             voltage = -amplitude + (4 * amplitude * timeInCycleTriangle) / period; // Corrected slope
         } else {
             voltage = amplitude - (4 * amplitude * (timeInCycleTriangle - period / 2)) / period; // Corrected slope
         }
        break;
    }
    data.push({ time, voltage });
  }
  return data;
}
