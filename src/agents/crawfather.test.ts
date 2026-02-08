import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { runCrawFather } from "./crawfather.js";
import { globalEventBus } from "../events/emitter.js";
import type { AgentEventPayload } from "../infra/agent-events.js";

describe("CrawFather", () => {
  let events: AgentEventPayload[] = [];
  let unsubscribe: (() => void) | undefined;

  beforeEach(() => {
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

  it("should emit system.run_started and system.run_completed events", async () => {
    await runCrawFather({
      sessionKey: "agent:crawfather:test",
      hypothesisCount: 2,
      delayMs: 10,
    });

    const hasRunStarted = events.some((e) => e.data.type === "system.run_started");
    const hasRunCompleted = events.some((e) => e.data.type === "system.run_completed");

    expect(hasRunStarted).toBe(true);
    expect(hasRunCompleted).toBe(true);
  });

  it("should emit hypothesis.created events", async () => {
    await runCrawFather({
      sessionKey: "agent:crawfather:test",
      hypothesisCount: 3,
      delayMs: 10,
    });

    const hypothesisCreatedEvents = events.filter((e) => e.data.type === "hypothesis.created");

    expect(hypothesisCreatedEvents.length).toBe(3);
  });

  it("should emit hypothesis.updated events for active and completed states", async () => {
    await runCrawFather({
      sessionKey: "agent:crawfather:test",
      hypothesisCount: 2,
      delayMs: 10,
    });

    const hypothesisUpdatedEvents = events.filter((e) => e.data.type === "hypothesis.updated");

    // Each hypothesis should be updated twice (active, completed)
    expect(hypothesisUpdatedEvents.length).toBe(4);
  });

  it("should use provided sessionKey", async () => {
    const customSessionKey = "agent:crawfather:custom";

    await runCrawFather({
      sessionKey: customSessionKey,
      hypothesisCount: 1,
      delayMs: 10,
    });

    const allEventsHaveSessionKey = events.every((e) => e.sessionKey === customSessionKey);

    expect(allEventsHaveSessionKey).toBe(true);
  });

  it("should return a runId", async () => {
    const runId = await runCrawFather({
      sessionKey: "agent:crawfather:test",
      hypothesisCount: 1,
      delayMs: 10,
    });

    expect(runId).toBeDefined();
    expect(typeof runId).toBe("string");
    expect(runId.startsWith("run_")).toBe(true);
  });
});
