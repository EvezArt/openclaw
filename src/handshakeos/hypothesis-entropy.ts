/**
 * HandshakeOS-E Hypothesis Entropy Tracking
 *
 * Integrates entropy calculations with hypothesis tracking to quantify
 * uncertainty, measure information gain, and detect convergence.
 */

import type { Hypothesis, HypothesisModelType } from "./types.js";
import {
  shannonEntropy,
  informationGain,
  calculateEntropySummary,
  normalizeProbabilities,
  type EntropySummary,
} from "./entropy.js";

/**
 * Entropy state for a set of hypotheses.
 */
export type HypothesisEntropyState = {
  /** Current entropy in bits */
  currentEntropy: number;
  /** Normalized entropy (0-1) */
  normalizedEntropy: number;
  /** Previous entropy (for tracking delta) */
  previousEntropy?: number;
  /** Entropy change from last update */
  entropyDelta?: number;
  /** Information gained since initialization */
  totalInformationGain: number;
  /** Number of updates that reduced entropy */
  convergenceUpdates: number;
  /** Number of updates that increased entropy */
  divergenceUpdates: number;
  /** Whether hypotheses are converging */
  isConverging: boolean;
  /** Timestamp of last update */
  lastUpdated: number;
  /** Full entropy summary */
  summary: EntropySummary;
};

/**
 * Per-model entropy tracking.
 */
export type ModelEntropyTracking = {
  modelType: HypothesisModelType;
  hypothesisIds: string[];
  probabilities: number[];
  entropy: HypothesisEntropyState;
};

/**
 * System-wide entropy tracking across all hypotheses.
 */
export type SystemEntropyState = {
  /** Total system entropy across all hypotheses */
  totalEntropy: number;
  /** Per-model entropy breakdown */
  byModel: Map<HypothesisModelType, ModelEntropyTracking>;
  /** Total number of active hypotheses */
  totalHypotheses: number;
  /** System-wide information gain */
  systemInformationGain: number;
  /** Whether system is globally converging */
  systemConverging: boolean;
  /** Timestamp */
  timestamp: number;
};

/**
 * Calculate entropy state for a set of hypotheses.
 *
 * @param hypotheses Array of hypotheses
 * @param previousState Optional previous state for delta calculation
 * @returns Current entropy state
 */
export function calculateHypothesisEntropy(
  hypotheses: Hypothesis[],
  previousState?: HypothesisEntropyState,
): HypothesisEntropyState {
  if (hypotheses.length === 0) {
    return {
      currentEntropy: 0,
      normalizedEntropy: 0,
      totalInformationGain: 0,
      convergenceUpdates: 0,
      divergenceUpdates: 0,
      isConverging: false,
      lastUpdated: Date.now(),
      summary: calculateEntropySummary([]),
    };
  }

  // Extract and normalize probabilities
  const rawProbs = hypotheses.map((h) => h.probability);
  const probabilities = normalizeProbabilities(rawProbs);

  // Calculate entropy summary
  const summary = calculateEntropySummary(probabilities);
  const currentEntropy = summary.entropy;

  // Calculate information gain and deltas
  let entropyDelta: number | undefined = undefined;
  let totalInformationGain = previousState?.totalInformationGain ?? 0;
  let convergenceUpdates = previousState?.convergenceUpdates ?? 0;
  let divergenceUpdates = previousState?.divergenceUpdates ?? 0;

  if (previousState?.currentEntropy !== undefined) {
    entropyDelta = currentEntropy - previousState.currentEntropy;

    if (entropyDelta < 0) {
      // Entropy decreased = information gained = convergence
      totalInformationGain += Math.abs(entropyDelta);
      convergenceUpdates++;
    } else if (entropyDelta > 0) {
      // Entropy increased = divergence
      divergenceUpdates++;
    }
  }

  return {
    currentEntropy,
    normalizedEntropy: summary.normalizedEntropy,
    previousEntropy: previousState?.currentEntropy,
    entropyDelta,
    totalInformationGain,
    convergenceUpdates,
    divergenceUpdates,
    isConverging: summary.isConverging,
    lastUpdated: Date.now(),
    summary,
  };
}

/**
 * Calculate information gain between two hypothesis states.
 *
 * @param before Previous set of hypotheses
 * @param after Updated set of hypotheses
 * @returns Information gain in bits
 */
export function calculateInformationGain(before: Hypothesis[], after: Hypothesis[]): number {
  if (before.length === 0 || after.length === 0) {
    return 0;
  }

  // Ensure same hypothesis set (by ID)
  const beforeIds = new Set(before.map((h) => h.id));
  const afterIds = new Set(after.map((h) => h.id));

  if (beforeIds.size !== afterIds.size) {
    throw new Error("Cannot calculate information gain: hypothesis sets differ");
  }

  for (const id of beforeIds) {
    if (!afterIds.has(id)) {
      throw new Error(`Cannot calculate information gain: hypothesis ${id} missing in after state`);
    }
  }

  // Extract and normalize probabilities (same order)
  const beforeProbs = normalizeProbabilities(before.map((h) => h.probability));
  const afterProbs = normalizeProbabilities(after.map((h) => h.probability));

  return informationGain(beforeProbs, afterProbs);
}

/**
 * Calculate system-wide entropy across all hypothesis models.
 *
 * @param hypotheses All active hypotheses
 * @param previousStates Optional previous per-model states
 * @returns System entropy state
 */
