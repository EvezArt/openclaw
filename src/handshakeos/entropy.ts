/**
 * HandshakeOS-E Entropy & Information Theory
 *
 * Implements mathematical entropy calculations for measuring system uncertainty,
 * information gain, and probability distribution analysis.
 *
 * Core principles:
 * - Shannon entropy quantifies uncertainty
 * - Information gain measures evidence value
 * - Entropy reduction indicates convergence
 * - KL divergence measures distribution distance
 */

/**
 * Calculate Shannon entropy for a probability distribution.
 *
 * H(X) = -Σ p(x) * log₂(p(x))
 *
 * Returns bits of information needed to describe the distribution.
 * - Maximum entropy: log₂(n) for uniform distribution over n outcomes
 * - Minimum entropy: 0 for certain outcome (p=1)
 *
 * @param probabilities Array of probabilities (must sum to 1.0)
 * @returns Shannon entropy in bits
 */
export function shannonEntropy(probabilities: number[]): number {
  if (probabilities.length === 0) {
    return 0;
  }

  // Validate probabilities
  const sum = probabilities.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1.0) > 0.001) {
    throw new Error(`Probabilities must sum to 1.0, got ${sum.toFixed(4)}`);
  }

  let entropy = 0;
  for (const p of probabilities) {
    if (p < 0 || p > 1) {
      throw new Error(`Probability ${p} out of range [0, 1]`);
    }
    // Skip zero probabilities (0 * log(0) = 0 by convention)
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }

  return entropy;
}

/**
 * Calculate information gain from evidence.
 *
 * IG = H(before) - H(after)
 *
 * Positive value indicates evidence reduced uncertainty.
 * Zero indicates no new information.
 * Negative indicates increased uncertainty (unusual but possible with noise).
 *
 * @param priorProbs Probability distribution before evidence
 * @param posteriorProbs Probability distribution after evidence
 * @returns Information gain in bits
 */
export function informationGain(priorProbs: number[], posteriorProbs: number[]): number {
  if (priorProbs.length !== posteriorProbs.length) {
    throw new Error("Prior and posterior distributions must have same length");
  }

  const priorEntropy = shannonEntropy(priorProbs);
  const posteriorEntropy = shannonEntropy(posteriorProbs);

  return priorEntropy - posteriorEntropy;
}

/**
 * Calculate Kullback-Leibler divergence (relative entropy).
 *
 * KL(P || Q) = Σ P(x) * log₂(P(x) / Q(x))
 *
 * Measures how much probability distribution P diverges from Q.
 * Always non-negative. Zero when distributions are identical.
 * Not symmetric: KL(P||Q) ≠ KL(Q||P)
 *
 * @param p First probability distribution
 * @param q Second probability distribution (reference)
 * @returns KL divergence in bits
 */
export function klDivergence(p: number[], q: number[]): number {
  if (p.length !== q.length) {
    throw new Error("Distributions must have same length");
  }

  let divergence = 0;
  for (let i = 0; i < p.length; i++) {
    if (p[i] < 0 || p[i] > 1 || q[i] < 0 || q[i] > 1) {
      throw new Error("Probabilities must be in range [0, 1]");
    }

    // Skip when p[i] is zero (contributes nothing)
    if (p[i] > 0) {
      if (q[i] === 0) {
        // KL divergence is infinite if Q assigns zero probability where P doesn't
        return Infinity;
      }
      divergence += p[i] * Math.log2(p[i] / q[i]);
    }
  }

  return divergence;
}

/**
 * Calculate cross-entropy.
 *
 * H(P, Q) = -Σ P(x) * log₂(Q(x))
 *
 * Measures the average number of bits needed to encode samples from P
 * using a code optimized for Q.
 *
 * Relationship: H(P, Q) = H(P) + KL(P || Q)
 *
 * @param p True probability distribution
 * @param q Predicted/modeled probability distribution
 * @returns Cross-entropy in bits
 */
export function crossEntropy(p: number[], q: number[]): number {
  if (p.length !== q.length) {
    throw new Error("Distributions must have same length");
  }

  let ce = 0;
  for (let i = 0; i < p.length; i++) {
    if (p[i] < 0 || p[i] > 1 || q[i] < 0 || q[i] > 1) {
      throw new Error("Probabilities must be in range [0, 1]");
    }

    if (p[i] > 0) {
      if (q[i] === 0) {
        // Cross-entropy is infinite if Q assigns zero probability where P doesn't
        return Infinity;
      }
      ce -= p[i] * Math.log2(q[i]);
    }
  }

  return ce;
}

/**
 * Normalize probabilities to sum to 1.0.
 *
 * Useful for converting raw scores or unnormalized weights
 * into a proper probability distribution.
 *
 * @param values Array of non-negative values
 * @returns Normalized probability distribution
 */
export function normalizeProbabilities(values: number[]): number[] {
  if (values.length === 0) {
    return [];
  }

  if (values.some((v) => v < 0)) {
    throw new Error("Cannot normalize negative values");
  }

  const sum = values.reduce((a, b) => a + b, 0);

  if (sum === 0) {
    // If all values are zero, return uniform distribution
    return values.map(() => 1 / values.length);
  }

  return values.map((v) => v / sum);
}

