import { Buffer } from "node:buffer";
import { getOpsConfig } from "../../config/schema.js";
import { getLogger } from "../../logger/index.js";
import {
  type NotificationAdapter,
  type NotificationDeliveryResult,
  type NotificationMessage,
} from "./types.js";

const logger = getLogger({ module: "twilio-voice-adapter" });

function toEscapedTwiml(message: string): string {
  const escaped = message
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

  return `<Response><Say voice="alice">${escaped}</Say></Response>`;
}

export class TwilioVoiceAdapter implements NotificationAdapter {
  async send(message: NotificationMessage): Promise<NotificationDeliveryResult> {
    const config = getOpsConfig();
    const body = new URLSearchParams({
      To: message.to,
      From: config.TWILIO_FROM_NUMBER,
      Twiml: toEscapedTwiml(message.body),
    });

    const authToken = Buffer.from(
      `${config.TWILIO_ACCOUNT_SID}:${config.TWILIO_AUTH_TOKEN}`,
    ).toString("base64");
    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.TWILIO_ACCOUNT_SID}/Calls.json`;

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
      logger.error({ status: response.status, errorBody }, "Twilio voice call failed");
      throw new Error(`Twilio voice call failed with status ${response.status}`);
    }

    const payload = (await response.json()) as { sid?: string };
    return {
      channel: "voice",
      delivered: true,
      providerMessageId: payload.sid,
    };
  }
}
