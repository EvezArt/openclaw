import { getOpsConfig } from "../../config/schema.js";
import { getLogger } from "../../logger/index.js";
import { type IMarketProvider, type MarketQuote, RateLimiter } from "./types.js";

const config = getOpsConfig();

const logger = getLogger({ module: "coingecko-provider" });

export class CoinGeckoProvider implements IMarketProvider {
  readonly name = "coingecko";
  private readonly limiter = new RateLimiter({ maxRequests: 20, intervalMs: 60_000 });

  async getQuote(symbol: string): Promise<MarketQuote> {
    await this.limiter.take();
    const coinId = symbol.toLowerCase();
    const url = `${config.COINGECKO_BASE_URL}/simple/price?ids=${encodeURIComponent(coinId)}&vs_currencies=usd`;

    const response = await fetch(url, {
      headers: { "x-cg-demo-api-key": config.COINGECKO_API_KEY },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const body = await response.text();
      logger.error({ status: response.status, body, symbol }, "CoinGecko request failed");
      throw new Error(`CoinGecko request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as Record<string, { usd?: number }>;
    const price = payload[coinId]?.usd;
    if (typeof price !== "number") {
      throw new Error(`CoinGecko did not return a USD price for ${coinId}`);
    }

    return {
      symbol,
      price,
      source: this.name,
      currency: "USD",
      fetchedAt: new Date().toISOString(),
    };
  }
}
