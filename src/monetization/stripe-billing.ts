import { createHmac, timingSafeEqual } from "node:crypto";
import { getOpsConfig } from "../config/schema.js";
import { getLogger } from "../logger/index.js";

const config = getOpsConfig();

const logger = getLogger({ module: "stripe-billing" });

export interface BillingUsageEvent {
  customerId: string;
  metric: "signals" | "alerts" | "api_calls";
  quantity: number;
  timestamp: string;
}

export interface BillingPlan {
  id: string;
  monthlyPriceCents: number;
  includedUsage: Record<BillingUsageEvent["metric"], number>;
}

export class StripeBillingService {
  private readonly usageLedger = new Map<string, BillingUsageEvent[]>();

  constructor(private readonly plans: BillingPlan[]) {}

  getPlan(planId: string): BillingPlan {
    const plan = this.plans.find((item) => item.id === planId);
    if (!plan) {
      throw new Error(`Unknown billing plan: ${planId}`);
    }
    return plan;
  }

  trackUsage(event: BillingUsageEvent): void {
    if (event.quantity <= 0) {
      throw new Error("Usage quantity must be positive");
    }

    const events = this.usageLedger.get(event.customerId) ?? [];
    events.push(event);
    this.usageLedger.set(event.customerId, events);
    logger.info(
      { customerId: event.customerId, metric: event.metric, quantity: event.quantity },
      "Usage recorded",
    );
  }

  verifyWebhookSignature(rawPayload: string, stripeSignature: string): boolean {
    const signed = createHmac("sha256", config.STRIPE_WEBHOOK_SECRET)
      .update(rawPayload)
      .digest("hex");
    const safeSigned = Buffer.from(signed, "utf8");
    const safeIncoming = Buffer.from(stripeSignature, "utf8");
    if (safeSigned.length !== safeIncoming.length) {
      return false;
    }
    return timingSafeEqual(safeSigned, safeIncoming);
  }

  getStripeSecretKey(): string {
    return config.STRIPE_SECRET_KEY;
  }
}
