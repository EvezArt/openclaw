import { describe, test, expect, beforeEach } from "vitest";
import { IntentStore } from "./intent-store.js";
import { createUserActor, createEmptyDomainSignature, generateId } from "./utils.js";
import type { IntentToken } from "./types.js";

describe("IntentStore", () => {
  let store: IntentStore;

  beforeEach(() => {
    store = new IntentStore();
  });

  test("stores and retrieves intents", () => {
    const actor = createUserActor("user-1");
    const intent: IntentToken = {
      id: generateId(),
      timestamp: Date.now(),
      actor,
      goal: "Complete task",
      constraints: ["Time limit: 1 hour"],
      successMetric: "Task completed successfully",
      confidence: 0.8,
      eventIds: [],
      measurable: true,
      domainSignature: createEmptyDomainSignature(),
    };

    store.store(intent);
    const retrieved = store.get(intent.id);

    expect(retrieved).toEqual(intent);
  });

  test("prevents duplicate intent IDs", () => {
    const actor = createUserActor("user-1");
    const intent: IntentToken = {
      id: "duplicate-id",
      timestamp: Date.now(),
      actor,
      goal: "Test",
      constraints: [],
      successMetric: "Done",
      confidence: 0.5,
      eventIds: [],
      measurable: true,
      domainSignature: createEmptyDomainSignature(),
    };

    store.store(intent);
    expect(() => store.store(intent)).toThrow("Intent with ID duplicate-id already exists");
  });

  test("updates intent state", () => {
    const actor = createUserActor("user-1");
    const intent: IntentToken = {
      id: generateId(),
      timestamp: Date.now(),
      actor,
      goal: "Complete task",
      constraints: [],
      successMetric: "Done",
      confidence: 0.8,
      state: "pending",
      eventIds: [],
      measurable: true,
      domainSignature: createEmptyDomainSignature(),
    };

    store.store(intent);
    const updated = store.update(intent.id, {
      state: "executing",
      trigger: "User initiated",
    });

    expect(updated).toBeDefined();
    expect(updated?.state).toBe("executing");
    expect(updated?.trigger).toBe("User initiated");
  });

  test("updates intent payoff", () => {
    const actor = createUserActor("user-1");
    const intent: IntentToken = {
      id: generateId(),
      timestamp: Date.now(),
      actor,
      goal: "Optimize performance",
      constraints: [],
      successMetric: "Performance improvement",
      confidence: 0.7,
      eventIds: [],
      measurable: true,
      domainSignature: createEmptyDomainSignature(),
    };

    store.store(intent);
    const updated = store.update(intent.id, {
      state: "completed",
      payoff: 0.85,
    });

    expect(updated?.state).toBe("completed");
    expect(updated?.payoff).toBe(0.85);
  });

  test("queries intents by actor", () => {
    const actor1 = createUserActor("user-1");
    const actor2 = createUserActor("user-2");
    const intent1: IntentToken = {
      id: generateId(),
      timestamp: Date.now(),
      actor: actor1,
      goal: "Task 1",
      constraints: [],
      successMetric: "Done",
      confidence: 0.8,
      eventIds: [],
      measurable: true,
      domainSignature: createEmptyDomainSignature(),
    };
    const intent2: IntentToken = {
      id: generateId(),
      timestamp: Date.now(),
      actor: actor2,
      goal: "Task 2",
      constraints: [],
      successMetric: "Done",
      confidence: 0.7,
      eventIds: [],
      measurable: true,
      domainSignature: createEmptyDomainSignature(),
    };

    store.store(intent1);
    store.store(intent2);

    const results = store.query({ actorId: "user-1" });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(intent1.id);
  });

  test("queries intents by state", () => {
    const actor = createUserActor("user-1");
    const intent1: IntentToken = {
      id: generateId(),
      timestamp: Date.now(),
      actor,
      goal: "Task 1",
      constraints: [],
      successMetric: "Done",
      confidence: 0.8,
      state: "pending",
      eventIds: [],
      measurable: true,
      domainSignature: createEmptyDomainSignature(),
    };
    const intent2: IntentToken = {
      id: generateId(),
      timestamp: Date.now(),
      actor,
      goal: "Task 2",
      constraints: [],
      successMetric: "Done",
      confidence: 0.7,
      state: "completed",
      eventIds: [],
      measurable: true,
      domainSignature: createEmptyDomainSignature(),
    };

    store.store(intent1);
    store.store(intent2);

    const results = store.query({ state: "pending" });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(intent1.id);
  });

  test("queries intents by measurability", () => {
    const actor = createUserActor("user-1");
    const intent1: IntentToken = {
      id: generateId(),
      timestamp: Date.now(),
      actor,
      goal: "Task 1",
      constraints: [],
      successMetric: "Done",
      confidence: 0.8,
      eventIds: [],
      measurable: true,
      domainSignature: createEmptyDomainSignature(),
    };
    const intent2: IntentToken = {
      id: generateId(),
      timestamp: Date.now(),
      actor,
      goal: "Task 2",
      constraints: [],
      successMetric: "Done",
      confidence: 0.7,
      eventIds: [],
      measurable: false,
      domainSignature: createEmptyDomainSignature(),
    };

    store.store(intent1);
    store.store(intent2);

    const results = store.query({ measurable: true });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(intent1.id);
  });

  test("gets pending intents", () => {
    const actor = createUserActor("user-1");
    const intent1: IntentToken = {
      id: generateId(),
      timestamp: Date.now(),
      actor,
      goal: "Task 1",
      constraints: [],
      successMetric: "Done",
      confidence: 0.8,
      state: "pending",
      eventIds: [],
      measurable: true,
      domainSignature: createEmptyDomainSignature(),
    };
    const intent2: IntentToken = {
      id: generateId(),
      timestamp: Date.now(),
      actor,
      goal: "Task 2",
      constraints: [],
      successMetric: "Done",
      confidence: 0.7,
      state: "executing",
      eventIds: [],
      measurable: true,
      domainSignature: createEmptyDomainSignature(),
    };

    store.store(intent1);
    store.store(intent2);

    const pending = store.getPendingIntents();
    expect(pending).toHaveLength(1);
    expect(pending[0].id).toBe(intent1.id);
  });

  test("counts intents", () => {
    expect(store.count()).toBe(0);

    const actor = createUserActor("user-1");
    store.store({
      id: generateId(),
      timestamp: Date.now(),
      actor,
      goal: "Task",
      constraints: [],
      successMetric: "Done",
      confidence: 0.8,
      eventIds: [],
      measurable: true,
      domainSignature: createEmptyDomainSignature(),
    });

    expect(store.count()).toBe(1);
  });

  test("exports all intents", () => {
    const actor = createUserActor("user-1");
    const intent1: IntentToken = {
      id: generateId(),
      timestamp: Date.now(),
      actor,
      goal: "Task 1",
      constraints: [],
      successMetric: "Done",
      confidence: 0.8,
      eventIds: [],
      measurable: true,
      domainSignature: createEmptyDomainSignature(),
    };
    const intent2: IntentToken = {
      id: generateId(),
      timestamp: Date.now(),
      actor,
      goal: "Task 2",
      constraints: [],
      successMetric: "Done",
      confidence: 0.7,
      eventIds: [],
      measurable: true,
      domainSignature: createEmptyDomainSignature(),
    };

    store.store(intent1);
    store.store(intent2);

    const exported = store.exportAll();
    expect(exported).toHaveLength(2);
  });

  test("clears all intents", () => {
    const actor = createUserActor("user-1");
    store.store({
      id: generateId(),
      timestamp: Date.now(),
      actor,
      goal: "Task",
      constraints: [],
      successMetric: "Done",
      confidence: 0.8,
      eventIds: [],
      measurable: true,
      domainSignature: createEmptyDomainSignature(),
    });

    expect(store.count()).toBe(1);
    store.clear();
    expect(store.count()).toBe(0);
  });
});
