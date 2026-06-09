/**
 * Automation Module
 * Provides workflow automation and task scheduling capabilities
 */
import type { Logger } from "tslog";
export interface AutomationConfig {
    enabled: boolean;
    maxConcurrentTasks?: number;
    taskTimeout?: number;
}
export interface AutomationTask {
    id: string;
    name: string;
    status: "pending" | "running" | "completed" | "failed";
    createdAt: Date;
    completedAt?: Date;
    result?: unknown;
    error?: string;
}
export declare class Automation {
    private config;
    private logger;
    private tasks;
    constructor(config: AutomationConfig, logger: Logger<unknown>);
    initialize(): Promise<void>;
    createTask(name: string, fn: () => Promise<unknown>): Promise<string>;
    private executeTask;
    getTask(id: string): Promise<AutomationTask | undefined>;
    listTasks(): Promise<AutomationTask[]>;
    shutdown(): Promise<void>;
}
export declare function createAutomation(config: AutomationConfig, logger: Logger<unknown>): Automation;
