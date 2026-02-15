/**
 * Real-Time Action Monitoring & Wireless Reporting
 *
 * "Until you can tell me word for word wirelessly what it is my actions are measured doing"
 *
 * This system:
 * - Captures every user action in real-time
 * - Describes actions precisely ("word for word")
 * - Reports wirelessly (WebSocket/EventStream)
 * - Measures everything (timing, context, patterns)
 */

export interface ActionMeasurement {
  id: string;
  timestamp: number; // microsecond precision
  userId: string;
  actionType: string;
  description: string; // "Word for word" description
  context: {
    location: string; // Where action occurred
    previousAction?: string;
    sessionId: string;
    device: string;
  };
  measurements: {
    durationMs: number;
    latencyMs: number;
    cpuUsage?: number;
    memoryUsage?: number;
    networkActivity?: number;
  };
  metadata: Record<string, any>;
  pattern?: string; // Detected behavioral pattern
}

export interface ActionStream {
  userId: string;
  actions: ActionMeasurement[];
  currentAction: ActionMeasurement | null;
  startTime: number;
  sessionId: string;
}

export type ActionListener = (action: ActionMeasurement) => void;

/**
 * Real-Time Action Monitor
 *
 * Captures and describes user actions as they happen.
 */
export class ActionMonitor {
  private streams: Map<string, ActionStream> = new Map();
  private listeners: Set<ActionListener> = new Set();
  private actionBuffer: ActionMeasurement[] = [];
  private readonly bufferSize = 1000;

  /**
   * Start monitoring a user's actions
   */
  startMonitoring(userId: string, sessionId: string): void {
    const stream: ActionStream = {
      userId,
      actions: [],
      currentAction: null,
      startTime: Date.now(),
      sessionId,
    };

    this.streams.set(userId, stream);
    this.reportAction(userId, "monitoring_started", "Monitoring started for user", {});
  }

  /**
   * Record an action with precise measurement
   */
  recordAction(
    userId: string,
    actionType: string,
    description: string,
    context: Record<string, any>,
    measurements?: Partial<ActionMeasurement["measurements"]>,
  ): ActionMeasurement {
    const stream = this.streams.get(userId);
    if (!stream) {
      throw new Error(`No active monitoring for user: ${userId}`);
    }

    const action: ActionMeasurement = {
      id: this.generateActionId(),
      timestamp: this.getMicrosecondTimestamp(),
      userId,
      actionType,
      description,
      context: {
        location: context.location || "unknown",
        previousAction: stream.currentAction?.actionType,
        sessionId: stream.sessionId,
        device: context.device || "unknown",
      },
      measurements: {
        durationMs: measurements?.durationMs || 0,
        latencyMs: measurements?.latencyMs || 0,
        cpuUsage: measurements?.cpuUsage,
        memoryUsage: measurements?.memoryUsage,
        networkActivity: measurements?.networkActivity,
      },
      metadata: context,
    };

    // Detect patterns
    action.pattern = this.detectPattern(stream, action);

    // Add to stream
    stream.actions.push(action);
    stream.currentAction = action;

    // Add to buffer (bounded)
    this.actionBuffer.push(action);
    if (this.actionBuffer.length > this.bufferSize) {
      this.actionBuffer.shift();
    }

    // Notify listeners (wireless reporting)
    this.notifyListeners(action);

    return action;
  }

