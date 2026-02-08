import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { HookHandler } from "../../hooks.js";
import {
  INTERACTION_LEDGER_SCHEMA_VERSION,
  type InteractionLedgerContext,
} from "../../interaction-ledger-events.js";

type InteractionLedgerRecord = {
  version: number;
  timestamp: string;
  eventType: InteractionLedgerContext["eventType"];
  eventName: string;
  direction: InteractionLedgerContext["direction"];
  channel: string;
  accountId?: string;
  sessionKey: string;
  sessionId?: string;
  runId?: string;
  messageId?: string;
  toolName?: string;
  contentHash?: string;
  redaction: {
    content: boolean;
    identifiers: boolean;
    metadata: boolean;
  };
  outcome: InteractionLedgerContext["outcome"];
  metadata?: Record<string, unknown>;
};

function toRecord(event: Parameters<HookHandler>[0]): InteractionLedgerRecord | null {
  if (event.type !== "interaction") {
    return null;
  }
  const context = (event.context ?? {}) as Partial<InteractionLedgerContext>;
  const sessionKey = context.sessionKey?.trim() || event.sessionKey?.trim() || "unknown";
  return {
    version: context.version ?? INTERACTION_LEDGER_SCHEMA_VERSION,
    timestamp: context.timestamp ?? event.timestamp.toISOString(),
    eventType: context.eventType ?? "agent",
    eventName: context.eventName ?? event.action,
    direction: context.direction ?? "internal",
    channel: context.channel?.trim() || "unknown",
    accountId: context.accountId,
    sessionKey,
    sessionId: context.sessionId,
    runId: context.runId,
    messageId: context.messageId,
    toolName: context.toolName,
    contentHash: context.contentHash,
    redaction: {
      content: context.redaction?.content ?? true,
      identifiers: context.redaction?.identifiers ?? false,
      metadata: context.redaction?.metadata ?? false,
    },
    outcome: context.outcome ?? { status: "completed", reason: "unspecified" },
    metadata: context.metadata,
  };
}

const interactionLedgerHandler: HookHandler = async (event) => {
  const record = toRecord(event);
  if (!record) {
    return;
  }

  try {
    const stateDir = process.env.OPENCLAW_STATE_DIR?.trim() || path.join(os.homedir(), ".openclaw");
    const logDir = path.join(stateDir, "logs");
    await fs.mkdir(logDir, { recursive: true });
    const logFile = path.join(logDir, "interaction-ledger.jsonl");
    await fs.appendFile(logFile, `${JSON.stringify(record)}\n`, "utf8");
  } catch (err) {
    console.error(
      "[interaction-ledger] Failed to write record:",
      err instanceof Error ? err.message : String(err),
    );
  }
};

export default interactionLedgerHandler;
