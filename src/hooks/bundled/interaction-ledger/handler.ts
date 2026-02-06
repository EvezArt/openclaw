import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  interactionLedgerEventSchema,
  redactTreasuryMetadata,
  type InteractionLedgerEvent,
  type InteractionLedgerEventName,
} from "../../interaction-ledger-events.js";

function resolveLedgerPath() {
  const stateDir = process.env.OPENCLAW_STATE_DIR?.trim() || path.join(os.homedir(), ".openclaw");
  return path.join(stateDir, "logs", "interaction-ledger.jsonl");
}

export async function emitInteractionLedgerEvent(params: {
  event: InteractionLedgerEventName;
  sessionKey?: string;
  metadata?: InteractionLedgerEvent["metadata"];
}): Promise<InteractionLedgerEvent> {
  const payload = interactionLedgerEventSchema.parse({
    event: params.event,
    timestamp: Date.now(),
    sessionKey: params.sessionKey,
    metadata: redactTreasuryMetadata(params.metadata),
  });

  const filePath = resolveLedgerPath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, `${JSON.stringify(payload)}\n`, "utf-8");
  return payload;
}

export default async function handleInteractionLedgerEvent() {
  return;
}
