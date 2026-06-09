/**
 * Ops Stack
 * Orchestrates all operational modules for OpenClaw
 */
import { Logger } from "tslog";
import { type MarketIntelligenceConfig } from "./ops-stack/market-intelligence/index.js";
import { type NotificationConfig } from "./ops-stack/notifications/index.js";
import { type AutomationConfig } from "./ops-stack/automation/index.js";
import { type MonetizationConfig } from "./ops-stack/monetization/index.js";
import { type AIEngineConfig } from "./ops-stack/ai-engine/index.js";
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
export declare class OpsStack {
    private config;
    private logger;
    private marketIntelligence;
    private notifications;
    private automation;
    private monetization;
    private aiEngine;
    private initialized;
    constructor(config: OpsStackConfig, logger?: Logger<unknown>);
    initialize(): Promise<void>;
    getMetrics(): Promise<OpsStackMetrics>;
    getMarketIntelligence(): import("./ops-stack/market-intelligence/index.js").MarketIntelligence;
    getNotifications(): import("./ops-stack/notifications/index.js").Notifications;
    getAutomation(): import("./ops-stack/automation/index.js").Automation;
    getMonetization(): import("./ops-stack/monetization/index.js").Monetization;
    getAIEngine(): import("./ops-stack/ai-engine/index.js").AIEngine;
    shutdown(): Promise<void>;
}
/**
 * Create a default OpsStack configuration
 */
export declare function createDefaultOpsStackConfig(): OpsStackConfig;
/**
 * Create and initialize an OpsStack instance
 */
export declare function createOpsStack(config?: Partial<OpsStackConfig>, logger?: Logger<unknown>): Promise<OpsStack>;
export * from "./ops-stack/market-intelligence/index.js";
export * from "./ops-stack/notifications/index.js";
export * from "./ops-stack/automation/index.js";
export * from "./ops-stack/monetization/index.js";
export * from "./ops-stack/ai-engine/index.js";
