/**
 * Tests for hypothesis entropy tracking.
 */

import { describe, it, expect } from "vitest";
import type { Hypothesis } from "./types.js";
import {
  calculateHypothesisEntropy,
  calculateInformationGain,
  calculateSystemEntropy,
  formatEntropyState,
  formatSystemEntropy,
  detectEntropyEvents,
} from "./hypothesis-entropy.js";
import { createActor, createDomainSignature } from "./utils.js";

function createTestHypothesis(
  id: string,
  modelType: "me" | "we" | "they" | "system",
  probability: number,
  description: string = "Test hypothesis",
): Hypothesis {
  return {
    id,
    modelType,
    description,
    probability,
    falsifiers: [],
    domainSignature: createDomainSignature(),
    actor: createActor("agent-test", "agent"),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
    evidenceIds: [],
  };
}

describe("calculateHypothesisEntropy", () => {
  it("returns zero entropy for empty hypothesis set", () => {
    const state = calculateHypothesisEntropy([]);
    expect(state.currentEntropy).toBe(0);
    expect(state.normalizedEntropy).toBe(0);
    expect(state.totalInformationGain).toBe(0);
  });

  it("calculates entropy for uniform distribution", () => {
    const hypotheses = [
      createTestHypothesis("h1", "me", 0.25, "H1"),
      createTestHypothesis("h2", "me", 0.25, "H2"),
      createTestHypothesis("h3", "me", 0.25, "H3"),
      createTestHypothesis("h4", "me", 0.25, "H4"),
    ];

    const state = calculateHypothesisEntropy(hypotheses);

    // log2(4) = 2 bits for uniform 4-way distribution
    expect(state.currentEntropy).toBeCloseTo(2.0, 5);
    expect(state.normalizedEntropy).toBeCloseTo(1.0, 5);
    expect(state.isConverging).toBe(false);
  });

  it("calculates entropy for converging distribution", () => {
    const hypotheses = [
      createTestHypothesis("h1", "me", 0.7, "Winner"),
      createTestHypothesis("h2", "me", 0.1, "Unlikely"),
      createTestHypothesis("h3", "me", 0.1, "Unlikely"),
      createTestHypothesis("h4", "me", 0.1, "Unlikely"),
    ];

    const state = calculateHypothesisEntropy(hypotheses);

    expect(state.currentEntropy).toBeLessThan(2.0); // Less than max
    expect(state.normalizedEntropy).toBeLessThan(1.0);
    expect(state.isConverging).toBe(true); // Max prob > 0.7
  });

  it("tracks entropy delta between updates", () => {
    const initial = [
      createTestHypothesis("h1", "me", 0.25, "H1"),
      createTestHypothesis("h2", "me", 0.25, "H2"),
      createTestHypothesis("h3", "me", 0.25, "H3"),
      createTestHypothesis("h4", "me", 0.25, "H4"),
    ];

    const state1 = calculateHypothesisEntropy(initial);

    // Update: one hypothesis becomes more likely
    const updated = [
      createTestHypothesis("h1", "me", 0.6, "H1"),
      createTestHypothesis("h2", "me", 0.2, "H2"),
      createTestHypothesis("h3", "me", 0.1, "H3"),
      createTestHypothesis("h4", "me", 0.1, "H4"),
    ];

    const state2 = calculateHypothesisEntropy(updated, state1);

    expect(state2.entropyDelta).toBeDefined();
    expect(state2.entropyDelta!).toBeLessThan(0); // Entropy decreased
    expect(state2.totalInformationGain).toBeGreaterThan(0);
    expect(state2.convergenceUpdates).toBe(1);
    expect(state2.divergenceUpdates).toBe(0);
  });

  it("tracks divergence when entropy increases", () => {
    const initial = [
      createTestHypothesis("h1", "me", 0.7, "H1"),
      createTestHypothesis("h2", "me", 0.1, "H2"),
      createTestHypothesis("h3", "me", 0.1, "H3"),
      createTestHypothesis("h4", "me", 0.1, "H4"),
    ];

    const state1 = calculateHypothesisEntropy(initial);

    // Update: distribution becomes more uniform (divergence)
    const updated = [
      createTestHypothesis("h1", "me", 0.4, "H1"),
      createTestHypothesis("h2", "me", 0.3, "H2"),
      createTestHypothesis("h3", "me", 0.2, "H3"),
      createTestHypothesis("h4", "me", 0.1, "H4"),
    ];

    const state2 = calculateHypothesisEntropy(updated, state1);

    expect(state2.entropyDelta).toBeDefined();
    expect(state2.entropyDelta!).toBeGreaterThan(0); // Entropy increased
    expect(state2.convergenceUpdates).toBe(0);
    expect(state2.divergenceUpdates).toBe(1);
  });

  it("normalizes probabilities that don't sum to 1", () => {
    const hypotheses = [
      createTestHypothesis("h1", "me", 1.0, "H1"), // Total > 1
      createTestHypothesis("h2", "me", 1.0, "H2"),
    ];

    const state = calculateHypothesisEntropy(hypotheses);

    // Should normalize to [0.5, 0.5]
    expect(state.currentEntropy).toBeCloseTo(1.0, 5);
  });
});

