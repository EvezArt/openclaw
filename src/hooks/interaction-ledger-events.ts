import crypto from "node:crypto";
import { z } from "zod";

export const interactionLedgerEvents = [
  "tx.preflight.generated",
  "tx.blocked.no_approval",
  "tx.executed",
  "treasury.preflight",
  "treasury.approval.requested",
  "treasury.approval.received",
  "treasury.tx.submitted",
  "treasury.tx.confirmed",
  "treasury.tx.failed",
] as const;

export type InteractionLedgerEventName = (typeof interactionLedgerEvents)[number];

const metadataSchema = z
  .object({
    chainId: z.number().int().optional(),
    chainName: z.string().optional(),
    contract: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    txHash: z.string().optional(),
    opType: z.string().optional(),
    calldata: z.string().optional(),
  })
  .partial();

export const interactionLedgerEventSchema = z.object({
  event: z.enum(interactionLedgerEvents),
  timestamp: z.number(),
  sessionKey: z.string().optional(),
  metadata: metadataSchema.optional(),
});

export type InteractionLedgerEvent = z.infer<typeof interactionLedgerEventSchema>;

function digest(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 16);
}

export function redactAddress(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }
  return `hash:${digest(value.toLowerCase())}`;
}

export function redactCalldata(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }
  return `sha256:${digest(value)}`;
}

export function redactTreasuryMetadata(metadata?: InteractionLedgerEvent["metadata"]) {
  if (!metadata) {
    return undefined;
  }
  return {
    ...metadata,
    from: redactAddress(metadata.from),
    to: redactAddress(metadata.to),
    calldata: redactCalldata(metadata.calldata),
  };
}
