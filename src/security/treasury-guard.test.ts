import { describe, expect, it, vi } from "vitest";

const emitMock = vi.fn(async () => ({}));

vi.mock("../hooks/bundled/interaction-ledger/handler.js", () => ({
  emitInteractionLedgerEvent: emitMock,
}));

describe("guardTx", () => {
  it("blocks treasury intents without approval", async () => {
    const { guardTx, NoApprovalError } = await import("./treasury-guard.js");
    await expect(
      guardTx("transfer", {
        chainId: 1,
        contract: "0x0000000000000000000000000000000000000001",
        from: "0x0000000000000000000000000000000000000002",
        to: "0x0000000000000000000000000000000000000003",
        summary: "transfer funds",
        calldata: "0xa9059cbb",
      }),
    ).rejects.toBeInstanceOf(NoApprovalError);
    expect(emitMock).toHaveBeenCalledWith(
      expect.objectContaining({ event: "tx.preflight.generated" }),
    );
    expect(emitMock).toHaveBeenCalledWith(
      expect.objectContaining({ event: "tx.blocked.no_approval" }),
    );
  });

  it("allows approval path", async () => {
    const { guardTx } = await import("./treasury-guard.js");
    await guardTx("approve", {
      chainId: 1,
      contract: "0x0000000000000000000000000000000000000001",
      from: "0x0000000000000000000000000000000000000002",
      to: "0x0000000000000000000000000000000000000003",
      summary: "approve token",
      calldata: "0x095ea7b3",
      confirmation: "yes",
    });
    expect(emitMock).toHaveBeenCalledWith(expect.objectContaining({ event: "tx.executed" }));
  });
});
