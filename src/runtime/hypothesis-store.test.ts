import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { HypothesisStore } from "./hypothesis-store.js";
import { globalEventBus } from "../events/emitter.js";
import type { AgentEventPayload } from "../infra/agent-events.js";

describe("HypothesisStore", () => {
  let store: HypothesisStore;
  let events: AgentEventPayload[] = [];
  let unsubscribe: (() => void) | undefined;

  beforeEach(() => {
    store = new HypothesisStore({ runId: "test-run", sessionKey: "test-session" });
    events = [];
    unsubscribe = globalEventBus.subscribe((event) => {
      events.push(event);
    });
  });

  afterEach(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  it("should add a hypothesis and emit hypothesis.created event", () => {
    const hypothesis = store.add("Test hypothesis");

    expect(hypothesis.id).toBeDefined();
    expect(hypothesis.id.startsWith("hyp_")).toBe(true);
    expect(hypothesis.text).toBe("Test hypothesis");
    expect(hypothesis.status).toBe("pending");
    expect(hypothesis.createdAt).toBeGreaterThan(0);

    const createdEvent = events.find((e) => e.data.type === "hypothesis.created");
    expect(createdEvent).toBeDefined();
    expect(createdEvent?.runId).toBe("test-run");
  });

  it("should update hypothesis status and emit hypothesis.updated event", () => {
    const hypothesis = store.add("Test hypothesis");
    events = []; // Clear creation event

    store.updateStatus(hypothesis.id, "active");

    const retrieved = store.get(hypothesis.id);
    expect(retrieved?.status).toBe("active");

    const updatedEvent = events.find((e) => e.data.type === "hypothesis.updated");
    expect(updatedEvent).toBeDefined();
  });

  it("should not update non-existent hypothesis", () => {
    store.updateStatus("non-existent", "active");

    const updatedEvents = events.filter((e) => e.data.type === "hypothesis.updated");
    expect(updatedEvents).toHaveLength(0);
  });

  it("should list all hypotheses", () => {
    store.add("Hypothesis 1");
    store.add("Hypothesis 2");
    store.add("Hypothesis 3");

    const hypotheses = store.list();

    expect(hypotheses).toHaveLength(3);
    expect(hypotheses[0].text).toBe("Hypothesis 1");
    expect(hypotheses[1].text).toBe("Hypothesis 2");
    expect(hypotheses[2].text).toBe("Hypothesis 3");
  });

  it("should clear all hypotheses", () => {
    store.add("Hypothesis 1");
    store.add("Hypothesis 2");

    store.clear();

    expect(store.list()).toHaveLength(0);
  });

  it("should generate unique hypothesis ids", () => {
    const hyp1 = store.add("Hypothesis 1");
    const hyp2 = store.add("Hypothesis 2");

    expect(hyp1.id).not.toBe(hyp2.id);
  });

  it("should track hypothesis lifecycle", () => {
    const hypothesis = store.add("Test hypothesis");

    store.updateStatus(hypothesis.id, "active");
    expect(store.get(hypothesis.id)?.status).toBe("active");

    store.updateStatus(hypothesis.id, "completed");
    expect(store.get(hypothesis.id)?.status).toBe("completed");
  });
});
