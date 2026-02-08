import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createPublicClient, erc20Abi, formatUnits, getAddress, http } from "viem";
import { arbitrum, base, mainnet } from "viem/chains";
import { z } from "zod";
import { createInternalHookEvent, triggerInternalHook } from "../hooks/internal-hooks.js";

const usdcByChain: Record<number, `0x${string}`> = {
  1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
};

const chainById = {
  1: mainnet,
  42161: arbitrum,
  8453: base,
} as const;

const treasuryContractSchema = z.object({
  address: z.string().transform((value) => getAddress(value)),
  source: z.enum(["escrow", "rewards"]),
  asset: z.string().min(1).default("ERC20"),
  decimals: z.number().int().min(0).max(36).default(18),
});

const treasuryConfigSchema = z.array(
  z.object({
    address: z.string().transform((value) => getAddress(value)),
    chainId: z.union([z.literal(1), z.literal(42161), z.literal(8453)]),
    contracts: z.array(treasuryContractSchema).default([]),
  }),
);

type TreasuryConfig = z.infer<typeof treasuryConfigSchema>;

export type TreasuryBalance = {
  address: string;
  chainName: string;
  asset: string;
  balance: string;
  source: "wallet" | "escrow" | "rewards";
  contract?: string;
  ts: number;
  block: number;
};

function resolveTreasuryConfigPath(): string {
  return path.join(os.homedir(), ".openclaw", "treasury-config.json");
}

async function loadTreasuryConfig(): Promise<TreasuryConfig> {
  const raw = await fs.readFile(resolveTreasuryConfigPath(), "utf-8");
  return treasuryConfigSchema.parse(JSON.parse(raw));
}

async function loadWalletBalances(entry: TreasuryConfig[number]): Promise<TreasuryBalance[]> {
  const chain = chainById[entry.chainId];
  const client = createPublicClient({ chain, transport: http() });
  const [block, nativeBalance] = await Promise.all([
    client.getBlockNumber(),
    client.getBalance({ address: entry.address }),
  ]);

  const rows: TreasuryBalance[] = [
    {
      address: entry.address,
      chainName: chain.name,
      asset: chain.nativeCurrency.symbol,
      balance: formatUnits(nativeBalance, chain.nativeCurrency.decimals),
      source: "wallet",
      ts: Date.now(),
      block: Number(block),
    },
  ];

  const usdcAddress = usdcByChain[entry.chainId];
  const usdcBalance = await client.readContract({
    address: usdcAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [entry.address],
  });
  rows.push({
    address: entry.address,
    chainName: chain.name,
    asset: "USDC",
    balance: formatUnits(usdcBalance, 6),
    source: "wallet",
    contract: usdcAddress,
    ts: Date.now(),
    block: Number(block),
  });

  for (const contract of entry.contracts) {
    const contractBalance = await client.readContract({
      address: contract.address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [entry.address],
    });
    rows.push({
      address: entry.address,
      chainName: chain.name,
      asset: contract.asset,
      balance: formatUnits(contractBalance, contract.decimals),
      source: contract.source,
      contract: contract.address,
      ts: Date.now(),
      block: Number(block),
    });
  }

  return rows;
}

export async function getInventory(sessionKey?: string): Promise<TreasuryBalance[]> {
  const config = await loadTreasuryConfig();
  if (sessionKey) {
    await triggerInternalHook(
      createInternalHookEvent("treasury", "inventory", sessionKey, {
        event: "treasury.inventory",
        walletCount: config.length,
      }),
    );
  }
  const balances = await Promise.all(config.map((entry) => loadWalletBalances(entry)));
  return balances.flat();
}
