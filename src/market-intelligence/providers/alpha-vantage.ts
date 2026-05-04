import { getOpsConfig } from "../../config/schema.js";
import { getLogger } from "../../logger/index.js";
import { type IMarketProvider, type MarketQuote, RateLimiter } from "./types.js";

const config = getOpsConfig();

const logger = getLogger({ module: "alpha-vantage-provider" });

export class AlphaVantageProvider implements IMarketProvider {
  readonly name = "alpha-vantage";
  private readonly limiter = new RateLimiter({ maxRequests: 5, intervalMs: 60_000 });

  async getQuote(symbol: string): Promise<MarketQuote> {
    await this.limiter.take();
    const url = `${config.ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol.toUpperCase())}&apikey=${encodeURIComponent(config.ALPHA_VANTAGE_API_KEY)}`;

    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });

    if (!response.ok) {
      const body = await response.text();
      logger.error({ status: response.status, body, symbol }, "Alpha Vantage request failed");
      throw new Error(`Alpha Vantage request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as {
      "Global Quote"?: { "05. price"?: string; "01. symbol"?: string };
      Note?: string;
      Information?: string;
    };

    if (payload.Note || payload.Information) {
      throw new Error(payload.Note ?? payload.Information ?? "Alpha Vantage throttled the request");
    }

    const quote = payload["Global Quote"];
    const price = Number(quote?.["05. price"]);
    if (!Number.isFinite(price)) {
      throw new Error(`Alpha Vantage returned an invalid quote for ${symbol}`);
    }

    return {
      symbol: quote?.["01. symbol"] ?? symbol.toUpperCase(),
      price,
      source: this.name,
      currency: "USD",
      fetchedAt: new Date().toISOString(),
    };
  }
}
