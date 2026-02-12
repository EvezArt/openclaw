/**
 * Market Intelligence Module
 * 
 * Demonstrates canonical JSON hashing for market data
 */

// Using json-canonicalize for deterministic JSON serialization
import { canonicalize } from 'json-canonicalize';

export interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  timestamp: string;
}

/**
 * Get sample market data
 */
export function getMarketData(): MarketData {
  return {
    symbol: 'OPENCLAW',
    price: 42.0,
    volume: 1000000,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Canonicalize market data for consistent hashing
 */
export function canonicalizeMarketData(data: MarketData): string {
  return canonicalize(data);
}

/**
 * Compute hash of market data
 */
export async function hashMarketData(data: MarketData): Promise<string> {
  const canonical = canonicalizeMarketData(data);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(canonical);
  
  // Use Web Crypto API for hashing
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback for Node.js
  const { createHash } = await import('node:crypto');
  return createHash('sha256').update(canonical).digest('hex');
}