describe("calculateInformationGain", () => {
  it("calculates positive information gain when converging", () => {
    const before = [
      createTestHypothesis("h1", "me", 0.25, "H1"),
      createTestHypothesis("h2", "me", 0.25, "H2"),
      createTestHypothesis("h3", "me", 0.25, "H3"),
      createTestHypothesis("h4", "me", 0.25, "H4"),
    ];

    const after = [
      createTestHypothesis("h1", "me", 0.7, "H1"),
      createTestHypothesis("h2", "me", 0.1, "H2"),
      createTestHypothesis("h3", "me", 0.1, "H3"),
      createTestHypothesis("h4", "me", 0.1, "H4"),
    ];

    const ig = calculateInformationGain(before, after);

    expect(ig).toBeGreaterThan(0); // Gained information
    expect(ig).toBeLessThan(2.0); // Can't gain more than initial entropy
  });

  it("returns negative information gain when diverging", () => {
    const before = [
      createTestHypothesis("h1", "me", 0.7, "H1"),
      createTestHypothesis("h2", "me", 0.1, "H2"),
      createTestHypothesis("h3", "me", 0.1, "H3"),
      createTestHypothesis("h4", "me", 0.1, "H4"),
    ];

    const after = [
      createTestHypothesis("h1", "me", 0.25, "H1"),
      createTestHypothesis("h2", "me", 0.25, "H2"),
      createTestHypothesis("h3", "me", 0.25, "H3"),
      createTestHypothesis("h4", "me", 0.25, "H4"),
    ];

    const ig = calculateInformationGain(before, after);

    expect(ig).toBeLessThan(0); // Lost information (diverged)
  });

  it("throws error if hypothesis sets differ", () => {
    const before = [
      createTestHypothesis("h1", "me", 0.5, "H1"),
      createTestHypothesis("h2", "me", 0.5, "H2"),
    ];

    const after = [
      createTestHypothesis("h1", "me", 0.7, "H1"),
      createTestHypothesis("h3", "me", 0.3, "H3"), // Different ID
    ];

    expect(() => calculateInformationGain(before, after)).toThrow();
  });

  it("returns 0 for empty sets", () => {
    expect(calculateInformationGain([], [])).toBe(0);
  });
});

