
import {
    calculateSubnetDetails,
    isValidIPv4,
    ipToBinaryString,
    cidrToSubnetMask,
    cidrToWildcardMask,
    convertBase,
    performConversions,
    calculateResistorFromBands,
    valueToResistorBands,
    parseResistanceValue,
    formatIpBinaryString,
    formatBinaryString,
} from '../lib/calculator-utils';
import type { ResistorBandColor } from '../types/calculator';

// --- IP Address and Subnetting Tests ---
describe('IP Address Utilities', () => {
  test('isValidIPv4 validates correct IPs', () => {
    expect(isValidIPv4('192.168.1.1')).toBe(true);
    expect(isValidIPv4('0.0.0.0')).toBe(true);
    expect(isValidIPv4('255.255.255.255')).toBe(true);
  });

  test('isValidIPv4 invalidates incorrect IPs', () => {
    expect(isValidIPv4('192.168.1.256')).toBe(false);
    expect(isValidIPv4('192.168.1')).toBe(false);
    expect(isValidIPv4('192.168.1.1.1')).toBe(false);
    expect(isValidIPv4('abc.def.ghi.jkl')).toBe(false);
    expect(isValidIPv4('192.168.01.1')).toBe(false); // Leading zero
  });

  test('ipToBinaryString converts IP to binary', () => {
    expect(ipToBinaryString('192.168.1.1')).toBe('11000000.10101000.00000001.00000001');
    expect(ipToBinaryString('0.0.0.0')).toBe('00000000.00000000.00000000.00000000');
    expect(ipToBinaryString('invalid')).toBeNull();
  });

   test('formatIpBinaryString formats binary IP', () => {
       expect(formatIpBinaryString('11000000101010000000000100000001')).toBe('11000000.10101000.00000001.00000001');
       expect(formatIpBinaryString('11000000.10101000.00000001.00000001')).toBe('11000000.10101000.00000001.00000001'); // Handles existing dots
       expect(formatIpBinaryString('1')).toBe('00000000.00000000.00000000.00000001'); // Pads correctly
       expect(formatIpBinaryString(undefined)).toBe('N/A');
   });

  test('cidrToSubnetMask converts CIDR to mask', () => {
    expect(cidrToSubnetMask(24)).toBe('255.255.255.0');
    expect(cidrToSubnetMask(16)).toBe('255.255.0.0');
    expect(cidrToSubnetMask(32)).toBe('255.255.255.255');
    expect(cidrToSubnetMask(0)).toBe('0.0.0.0');
    expect(() => cidrToSubnetMask(33)).toThrow();
  });

  test('cidrToWildcardMask converts CIDR to wildcard', () => {
      expect(cidrToWildcardMask(24)).toBe('0.0.0.255');
      expect(cidrToWildcardMask(16)).toBe('0.0.255.255');
      expect(cidrToWildcardMask(32)).toBe('0.0.0.0');
      expect(cidrToWildcardMask(0)).toBe('255.255.255.255');
      expect(() => cidrToWildcardMask(-1)).toThrow();
  });

  test('calculateSubnetDetails calculates correctly for /24', () => {
    const details = calculateSubnetDetails('192.168.1.100', 24);
    expect(details?.networkAddress).toBe('192.168.1.0');
    expect(details?.broadcastAddress).toBe('192.168.1.255');
    expect(details?.firstUsableHost).toBe('192.168.1.1');
    expect(details?.lastUsableHost).toBe('192.168.1.254');
    expect(details?.subnetMask).toBe('255.255.255.0');
    expect(details?.wildcardMask).toBe('0.0.0.255');
    expect(details?.totalHosts).toBe(256);
    expect(details?.usableHosts).toBe(254);
  });

  test('calculateSubnetDetails calculates correctly for /27', () => {
    const details = calculateSubnetDetails('10.1.1.1', 27);
    expect(details?.networkAddress).toBe('10.1.1.0');
    expect(details?.broadcastAddress).toBe('10.1.1.31');
    expect(details?.firstUsableHost).toBe('10.1.1.1');
    expect(details?.lastUsableHost).toBe('10.1.1.30');
    expect(details?.subnetMask).toBe('255.255.255.224');
     expect(details?.wildcardMask).toBe('0.0.0.31');
    expect(details?.totalHosts).toBe(32);
    expect(details?.usableHosts).toBe(30);
  });

  test('calculateSubnetDetails handles /31 and /32 edge cases', () => {
      const details31 = calculateSubnetDetails('192.168.1.0', 31);
      expect(details31?.networkAddress).toBe('192.168.1.0');
      expect(details31?.broadcastAddress).toBe('192.168.1.1');
      expect(details31?.firstUsableHost).toBe('N/A');
      expect(details31?.lastUsableHost).toBe('N/A');
      expect(details31?.totalHosts).toBe(2);
      expect(details31?.usableHosts).toBe(0); // Or 2, depending on RFC 3021 interpretation

      const details32 = calculateSubnetDetails('192.168.1.5', 32);
      expect(details32?.networkAddress).toBe('192.168.1.5');
      expect(details32?.broadcastAddress).toBe('192.168.1.5');
      expect(details32?.firstUsableHost).toBe('N/A');
      expect(details32?.lastUsableHost).toBe('N/A');
      expect(details32?.totalHosts).toBe(1);
      expect(details32?.usableHosts).toBe(0);
  });

    test('calculateSubnetDetails returns null for invalid input', () => {
      expect(calculateSubnetDetails('invalid-ip', 24)).toBeNull();
      expect(calculateSubnetDetails('192.168.1.1', 33)).toBeNull();
    });
});

