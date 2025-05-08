// src/__tests__/lib/waveform-utils.test.ts
import {
  generateSineWave,
  generateSquareWave,
  generateTriangleWave,
  generateSawtoothWave,
} from '@/lib/waveform-utils';
import type { WaveformParams, DataPoint } from '@/types/waveform';

const baseParams: WaveformParams = {
  type: 'sine', // Will be overridden in tests
  amplitude: 5,
  frequency: 1, // 1 Hz means period is 1 second (1000 ms)
  phase: 0,
  dcOffset: 0,
  timeWindowMs: 1000, // 1 full cycle for 1Hz
  samplingRateHz: 1000, // 1 point per ms
};

describe('Waveform Generation Utilities', () => {
  describe('generateSineWave', () => {
    test('should generate correct number of points', () => {
      const params = { ...baseParams, type: 'sine' as const };
      const numPoints = Math.floor((params.timeWindowMs / 1000) * params.samplingRateHz);
      const points = generateSineWave(params, numPoints);
      expect(points.length).toBe(numPoints);
    });

    test('should generate V(0) = dcOffset for 0 phase', () => {
      const params = { ...baseParams, type: 'sine' as const, phase: 0, dcOffset: 2 };
      const points = generateSineWave(params, 1000);
      expect(points[0].voltage).toBeCloseTo(2); // A * sin(0) + offset = offset
    });

    test('should generate V(T/4) = Amplitude + dcOffset for 0 phase', () => {
      const params = { ...baseParams, type: 'sine' as const, phase: 0, dcOffset: 1, timeWindowMs: 1000, samplingRateHz: 1000 }; // 1 point per ms
      // T = 1000ms, T/4 = 250ms. index = 250
      const points = generateSineWave(params, 1000);
      expect(points[250].voltage).toBeCloseTo(params.amplitude + params.dcOffset); // A * sin(pi/2) + offset
    });

    test('should handle phase shift correctly (90 degrees)', () => {
      const params = { ...baseParams, type: 'sine' as const, phase: 90, dcOffset: 0 }; // 90 deg = pi/2 rad
      const points = generateSineWave(params, 1000);
      // V(0) = A * sin(pi/2) = A
      expect(points[0].voltage).toBeCloseTo(params.amplitude);
    });
  });

  describe('generateSquareWave', () => {
    test('should alternate between +A and -A', () => {
      const params = { ...baseParams, type: 'square' as const, amplitude: 3, dcOffset: 1 };
      const points = generateSquareWave(params, 1000);
      // First point (t=0) should be A + offset = 3 + 1 = 4
      expect(points[0].voltage).toBeCloseTo(4);
      // Point after half period (T/2 = 500ms) should be -A + offset = -3 + 1 = -2
      // Exact index for T/2 (e.g., 500 for 1000 points over 1000ms)
      expect(points[500].voltage).toBeCloseTo(-2);
    });
  });

  describe('generateTriangleWave', () => {
    test('should start at -A + offset and peak at +A + offset', () => {
      const params = { ...baseParams, type: 'triangle' as const, amplitude: 4, dcOffset: 0 };
      const points = generateTriangleWave(params, 1001); // Use odd number for precise center
      expect(points[0].voltage).toBeCloseTo(-params.amplitude + params.dcOffset);
      // T/2 for triangle is where it peaks, index 500 for 1001 points
      expect(points[500].voltage).toBeCloseTo(params.amplitude + params.dcOffset);
      // T for triangle, back to -A, index 1000
      expect(points[1000].voltage).toBeCloseTo(-params.amplitude + params.dcOffset);
    });
  });

  describe('generateSawtoothWave', () => {
    test('should ramp from -A to +A', () => {
      const params = { ...baseParams, type: 'sawtooth' as const, amplitude: 2, dcOffset: 0 };
      const points = generateSawtoothWave(params, 1000);
      expect(points[0].voltage).toBeCloseTo(-params.amplitude + params.dcOffset);
      // Almost at the end of the period, should be close to +A
      // For 1000 points over 1000ms, index 999 is last point of ramp before reset
      expect(points[999].voltage).toBeCloseTo(params.amplitude + params.dcOffset, 0);
    });
  });

  // Test for number of points and time steps
  test('waveform generation uses correct number of points and time steps', () => {
    const params = { ...baseParams, timeWindowMs: 100, samplingRateHz: 1000 }; // 100ms window, 1000 samples/sec -> 100 points
    const expectedNumPoints = Math.max(2, Math.floor((params.timeWindowMs / 1000) * params.samplingRateHz)); // Ensure at least 2 points
    const points = generateSineWave(params, expectedNumPoints);
    
    expect(points.length).toBe(expectedNumPoints);
    if (expectedNumPoints > 1) {
        const expectedTimeStepMs = params.timeWindowMs / (expectedNumPoints -1); // time between points
        expect(points[1].time - points[0].time).toBeCloseTo(expectedTimeStepMs);
        expect(points[expectedNumPoints - 1].time).toBeCloseTo(params.timeWindowMs);
    } else if (expectedNumPoints === 1) { // Should be 2 if timeWindow > 0
        expect(points[0].time).toBe(0); // Or timeWindowMs, depending on how single point is handled
    }
  });
});

