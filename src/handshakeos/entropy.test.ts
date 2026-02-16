/**
 * Tests for entropy and information theory calculations.
 */

import { describe, it, expect } from "vitest";
import {
  shannonEntropy,
  informationGain,
  klDivergence,
  crossEntropy,
  normalizeProbabilities,
  maxEntropy,
  normalizedEntropy,
  giniImpurity,
  isConverging,
  perplexity,
  calculateEntropySummary,
} from "./entropy.js";

describe("shannonEntropy", () => {
  it("returns 0 for certain outcome", () => {
    const entropy = shannonEntropy([1.0]);
    expect(entropy).toBe(0);
  });

  it("returns 1 for fair coin (2 outcomes)", () => {
    const entropy = shannonEntropy([0.5, 0.5]);
    expect(entropy).toBeCloseTo(1.0, 5);
  });

  it("returns log2(4)=2 for fair 4-sided die", () => {
    const entropy = shannonEntropy([0.25, 0.25, 0.25, 0.25]);
    expect(entropy).toBeCloseTo(2.0, 5);
  });

  it("returns log2(8)=3 for uniform 8 outcomes", () => {
    const probs = Array(8).fill(1 / 8);
    const entropy = shannonEntropy(probs);
    expect(entropy).toBeCloseTo(3.0, 5);
  });

  it("handles biased coin correctly", () => {
    // H([0.9, 0.1]) = -0.9*log2(0.9) - 0.1*log2(0.1)
    const entropy = shannonEntropy([0.9, 0.1]);
    const expected = -0.9 * Math.log2(0.9) - 0.1 * Math.log2(0.1);
    expect(entropy).toBeCloseTo(expected, 5);
  });

  it("throws error if probabilities don't sum to 1", () => {
    expect(() => shannonEntropy([0.5, 0.4])).toThrow();
  });

  it("throws error for negative probabilities", () => {
    expect(() => shannonEntropy([-0.1, 1.1])).toThrow();
  });

  it("handles zero probabilities correctly", () => {
    // 0 * log(0) should be treated as 0
    const entropy = shannonEntropy([0, 0.5, 0.5]);
    expect(entropy).toBeCloseTo(1.0, 5);
  });
});

describe("informationGain", () => {
  it("returns positive value when uncertainty decreases", () => {
    const prior = [0.5, 0.5]; // Maximum uncertainty for 2 outcomes
    const posterior = [0.9, 0.1]; // More certain
    const ig = informationGain(prior, posterior);
    expect(ig).toBeGreaterThan(0);
  });

  it("returns 0 when distribution doesn't change", () => {
    const probs = [0.7, 0.3];
    const ig = informationGain(probs, probs);
    expect(ig).toBeCloseTo(0, 5);
  });

  it("returns negative value when uncertainty increases", () => {
    const prior = [0.9, 0.1]; // More certain
    const posterior = [0.5, 0.5]; // Less certain
    const ig = informationGain(prior, posterior);
    expect(ig).toBeLessThan(0);
  });

  it("calculates correct IG for convergence example", () => {
    // Starting: 4 equally likely hypotheses
    const prior = [0.25, 0.25, 0.25, 0.25];
    // Evidence makes one much more likely
    const posterior = [0.7, 0.1, 0.1, 0.1];

    const ig = informationGain(prior, posterior);
    expect(ig).toBeGreaterThan(0); // Gained information
    expect(ig).toBeLessThan(2.0); // Can't gain more than prior entropy
  });

  it("throws error if distributions have different lengths", () => {
    expect(() => informationGain([0.5, 0.5], [0.33, 0.33, 0.34])).toThrow();
  });
});

describe("klDivergence", () => {
  it("returns 0 for identical distributions", () => {
    const p = [0.5, 0.5];
    const kl = klDivergence(p, p);
    expect(kl).toBeCloseTo(0, 5);
  });

  it("returns positive value for different distributions", () => {
    const p = [0.7, 0.3];
    const q = [0.5, 0.5];
    const kl = klDivergence(p, q);
    expect(kl).toBeGreaterThan(0);
  });

  it("is not symmetric", () => {
    const p = [0.7, 0.3];
    const q = [0.5, 0.5];
    const klPQ = klDivergence(p, q);
    const klQP = klDivergence(q, p);
    expect(klPQ).not.toBeCloseTo(klQP, 5);
  });

  it("returns infinity if Q assigns zero where P doesn't", () => {
    const p = [0.5, 0.5];
    const q = [1.0, 0.0];
    const kl = klDivergence(p, q);
    expect(kl).toBe(Infinity);
  });

  it("handles zero in P correctly", () => {
    const p = [1.0, 0.0];
    const q = [0.5, 0.5];
    const kl = klDivergence(p, q);
    expect(kl).toBeGreaterThan(0);
    expect(kl).toBeLessThan(Infinity);
  });
});

