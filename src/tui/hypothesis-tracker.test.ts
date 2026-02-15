/**
 * Tests for HypothesisTracker
 */

import { describe, expect, it } from "vitest";
import { HypothesisTracker } from "./hypothesis-tracker.js";
import type { HypothesisEvent } from "./hypothesis-types.js";

describe("HypothesisTracker", () => {
  it("should create and track a hypothesis", () => {
    const tracker = new HypothesisTracker();
    const event: HypothesisEvent = {
      kind: "created",
      hypothesisId: "h1",
      runId: "run1",
      timestamp: Date.now(),
      data: {
        description: "Test hypothesis",
        score: 0.75,
        status: "active",
      },
    };

    tracker.processEvent(event);
    const hypotheses = tracker.getRunHypotheses("run1");

    expect(hypotheses).toHaveLength(1);
    expect(hypotheses[0].id).toBe("h1");
    expect(hypotheses[0].description).toBe("Test hypothesis");
    expect(hypotheses[0].score).toBe(0.75);
    expect(hypotheses[0].status).toBe("active");
    expect(hypotheses[0].outcome).toBe(null);
  });

  it("should update a hypothesis", () => {
    const tracker = new HypothesisTracker();
    const createEvent: HypothesisEvent = {
      kind: "created",
      hypothesisId: "h1",
      runId: "run1",
      timestamp: Date.now(),
      data: {
        description: "Initial description",
        score: 0.5,
        status: "active",
      },
    };

    tracker.processEvent(createEvent);

    const updateEvent: HypothesisEvent = {
      kind: "updated",
      hypothesisId: "h1",
      runId: "run1",
      timestamp: Date.now(),
      data: {
        description: "Updated description",
        score: 0.8,
      },
    };

    tracker.processEvent(updateEvent);
    const hypothesis = tracker.getHypothesis("run1", "h1");

    expect(hypothesis).not.toBe(null);
    expect(hypothesis?.description).toBe("Updated description");
    expect(hypothesis?.score).toBe(0.8);
    expect(hypothesis?.status).toBe("active");
  });

  it("should add evidence to a hypothesis", () => {
    const tracker = new HypothesisTracker();
    const createEvent: HypothesisEvent = {
      kind: "created",
      hypothesisId: "h1",
      runId: "run1",
      timestamp: Date.now(),
      data: {
        description: "Test hypothesis",
        score: 0.5,
        status: "active",
      },
    };

    tracker.processEvent(createEvent);

    const evidenceEvent: HypothesisEvent = {
      kind: "evidence",
      hypothesisId: "h1",
      runId: "run1",
      timestamp: Date.now(),
      data: {
        evidence: {
          description: "Supporting evidence",
          weight: 0.7,
          timestamp: Date.now(),
        },
      },
    };

    tracker.processEvent(evidenceEvent);
    const hypothesis = tracker.getHypothesis("run1", "h1");

    expect(hypothesis).not.toBe(null);
    expect(hypothesis?.evidence).toHaveLength(1);
    expect(hypothesis?.evidence[0].description).toBe("Supporting evidence");
    expect(hypothesis?.evidence[0].weight).toBe(0.7);
  });

  it("should resolve a hypothesis", () => {
    const tracker = new HypothesisTracker();
    const createEvent: HypothesisEvent = {
      kind: "created",
      hypothesisId: "h1",
      runId: "run1",
      timestamp: Date.now(),
      data: {
        description: "Test hypothesis",
        score: 0.75,
        status: "active",
      },
    };

    tracker.processEvent(createEvent);

    const resolveEvent: HypothesisEvent = {
      kind: "resolved",
      hypothesisId: "h1",
      runId: "run1",
      timestamp: Date.now(),
      data: {
        outcome: "accepted",
      },
    };

    tracker.processEvent(resolveEvent);
    const hypothesis = tracker.getHypothesis("run1", "h1");

    expect(hypothesis).not.toBe(null);
    expect(hypothesis?.status).toBe("resolved");
    expect(hypothesis?.outcome).toBe("accepted");
  });

  it("should track multiple hypotheses in a run", () => {
    const tracker = new HypothesisTracker();
    const event1: HypothesisEvent = {
      kind: "created",
      hypothesisId: "h1",
      runId: "run1",
      timestamp: Date.now(),
      data: {
        description: "Hypothesis 1",
        score: 0.6,
        status: "active",
      },
    };

    const event2: HypothesisEvent = {
      kind: "created",
      hypothesisId: "h2",
      runId: "run1",
      timestamp: Date.now(),
      data: {
        description: "Hypothesis 2",
        score: 0.8,
        status: "active",
      },
    };

    tracker.processEvent(event1);
    tracker.processEvent(event2);

    const hypotheses = tracker.getRunHypotheses("run1");
    expect(hypotheses).toHaveLength(2);
  });

  it("should track hypotheses across multiple runs", () => {
    const tracker = new HypothesisTracker();
    const event1: HypothesisEvent = {
      kind: "created",
      hypothesisId: "h1",
      runId: "run1",
      timestamp: Date.now(),
      data: {
        description: "Run 1 hypothesis",
        score: 0.6,
        status: "active",
      },
    };

    const event2: HypothesisEvent = {
      kind: "created",
      hypothesisId: "h2",
      runId: "run2",
      timestamp: Date.now(),
      data: {
        description: "Run 2 hypothesis",
        score: 0.8,
        status: "active",
      },
    };

    tracker.processEvent(event1);
    tracker.processEvent(event2);

    const run1Hypotheses = tracker.getRunHypotheses("run1");
    const run2Hypotheses = tracker.getRunHypotheses("run2");

    expect(run1Hypotheses).toHaveLength(1);
    expect(run2Hypotheses).toHaveLength(1);
    expect(run1Hypotheses[0].id).toBe("h1");
    expect(run2Hypotheses[0].id).toBe("h2");
  });

  it("should clear run data", () => {
    const tracker = new HypothesisTracker();
    const event: HypothesisEvent = {
      kind: "created",
      hypothesisId: "h1",
      runId: "run1",
      timestamp: Date.now(),
      data: {
        description: "Test hypothesis",
        score: 0.75,
        status: "active",
      },
    };

    tracker.processEvent(event);
    expect(tracker.getRunHypotheses("run1")).toHaveLength(1);

    tracker.clearRun("run1");
    expect(tracker.getRunHypotheses("run1")).toHaveLength(0);
  });

  it("should return empty array for unknown run", () => {
    const tracker = new HypothesisTracker();
    const hypotheses = tracker.getRunHypotheses("nonexistent");
    expect(hypotheses).toHaveLength(0);
  });

  it("should return null for unknown hypothesis", () => {
    const tracker = new HypothesisTracker();
    const hypothesis = tracker.getHypothesis("run1", "h1");
    expect(hypothesis).toBe(null);
  });
});
