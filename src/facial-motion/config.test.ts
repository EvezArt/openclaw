/**
 * Tests for configuration validation
 */

import { describe, it, expect } from "vitest";
import { validateConfig, mergeConfig, DEFAULT_CONFIG } from "./config.js";
import type { FacialMotionConfig } from "./types.js";

describe("validateConfig", () => {
  it("should pass validation for valid config", () => {
    const config: FacialMotionConfig = {
      ...DEFAULT_CONFIG,
      consentAcknowledged: true,
    };

    const errors = validateConfig(config);
    expect(errors).toEqual([]);
  });

  it("should fail if consent not acknowledged", () => {
    const config: FacialMotionConfig = {
      ...DEFAULT_CONFIG,
      consentAcknowledged: false,
    };

    const errors = validateConfig(config);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain("consent");
  });

  it("should fail for invalid FPS", () => {
    const config: FacialMotionConfig = {
      ...DEFAULT_CONFIG,
      consentAcknowledged: true,
      targetFps: 0,
    };

    const errors = validateConfig(config);
    expect(errors.some((e) => e.includes("FPS"))).toBe(true);
  });

  it("should fail for too high FPS", () => {
    const config: FacialMotionConfig = {
      ...DEFAULT_CONFIG,
      consentAcknowledged: true,
      targetFps: 200,
    };

    const errors = validateConfig(config);
    expect(errors.some((e) => e.includes("FPS"))).toBe(true);
  });

  it("should fail for small window size", () => {
    const config: FacialMotionConfig = {
      ...DEFAULT_CONFIG,
      consentAcknowledged: true,
      windowSize: 5,
    };

    const errors = validateConfig(config);
    expect(errors.some((e) => e.includes("Window size"))).toBe(true);
  });

  it("should fail for invalid WebSocket port", () => {
    const config: FacialMotionConfig = {
      ...DEFAULT_CONFIG,
      consentAcknowledged: true,
      webSocketPort: 100, // Too low
    };

    const errors = validateConfig(config);
    expect(errors.some((e) => e.includes("port"))).toBe(true);
  });

  it("should fail if no output methods enabled", () => {
    const config: FacialMotionConfig = {
      ...DEFAULT_CONFIG,
      consentAcknowledged: true,
      enablePreview: false,
      enableNdjsonStream: false,
      enableWebSocket: false,
    };

    const errors = validateConfig(config);
    expect(errors.some((e) => e.includes("output method"))).toBe(true);
  });
});

describe("mergeConfig", () => {
  it("should merge partial config with base", () => {
    const base = DEFAULT_CONFIG;
    const overrides = {
      targetFps: 60,
      consentAcknowledged: true,
    };

    const result = mergeConfig(base, overrides);

    expect(result.targetFps).toBe(60);
    expect(result.consentAcknowledged).toBe(true);
    expect(result.windowSize).toBe(DEFAULT_CONFIG.windowSize);
  });

  it("should not mutate base config", () => {
    const base = { ...DEFAULT_CONFIG };
    const overrides = { targetFps: 60 };

    mergeConfig(base, overrides);

    expect(base.targetFps).toBe(DEFAULT_CONFIG.targetFps);
  });
});
