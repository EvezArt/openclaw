/**
 * Lightning Network BOLT11 Invoice Parser Tests
 */

import { describe, expect, it } from "vitest";
import {
  formatSatoshis,
  isLightningInvoice,
  parseLightningInvoice,
  validateLightningInvoice,
  type LightningInvoice,
} from "./lightning-invoice";

describe("parseLightningInvoice", () => {
  it("should parse mainnet invoice with micro-bitcoin amount", () => {
    const invoice =
      "lnbc13863u1p5c2f7npp5c8tnf04nuqjdjax9vk82gjpy7u2ruxsa2ny2l96v3nfv7tyz69dqsp5y0mfum3vhlh5yr7sslt9fju5tgspa7w2dnp8d5ecejm976matt5qxqy8ayqnp4qf0ru8dxm7pht536amqu6re6jzsf4akdc8y7x9ze3npkcd2fh8he2rzjqwghf7zxvfkxq5a6sr65g0gdkv768p83mhsnt0msszapamzx2qvuxqqqqzudjq473cqqqqqqqqqqqqqq9qrzjq25carzepgd4vqsyn44jrk85ezrpju92xyrk9apw4cdjh6yrwt5jgqqqqzudjq473cqqqqqqqqqqqqqq9qcqzpgdqq9qyyssqyulqsajcufpw7ve4cw9qdrntw4nh05h6ynls8a8e98zfv2x77de8n6u8nws4k994ngm88edzkxds66k2v0nk42ruz5hlg9czj79rhusp9ueqhv";

    const result = parseLightningInvoice(invoice);

    expect(result.valid).toBe(true);
    expect(result.network).toBe("mainnet");
    expect(result.prefix).toBe("lnbc");
    expect(result.amountSatoshis).toBe(1386300); // 13863 * 100
    expect(result.amountBTC).toBeCloseTo(0.013863, 6);
    expect(result.amountFormatted).toBe("13863 uBTC");
    expect(result.error).toBeUndefined();
  });

  it("should parse testnet invoice", () => {
    const invoice = "lntb1000u1p5c2f7n";

    const result = parseLightningInvoice(invoice);

    expect(result.network).toBe("testnet");
    expect(result.prefix).toBe("lntb");
  });

  it("should parse regtest invoice", () => {
    const invoice = "lnbr500m1p5c2f7n";

    const result = parseLightningInvoice(invoice);

    expect(result.network).toBe("regtest");
    expect(result.prefix).toBe("lnbr");
  });

  it("should parse simnet invoice", () => {
    const invoice = "lnsb250n1p5c2f7n";

    const result = parseLightningInvoice(invoice);

    expect(result.network).toBe("simnet");
    expect(result.prefix).toBe("lnsb");
  });

  it("should parse invoice with nano-bitcoin (satoshi) amount", () => {
    const invoice = "lnbc1000n1p5c2f7n";

    const result = parseLightningInvoice(invoice);

    expect(result.valid).toBe(true);
    expect(result.amountSatoshis).toBe(1000); // 1000 * 1
    expect(result.amountBTC).toBeCloseTo(0.00001, 8);
    expect(result.amountFormatted).toBe("1000 nBTC");
  });

  it("should parse invoice with milli-bitcoin amount", () => {
    const invoice = "lnbc5m1p5c2f7n";

    const result = parseLightningInvoice(invoice);

    expect(result.valid).toBe(true);
    expect(result.amountSatoshis).toBe(500000); // 5 * 100000
    expect(result.amountBTC).toBeCloseTo(0.005, 6);
    expect(result.amountFormatted).toBe("5 mBTC");
  });

  it("should parse invoice with pico-bitcoin amount", () => {
    const invoice = "lnbc2500p1p5c2f7n";

    const result = parseLightningInvoice(invoice);

    expect(result.valid).toBe(true);
    expect(result.amountSatoshis).toBe(25); // 2500 * 0.01
    expect(result.amountBTC).toBeCloseTo(0.00000025, 8);
    expect(result.amountFormatted).toBe("2500 pBTC");
  });

  it("should parse invoice with BTC amount (no multiplier)", () => {
    const invoice = "lnbc21p5c2f7n";

    const result = parseLightningInvoice(invoice);

    expect(result.valid).toBe(true);
    expect(result.amountSatoshis).toBe(200000000); // 2 * 100000000
    expect(result.amountBTC).toBe(2);
    expect(result.amountFormatted).toBe("2 BTC");
  });

  it("should handle invoice without amount", () => {
    const invoice = "lnbc1p5c2f7npp5c8tnf04nuqjdjax9vk82gjpy7u2ruxsa";

    const result = parseLightningInvoice(invoice);

    // Even without proper parsing of data part, should recognize format
    expect(result.prefix).toBe("lnbc");
    expect(result.network).toBe("mainnet");
    expect(result.amountSatoshis).toBeUndefined();
    expect(result.amountBTC).toBeUndefined();
  });

  it("should reject empty string", () => {
    const result = parseLightningInvoice("");

    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should reject non-string input", () => {
    // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
    const result = parseLightningInvoice(null as any);

    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should reject invalid network prefix", () => {
    const invoice = "btc123456789";

    const result = parseLightningInvoice(invoice);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("Unknown network prefix");
  });

  it("should reject too short invoice", () => {
    const invoice = "lnbc1";

    const result = parseLightningInvoice(invoice);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid invoice length");
  });

  it("should reject too long invoice", () => {
    const invoice = "lnbc" + "a".repeat(2000);

    const result = parseLightningInvoice(invoice);

    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid invoice length");
  });

  it("should handle whitespace around invoice", () => {
    const invoice = "  lnbc1000u1p5c2f7n  ";

    const result = parseLightningInvoice(invoice);

    expect(result.valid).toBe(true);
    expect(result.prefix).toBe("lnbc");
  });
});

