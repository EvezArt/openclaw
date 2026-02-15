/**
 * HandshakeOS-E Bioorganism Signature Tracking
 *
 * Maps measurable patterns from biological organisms (including humans)
 * as operational telemetry. Not mystical - observational.
 *
 * Core principle: You can't compute on a dead substrate.
 * The biosphere is infrastructure. Organisms are sensors and constraints.
 */

import type { ActorIdentity, EventRecord } from "./types.js";
import { eventStore } from "./event-store.js";
import { shannonEntropy, normalizeProbabilities } from "./entropy.js";

/**
 * Observable trace pattern - measurable signal from organism behavior.
 */
export type TracePattern = {
  /** Pattern ID */
  id: string;
  /** Pattern type */
  type:
    | "temporal" // Time-based patterns
    | "behavioral" // Action sequences
    | "communication" // Language/interaction style
    | "physiological" // Measurable physical states
    | "cognitive" // Decision-making patterns
    | "environmental"; // Context/location patterns
  /** Pattern signature (fingerprint) */
  signature: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Observation count */
  observationCount: number;
  /** First observed */
  firstObserved: number;
  /** Last observed */
  lastObserved: number;
  /** Pattern strength (how consistent) */
  strength: number;
  /** Metadata */
  metadata: Record<string, unknown>;
};

/**
 * Bioorganism signature - unique measurable identity.
 */
export type BioorganismSignature = {
  /** Organism ID (maps to ActorIdentity) */
  organismId: string;
  /** Organism type */
  organismType: "human" | "animal" | "plant" | "microorganism" | "synthetic";
  /** Collection of trace patterns */
  traces: Map<string, TracePattern>;
  /** Behavioral baseline (normal state) */
  baseline: {
    /** Typical activity distribution */
    activityDistribution: Record<string, number>;
    /** Typical temporal patterns */
    temporalPatterns: Record<string, number>;
    /** Communication style metrics */
    communicationMetrics: Record<string, number>;
  };
  /** Signature entropy (uncertainty about this organism) */
  signatureEntropy: number;
  /** Number of interactions observed */
  interactionCount: number;
  /** First interaction timestamp */
  firstInteraction: number;
  /** Last interaction timestamp */
  lastInteraction: number;
  /** Signature version (increments on significant changes) */
  version: number;
};

/**
 * Threat level classification.
 */
export type ThreatLevel = "none" | "low" | "medium" | "high" | "critical";

/**
 * Anomaly detected in pattern.
 */
export type PatternAnomaly = {
  /** Anomaly ID */
  id: string;
  /** Pattern that showed anomaly */
  patternId: string;
  /** Type of anomaly */
  type:
    | "deviation" // Deviated from baseline
    | "absence" // Expected pattern missing
    | "emergence" // New unexpected pattern
    | "frequency" // Pattern frequency changed
    | "intensity"; // Pattern intensity changed
  /** Severity (0-1) */
  severity: number;
  /** Deviation magnitude (in standard deviations) */
  deviationMagnitude: number;
  /** When detected */
  detectedAt: number;
  /** Description */
  description: string;
};

/**
 * Threat assessment result.
 */
export type ThreatAssessment = {
  /** Assessment ID */
  id: string;
  /** Organism being assessed */
  organismId: string;
  /** Overall threat level */
  threatLevel: ThreatLevel;
  /** Threat score (0-1) */
  threatScore: number;
  /** Detected anomalies */
  anomalies: PatternAnomaly[];
  /** Contributing factors */
  factors: Array<{
    factor: string;
    weight: number;
    description: string;
  }>;
  /** Confidence in assessment (0-1) */
  confidence: number;
  /** Assessment timestamp */
  timestamp: number;
  /** Recommended actions */
  recommendations: string[];
};

/**
 * In-memory signature store (MVP).
 */
class BioorganismSignatureStore {
  private signatures: Map<string, BioorganismSignature> = new Map();
  private assessments: Map<string, ThreatAssessment[]> = new Map();

  /**
   * Initialize or get signature for an organism.
   */
  getOrCreateSignature(
    organismId: string,
    organismType: BioorganismSignature["organismType"],
  ): BioorganismSignature {
    if (!this.signatures.has(organismId)) {
      this.signatures.set(organismId, {
        organismId,
        organismType,
        traces: new Map(),
        baseline: {
          activityDistribution: {},
          temporalPatterns: {},
          communicationMetrics: {},
        },
        signatureEntropy: 0,
        interactionCount: 0,
        firstInteraction: Date.now(),
        lastInteraction: Date.now(),
        version: 1,
      });
    }
    return this.signatures.get(organismId)!;
  }

