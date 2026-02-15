/**
 * RunRegistry tracks active agent runs with their session context and sequence numbers.
 * Used for the CrawFather and other always-on agents.
 */

export type RunContext = {
  runId: string;
  sessionKey: string;
  seq: number;
  startedAt: number;
};

export class RunRegistry {
  private runs = new Map<string, RunContext>();

  /**
   * Register a new run context.
   */
  register(sessionKey: string): RunContext {
    const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const context: RunContext = {
      runId,
      sessionKey,
      seq: 0,
      startedAt: Date.now(),
    };
    this.runs.set(runId, context);
    return context;
  }

  /**
   * Get a run context by runId.
   */
  get(runId: string): RunContext | undefined {
    return this.runs.get(runId);
  }

  /**
   * Increment and return the next sequence number for a run.
   */
  nextSeq(runId: string): number {
    const context = this.runs.get(runId);
    if (!context) {
      return 0;
    }
    context.seq++;
    return context.seq;
  }

  /**
   * Remove a run from the registry.
   */
  remove(runId: string): void {
    this.runs.delete(runId);
  }

  /**
   * List all active runs.
   */
  listActive(): RunContext[] {
    return Array.from(this.runs.values());
  }

  /**
   * Clear all runs (for testing).
   */
  clear(): void {
    this.runs.clear();
  }
}
