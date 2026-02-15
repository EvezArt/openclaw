/**
 * Notifications Module
 * Manages notification delivery across multiple channels
 */

import type { Logger } from "tslog";

export interface NotificationConfig {
  enabled: boolean;
  channels?: string[];
  retryAttempts?: number;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  recipient: string;
  channel: string;
  timestamp: Date;
}

export class Notifications {
  private config: NotificationConfig;
  private logger: Logger<unknown>;
  private notifications: Notification[] = [];

  constructor(config: NotificationConfig, logger: Logger<unknown>) {
    this.config = config;
    this.logger = logger;
  }

  async initialize(): Promise<void> {
    this.logger.info("Initializing Notifications module");
    if (!this.config.enabled) {
      this.logger.info("Notifications module is disabled");
      return;
    }
    this.logger.info("Notifications module initialized");
  }

  async send(notification: Omit<Notification, "id" | "timestamp">): Promise<string> {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const fullNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
    };

    this.notifications.push(fullNotification);
    this.logger.info(`Notification sent: ${id}`);
    return id;
  }

  async getNotifications(limit?: number): Promise<Notification[]> {
    const notifications = [...this.notifications].toReversed();
    return limit ? notifications.slice(0, limit) : notifications;
  }

  async shutdown(): Promise<void> {
    this.logger.info("Shutting down Notifications module");
  }
}

export function createNotifications(
  config: NotificationConfig,
  logger: Logger<unknown>,
): Notifications {
  return new Notifications(config, logger);
}
