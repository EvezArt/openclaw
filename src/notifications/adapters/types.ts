export type NotificationPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface NotificationMessage {
  to: string;
  body: string;
  priority: NotificationPriority;
  subject?: string;
}

export interface NotificationDeliveryResult {
  channel: "sms" | "whatsapp" | "voice";
  delivered: boolean;
  providerMessageId?: string;
}

export interface NotificationAdapter {
  send(message: NotificationMessage): Promise<NotificationDeliveryResult>;
}