/**
 * Calculate maximum possible entropy for n outcomes.
 *
 * H_max = log₂(n)
 *
 * This is achieved by a uniform distribution.
 *
 * @param n Number of possible outcomes
 * @returns Maximum entropy in bits
 */
export function maxEntropy(n: number): number {
  if (n <= 0) {
    throw new Error("Number of outcomes must be positive");
  }
  if (n === 1) {
    return 0; // Single outcome has zero entropy
  }
  return Math.log2(n);
}

/**
 * Calculate normalized entropy (0 to 1).
 *
 * H_normalized = H(X) / H_max(X)
 *
 * Where H_max = log₂(n) for n outcomes.
 * - 0 = completely certain (one outcome has p=1)
 * - 1 = maximum uncertainty (uniform distribution)
 *
 * @param probabilities Probability distribution
 * @returns Normalized entropy in range [0, 1]
 */
export function normalizedEntropy(probabilities: number[]): number {
  if (probabilities.length === 0) {
    return 0;
  }
  if (probabilities.length === 1) {
    return 0; // Single outcome has zero entropy
  }

  const h = shannonEntropy(probabilities);
  const hMax = maxEntropy(probabilities.length);

  return h / hMax;
}

/**
 * Calculate Gini impurity (alternative uncertainty measure).
 *
 * G(X) = 1 - Σ p(x)²
 *
 * Used in decision trees. Similar to entropy but computationally simpler.
 * - 0 = pure (one outcome)
 * - Maximum = (n-1)/n for uniform distribution over n outcomes
 *
 * @param probabilities Probability distribution
 * @returns Gini impurity in range [0, 1)
 */
export function giniImpurity(probabilities: number[]): number {
  if (probabilities.length === 0) {
    return 0;
  }

  const sumOfSquares = probabilities.reduce((sum, p) => {
    if (p < 0 || p > 1) {
      throw new Error(`Probability ${p} out of range [0, 1]`);
    }
    return sum + p * p;
  }, 0);

  return 1 - sumOfSquares;
}

/**
 * Detect if a probability distribution is converging.
 *
 * Convergence indicators:
 * - Entropy is decreasing
 * - Maximum probability is increasing
 * - Distribution is becoming more peaked
 *
 * @param probabilities Current probability distribution
 * @param threshold Convergence threshold (default: 0.7 for 70% confidence)
 * @returns True if distribution is converging (max prob > threshold)
 */
export function isConverging(probabilities: number[], threshold: number = 0.7): boolean {
  if (probabilities.length === 0) {
    return false;
  }

  const maxProb = Math.max(...probabilities);
  return maxProb >= threshold;
}

/**
 * Calculate perplexity of a probability distribution.
 *
 * Perplexity = 2^H(X)
 *
 * Interpretable as "effective number of outcomes".
 * - Low perplexity: distribution is concentrated
 * - High perplexity: distribution is diffuse
 *
 * @param probabilities Probability distribution
 * @returns Perplexity (number of effective outcomes)
 */
export function perplexity(probabilities: number[]): number {
  const h = shannonEntropy(probabilities);
  return Math.pow(2, h);
}

/**
 * Entropy summary for a probability distribution.
 */
export type EntropySummary = {
  /** Shannon entropy in bits */
  entropy: number;
  /** Normalized entropy (0-1) */
  normalizedEntropy: number;
  /** Maximum possible entropy */
  maxEntropy: number;
  /** Gini impurity */
  gini: number;
  /** Perplexity (effective number of outcomes) */
  perplexity: number;
  /** Whether distribution is converging (max prob > 0.7) */
  isConverging: boolean;
  /** Maximum probability in distribution */
  maxProbability: number;
  /** Index of outcome with maximum probability */
  maxIndex: number;
  /** Number of outcomes */
  numOutcomes: number;
};

/**
 * Calculate comprehensive entropy metrics for a distribution.
 *
 * @param probabilities Probability distribution
 * @returns Complete entropy summary
 */
export function calculateEntropySummary(probabilities: number[]): EntropySummary {
  if (probabilities.length === 0) {
    return {
      entropy: 0,
      normalizedEntropy: 0,
      maxEntropy: 0,
      gini: 0,
      perplexity: 1,
      isConverging: false,
      maxProbability: 0,
      maxIndex: -1,
      numOutcomes: 0,
    };
  }

  const maxProb = Math.max(...probabilities);
  const maxIdx = probabilities.indexOf(maxProb);

  return {
    entropy: shannonEntropy(probabilities),
    normalizedEntropy: normalizedEntropy(probabilities),
    maxEntropy: maxEntropy(probabilities.length),
    gini: giniImpurity(probabilities),
    perplexity: perplexity(probabilities),
    isConverging: isConverging(probabilities),
    maxProbability: maxProb,
    maxIndex: maxIdx,
    numOutcomes: probabilities.length,
  };
}
