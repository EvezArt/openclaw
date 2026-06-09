/**
 * Ops Stack
 * Orchestrates all operational modules for OpenClaw
 */
import { Logger } from "tslog";
import { createMarketIntelligence, } from "./ops-stack/market-intelligence/index.js";
import { createNotifications } from "./ops-stack/notifications/index.js";
import { createAutomation } from "./ops-stack/automation/index.js";
import { createMonetization } from "./ops-stack/monetization/index.js";
import { createAIEngine } from "./ops-stack/ai-engine/index.js";
export class OpsStack {
    config;
    logger;
    marketIntelligence;
    notifications;
    automation;
    monetization;
    aiEngine;
    initialized = false;
    constructor(config, logger) {
        this.config = config;
        this.logger = logger || new Logger({ name: "OpsStack" });
        // Initialize modules
        this.marketIntelligence = createMarketIntelligence(config.marketIntelligence, this.logger.getSubLogger({ name: "MarketIntelligence" }));
        this.notifications = createNotifications(config.notifications, this.logger.getSubLogger({ name: "Notifications" }));
        this.automation = createAutomation(config.automation, this.logger.getSubLogger({ name: "Automation" }));
        this.monetization = createMonetization(config.monetization, this.logger.getSubLogger({ name: "Monetization" }));
        this.aiEngine = createAIEngine(config.aiEngine, this.logger.getSubLogger({ name: "AIEngine" }));
    }
    async initialize() {
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
    async getMetrics() {
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
    async shutdown() {
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
export function createDefaultOpsStackConfig() {
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
export async function createOpsStack(config, logger) {
    const defaultConfig = createDefaultOpsStackConfig();
    const finalConfig = {
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
export * from "./ops-stack/market-intelligence/index.js";
export * from "./ops-stack/notifications/index.js";
export * from "./ops-stack/automation/index.js";
export * from "./ops-stack/monetization/index.js";
export * from "./ops-stack/ai-engine/index.js";
