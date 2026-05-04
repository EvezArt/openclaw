import crypto from "node:crypto";
import { logVerbose } from "../globals.js";
import { createInternalHookEvent, triggerInternalHook } from "./internal-hooks.js";

export const INTERACTION_LEDGER_SCHEMA_VERSION = 1;

type InteractionDirection = "inbound" | "outbound" | "internal";
type InteractionStatus = "accepted" | "started" | "completed" | "sent" | "error" | "skipped";

export type InteractionLedgerContext = {
  version?: number;
  timestamp?: string;
  eventType: "message" | "tool" | "model" | "agent";
  eventName: string;
  direction: InteractionDirection;
  channel?: string;
  accountId?: string;
  sessionKey?: string;
  sessionId?: string;
  runId?: string;
  messageId?: string;
  toolName?: string;
  contentHash?: string;
  redaction?: {
    content?: boolean;
    identifiers?: boolean;
    metadata?: boolean;
  };
  outcome: {
    status: InteractionStatus;
    reason?: string;
    error?: string;
  };
  metadata?: Record<string, unknown>;
};

export function hashInteractionContent(content: string | undefined | null): string | undefined {
  const text = content?.trim();
  if (!text) {
    return undefined;
  }
  return crypto.createHash("sha256").update(text).digest("hex");
}

export function emitInteractionLedgerEvent(params: {
  sessionKey: string;
  action: string;
  context: InteractionLedgerContext;
}): void {
  const event = createInternalHookEvent("interaction", params.action, params.sessionKey, {
    ...params.context,
    version: params.context.version ?? INTERACTION_LEDGER_SCHEMA_VERSION,
    timestamp: params.context.timestamp ?? new Date().toISOString(),
  });

  void triggerInternalHook(event).catch((err) => {
    logVerbose(`interaction-ledger: failed to trigger hook: ${String(err)}`);
  });
}
