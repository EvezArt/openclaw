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
export declare class Notifications {
    private config;
    private logger;
    private notifications;
    constructor(config: NotificationConfig, logger: Logger<unknown>);
    initialize(): Promise<void>;
    send(notification: Omit<Notification, "id" | "timestamp">): Promise<string>;
    getNotifications(limit?: number): Promise<Notification[]>;
    shutdown(): Promise<void>;
}
export declare function createNotifications(config: NotificationConfig, logger: Logger<unknown>): Notifications;