export function calculateSystemEntropy(
  hypotheses: Hypothesis[],
  previousStates?: Map<HypothesisModelType, HypothesisEntropyState>,
): SystemEntropyState {
  const byModel = new Map<HypothesisModelType, ModelEntropyTracking>();
  let totalEntropy = 0;
  let systemInformationGain = 0;
  let convergingModels = 0;

  // Group hypotheses by model type
  const byModelType = new Map<HypothesisModelType, Hypothesis[]>();
  for (const h of hypotheses) {
    if (!byModelType.has(h.modelType)) {
      byModelType.set(h.modelType, []);
    }
    byModelType.get(h.modelType)!.push(h);
  }

  // Calculate entropy per model
  for (const [modelType, modelHypotheses] of byModelType) {
    const previousState = previousStates?.get(modelType);
    const entropy = calculateHypothesisEntropy(modelHypotheses, previousState);

    const probabilities = normalizeProbabilities(modelHypotheses.map((h) => h.probability));

    byModel.set(modelType, {
      modelType,
      hypothesisIds: modelHypotheses.map((h) => h.id),
      probabilities,
      entropy,
    });

    totalEntropy += entropy.currentEntropy;
    systemInformationGain += entropy.totalInformationGain;

    if (entropy.isConverging) {
      convergingModels++;
    }
  }

  // System is converging if majority of models are converging
  const systemConverging = byModel.size > 0 && convergingModels / byModel.size >= 0.5;

  return {
    totalEntropy,
    byModel,
    totalHypotheses: hypotheses.length,
    systemInformationGain,
    systemConverging,
    timestamp: Date.now(),
  };
}

/**
 * Format entropy state as human-readable string.
 *
 * @param state Entropy state
 * @returns Formatted string
 */
export function formatEntropyState(state: HypothesisEntropyState): string {
  const lines: string[] = [];

  lines.push(
    `Entropy: ${state.currentEntropy.toFixed(3)} bits (${(state.normalizedEntropy * 100).toFixed(1)}% of max)`,
  );

  if (state.entropyDelta !== undefined) {
    const deltaSign = state.entropyDelta >= 0 ? "+" : "";
    lines.push(`  Delta: ${deltaSign}${state.entropyDelta.toFixed(3)} bits`);
  }

  lines.push(`  Information gained: ${state.totalInformationGain.toFixed(3)} bits`);
  lines.push(
    `  Updates: ${state.convergenceUpdates} convergence, ${state.divergenceUpdates} divergence`,
  );
  lines.push(`  Perplexity: ${state.summary.perplexity.toFixed(2)} effective outcomes`);
  lines.push(`  Status: ${state.isConverging ? "CONVERGING ✓" : "UNCERTAIN"}`);

  return lines.join("\n");
}

/**
 * Format system entropy state as human-readable string.
 *
 * @param state System entropy state
 * @returns Formatted string
 */
export function formatSystemEntropy(state: SystemEntropyState): string {
  const lines: string[] = [];

  lines.push(
    `System Entropy: ${state.totalEntropy.toFixed(3)} bits across ${state.totalHypotheses} hypotheses`,
  );
  lines.push(`  Total Information Gained: ${state.systemInformationGain.toFixed(3)} bits`);
  lines.push(`  Status: ${state.systemConverging ? "CONVERGING ✓" : "UNCERTAIN"}`);
  lines.push("");

  // Per-model breakdown
  for (const [modelType, tracking] of state.byModel) {
    lines.push(`[${modelType}] ${tracking.hypothesisIds.length} hypotheses`);
    lines.push(`  Entropy: ${tracking.entropy.currentEntropy.toFixed(3)} bits`);

    if (tracking.entropy.entropyDelta !== undefined) {
      const deltaSign = tracking.entropy.entropyDelta >= 0 ? "+" : "";
      lines.push(`  Delta: ${deltaSign}${tracking.entropy.entropyDelta.toFixed(3)}`);
    }

    lines.push(`  Status: ${tracking.entropy.isConverging ? "CONVERGING ✓" : "UNCERTAIN"}`);
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Detect significant entropy events.
 */
export type EntropyEvent =
  | { type: "convergence"; delta: number; newEntropy: number }
  | { type: "divergence"; delta: number; newEntropy: number }
  | { type: "threshold_crossed"; threshold: number; newEntropy: number }
  | { type: "information_milestone"; totalGain: number };

/**
 * Detect significant entropy events from state changes.
 *
 * @param state Current entropy state
 * @returns Array of detected events
 */
export function detectEntropyEvents(state: HypothesisEntropyState): EntropyEvent[] {
  const events: EntropyEvent[] = [];

  // Significant entropy change
  if (state.entropyDelta !== undefined) {
    const absDelta = Math.abs(state.entropyDelta);

    if (absDelta > 0.5) {
      // More than 0.5 bits change
      if (state.entropyDelta < 0) {
        events.push({
          type: "convergence",
          delta: state.entropyDelta,
          newEntropy: state.currentEntropy,
        });
      } else {
        events.push({
          type: "divergence",
          delta: state.entropyDelta,
          newEntropy: state.currentEntropy,
        });
      }
    }
  }

  // Threshold crossings
  const thresholds = [0.5, 0.25, 0.1]; // bits
  for (const threshold of thresholds) {
    if (
      state.previousEntropy !== undefined &&
      state.previousEntropy > threshold &&
      state.currentEntropy <= threshold
    ) {
      events.push({
        type: "threshold_crossed",
        threshold,
        newEntropy: state.currentEntropy,
      });
    }
  }

  // Information gain milestones
  const milestones = [1, 2, 3, 4, 5]; // bits
  for (const milestone of milestones) {
    if (state.totalInformationGain >= milestone) {
      const prevGain =
        state.totalInformationGain - (state.entropyDelta ? Math.abs(state.entropyDelta) : 0);
      if (prevGain < milestone) {
        events.push({
          type: "information_milestone",
          totalGain: state.totalInformationGain,
        });
      }
    }
  }

  return events;
}
