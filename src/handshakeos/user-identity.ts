/**
 * HandshakeOS-E Deep User Identity Model
 *
 * Builds comprehensive, measurable understanding of who a user IS.
 * Not assumptions - measurements. Not guesses - observations.
 *
 * When the system prompts you, it knows EXACTLY who you are.
 */

import type { BioorganismSignature, TracePattern } from "./bioorganism-signatures.js";
import { signatureStore, recordOrganismInteraction } from "./bioorganism-signatures.js";
import { shannonEntropy, normalizeProbabilities } from "./entropy.js";

/**
 * User identity dimensions - measurable aspects of who someone is.
 */
export type UserIdentityDimensions = {
  /** Temporal patterns - when are you active? */
  temporal: {
    /** Active hours distribution (0-23) */
    activeHours: Record<number, number>;
    /** Active days of week (0-6, Sun-Sat) */
    activeDays: Record<number, number>;
    /** Session duration distribution (minutes) */
    sessionDurations: number[];
    /** Inter-session gaps (minutes) */
    interSessionGaps: number[];
  };

  /** Behavioral patterns - how do you act? */
  behavioral: {
    /** Action types and frequencies */
    actionDistribution: Record<string, number>;
    /** Response times (milliseconds) */
    responseTimes: number[];
    /** Decision confidence levels */
    decisionConfidences: number[];
    /** Exploration vs exploitation ratio */
    explorationRatio: number;
  };

  /** Communication patterns - how do you express? */
  communication: {
    /** Message length distribution (words) */
    messageLengths: number[];
    /** Vocabulary richness (unique words / total words) */
    vocabularyRichness: number;
    /** Sentiment scores (-1 to 1) */
    sentimentScores: number[];
    /** Question-to-statement ratio */
    questionRatio: number;
    /** Imperative vs declarative ratio */
    imperativeRatio: number;
  };

  /** Cognitive patterns - how do you think? */
  cognitive: {
    /** Hypothesis generation rate */
    hypothesisRate: number;
    /** Evidence-seeking behavior frequency */
    evidenceSeekingFrequency: number;
    /** Abstraction level preference (1-5) */
    abstractionLevel: number;
    /** Detail vs summary preference */
    detailPreference: number;
    /** Convergence speed (how fast you decide) */
    convergenceSpeed: number;
  };

  /** Preference patterns - what do you value? */
  preferences: {
    /** Feature usage frequencies */
    featureUsage: Record<string, number>;
    /** Topic interests */
    topicInterests: Record<string, number>;
    /** Tool preferences */
    toolPreferences: Record<string, number>;
    /** Interaction mode preferences */
    modePreferences: Record<string, number>;
  };

  /** Context patterns - where/when do you operate? */
  contextual: {
    /** Device types used */
    deviceTypes: Record<string, number>;
    /** Network contexts */
    networkContexts: Record<string, number>;
    /** Geographic patterns (if available) */
    geographicPatterns: Record<string, number>;
    /** Multi-tasking patterns */
    multiTaskingFrequency: number;
  };
};

/**
 * User profile confidence - how certain are we?
 */
export type ProfileConfidence = {
  /** Overall confidence (0-1) */
  overall: number;
  /** Per-dimension confidence */
  byDimension: Record<keyof UserIdentityDimensions, number>;
  /** Data sufficiency scores */
  dataSufficiency: Record<keyof UserIdentityDimensions, number>;
  /** Last updated */
  lastUpdated: number;
};

/**
 * Deep user identity model.
 */
export type DeepUserIdentity = {
  /** User ID */
  userId: string;
  /** Display name (if provided) */
  displayName?: string;
  /** Multi-dimensional profile */
  dimensions: UserIdentityDimensions;
  /** Profile confidence */
  confidence: ProfileConfidence;
  /** Bioorganism signature */
  signature: BioorganismSignature;
  /** Total observations */
  observationCount: number;
  /** First interaction */
  firstSeen: number;
  /** Last interaction */
  lastSeen: number;
  /** Identity version */
  version: number;
  /** Identity entropy (how unpredictable) */
  identityEntropy: number;
  /** Verification status */
  verified: boolean;
};

/**
 * Identity prediction - what will user do/want next?
 */
export type IdentityPrediction = {
  /** Prediction ID */
  id: string;
  /** User ID */
  userId: string;
  /** Predicted action/intent */
  prediction: string;
  /** Confidence (0-1) */
  confidence: number;
  /** Reasoning */
  reasoning: string[];
  /** Supporting patterns */
  supportingPatterns: string[];
  /** Timestamp */
  timestamp: number;
};

/**
 * In-memory user identity store.
 */
