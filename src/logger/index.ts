import { randomUUID } from "node:crypto";
import pino, { type LevelWithSilent, type Logger, type LoggerOptions } from "pino";

const envLogLevel = process.env.LOG_LEVEL as LevelWithSilent | undefined;

const baseOptions: LoggerOptions = {
  level: envLogLevel ?? "info",
  timestamp: pino.stdTimeFunctions.isoTime,
  base: { service: "openclaw-ops" },
  messageKey: "message",
};

const rootLogger = pino(baseOptions);

export interface LoggerContext {
  correlationId?: string;
  [key: string]: unknown;
}

export function withCorrelation(context: LoggerContext = {}): Logger {
  const correlationId = context.correlationId ?? randomUUID();
  return rootLogger.child({ ...context, correlationId });
}

export function getLogger(context: LoggerContext = {}): Logger {
  return withCorrelation(context);
}

export { rootLogger };
