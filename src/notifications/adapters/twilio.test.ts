import { afterEach, describe, expect, it, vi } from "vitest";
import type { OpsConfig } from "../../config/schema.js";
import { TwilioVoiceCallAdapter } from "./twilio.js";

function createConfig(): OpsConfig {
  return {
    TWILIO_ACCOUNT_SID: "AC123",
    TWILIO_AUTH_TOKEN: "token",
    TWILIO_FROM_NUMBER: "+15550000001",
    TWILIO_TO_NUMBER: "+15550000002",
    BINANCE_API_KEY: "binance-key",
    BINANCE_API_SECRET: "binance-secret",
    BINANCE_BASE_URL: "https://api.binance.com",
    COINGECKO_API_KEY: "cg-key",
    COINGECKO_BASE_URL: "https://api.coingecko.com/api/v3",
    ALPHA_VANTAGE_API_KEY: "alpha-key",
    ALPHA_VANTAGE_BASE_URL: "https://www.alphavantage.co/query",
    OPENAI_API_KEY: "openai-key",
    STRIPE_SECRET_KEY: "stripe-key",
    STRIPE_WEBHOOK_SECRET: "stripe-webhook",
    ENABLE_LIVE_TRADING: false,
    LIVE_TRADING_CONFIRMATION: "I_UNDERSTAND_LIVE_TRADING_RISK",
    LOG_LEVEL: "info",
    OPS_CALL_AUTOMATION_ENABLED: true,
    OPS_CALL_TO_NUMBER: "+15550000003",
  };
}

describe("TwilioVoiceCallAdapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("confirms completed call status", async () => {
    const responses = [
      { ok: true, json: async () => ({ sid: "CA123" }) },
      { ok: true, json: async () => ({ status: "ringing" }) },
      { ok: true, json: async () => ({ status: "completed" }) },
    ];

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => responses.shift() as Response);

    const adapter = new TwilioVoiceCallAdapter(createConfig());
    const result = await adapter.callAndConfirm(
      {
        to: "+15550000004",
        message: "test call",
      },
      { timeoutMs: 2_000, pollIntervalMs: 1 },
    );

    expect(result.providerMessageId).toBe("CA123");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("throws when terminal status is failure", async () => {
    const responses = [
      { ok: true, json: async () => ({ sid: "CA123" }) },
      { ok: true, json: async () => ({ status: "failed" }) },
    ];

    vi.spyOn(globalThis, "fetch").mockImplementation(async () => responses.shift() as Response);

    const adapter = new TwilioVoiceCallAdapter(createConfig());

    await expect(
      adapter.callAndConfirm(
        {
          to: "+15550000004",
          message: "test call",
        },
        { timeoutMs: 2_000, pollIntervalMs: 1 },
      ),
    ).rejects.toThrow("status=failed");
  });
});
