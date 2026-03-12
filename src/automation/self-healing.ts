import { getLogger } from "../logger/index.js";

const logger = getLogger({ module: "self-healing" });

export interface ManagedService {
  name: string;
  healthCheck(): Promise<boolean>;
  restart(): Promise<void>;
}

export interface RestartPolicy {
  maxRestartsPerWindow: number;
  windowMs: number;
}

export class SelfHealingSupervisor {
  private readonly restartHistory = new Map<string, number[]>();

  constructor(
    private readonly services: ManagedService[],
    private readonly policy: RestartPolicy = {
      maxRestartsPerWindow: 3,
      windowMs: 5 * 60_000,
    },
  ) {}

  async runOnce(): Promise<void> {
    for (const service of this.services) {
      const healthy = await service.healthCheck().catch(() => false);
      if (healthy) {
        continue;
      }

      if (!this.canRestart(service.name)) {
        logger.error({ service: service.name }, "Restart limit reached; escalation required");
        continue;
      }

      logger.warn({ service: service.name }, "Service unhealthy, restarting");
      await service.restart();
      this.recordRestart(service.name);
    }
  }

  async start(intervalMs = 15_000): Promise<() => void> {
    let closed = false;
    const runLoop = async () => {
      while (!closed) {
        await this.runOnce();
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    };

    void runLoop();

    return () => {
      closed = true;
    };
  }

  private canRestart(serviceName: string): boolean {
    const now = Date.now();
    const events = this.restartHistory.get(serviceName) ?? [];
    const recent = events.filter((timestamp) => timestamp > now - this.policy.windowMs);
    this.restartHistory.set(serviceName, recent);
    return recent.length < this.policy.maxRestartsPerWindow;
  }

  private recordRestart(serviceName: string): void {
    const events = this.restartHistory.get(serviceName) ?? [];
    events.push(Date.now());
    this.restartHistory.set(serviceName, events);
  }
}
