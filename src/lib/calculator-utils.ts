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
    if (!color || color === 'none') {
        // Special handling for 'none' tolerance
        if (type === 'tolerance') return 20;
        return null;
    }
    // Check if the color exists in the map and the type exists for that color
     const colorData = ResistorColorMap[color];
    if (!colorData || !(type in colorData)) {
         return null; // Color or specific property not found
    }
    const value = colorData[type];
    return value === undefined ? null : value; // Explicitly check for undefined
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
     // Use toLocaleString for better number formatting potentially, but toFixed is simpler here
     // let formattedValue = value.toLocaleString(undefined, { maximumFractionDigits: precision, minimumFractionDigits: 0 });
     let formattedValue = parseFloat(value.toFixed(precision)).toString(); // Convert back to string to handle trailing .0

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
    const d3 = (numBands === 5 || numBands === 6) ? getBandValue(bands.band3, 'digit') : null;

    let multiplierColor: ResistorBandColor | undefined;
    let toleranceColor: ResistorBandColor | undefined;
    let tempCoColor: ResistorBandColor | undefined;


    switch (numBands) {
        case 6:
            // Band 3=Digit, Band 4=Multiplier, Band 5=Tolerance, Band 6=TempCo
            if (d1 === null || d2 === null || d3 === null) break;
            significantDigits = `${d1}${d2}${d3}`;
            multiplierColor = bands.multiplier;
            toleranceColor = bands.tolerance;
            tempCoColor = bands.tempCoefficient;
            multiplierValue = getBandValue(multiplierColor, 'multiplier');
            tolerance = getBandValue(toleranceColor, 'tolerance');
            tempCoefficient = getBandValue(tempCoColor, 'tempCoefficient');
            break;
        case 5:
            // Band 3=Digit, Band 4=Multiplier, Band 5=Tolerance
            if (d1 === null || d2 === null || d3 === null) break;
            significantDigits = `${d1}${d2}${d3}`;
            multiplierColor = bands.multiplier;
            toleranceColor = bands.tolerance;
            multiplierValue = getBandValue(multiplierColor, 'multiplier');
            tolerance = getBandValue(toleranceColor, 'tolerance');
            break;
        case 4:
            // Band 3=Multiplier, Band 4=Tolerance
            if (d1 === null || d2 === null) break;
            significantDigits = `${d1}${d2}`;
            // NOTE: The band meaning shifts for 4-band based on standard layout.
            // Assuming the UI state `bands` maps roles like:
            // bands.band1 -> Band 1 (Digit)
            // bands.band2 -> Band 2 (Digit)
            // bands.band3 -> Band 3 (Multiplier) // Corrected role for 4-band
            // bands.multiplier -> Band 4 (Tolerance) // Corrected role for 4-band
            multiplierColor = bands.band3;
            toleranceColor = bands.multiplier; // Reuse 'multiplier' state field for Band 4 color
            multiplierValue = getBandValue(multiplierColor, 'multiplier');
            tolerance = getBandValue(toleranceColor, 'tolerance');
            break;
    }

    if (significantDigits && multiplierValue !== null && isFinite(multiplierValue)) {
        resistance = parseInt(significantDigits, 10) * multiplierValue;
    }

    // Final check for tolerance if not derived correctly above (especially for 'none')
    if (tolerance === null && toleranceColor) {
         tolerance = getBandValue(toleranceColor, 'tolerance');
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
    const cleanedStr = valueStr.trim().replace(/,/g, '').toUpperCase(); // Remove commas, trim whitespace
    let multiplier = 1;
    let numPart = cleanedStr.replace(/Ω|OHMS?/i, ''); // Remove ohm symbols

    const prefixes: { [key: string]: number } = { T: 1e12, G: 1e9, M: 1e6, K: 1e3 };
    let foundPrefix = false;

    for (const prefix in prefixes) {
        if (numPart.endsWith(prefix)) {
            multiplier = prefixes[prefix];
            numPart = numPart.slice(0, -prefix.length);
             foundPrefix = true;
            break; // Found the highest prefix
        }
    }

    // Handle cases like "4k7" where k is in the middle
    if (!foundPrefix) {
        for (const prefix in prefixes) {
             const index = numPart.indexOf(prefix);
             // Check if prefix is used like a decimal point (e.g., 4k7 -> 4.7k)
             // Ensure it's not just part of a number like '1k2k'
             if (index > 0 && index === numPart.length - prefix.length && !/\d$/.test(numPart.substring(0,index)) ) {
                 multiplier = prefixes[prefix];
                 numPart = numPart.replace(prefix, '.');
                  foundPrefix = true;
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
    preferredColors?: ResistorBandColor[] // Optional: Prefer colors from this list if multiple match
): ResistorBandColor | undefined {
     if (value === undefined || value === null || !isFinite(value)) return undefined;

    let matches: ResistorBandColor[] = [];
    for (const color in ResistorColorMap) {
        const bandData = ResistorColorMap[color as ResistorBandColor];
        // Use a tolerance for comparing floating point multipliers
         if (type === 'multiplier') {
             if (bandData.multiplier !== undefined && Math.abs(bandData.multiplier - value) < 1e-9) {
                 matches.push(color as ResistorBandColor);
             }
         } else if (bandData[type] === value) {
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
    // For digits, black is usually not the first digit unless value is 0.
    if (type === 'digit' && matches.includes('black') && value !== 0) {
         // Return a non-black digit if available, otherwise black is fine (e.g., for 10 ohms)
         return matches.find(c => c !== 'black') || matches[0];
    }

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
export function valueToResistorBands(
    resistanceStr: string,
    tolerancePercent: number | null, // Allow null tolerance
    preferredBandCounts: (4 | 5 | 6)[] = [4, 5, 6] // Include 6 band
): { bands?: ResistorBands; error?: string; numBands?: 4 | 5 | 6 } { // Return numBands used
    const resistanceOhms = parseResistanceValue(resistanceStr);

    if (resistanceOhms === null || resistanceOhms < 0) {
        return { error: "Invalid resistance value." };
    }
    if (resistanceOhms === 0 && resistanceStr.trim() !== '0') {
        return { error: "Invalid resistance value. Use '0' for zero ohms." };
    }

    let actualToleranceColor: ResistorBandColor | undefined = undefined;
    if (tolerancePercent !== null) {
        const toleranceColor = findColorForValue(tolerancePercent, 'tolerance', ['gold', 'silver', 'brown', 'red', 'green', 'blue', 'violet', 'gray', 'none']);
         if (!toleranceColor && tolerancePercent !== 20) {
             return { error: `No standard color band found for tolerance ±${tolerancePercent}%.` };
         }
         actualToleranceColor = tolerancePercent === 20 ? 'none' : toleranceColor;
    } else {
         actualToleranceColor = undefined; // Indicate tolerance wasn't specified yet
    }


    for (const numBands of preferredBandCounts) {
        let band1: ResistorBandColor | undefined;
        let band2: ResistorBandColor | undefined;
        let band3: ResistorBandColor | undefined; // Digit (5/6) or Multiplier (4)
        let band4_multiplier: ResistorBandColor | undefined; // Multiplier (5/6)
        let band5_tolerance: ResistorBandColor | undefined = actualToleranceColor; // Tolerance (5/6)
        let band6_tempCoefficient: ResistorBandColor | undefined; // Only for 6-band

        // Logic specific to finding bands from value
        let significantDigitsStr = '';
        let powerOfTen = 0;
        let targetMultiplierValue: number | null = null;

        if (resistanceOhms === 0) {
            // Zero Ohm Resistor: Black band(s)
            band1 = 'black';
            band2 = 'black'; // Often just a single black band, but represent with 00*1
            band3 = (numBands >= 5) ? 'black' : undefined; // Digit 3 for 5/6
            targetMultiplierValue = 1; // Represents x1
        } else {
            const numSigDigits = (numBands === 4) ? 2 : 3;
            let exponent = Math.floor(Math.log10(resistanceOhms));
            let significand = resistanceOhms / Math.pow(10, exponent);

            // Adjust significand and exponent to match E-series style if possible
            // Example: 47000 -> significand=4.7, exponent=4. Target: significand=47, exponent=3 (47 * 10^3)
            // Example: 100 -> significand=1, exponent=2. Target: significand=10, exponent=1 (10 * 10^1)

            // Round significand to required digits
             let roundedSignificand = parseFloat(significand.toPrecision(numSigDigits));

             // Adjust exponent based on rounding (if rounding caused overflow, e.g., 9.99 -> 10.0)
             if (roundedSignificand >= Math.pow(10, numSigDigits)) {
                roundedSignificand /= 10;
                exponent++;
             }

            // Ensure significand has the correct number of digits *before* the implicit decimal
            // This logic needs refinement to correctly represent E-series values like 4.7k vs 4700
             let significandStr = roundedSignificand.toString();
             let decimalPointIndex = significandStr.indexOf('.');

             if (decimalPointIndex === -1) { // Integer
                 while (significandStr.length < numSigDigits && exponent > -2) {
                     significandStr += '0';
                     exponent--; // Adjust exponent because we added a 'virtual' decimal place
                 }
                  while (significandStr.length > numSigDigits && exponent < 10) {
                      significandStr = significandStr.slice(0,-1);
                      exponent++; // Adjust exponent
                  }

             } else { // Has decimal
                 let requiredIntegerDigits = numSigDigits; // How many digits needed total
                 let currentIntegerDigits = decimalPointIndex;
                 let currentFractionalDigits = significandStr.length - 1 - decimalPointIndex;

                 // Simplify representation, e.g., 4.70 -> 47 * 10^-1 adjustment
                  let adjustedSignificand = roundedSignificand * Math.pow(10, currentFractionalDigits);
                  exponent -= currentFractionalDigits; // Adjust exponent

                  significandStr = Math.round(adjustedSignificand).toString(); // Round after adjustment

                 // Pad/truncate integer part if needed after adjustment
                  while (significandStr.length < numSigDigits && exponent > -2) {
                     significandStr += '0';
                     exponent--;
                 }
                 while (significandStr.length > numSigDigits && exponent < 10) {
                      significandStr = significandStr.slice(0,-1); // Trim from right
                      exponent++;
                 }

             }

            significantDigitsStr = significandStr.substring(0, numBands === 4 ? 2 : 3); // Take required digits
            powerOfTen = exponent;
            targetMultiplierValue = Math.pow(10, powerOfTen);
        }

        // Find colors for digits
        const digits = significantDigitsStr.split('').map(d => parseInt(d, 10));
        band1 = findColorForValue(digits[0], 'digit');
        band2 = findColorForValue(digits[1], 'digit');
        if (numBands >= 5 && digits.length > 2) {
            band3 = findColorForValue(digits[2], 'digit');
        }

        // Find color for multiplier
        const multiplierColor = findColorForValue(targetMultiplierValue, 'multiplier', ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gold', 'silver']);

        // Assign based on band count
        if (numBands === 4) {
            if (!band1 || !band2 || !multiplierColor) continue; // Needs Digit1, Digit2, Multiplier
            // If tolerance wasn't specified, default to 'none' (20%) for 4-band
            if (band5_tolerance === undefined) band5_tolerance = 'none';
            // For 4-band: Band3 = Multiplier, Band4 = Tolerance
            return {
                bands: { band1, band2, band3: multiplierColor, multiplier: band5_tolerance }, // band3 is multiplier, multiplier field holds tolerance color
                numBands: 4
            };
        } else if (numBands === 5) {
            if (!band1 || !band2 || !band3 || !multiplierColor) continue; // Needs Digit1, Digit2, Digit3, Multiplier
            // If tolerance wasn't specified, default to 'gold' (5%) for 5-band
            if (band5_tolerance === undefined) band5_tolerance = 'gold';
            // For 5-band: Band3 = Digit3, Band4 = Multiplier, Band5 = Tolerance
            return {
                bands: { band1, band2, band3, multiplier: multiplierColor, tolerance: band5_tolerance },
                numBands: 5
            };
        } else if (numBands === 6) {
             if (!band1 || !band2 || !band3 || !multiplierColor) continue; // Needs Digits + Multiplier
             // If tolerance wasn't specified, default to 'brown' (1%) for 6-band
             if (band5_tolerance === undefined) band5_tolerance = 'brown';
             // TempCo needs to be specified or defaulted
             band6_tempCoefficient = findColorForValue(100, 'tempCoefficient'); // Defaulting to 100ppm (Brown)
             if (!band6_tempCoefficient) band6_tempCoefficient = 'brown'; // Ensure default

             // For 6-band: Band3 = Digit3, Band4 = Multiplier, Band5 = Tolerance, Band6 = TempCo
             return {
                 bands: { band1, band2, band3, multiplier: multiplierColor, tolerance: band5_tolerance, tempCoefficient: band6_tempCoefficient },
                 numBands: 6
             };
        }
    }

    return { error: "Could not determine standard bands for this value. Try adjusting the input value or desired band count." };
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
    // const timeWithPhase = time + phaseRad / angularFrequency; // Applying phase by shifting time can be complex with modulo for square/triangle
     const phaseShift = phaseRad; // Apply phase directly inside the trigonometric/periodic function

    switch (type) {
      case 'sine':
        voltage = amplitude * Math.sin(angularFrequency * time + phaseShift);
        break;
      case 'square':
         // Calculate time within the cycle, incorporating phase shift
          // Effective time for cycle calculation = angularFrequency * time + phaseShift
          // We need to map this to a 0 to 2*PI range (or 0 to period)
         const cyclePosSquare = (angularFrequency * time + phaseShift) / (2 * Math.PI); // Position within cycle (0 to 1 range, approx)
         let timeInCycleSquare = (cyclePosSquare % 1) * period; // Time within the 0 to period range
         // Ensure timeInCycle is positive for modulo results
         if (timeInCycleSquare < 0) timeInCycleSquare += period;
         voltage = timeInCycleSquare < period / 2 ? amplitude : -amplitude;
        break;
      case 'triangle':
          const cyclePosTriangle = (angularFrequency * time + phaseShift) / (2 * Math.PI);
          let timeInCycleTriangle = (cyclePosTriangle % 1) * period;
           // Ensure timeInCycleTriangle is always positive
           if (timeInCycleTriangle < 0) timeInCycleTriangle += period;


         if (timeInCycleTriangle < period / 2) {
             // Rising edge: from -A to +A over period/2
             voltage = -amplitude + (2 * amplitude) * (timeInCycleTriangle / (period / 2));
         } else {
             // Falling edge: from +A to -A over period/2
             voltage = amplitude - (2 * amplitude) * ((timeInCycleTriangle - period / 2) / (period / 2));
         }
        break;
    }
    // Clamp voltage to amplitude limits just in case of calculation quirks (less likely with corrected formulas)
     // voltage = Math.max(-Math.abs(amplitude), Math.min(Math.abs(amplitude), voltage)); // Clamp based on absolute amplitude
    data.push({ time, voltage });
  }
  return data;
}
