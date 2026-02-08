/**
 * HandshakeOS-E Nervous System
 *
 * Main entry point for the HandshakeOS-E nervous system implementation.
 *
 * This system provides:
 * - Universal event records (reversibly logged and audit-traceable)
 * - IntentTokens (capturing goals, constraints, and outcomes)
 * - Parallel hypotheses (me/we/they/system models)
 * - First-class test objects
 * - Knowledge tracking with explicit sources
 *
 * All interventions are attributable, auditable, and reversible.
 * No single-domain requirements - all domain signatures are emergent mixture vectors.
 */

// Core types
export * from "./types.js";

// Storage systems
export { eventStore, EventStore } from "./event-store.js";
export type { EventQuery } from "./event-store.js";

export { intentStore, IntentStore } from "./intent-store.js";
export type { IntentQuery } from "./intent-store.js";

export { hypothesisStore, HypothesisStore } from "./hypothesis-store.js";
export type { HypothesisQuery } from "./hypothesis-store.js";

export { testStore, TestStore } from "./test-store.js";
export type { TestQuery } from "./test-store.js";

// Utilities
export * from "./utils.js";
