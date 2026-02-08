import { emitInteractionLedgerEvent } from "../hooks/bundled/interaction-ledger/handler.js";

const treasuryIntents = ["transfer", "approve", "bridge", "borrow", "claim", "escrowrelease"];

export type TxPreflight = {
  chainId: number;
  contract: string;
  from: string;
  to: string;
  summary: string;
  calldata: string;
  confirmation?: string;
};

export class NoApprovalError extends Error {
  constructor(message = "NO_APPROVAL") {
    super(message);
    this.name = "NoApprovalError";
  }
}

export function isTreasuryIntent(action: string, preflight?: Partial<TxPreflight>): boolean {
  const haystack =
    `${action} ${preflight?.summary ?? ""} ${preflight?.calldata ?? ""}`.toLowerCase();
  return treasuryIntents.some((intent) => haystack.includes(intent));
}

export async function guardTx(action: string, preflight: TxPreflight): Promise<void> {
  if (!isTreasuryIntent(action, preflight)) {
    return;
  }

  await emitInteractionLedgerEvent({
    event: "tx.preflight.generated",
    metadata: {
      chainId: preflight.chainId,
      contract: preflight.contract,
      from: preflight.from,
      to: preflight.to,
      opType: action,
      calldata: preflight.calldata,
    },
  });

  if (!preflight.confirmation) {
    await emitInteractionLedgerEvent({
      event: "tx.blocked.no_approval",
      metadata: {
        chainId: preflight.chainId,
        contract: preflight.contract,
        from: preflight.from,
        to: preflight.to,
        opType: action,
      },
    });
    throw new NoApprovalError();
  }

  await emitInteractionLedgerEvent({
    event: "tx.executed",
    metadata: {
      chainId: preflight.chainId,
      contract: preflight.contract,
      from: preflight.from,
      to: preflight.to,
      opType: action,
      calldata: preflight.calldata,
    },
  });
}
