import type { RuntimeEnv } from "../runtime.js";
import { info } from "../globals.js";
import { theme } from "../terminal/theme.js";

/**
 * Temporal experiment parameters for classical time-symmetric simulation
 */
export type TemporalExperimentParams = {
  /** Random seed for deterministic simulation */
  seed?: number;
  /** Number of simulation iterations */
  iterations?: number;
  /** Description of past state constraints */
  pastState?: string;
  /** Description of future state constraints */
  futureConstraint?: string;
  /** Enable verbose output */
  verbose?: boolean;
  /** JSON output mode */
  json?: boolean;
};

/**
 * Result of temporal experiment simulation
 */
export type TemporalExperimentResult = {
  /** Configuration used */
  config: {
    seed: number;
    iterations: number;
    pastState: string;
    futureConstraint: string;
  };
  /** Convergence metrics */
  metrics: {
    convergence: number;
    pastSatisfaction: number;
    futureSatisfaction: number;
  };
  /** Computation statistics */
  stats: {
    computationTimeMs: number;
  };
  /** Human-readable summary */
  summary: string;
};

/**
 * Seeded pseudo-random number generator (LCG)
 * This ensures deterministic results for the same seed
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) {
      this.seed += 2147483646;
    }
  }

  /**
   * Generate next random number in range [0, 1)
   */
  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
}

/**
 * Hash string to numeric value for constraint evaluation
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Classical time-symmetric constraint satisfaction simulation
 *
 * This implements a simplified bidirectional constraint propagation algorithm:
 * 1. Initialize state based on seed
 * 2. Iteratively adjust state to satisfy both past and future constraints
 * 3. Compute convergence metrics
 *
 * All operations are deterministic given the same seed.
 */
function runTemporalSimulation(
  params: Required<TemporalExperimentParams>,
): TemporalExperimentResult {
  const startTime = Date.now();
  const rng = new SeededRandom(params.seed);

  // Hash constraints to numeric values for simulation
  const pastTarget = hashString(params.pastState) / 2147483647;
  const futureTarget = hashString(params.futureConstraint) / 2147483647;

  // Initialize state randomly
  let state = rng.next();

  // Simulate bidirectional constraint propagation
  // In each iteration, we adjust the state to better satisfy both constraints
  for (let i = 0; i < params.iterations; i++) {
    // Adjust state bidirectionally (weighted average towards both targets)
    // This simulates time-symmetric constraint propagation
    const learningRate = 0.1 / (1 + i / params.iterations); // Decreasing learning rate
    const pastAdjustment = (pastTarget - state) * learningRate;
    const futureAdjustment = (futureTarget - state) * learningRate;

    // Apply both adjustments (bidirectional propagation)
    state += (pastAdjustment + futureAdjustment) / 2;

    // Add small random perturbation to explore state space
    state += (rng.next() - 0.5) * 0.01 * learningRate;

    // Clamp state to [0, 1]
    state = Math.max(0, Math.min(1, state));
  }

  // Compute final metrics
  const finalPastError = Math.abs(state - pastTarget);
  const finalFutureError = Math.abs(state - futureTarget);

  // Satisfaction scores (1 = perfect, 0 = worst)
  const pastSatisfaction = Math.max(0, 1 - finalPastError);
  const futureSatisfaction = Math.max(0, 1 - finalFutureError);
  const convergence = (pastSatisfaction + futureSatisfaction) / 2;

  const computationTimeMs = Date.now() - startTime;

  return {
    config: {
      seed: params.seed,
      iterations: params.iterations,
      pastState: params.pastState,
      futureConstraint: params.futureConstraint,
    },
    metrics: {
      convergence: Number(convergence.toFixed(3)),
      pastSatisfaction: Number(pastSatisfaction.toFixed(3)),
      futureSatisfaction: Number(futureSatisfaction.toFixed(3)),
    },
    stats: {
      computationTimeMs,
    },
    summary:
      convergence > 0.8
        ? "Final state achieved satisfactory bidirectional constraint satisfaction."
        : convergence > 0.5
          ? "Final state achieved moderate bidirectional constraint satisfaction."
          : "Final state achieved limited bidirectional constraint satisfaction.",
  };
}

/**
 * Execute temporal experiment command
 */
export async function temporalCommand(
  params: TemporalExperimentParams,
  runtime: RuntimeEnv,
): Promise<void> {
  // Apply defaults
  const config: Required<TemporalExperimentParams> = {
    seed: params.seed ?? Date.now() % 1000000,
    iterations: params.iterations ?? 1000,
    pastState: params.pastState ?? "initial",
    futureConstraint: params.futureConstraint ?? "target",
    verbose: params.verbose ?? false,
    json: params.json ?? false,
  };

  // Run simulation
  const result = runTemporalSimulation(config);

  // Output results
  if (config.json) {
    runtime.log(JSON.stringify(result, null, 2));
  } else {
    // Human-readable output
    runtime.log("");
    runtime.log(theme.accent("═══════════════════════════════════════════"));
    runtime.log(theme.accent("  Temporal Experiment Simulation"));
    runtime.log(theme.accent("  (Classical Simulation Only)"));
    runtime.log(theme.accent("═══════════════════════════════════════════"));
    runtime.log("");
    runtime.log(info("Configuration:"));
    runtime.log(`  Seed: ${result.config.seed}`);
    runtime.log(`  Iterations: ${result.config.iterations}`);
    runtime.log(`  Past State: "${result.config.pastState}"`);
    runtime.log(`  Future Constraint: "${result.config.futureConstraint}"`);
    runtime.log("");

    if (config.verbose) {
      runtime.log(info("Running classical time-symmetric simulation..."));
      runtime.log("");
    }

    runtime.log(info("Results:"));
    runtime.log(`  Convergence: ${theme.success(result.metrics.convergence.toString())}`);
    runtime.log(`  Past satisfaction: ${result.metrics.pastSatisfaction}`);
    runtime.log(`  Future satisfaction: ${result.metrics.futureSatisfaction}`);
    runtime.log(`  Computation time: ${result.stats.computationTimeMs}ms`);
    runtime.log("");
    runtime.log(result.summary);
    runtime.log("");
    runtime.log(theme.muted("NOTE: This is a classical simulation. Results are deterministic"));
    runtime.log(theme.muted("      and reproducible with the same seed. No quantum effects or"));
    runtime.log(theme.muted("      actual temporal manipulation occurs."));
    runtime.log("");
  }
}
