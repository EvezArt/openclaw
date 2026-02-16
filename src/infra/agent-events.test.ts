import { describe, expect, test } from "vitest";
import {
  clearAgentRunContext,
  emitAgentEvent,
  emitHypothesisEvent,
  emitSystemEvent,
  emitHeartbeatRunEvent,
  getAgentRunContext,
  onAgentEvent,
  registerAgentRunContext,
  resetAgentRunContextForTest,
  type HypothesisEventData,
} from "./agent-events.js";

describe("agent-events sequencing", () => {
  test("stores and clears run context", async () => {
    resetAgentRunContextForTest();
    registerAgentRunContext("run-1", { sessionKey: "main" });
    expect(getAgentRunContext("run-1")?.sessionKey).toBe("main");
    clearAgentRunContext("run-1");
    expect(getAgentRunContext("run-1")).toBeUndefined();
  });

  test("maintains monotonic seq per runId", async () => {
    const seen: Record<string, number[]> = {};
    const stop = onAgentEvent((evt) => {
      const list = seen[evt.runId] ?? [];
      seen[evt.runId] = list;
      list.push(evt.seq);
    });

    emitAgentEvent({ runId: "run-1", stream: "lifecycle", data: {} });
    emitAgentEvent({ runId: "run-1", stream: "lifecycle", data: {} });
    emitAgentEvent({ runId: "run-2", stream: "lifecycle", data: {} });
    emitAgentEvent({ runId: "run-1", stream: "lifecycle", data: {} });

    stop();

    expect(seen["run-1"]).toEqual([1, 2, 3]);
    expect(seen["run-2"]).toEqual([1]);
  });

  test("preserves compaction ordering on the event bus", async () => {
    const phases: Array<string> = [];
    const stop = onAgentEvent((evt) => {
      if (evt.runId !== "run-1") {
        return;
      }
      if (evt.stream !== "compaction") {
        return;
      }
      if (typeof evt.data?.phase === "string") {
        phases.push(evt.data.phase);
      }
    });

    emitAgentEvent({ runId: "run-1", stream: "compaction", data: { phase: "start" } });
    emitAgentEvent({
      runId: "run-1",
      stream: "compaction",
      data: { phase: "end", willRetry: false },
    });

    stop();

    expect(phases).toEqual(["start", "end"]);
  });
});

describe("CrawFather survival pack events", () => {
  test("emits system events with correct stream type", async () => {
    const events: Array<{ stream: string; subtype: string }> = [];
    const stop = onAgentEvent((evt) => {
      if (evt.stream === "system") {
        events.push({
          stream: evt.stream,
          subtype: evt.data.subtype as string,
        });
      }
    });

    emitSystemEvent("run-1", "run_started", { agentId: "agent:crawfather:main" });
    emitSystemEvent("run-1", "run_completed", { exitCode: 0 });
    emitSystemEvent("run-1", "run_failed", { error: "timeout" });

    stop();

    expect(events).toHaveLength(3);
    expect(events[0].stream).toBe("system");
    expect(events[0].subtype).toBe("run_started");
    expect(events[1].subtype).toBe("run_completed");
    expect(events[2].subtype).toBe("run_failed");
  });

  test("emits hypothesis events with required fields", async () => {
    const hypotheses: Array<HypothesisEventData> = [];
    const stop = onAgentEvent((evt) => {
      if (evt.stream === "hypothesis") {
        hypotheses.push(evt.data as HypothesisEventData);
      }
    });

    emitHypothesisEvent("run-1", {
      subtype: "created",
      hypothesisId: "h1",
      hypothesis: "User wants to search for files",
      score: 0.85,
      status: "active",
    });

    emitHypothesisEvent("run-1", {
      subtype: "updated",
      hypothesisId: "h1",
      score: 0.92,
      evidence: "Found grep pattern in message",
    });

    emitHypothesisEvent("run-1", {
      subtype: "resolved",
      hypothesisId: "h1",
      outcome: "confirmed",
      reason: "Successfully executed search",
      status: "resolved",
    });

    stop();

    expect(hypotheses).toHaveLength(3);
    expect(hypotheses[0].subtype).toBe("created");
    expect(hypotheses[0].hypothesisId).toBe("h1");
    expect(hypotheses[0].score).toBe(0.85);
    expect(hypotheses[1].subtype).toBe("updated");
    expect(hypotheses[1].score).toBe(0.92);
    expect(hypotheses[2].subtype).toBe("resolved");
    expect(hypotheses[2].outcome).toBe("confirmed");
  });

  test("emits heartbeat.run events", async () => {
    const heartbeats: Array<unknown> = [];
    const stop = onAgentEvent((evt) => {
      if (evt.stream === "heartbeat.run") {
        heartbeats.push(evt.data);
      }
    });

    emitHeartbeatRunEvent("run-1", { phase: "check", status: "healthy" });
    emitHeartbeatRunEvent("run-1", { phase: "complete", duration: 1234 });

    stop();

    expect(heartbeats).toHaveLength(2);
  });

  test("maintains metadata in all new event types", async () => {
    resetAgentRunContextForTest();
    registerAgentRunContext("run-crawfather", { sessionKey: "main-crawfather" });

    const events: Array<{ runId: string; sessionKey?: string; seq: number; ts: number }> = [];
    const stop = onAgentEvent((evt) => {
      events.push({
        runId: evt.runId,
        sessionKey: evt.sessionKey,
        seq: evt.seq,
        ts: evt.ts,
      });
    });

    const beforeTs = Date.now();
    emitSystemEvent("run-crawfather", "run_started");
    emitHypothesisEvent("run-crawfather", {
      subtype: "created",
      hypothesisId: "h1",
      hypothesis: "Test",
    });
    emitHeartbeatRunEvent("run-crawfather", { check: "ok" });
    const afterTs = Date.now();

    stop();

    expect(events).toHaveLength(3);
    // All events have runId
    expect(events[0].runId).toBe("run-crawfather");
    expect(events[1].runId).toBe("run-crawfather");
    expect(events[2].runId).toBe("run-crawfather");
    // All events have sessionKey from context
    expect(events[0].sessionKey).toBe("main-crawfather");
    expect(events[1].sessionKey).toBe("main-crawfather");
    expect(events[2].sessionKey).toBe("main-crawfather");
    // Sequence is monotonic per runId
    expect(events[0].seq).toBe(1);
    expect(events[1].seq).toBe(2);
    expect(events[2].seq).toBe(3);
    // Timestamps are reasonable
    for (const evt of events) {
      expect(evt.ts).toBeGreaterThanOrEqual(beforeTs);
      expect(evt.ts).toBeLessThanOrEqual(afterTs);
    }

    clearAgentRunContext("run-crawfather");
  });
});