describe("formatSatoshis", () => {
  it("should format small amounts in satoshis", () => {
    expect(formatSatoshis(1000)).toBe("1,000 sats");
    expect(formatSatoshis(50000)).toBe("50,000 sats");
    expect(formatSatoshis(99999)).toBe("99,999 sats");
  });

  it("should format large amounts in BTC", () => {
    expect(formatSatoshis(100000)).toBe("0.00100000 BTC");
    expect(formatSatoshis(1000000)).toBe("0.01000000 BTC");
    expect(formatSatoshis(100000000)).toBe("1.00000000 BTC");
    expect(formatSatoshis(1386300)).toBe("0.01386300 BTC");
  });

  it("should handle zero", () => {
    expect(formatSatoshis(0)).toBe("0 sats");
  });

  it("should handle negative numbers", () => {
    expect(formatSatoshis(-100)).toBe("0 sats");
  });

  it("should handle non-finite numbers", () => {
    expect(formatSatoshis(Number.NaN)).toBe("0 sats");
    expect(formatSatoshis(Number.POSITIVE_INFINITY)).toBe("0 sats");
  });
});

describe("isLightningInvoice", () => {
  it("should recognize mainnet invoices", () => {
    expect(isLightningInvoice("lnbc1000u1p5c2f7n")).toBe(true);
    expect(
      isLightningInvoice(
        "lnbc13863u1p5c2f7npp5c8tnf04nuqjdjax9vk82gjpy7u2ruxsa2ny2l96v3nfv7tyz69dqsp5y0mfum3vhlh5yr7sslt9fju5tgspa7w2dnp8d5ecejm976matt5q",
      ),
    ).toBe(true);
  });

  it("should recognize testnet invoices", () => {
    expect(isLightningInvoice("lntb500m1p5c2f7n")).toBe(true);
  });

  it("should recognize regtest invoices", () => {
    expect(isLightningInvoice("lnbr100n1p5c2f7n")).toBe(true);
  });

  it("should recognize simnet invoices", () => {
    expect(isLightningInvoice("lnsb250u1p5c2f7n")).toBe(true);
  });

  it("should reject non-Lightning strings", () => {
    expect(isLightningInvoice("bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa")).toBe(false);
    expect(isLightningInvoice("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")).toBe(false);
    expect(isLightningInvoice("hello world")).toBe(false);
  });

  it("should reject empty strings", () => {
    expect(isLightningInvoice("")).toBe(false);
  });

  it("should handle whitespace", () => {
    expect(isLightningInvoice("  lnbc1000u1p5c2f7n  ")).toBe(true);
  });

  it("should reject non-string input", () => {
    // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
    expect(isLightningInvoice(null as any)).toBe(false);
    // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input
    expect(isLightningInvoice(undefined as any)).toBe(false);
  });
});

