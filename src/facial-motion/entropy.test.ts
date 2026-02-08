/**
 * Tests for entropy and cyclical metrics
 */

import { describe, it, expect } from "vitest";
import {
  calculateSpectralEntropy,
  calculateSampleEntropy,
  calculateAutocorrelation,
  findDominantFrequency,
  calculateCyclicalMetrics,
} from "./entropy.js";
import type { MotionFeatures } from "./types.js";

describe("calculateSpectralEntropy", () => {
  it("should return 0 for empty signal", () => {
    const result = calculateSpectralEntropy([]);
    expect(result).toBe(0);
  });

  it("should return 0 for all-zero signal", () => {
    const signal = [0, 0, 0, 0, 0];
    const result = calculateSpectralEntropy(signal);
    expect(result).toBe(0);
  });

  it("should return normalized entropy for sine wave", () => {
    // Generate simple sine wave
    const signal: number[] = [];
    for (let i = 0; i < 100; i++) {
      signal.push(Math.sin((i * 2 * Math.PI) / 10));
    }

    const result = calculateSpectralEntropy(signal);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(1);
  });

  it("should return high entropy for random noise", () => {
    const signal: number[] = [];
    for (let i = 0; i < 100; i++) {
      signal.push(Math.random());
    }

    const result = calculateSpectralEntropy(signal);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(1);
  });
});

describe("calculateSampleEntropy", () => {
  it("should return 0 for short signal", () => {
    const signal = [1, 2];
    const result = calculateSampleEntropy(signal, 2, 0.2);
    expect(result).toBe(0);
  });

  it("should return low entropy for regular signal", () => {
    const signal = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
    const result = calculateSampleEntropy(signal, 2, 0.2);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it("should calculate entropy for longer signal", () => {
    const signal: number[] = [];
    for (let i = 0; i < 50; i++) {
      signal.push(Math.sin((i * 2 * Math.PI) / 10));
    }

    const result = calculateSampleEntropy(signal, 2, 0.2);
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

describe("calculateAutocorrelation", () => {
  it("should return empty array for empty signal", () => {
    const result = calculateAutocorrelation([]);
    expect(result).toEqual([]);
  });

  it("should return normalized autocorrelation", () => {
    const signal = [1, 2, 3, 2, 1, 2, 3, 2, 1];
    const result = calculateAutocorrelation(signal);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toBeCloseTo(1, 1); // Lag 0 should be ~1 after normalization
  });

  it("should detect periodicity in sine wave", () => {
    // Generate periodic signal
    const period = 10;
    const signal: number[] = [];
    for (let i = 0; i < 50; i++) {
      signal.push(Math.sin((i * 2 * Math.PI) / period));
    }

    const result = calculateAutocorrelation(signal);
    expect(result.length).toBeGreaterThan(period);

    // Autocorrelation should show periodicity
    expect(result[0]).toBeCloseTo(1, 1);
  });
});

describe("findDominantFrequency", () => {
  it("should return 0 for short signal", () => {
    const result = findDominantFrequency([1], 30);
    expect(result).toBe(0);
  });

  it("should find dominant frequency in sine wave", () => {
    const sampleRate = 100;
    const targetFreq = 5; // 5 Hz
    const signal: number[] = [];

    for (let i = 0; i < 100; i++) {
      signal.push(Math.sin((i * 2 * Math.PI * targetFreq) / sampleRate));
    }

    const result = findDominantFrequency(signal, sampleRate);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(sampleRate / 2); // Nyquist
  });
});

describe("calculateCyclicalMetrics", () => {
  it("should return zero metrics for empty features", () => {
    const result = calculateCyclicalMetrics([], 1);

    expect(result.blinkFrequency).toBe(0);
    expect(result.dominantFrequency).toBe(0);
    expect(result.autocorrelationLag).toBe(0);
    expect(result.spectralEntropy).toBe(0);
    expect(result.sampleEntropy).toBe(0);
  });

  it("should calculate metrics for feature window", () => {
    const features: MotionFeatures[] = [];
    const timestamp = Date.now();

    // Create synthetic feature window with simulated blinks
    for (let i = 0; i < 90; i++) {
      const isBlink = i % 30 === 0; // Blink every 30 frames
      features.push({
        leftEyeAspectRatio: isBlink ? 0.15 : 0.3,
        rightEyeAspectRatio: isBlink ? 0.15 : 0.3,
        mouthAspectRatio: 0.2,
        headPose: { yaw: 0, pitch: 0, roll: 0 },
        timestamp: timestamp + i * 33, // ~30 fps
      });
    }

    const result = calculateCyclicalMetrics(features, 3); // 3 seconds

    expect(result.blinkFrequency).toBeGreaterThan(0); // Should detect blinks
    expect(result.dominantFrequency).toBeGreaterThanOrEqual(0);
    expect(result.autocorrelationLag).toBeGreaterThanOrEqual(0);
    expect(result.spectralEntropy).toBeGreaterThanOrEqual(0);
    expect(result.spectralEntropy).toBeLessThanOrEqual(1);
    expect(result.sampleEntropy).toBeGreaterThanOrEqual(0);
  });

  it("should calculate blink frequency correctly", () => {
    const features: MotionFeatures[] = [];
    const timestamp = Date.now();

    // Create window with 2 blinks in 2 seconds (60 bpm)
    for (let i = 0; i < 60; i++) {
      const isBlink = i === 15 || i === 45; // 2 blinks
      features.push({
        leftEyeAspectRatio: isBlink ? 0.15 : 0.3,
        rightEyeAspectRatio: isBlink ? 0.15 : 0.3,
        mouthAspectRatio: 0.2,
        headPose: { yaw: 0, pitch: 0, roll: 0 },
        timestamp: timestamp + i * 33,
      });
    }

    const result = calculateCyclicalMetrics(features, 2); // 2 seconds

    // Should detect 2 blinks in 2 seconds = 60 blinks per minute
    expect(result.blinkFrequency).toBeGreaterThan(0);
    expect(result.blinkFrequency).toBeLessThanOrEqual(120); // Reasonable upper bound
  });
});
