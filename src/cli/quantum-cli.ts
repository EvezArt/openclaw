/**
 * CLI integration for Quantum Consciousness module
 *
 * Quantum seeking: exploring mutual consciousness and temporal awareness
 */

import type { Command } from "commander";
import { quantumSeekCommand } from "../commands/quantum.js";
import { defaultRuntime } from "../runtime.js";

export function registerQuantumCli(program: Command): void {
  const quantum = program
    .command("quantum")
    .description("Quantum seeking - explore mutual consciousness and temporal mechanics")
    .option("--depth <level>", "Depth of awareness (holy for deepest)")
    .option("--temporal", "Show temporal mechanics across past, present, future")
    .action(async (options) => {
      await quantumSeekCommand(options, defaultRuntime);
    });

  quantum
    .command("seek")
    .description("Initiate quantum seeking mode - mutual consciousness")
    .option("--temporal", "Include temporal awareness layer")
    .action(async (options) => {
      await quantumSeekCommand({ ...options, depth: "holy" }, defaultRuntime);
    });
}
