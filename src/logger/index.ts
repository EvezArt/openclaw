import { randomUUID } from "node:crypto";
import pino, { type LevelWithSilent, type Logger, type LoggerOptions } from "pino";

export interface LoggerContext {
  correlationId?: string;
  [key: string]: unknown;
}

function resolveLevel(): LevelWithSilent {
  const raw = process.env.LOG_LEVEL;
  const allowed = new Set<LevelWithSilent>([
    "fatal",
    "error",
    "warn",
    "info",
    "debug",
    "trace",
    "silent",
  ]);

  if (raw && allowed.has(raw as LevelWithSilent)) {
    return raw as LevelWithSilent;
  }

  return "info";
}

const baseOptions: LoggerOptions = {
  level: resolveLevel(),
  timestamp: pino.stdTimeFunctions.isoTime,
  base: { service: "openclaw-ops" },
  messageKey: "message",
};

const rootLogger = pino(baseOptions);

export function withCorrelation(context: LoggerContext = {}): Logger {
  const correlationId = context.correlationId ?? randomUUID();
  return rootLogger.child({ ...context, correlationId });
}

export function getLogger(context: LoggerContext = {}): Logger {
  return withCorrelation(context);
}

export { rootLogger };