// --- Base Conversion Tests ---
describe('Base Conversion Utilities', () => {
  test('convertBase converts correctly', () => {
    expect(convertBase('42', 'dec', 'bin')).toBe('101010');
    expect(convertBase('42', 'dec', 'hex')).toBe('2A');
    expect(convertBase('101010', 'bin', 'dec')).toBe('42');
    expect(convertBase('101010', 'bin', 'hex')).toBe('2A');
    expect(convertBase('2A', 'hex', 'dec')).toBe('42');
    expect(convertBase('2a', 'hex', 'bin')).toBe('101010');
    expect(convertBase('10', 'dec', 'bin')).toBe('1010');
  });

  test('convertBase handles invalid input', () => {
    expect(convertBase('xyz', 'dec', 'bin')).toBeNull();
    expect(convertBase('102', 'bin', 'dec')).toBeNull();
    expect(convertBase('G', 'hex', 'dec')).toBeNull();
    expect(convertBase('', 'dec', 'bin')).toBe('');
  });

    test('performConversions works correctly', () => {
      expect(performConversions('42', 'dec')).toEqual({ binary: '101010', decimal: '42', hexadecimal: '2A' });
      expect(performConversions('1111', 'bin')).toEqual({ binary: '1111', decimal: '15', hexadecimal: 'F' });
      expect(performConversions('1A3F', 'hex')).toEqual({ binary: '1101000111111', decimal: '6719', hexadecimal: '1A3F' });
      expect(performConversions('', 'dec')).toEqual({ binary: '', decimal: '', hexadecimal: '' });
    });

    test('performConversions returns null on error', () => {
        expect(performConversions('invalid', 'dec')).toBeNull();
    });

     test('formatBinaryString formats binary strings correctly', () => {
        expect(formatBinaryString('101010')).toBe('00101010'); // Pads and formats single chunk
        expect(formatBinaryString('11111111000000001', 8)).toBe('00000001 11111111 00000001'); // Pads last chunk and formats multiple
        expect(formatBinaryString('1010', 4)).toBe('1010'); // Works with different chunk sizes
        expect(formatBinaryString('10101', 4)).toBe('0101 0101'); // Pads last chunk for different size
        expect(formatBinaryString('')).toBe('');
     });
});

