import { getLogger } from "../logger/index.js";
import { type OpsConfig } from "../config/schema.js";
import {
  TwilioSmsAdapter,
  TwilioVoiceCallAdapter,
  type VoiceCallAdapter,
} from "./adapters/twilio.js";
import { type NotificationAdapter } from "./adapters/types.js";

const logger = getLogger({ module: "progress-escalation" });

export interface ProgressEscalationManagerOptions {
  recipientNumber: string;
  progressThresholds?: number[];
  enableVoiceCalls: boolean;
}

export class ProgressEscalationManager {
  private readonly notifiedThresholds = new Set<number>();
  private readonly thresholds: number[];

  constructor(
    private readonly smsAdapter: NotificationAdapter,
    private readonly voiceAdapter: VoiceCallAdapter,
    private readonly options: ProgressEscalationManagerOptions,
  ) {
    this.thresholds = (options.progressThresholds ?? [25, 50, 75, 100])
      .map((value) => Math.min(100, Math.max(0, Math.floor(value))))
      .toSorted((left, right) => left - right);
  }

  async notifyProgress(
    taskName: string,
    completedTasks: number,
    totalTasks: number,
  ): Promise<void> {
    if (totalTasks <= 0) {
      return;
    }

    const progress = Math.min(100, Math.floor((completedTasks / totalTasks) * 100));
    const threshold = this.thresholds.find(
      (value) => progress >= value && !this.notifiedThresholds.has(value),
    );

    if (threshold === undefined) {
      return;
    }

    this.notifiedThresholds.add(threshold);
    await this.smsAdapter.send({
      to: this.options.recipientNumber,
      priority: threshold >= 75 ? "HIGH" : "MEDIUM",
      body: `OpenClaw ops progress ${threshold}% reached at task "${taskName}".`,
    });

    logger.info({ threshold, taskName, progress }, "Progress threshold notification sent");
  }

  async notifyDecisionRequired(reason: string): Promise<void> {
    const body = `OpenClaw operator decision required: ${reason}`;

    await this.smsAdapter.send({
      to: this.options.recipientNumber,
      priority: "CRITICAL",
      body,
    });

    if (!this.options.enableVoiceCalls) {
      logger.warn({ reason }, "Voice call escalation disabled; SMS-only decision alert sent");
      return;
    }

    await this.voiceAdapter.callAndConfirm({
      to: this.options.recipientNumber,
      message: body,
    });

    logger.warn({ reason }, "Voice escalation call sent for decision-required event");
  }
}

export function createProgressEscalationManager(config: OpsConfig): ProgressEscalationManager {
  const recipient = config.OPS_CALL_TO_NUMBER || config.TWILIO_TO_NUMBER;
  return new ProgressEscalationManager(
    new TwilioSmsAdapter(config),
    new TwilioVoiceCallAdapter(config),
    {
      recipientNumber: recipient,
      enableVoiceCalls: config.OPS_CALL_AUTOMATION_ENABLED,
    },
  );
}