  /**
   * Record a trace pattern observation.
   */
  recordTrace(
    organismId: string,
    pattern: Omit<TracePattern, "id" | "observationCount" | "firstObserved">,
  ): TracePattern {
    const signature = this.signatures.get(organismId);
    if (!signature) {
      throw new Error(`No signature found for organism ${organismId}`);
    }

    const patternId = `${pattern.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check if similar pattern exists
    let existingPattern: TracePattern | undefined;
    for (const [id, trace] of signature.traces) {
      if (trace.type === pattern.type && trace.signature === pattern.signature) {
        existingPattern = trace;
        break;
      }
    }

    if (existingPattern) {
      // Update existing pattern
      existingPattern.observationCount++;
      existingPattern.lastObserved = Date.now();
      existingPattern.confidence = Math.min(1.0, existingPattern.confidence + 0.05);
      existingPattern.strength =
        existingPattern.observationCount / (signature.interactionCount + 1);
      return existingPattern;
    } else {
      // Create new pattern
      const newPattern: TracePattern = {
        id: patternId,
        type: pattern.type,
        signature: pattern.signature,
        confidence: pattern.confidence,
        observationCount: 1,
        firstObserved: Date.now(),
        lastObserved: Date.now(),
        strength: pattern.strength,
        metadata: pattern.metadata,
      };

      signature.traces.set(patternId, newPattern);
      return newPattern;
    }
  }

  /**
   * Update organism baseline from accumulated patterns.
   */
  updateBaseline(organismId: string): void {
    const signature = this.signatures.get(organismId);
    if (!signature) return;

    // Calculate activity distribution
    const activityCounts: Record<string, number> = {};
    for (const trace of signature.traces.values()) {
      activityCounts[trace.type] = (activityCounts[trace.type] || 0) + trace.observationCount;
    }

    const totalActivity = Object.values(activityCounts).reduce((a, b) => a + b, 0);
    if (totalActivity > 0) {
      for (const [type, count] of Object.entries(activityCounts)) {
        signature.baseline.activityDistribution[type] = count / totalActivity;
      }
    }

    // Calculate signature entropy (uncertainty about this organism)
    const probs = normalizeProbabilities(Object.values(signature.baseline.activityDistribution));
    signature.signatureEntropy = shannonEntropy(probs);

    signature.version++;
  }

  /**
   * Detect anomalies in organism patterns.
   */
  detectAnomalies(organismId: string): PatternAnomaly[] {
    const signature = this.signatures.get(organismId);
    if (!signature) return [];

    const anomalies: PatternAnomaly[] = [];
    const now = Date.now();

    // Check for pattern deviations
    for (const trace of signature.traces.values()) {
      const expected = signature.baseline.activityDistribution[trace.type] || 0;
      const observed = trace.observationCount / signature.interactionCount;
      const deviation = Math.abs(observed - expected);

      // Significant deviation (>2 standard deviations approximation)
      if (deviation > 0.2 && signature.interactionCount > 10) {
        anomalies.push({
          id: `anomaly_${now}_${Math.random().toString(36).substr(2, 9)}`,
          patternId: trace.id,
          type: "deviation",
          severity: Math.min(1.0, deviation),
          deviationMagnitude: deviation / 0.1, // Rough SD estimate
          detectedAt: now,
          description: `Pattern ${trace.type} deviates from baseline by ${(deviation * 100).toFixed(1)}%`,
        });
      }

      // Pattern absence (expected but not seen recently)
      const timeSinceLastSeen = now - trace.lastObserved;
      const expectedInterval =
        (signature.lastInteraction - signature.firstInteraction) / trace.observationCount;

      if (timeSinceLastSeen > expectedInterval * 3 && trace.strength > 0.2) {
        anomalies.push({
          id: `anomaly_${now}_${Math.random().toString(36).substr(2, 9)}`,
          patternId: trace.id,
          type: "absence",
          severity: trace.strength,
          deviationMagnitude: timeSinceLastSeen / expectedInterval,
          detectedAt: now,
          description: `Pattern ${trace.type} not observed for ${Math.floor(timeSinceLastSeen / 1000 / 60)} minutes (expected every ${Math.floor(expectedInterval / 1000 / 60)} minutes)`,
        });
      }
    }

    return anomalies;
  }

  /**
   * Assess threat level for an organism.
   */
  assessThreat(organismId: string): ThreatAssessment {
    const signature = this.signatures.get(organismId);
    if (!signature) {
      throw new Error(`No signature found for organism ${organismId}`);
    }

    const anomalies = this.detectAnomalies(organismId);
    const factors: ThreatAssessment["factors"] = [];

    let threatScore = 0;

    // Factor 1: Number and severity of anomalies
    if (anomalies.length > 0) {
      const avgSeverity = anomalies.reduce((sum, a) => sum + a.severity, 0) / anomalies.length;
      const anomalyFactor = Math.min(1.0, (anomalies.length / 10) * avgSeverity);
      threatScore += anomalyFactor * 0.4;

      factors.push({
        factor: "anomaly_count",
        weight: 0.4,
        description: `${anomalies.length} anomalies detected with avg severity ${avgSeverity.toFixed(2)}`,
      });
    }

    // Factor 2: Signature entropy (high entropy = unpredictable = higher threat)
    const entropyFactor = signature.signatureEntropy / 3.0; // Normalize (assume max ~3 bits)
    threatScore += entropyFactor * 0.2;

    factors.push({
      factor: "unpredictability",
      weight: 0.2,
      description: `Signature entropy: ${signature.signatureEntropy.toFixed(2)} bits`,
    });

    // Factor 3: Pattern consistency (low strength = erratic = higher threat)
    const avgStrength =
      Array.from(signature.traces.values()).reduce((sum, t) => sum + t.strength, 0) /
      (signature.traces.size || 1);
    const inconsistencyFactor = 1 - avgStrength;
    threatScore += inconsistencyFactor * 0.2;

    factors.push({
      factor: "inconsistency",
      weight: 0.2,
      description: `Pattern strength: ${avgStrength.toFixed(2)}`,
    });

    // Factor 4: Recency of observation (old data = uncertain = moderate threat)
    const timeSinceLastInteraction = Date.now() - signature.lastInteraction;
    const recencyFactor = Math.min(1.0, timeSinceLastInteraction / (1000 * 60 * 60 * 24)); // Days
    threatScore += recencyFactor * 0.2;

    factors.push({
      factor: "data_staleness",
      weight: 0.2,
      description: `Last seen ${Math.floor(timeSinceLastInteraction / 1000 / 60)} minutes ago`,
    });

    // Determine threat level
    let threatLevel: ThreatLevel;
    if (threatScore < 0.2) threatLevel = "none";
    else if (threatScore < 0.4) threatLevel = "low";
    else if (threatScore < 0.6) threatLevel = "medium";
    else if (threatScore < 0.8) threatLevel = "high";
    else threatLevel = "critical";

    // Generate recommendations
    const recommendations: string[] = [];
    if (anomalies.length > 3) {
      recommendations.push("Increase observation frequency to establish new baseline");
    }
    if (signature.signatureEntropy > 2.0) {
      recommendations.push("Organism behavior is highly unpredictable - gather more data");
    }
    if (avgStrength < 0.5) {
      recommendations.push("Patterns are weak - consider longer observation period");
    }

    const assessment: ThreatAssessment = {
      id: `assess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organismId,
      threatLevel,
      threatScore,
      anomalies,
      factors,
      confidence: Math.min(1.0, signature.interactionCount / 100), // More data = higher confidence
      timestamp: Date.now(),
      recommendations,
    };

