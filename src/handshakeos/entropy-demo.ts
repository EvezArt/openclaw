/**
 * HandshakeOS-E Entropy System Demo
 *
 * Demonstrates mathematical entropy calculation and tracking
 * as hypotheses evolve and converge.
 */

import {
  calculateHypothesisEntropy,
  calculateSystemEntropy,
  formatEntropyState,
  formatSystemEntropy,
  detectEntropyEvents,
  type HypothesisEntropyState,
} from "./hypothesis-entropy.js";
import type { Hypothesis } from "./types.js";
import { createActor, createDomainSignature } from "./utils.js";

function createHypothesis(
  id: string,
  modelType: "me" | "we" | "they" | "system",
  description: string,
  probability: number,
): Hypothesis {
  return {
    id,
    modelType,
    description,
    probability,
    falsifiers: [],
    domainSignature: createDomainSignature(),
    actor: createActor("agent-demo", "agent"),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
    evidenceIds: [],
  };
}

console.log("=== HandshakeOS-E Entropy System Demo ===\n");

// Scenario: Productivity optimization
// Four parallel hypotheses across different models
console.log("Scenario: When should I work on deep tasks?\n");

// Phase 1: Initial uniform distribution (maximum entropy)
console.log("Phase 1: Initial hypotheses (maximum entropy)");
console.log("=".repeat(60));

let hypotheses = [
  createHypothesis("hyp_me_1", "me", "I am most productive between 9-11 AM", 0.25),
  createHypothesis("hyp_we_1", "we", "Team collaboration peaks in afternoon slots (2-4 PM)", 0.25),
  createHypothesis(
    "hyp_they_1",
    "they",
    "User's calendar shows morning meetings reduce focus",
    0.25,
  ),
  createHypothesis("hyp_system_1", "system", "System load is lowest 6-8 AM", 0.25),
];

let entropyState = calculateHypothesisEntropy(hypotheses);

console.log("\nHypotheses:");
for (const h of hypotheses) {
  console.log(`  [${h.modelType}] ${h.description} (p=${h.probability.toFixed(2)})`);
}

console.log("\n" + formatEntropyState(entropyState));
console.log("\n");

// Phase 2: Evidence arrives - user tracked productivity
console.log("Phase 2: Evidence from productivity tracking");
console.log("=".repeat(60));
console.log("Evidence: User's focus score highest between 9-11 AM\n");

hypotheses = [
  createHypothesis(
    "hyp_me_1",
    "me",
    "I am most productive between 9-11 AM",
    0.5, // Increased
  ),
  createHypothesis(
    "hyp_we_1",
    "we",
    "Team collaboration peaks in afternoon slots (2-4 PM)",
    0.2, // Decreased
  ),
  createHypothesis(
    "hyp_they_1",
    "they",
    "User's calendar shows morning meetings reduce focus",
    0.15, // Decreased
  ),
  createHypothesis(
    "hyp_system_1",
    "system",
    "System load is lowest 6-8 AM",
    0.15, // Decreased
  ),
];

const prevState = entropyState;
entropyState = calculateHypothesisEntropy(hypotheses, prevState);

console.log("Updated hypotheses:");
for (const h of hypotheses) {
  console.log(`  [${h.modelType}] ${h.description} (p=${h.probability.toFixed(2)})`);
}

console.log("\n" + formatEntropyState(entropyState));

const events1 = detectEntropyEvents(entropyState);
if (events1.length > 0) {
  console.log("\nEntropy Events Detected:");
  for (const event of events1) {
    if (event.type === "convergence") {
      console.log(`  ✓ CONVERGENCE: Entropy decreased by ${Math.abs(event.delta).toFixed(3)} bits`);
    }
  }
}
console.log("\n");

// Phase 3: More evidence - calendar analysis
console.log("Phase 3: Calendar analysis confirms pattern");
console.log("=".repeat(60));
console.log("Evidence: Calendar shows morning meetings only 2 days/week\n");

hypotheses = [
  createHypothesis(
    "hyp_me_1",
    "me",
    "I am most productive between 9-11 AM",
    0.65, // Further increased
  ),
  createHypothesis(
    "hyp_we_1",
    "we",
    "Team collaboration peaks in afternoon slots (2-4 PM)",
    0.2, // Stable
  ),
  createHypothesis(
    "hyp_they_1",
    "they",
    "User's calendar shows morning meetings reduce focus",
    0.1, // Further decreased
  ),
  createHypothesis(
    "hyp_system_1",
    "system",
    "System load is lowest 6-8 AM",
    0.05, // Further decreased
  ),
];

