#!/usr/bin/env node
/**
 * Demo: Parallel Hypothesis Tracking
 *
 * Shows how competing hypotheses are tracked across multiple model perspectives
 * (me/we/they/system) with real-time event emission.
 */

import {
  createHypothesis,
  updateHypothesis,
  falsifyHypothesis,
  selectHypothesis,
  getRunHypotheses,
  getHypothesesByModelType,
  getSelectedHypothesis,
  onHypothesisEvent,
  clearAllHypothesesForTest,
} from "./hypothesis-events.js";

// Demo scenario: Agent is deciding on best time for user tasks
const runId = "productivity-analysis-run-001";

console.log("=== Parallel Hypothesis Tracking Demo ===\n");

// Subscribe to hypothesis events
const unsubscribe = onHypothesisEvent((rid, data) => {
  console.log(`[EVENT] ${data.phase.toUpperCase()}: ${data.modelType} model`);
  console.log(`  Description: ${data.description}`);
  console.log(`  Probability: ${data.probability}`);
  console.log(`  Version: ${data.version}\n`);
});

console.log("1. Creating parallel hypotheses...\n");

// Different perspectives on the same problem
const meHyp = createHypothesis(runId, "me", "I am most productive between 9-11 AM", 0.7);

const weHyp = createHypothesis(runId, "we", "Team collaboration peaks in afternoon slots", 0.6);

const theyHyp = createHypothesis(
  runId,
  "they",
  "User's calendar shows morning meetings reduce focus",
  0.5,
);

const systemHyp = createHypothesis(
  runId,
  "system",
  "System load is lowest 6-8 AM, suggesting early scheduling",
  0.8,
);

console.log("\n2. Evidence arrives - updating probabilities...\n");

// New evidence: morning productivity metrics are strong
updateHypothesis(runId, meHyp, 0.85);

// Team feedback: afternoon works better for collaboration
updateHypothesis(runId, weHyp, 0.75);

console.log("\n3. Testing falsifier - calendar analysis...\n");

// Falsifier triggered: actual calendar data contradicts theory
falsifyHypothesis(runId, theyHyp, 0);

console.log("\n4. Selecting winning hypothesis...\n");

// After weighing all evidence, system model wins
selectHypothesis(runId, systemHyp);

console.log("\n5. Final state - grouped by model type:\n");

const grouped = getHypothesesByModelType(runId);
console.log("Me models:", grouped.me.length);
console.log("We models:", grouped.we.length);
console.log("They models:", grouped.they.length);
console.log("System models:", grouped.system.length);

const selected = getSelectedHypothesis(runId);
if (selected) {
  console.log("\n6. Selected hypothesis:");
  console.log(`  Model: ${selected.modelType}`);
  console.log(`  Description: ${selected.description}`);
  console.log(`  Final probability: ${selected.probability}`);
}

console.log("\n7. All hypotheses for this run:\n");
const allHyps = getRunHypotheses(runId);
allHyps.forEach((h) => {
  const status = h.phase === "falsified" ? "❌" : h.phase === "selected" ? "✅" : "○";
  console.log(`${status} [${h.modelType}] ${h.description} (p=${h.probability})`);
});

unsubscribe();

console.log("\n=== Demo Complete ===");
