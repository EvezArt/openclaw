/**
 * HandshakeOS-E Utilities
 *
 * Helper functions for creating IDs, domain signatures, and actors.
 */

import { randomUUID } from "node:crypto";
import type { ActorIdentity, DomainSignature } from "./types.js";

/**
 * Generate a unique ID.
 */
export function generateId(): string {
  return randomUUID();
}

/**
 * Create an empty domain signature.
 */
export function createEmptyDomainSignature(): DomainSignature {
  return {
    version: "1.0.0",
    mixtures: undefined,
    updatedAt: Date.now(),
    metadata: undefined,
  };
}

/**
 * Create a domain signature with mixtures.
 */
export function createDomainSignature(mixtures: Record<string, number>): DomainSignature {
  return {
    version: "1.0.0",
    mixtures,
    updatedAt: Date.now(),
  };
}

/**
 * Create an actor identity.
 */
export function createActor(
  type: ActorIdentity["type"],
  id: string,
  permissions: string[],
  name?: string,
): ActorIdentity {
  return {
    id,
    type,
    permissions,
    name,
  };
}

/**
 * Create a system actor (for system-level events).
 */
export function createSystemActor(): ActorIdentity {
  return createActor("system", "system", ["*"], "System");
}

/**
 * Create a user actor.
 */
export function createUserActor(userId: string, name?: string): ActorIdentity {
  return createActor("user", userId, ["read", "write", "execute"], name);
}

/**
 * Create an agent actor.
 */
export function createAgentActor(agentId: string, name?: string): ActorIdentity {
  return createActor("agent", agentId, ["read", "write"], name);
}

/**
 * Create a device actor.
 */
export function createDeviceActor(deviceId: string, name?: string): ActorIdentity {
  return createActor("device", deviceId, ["read", "write"], name);
}

/**
 * Validate confidence value (0-1).
 */
export function validateConfidence(confidence: number): void {
  if (confidence < 0 || confidence > 1) {
    throw new Error(`Confidence must be between 0 and 1, got ${confidence}`);
  }
}

/**
 * Validate probability value (0-1).
 */
export function validateProbability(probability: number): void {
  if (probability < 0 || probability > 1) {
    throw new Error(`Probability must be between 0 and 1, got ${probability}`);
  }
}