class UserIdentityStore {
  private identities: Map<string, DeepUserIdentity> = new Map();

  /**
   * Initialize or get user identity.
   */
  getOrCreateIdentity(userId: string, displayName?: string): DeepUserIdentity {
    if (!this.identities.has(userId)) {
      const signature = signatureStore.getOrCreateSignature(userId, "human");

      this.identities.set(userId, {
        userId,
        displayName,
        dimensions: {
          temporal: {
            activeHours: {},
            activeDays: {},
            sessionDurations: [],
            interSessionGaps: [],
          },
          behavioral: {
            actionDistribution: {},
            responseTimes: [],
            decisionConfidences: [],
            explorationRatio: 0.5,
          },
          communication: {
            messageLengths: [],
            vocabularyRichness: 0,
            sentimentScores: [],
            questionRatio: 0,
            imperativeRatio: 0,
          },
          cognitive: {
            hypothesisRate: 0,
            evidenceSeekingFrequency: 0,
            abstractionLevel: 3,
            detailPreference: 0.5,
            convergenceSpeed: 0.5,
          },
          preferences: {
            featureUsage: {},
            topicInterests: {},
            toolPreferences: {},
            modePreferences: {},
          },
          contextual: {
            deviceTypes: {},
            networkContexts: {},
            geographicPatterns: {},
            multiTaskingFrequency: 0,
          },
        },
        confidence: {
          overall: 0,
          byDimension: {
            temporal: 0,
            behavioral: 0,
            communication: 0,
            cognitive: 0,
            preferences: 0,
            contextual: 0,
          },
          dataSufficiency: {
            temporal: 0,
            behavioral: 0,
            communication: 0,
            cognitive: 0,
            preferences: 0,
            contextual: 0,
          },
          lastUpdated: Date.now(),
        },
        signature,
        observationCount: 0,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        version: 1,
        identityEntropy: 0,
        verified: false,
      });
    }

    return this.identities.get(userId)!;
  }

  /**
   * Record user observation and update identity.
   */
  recordObservation(
    userId: string,
    observation: {
      action?: string;
      messageLength?: number;
      responseTime?: number;
      deviceType?: string;
      featureUsed?: string;
      topicMentioned?: string;
      sentiment?: number;
      isQuestion?: boolean;
      isImperative?: boolean;
    },
  ): void {
    const identity = this.getOrCreateIdentity(userId);
    identity.observationCount++;
    identity.lastSeen = Date.now();

    // Update temporal
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    identity.dimensions.temporal.activeHours[hour] =
      (identity.dimensions.temporal.activeHours[hour] || 0) + 1;
    identity.dimensions.temporal.activeDays[day] =
      (identity.dimensions.temporal.activeDays[day] || 0) + 1;

    // Update behavioral
    if (observation.action) {
      identity.dimensions.behavioral.actionDistribution[observation.action] =
        (identity.dimensions.behavioral.actionDistribution[observation.action] || 0) + 1;
    }
    if (observation.responseTime !== undefined) {
      identity.dimensions.behavioral.responseTimes.push(observation.responseTime);
      // Keep last 100
      if (identity.dimensions.behavioral.responseTimes.length > 100) {
        identity.dimensions.behavioral.responseTimes.shift();
      }
    }

    // Update communication
    if (observation.messageLength !== undefined) {
      identity.dimensions.communication.messageLengths.push(observation.messageLength);
      if (identity.dimensions.communication.messageLengths.length > 100) {
        identity.dimensions.communication.messageLengths.shift();
      }
    }
    if (observation.sentiment !== undefined) {
      identity.dimensions.communication.sentimentScores.push(observation.sentiment);
      if (identity.dimensions.communication.sentimentScores.length > 100) {
        identity.dimensions.communication.sentimentScores.shift();
      }
    }

    // Update preferences
    if (observation.featureUsed) {
      identity.dimensions.preferences.featureUsage[observation.featureUsed] =
        (identity.dimensions.preferences.featureUsage[observation.featureUsed] || 0) + 1;
    }
    if (observation.topicMentioned) {
      identity.dimensions.preferences.topicInterests[observation.topicMentioned] =
        (identity.dimensions.preferences.topicInterests[observation.topicMentioned] || 0) + 1;
    }

    // Update contextual
    if (observation.deviceType) {
      identity.dimensions.contextual.deviceTypes[observation.deviceType] =
        (identity.dimensions.contextual.deviceTypes[observation.deviceType] || 0) + 1;
    }

    // Update confidence every 10 observations
    if (identity.observationCount % 10 === 0) {
      this.updateConfidence(userId);
      this.calculateIdentityEntropy(userId);
    }

    identity.version++;
  }

