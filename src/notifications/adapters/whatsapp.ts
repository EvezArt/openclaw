import { getLogger } from "../../logger/index.js";
import {
  type NotificationAdapter,
  type NotificationChannel,
  type NotificationDeliveryResult,
  type NotificationMessage,
  type NotificationPriority,
} from "./types.js";
import { TwilioSmsAdapter } from "./twilio.js";
import { TwilioVoiceAdapter } from "./twilio-voice.js";

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

const priorityOrder: Record<NotificationPriority, NotificationChannel[]> = {
  CRITICAL: ["voice", "sms", "whatsapp"],
  HIGH: ["sms", "whatsapp"],
  MEDIUM: ["whatsapp", "sms"],
  LOW: ["whatsapp"],
};

export class PriorityNotificationRouter {
  private readonly smsAdapter: NotificationAdapter;
  private readonly voiceAdapter: NotificationAdapter;

  constructor(
    private readonly whatsappAdapter: NotificationAdapter,
    options?: {
      smsAdapter?: NotificationAdapter;
      voiceAdapter?: NotificationAdapter;
    },
  ) {
    this.smsAdapter = options?.smsAdapter ?? new TwilioSmsAdapter();
    this.voiceAdapter = options?.voiceAdapter ?? new TwilioVoiceAdapter();
  }

  async route(message: NotificationMessage): Promise<NotificationDeliveryResult> {
    const channels = priorityOrder[message.priority];

    let lastError: unknown;
    for (const channel of channels) {
      try {
        if (channel === "voice") {
          return await this.voiceAdapter.send(message);
        }

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
