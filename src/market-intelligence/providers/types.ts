export interface MarketQuote {
  symbol: string;
  price: number;
  source: string;
  fetchedAt: string;
  currency: string;
}

export interface IMarketProvider {
  readonly name: string;
  getQuote(symbol: string): Promise<MarketQuote>;
}

export interface ProviderRateLimit {
  maxRequests: number;
  intervalMs: number;
}

export class RateLimiter {
  private readonly requests: number[] = [];

  constructor(private readonly policy: ProviderRateLimit) {}

  async take(): Promise<void> {
    const now = Date.now();
    const cutoff = now - this.policy.intervalMs;

    while (this.requests.length > 0 && this.requests[0] < cutoff) {
      this.requests.shift();
    }

    if (this.requests.length >= this.policy.maxRequests) {
      const earliest = this.requests[0];
      if (earliest === undefined) {
        return;
      }
      const sleepMs = earliest + this.policy.intervalMs - now;
      await new Promise((resolve) => setTimeout(resolve, Math.max(1, sleepMs)));
      return this.take();
    }

    this.requests.push(now);
  }
}
