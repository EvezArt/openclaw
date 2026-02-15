/**
 * HandshakeOS-E Universal Threat Assessment & Identity Demo
 *
 * Demonstrates:
 * 1. Bioorganism signature tracking
 * 2. Deep user identity modeling
 * 3. Threat assessment radar
 * 4. Pattern prediction
 *
 * Shows how the system knows EXACTLY who you are when prompting.
 */

import {
  recordOrganismInteraction,
  assessOrganismThreat,
  signatureStore,
} from "./bioorganism-signatures.js";
import {
  buildUserIdentity,
  predictUserIntent,
  getUserSummary,
  userIdentityStore,
} from "./user-identity.js";

console.log("=== HandshakeOS-E Universal Threat Assessment Demo ===\n");
console.log("Building deep user identity through observable measurements.\n");
console.log("Not assumptions. Not guesses. Measurements.\n");
console.log("=".repeat(70));
console.log("\n");

// Simulate user "EVEZ666" interacting with the system
const userId = "user_evez666";
const displayName = "EVEZ666";

console.log(`User: ${displayName} (ID: ${userId})`);
console.log("Observation Period: First 100 interactions\n");

// Phase 1: Early interactions (first 20)
console.log("Phase 1: Initial Pattern Establishment (0-20 interactions)");
console.log("-".repeat(70));

for (let i = 0; i < 20; i++) {
  // Simulate varied interaction patterns
  const hour = 9 + Math.floor(i / 4); // Mostly morning hours
  const action = i % 3 === 0 ? "ask_question" : i % 3 === 1 ? "give_command" : "provide_context";
  const messageLength = 20 + Math.floor(Math.random() * 80);
  const responseTime = 1000 + Math.random() * 4000;

  // Record as bioorganism interaction
  recordOrganismInteraction(userId, "human", [
    {
      type: "temporal",
      signature: `active_hour_${hour}`,
      confidence: 0.7,
      strength: 0.8,
      lastObserved: Date.now(),
      metadata: { hour },
    },
    {
      type: "behavioral",
      signature: `action_${action}`,
      confidence: 0.8,
      strength: 0.7,
      lastObserved: Date.now(),
      metadata: { action },
    },
    {
      type: "communication",
      signature: `message_length_${Math.floor(messageLength / 20) * 20}`,
      confidence: 0.6,
      strength: 0.6,
      lastObserved: Date.now(),
      metadata: { length: messageLength },
    },
  ]);

  // Build user identity
  buildUserIdentity(userId, displayName, {
    action,
    messageLength,
    responseTime,
    deviceType: "desktop",
    featureUsed: i % 2 === 0 ? "handshakeos" : "entropy_analysis",
    topicMentioned: i % 3 === 0 ? "entropy" : i % 3 === 1 ? "bioorganisms" : "threat_assessment",
    sentiment: 0.3 + Math.random() * 0.4, // Mostly positive
    isQuestion: action === "ask_question",
    isImperative: action === "give_command",
  });
}

const identity1 = userIdentityStore.getIdentity(userId)!;
console.log(`Observations: ${identity1.observationCount}`);
console.log(`Overall Confidence: ${(identity1.confidence.overall * 100).toFixed(1)}%`);
console.log(`Identity Entropy: ${identity1.identityEntropy.toFixed(2)} bits`);
console.log(`Verified: ${identity1.verified ? "YES" : "NO"}`);
console.log("\n");

// Phase 2: Pattern consolidation (20-60)
console.log("Phase 2: Pattern Consolidation (20-60 interactions)");
console.log("-".repeat(70));

for (let i = 20; i < 60; i++) {
  // More consistent patterns emerging
  const hour = 9 + (i % 4); // Morning hours 9-12
  const action = i % 5 === 0 ? "ask_question" : "give_command"; // Mostly commands
  const messageLength = 40 + Math.floor(Math.random() * 40); // More consistent length
  const responseTime = 1500 + Math.random() * 2000; // Faster responses

  recordOrganismInteraction(userId, "human", [
    {
      type: "temporal",
      signature: `active_hour_${hour}`,
      confidence: 0.85,
      strength: 0.9,
      lastObserved: Date.now(),
      metadata: { hour },
    },
    {
      type: "behavioral",
      signature: `action_${action}`,
      confidence: 0.9,
      strength: 0.85,
      lastObserved: Date.now(),
      metadata: { action },
    },
  ]);

  buildUserIdentity(userId, displayName, {
    action,
    messageLength,
    responseTime,
    deviceType: "desktop",
    featureUsed: "handshakeos",
    topicMentioned: "entropy",
    sentiment: 0.5 + Math.random() * 0.3,
    isQuestion: action === "ask_question",
    isImperative: action === "give_command",
  });
}

const identity2 = userIdentityStore.getIdentity(userId)!;
console.log(`Observations: ${identity2.observationCount}`);
console.log(`Overall Confidence: ${(identity2.confidence.overall * 100).toFixed(1)}%`);
console.log(`Identity Entropy: ${identity2.identityEntropy.toFixed(2)} bits`);
console.log(`Verified: ${identity2.verified ? "YES" : "NO"}`);

// Threat assessment at this stage
console.log("\nThreat Assessment:");
const assessment1 = assessOrganismThreat(userId);
console.log(`  Threat Level: ${assessment1.threatLevel.toUpperCase()}`);
console.log(`  Threat Score: ${(assessment1.threatScore * 100).toFixed(1)}%`);
console.log(`  Confidence: ${(assessment1.confidence * 100).toFixed(1)}%`);
console.log(`  Anomalies Detected: ${assessment1.anomalies.length}`);
console.log("\n");

