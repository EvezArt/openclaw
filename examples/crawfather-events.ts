/**
 * Example: CrawFather Event Emission
 * 
 * This example demonstrates how to emit CrawFather agent events
 * for parallel hypothesis tracking during an agent run.
 * 
 * Run with: node --import tsx examples/crawfather-events.ts
 */

import {
  emitSystemEvent,
  emitHypothesisEvent,
  emitHeartbeatRunEvent,
  registerAgentRunContext,
  clearAgentRunContext,
  onAgentEvent,
} from "../src/infra/agent-events.js";

async function simulateCrawFatherRun() {
  const runId = `run-${Date.now()}`;
  const sessionKey = "agent:crawfather:main";

  // Register the run context
  registerAgentRunContext(runId, {
    sessionKey,
    verboseLevel: "on",
    isHeartbeat: false,
  });

  try {
    // 1. Start the run
    console.log("Starting CrawFather run...");
    emitSystemEvent(runId, "run_started", {
      agentId: "agent:crawfather:main",
      task: "analyze user query",
    }, sessionKey);

    await delay(500);

    // 2. Create initial hypotheses
    console.log("Creating hypotheses...");
    
    emitHypothesisEvent(runId, {
      subtype: "created",
      hypothesisId: "h1",
      hypothesis: "User wants to search for files",
      score: 0.85,
      status: "active",
    }, sessionKey);

    emitHypothesisEvent(runId, {
      subtype: "created",
      hypothesisId: "h2",
      hypothesis: "User wants to read documentation",
      score: 0.72,
      status: "active",
    }, sessionKey);

    await delay(1000);

    // 3. Update hypothesis scores as evidence is gathered
    console.log("Gathering evidence...");
    
    emitHypothesisEvent(runId, {
      subtype: "updated",
      hypothesisId: "h1",
      score: 0.92,
      evidence: "Found grep pattern in user message",
    }, sessionKey);

    await delay(800);

    // 4. Send heartbeat during long operation
    emitHeartbeatRunEvent(runId, {
      phase: "processing",
      status: "active",
    }, sessionKey);

    await delay(600);

    // 5. Resolve hypotheses
    console.log("Resolving hypotheses...");

    emitHypothesisEvent(runId, {
      subtype: "resolved",
      hypothesisId: "h1",
      outcome: "confirmed",
      reason: "Successfully executed file search",
      status: "resolved",
    }, sessionKey);

    emitHypothesisEvent(runId, {
      subtype: "resolved",
      hypothesisId: "h2",
      outcome: "rejected",
      reason: "No documentation keywords found",
      status: "resolved",
    }, sessionKey);

    await delay(500);

    // 6. Complete the run
    console.log("Run completed successfully!");
    emitSystemEvent(runId, "run_completed", {
      duration: Date.now() - Number(runId.split("-")[1]),
      hypothesesEvaluated: 2,
      outcome: "success",
    }, sessionKey);

  } catch (error) {
    console.error("Run failed:", error);
    emitSystemEvent(runId, "run_failed", {
      error: String(error),
    }, sessionKey);
  } finally {
    clearAgentRunContext(runId);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function subscribeToEvents() {
  return onAgentEvent((evt) => {
    const timestamp = new Date(evt.ts).toISOString();
    console.log(`[${timestamp}] ${evt.stream} (seq: ${evt.seq}):`, evt.data);
  });
}

// Run the example
const unsubscribe = subscribeToEvents();

console.log("CrawFather Event Emission Example");
console.log("==================================\n");

simulateCrawFatherRun()
  .then(() => {
    console.log("\nExample complete!");
    unsubscribe();
  })
  .catch((err) => {
    console.error("Example failed:", err);
    unsubscribe();
    process.exit(1);
  });
