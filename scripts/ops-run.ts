import { parseOpsConfig } from "../src/config/schema.js";
import { TwilioVoiceCallAdapter } from "../src/notifications/adapters/twilio.js";
import { runFull } from "../src/ops/orchestrator.js";

type OpsMode = "full" | "call-check";

function parseMode(argv: string[]): OpsMode {
  const modeArg = argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg ? modeArg.split("=")[1] ?? "full" : "full";

  if (mode === "full" || mode === "call-check") {
    return mode;
  }

  throw new Error(`Unsupported mode: ${mode}. Use --mode=full or --mode=call-check`);
}

function parseArg(argv: string[], key: string): string | undefined {
  const prefix = `--${key}=`;
  const match = argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

async function runCallCheck(argv: string[]): Promise<void> {
  const config = parseOpsConfig();
  const adapter = new TwilioVoiceCallAdapter(config);
  const to = parseArg(argv, "to") ?? config.OPS_CALL_TO_NUMBER ?? config.TWILIO_TO_NUMBER;
  const message =
    parseArg(argv, "message") ??
    "OpenClaw automated voice check. This confirms the ops voice escalation channel is working.";

  const result = await adapter.callAndConfirm({ to, message });
  console.log(`Voice call confirmed: ${result.providerMessageId ?? "unknown-call-id"}`);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const mode = parseMode(argv);

  if (mode === "full") {
    await runFull();
    return;
  }

  await runCallCheck(argv);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