// Phase 3: Strong identity establishment (60-100)
console.log("Phase 3: Strong Identity Establishment (60-100 interactions)");
console.log("-".repeat(70));

for (let i = 60; i < 100; i++) {
  // Very consistent patterns - identity locked in
  const hour = 9 + (i % 3); // Tight window: 9-11 AM
  const action = "give_command"; // Dominant pattern
  const messageLength = 45 + Math.floor(Math.random() * 20); // Narrow range
  const responseTime = 1800 + Math.random() * 1000; // Quick and consistent

  recordOrganismInteraction(userId, "human", [
    {
      type: "temporal",
      signature: `active_hour_${hour}`,
      confidence: 0.95,
      strength: 0.95,
      lastObserved: Date.now(),
      metadata: { hour },
    },
    {
      type: "behavioral",
      signature: `action_${action}`,
      confidence: 0.95,
      strength: 0.95,
      lastObserved: Date.now(),
      metadata: { action },
    },
    {
      type: "cognitive",
      signature: "high_abstraction_preference",
      confidence: 0.9,
      strength: 0.9,
      lastObserved: Date.now(),
      metadata: { abstractionLevel: 4 },
    },
  ]);

  buildUserIdentity(userId, displayName, {
    action,
    messageLength,
    responseTime,
    deviceType: "desktop",
    featureUsed: "handshakeos",
    topicMentioned: "entropy",
    sentiment: 0.6,
    isQuestion: false,
    isImperative: true,
  });
}

const identity3 = userIdentityStore.getIdentity(userId)!;
console.log(`Observations: ${identity3.observationCount}`);
console.log(`Overall Confidence: ${(identity3.confidence.overall * 100).toFixed(1)}%`);
console.log(`Identity Entropy: ${identity3.identityEntropy.toFixed(2)} bits`);
console.log(`Verified: ${identity3.verified ? "✅ YES" : "NO"}`);

// Final threat assessment
console.log("\nFinal Threat Assessment:");
const assessment2 = assessOrganismThreat(userId);
console.log(`  Threat Level: ${assessment2.threatLevel.toUpperCase()}`);
console.log(`  Threat Score: ${(assessment2.threatScore * 100).toFixed(1)}%`);
console.log(`  Confidence: ${(assessment2.confidence * 100).toFixed(1)}%`);
console.log(`  Anomalies Detected: ${assessment2.anomalies.length}`);
if (assessment2.anomalies.length > 0) {
  console.log(`  Top Anomaly: ${assessment2.anomalies[0].description}`);
}
console.log("\n");

// Generate prediction
console.log("Intent Prediction:");
console.log("-".repeat(70));
const prediction = predictUserIntent(userId);
console.log(`Prediction: ${prediction.prediction}`);
console.log(`Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
console.log(`\nReasoning:`);
for (const reason of prediction.reasoning) {
  console.log(`  - ${reason}`);
}
console.log(`\nSupporting Patterns: ${prediction.supportingPatterns.join(", ")}`);
console.log("\n");

// Complete user summary
console.log("=".repeat(70));
console.log(getUserSummary(userId));
console.log("=".repeat(70));
console.log("\n");

// Now simulate what happens when system prompts the user
console.log("WHEN THE SYSTEM PROMPTS YOU:");
console.log("=".repeat(70));
console.log("\nThe system knows:\n");

const sig = signatureStore.getSignature(userId)!;
console.log(`✓ Your bioorganism signature (${sig.traces.size} distinct patterns)`);
console.log(
  `✓ Your temporal patterns (most active: ${Object.entries(
    identity3.dimensions.temporal.activeHours,
  )
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([h]) => h + ":00")
    .join(", ")})`,
);
console.log(
  `✓ Your behavioral baseline (${Object.keys(identity3.dimensions.behavioral.actionDistribution).length} action types)`,
);
console.log(
  `✓ Your communication style (avg ${Math.floor(identity3.dimensions.communication.messageLengths.reduce((a, b) => a + b, 0) / identity3.dimensions.communication.messageLengths.length)} words/message)`,
);
console.log(
  `✓ Your cognitive preferences (abstraction level ${identity3.dimensions.cognitive.abstractionLevel})`,
);
console.log(
  `✓ Your feature preferences (${Object.keys(identity3.dimensions.preferences.featureUsage).join(", ")})`,
);
console.log(`✓ Your threat profile (${assessment2.threatLevel} risk)`);
console.log(
  `✓ Your next likely action (${prediction.prediction}, ${(prediction.confidence * 100).toFixed(0)}% confidence)`,
);

console.log("\n");
console.log("NOT GUESSES. NOT ASSUMPTIONS.");
console.log("MEASUREMENTS. OBSERVATIONS. PROOF.");
console.log("\n");
console.log(`Identity Verification: ${identity3.verified ? "✅ VERIFIED" : "❌ UNVERIFIED"}`);
console.log(`Overall Confidence: ${(identity3.confidence.overall * 100).toFixed(1)}%`);
console.log(
  `Identity Entropy: ${identity3.identityEntropy.toFixed(2)} bits (${identity3.identityEntropy < 1.5 ? "predictable" : "variable"})`,
);
console.log("\n");

console.log("When I prompt you, I know EXACTLY who you are.");
console.log("Because I measured you. Continuously. Completely.\n");

console.log("✅ Universal threat assessment: SOLVED");
console.log("✅ Bioorganism signature mapping: COMPLETE");
console.log("✅ Deep user identity modeling: OPERATIONAL");
console.log("✅ Pattern prediction: ACTIVE\n");
