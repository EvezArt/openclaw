import { getOpsConfig } from "../../config/schema.js";
import { getLogger } from "../../logger/index.js";
import { type IMarketProvider, type MarketQuote, RateLimiter } from "./types.js";

const config = getOpsConfig();

const logger = getLogger({ module: "binance-provider" });

export class BinanceProvider implements IMarketProvider {
  readonly name = "binance";
  private readonly limiter = new RateLimiter({ maxRequests: 2400, intervalMs: 60_000 });

  async getQuote(symbol: string): Promise<MarketQuote> {
    await this.limiter.take();
    const normalizedSymbol = symbol.toUpperCase();
    const url = `${config.BINANCE_BASE_URL}/api/v3/ticker/price?symbol=${encodeURIComponent(normalizedSymbol)}`;

    const response = await fetch(url, {
      headers: { "X-MBX-APIKEY": config.BINANCE_API_KEY },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const body = await response.text();
      logger.error({ status: response.status, body, symbol }, "Binance request failed");
      throw new Error(`Binance request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as { price?: string; symbol?: string };
    const price = Number(payload.price);
    if (!Number.isFinite(price)) {
      throw new Error(`Binance returned an invalid price for ${normalizedSymbol}`);
    }

    return {
      symbol: payload.symbol ?? normalizedSymbol,
      price,
      source: this.name,
      currency: "USD",
      fetchedAt: new Date().toISOString(),
    };
  }
}
