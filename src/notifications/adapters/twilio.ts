import { Buffer } from "node:buffer";
import { getOpsConfig, type OpsConfig } from "../../config/schema.js";
import { getLogger } from "../../logger/index.js";
import {
  type NotificationAdapter,
  type NotificationDeliveryResult,
  type NotificationMessage,
} from "./types.js";

const logger = getLogger({ module: "twilio-adapter" });

export interface VoiceCallMessage {
  to: string;
  message: string;
}

export type TwilioCallStatus =
  | "queued"
  | "ringing"
  | "in-progress"
  | "completed"
  | "busy"
  | "failed"
  | "no-answer"
  | "canceled";

export interface VoiceCallConfirmationOptions {
  timeoutMs?: number;
  pollIntervalMs?: number;
}

export interface VoiceCallAdapter {
  call(message: VoiceCallMessage): Promise<NotificationDeliveryResult>;
  callAndConfirm(
    message: VoiceCallMessage,
    options?: VoiceCallConfirmationOptions,
  ): Promise<NotificationDeliveryResult>;
}

export class TwilioSmsAdapter implements NotificationAdapter {
  constructor(private readonly config: OpsConfig = getOpsConfig()) {}

  async send(message: NotificationMessage): Promise<NotificationDeliveryResult> {
    const body = new URLSearchParams({
      To: message.to,
      From: this.config.TWILIO_FROM_NUMBER,
      Body: message.body,
    });

    const response = await fetch(this.getTwilioUrl("Messages"), {
      method: "POST",
      headers: this.getHeaders(),
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

  private getTwilioUrl(endpoint: "Messages" | "Calls"): string {
    return `https://api.twilio.com/2010-04-01/Accounts/${this.config.TWILIO_ACCOUNT_SID}/${endpoint}.json`;
  }

  private getHeaders(): Record<string, string> {
    const authToken = Buffer.from(
      `${this.config.TWILIO_ACCOUNT_SID}:${this.config.TWILIO_AUTH_TOKEN}`,
    ).toString("base64");

    return {
      Authorization: `Basic ${authToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    };
  }
}

export class TwilioVoiceCallAdapter implements VoiceCallAdapter {
  constructor(private readonly config: OpsConfig = getOpsConfig()) {}

  async call(message: VoiceCallMessage): Promise<NotificationDeliveryResult> {
    const twiml = `<Response><Say voice="alice">${escapeTwiml(message.message)}</Say></Response>`;
    const body = new URLSearchParams({
      To: message.to,
      From: this.config.TWILIO_FROM_NUMBER,
      Twiml: twiml,
    });

    const response = await fetch(this.getCallBaseUrl(), {
      method: "POST",
      headers: this.getHeaders(),
      body,
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error({ status: response.status, errorBody }, "Twilio call failed");
      throw new Error(`Twilio call failed with status ${response.status}`);
    }

    const payload = (await response.json()) as { sid?: string };
    return {
      channel: "voice",
      delivered: true,
      providerMessageId: payload.sid,
    };
  }

  async callAndConfirm(
    message: VoiceCallMessage,
    options: VoiceCallConfirmationOptions = {},
  ): Promise<NotificationDeliveryResult> {
    const initial = await this.call(message);
    const callSid = initial.providerMessageId;

    if (!callSid) {
      throw new Error("Twilio call SID missing; unable to confirm call outcome");
    }

    const status = await this.waitForCompletion(callSid, options);
    if (status !== "completed") {
      throw new Error(`Twilio call did not complete successfully (status=${status})`);
    }

    logger.info({ callSid, status }, "Twilio call confirmed as completed");
    return initial;
  }

  private async waitForCompletion(
    callSid: string,
    options: VoiceCallConfirmationOptions,
  ): Promise<TwilioCallStatus> {
    const timeoutMs = options.timeoutMs ?? 120_000;
    const pollIntervalMs = options.pollIntervalMs ?? 2_000;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const status = await this.fetchCallStatus(callSid);
      if (isTerminalStatus(status)) {
        return status;
      }
      await sleep(pollIntervalMs);
    }

    throw new Error(`Timed out waiting for Twilio call ${callSid} completion`);
  }

  private async fetchCallStatus(callSid: string): Promise<TwilioCallStatus> {
    const response = await fetch(`${this.getCallBaseUrl().replace(".json", "")}/${callSid}.json`, {
      method: "GET",
      headers: this.getHeaders(),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error(
        { status: response.status, errorBody, callSid },
        "Twilio call status check failed",
      );
      throw new Error(`Twilio call status check failed with status ${response.status}`);
    }

    const payload = (await response.json()) as { status?: string };
    const status = payload.status as TwilioCallStatus | undefined;
    if (!status) {
      throw new Error(`Twilio call status missing for ${callSid}`);
    }
    return status;
  }

  private getCallBaseUrl(): string {
    return `https://api.twilio.com/2010-04-01/Accounts/${this.config.TWILIO_ACCOUNT_SID}/Calls.json`;
  }

  private getHeaders(): Record<string, string> {
    const authToken = Buffer.from(
      `${this.config.TWILIO_ACCOUNT_SID}:${this.config.TWILIO_AUTH_TOKEN}`,
    ).toString("base64");

    return {
      Authorization: `Basic ${authToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    };
  }
}

function isTerminalStatus(status: TwilioCallStatus): boolean {
  return (
    status === "completed" ||
    status === "busy" ||
    status === "failed" ||
    status === "no-answer" ||
    status === "canceled"
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeTwiml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
