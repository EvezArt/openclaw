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

export class Automation {
  private config: AutomationConfig;
  private logger: Logger<unknown>;
  private tasks: Map<string, AutomationTask> = new Map();

  constructor(config: AutomationConfig, logger: Logger<unknown>) {
    this.config = config;
    this.logger = logger;
  }

  async initialize(): Promise<void> {
    this.logger.info("Initializing Automation module");
    if (!this.config.enabled) {
      this.logger.info("Automation module is disabled");
      return;
    }
    this.logger.info("Automation module initialized");
  }

  async createTask(name: string, fn: () => Promise<unknown>): Promise<string> {
    const id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const task: AutomationTask = {
      id,
      name,
      status: "pending",
      createdAt: new Date(),
    };

    this.tasks.set(id, task);
    this.logger.info(`Task created: ${id} - ${name}`);

    // Execute task asynchronously
    this.executeTask(id, fn).catch((error) => {
      this.logger.error(`Task ${id} failed:`, error);
    });

    return id;
  }

  private async executeTask(id: string, fn: () => Promise<unknown>): Promise<void> {
    const task = this.tasks.get(id);
    if (!task) {
      return;
    }

    task.status = "running";
    this.logger.debug(`Task ${id} started`);

    try {
      const result = await fn();
      task.status = "completed";
      task.completedAt = new Date();
      task.result = result;
      this.logger.info(`Task ${id} completed`);
    } catch (error) {
      task.status = "failed";
      task.completedAt = new Date();
      task.error = error instanceof Error ? error.message : String(error);
      this.logger.error(`Task ${id} failed:`, error);
    }
  }

  async getTask(id: string): Promise<AutomationTask | undefined> {
    return this.tasks.get(id);
  }

  async listTasks(): Promise<AutomationTask[]> {
    return Array.from(this.tasks.values());
  }

  async shutdown(): Promise<void> {
    this.logger.info("Shutting down Automation module");
  }
}

export function createAutomation(config: AutomationConfig, logger: Logger<unknown>): Automation {
  return new Automation(config, logger);
}
