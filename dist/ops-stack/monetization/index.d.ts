/**
 * Monetization Module
 * Handles billing, subscriptions, and revenue tracking
 */
import type { Logger } from "tslog";
export interface MonetizationConfig {
    enabled: boolean;
    currency?: string;
    billingCycle?: "monthly" | "yearly";
}
export interface RevenueMetrics {
    totalRevenue: number;
    activeSubscriptions: number;
    churnRate: number;
    averageRevenuePerUser: number;
}
export interface Subscription {
    id: string;
    userId: string;
    plan: string;
    status: "active" | "cancelled" | "expired";
    startDate: Date;
    endDate?: Date;
    amount: number;
}
export declare class Monetization {
    private config;
    private logger;
    private subscriptions;
    constructor(config: MonetizationConfig, logger: Logger<unknown>);
    initialize(): Promise<void>;
    createSubscription(userId: string, plan: string, amount: number): Promise<string>;
    getRevenueMetrics(): Promise<RevenueMetrics>;
    getSubscription(id: string): Promise<Subscription | undefined>;
    shutdown(): Promise<void>;
}
export declare function createMonetization(config: MonetizationConfig, logger: Logger<unknown>): Monetization;
