/**
 * Notifications Module
 * 
 * Demonstrates canonical JSON hashing for notification data
 */

import { canonicalize } from 'json-canonicalize';

export interface Notification {
  id: string;
  to: string;
  subject: string;
  message: string;
  channel: 'email' | 'sms' | 'push';
  timestamp: string;
}

/**
 * Create a notification
 */
export function createNotification(params: Omit<Notification, 'id' | 'timestamp'>): Notification {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...params,
  };
}

/**
 * Canonicalize notification for consistent hashing
 */
export function canonicalizeNotification(notification: Notification): string {
  return canonicalize(notification);
}

/**
 * Send a notification (placeholder)
 */
export async function sendNotification(params: Omit<Notification, 'id' | 'timestamp'>): Promise<string> {
  const notification = createNotification(params);
  const canonical = canonicalizeNotification(notification);
  
  // In production, this would actually send the notification
  console.log('Sending notification:', canonical);
  
  return notification.id;
}
