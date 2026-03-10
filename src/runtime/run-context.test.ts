import { describe, it, expect, beforeEach } from "vitest";
import { RunRegistry } from "./run-context.js";

describe("RunRegistry", () => {
  let registry: RunRegistry;

  beforeEach(() => {
    registry = new RunRegistry();
  });

  it("should register a new run context", () => {
    const context = registry.register("test-session");

    expect(context.runId).toBeDefined();
    expect(context.runId.startsWith("run_")).toBe(true);
    expect(context.sessionKey).toBe("test-session");
    expect(context.seq).toBe(0);
    expect(context.startedAt).toBeGreaterThan(0);
  });

  it("should retrieve a run context by runId", () => {
    const context = registry.register("test-session");
    const retrieved = registry.get(context.runId);

    expect(retrieved).toBe(context);
  });

  it("should return undefined for non-existent runId", () => {
    const retrieved = registry.get("non-existent");

    expect(retrieved).toBeUndefined();
  });

  it("should increment sequence number", () => {
    const context = registry.register("test-session");

    expect(registry.nextSeq(context.runId)).toBe(1);
    expect(registry.nextSeq(context.runId)).toBe(2);
    expect(registry.nextSeq(context.runId)).toBe(3);
  });

  it("should return 0 for sequence of non-existent runId", () => {
    expect(registry.nextSeq("non-existent")).toBe(0);
  });

  it("should remove a run context", () => {
    const context = registry.register("test-session");

    registry.remove(context.runId);

    expect(registry.get(context.runId)).toBeUndefined();
  });

  it("should list all active runs", () => {
    const context1 = registry.register("session-1");
    const context2 = registry.register("session-2");

    const active = registry.listActive();

    expect(active).toHaveLength(2);
    expect(active).toContain(context1);
    expect(active).toContain(context2);
  });

  it("should clear all runs", () => {
    registry.register("session-1");
    registry.register("session-2");

    registry.clear();

    expect(registry.listActive()).toHaveLength(0);
  });

  it("should generate unique runIds", () => {
    const context1 = registry.register("test-session");
    const context2 = registry.register("test-session");

    expect(context1.runId).not.toBe(context2.runId);
  });
});
