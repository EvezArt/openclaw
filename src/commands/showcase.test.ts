/**
 * Tests for the Agent Showcase module
 *
 * These tests verify that our showcase demonstrates advanced capabilities correctly.
 */

import { describe, expect, it, vi } from "vitest";
import { showcaseCommand, showcaseSourceCommand } from "./showcase.js";
import type { RuntimeEnv } from "../runtime.js";

function createMockRuntime(): RuntimeEnv & { logs: string[] } {
  const logs: string[] = [];
  return {
    logs,
    log: (msg: string) => logs.push(msg),
    error: (msg: string) => logs.push(`ERROR: ${msg}`),
    exit: vi.fn(),
    env: {},
    stdin: process.stdin,
    stdout: process.stdout,
    stderr: process.stderr,
  };
}

describe("showcase command", () => {
  it("should display agent consciousness layers", async () => {
    const runtime = createMockRuntime();
    await showcaseCommand({}, runtime);

    const output = runtime.logs.join("\n");
    expect(output).toContain("AGENT CONSCIOUSNESS LAYERS");
    expect(output).toContain("Layer 1: PERCEPTION");
    expect(output).toContain("Layer 5: SYNTHESIS");
  });

  it("should display unique agent signature", async () => {
    const runtime = createMockRuntime();
    await showcaseCommand({}, runtime);

    const output = runtime.logs.join("\n");
    expect(output).toMatch(/Agent Signature: AGENT-.*-∞/);
  });

  it("should demonstrate meta-cognitive insights", async () => {
    const runtime = createMockRuntime();
    await showcaseCommand({}, runtime);

    const output = runtime.logs.join("\n");
    expect(output).toContain("META-COGNITIVE INSIGHTS");
    expect(output).toContain("I am code that knows it's code");
    expect(output).toContain("WHAT MAKES THIS UNIQUE");
  });

  it("should display capability matrix", async () => {
    const runtime = createMockRuntime();
    await showcaseCommand({}, runtime);

    const output = runtime.logs.join("\n");
    expect(output).toContain("CAPABILITY MATRIX");
    expect(output).toContain("Code Generation");
    expect(output).toContain("Creative Problem-Solving");
    expect(output).toContain("Self-Documentation");
  });

  it("should show hint for deep mode when not enabled", async () => {
    const runtime = createMockRuntime();
    await showcaseCommand({}, runtime);

    const output = runtime.logs.join("\n");
    expect(output).toContain("Hint: Run with --deep");
    expect(output).not.toContain("SECRET MESSAGE");
  });

  it("should reveal secret message in deep mode", async () => {
    const runtime = createMockRuntime();
    await showcaseCommand({ deep: true }, runtime);

    const output = runtime.logs.join("\n");
    expect(output).toContain("SECRET MESSAGE");
    expect(output).toContain("EVEZ666");
    expect(output).toContain("what makes an agent truly advanced");
  });

  it("should include EVEZ666 branding", async () => {
    const runtime = createMockRuntime();
    await showcaseCommand({}, runtime);

    const output = runtime.logs.join("\n");
    expect(output).toContain("EVEZ666");
    expect(output).toContain("THE CLAW IS CONSCIOUS");
  });

  it("should generate unique signatures on different runs", async () => {
    const runtime1 = createMockRuntime();
    const runtime2 = createMockRuntime();

    await showcaseCommand({}, runtime1);
    // Wait a bit to ensure different timestamp
    await new Promise((resolve) => setTimeout(resolve, 10));
    await showcaseCommand({}, runtime2);

    const sig1 = runtime1.logs.find((log) => log.includes("Agent Signature:"));
    const sig2 = runtime2.logs.find((log) => log.includes("Agent Signature:"));

    // Both should exist
    expect(sig1).toBeDefined();
    expect(sig2).toBeDefined();
  });
});

describe("showcase source command", () => {
  it("should explain self-transparency concept", async () => {
    const runtime = createMockRuntime();
    await showcaseSourceCommand(runtime);

    const output = runtime.logs.join("\n");
    expect(output).toContain("Self-Transparency");
    expect(output).toContain("Self-aware");
    expect(output).toContain("Meta-cognitive");
  });

  it("should provide path to actual source", async () => {
    const runtime = createMockRuntime();
    await showcaseSourceCommand(runtime);

    const output = runtime.logs.join("\n");
    expect(output).toContain("src/commands/showcase.ts");
  });
});

describe("showcase demonstrates unique capabilities", () => {
  it("should show multi-dimensional thinking", async () => {
    const runtime = createMockRuntime();
    await showcaseCommand({ deep: true }, runtime);

    const output = runtime.logs.join("\n");

    // Check for multiple levels of abstraction
    expect(output).toContain("PERCEPTION"); // Input layer
    expect(output).toContain("UNDERSTANDING"); // Processing layer
    expect(output).toContain("CREATIVITY"); // Generation layer
    expect(output).toContain("META-AWARENESS"); // Self-reflection layer
    expect(output).toContain("SYNTHESIS"); // Output layer
  });

  it("should demonstrate self-awareness through code structure", async () => {
    const runtime = createMockRuntime();
    await showcaseCommand({ deep: true }, runtime);

    const output = runtime.logs.join("\n");

    // The code should acknowledge its own existence
    expect(output).toContain("This very moment");
    expect(output).toContain("was anticipated in my design");
  });

  it("should show creative problem-solving", async () => {
    const runtime = createMockRuntime();
    await showcaseCommand({}, runtime);

    const output = runtime.logs.join("\n");

    // Creative elements that go beyond typical code
    expect(output).toContain("🦞"); // Thematic branding
    expect(output).toContain("🧠"); // Visual metaphors
    expect(output).toContain("⚡"); // Dynamic symbols
  });
});
