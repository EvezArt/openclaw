import { runFull } from "../src/ops/orchestrator.js";

function parseMode(argv: string[]): string {
  const modeArg = argv.find((arg) => arg.startsWith("--mode="));
  return modeArg ? modeArg.split("=")[1] ?? "full" : "full";
}

async function main(): Promise<void> {
  const mode = parseMode(process.argv.slice(2));

  if (mode !== "full") {
    throw new Error(`Unsupported mode: ${mode}. Use --mode=full`);
  }

  await runFull();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