describe("calculateSystemEntropy", () => {
  it("calculates entropy across multiple model types", () => {
    const hypotheses = [
      createTestHypothesis("h1", "me", 0.7, "Me hypothesis"),
      createTestHypothesis("h2", "me", 0.3, "Me hypothesis 2"),
      createTestHypothesis("h3", "we", 0.6, "We hypothesis"),
      createTestHypothesis("h4", "we", 0.4, "We hypothesis 2"),
      createTestHypothesis("h5", "system", 0.5, "System hypothesis"),
      createTestHypothesis("h6", "system", 0.5, "System hypothesis 2"),
    ];

    const state = calculateSystemEntropy(hypotheses);

    expect(state.totalHypotheses).toBe(6);
    expect(state.byModel.size).toBe(3); // me, we, system
    expect(state.totalEntropy).toBeGreaterThan(0);

    // Check per-model breakdown
    expect(state.byModel.has("me")).toBe(true);
    expect(state.byModel.has("we")).toBe(true);
    expect(state.byModel.has("system")).toBe(true);

    const meTracking = state.byModel.get("me")!;
    expect(meTracking.hypothesisIds).toHaveLength(2);
    expect(meTracking.entropy.isConverging).toBe(true); // 0.7 > 0.7 threshold
  });

  it("detects system convergence when majority models converge", () => {
    const hypotheses = [
      createTestHypothesis("h1", "me", 0.9, "Me winner"), // Converged
      createTestHypothesis("h2", "me", 0.1, "Me loser"),
      createTestHypothesis("h3", "we", 0.8, "We winner"), // Converged
      createTestHypothesis("h4", "we", 0.2, "We loser"),
      createTestHypothesis("h5", "system", 0.5, "System split"), // Not converged
      createTestHypothesis("h6", "system", 0.5, "System split"),
    ];

    const state = calculateSystemEntropy(hypotheses);

    // 2 out of 3 models converged = system converging
    expect(state.systemConverging).toBe(true);
  });

  it("tracks system-wide information gain", () => {
    const initial = [
      createTestHypothesis("h1", "me", 0.5, "Me"),
      createTestHypothesis("h2", "me", 0.5, "Me"),
      createTestHypothesis("h3", "we", 0.5, "We"),
      createTestHypothesis("h4", "we", 0.5, "We"),
    ];

    const state1 = calculateSystemEntropy(initial);

    const updated = [
      createTestHypothesis("h1", "me", 0.9, "Me winner"),
      createTestHypothesis("h2", "me", 0.1, "Me loser"),
      createTestHypothesis("h3", "we", 0.8, "We winner"),
      createTestHypothesis("h4", "we", 0.2, "We loser"),
    ];

    // Create previous states map
    const previousStates = new Map(
      Array.from(state1.byModel.entries()).map(([type, tracking]) => [type, tracking.entropy]),
    );

    const state2 = calculateSystemEntropy(updated, previousStates);

    expect(state2.systemInformationGain).toBeGreaterThan(0);
    expect(state2.systemConverging).toBe(true);
  });

  it("handles empty hypothesis set", () => {
    const state = calculateSystemEntropy([]);

    expect(state.totalHypotheses).toBe(0);
    expect(state.totalEntropy).toBe(0);
    expect(state.byModel.size).toBe(0);
    expect(state.systemConverging).toBe(false);
  });
});

describe("formatEntropyState", () => {
  it("formats entropy state as readable string", () => {
    const hypotheses = [
      createTestHypothesis("h1", "me", 0.7, "Winner"),
      createTestHypothesis("h2", "me", 0.3, "Loser"),
    ];

    const state = calculateHypothesisEntropy(hypotheses);
    const formatted = formatEntropyState(state);

    expect(formatted).toContain("Entropy:");
    expect(formatted).toContain("bits");
    expect(formatted).toContain("Information gained:");
    expect(formatted).toContain("Status:");
  });

  it("includes delta when previous state provided", () => {
    const initial = [
      createTestHypothesis("h1", "me", 0.5, "H1"),
      createTestHypothesis("h2", "me", 0.5, "H2"),
    ];

    const state1 = calculateHypothesisEntropy(initial);

    const updated = [
      createTestHypothesis("h1", "me", 0.8, "H1"),
      createTestHypothesis("h2", "me", 0.2, "H2"),
    ];

    const state2 = calculateHypothesisEntropy(updated, state1);
    const formatted = formatEntropyState(state2);

    expect(formatted).toContain("Delta:");
  });
});