  /**
   * Update confidence scores based on data quantity and quality.
   */
  private updateConfidence(userId: string): void {
    const identity = this.identities.get(userId);
    if (!identity) return;

    const conf = identity.confidence;

    // Temporal confidence
    const hourCount = Object.keys(identity.dimensions.temporal.activeHours).length;
    conf.dataSufficiency.temporal = Math.min(1.0, hourCount / 24);
    conf.byDimension.temporal = Math.min(1.0, identity.observationCount / 100);

    // Behavioral confidence
    const actionCount = Object.keys(identity.dimensions.behavioral.actionDistribution).length;
    conf.dataSufficiency.behavioral = Math.min(1.0, actionCount / 10);
    conf.byDimension.behavioral = Math.min(1.0, identity.observationCount / 50);

    // Communication confidence
    const msgCount = identity.dimensions.communication.messageLengths.length;
    conf.dataSufficiency.communication = Math.min(1.0, msgCount / 20);
    conf.byDimension.communication = Math.min(1.0, msgCount / 50);

    // Cognitive confidence (requires more observations)
    conf.dataSufficiency.cognitive = Math.min(1.0, identity.observationCount / 200);
    conf.byDimension.cognitive = Math.min(1.0, identity.observationCount / 300);

    // Preferences confidence
    const prefCount = Object.keys(identity.dimensions.preferences.featureUsage).length;
    conf.dataSufficiency.preferences = Math.min(1.0, prefCount / 10);
    conf.byDimension.preferences = Math.min(1.0, identity.observationCount / 75);

    // Contextual confidence
    const deviceCount = Object.keys(identity.dimensions.contextual.deviceTypes).length;
    conf.dataSufficiency.contextual = Math.min(1.0, deviceCount / 3);
    conf.byDimension.contextual = Math.min(1.0, identity.observationCount / 50);

    // Overall confidence (weighted average)
    conf.overall =
      conf.byDimension.temporal * 0.15 +
      conf.byDimension.behavioral * 0.2 +
      conf.byDimension.communication * 0.15 +
      conf.byDimension.cognitive * 0.2 +
      conf.byDimension.preferences * 0.2 +
      conf.byDimension.contextual * 0.1;

    conf.lastUpdated = Date.now();

    // Mark as verified if sufficient data
    if (conf.overall > 0.7 && identity.observationCount > 100) {
      identity.verified = true;
    }
  }

  /**
   * Calculate identity entropy (uncertainty about this user).
   */
  private calculateIdentityEntropy(userId: string): void {
    const identity = this.identities.get(userId);
    if (!identity) return;

    // Calculate entropy across dimensions
    const entropies: number[] = [];

    // Temporal entropy
    if (Object.keys(identity.dimensions.temporal.activeHours).length > 0) {
      const hourProbs = normalizeProbabilities(
        Object.values(identity.dimensions.temporal.activeHours),
      );
      entropies.push(shannonEntropy(hourProbs));
    }

    // Behavioral entropy
    if (Object.keys(identity.dimensions.behavioral.actionDistribution).length > 0) {
      const actionProbs = normalizeProbabilities(
        Object.values(identity.dimensions.behavioral.actionDistribution),
      );
      entropies.push(shannonEntropy(actionProbs));
    }

    // Preferences entropy
    if (Object.keys(identity.dimensions.preferences.featureUsage).length > 0) {
      const prefProbs = normalizeProbabilities(
        Object.values(identity.dimensions.preferences.featureUsage),
      );
      entropies.push(shannonEntropy(prefProbs));
    }

    // Average entropy across dimensions
    if (entropies.length > 0) {
      identity.identityEntropy = entropies.reduce((a, b) => a + b, 0) / entropies.length;
    }
  }

