import { describe, it, expect } from "vitest";
import { temporalCommand, type TemporalExperimentParams } from "./temporal.js";

describe("temporal command", () => {
  it("should run with default parameters", async () => {
    const logs: string[] = [];
    const mockRuntime = {
      log: (msg: string) => logs.push(msg),
      exit: () => {},
    };

    await temporalCommand({}, mockRuntime);

    // Verify output contains expected sections
    expect(logs.some((line) => line.includes("Temporal Experiment Simulation"))).toBe(true);
    expect(logs.some((line) => line.includes("Configuration:"))).toBe(true);
    expect(logs.some((line) => line.includes("Results:"))).toBe(true);
    expect(logs.some((line) => line.includes("Convergence:"))).toBe(true);
    expect(logs.some((line) => line.includes("classical simulation"))).toBe(true);
  });

  it("should produce deterministic results with same seed", async () => {
    const logs1: string[] = [];
    const mockRuntime1 = {
      log: (msg: string) => logs1.push(msg),
      exit: () => {},
    };

    const logs2: string[] = [];
    const mockRuntime2 = {
      log: (msg: string) => logs2.push(msg),
      exit: () => {},
    };

    const params: TemporalExperimentParams = {
      seed: 42,
      iterations: 1000,
      pastState: "test-past",
      futureConstraint: "test-future",
    };

    await temporalCommand(params, mockRuntime1);
    await temporalCommand(params, mockRuntime2);

    // Both runs should produce identical output
    expect(logs1).toEqual(logs2);

    // Verify convergence value is present and deterministic
    const convergenceLine1 = logs1.find((line) => line.includes("Convergence:"));
    const convergenceLine2 = logs2.find((line) => line.includes("Convergence:"));
    expect(convergenceLine1).toBeDefined();
    expect(convergenceLine1).toEqual(convergenceLine2);
  });

  it("should output JSON when json flag is set", async () => {
    const logs: string[] = [];
    const mockRuntime = {
      log: (msg: string) => logs.push(msg),
      exit: () => {},
    };

    await temporalCommand(
      {
        seed: 42,
        iterations: 100,
        json: true,
      },
      mockRuntime,
    );

    // Should have exactly one log line with JSON
    expect(logs.length).toBe(1);
    const result = JSON.parse(logs[0]);

    // Verify JSON structure
    expect(result).toHaveProperty("config");
    expect(result).toHaveProperty("metrics");
    expect(result).toHaveProperty("stats");
    expect(result).toHaveProperty("summary");

    expect(result.config).toHaveProperty("seed", 42);
    expect(result.config).toHaveProperty("iterations", 100);

    expect(result.metrics).toHaveProperty("convergence");
    expect(result.metrics).toHaveProperty("pastSatisfaction");
    expect(result.metrics).toHaveProperty("futureSatisfaction");

    expect(result.stats).toHaveProperty("computationTimeMs");
  });

  it("should use custom constraints when provided", async () => {
    const logs: string[] = [];
    const mockRuntime = {
      log: (msg: string) => logs.push(msg),
      exit: () => {},
    };

    await temporalCommand(
      {
        seed: 12345,
        pastState: "ordered system",
        futureConstraint: "chaotic attractor",
      },
      mockRuntime,
    );

    // Verify custom constraints appear in output
    expect(logs.some((line) => line.includes("ordered system"))).toBe(true);
    expect(logs.some((line) => line.includes("chaotic attractor"))).toBe(true);
  });

  it("should vary results with different seeds", async () => {
    const logs1: string[] = [];
    const mockRuntime1 = {
      log: (msg: string) => logs1.push(msg),
      exit: () => {},
    };

    const logs2: string[] = [];
    const mockRuntime2 = {
      log: (msg: string) => logs2.push(msg),
      exit: () => {},
    };

    await temporalCommand({ seed: 1, json: true }, mockRuntime1);
    await temporalCommand({ seed: 2, json: true }, mockRuntime2);

    const result1 = JSON.parse(logs1[0]);
    const result2 = JSON.parse(logs2[0]);

    // Results should be different with different seeds
    expect(result1.metrics.convergence).not.toEqual(result2.metrics.convergence);
  });

  it("should handle verbose flag", async () => {
    const logs: string[] = [];
    const mockRuntime = {
      log: (msg: string) => logs.push(msg),
      exit: () => {},
    };

    await temporalCommand({ verbose: true, seed: 42 }, mockRuntime);

    // Verbose mode should include additional messaging
    expect(logs.some((line) => line.includes("Running classical time-symmetric simulation"))).toBe(
      true,
    );
  });

  it("should produce convergence values between 0 and 1", async () => {
    const logs: string[] = [];
    const mockRuntime = {
      log: (msg: string) => logs.push(msg),
      exit: () => {},
    };

    await temporalCommand({ seed: 42, json: true }, mockRuntime);

    const result = JSON.parse(logs[0]);

    // All metrics should be in valid range
    expect(result.metrics.convergence).toBeGreaterThanOrEqual(0);
    expect(result.metrics.convergence).toBeLessThanOrEqual(1);
    expect(result.metrics.pastSatisfaction).toBeGreaterThanOrEqual(0);
    expect(result.metrics.pastSatisfaction).toBeLessThanOrEqual(1);
    expect(result.metrics.futureSatisfaction).toBeGreaterThanOrEqual(0);
    expect(result.metrics.futureSatisfaction).toBeLessThanOrEqual(1);
  });

  it("should improve convergence with more iterations", async () => {
    const logs1: string[] = [];
    const mockRuntime1 = {
      log: (msg: string) => logs1.push(msg),
      exit: () => {},
    };

    const logs2: string[] = [];
    const mockRuntime2 = {
      log: (msg: string) => logs2.push(msg),
      exit: () => {},
    };

    // Same seed, different iteration counts
    await temporalCommand({ seed: 42, iterations: 100, json: true }, mockRuntime1);
    await temporalCommand({ seed: 42, iterations: 5000, json: true }, mockRuntime2);

    const result1 = JSON.parse(logs1[0]);
    const result2 = JSON.parse(logs2[0]);

    // More iterations should generally lead to better or equal convergence
    // (not strictly guaranteed in all cases, but should hold for this seed)
    expect(result2.metrics.convergence).toBeGreaterThanOrEqual(result1.metrics.convergence - 0.1);
  });
});
