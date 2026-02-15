/**
 * HandshakeOS-E Nervous System - Core Types
 *
 * Universal event record system representing internal state shifts,
 * device/OS routing, network/session negotiations, social/incentive dynamics,
 * and model-to-user interaction—without requiring any primary "domain."
 *
 * All event records are reversibly logged and audit-traceable.
 * All interventions are attributable, auditable, and reversible.
 */

/**
 * Domain signature as an emergent mixture vector.
 * Can be empty, unknown, or refined later with versioning.
 */
export type DomainSignature = {
  /** Version of this domain signature schema */
  version: string;
  /** Optional domain mixtures (weights) - emergent per event */
  mixtures?: Record<string, number>;
  /** Timestamp when signature was created/updated */
  updatedAt: number;
  /** Optional metadata for extensibility */
  metadata?: Record<string, unknown>;
};

/**
 * Actor identity for attribution and permission bounding.
 * No "ghost" agents or hidden operations allowed.
 */
export type ActorIdentity = {
  /** Unique identifier for the actor */
  id: string;
  /** Actor type (user, agent, system, device) */
  type: "user" | "agent" | "system" | "device";
  /** Bounded permissions for this actor */
  permissions: string[];
  /** Optional display name */
  name?: string;
  /** Metadata for additional context */
  metadata?: Record<string, unknown>;
};

/**
 * Universal event record capturing all state shifts.
 * Reversibly logged and audit-traceable.
 */
export type EventRecord = {
  /** Unique event identifier */
  id: string;
  /** Timestamp in milliseconds */
  timestamp: number;
  /** Actor who triggered this event */
  actor: ActorIdentity;
  /** Event type/category */
  type: string;
  /** Event payload - flexible structure */
  payload: Record<string, unknown>;
  /** Domain signature - emergent mixture vector */
  domainSignature: DomainSignature;
  /** Optional parent event ID for causality tracking */
  parentEventId?: string;
  /** Audit trail: how to reverse this event */
  reversalProcedure?: string;
  /** Session identifier if applicable */
  sessionId?: string;
  /** Tags for categorization and retrieval */
  tags?: string[];
};

/**
 * IntentToken captures pre-action goals and post-event outcomes.
 *
 * Pre-action: goal, constraints, success metric, confidence
 * Post-event: trigger, state, default policy, payoff
 */
export type IntentToken = {
  /** Unique intent identifier */
  id: string;
  /** Timestamp when intent was created */
  timestamp: number;
  /** Actor who created this intent */
  actor: ActorIdentity;

  // Pre-action fields
  /** Goal description */
  goal: string;
  /** Constraints that must be satisfied */
  constraints: string[];
  /** Success metric (how to measure achievement) */
  successMetric: string;
  /** Confidence level (0-1) before action */
  confidence: number;

  // Post-event fields (optional, filled after execution)
  /** What triggered the intent execution */
  trigger?: string;
  /** Current state after execution */
  state?: "pending" | "executing" | "completed" | "failed" | "cancelled";
  /** Default policy if execution failed */
  defaultPolicy?: string;
  /** Actual payoff/outcome measurement */
  payoff?: number;

  /** Associated event IDs */
  eventIds: string[];
  /** Direct measurability indicator */
  measurable: boolean;
  /** Domain signature */
  domainSignature: DomainSignature;
};

/**
 * Hypothesis model types: me, we, they, system.
 * Each runs in parallel with probability and falsifiers.
 */
export type HypothesisModelType = "me" | "we" | "they" | "system";

/**
 * Falsifier - condition that would disprove the hypothesis.
 */
export type Falsifier = {
  /** Falsifier description */
  description: string;
  /** Test condition (function name or expression) */
  testCondition: string;
  /** Whether this falsifier has been triggered */
  triggered: boolean;
  /** When triggered (if applicable) */
  triggeredAt?: number;
};

/**
 * Parallel hypothesis tracking.
 * Each hypothesis has probability, falsifiers, and domain signature.
 */
export type Hypothesis = {
  /** Unique hypothesis identifier */
  id: string;
  /** Model type */
  modelType: HypothesisModelType;
  /** Hypothesis description */
  description: string;
  /** Probability (0-1) */
  probability: number;
  /** Falsifiers that would disprove this hypothesis */
  falsifiers: Falsifier[];
  /** Domain signature mixture (can be empty/unknown) */
  domainSignature: DomainSignature;
  /** Version for tracking hypothesis evolution */
  version: number;
  /** Timestamp when hypothesis was created */
  createdAt: number;
  /** Timestamp when hypothesis was last updated */
  updatedAt: number;
  /** Associated event IDs supporting this hypothesis */
  evidenceEventIds: string[];
  /** Actor who created this hypothesis */
  actor: ActorIdentity;
};

/**
 * Test object linked to hypotheses.
 * First-class test objects for validation.
 */
export type TestObject = {
  /** Unique test identifier */
  id: string;
  /** Test name */
  name: string;
  /** Test description */
  description: string;
  /** Linked hypothesis IDs */
  hypothesisIds: string[];
  /** Test type (unit, integration, hypothesis-validation, etc.) */
  testType: string;
  /** Test procedure (function name or script) */
  procedure: string;
  /** Expected outcome */
  expectedOutcome: string;
  /** Actual outcome (after execution) */
  actualOutcome?: string;
  /** Test status */
  status: "pending" | "running" | "passed" | "failed" | "skipped";
  /** Timestamp when test was created */
  createdAt: number;
  /** Timestamp when test was last run */
  lastRunAt?: number;
  /** Actor who created this test */
  actor: ActorIdentity;
  /** Domain signature */
  domainSignature: DomainSignature;
};

/**
 * Knowability source - where knowledge comes from.
 * Must be from user input, device logs, or explicit user-driven tests.
 */
export type KnowabilitySource = "user-input" | "device-log" | "user-test" | "explicit-measurement";

/**
 * Knowledge record tracking the source of information.
 */
export type KnowledgeRecord = {
  /** Unique knowledge identifier */
  id: string;
  /** Timestamp */
  timestamp: number;
  /** Source of this knowledge */
  source: KnowabilitySource;
  /** Knowledge content */
  content: string;
  /** Associated event ID */
  eventId: string;
  /** Actor who provided/generated this knowledge */
  actor: ActorIdentity;
  /** Confidence in this knowledge (0-1) */
  confidence: number;
  /** Domain signature */
  domainSignature: DomainSignature;
};
