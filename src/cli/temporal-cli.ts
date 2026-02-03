import type { Command } from "commander";
import { temporalCommand } from "../commands/temporal.js";
import { defaultRuntime } from "../runtime.js";

/**
 * Register temporal experiment CLI commands
 */
export function registerTemporalCli(program: Command): void {
  const temporal = program
    .command("temporal")
    .description("Run classical time-symmetric simulation experiments");

  temporal
    .command("run")
    .description("Run a temporal experiment simulation")
    .option("--seed <number>", "Random seed for deterministic simulation", parseInteger)
    .option("--iterations <number>", "Number of simulation iterations (default: 1000)", parseInteger)
    .option("--past-state <string>", "Description of past state constraints")
    .option("--future-constraint <string>", "Description of future state constraints")
    .option("--verbose", "Enable detailed output")
    .option("--json", "Output results as JSON")
    .action(async (options) => {
      await temporalCommand(
        {
          seed: options.seed,
          iterations: options.iterations,
          pastState: options.pastState,
          futureConstraint: options.futureConstraint,
          verbose: options.verbose,
          json: options.json,
        },
        defaultRuntime,
      );
    });
}

/**
 * Parse integer from string, return undefined if invalid
 */
function parseInteger(value: string): number | undefined {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? undefined : parsed;
}
