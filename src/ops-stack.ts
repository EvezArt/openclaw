/**
 * Ops Stack
 * Orchestrates all operational modules for OpenClaw
 */

import { Logger } from "tslog";
import {
  createMarketIntelligence,
  type MarketIntelligenceConfig,
} from "./market-intelligence/index.js";
import { createNotifications, type NotificationConfig } from "./notifications/index.js";
import { createAutomation, type AutomationConfig } from "./automation/index.js";
import { createMonetization, type MonetizationConfig } from "./monetization/index.js";
import { createAIEngine, type AIEngineConfig } from "./ai-engine/index.js";

export interface OpsStackConfig {
  marketIntelligence: MarketIntelligenceConfig;
  notifications: NotificationConfig;
  automation: AutomationConfig;
  monetization: MonetizationConfig;
  aiEngine: AIEngineConfig;
}

export interface OpsStackMetrics {
  timestamp: Date;
  modules: {
    marketIntelligence: boolean;
    notifications: boolean;
    automation: boolean;
    monetization: boolean;
    aiEngine: boolean;
  };
  health: "healthy" | "degraded" | "unhealthy";
}

export class OpsStack {
  private config: OpsStackConfig;
  private logger: Logger<unknown>;
  private marketIntelligence: ReturnType<typeof createMarketIntelligence>;
  private notifications: ReturnType<typeof createNotifications>;
  private automation: ReturnType<typeof createAutomation>;
  private monetization: ReturnType<typeof createMonetization>;
  private aiEngine: ReturnType<typeof createAIEngine>;
  private initialized = false;

  constructor(config: OpsStackConfig, logger?: Logger<unknown>) {
    this.config = config;
    this.logger = logger || new Logger({ name: "OpsStack" });

    // Initialize modules
    this.marketIntelligence = createMarketIntelligence(
      config.marketIntelligence,
      this.logger.getSubLogger({ name: "MarketIntelligence" }),
    );
    this.notifications = createNotifications(
      config.notifications,
      this.logger.getSubLogger({ name: "Notifications" }),
    );
    this.automation = createAutomation(
      config.automation,
      this.logger.getSubLogger({ name: "Automation" }),
    );
    this.monetization = createMonetization(
      config.monetization,
      this.logger.getSubLogger({ name: "Monetization" }),
    );
    this.aiEngine = createAIEngine(
      config.aiEngine,
      this.logger.getSubLogger({ name: "AIEngine" }),
    );
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.warn("OpsStack already initialized");
      return;
    }

    this.logger.info("Initializing OpsStack...");

    await Promise.all([
      this.marketIntelligence.initialize(),
      this.notifications.initialize(),
      this.automation.initialize(),
      this.monetization.initialize(),
      this.aiEngine.initialize(),
    ]);

    this.initialized = true;
    this.logger.info("OpsStack initialized successfully");
  }

  async getMetrics(): Promise<OpsStackMetrics> {
    return {
      timestamp: new Date(),
      modules: {
        marketIntelligence: this.config.marketIntelligence.enabled,
        notifications: this.config.notifications.enabled,
        automation: this.config.automation.enabled,
        monetization: this.config.monetization.enabled,
        aiEngine: this.config.aiEngine.enabled,
      },
      health: "healthy",
    };
  }

  getMarketIntelligence() {
    return this.marketIntelligence;
  }

  getNotifications() {
    return this.notifications;
  }

  getAutomation() {
    return this.automation;
  }

  getMonetization() {
    return this.monetization;
  }

  getAIEngine() {
    return this.aiEngine;
  }

  async shutdown(): Promise<void> {
    this.logger.info("Shutting down OpsStack...");

    await Promise.all([
      this.marketIntelligence.shutdown(),
      this.notifications.shutdown(),
      this.automation.shutdown(),
      this.monetization.shutdown(),
      this.aiEngine.shutdown(),
    ]);

    this.initialized = false;
    this.logger.info("OpsStack shutdown complete");
  }
}

/**
 * Create a default OpsStack configuration
 */
export function createDefaultOpsStackConfig(): OpsStackConfig {
  return {
    marketIntelligence: {
      enabled: true,
      updateInterval: 60000,
    },
    notifications: {
      enabled: true,
      channels: ["email", "slack", "webhook"],
      retryAttempts: 3,
    },
    automation: {
      enabled: true,
      maxConcurrentTasks: 10,
      taskTimeout: 300000,
    },
    monetization: {
      enabled: true,
      currency: "USD",
      billingCycle: "monthly",
    },
    aiEngine: {
      enabled: true,
      modelProvider: "anthropic",
      maxConcurrentRequests: 5,
    },
  };
}

/**
 * Create and initialize an OpsStack instance
 */
export async function createOpsStack(
  config?: Partial<OpsStackConfig>,
  logger?: Logger<unknown>,
): Promise<OpsStack> {
  const defaultConfig = createDefaultOpsStackConfig();
  const finalConfig: OpsStackConfig = {
    marketIntelligence: { ...defaultConfig.marketIntelligence, ...config?.marketIntelligence },
    notifications: { ...defaultConfig.notifications, ...config?.notifications },
    automation: { ...defaultConfig.automation, ...config?.automation },
    monetization: { ...defaultConfig.monetization, ...config?.monetization },
    aiEngine: { ...defaultConfig.aiEngine, ...config?.aiEngine },
  };

  const opsStack = new OpsStack(finalConfig, logger);
  await opsStack.initialize();
  return opsStack;
}

// Export module types
export * from "./market-intelligence/index.js";
export * from "./notifications/index.js";
export * from "./automation/index.js";
export * from "./monetization/index.js";
export * from "./ai-engine/index.js";
