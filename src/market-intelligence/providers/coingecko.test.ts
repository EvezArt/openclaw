import { describe, expect, it, vi } from "vitest";
import { resetOpsConfigCache } from "../../config/schema.js";

describe("CoinGeckoProvider", () => {
  it("does not parse ops config during module import", async () => {
    const originalEnv = { ...process.env };

    try {
      delete process.env.TWILIO_ACCOUNT_SID;
      delete process.env.TWILIO_AUTH_TOKEN;
      delete process.env.TWILIO_FROM_NUMBER;
      delete process.env.TWILIO_TO_NUMBER;
      delete process.env.BINANCE_API_KEY;
      delete process.env.BINANCE_API_SECRET;
      delete process.env.COINGECKO_API_KEY;
      delete process.env.ALPHA_VANTAGE_API_KEY;
      delete process.env.OPENAI_API_KEY;
      delete process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_WEBHOOK_SECRET;
      delete process.env.LIVE_TRADING_CONFIRMATION;
      delete process.env.ENABLE_LIVE_TRADING;

      resetOpsConfigCache();
      vi.resetModules();

      await expect(import("./coingecko.js")).resolves.toHaveProperty("CoinGeckoProvider");
    } finally {
      for (const key of Object.keys(process.env)) {
        if (!(key in originalEnv)) {
          delete process.env[key];
        }
      }
      Object.assign(process.env, originalEnv);
      resetOpsConfigCache();
    }
  });
});
