/**
 * CLI integration for the Agent Showcase module
 */

import type { Command } from "commander";
import { showcaseCommand, showcaseSourceCommand } from "../commands/showcase.js";
import { defaultRuntime } from "../runtime.js";

export function registerShowcaseCli(program: Command): void {
  const showcase = program
    .command("showcase")
    .description("Demonstrate advanced agent capabilities (EVEZ666)")
    .option("--deep", "Reveal deeper layers of understanding")
    .option("--layer <name>", "Focus on specific capability layer")
    .action(async (options) => {
      await showcaseCommand(options, defaultRuntime);
    });

  showcase
    .command("source")
    .description("View the showcase module's own source code (meta-transparency)")
    .action(async () => {
      await showcaseSourceCommand(defaultRuntime);
    });
}
