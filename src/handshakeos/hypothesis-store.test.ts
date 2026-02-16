import { describe, test, expect, beforeEach } from "vitest";
import { HypothesisStore } from "./hypothesis-store.js";
import { createUserActor, createEmptyDomainSignature, generateId } from "./utils.js";
import type { Hypothesis } from "./types.js";

describe("HypothesisStore", () => {
  let store: HypothesisStore;

  beforeEach(() => {
    store = new HypothesisStore();
  });

  test("stores and retrieves hypotheses", () => {
    const actor = createUserActor("user-1");
    const hypothesis: Hypothesis = {
      id: generateId(),
      modelType: "me",
      description: "User prefers morning tasks",
      probability: 0.7,
      falsifiers: [],
      domainSignature: createEmptyDomainSignature(),
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      evidenceEventIds: [],
      actor,
    };

    store.store(hypothesis);
    const retrieved = store.get(hypothesis.id);

    expect(retrieved).toEqual(hypothesis);
  });

  test("prevents duplicate hypothesis IDs", () => {
    const actor = createUserActor("user-1");
    const hypothesis: Hypothesis = {
      id: "duplicate-id",
      modelType: "me",
      description: "Test",
      probability: 0.5,
      falsifiers: [],
      domainSignature: createEmptyDomainSignature(),
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      evidenceEventIds: [],
      actor,
    };

    store.store(hypothesis);
    expect(() => store.store(hypothesis)).toThrow("Hypothesis with ID duplicate-id already exists");
  });

  test("updates hypothesis and increments version", () => {
    const actor = createUserActor("user-1");
    const hypothesis: Hypothesis = {
      id: generateId(),
      modelType: "me",
      description: "Test hypothesis",
      probability: 0.7,
      falsifiers: [],
      domainSignature: createEmptyDomainSignature(),
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      evidenceEventIds: [],
      actor,
    };

    store.store(hypothesis);
    const updated = store.update(hypothesis.id, { probability: 0.8 });

    expect(updated).toBeDefined();
    expect(updated?.probability).toBe(0.8);
    expect(updated?.version).toBe(2);
  });

  test("triggers falsifier", () => {
    const actor = createUserActor("user-1");
    const hypothesis: Hypothesis = {
      id: generateId(),
      modelType: "me",
      description: "Test hypothesis",
      probability: 0.7,
      falsifiers: [
        {
          description: "Counter-evidence found",
          testCondition: "checkCounterEvidence()",
          triggered: false,
        },
      ],
      domainSignature: createEmptyDomainSignature(),
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      evidenceEventIds: [],
      actor,
    };

    store.store(hypothesis);
    const updated = store.triggerFalsifier(hypothesis.id, 0);

    expect(updated).toBeDefined();
    expect(updated?.falsifiers[0].triggered).toBe(true);
    expect(updated?.falsifiers[0].triggeredAt).toBeDefined();
  });

  test("adds evidence to hypothesis", () => {
    const actor = createUserActor("user-1");
    const hypothesis: Hypothesis = {
      id: generateId(),
      modelType: "me",
      description: "Test hypothesis",
      probability: 0.7,
      falsifiers: [],
      domainSignature: createEmptyDomainSignature(),
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      evidenceEventIds: [],
      actor,
    };

    store.store(hypothesis);
    const updated = store.addEvidence(hypothesis.id, "event-123");

    expect(updated).toBeDefined();
    expect(updated?.evidenceEventIds).toContain("event-123");
  });

  test("queries hypotheses by model type", () => {
    const actor = createUserActor("user-1");
    const hypothesis1: Hypothesis = {
      id: generateId(),
      modelType: "me",
      description: "Me model",
      probability: 0.7,
      falsifiers: [],
      domainSignature: createEmptyDomainSignature(),
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      evidenceEventIds: [],
      actor,
    };
    const hypothesis2: Hypothesis = {
      id: generateId(),
      modelType: "system",
      description: "System model",
      probability: 0.8,
      falsifiers: [],
      domainSignature: createEmptyDomainSignature(),
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      evidenceEventIds: [],
      actor,
    };

    store.store(hypothesis1);
    store.store(hypothesis2);

    const results = store.query({ modelType: "me" });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(hypothesis1.id);
  });

  test("queries hypotheses by probability range", () => {
    const actor = createUserActor("user-1");
    const hypothesis1: Hypothesis = {
      id: generateId(),
      modelType: "me",
      description: "Low probability",
      probability: 0.3,
      falsifiers: [],
      domainSignature: createEmptyDomainSignature(),
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      evidenceEventIds: [],
      actor,
    };
    const hypothesis2: Hypothesis = {
      id: generateId(),
      modelType: "me",
      description: "High probability",
      probability: 0.9,
      falsifiers: [],
      domainSignature: createEmptyDomainSignature(),
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      evidenceEventIds: [],
      actor,
    };

    store.store(hypothesis1);
    store.store(hypothesis2);

    const results = store.query({ minProbability: 0.5 });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(hypothesis2.id);
  });

  test("queries hypotheses by falsification status", () => {
    const actor = createUserActor("user-1");
    const hypothesis1: Hypothesis = {
      id: generateId(),
      modelType: "me",
      description: "Active hypothesis",
      probability: 0.7,
      falsifiers: [
        {
          description: "Test",
          testCondition: "test()",
          triggered: false,
        },
      ],
      domainSignature: createEmptyDomainSignature(),
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      evidenceEventIds: [],
      actor,
    };
    const hypothesis2: Hypothesis = {
      id: generateId(),
      modelType: "me",
      description: "Falsified hypothesis",
      probability: 0.5,
      falsifiers: [
        {
          description: "Test",
          testCondition: "test()",
          triggered: true,
          triggeredAt: Date.now(),
        },
      ],
      domainSignature: createEmptyDomainSignature(),
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      evidenceEventIds: [],
      actor,
    };

    store.store(hypothesis1);
    store.store(hypothesis2);

    const active = store.query({ falsified: false });
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe(hypothesis1.id);

    const falsified = store.query({ falsified: true });
    expect(falsified).toHaveLength(1);
    expect(falsified[0].id).toBe(hypothesis2.id);
  });

  test("gets parallel hypotheses for all model types", () => {
    const actor = createUserActor("user-1");
    const models: Array<{ type: "me" | "we" | "they" | "system"; desc: string }> = [
      { type: "me", desc: "Me model" },
      { type: "we", desc: "We model" },
      { type: "they", desc: "They model" },
      { type: "system", desc: "System model" },
    ];

    for (const model of models) {
      store.store({
        id: generateId(),
        modelType: model.type,
        description: model.desc,
        probability: 0.7,
        falsifiers: [],
        domainSignature: createEmptyDomainSignature(),
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        evidenceEventIds: [],
        actor,
      });
    }

    const parallel = store.getParallelHypotheses(5);
    expect(parallel.me).toHaveLength(1);
    expect(parallel.we).toHaveLength(1);
    expect(parallel.they).toHaveLength(1);
    expect(parallel.system).toHaveLength(1);
  });

  test("counts hypotheses", () => {
    expect(store.count()).toBe(0);

    const actor = createUserActor("user-1");
    store.store({
      id: generateId(),
      modelType: "me",
      description: "Test",
      probability: 0.5,
      falsifiers: [],
      domainSignature: createEmptyDomainSignature(),
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      evidenceEventIds: [],
      actor,
    });

    expect(store.count()).toBe(1);
  });

  test("exports all hypotheses", () => {
    const actor = createUserActor("user-1");
    store.store({
      id: generateId(),
      modelType: "me",
      description: "Test 1",
      probability: 0.5,
      falsifiers: [],
      domainSignature: createEmptyDomainSignature(),
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      evidenceEventIds: [],
      actor,
    });
    store.store({
      id: generateId(),
      modelType: "system",
      description: "Test 2",
      probability: 0.7,
      falsifiers: [],
      domainSignature: createEmptyDomainSignature(),
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      evidenceEventIds: [],
      actor,
    });

    const exported = store.exportAll();
    expect(exported).toHaveLength(2);
  });

  test("clears all hypotheses", () => {
    const actor = createUserActor("user-1");
    store.store({
      id: generateId(),
      modelType: "me",
      description: "Test",
      probability: 0.5,
      falsifiers: [],
      domainSignature: createEmptyDomainSignature(),
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      evidenceEventIds: [],
      actor,
    });

    expect(store.count()).toBe(1);
    store.clear();
    expect(store.count()).toBe(0);
  });
});
