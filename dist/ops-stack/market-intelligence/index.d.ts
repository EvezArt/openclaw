/**
 * Market Intelligence Module
 * Provides market analysis, trend detection, and intelligence gathering capabilities
 */
import type { Logger } from "tslog";
export interface MarketIntelligenceConfig {
    enabled: boolean;
    dataSource?: string;
    updateInterval?: number;
}
export interface MarketData {
    timestamp: Date;
    metrics: Record<string, number | string>;
    trends: string[];
}
export declare class MarketIntelligence {
    private config;
    private logger;
    constructor(config: MarketIntelligenceConfig, logger: Logger<unknown>);
    initialize(): Promise<void>;
    getMarketData(): Promise<MarketData>;
    analyzeTrends(): Promise<string[]>;
    shutdown(): Promise<void>;
}
export declare function createMarketIntelligence(config: MarketIntelligenceConfig, logger: Logger<unknown>): MarketIntelligence;
