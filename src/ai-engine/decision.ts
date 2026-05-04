import { getLogger } from "../logger/index.js";

const logger = getLogger({ module: "ai-decision" });

export interface RiskInput {
  symbol: string;
  volatility24h: number;
  drawdownPercent: number;
  confidence: number;
}

export interface RiskDecision {
  riskScore: number;
  action: "BUY" | "SELL" | "HOLD";
  trace: string[];
}

export interface RiskScorer {
  score(input: RiskInput): RiskDecision;
}

export class WeightedRiskScorer implements RiskScorer {
  score(input: RiskInput): RiskDecision {
    const trace: string[] = [];
    const volatilityWeight = Math.min(1, input.volatility24h / 10);
    const drawdownWeight = Math.min(1, Math.max(0, input.drawdownPercent / 25));
    const confidenceWeight = 1 - Math.min(1, Math.max(0, input.confidence));

    trace.push(`volatilityWeight=${volatilityWeight.toFixed(3)}`);
    trace.push(`drawdownWeight=${drawdownWeight.toFixed(3)}`);
    trace.push(`confidencePenalty=${confidenceWeight.toFixed(3)}`);

    const riskScore = Number(
      (volatilityWeight * 0.4 + drawdownWeight * 0.4 + confidenceWeight * 0.2).toFixed(4),
    );

    let action: RiskDecision["action"] = "HOLD";
    if (riskScore >= 0.7) {
      action = "SELL";
    }
    if (riskScore <= 0.35) {
      action = "BUY";
    }

    const decision: RiskDecision = { riskScore, action, trace };
    logger.info({ symbol: input.symbol, decision }, "Risk decision produced");
    return decision;
  }
}
