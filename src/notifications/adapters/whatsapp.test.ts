import { describe, expect, it } from "vitest";
import {
  PriorityNotificationRouter,
  type WhatsAppGatewayClient,
  WhatsAppGatewayAdapter,
} from "./whatsapp.js";
import type { NotificationAdapter, NotificationMessage } from "./types.js";

class FailingAdapter implements NotificationAdapter {
  constructor(private readonly error: Error) {}

  async send(): Promise<never> {
    throw this.error;
  }
}

describe("PriorityNotificationRouter", () => {
  it("falls back from voice to sms for critical notifications", async () => {
    const sent: NotificationMessage[] = [];
    const smsAdapter: NotificationAdapter = {
      async send(message) {
        sent.push(message);
        return { channel: "sms", delivered: true };
      },
    };
    const voiceAdapter = new FailingAdapter(new Error("voice failed"));
    const whatsappAdapter: NotificationAdapter = {
      async send() {
        throw new Error("should not reach whatsapp");
      },
    };

    const router = new PriorityNotificationRouter(whatsappAdapter, {
      smsAdapter,
      voiceAdapter,
    });

    const result = await router.route({
      to: "+15550000002",
      body: "critical test",
      priority: "CRITICAL",
    });

    expect(result.channel).toBe("sms");
    expect(sent).toHaveLength(1);
  });

  it("uses whatsapp when high-priority sms path fails", async () => {
    const sentViaWhatsApp: NotificationMessage[] = [];
    const gateway: WhatsAppGatewayClient = {
      async sendText(input) {
        sentViaWhatsApp.push({
          to: input.to,
          body: input.text,
          priority: "HIGH",
        });
        return { id: "wa-1" };
      },
    };

    const router = new PriorityNotificationRouter(new WhatsAppGatewayAdapter(gateway), {
      smsAdapter: new FailingAdapter(new Error("sms failed")),
    });

    const result = await router.route({
      to: "+15550000002",
      body: "high test",
      priority: "HIGH",
    });

    expect(result.channel).toBe("whatsapp");
    expect(sentViaWhatsApp).toHaveLength(1);
  });
});
