import { SelfHealingSupervisor, type ManagedService } from "../automation/self-healing.js";
import { parseOpsConfig } from "../config/schema.js";
import { getLogger } from "../logger/index.js";
import { AlphaVantageProvider } from "../market-intelligence/providers/alpha-vantage.js";
import { BinanceProvider } from "../market-intelligence/providers/binance.js";
import { CoinGeckoProvider } from "../market-intelligence/providers/coingecko.js";
import { OpsEscalationManager } from "../notifications/ops-escalation.js";
import { TwilioVoiceAdapter } from "../notifications/adapters/twilio-voice.js";

const logger = getLogger({ module: "ops-orchestrator" });

type TaskName = "config" | "providers" | "workers" | "supervisor";

interface TaskContext {
  providers?: {
    coingecko: CoinGeckoProvider;
    binance: BinanceProvider;
    alphaVantage: AlphaVantageProvider;
  };
  supervisor?: SelfHealingSupervisor;
}

interface TaskDefinition {
  name: TaskName;
  dependencies: TaskName[];
  run(context: TaskContext): Promise<void>;
}

class CircuitBreaker {
  private failures = 0;
  private openedAt: number | null = null;

  constructor(
    private readonly failureThreshold = 3,
    private readonly resetAfterMs = 30_000,
  ) {}

  canRun(): boolean {
    if (this.openedAt === null) {
      return true;
    }
    const elapsed = Date.now() - this.openedAt;
    if (elapsed >= this.resetAfterMs) {
      this.failures = 0;
      this.openedAt = null;
      return true;
    }
    return false;
  }

  markSuccess(): void {
    this.failures = 0;
    this.openedAt = null;
  }

  markFailure(): void {
    this.failures += 1;
    if (this.failures >= this.failureThreshold) {
      this.openedAt = Date.now();
    }
  }
}

async function runWithRetry(
  task: TaskDefinition,
  context: TaskContext,
  attempts = 3,
): Promise<void> {
  const breaker = new CircuitBreaker();

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (!breaker.canRun()) {
      throw new Error(`Circuit breaker open for task ${task.name}`);
    }

    try {
      await task.run(context);
      breaker.markSuccess();
      logger.info({ task: task.name, attempt }, "Task completed");
      return;
    } catch (error) {
      breaker.markFailure();
      const delayMs = 250 * 2 ** (attempt - 1);
      logger.warn(
        { task: task.name, attempt, delayMs, error },
        "Task failed, retrying with backoff",
      );
      if (attempt === attempts) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

function topologicalOrder(tasks: TaskDefinition[]): TaskDefinition[] {
  const byName = new Map(tasks.map((task) => [task.name, task]));
  const resolved = new Set<TaskName>();
  const visiting = new Set<TaskName>();
  const ordered: TaskDefinition[] = [];

  const visit = (name: TaskName): void => {
    if (resolved.has(name)) {
      return;
    }
    if (visiting.has(name)) {
      throw new Error(`Dependency cycle detected at ${name}`);
    }

    const task = byName.get(name);
    if (!task) {
      throw new Error(`Task ${name} is missing`);
    }

    visiting.add(name);
    for (const dependency of task.dependencies) {
      visit(dependency);
    }
    visiting.delete(name);
    resolved.add(name);
    ordered.push(task);
  };

  for (const task of tasks) {
    visit(task.name);
  }

  return ordered;
}

function createManagedServices(context: TaskContext): ManagedService[] {
  return [
    {
      name: "market-intelligence-provider-cluster",
      healthCheck: async () => {
        if (!context.providers) {
          return false;
        }
        await context.providers.coingecko.getQuote("bitcoin");
        return true;
      },
      restart: async () => {
        context.providers = {
          coingecko: new CoinGeckoProvider(),
          binance: new BinanceProvider(),
          alphaVantage: new AlphaVantageProvider(),
        };
      },
    },
  ];
}

export async function runFull(): Promise<void> {
  const context: TaskContext = {};
  const escalation = new OpsEscalationManager(new TwilioVoiceAdapter());

  const tasks: TaskDefinition[] = [
    {
      name: "config",
      dependencies: [],
      run: async () => {
        parseOpsConfig();
      },
    },
    {
      name: "providers",
      dependencies: ["config"],
      run: async () => {
        context.providers = {
          coingecko: new CoinGeckoProvider(),
          binance: new BinanceProvider(),
          alphaVantage: new AlphaVantageProvider(),
        };
      },
    },
    {
      name: "workers",
      dependencies: ["providers"],
      run: async () => {
        if (!context.providers) {
          throw new Error("Providers were not initialized");
        }

        await Promise.all([
          context.providers.coingecko.getQuote("bitcoin"),
          context.providers.binance.getQuote("BTCUSDT"),
          context.providers.alphaVantage.getQuote("MSFT"),
        ]);
      },
    },
    {
      name: "supervisor",
      dependencies: ["workers"],
      run: async () => {
        context.supervisor = new SelfHealingSupervisor(createManagedServices(context));
        await context.supervisor.runOnce();
      },
    },
  ];

  const orderedTasks = topologicalOrder(tasks);
  for (const [index, task] of orderedTasks.entries()) {
    try {
      await runWithRetry(task, context, 3);
    } catch (error) {
      await escalation.notifyDecisionRequired({
        stage: task.name,
        summary: "Ops pipeline failed and requires operator decision before continuing.",
      });
      throw error;
    }

    await escalation.notifyProgress({
      completed: index + 1,
      total: orderedTasks.length,
      stage: task.name,
    });
  }

  logger.info("Full ops pipeline completed successfully");
}