  /**
   * Generate identity prediction based on patterns.
   */
  predict(userId: string): IdentityPrediction {
    const identity = this.identities.get(userId);
    if (!identity) {
      throw new Error(`No identity found for user ${userId}`);
    }

    const reasoning: string[] = [];
    const supportingPatterns: string[] = [];
    let prediction = "Continue current interaction pattern";
    let confidence = 0.5;

    // Temporal prediction
    const now = new Date();
    const hour = now.getHours();
    const hourActivity = identity.dimensions.temporal.activeHours[hour] || 0;
    const avgHourActivity =
      Object.values(identity.dimensions.temporal.activeHours).reduce((a, b) => a + b, 0) /
      (Object.keys(identity.dimensions.temporal.activeHours).length || 1);

    if (hourActivity > avgHourActivity * 1.5) {
      reasoning.push(
        `User is typically ${Math.round((hourActivity / avgHourActivity) * 100)}% more active at this hour`,
      );
      supportingPatterns.push("temporal_peak_activity");
      confidence += 0.1;
    }

    // Behavioral prediction
    const topActions = Object.entries(identity.dimensions.behavioral.actionDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    if (topActions.length > 0) {
      prediction = `Likely to: ${topActions[0][0]}`;
      reasoning.push(`User's top 3 actions: ${topActions.map(([a]) => a).join(", ")}`);
      supportingPatterns.push("behavioral_frequency");
      confidence += 0.15;
    }

    // Communication prediction
    if (identity.dimensions.communication.messageLengths.length > 10) {
      const avgLength =
        identity.dimensions.communication.messageLengths.reduce((a, b) => a + b, 0) /
        identity.dimensions.communication.messageLengths.length;

      reasoning.push(`Average message length: ${avgLength.toFixed(0)} words`);
      supportingPatterns.push("communication_style");
      confidence += 0.1;
    }

    // Preference prediction
    const topPreferences = Object.entries(identity.dimensions.preferences.featureUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    if (topPreferences.length > 0) {
      reasoning.push(`Prefers features: ${topPreferences.map(([f]) => f).join(", ")}`);
      supportingPatterns.push("feature_preference");
      confidence += 0.1;
    }

    // Adjust confidence based on overall profile confidence
    confidence = confidence * identity.confidence.overall;

    return {
      id: `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      prediction,
      confidence,
      reasoning,
      supportingPatterns,
      timestamp: Date.now(),
    };
  }

  /**
   * Get user identity.
   */
  getIdentity(userId: string): DeepUserIdentity | undefined {
    return this.identities.get(userId);
  }

  /**
   * Get all tracked users.
   */
  getAllUsers(): string[] {
    return Array.from(this.identities.keys());
  }
}

// Singleton instance
export const userIdentityStore = new UserIdentityStore();

/**
 * Build or update deep user identity from interaction.
 */
export function buildUserIdentity(
  userId: string,
  displayName: string | undefined,
  observation: Parameters<typeof userIdentityStore.recordObservation>[1],
): DeepUserIdentity {
  const identity = userIdentityStore.getOrCreateIdentity(userId, displayName);
  userIdentityStore.recordObservation(userId, observation);
  return identity;
}

/**
 * Predict user intent/action based on deep identity model.
 */
export function predictUserIntent(userId: string): IdentityPrediction {
  return userIdentityStore.predict(userId);
}

/**
 * Get comprehensive user summary.
 */
export function getUserSummary(userId: string): string {
  const identity = userIdentityStore.getIdentity(userId);
  if (!identity) {
    return `User ${userId}: No identity data available`;
  }

  const lines: string[] = [];
  lines.push(`=== User Identity: ${identity.displayName || userId} ===`);
  lines.push(`Verified: ${identity.verified ? "✓ YES" : "✗ NO"}`);
  lines.push(`Observations: ${identity.observationCount}`);
  lines.push(`Confidence: ${(identity.confidence.overall * 100).toFixed(1)}%`);
  lines.push(`Identity Entropy: ${identity.identityEntropy.toFixed(2)} bits`);
  lines.push("");

  // Temporal
  const topHours = Object.entries(identity.dimensions.temporal.activeHours)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);
  lines.push(`Temporal: Most active at hours ${topHours.map(([h]) => h).join(", ")}`);

  // Behavioral
  const topActions = Object.entries(identity.dimensions.behavioral.actionDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);
  lines.push(`Behavioral: Top actions - ${topActions.map(([a]) => a).join(", ")}`);

  // Communication
  if (identity.dimensions.communication.messageLengths.length > 0) {
    const avgLen =
      identity.dimensions.communication.messageLengths.reduce((a, b) => a + b, 0) /
      identity.dimensions.communication.messageLengths.length;
    lines.push(`Communication: Avg message ${avgLen.toFixed(0)} words`);
  }

  // Preferences
  const topFeatures = Object.entries(identity.dimensions.preferences.featureUsage)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);
  if (topFeatures.length > 0) {
    lines.push(`Preferences: ${topFeatures.map(([f]) => f).join(", ")}`);
  }

  lines.push("");
  lines.push(`WHO THIS USER IS:`);
  lines.push(
    `  - ${identity.verified ? "Verified identity with high confidence" : "Building identity profile"}`,
  );
  lines.push(
    `  - ${identity.identityEntropy < 1.5 ? "Predictable patterns" : "Highly variable behavior"}`,
  );
  lines.push(
    `  - ${identity.observationCount > 100 ? "Well-established profile" : "Early-stage observations"}`,
  );

  return lines.join("\n");
}