describe("crossEntropy", () => {
  it("equals entropy when distributions are identical", () => {
    const p = [0.5, 0.5];
    const ce = crossEntropy(p, p);
    const h = shannonEntropy(p);
    expect(ce).toBeCloseTo(h, 5);
  });

  it("is greater than or equal to entropy", () => {
    const p = [0.7, 0.3];
    const q = [0.5, 0.5];
    const ce = crossEntropy(p, q);
    const h = shannonEntropy(p);
    expect(ce).toBeGreaterThanOrEqual(h - 0.0001); // Allow tiny floating point error
  });

  it("satisfies H(P,Q) = H(P) + KL(P||Q)", () => {
    const p = [0.6, 0.4];
    const q = [0.8, 0.2];
    const ce = crossEntropy(p, q);
    const h = shannonEntropy(p);
    const kl = klDivergence(p, q);
    expect(ce).toBeCloseTo(h + kl, 5);
  });

  it("returns infinity if Q assigns zero where P doesn't", () => {
    const p = [0.5, 0.5];
    const q = [1.0, 0.0];
    const ce = crossEntropy(p, q);
    expect(ce).toBe(Infinity);
  });
});

describe("normalizeProbabilities", () => {
  it("normalizes values to sum to 1", () => {
    const normalized = normalizeProbabilities([1, 2, 3]);
    const sum = normalized.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it("preserves ratios", () => {
    const normalized = normalizeProbabilities([1, 2, 3]);
    expect(normalized[0]).toBeCloseTo(1 / 6, 5);
    expect(normalized[1]).toBeCloseTo(2 / 6, 5);
    expect(normalized[2]).toBeCloseTo(3 / 6, 5);
  });

  it("returns uniform distribution for all zeros", () => {
    const normalized = normalizeProbabilities([0, 0, 0]);
    expect(normalized).toEqual([1 / 3, 1 / 3, 1 / 3]);
  });

  it("throws error for negative values", () => {
    expect(() => normalizeProbabilities([1, -1, 2])).toThrow();
  });

  it("returns empty array for empty input", () => {
    const normalized = normalizeProbabilities([]);
    expect(normalized).toEqual([]);
  });
});

describe("maxEntropy", () => {
  it("returns 0 for single outcome", () => {
    expect(maxEntropy(1)).toBe(0);
  });

  it("returns 1 for two outcomes", () => {
    expect(maxEntropy(2)).toBeCloseTo(1.0, 5);
  });

  it("returns 2 for four outcomes", () => {
    expect(maxEntropy(4)).toBeCloseTo(2.0, 5);
  });

  it("returns 3 for eight outcomes", () => {
    expect(maxEntropy(8)).toBeCloseTo(3.0, 5);
  });

  it("throws error for zero or negative", () => {
    expect(() => maxEntropy(0)).toThrow();
    expect(() => maxEntropy(-1)).toThrow();
  });
});

describe("normalizedEntropy", () => {
  it("returns 1 for uniform distribution", () => {
    const probs = [0.25, 0.25, 0.25, 0.25];
    const normalized = normalizedEntropy(probs);
    expect(normalized).toBeCloseTo(1.0, 5);
  });

  it("returns 0 for certain outcome", () => {
    const probs = [1.0, 0.0, 0.0, 0.0];
    const normalized = normalizedEntropy(probs);
    expect(normalized).toBeCloseTo(0.0, 5);
  });

  it("returns value between 0 and 1 for mixed distribution", () => {
    const probs = [0.7, 0.1, 0.1, 0.1];
    const normalized = normalizedEntropy(probs);
    expect(normalized).toBeGreaterThan(0);
    expect(normalized).toBeLessThan(1);
  });

  it("returns 0 for single outcome", () => {
    const probs = [1.0];
    const normalized = normalizedEntropy(probs);
    expect(normalized).toBe(0);
  });
});

describe("giniImpurity", () => {
  it("returns 0 for pure outcome", () => {
    const gini = giniImpurity([1.0, 0.0, 0.0]);
    expect(gini).toBeCloseTo(0.0, 5);
  });

  it("returns maximum for uniform distribution", () => {
    const gini = giniImpurity([0.5, 0.5]);
    expect(gini).toBeCloseTo(0.5, 5); // (2-1)/2 = 0.5
  });

  it("returns intermediate value for mixed distribution", () => {
    const gini = giniImpurity([0.7, 0.3]);
    expect(gini).toBeGreaterThan(0);
    expect(gini).toBeLessThan(0.5);
  });

  it("calculates correct value for 4-way split", () => {
    const gini = giniImpurity([0.25, 0.25, 0.25, 0.25]);
    expect(gini).toBeCloseTo(0.75, 5); // (4-1)/4 = 0.75
  });
});

describe("isConverging", () => {
  it("returns true when max probability exceeds threshold", () => {
    const probs = [0.8, 0.1, 0.1];
    expect(isConverging(probs, 0.7)).toBe(true);
  });

  it("returns false when max probability below threshold", () => {
    const probs = [0.4, 0.3, 0.3];
    expect(isConverging(probs, 0.7)).toBe(false);
  });

  it("uses default threshold of 0.7", () => {
    const converged = [0.75, 0.15, 0.1];
    const notConverged = [0.65, 0.2, 0.15];
    expect(isConverging(converged)).toBe(true);
    expect(isConverging(notConverged)).toBe(false);
  });

  it("returns false for empty array", () => {
    expect(isConverging([])).toBe(false);
  });
});

describe("perplexity", () => {
  it("equals number of outcomes for uniform distribution", () => {
    const probs = [0.25, 0.25, 0.25, 0.25];
    const ppl = perplexity(probs);
    expect(ppl).toBeCloseTo(4.0, 5);
  });

  it("equals 1 for certain outcome", () => {
    const probs = [1.0, 0.0, 0.0, 0.0];
    const ppl = perplexity(probs);
    expect(ppl).toBeCloseTo(1.0, 5);
  });

  it("is between 1 and n for mixed distribution", () => {
    const probs = [0.7, 0.1, 0.1, 0.1];
    const ppl = perplexity(probs);
    expect(ppl).toBeGreaterThan(1);
    expect(ppl).toBeLessThan(4);
  });

  it("equals 2 for fair coin", () => {
    const probs = [0.5, 0.5];
    const ppl = perplexity(probs);
    expect(ppl).toBeCloseTo(2.0, 5);
  });
});

describe("calculateEntropySummary", () => {
  it("returns correct summary for uniform distribution", () => {
    const probs = [0.25, 0.25, 0.25, 0.25];
    const summary = calculateEntropySummary(probs);

    expect(summary.entropy).toBeCloseTo(2.0, 5);
    expect(summary.normalizedEntropy).toBeCloseTo(1.0, 5);
    expect(summary.maxEntropy).toBeCloseTo(2.0, 5);
    expect(summary.gini).toBeCloseTo(0.75, 5);
    expect(summary.perplexity).toBeCloseTo(4.0, 5);
    expect(summary.isConverging).toBe(false);
    expect(summary.maxProbability).toBe(0.25);
    expect(summary.numOutcomes).toBe(4);
  });

  it("returns correct summary for certain outcome", () => {
    const probs = [1.0, 0.0, 0.0];
    const summary = calculateEntropySummary(probs);

    expect(summary.entropy).toBeCloseTo(0.0, 5);
    expect(summary.normalizedEntropy).toBeCloseTo(0.0, 5);
    expect(summary.gini).toBeCloseTo(0.0, 5);
    expect(summary.perplexity).toBeCloseTo(1.0, 5);
    expect(summary.isConverging).toBe(true);
    expect(summary.maxProbability).toBe(1.0);
    expect(summary.maxIndex).toBe(0);
  });

  it("returns correct summary for converging distribution", () => {
    const probs = [0.7, 0.15, 0.1, 0.05];
    const summary = calculateEntropySummary(probs);

    expect(summary.entropy).toBeGreaterThan(0);
    expect(summary.entropy).toBeLessThan(summary.maxEntropy);
    expect(summary.normalizedEntropy).toBeGreaterThan(0);
    expect(summary.normalizedEntropy).toBeLessThan(1);
    expect(summary.isConverging).toBe(true);
    expect(summary.maxProbability).toBe(0.7);
    expect(summary.maxIndex).toBe(0);
    expect(summary.numOutcomes).toBe(4);
  });

  it("handles empty array gracefully", () => {
    const summary = calculateEntropySummary([]);

    expect(summary.entropy).toBe(0);
    expect(summary.normalizedEntropy).toBe(0);
    expect(summary.maxEntropy).toBe(0);
    expect(summary.gini).toBe(0);
    expect(summary.perplexity).toBe(1);
    expect(summary.isConverging).toBe(false);
    expect(summary.maxProbability).toBe(0);
    expect(summary.maxIndex).toBe(-1);
    expect(summary.numOutcomes).toBe(0);
  });
});