describe("validateLightningInvoice", () => {
  it("should validate correct invoice", () => {
    const result = validateLightningInvoice("lnbc1000u1p5c2f7n");

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should reject invalid invoice", () => {
    const result = validateLightningInvoice("invalid");

    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should provide error message", () => {
    const result = validateLightningInvoice("");

    expect(result.valid).toBe(false);
    expect(result.error).toContain("non-empty string");
  });
});

describe("Lightning invoice integration tests", () => {
  it("should correctly parse the example invoice from problem statement", () => {
    const invoice =
      "lnbc13863u1p5c2f7npp5c8tnf04nuqjdjax9vk82gjpy7u2ruxsa2ny2l96v3nfv7tyz69dqsp5y0mfum3vhlh5yr7sslt9fju5tgspa7w2dnp8d5ecejm976matt5qxqy8ayqnp4qf0ru8dxm7pht536amqu6re6jzsf4akdc8y7x9ze3npkcd2fh8he2rzjqwghf7zxvfkxq5a6sr65g0gdkv768p83mhsnt0msszapamzx2qvuxqqqqzudjq473cqqqqqqqqqqqqqq9qrzjq25carzepgd4vqsyn44jrk85ezrpju92xyrk9apw4cdjh6yrwt5jgqqqqzudjq473cqqqqqqqqqqqqqq9qcqzpgdqq9qyyssqyulqsajcufpw7ve4cw9qdrntw4nh05h6ynls8a8e98zfv2x77de8n6u8nws4k994ngm88edzkxds66k2v0nk42ruz5hlg9czj79rhusp9ueqhv";

    const parsed = parseLightningInvoice(invoice);

    // Verify the invoice is valid
    expect(parsed.valid).toBe(true);

    // Verify network
    expect(parsed.network).toBe("mainnet");
    expect(parsed.prefix).toBe("lnbc");

    // Verify amount calculations
    expect(parsed.amountSatoshis).toBe(1386300);
    expect(parsed.amountBTC).toBeCloseTo(0.013863, 6);
    expect(parsed.amountFormatted).toBe("13863 uBTC");

    // Verify formatted output
    const formatted = formatSatoshis(parsed.amountSatoshis!);
    expect(formatted).toBe("0.01386300 BTC");

    // Verify validation
    const validation = validateLightningInvoice(invoice);
    expect(validation.valid).toBe(true);

    // Verify detection
    expect(isLightningInvoice(invoice)).toBe(true);
  });

  it("should handle real-world invoice examples", () => {
    const examples = [
      { invoice: "lnbc1000n1p5c2f7n", sats: 1000, network: "mainnet" },
      { invoice: "lnbc5m1p5c2f7n", sats: 500000, network: "mainnet" },
      { invoice: "lntb100u1p5c2f7n", sats: 10000, network: "testnet" },
      { invoice: "lnbc2500p1p5c2f7n", sats: 25, network: "mainnet" },
    ];

    for (const example of examples) {
      const parsed = parseLightningInvoice(example.invoice);
      expect(parsed.valid).toBe(true);
      expect(parsed.network).toBe(example.network);
      expect(parsed.amountSatoshis).toBe(example.sats);
    }
  });
});