// --- Resistor Calculation Tests ---
describe('Resistor Utilities', () => {
    test('calculateResistorFromBands - 4 bands', () => {
        // Brown, Black, Red, Gold => 1kΩ 5%
        const result = calculateResistorFromBands({ band1: 'brown', band2: 'black', band3: 'red', multiplier: 'gold' }, 4);
        expect(result.resistance).toBe(1000);
        expect(result.tolerance).toBe(5);
        expect(result.resistanceString).toBe('1 kΩ');
    });

    test('calculateResistorFromBands - 5 bands', () => {
        // Red, Violet, Green, Orange, Brown => 275kΩ 1%
        const result = calculateResistorFromBands({ band1: 'red', band2: 'violet', band3: 'green', multiplier: 'orange', tolerance: 'brown' }, 5);
        expect(result.resistance).toBe(275000);
        expect(result.tolerance).toBe(1);
        expect(result.resistanceString).toBe('275 kΩ');
    });

     test('calculateResistorFromBands - 6 bands', () => {
         // Yellow, Violet, Orange, Red, Blue, Red => 473Ω 0.25% 50ppm
         const result = calculateResistorFromBands({ band1: 'yellow', band2: 'violet', band3: 'orange', multiplier: 'black', tolerance: 'blue', tempCoefficient: 'red' }, 6);
         expect(result.resistance).toBe(473);
         expect(result.tolerance).toBe(0.25);
         expect(result.tempCoefficient).toBe(50);
         expect(result.resistanceString).toBe('473 Ω');
     });

    test('calculateResistorFromBands handles invalid/missing bands', () => {
      // Missing multiplier (band3) for 4-band
      const result4 = calculateResistorFromBands({ band1: 'brown', band2: 'black', multiplier: 'gold' }, 4);
      expect(result4.resistance).toBeNull();
      expect(result4.tolerance).toBeNull(); // Should also be null or default based on logic

      // Missing digit 3 for 5-band
      const result5 = calculateResistorFromBands({ band1: 'red', band2: 'violet', multiplier: 'orange', tolerance: 'brown' }, 5);
      expect(result5.resistance).toBeNull();
    });

    test('parseResistanceValue parses correctly', () => {
        expect(parseResistanceValue('4.7k')).toBe(4700);
        expect(parseResistanceValue('1M')).toBe(1000000);
        expect(parseResistanceValue('220')).toBe(220);
        expect(parseResistanceValue('1G')).toBe(1000000000);
        expect(parseResistanceValue('4k7')).toBe(4700);
        expect(parseResistanceValue('R33')).toBe(0.33); // Should handle R as decimal? - Current logic doesn't
        expect(parseResistanceValue('100 ohms')).toBe(100);
        expect(parseResistanceValue('invalid')).toBeNull();
        expect(parseResistanceValue('')).toBeNull();
    });

    test('valueToResistorBands - 4 bands', () => {
        const result = valueToResistorBands('1k', 5, [4]);
        expect(result.error).toBeUndefined();
        expect(result.numBands).toBe(4);
        expect(result.bands).toEqual({ band1: 'brown', band2: 'black', band3: 'red', multiplier: 'gold' });
    });

    test('valueToResistorBands - 5 bands', () => {
         // 275k 1%
        const result = valueToResistorBands('275k', 1, [5]);
        expect(result.error).toBeUndefined();
        expect(result.numBands).toBe(5);
        expect(result.bands).toEqual({ band1: 'red', band2: 'violet', band3: 'green', multiplier: 'orange', tolerance: 'brown' });
    });

     test('valueToResistorBands - 6 bands (defaults tempco)', () => {
         // 473 0.25% -> assumes 100ppm default
         const result = valueToResistorBands('473', 0.25, [6]);
         expect(result.error).toBeUndefined();
         expect(result.numBands).toBe(6);
         expect(result.bands).toEqual({ band1: 'yellow', band2: 'violet', band3: 'orange', multiplier: 'black', tolerance: 'blue', tempCoefficient: 'brown' }); // Expect default Brown tempco
     });

     test('valueToResistorBands handles non-standard tolerance', () => {
        const result = valueToResistorBands('1k', 7, [4]); // 7% is not standard
        expect(result.error).toContain('No standard color band found for tolerance');
        expect(result.bands).toBeUndefined();
     });

     test('valueToResistorBands handles non-exact E-series values', () => {
         // Should find the closest representation for 1234 ohms
         const result = valueToResistorBands('1234', 5, [4]);
         expect(result.error).toBeUndefined();
         // Expects 1.2k -> brown, red, red, gold
         expect(result.bands).toEqual({ band1: 'brown', band2: 'red', band3: 'red', multiplier: 'gold' });

         const result5band = valueToResistorBands('1234', 1, [5]);
          // Expects 123 * 10 -> brown, red, orange, brown, brown
         expect(result5band.bands).toEqual({ band1: 'brown', band2: 'red', band3: 'orange', multiplier: 'brown', tolerance: 'brown' });
     });
});

// --- Waveform Tests (Basic) ---
// describe('Waveform Utilities', () => {
//   test('generateWaveformData generates sine wave', () => {
//     const data = generateWaveformData({ type: 'sine', frequency: 1, amplitude: 5, duration: 1, samples: 5 });
//     expect(data.length).toBe(5);
//     expect(data[0].voltage).toBeCloseTo(0); // sin(0) = 0
//     expect(data[1].voltage).toBeCloseTo(5); // sin(pi/2) = 1 => 5*1 = 5 (time = 0.25)
//     expect(data[2].voltage).toBeCloseTo(0); // sin(pi) = 0 (time = 0.5)
//     expect(data[3].voltage).toBeCloseTo(-5); // sin(3pi/2) = -1 => 5*-1 = -5 (time = 0.75)
//     expect(data[4].voltage).toBeCloseTo(0); // sin(2pi) = 0 (time = 1)
//   });

//   test('generateWaveformData generates square wave', () => {
//     const data = generateWaveformData({ type: 'square', frequency: 1, amplitude: 2, duration: 1, samples: 5 });
//     expect(data.length).toBe(5);
//     expect(data[0].voltage).toBe(2); // t=0
//     expect(data[1].voltage).toBe(2); // t=0.25
//     expect(data[2].voltage).toBe(-2); // t=0.5
//     expect(data[3].voltage).toBe(-2); // t=0.75
//     // Value at t=1 depends on implementation detail (start of next cycle or end of current)
//     // expect(data[4].voltage).toBe(2);
//   });

//   test('generateWaveformData generates triangle wave', () => {
//       const data = generateWaveformData({ type: 'triangle', frequency: 1, amplitude: 4, duration: 1, samples: 5 });
//       expect(data.length).toBe(5);
//       expect(data[0].voltage).toBeCloseTo(-4); // t=0
//       expect(data[1].voltage).toBeCloseTo(4); // t=0.25 (peak)
//       expect(data[2].voltage).toBeCloseTo(-4); // t=0.5 (trough)
//       expect(data[3].voltage).toBeCloseTo(4); // t=0.75 (peak)
//       expect(data[4].voltage).toBeCloseTo(-4); // t=1
//   });

//    test('generateWaveformData handles invalid params', () => {
//        expect(generateWaveformData({ type: 'sine', frequency: 0, amplitude: 1 })).toEqual([]);
//        expect(generateWaveformData({ type: 'sine', frequency: 1, amplitude: 1, samples: 1 })).toEqual([]);
//    });
// });