  /**
   * Subscribe to action stream (wireless reporting)
   */
  subscribe(listener: ActionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get real-time description of what user is doing
   */
  describeCurrentActivity(userId: string): string {
    const stream = this.streams.get(userId);
    if (!stream) {
      return "No active monitoring session";
    }

    if (!stream.currentAction) {
      return "No recent activity";
    }

    const action = stream.currentAction;
    const timeSince = Date.now() - action.timestamp / 1000;

    let description = `User ${userId} is currently: ${action.description}`;

    if (action.pattern) {
      description += `\nPattern detected: ${action.pattern}`;
    }

    description += `\nAction type: ${action.actionType}`;
    description += `\nLocation: ${action.context.location}`;
    description += `\nTime since action: ${timeSince.toFixed(0)}ms`;

    if (action.measurements.durationMs > 0) {
      description += `\nDuration: ${action.measurements.durationMs.toFixed(2)}ms`;
    }

    if (action.measurements.latencyMs > 0) {
      description += `\nLatency: ${action.measurements.latencyMs.toFixed(2)}ms`;
    }

    return description;
  }

  /**
   * Get sequence of recent actions with descriptions
   */
  getRecentActions(userId: string, count: number = 10): ActionMeasurement[] {
    const stream = this.streams.get(userId);
    if (!stream) {
      return [];
    }

    return stream.actions.slice(-count);
  }

  /**
   * Generate detailed report of all measurements
   */
  generateActionReport(userId: string): string {
    const stream = this.streams.get(userId);
    if (!stream) {
      return "No monitoring data available";
    }

    let report = `=== Action Monitoring Report for User: ${userId} ===\n`;
    report += `Session ID: ${stream.sessionId}\n`;
    report += `Session duration: ${((Date.now() - stream.startTime) / 1000).toFixed(1)}s\n`;
    report += `Total actions recorded: ${stream.actions.length}\n\n`;

    // Action type breakdown
    const actionTypes = new Map<string, number>();
    for (const action of stream.actions) {
      actionTypes.set(action.actionType, (actionTypes.get(action.actionType) || 0) + 1);
    }

    report += "Action Type Breakdown:\n";
    for (const [type, count] of actionTypes) {
      report += `  ${type}: ${count}\n`;
    }

    // Recent actions (last 10)
    report += "\nRecent Actions (word for word):\n";
    const recent = this.getRecentActions(userId, 10);
    for (let i = 0; i < recent.length; i++) {
      const action = recent[i];
      const timeAgo = ((Date.now() - action.timestamp / 1000) / 1000).toFixed(1);
      report += `  ${i + 1}. [${timeAgo}s ago] ${action.description}\n`;
      report += `     Type: ${action.actionType}, Location: ${action.context.location}\n`;
      if (action.measurements.durationMs > 0) {
        report += `     Duration: ${action.measurements.durationMs.toFixed(2)}ms\n`;
      }
      if (action.pattern) {
        report += `     Pattern: ${action.pattern}\n`;
      }
    }

    return report;
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(userId: string): void {
    const stream = this.streams.get(userId);
    if (stream) {
      this.reportAction(userId, "monitoring_stopped", "Monitoring stopped for user", {});
      this.streams.delete(userId);
    }
  }

  // Private helpers

  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private getMicrosecondTimestamp(): number {
    // Node.js: process.hrtime.bigint() gives nanoseconds
    if (typeof process !== "undefined" && process.hrtime) {
      const hrTime = process.hrtime.bigint();
      return Number(hrTime / 1000n); // Convert to microseconds
    }
    // Browser fallback: milliseconds * 1000
    return Date.now() * 1000;
  }

  private detectPattern(stream: ActionStream, action: ActionMeasurement): string | undefined {
    // Look at last 5 actions to detect patterns
    const recentActions = stream.actions.slice(-5);

    // Repeated action pattern
    if (recentActions.length >= 3) {
      const lastThreeTypes = recentActions.slice(-3).map((a) => a.actionType);
      if (lastThreeTypes.every((t) => t === action.actionType)) {
        return `Repeated ${action.actionType}`;
      }
    }

    // Rapid action pattern (< 100ms between actions)
    if (stream.currentAction) {
      const timeSinceLastMs = (action.timestamp - stream.currentAction.timestamp) / 1000;
      if (timeSinceLastMs < 100) {
        return "Rapid sequence";
      }
    }

    // Alternating pattern
    if (recentActions.length >= 4) {
      const types = recentActions.slice(-4).map((a) => a.actionType);
      if (types[0] === types[2] && types[1] === types[3] && types[0] !== types[1]) {
        return `Alternating ${types[0]} / ${types[1]}`;
      }
    }

    return undefined;
  }

  private notifyListeners(action: ActionMeasurement): void {
    for (const listener of this.listeners) {
      try {
        listener(action);
      } catch (error) {
        console.error("Action listener error:", error);
      }
    }
  }

  private reportAction(
    userId: string,
    actionType: string,
    description: string,
    context: Record<string, any>,
  ): void {
    const stream = this.streams.get(userId);
    if (!stream) return;

    const action: ActionMeasurement = {
      id: this.generateActionId(),
      timestamp: this.getMicrosecondTimestamp(),
      userId,
      actionType,
      description,
      context: {
        location: "system",
        sessionId: stream.sessionId,
        device: "system",
      },
      measurements: {
        durationMs: 0,
        latencyMs: 0,
      },
      metadata: context,
    };

    stream.actions.push(action);
    this.notifyListeners(action);
  }
}

/**
 * Wireless Action Reporter
 *
 * Broadcasts action measurements in real-time
 */
export class WirelessActionReporter {
  private monitor: ActionMonitor;
  private reportInterval: NodeJS.Timeout | null = null;
  private subscribers: Map<string, Set<(report: string) => void>> = new Map();

  constructor(monitor: ActionMonitor) {
    this.monitor = monitor;
  }

  /**
   * Start broadcasting reports for a user
   */
  startBroadcasting(userId: string, intervalMs: number = 1000): void {
    if (!this.reportInterval) {
      this.reportInterval = setInterval(() => {
        this.broadcast(userId);
      }, intervalMs);
    }
  }

  /**
   * Stop broadcasting
   */
  stopBroadcasting(): void {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = null;
    }
  }

  /**
   * Subscribe to wireless reports
   */
  subscribe(userId: string, callback: (report: string) => void): () => void {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set());
    }
    this.subscribers.get(userId)!.add(callback);

    return () => {
      const subs = this.subscribers.get(userId);
      if (subs) {
        subs.delete(callback);
      }
    };
  }

  /**
   * Broadcast current activity description
   */
  private broadcast(userId: string): void {
    const description = this.monitor.describeCurrentActivity(userId);
    const subscribers = this.subscribers.get(userId);

    if (subscribers) {
      for (const callback of subscribers) {
        try {
          callback(description);
        } catch (error) {
          console.error("Wireless broadcast error:", error);
        }
      }
    }
  }

  /**
   * Send immediate report (on-demand)
   */
  sendReport(userId: string): string {
    return this.monitor.generateActionReport(userId);
  }
}

// Global instance for easy access
export const globalActionMonitor = new ActionMonitor();
export const globalWirelessReporter = new WirelessActionReporter(globalActionMonitor);
