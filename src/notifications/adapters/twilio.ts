import { Buffer } from "node:buffer";
import { getOpsConfig } from "../../config/schema.js";
import { getLogger } from "../../logger/index.js";
import {
  type NotificationAdapter,
  type NotificationDeliveryResult,
  type NotificationMessage,
} from "./types.js";

const logger = getLogger({ module: "twilio-adapter" });

export class TwilioSmsAdapter implements NotificationAdapter {
  async send(message: NotificationMessage): Promise<NotificationDeliveryResult> {
    const config = getOpsConfig();
    const body = new URLSearchParams({
      To: message.to,
      From: config.TWILIO_FROM_NUMBER,
      Body: message.body,
    });

    const authToken = Buffer.from(
      `${config.TWILIO_ACCOUNT_SID}:${config.TWILIO_AUTH_TOKEN}`,
    ).toString("base64");
    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.TWILIO_ACCOUNT_SID}/Messages.json`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error({ status: response.status, errorBody }, "Twilio message failed");
      throw new Error(`Twilio message failed with status ${response.status}`);
    }

    const payload = (await response.json()) as { sid?: string };
    return {
      channel: "sms",
      delivered: true,
      providerMessageId: payload.sid,
    };
  }
}
