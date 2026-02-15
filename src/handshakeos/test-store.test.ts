import { describe, test, expect, beforeEach } from "vitest";
import { TestStore } from "./test-store.js";
import { createUserActor, createEmptyDomainSignature, generateId } from "./utils.js";
import type { TestObject } from "./types.js";

describe("TestStore", () => {
  let store: TestStore;

  beforeEach(() => {
    store = new TestStore();
  });

  test("stores and retrieves tests", () => {
    const actor = createUserActor("user-1");
    const testObj: TestObject = {
      id: generateId(),
      name: "Test user preference",
      description: "Validate user preference hypothesis",
      hypothesisIds: ["hyp-1"],
      testType: "hypothesis-validation",
      procedure: "checkPreference()",
      expectedOutcome: "User prefers morning tasks",
      status: "pending",
      createdAt: Date.now(),
      actor,
      domainSignature: createEmptyDomainSignature(),
    };

    store.store(testObj);
    const retrieved = store.get(testObj.id);

    expect(retrieved).toEqual(testObj);
  });

  test("prevents duplicate test IDs", () => {
    const actor = createUserActor("user-1");
    const testObj: TestObject = {
      id: "duplicate-id",
      name: "Test",
      description: "Test",
      hypothesisIds: [],
      testType: "unit",
      procedure: "test()",
      expectedOutcome: "Pass",
      status: "pending",
      createdAt: Date.now(),
      actor,
      domainSignature: createEmptyDomainSignature(),
    };

    store.store(testObj);
    expect(() => store.store(testObj)).toThrow("Test with ID duplicate-id already exists");
  });

  test("updates test status", () => {
    const actor = createUserActor("user-1");
    const testObj: TestObject = {
      id: generateId(),
      name: "Test",
      description: "Test",
      hypothesisIds: [],
      testType: "unit",
      procedure: "test()",
      expectedOutcome: "Pass",
      status: "pending",
      createdAt: Date.now(),
      actor,
      domainSignature: createEmptyDomainSignature(),
    };

    store.store(testObj);
    const updated = store.update(testObj.id, { status: "running" });

    expect(updated).toBeDefined();
    expect(updated?.status).toBe("running");
  });

  test("records test run result", () => {
    const actor = createUserActor("user-1");
    const testObj: TestObject = {
      id: generateId(),
      name: "Test",
      description: "Test",
      hypothesisIds: [],
      testType: "unit",
      procedure: "test()",
      expectedOutcome: "Pass",
      status: "pending",
      createdAt: Date.now(),
      actor,
      domainSignature: createEmptyDomainSignature(),
    };

    store.store(testObj);
    const updated = store.recordTestRun(testObj.id, {
      status: "passed",
      actualOutcome: "Test passed successfully",
    });

    expect(updated).toBeDefined();
    expect(updated?.status).toBe("passed");
    expect(updated?.actualOutcome).toBe("Test passed successfully");
    expect(updated?.lastRunAt).toBeDefined();
  });

  test("queries tests by status", () => {
    const actor = createUserActor("user-1");
    const test1: TestObject = {
      id: generateId(),
      name: "Test 1",
      description: "Test 1",
      hypothesisIds: [],
      testType: "unit",
      procedure: "test1()",
      expectedOutcome: "Pass",
      status: "pending",
      createdAt: Date.now(),
      actor,
      domainSignature: createEmptyDomainSignature(),
    };
    const test2: TestObject = {
      id: generateId(),
      name: "Test 2",
      description: "Test 2",
      hypothesisIds: [],
      testType: "unit",
      procedure: "test2()",
      expectedOutcome: "Pass",
      status: "passed",
      createdAt: Date.now(),
      actor,
      domainSignature: createEmptyDomainSignature(),
    };

    store.store(test1);
    store.store(test2);

    const results = store.query({ status: "pending" });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(test1.id);
  });

  test("queries tests by hypothesis", () => {
    const actor = createUserActor("user-1");
    const test1: TestObject = {
      id: generateId(),
      name: "Test 1",
      description: "Test 1",
      hypothesisIds: ["hyp-1"],
      testType: "hypothesis-validation",
      procedure: "test1()",
      expectedOutcome: "Pass",
      status: "pending",
      createdAt: Date.now(),
      actor,
      domainSignature: createEmptyDomainSignature(),
    };
    const test2: TestObject = {
      id: generateId(),
      name: "Test 2",
      description: "Test 2",
      hypothesisIds: ["hyp-2"],
      testType: "hypothesis-validation",
      procedure: "test2()",
      expectedOutcome: "Pass",
      status: "pending",
      createdAt: Date.now(),
      actor,
      domainSignature: createEmptyDomainSignature(),
    };

    store.store(test1);
    store.store(test2);

    const results = store.query({ hypothesisId: "hyp-1" });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(test1.id);
  });

  test("queries tests by test type", () => {
    const actor = createUserActor("user-1");
    const test1: TestObject = {
      id: generateId(),
      name: "Unit test",
      description: "Test",
      hypothesisIds: [],
      testType: "unit",
      procedure: "test()",
      expectedOutcome: "Pass",
      status: "pending",
      createdAt: Date.now(),
      actor,
      domainSignature: createEmptyDomainSignature(),
    };
    const test2: TestObject = {
      id: generateId(),
      name: "Integration test",
      description: "Test",
      hypothesisIds: [],
      testType: "integration",
      procedure: "test()",
      expectedOutcome: "Pass",
      status: "pending",
      createdAt: Date.now(),
      actor,
      domainSignature: createEmptyDomainSignature(),
    };

    store.store(test1);
    store.store(test2);

    const results = store.query({ testType: "unit" });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(test1.id);
  });

  test("gets pending tests", () => {
    const actor = createUserActor("user-1");
    const test1: TestObject = {
      id: generateId(),
      name: "Test 1",
      description: "Test 1",
      hypothesisIds: [],
      testType: "unit",
      procedure: "test1()",
      expectedOutcome: "Pass",
      status: "pending",
      createdAt: Date.now(),
      actor,
      domainSignature: createEmptyDomainSignature(),
    };
    const test2: TestObject = {
      id: generateId(),
      name: "Test 2",
      description: "Test 2",
      hypothesisIds: [],
      testType: "unit",
      procedure: "test2()",
      expectedOutcome: "Pass",
      status: "passed",
      createdAt: Date.now(),
      actor,
      domainSignature: createEmptyDomainSignature(),
    };

    store.store(test1);
    store.store(test2);

    const pending = store.getPendingTests();
    expect(pending).toHaveLength(1);
    expect(pending[0].id).toBe(test1.id);
  });

  test("gets failed tests", () => {
    const actor = createUserActor("user-1");
    const test1: TestObject = {
      id: generateId(),
      name: "Test 1",
      description: "Test 1",
      hypothesisIds: [],
      testType: "unit",
      procedure: "test1()",
      expectedOutcome: "Pass",
      status: "failed",
      createdAt: Date.now(),
      actor,
      domainSignature: createEmptyDomainSignature(),
    };
    const test2: TestObject = {
      id: generateId(),
      name: "Test 2",
      description: "Test 2",
      hypothesisIds: [],
      testType: "unit",
      procedure: "test2()",
      expectedOutcome: "Pass",
      status: "passed",
      createdAt: Date.now(),
      actor,
      domainSignature: createEmptyDomainSignature(),
    };

    store.store(test1);
    store.store(test2);

    const failed = store.getFailedTests();
    expect(failed).toHaveLength(1);
    expect(failed[0].id).toBe(test1.id);
  });

  test("counts tests", () => {
    expect(store.count()).toBe(0);

    const actor = createUserActor("user-1");
    store.store({
      id: generateId(),
      name: "Test",
      description: "Test",
      hypothesisIds: [],
      testType: "unit",
      procedure: "test()",
      expectedOutcome: "Pass",
      status: "pending",
      createdAt: Date.now(),
      actor,
      domainSignature: createEmptyDomainSignature(),
    });

    expect(store.count()).toBe(1);
  });

  test("exports all tests", () => {
    const actor = createUserActor("user-1");
    store.store({
      id: generateId(),
      name: "Test 1",
      description: "Test 1",
      hypothesisIds: [],
      testType: "unit",
      procedure: "test1()",
      expectedOutcome: "Pass",
      status: "pending",
      createdAt: Date.now(),
      actor,
      domainSignature: createEmptyDomainSignature(),
    });
    store.store({
      id: generateId(),
      name: "Test 2",
      description: "Test 2",
      hypothesisIds: [],
      testType: "unit",
      procedure: "test2()",
      expectedOutcome: "Pass",
      status: "pending",
      createdAt: Date.now(),
      actor,
      domainSignature: createEmptyDomainSignature(),
    });

    const exported = store.exportAll();
    expect(exported).toHaveLength(2);
  });

  test("clears all tests", () => {
    const actor = createUserActor("user-1");
    store.store({
      id: generateId(),
      name: "Test",
      description: "Test",
      hypothesisIds: [],
      testType: "unit",
      procedure: "test()",
      expectedOutcome: "Pass",
      status: "pending",
      createdAt: Date.now(),
      actor,
      domainSignature: createEmptyDomainSignature(),
    });

    expect(store.count()).toBe(1);
    store.clear();
    expect(store.count()).toBe(0);
  });
});
