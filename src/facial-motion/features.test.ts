/**
 * Tests for facial motion feature extraction
 */

import { describe, it, expect } from "vitest";
import { extractMotionFeatures, detectBlink, detectMouthOpen } from "./features.js";
import type { FaceLandmarks } from "./types.js";

describe("extractMotionFeatures", () => {
  it("should return null for null landmarks", () => {
    const result = extractMotionFeatures(null, Date.now());
    expect(result).toBeNull();
  });

  it("should return null for empty landmarks", () => {
    const landmarks: FaceLandmarks = {
      points: [],
      boundingBox: { x: 0, y: 0, width: 100, height: 100 },
    };
    const result = extractMotionFeatures(landmarks, Date.now());
    expect(result).toBeNull();
  });

  it("should extract features from 68-point landmarks", () => {
    // Create synthetic 68-point landmarks
    const points: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < 68; i++) {
      points.push({ x: i * 10, y: i * 10 });
    }

    const landmarks: FaceLandmarks = {
      points,
      boundingBox: { x: 0, y: 0, width: 680, height: 680 },
    };

    const timestamp = Date.now();
    const result = extractMotionFeatures(landmarks, timestamp);

    expect(result).not.toBeNull();
    expect(result?.leftEyeAspectRatio).toBeGreaterThanOrEqual(0);
    expect(result?.rightEyeAspectRatio).toBeGreaterThanOrEqual(0);
    expect(result?.mouthAspectRatio).toBeGreaterThanOrEqual(0);
    expect(result?.headPose).toBeDefined();
    expect(result?.timestamp).toBe(timestamp);
  });

  it("should extract features from MediaPipe 468-point landmarks", () => {
    // Create synthetic 468-point landmarks
    const points: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < 468; i++) {
      points.push({ x: i * 2, y: i * 2 });
    }

    const landmarks: FaceLandmarks = {
      points,
      boundingBox: { x: 0, y: 0, width: 936, height: 936 },
    };

    const timestamp = Date.now();
    const result = extractMotionFeatures(landmarks, timestamp);

    expect(result).not.toBeNull();
    expect(result?.leftEyeAspectRatio).toBeGreaterThanOrEqual(0);
    expect(result?.rightEyeAspectRatio).toBeGreaterThanOrEqual(0);
    expect(result?.mouthAspectRatio).toBeGreaterThanOrEqual(0);
    expect(result?.headPose).toBeDefined();
    expect(result?.timestamp).toBe(timestamp);
  });
});

describe("detectBlink", () => {
  it("should detect blink when EAR is below threshold", () => {
    const leftEar = 0.15;
    const rightEar = 0.18;
    const threshold = 0.2;

    const result = detectBlink(leftEar, rightEar, threshold);
    expect(result).toBe(true);
  });

  it("should not detect blink when EAR is above threshold", () => {
    const leftEar = 0.25;
    const rightEar = 0.28;
    const threshold = 0.2;

    const result = detectBlink(leftEar, rightEar, threshold);
    expect(result).toBe(false);
  });

  it("should use default threshold", () => {
    const leftEar = 0.15;
    const rightEar = 0.15;

    const result = detectBlink(leftEar, rightEar);
    expect(result).toBe(true);
  });
});

describe("detectMouthOpen", () => {
  it("should detect mouth open when MAR is above threshold", () => {
    const mar = 0.6;
    const threshold = 0.5;

    const result = detectMouthOpen(mar, threshold);
    expect(result).toBe(true);
  });

  it("should not detect mouth open when MAR is below threshold", () => {
    const mar = 0.4;
    const threshold = 0.5;

    const result = detectMouthOpen(mar, threshold);
    expect(result).toBe(false);
  });

  it("should use default threshold", () => {
    const mar = 0.6;

    const result = detectMouthOpen(mar);
    expect(result).toBe(true);
  });
});
