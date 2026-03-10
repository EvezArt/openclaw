#!/usr/bin/env node
/**
 * Dev script to run CrawFather continuously in the background.
 * Useful for Codespaces and always-on development environments.
 */

import { runCrawFather } from "../src/agents/crawfather.js";
import { startHeartbeat } from "../src/runtime/heartbeat.js";
import { RunRegistry } from "../src/runtime/run-context.js";
import { globalEventBus } from "../src/events/emitter.js";

const CRAWFATHER_INTERVAL_MS = 60000; // Run every 60 seconds
const HEARTBEAT_INTERVAL_MS = 30000; // Heartbeat every 30 seconds

async function main() {
  console.log("Starting CrawFather dev loop...");

  // Subscribe to events for logging
  globalEventBus.subscribe((event) => {
    console.log(
      `[Event] ${event.stream}:${JSON.stringify(event.data).slice(0, 100)} (runId=${event.runId.slice(0, 12)}, seq=${event.seq})`,
    );
  });

  // Start heartbeat
  const registry = new RunRegistry();
  const heartbeatContext = registry.register("agent:crawfather:heartbeat");
  const heartbeatHandle = startHeartbeat({
    intervalMs: HEARTBEAT_INTERVAL_MS,
    sessionKey: heartbeatContext.sessionKey,
    runId: heartbeatContext.runId,
  });

  console.log("Heartbeat started with intervalMs:", HEARTBEAT_INTERVAL_MS);

  // Run CrawFather periodically
  const runCrawFatherLoop = async () => {
    try {
      console.log("Running CrawFather cycle...");
      const runId = await runCrawFather({
        sessionKey: "agent:crawfather:main",
        hypothesisCount: 3,
        delayMs: 500,
      });
      console.log(`CrawFather cycle completed: ${runId}`);
    } catch (error) {
      console.error("CrawFather cycle failed:", error);
    }
  };

  // Initial run
  await runCrawFatherLoop();

  // Schedule periodic runs
  const interval = setInterval(runCrawFatherLoop, CRAWFATHER_INTERVAL_MS);

  console.log("CrawFather loop started with intervalMs:", CRAWFATHER_INTERVAL_MS);
  console.log("Press Ctrl+C to stop.");

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\nStopping CrawFather dev loop...");
    heartbeatHandle.stop();
    clearInterval(interval);
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
