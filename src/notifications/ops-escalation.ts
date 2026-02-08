import { getOpsConfig } from "../config/schema.js";
import { getLogger } from "../logger/index.js";
import type { NotificationAdapter, NotificationPriority } from "./adapters/types.js";

const logger = getLogger({ module: "ops-escalation" });

export interface ProgressUpdate {
  completed: number;
  total: number;
  stage: string;
}

export interface DecisionRequest {
  summary: string;
  stage: string;
}

export interface OpsEscalationPolicy {
  progressThresholds: number[];
  decisionPriority?: NotificationPriority;
  progressPriority?: NotificationPriority;
}

export class OpsEscalationManager {
  private readonly reachedThresholds = new Set<number>();

  constructor(
    private readonly adapter: NotificationAdapter,
    private readonly policy: OpsEscalationPolicy = {
      progressThresholds: [50, 100],
      progressPriority: "HIGH",
      decisionPriority: "CRITICAL",
    },
  ) {}

  async notifyProgress(update: ProgressUpdate): Promise<void> {
    if (update.total <= 0) {
      throw new Error("Total step count must be greater than zero");
    }

    const percent = Math.floor((update.completed / update.total) * 100);

    for (const threshold of this.policy.progressThresholds) {
      if (percent >= threshold && !this.reachedThresholds.has(threshold)) {
        this.reachedThresholds.add(threshold);
        await this.send(
          this.policy.progressPriority ?? "HIGH",
          `Agent progress reached ${threshold}% at stage ${update.stage}. Completed ${update.completed} of ${update.total} tasks.`,
        );
      }
    }
  }

  async notifyDecisionRequired(request: DecisionRequest): Promise<void> {
    await this.send(
      this.policy.decisionPriority ?? "CRITICAL",
      `Decision required at stage ${request.stage}. ${request.summary}`,
    );
  }

  private async send(priority: NotificationPriority, body: string): Promise<void> {
    const config = getOpsConfig();
    await this.adapter.send({
      to: config.TWILIO_TO_NUMBER,
      body,
      priority,
    });
    logger.info({ priority }, "Escalation dispatched");
  }
}
