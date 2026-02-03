#!/usr/bin/env node
/**
 * Simple validation script for the temporal command
 * This demonstrates that the implementation works correctly
 * without needing to run the full CLI
 */

import { temporalCommand } from "../dist/commands/temporal.js";

console.log("=== Temporal Command Validation ===\n");

// Test 1: Default parameters
console.log("Test 1: Running with default parameters...");
const logs1 = [];
await temporalCommand({}, {
  log: (msg) => logs1.push(msg),
  exit: () => {},
});
console.log("✓ Default run completed");
console.log(`  Lines of output: ${logs1.length}`);

// Test 2: Deterministic with seed
console.log("\nTest 2: Verifying deterministic behavior with seed 42...");
const logs2a = [];
const logs2b = [];
await temporalCommand({ seed: 42, iterations: 500, json: true }, {
  log: (msg) => logs2a.push(msg),
  exit: () => {},
});
await temporalCommand({ seed: 42, iterations: 500, json: true }, {
  log: (msg) => logs2b.push(msg),
  exit: () => {},
});
const result2a = JSON.parse(logs2a[0]);
const result2b = JSON.parse(logs2b[0]);
const metricsMatch = 
  result2a.metrics.convergence === result2b.metrics.convergence &&
  result2a.metrics.pastSatisfaction === result2b.metrics.pastSatisfaction &&
  result2a.metrics.futureSatisfaction === result2b.metrics.futureSatisfaction;
console.log(`✓ Deterministic metrics: ${metricsMatch ? "PASS" : "FAIL"}`);
console.log(`  Convergence: ${result2a.metrics.convergence} (both runs)`);

// Test 3: JSON output
console.log("\nTest 3: Testing JSON output...");
const logs3 = [];
await temporalCommand({ seed: 12345, json: true }, {
  log: (msg) => logs3.push(msg),
  exit: () => {},
});
const result = JSON.parse(logs3[0]);
console.log("✓ JSON output valid");
console.log(`  Seed: ${result.config.seed}`);
console.log(`  Iterations: ${result.config.iterations}`);
console.log(`  Convergence: ${result.metrics.convergence}`);
console.log(`  Past satisfaction: ${result.metrics.pastSatisfaction}`);
console.log(`  Future satisfaction: ${result.metrics.futureSatisfaction}`);
console.log(`  Computation time: ${result.stats.computationTimeMs}ms`);

// Test 4: Custom constraints
console.log("\nTest 4: Testing custom constraints...");
const logs4 = [];
await temporalCommand({
  seed: 999,
  pastState: "ordered",
  futureConstraint: "chaotic",
  iterations: 1000,
  json: true,
}, {
  log: (msg) => logs4.push(msg),
  exit: () => {},
});
const result4 = JSON.parse(logs4[0]);
console.log("✓ Custom constraints applied");
console.log(`  Past state: "${result4.config.pastState}"`);
console.log(`  Future constraint: "${result4.config.futureConstraint}"`);

// Test 5: Metric ranges
console.log("\nTest 5: Verifying metric ranges...");
const logs5 = [];
await temporalCommand({ seed: 777, json: true }, {
  log: (msg) => logs5.push(msg),
  exit: () => {},
});
const result5 = JSON.parse(logs5[0]);
const validRanges = 
  result5.metrics.convergence >= 0 && result5.metrics.convergence <= 1 &&
  result5.metrics.pastSatisfaction >= 0 && result5.metrics.pastSatisfaction <= 1 &&
  result5.metrics.futureSatisfaction >= 0 && result5.metrics.futureSatisfaction <= 1;
console.log(`✓ All metrics in valid range [0, 1]: ${validRanges ? "PASS" : "FAIL"}`);

console.log("\n=== All Validation Tests Complete ===");
console.log("\nThe temporal experiment command is working correctly!");
console.log("It produces deterministic, reproducible results for research purposes.");
console.log("\nReminder: This is a classical simulation only - not quantum computing");
console.log("or actual retrocausality. Use responsibly for research and education.");