entropyState = calculateHypothesisEntropy(hypotheses, entropyState);

console.log("Updated hypotheses:");
for (const h of hypotheses) {
  console.log(`  [${h.modelType}] ${h.description} (p=${h.probability.toFixed(2)})`);
}

console.log("\n" + formatEntropyState(entropyState));

const events2 = detectEntropyEvents(entropyState);
if (events2.length > 0) {
  console.log("\nEntropy Events Detected:");
  for (const event of events2) {
    if (event.type === "convergence") {
      console.log(`  ✓ CONVERGENCE: Entropy decreased by ${Math.abs(event.delta).toFixed(3)} bits`);
    } else if (event.type === "threshold_crossed") {
      console.log(`  ✓ THRESHOLD CROSSED: Entropy fell below ${event.threshold} bits`);
    }
  }
}
console.log("\n");

// Phase 4: Final convergence - strong winner emerges
console.log("Phase 4: Strong convergence to winning hypothesis");
console.log("=".repeat(60));
console.log("Evidence: 3 weeks of data confirms 9-11 AM peak performance\n");

hypotheses = [
  createHypothesis(
    "hyp_me_1",
    "me",
    "I am most productive between 9-11 AM",
    0.8, // Strong winner
  ),
  createHypothesis("hyp_we_1", "we", "Team collaboration peaks in afternoon slots (2-4 PM)", 0.1),
  createHypothesis(
    "hyp_they_1",
    "they",
    "User's calendar shows morning meetings reduce focus",
    0.05,
  ),
  createHypothesis("hyp_system_1", "system", "System load is lowest 6-8 AM", 0.05),
];

entropyState = calculateHypothesisEntropy(hypotheses, entropyState);

console.log("Final hypotheses:");
for (const h of hypotheses) {
  const marker = h.probability > 0.7 ? "✅ WINNER" : "";
  console.log(`  [${h.modelType}] ${h.description} (p=${h.probability.toFixed(2)}) ${marker}`);
}

console.log("\n" + formatEntropyState(entropyState));

const events3 = detectEntropyEvents(entropyState);
if (events3.length > 0) {
  console.log("\nEntropy Events Detected:");
  for (const event of events3) {
    if (event.type === "convergence") {
      console.log(`  ✓ CONVERGENCE: Entropy decreased by ${Math.abs(event.delta).toFixed(3)} bits`);
    } else if (event.type === "threshold_crossed") {
      console.log(`  ✓ THRESHOLD CROSSED: Entropy fell below ${event.threshold} bits`);
    } else if (event.type === "information_milestone") {
      console.log(`  ✓ MILESTONE: Gained ${event.totalGain.toFixed(2)} bits of information total`);
    }
  }
}
console.log("\n");

// System-wide analysis
console.log("System-Wide Entropy Analysis");
console.log("=".repeat(60));

// Add hypotheses from other domains
const allHypotheses = [
  ...hypotheses,
  // Add more hypotheses in different domains
  createHypothesis("hyp_we_2", "we", "Team prefers async communication", 0.6),
  createHypothesis("hyp_we_3", "we", "Team wants more sync meetings", 0.4),
  createHypothesis("hyp_system_2", "system", "Server backup runs 2-4 AM daily", 0.9),
  createHypothesis("hyp_system_3", "system", "Peak API usage at noon", 0.1),
];

const systemEntropy = calculateSystemEntropy(allHypotheses);
console.log(formatSystemEntropy(systemEntropy));

// Summary
console.log("Summary");
console.log("=".repeat(60));
console.log(`Total entropy reduced: ${entropyState.totalInformationGain.toFixed(3)} bits`);
console.log(
  `Convergence updates: ${entropyState.convergenceUpdates} (vs ${entropyState.divergenceUpdates} divergence)`,
);
console.log(`Final state: ${entropyState.isConverging ? "CONVERGED ✓" : "UNCERTAIN"}`);
console.log(`Effective outcomes: ${entropyState.summary.perplexity.toFixed(2)} (from 4 initially)`);
console.log(
  `\nInterpretation: System gained ${entropyState.totalInformationGain.toFixed(2)} bits of information,`,
);
console.log(
  `reducing uncertainty from maximum (2.0 bits) to ${entropyState.currentEntropy.toFixed(2)} bits.`,
);
console.log(`The "me" model hypothesis is now dominant with 80% probability.`);
console.log("\n✅ Entropy solved: System uncertainty quantified and minimized\n");