    // Store assessment
    if (!this.assessments.has(organismId)) {
      this.assessments.set(organismId, []);
    }
    this.assessments.get(organismId)!.push(assessment);

    // Keep last 100 assessments per organism
    const assessmentList = this.assessments.get(organismId)!;
    if (assessmentList.length > 100) {
      this.assessments.set(organismId, assessmentList.slice(-100));
    }

    return assessment;
  }

  /**
   * Get signature for organism.
   */
  getSignature(organismId: string): BioorganismSignature | undefined {
    return this.signatures.get(organismId);
  }

  /**
   * Get recent assessments for organism.
   */
  getAssessments(organismId: string, limit: number = 10): ThreatAssessment[] {
    return (this.assessments.get(organismId) || []).slice(-limit);
  }

  /**
   * Get all tracked organisms.
   */
  getAllOrganisms(): string[] {
    return Array.from(this.signatures.keys());
  }
}

// Singleton instance
export const signatureStore = new BioorganismSignatureStore();

/**
 * Record organism interaction and update signature.
 */
export function recordOrganismInteraction(
  organismId: string,
  organismType: BioorganismSignature["organismType"],
  patterns: Array<Omit<TracePattern, "id" | "observationCount" | "firstObserved">>,
): BioorganismSignature {
  const signature = signatureStore.getOrCreateSignature(organismId, organismType);

  signature.interactionCount++;
  signature.lastInteraction = Date.now();

  // Record all patterns
  for (const pattern of patterns) {
    signatureStore.recordTrace(organismId, pattern);
  }

  // Update baseline every 10 interactions
  if (signature.interactionCount % 10 === 0) {
    signatureStore.updateBaseline(organismId);
  }

  // Log event
  eventStore.store({
    id: `evt_interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    actor: {
      id: organismId,
      type: organismType === "human" ? "user" : "system",
      permissions: [],
    },
    type: "bioorganism_interaction",
    payload: {
      organismId,
      organismType,
      patternCount: patterns.length,
      interactionCount: signature.interactionCount,
    },
    domainSignature: {
      version: "1.0",
      mixtures: { bioorganism: 1.0 },
      updatedAt: Date.now(),
    },
  });

  return signature;
}

/**
 * Assess threat for organism.
 */
export function assessOrganismThreat(organismId: string): ThreatAssessment {
  const assessment = signatureStore.assessThreat(organismId);

  // Log assessment event
  eventStore.store({
    id: `evt_assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    actor: { id: "system", type: "system", permissions: ["assess"] },
    type: "threat_assessment",
    payload: {
      organismId,
      threatLevel: assessment.threatLevel,
      threatScore: assessment.threatScore,
      anomalyCount: assessment.anomalies.length,
      confidence: assessment.confidence,
    },
    domainSignature: {
      version: "1.0",
      mixtures: { security: 1.0 },
      updatedAt: Date.now(),
    },
  });

  return assessment;
}
