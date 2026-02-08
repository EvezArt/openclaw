/**
 * Tests for hypothesis panel formatting utilities
 */

import { describe, expect, it } from "vitest";
import {
  formatElapsed,
  formatHypothesisOutcome,
  formatHypothesisScore,
  formatHypothesisStatus,
} from "./hypothesis-panel.js";

describe("hypothesis-panel formatters", () => {
  describe("formatHypothesisStatus", () => {
    it("should format active status", () => {
      expect(formatHypothesisStatus("active")).toBe("●");
    });

    it("should format stale status", () => {
      expect(formatHypothesisStatus("stale")).toBe("○");
    });

    it("should format resolved status", () => {
      expect(formatHypothesisStatus("resolved")).toBe("✓");
    });
  });

  describe("formatHypothesisOutcome", () => {
    it("should format accepted outcome", () => {
      expect(formatHypothesisOutcome("accepted")).toBe("✓ accepted");
    });

    it("should format rejected outcome", () => {
      expect(formatHypothesisOutcome("rejected")).toBe("✗ rejected");
    });

    it("should format abandoned outcome", () => {
      expect(formatHypothesisOutcome("abandoned")).toBe("⊘ abandoned");
    });

    it("should format null outcome", () => {
      expect(formatHypothesisOutcome(null)).toBe("");
    });
  });

  describe("formatHypothesisScore", () => {
    it("should format score as percentage", () => {
      expect(formatHypothesisScore(0.75)).toBe("75%");
      expect(formatHypothesisScore(0.5)).toBe("50%");
      expect(formatHypothesisScore(1.0)).toBe("100%");
      expect(formatHypothesisScore(0.0)).toBe("0%");
    });

    it("should clamp score to 0-100 range", () => {
      expect(formatHypothesisScore(1.5)).toBe("100%");
      expect(formatHypothesisScore(-0.5)).toBe("0%");
    });

    it("should round score to nearest integer", () => {
      expect(formatHypothesisScore(0.755)).toBe("76%");
      expect(formatHypothesisScore(0.744)).toBe("74%");
    });
  });

  describe("formatElapsed", () => {
    it("should format seconds", () => {
      const now = Date.now();
      expect(formatElapsed(now)).toBe("0s");
      expect(formatElapsed(now - 5000)).toBe("5s");
      expect(formatElapsed(now - 30000)).toBe("30s");
      expect(formatElapsed(now - 59000)).toBe("59s");
    });

    it("should format minutes and seconds", () => {
      const now = Date.now();
      expect(formatElapsed(now - 60000)).toBe("1m 0s");
      expect(formatElapsed(now - 90000)).toBe("1m 30s");
      expect(formatElapsed(now - 125000)).toBe("2m 5s");
    });

    it("should handle future timestamps", () => {
      const now = Date.now();
      expect(formatElapsed(now + 5000)).toBe("0s");
    });
  });
});
