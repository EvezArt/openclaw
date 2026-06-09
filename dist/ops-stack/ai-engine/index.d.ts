/**
 * AI Engine Module
 * Provides AI model management, inference, and optimization capabilities
 */
import type { Logger } from "tslog";
export interface AIEngineConfig {
    enabled: boolean;
    modelProvider?: string;
    maxConcurrentRequests?: number;
}
export interface AIRequest {
    id: string;
    prompt: string;
    model?: string;
    timestamp: Date;
    status: "pending" | "processing" | "completed" | "failed";
}
export interface AIResponse {
    requestId: string;
    content: string;
    model: string;
    tokensUsed: number;
    processingTime: number;
}
export declare class AIEngine {
    private config;
    private logger;
    private requests;
    constructor(config: AIEngineConfig, logger: Logger<unknown>);
    initialize(): Promise<void>;
    processRequest(prompt: string, model?: string): Promise<AIResponse>;
    getRequest(id: string): Promise<AIRequest | undefined>;
    getMetrics(): Promise<{
        totalRequests: number;
        completedRequests: number;
        failedRequests: number;
    }>;
    shutdown(): Promise<void>;
}
export declare function createAIEngine(config: AIEngineConfig, logger: Logger<unknown>): AIEngine;
