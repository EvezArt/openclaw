import { describe, expect, it, vi } from "vitest";

const appendFileMock = vi.fn(async () => {});
const mkdirMock = vi.fn(async () => {});

vi.mock("node:fs/promises", () => ({
  default: {
    appendFile: appendFileMock,
    mkdir: mkdirMock,
  },
}));

describe("interaction-ledger handler", () => {
  it("accepts treasury events and redacts metadata", async () => {
    const { emitInteractionLedgerEvent } = await import("./handler.js");
    const event = await emitInteractionLedgerEvent({
      event: "treasury.tx.submitted",
      sessionKey: "session-1",
      metadata: {
        chainId: 1,
        chainName: "mainnet",
        from: "0x0000000000000000000000000000000000000001",
        to: "0x0000000000000000000000000000000000000002",
        contract: "0x0000000000000000000000000000000000000003",
        calldata: "0xa9059cbb00000000",
        opType: "transfer",
      },
    });

    expect(event.event).toBe("treasury.tx.submitted");
    expect(event.metadata?.from).toMatch(/^hash:/);
    expect(event.metadata?.to).toMatch(/^hash:/);
    expect(event.metadata?.calldata).toMatch(/^sha256:/);
    expect(appendFileMock).toHaveBeenCalledTimes(1);
  });
});
