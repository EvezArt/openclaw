import { getLogger } from "../../logger/index.js";
import {
  type NotificationAdapter,
  type NotificationDeliveryResult,
  type NotificationMessage,
  type NotificationPriority,
} from "./types.js";
import { TwilioSmsAdapter } from "./twilio.js";

const logger = getLogger({ module: "whatsapp-adapter" });

export interface WhatsAppGatewayClient {
  sendText(input: { to: string; text: string }): Promise<{ id: string }>;
}

export class WhatsAppGatewayAdapter implements NotificationAdapter {
  constructor(private readonly client: WhatsAppGatewayClient) {}

  async send(message: NotificationMessage): Promise<NotificationDeliveryResult> {
    const result = await this.client.sendText({ to: message.to, text: message.body });
    return {
      channel: "whatsapp",
      delivered: true,
      providerMessageId: result.id,
    };
  }
}

const priorityOrder: Record<NotificationPriority, Array<"whatsapp" | "sms">> = {
  CRITICAL: ["sms", "whatsapp"],
  HIGH: ["whatsapp", "sms"],
  MEDIUM: ["whatsapp"],
  LOW: ["whatsapp"],
};

export class PriorityNotificationRouter {
  private readonly smsAdapter = new TwilioSmsAdapter();

  constructor(private readonly whatsappAdapter: WhatsAppGatewayAdapter) {}

  async route(message: NotificationMessage): Promise<NotificationDeliveryResult> {
    const channels = priorityOrder[message.priority];

    let lastError: unknown;
    for (const channel of channels) {
      try {
        if (channel === "sms") {
          return await this.smsAdapter.send(message);
        }
        return await this.whatsappAdapter.send(message);
      } catch (error) {
        lastError = error;
        logger.warn(
          { channel, error, priority: message.priority },
          "Notification delivery attempt failed",
        );
      }
    }

    throw new Error(`Unable to deliver ${message.priority} notification`, { cause: lastError });
  }
}
