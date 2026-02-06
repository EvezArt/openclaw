import { afterEach, describe, expect, it, vi } from "vitest";

const readFileMock = vi.fn();
const triggerMock = vi.fn(async () => {});
const getBalanceMock = vi.fn(async () => 1_000_000_000_000_000_000n);
const getBlockNumberMock = vi.fn(async () => 99n);
const readContractMock = vi.fn(async () => 5_000_000n);

vi.mock("node:fs/promises", () => ({
  default: {
    readFile: readFileMock,
  },
}));

vi.mock("../hooks/internal-hooks.js", () => ({
  createInternalHookEvent: vi.fn((type, action, sessionKey, context) => ({
    type,
    action,
    sessionKey,
    context,
  })),
  triggerInternalHook: triggerMock,
}));

vi.mock("viem", async () => {
  const actual = await vi.importActual<typeof import("viem")>("viem");
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      getBalance: getBalanceMock,
      getBlockNumber: getBlockNumberMock,
      readContract: readContractMock,
    })),
    http: vi.fn(() => ({})),
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("getInventory", () => {
  it("loads config wallets and returns wallet/escrow/rewards balances", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify([
        {
          address: "0x0000000000000000000000000000000000000001",
          chainId: 1,
          contracts: [
            {
              address: "0x0000000000000000000000000000000000000002",
              source: "escrow",
              asset: "ESCROW",
              decimals: 6,
            },
            {
              address: "0x0000000000000000000000000000000000000003",
              source: "rewards",
              asset: "RWD",
              decimals: 6,
            },
          ],
        },
      ]),
    );

    const { getInventory } = await import("./index.js");
    const balances = await getInventory("session-1");

    expect(balances).toHaveLength(4);
    expect(balances[0]?.asset).toBe("ETH");
    expect(balances[1]?.asset).toBe("USDC");
    expect(balances[2]?.source).toBe("escrow");
    expect(balances[3]?.source).toBe("rewards");
    expect(triggerMock).toHaveBeenCalledTimes(1);
  });
});
