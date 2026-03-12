import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetOpsConfigCache } from "../config/schema.js";
import { OpsEscalationManager } from "./ops-escalation.js";
import type { NotificationAdapter, NotificationMessage } from "./adapters/types.js";

class MemoryAdapter implements NotificationAdapter {
  public readonly messages: NotificationMessage[] = [];

  async send(message: NotificationMessage) {
    this.messages.push(message);
    return {
      channel: "voice" as const,
      delivered: true,
      providerMessageId: `id-${this.messages.length}`,
    };
  }
}

describe("OpsEscalationManager", () => {
  beforeEach(() => {
    process.env.TWILIO_TO_NUMBER = "+15550000002";
    process.env.TWILIO_ACCOUNT_SID = "ACexample";
    process.env.TWILIO_AUTH_TOKEN = "token";
    process.env.TWILIO_FROM_NUMBER = "+15550000001";
    process.env.BINANCE_API_KEY = "k";
    process.env.BINANCE_API_SECRET = "s";
    process.env.COINGECKO_API_KEY = "cg";
    process.env.ALPHA_VANTAGE_API_KEY = "av";
    process.env.OPENAI_API_KEY = "oa";
    process.env.STRIPE_SECRET_KEY = "sk";
    process.env.STRIPE_WEBHOOK_SECRET = "wh";
    process.env.LIVE_TRADING_CONFIRMATION = "I_UNDERSTAND_LIVE_TRADING_RISK";
    process.env.ENABLE_LIVE_TRADING = "false";
    resetOpsConfigCache();
    vi.resetModules();
  });

  it("sends exactly once per threshold crossing", async () => {
    const adapter = new MemoryAdapter();
    const manager = new OpsEscalationManager(adapter, {
      progressThresholds: [25, 50],
      progressPriority: "HIGH",
      decisionPriority: "CRITICAL",
    });

    await manager.notifyProgress({ completed: 1, total: 4, stage: "config" });
    await manager.notifyProgress({ completed: 2, total: 4, stage: "providers" });
    await manager.notifyProgress({ completed: 3, total: 4, stage: "workers" });

    expect(adapter.messages).toHaveLength(2);
    expect(adapter.messages[0]?.body).toContain("25%");
    expect(adapter.messages[1]?.body).toContain("50%");
  });

  it("raises critical notifications when an operator decision is required", async () => {
    const adapter = new MemoryAdapter();
    const manager = new OpsEscalationManager(adapter);

    await manager.notifyDecisionRequired({
      stage: "workers",
      summary: "Manual approval is needed for live trading.",
    });

    expect(adapter.messages).toHaveLength(1);
    expect(adapter.messages[0]?.priority).toBe("CRITICAL");
    expect(adapter.messages[0]?.body).toContain("Decision required");
  });
});
