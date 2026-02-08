/**
 * HandshakeOS-E Test Store
 *
 * Manages first-class test objects linked to hypotheses.
 */

import type { ActorIdentity, TestObject } from "./types.js";

/**
 * Query options for retrieving tests.
 */
export type TestQuery = {
  /** Filter by test status */
  status?: TestObject["status"];
  /** Filter by test type */
  testType?: string;
  /** Filter by hypothesis ID (tests linked to this hypothesis) */
  hypothesisId?: string;
  /** Filter by actor ID */
  actorId?: string;
  /** Start timestamp (inclusive) */
  startTime?: number;
  /** End timestamp (inclusive) */
  endTime?: number;
  /** Maximum number of results */
  limit?: number;
  /** Skip first N results */
  offset?: number;
};

/**
 * In-memory test store for MVP implementation.
 */
class TestStore {
  private tests: Map<string, TestObject> = new Map();
  private testsByStatus: Map<string, Set<string>> = new Map();
  private testsByHypothesis: Map<string, Set<string>> = new Map();
  private testsByActor: Map<string, Set<string>> = new Map();

  /**
   * Store a new test object.
   */
  store(test: TestObject): void {
    if (this.tests.has(test.id)) {
      throw new Error(`Test with ID ${test.id} already exists`);
    }

    this.tests.set(test.id, test);

    // Index by status
    if (!this.testsByStatus.has(test.status)) {
      this.testsByStatus.set(test.status, new Set());
    }
    this.testsByStatus.get(test.status)!.add(test.id);

    // Index by hypothesis
    for (const hypothesisId of test.hypothesisIds) {
      if (!this.testsByHypothesis.has(hypothesisId)) {
        this.testsByHypothesis.set(hypothesisId, new Set());
      }
      this.testsByHypothesis.get(hypothesisId)!.add(test.id);
    }

    // Index by actor
    if (!this.testsByActor.has(test.actor.id)) {
      this.testsByActor.set(test.actor.id, new Set());
    }
    this.testsByActor.get(test.actor.id)!.add(test.id);
  }

  /**
   * Update an existing test.
   */
  update(id: string, updates: Partial<TestObject>): TestObject | undefined {
    const existing = this.tests.get(id);
    if (!existing) {
      return undefined;
    }

    // Remove from old status index
    if (updates.status && updates.status !== existing.status) {
      this.testsByStatus.get(existing.status)?.delete(id);
      if (!this.testsByStatus.has(updates.status)) {
        this.testsByStatus.set(updates.status, new Set());
      }
      this.testsByStatus.get(updates.status)!.add(id);
    }

    // Update hypothesis index if changed
    if (updates.hypothesisIds) {
      // Remove from old hypotheses
      for (const hypothesisId of existing.hypothesisIds) {
        this.testsByHypothesis.get(hypothesisId)?.delete(id);
      }
      // Add to new hypotheses
      for (const hypothesisId of updates.hypothesisIds) {
        if (!this.testsByHypothesis.has(hypothesisId)) {
          this.testsByHypothesis.set(hypothesisId, new Set());
        }
        this.testsByHypothesis.get(hypothesisId)!.add(id);
      }
    }

    const updated: TestObject = { ...existing, ...updates };
    this.tests.set(id, updated);

    return updated;
  }

  /**
   * Retrieve a test by ID.
   */
  get(id: string): TestObject | undefined {
    return this.tests.get(id);
  }

  /**
   * Record test execution result.
   */
  recordTestRun(
    testId: string,
    result: { status: TestObject["status"]; actualOutcome: string },
  ): TestObject | undefined {
    return this.update(testId, {
      status: result.status,
      actualOutcome: result.actualOutcome,
      lastRunAt: Date.now(),
    });
  }

  /**
   * Query tests based on criteria.
   */
  query(options: TestQuery = {}): TestObject[] {
    let candidateIds: Set<string> | undefined;

    // Start with most selective index
    if (options.hypothesisId) {
      candidateIds = this.testsByHypothesis.get(options.hypothesisId);
    } else if (options.status) {
      candidateIds = this.testsByStatus.get(options.status);
    } else if (options.actorId) {
      candidateIds = this.testsByActor.get(options.actorId);
    }

    // If no index matched, use all tests
    if (!candidateIds) {
      candidateIds = new Set(this.tests.keys());
    }

    // Filter candidates
    let results: TestObject[] = [];
    for (const id of candidateIds) {
      const test = this.tests.get(id);
      if (!test) {
        continue;
      }

      // Apply filters
      if (options.status && test.status !== options.status) {
        continue;
      }
      if (options.testType && test.testType !== options.testType) {
        continue;
      }
      if (options.hypothesisId && !test.hypothesisIds.includes(options.hypothesisId)) {
        continue;
      }
      if (options.actorId && test.actor.id !== options.actorId) {
        continue;
      }
      if (options.startTime && test.createdAt < options.startTime) {
        continue;
      }
      if (options.endTime && test.createdAt > options.endTime) {
        continue;
      }

      results.push(test);
    }

    // Sort by last run time (most recent first), then by creation time
    results.sort((a, b) => {
      const aTime = a.lastRunAt ?? a.createdAt;
      const bTime = b.lastRunAt ?? b.createdAt;
      return bTime - aTime;
    });

    // Apply pagination
    if (options.offset) {
      results = results.slice(options.offset);
    }
    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Get tests by status.
   */
  getByStatus(status: TestObject["status"], limit?: number): TestObject[] {
    return this.query({ status, limit });
  }

  /**
   * Get tests linked to a hypothesis.
   */
  getByHypothesis(hypothesisId: string, limit?: number): TestObject[] {
    return this.query({ hypothesisId, limit });
  }

  /**
   * Get tests by actor.
   */
  getByActor(actor: ActorIdentity, limit?: number): TestObject[] {
    return this.query({ actorId: actor.id, limit });
  }

  /**
   * Get pending tests.
   */
  getPendingTests(limit?: number): TestObject[] {
    return this.query({ status: "pending", limit });
  }

  /**
   * Get failed tests.
   */
  getFailedTests(limit?: number): TestObject[] {
    return this.query({ status: "failed", limit });
  }

  /**
   * Count total tests.
   */
  count(): number {
    return this.tests.size;
  }

  /**
   * Clear all tests (for testing).
   */
  clear(): void {
    this.tests.clear();
    this.testsByStatus.clear();
    this.testsByHypothesis.clear();
    this.testsByActor.clear();
  }

  /**
   * Export all tests (for backup/audit).
   */
  exportAll(): TestObject[] {
    return Array.from(this.tests.values());
  }
}

// Singleton instance
const testStore = new TestStore();

export { testStore, TestStore };
