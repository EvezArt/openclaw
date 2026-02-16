import { describe, test, expect, beforeEach } from "vitest";
import {
  createHypothesis,
  updateHypothesis,
  falsifyHypothesis,
  selectHypothesis,
  getRunHypotheses,
  getSelectedHypothesis,
  getHypothesesByModelType,
  clearRunHypotheses,
  onHypothesisEvent,
  clearAllHypothesesForTest,
} from "./hypothesis-events.js";
import { resetAgentRunContextForTest } from "./agent-events.js";

describe("hypothesis-events", () => {
  beforeEach(() => {
    clearAllHypothesesForTest();
    resetAgentRunContextForTest();
  });

  test("creates hypothesis with unique ID", () => {
    const runId = "run-1";
    const hypId = createHypothesis(runId, "me", "I think this will work", 0.7);

    expect(hypId).toContain(runId);
    expect(hypId).toContain("me");

    const hypotheses = getRunHypotheses(runId);
    expect(hypotheses).toHaveLength(1);
    expect(hypotheses[0].hypothesisId).toBe(hypId);
    expect(hypotheses[0].description).toBe("I think this will work");
    expect(hypotheses[0].probability).toBe(0.7);
    expect(hypotheses[0].phase).toBe("created");
  });

  test("tracks multiple hypotheses per run", () => {
    const runId = "run-1";
    createHypothesis(runId, "me", "Hypothesis A", 0.6);
    createHypothesis(runId, "we", "Hypothesis B", 0.7);
    createHypothesis(runId, "system", "Hypothesis C", 0.8);

    const hypotheses = getRunHypotheses(runId);
    expect(hypotheses).toHaveLength(3);

    const grouped = getHypothesesByModelType(runId);
    expect(grouped.me).toHaveLength(1);
    expect(grouped.we).toHaveLength(1);
    expect(grouped.system).toHaveLength(1);
    expect(grouped.they).toHaveLength(0);
  });

  test("updates hypothesis probability and increments version", () => {
    const runId = "run-1";
    const hypId = createHypothesis(runId, "me", "Test hypothesis", 0.5);

    updateHypothesis(runId, hypId, 0.8);

    const hypotheses = getRunHypotheses(runId);
    expect(hypotheses).toHaveLength(1);
    expect(hypotheses[0].probability).toBe(0.8);
    expect(hypotheses[0].phase).toBe("updated");
    expect(hypotheses[0].version).toBe(2);
  });

  test("falsifies hypothesis with falsifier index", () => {
    const runId = "run-1";
    const hypId = createHypothesis(runId, "me", "Test hypothesis", 0.7);

    falsifyHypothesis(runId, hypId, 0);

    const hypotheses = getRunHypotheses(runId);
    expect(hypotheses[0].phase).toBe("falsified");
    expect(hypotheses[0].falsifierIndex).toBe(0);
    expect(hypotheses[0].version).toBe(2);
  });

  test("selects hypothesis as winner", () => {
    const runId = "run-1";
    const hypId1 = createHypothesis(runId, "me", "Hypothesis A", 0.6);
    const hypId2 = createHypothesis(runId, "we", "Hypothesis B", 0.8);

    selectHypothesis(runId, hypId2);

    const selected = getSelectedHypothesis(runId);
    expect(selected).toBeDefined();
    expect(selected?.hypothesisId).toBe(hypId2);
    expect(selected?.phase).toBe("selected");

    const all = getRunHypotheses(runId);
    expect(all).toHaveLength(2);
  });

  test("isolates hypotheses by run", () => {
    createHypothesis("run-1", "me", "Run 1 hypothesis", 0.5);
    createHypothesis("run-2", "we", "Run 2 hypothesis", 0.7);

    const run1Hyps = getRunHypotheses("run-1");
    const run2Hyps = getRunHypotheses("run-2");

    expect(run1Hyps).toHaveLength(1);
    expect(run2Hyps).toHaveLength(1);
    expect(run1Hyps[0].description).toBe("Run 1 hypothesis");
    expect(run2Hyps[0].description).toBe("Run 2 hypothesis");
  });

  test("clears hypotheses for a run", () => {
    const runId = "run-1";
    createHypothesis(runId, "me", "Test", 0.5);
    expect(getRunHypotheses(runId)).toHaveLength(1);

    clearRunHypotheses(runId);
    expect(getRunHypotheses(runId)).toHaveLength(0);
  });

  test("emits hypothesis events through agent event stream", () => {
    const events: Array<{ runId: string; description: string; phase: string }> = [];

    const unsubscribe = onHypothesisEvent((runId, data) => {
      events.push({
        runId,
        description: data.description,
        phase: data.phase,
      });
    });

    const runId = "run-1";
    const hypId = createHypothesis(runId, "me", "Test hypothesis", 0.7);
    updateHypothesis(runId, hypId, 0.8);
    selectHypothesis(runId, hypId);

    unsubscribe();

    expect(events).toHaveLength(3);
    expect(events[0].phase).toBe("created");
    expect(events[1].phase).toBe("updated");
    expect(events[2].phase).toBe("selected");
  });

  test("handles nonexistent run gracefully", () => {
    updateHypothesis("nonexistent", "fake-id", 0.5);
    falsifyHypothesis("nonexistent", "fake-id", 0);
    selectHypothesis("nonexistent", "fake-id");

    expect(getRunHypotheses("nonexistent")).toHaveLength(0);
    expect(getSelectedHypothesis("nonexistent")).toBeUndefined();
  });

  test("handles nonexistent hypothesis gracefully", () => {
    const runId = "run-1";
    createHypothesis(runId, "me", "Real hypothesis", 0.5);

    updateHypothesis(runId, "fake-id", 0.9);
    falsifyHypothesis(runId, "fake-id", 0);
    selectHypothesis(runId, "fake-id");

    // Should only have the real hypothesis
    const hypotheses = getRunHypotheses(runId);
    expect(hypotheses).toHaveLength(1);
    expect(getSelectedHypothesis(runId)).toBeUndefined();
  });

  test("groups hypotheses by model type correctly", () => {
    const runId = "run-1";
    createHypothesis(runId, "me", "Me 1", 0.5);
    createHypothesis(runId, "me", "Me 2", 0.6);
    createHypothesis(runId, "we", "We 1", 0.7);
    createHypothesis(runId, "they", "They 1", 0.8);

    const grouped = getHypothesesByModelType(runId);

    expect(grouped.me).toHaveLength(2);
    expect(grouped.we).toHaveLength(1);
    expect(grouped.they).toHaveLength(1);
    expect(grouped.system).toHaveLength(0);

    expect(grouped.me[0].description).toBe("Me 1");
    expect(grouped.me[1].description).toBe("Me 2");
  });
});