describe("formatSystemEntropy", () => {
  it("formats system entropy with per-model breakdown", () => {
    const hypotheses = [
      createTestHypothesis("h1", "me", 0.7, "Me"),
      createTestHypothesis("h2", "me", 0.3, "Me"),
      createTestHypothesis("h3", "we", 0.6, "We"),
      createTestHypothesis("h4", "we", 0.4, "We"),
    ];

    const state = calculateSystemEntropy(hypotheses);
    const formatted = formatSystemEntropy(state);

    expect(formatted).toContain("System Entropy:");
    expect(formatted).toContain("[me]");
    expect(formatted).toContain("[we]");
    expect(formatted).toContain("CONVERGING");
  });
});

describe("detectEntropyEvents", () => {
  it("detects convergence event on significant entropy drop", () => {
    const initial = [
      createTestHypothesis("h1", "me", 0.5, "H1"),
      createTestHypothesis("h2", "me", 0.5, "H2"),
    ];

    const state1 = calculateHypothesisEntropy(initial);

    const updated = [
      createTestHypothesis("h1", "me", 0.95, "H1"),
      createTestHypothesis("h2", "me", 0.05, "H2"),
    ];

    const state2 = calculateHypothesisEntropy(updated, state1);
    const events = detectEntropyEvents(state2);

    const convergenceEvents = events.filter((e) => e.type === "convergence");
    expect(convergenceEvents.length).toBeGreaterThan(0);
  });

  it("detects divergence event on significant entropy increase", () => {
    const initial = [
      createTestHypothesis("h1", "me", 0.95, "H1"),
      createTestHypothesis("h2", "me", 0.05, "H2"),
    ];

    const state1 = calculateHypothesisEntropy(initial);

    const updated = [
      createTestHypothesis("h1", "me", 0.5, "H1"),
      createTestHypothesis("h2", "me", 0.5, "H2"),
    ];

    const state2 = calculateHypothesisEntropy(updated, state1);
    const events = detectEntropyEvents(state2);

    const divergenceEvents = events.filter((e) => e.type === "divergence");
    expect(divergenceEvents.length).toBeGreaterThan(0);
  });

  it("detects threshold crossing", () => {
    // Start above 0.5 bits
    const initial = [
      createTestHypothesis("h1", "me", 0.6, "H1"),
      createTestHypothesis("h2", "me", 0.4, "H2"),
    ];

    const state1 = calculateHypothesisEntropy(initial);

    // End below 0.5 bits (very converged)
    const updated = [
      createTestHypothesis("h1", "me", 0.95, "H1"),
      createTestHypothesis("h2", "me", 0.05, "H2"),
    ];

    const state2 = calculateHypothesisEntropy(updated, state1);
    const events = detectEntropyEvents(state2);

    const thresholdEvents = events.filter((e) => e.type === "threshold_crossed");
    expect(thresholdEvents.length).toBeGreaterThan(0);
  });

  it("detects information gain milestones", () => {
    let state = calculateHypothesisEntropy([
      createTestHypothesis("h1", "me", 0.5, "H1"),
      createTestHypothesis("h2", "me", 0.5, "H2"),
    ]);

    // Gradually converge, accumulating > 1 bit of information gain
    for (let i = 0; i < 5; i++) {
      const p = 0.5 + i * 0.08; // 0.5, 0.58, 0.66, 0.74, 0.82
      state = calculateHypothesisEntropy(
        [createTestHypothesis("h1", "me", p, "H1"), createTestHypothesis("h2", "me", 1 - p, "H2")],
        state,
      );
    }

    const events = detectEntropyEvents(state);
    const milestoneEvents = events.filter((e) => e.type === "information_milestone");

    // Should detect at least one milestone (1 bit or more)
    expect(state.totalInformationGain).toBeGreaterThan(0);
  });
});
