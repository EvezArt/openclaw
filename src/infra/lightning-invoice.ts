/**
 * Lightning Network BOLT11 Invoice Parser
 *
 * Parses and validates Lightning Network BOLT11 invoices.
 * Supports basic invoice decoding for Bitcoin mainnet and testnet.
 *
 * Reference: https://github.com/lightning/bolts/blob/master/11-payment-encoding.md
 */

export interface LightningInvoice {
  /** Raw invoice string */
  raw: string;
  /** Network type (bitcoin mainnet, testnet, etc) */
  network: "mainnet" | "testnet" | "regtest" | "simnet";
  /** Network prefix (lnbc, lntb, etc) */
  prefix: string;
  /** Amount in satoshis (undefined if invoice has no amount) */
  amountSatoshis?: number;
  /** Amount in BTC (undefined if invoice has no amount) */
  amountBTC?: number;
  /** Human-readable amount string */
  amountFormatted?: string;
  /** Invoice timestamp */
  timestamp?: number;
  /** Expiry time in seconds */
  expiry?: number;
  /** Payment hash */
  paymentHash?: string;
  /** Description */
  description?: string;
  /** Valid flag */
  valid: boolean;
  /** Validation error if any */
  error?: string;
}

/**
 * Parse a Lightning Network BOLT11 invoice
 *
 * @param invoice - The BOLT11 invoice string
 * @returns Parsed invoice information
 */
export function parseLightningInvoice(invoice: string): LightningInvoice {
  const result: LightningInvoice = {
    raw: invoice,
    network: "mainnet",
    prefix: "",
    valid: false,
  };

  // Validate basic format
  if (!invoice || typeof invoice !== "string") {
    result.error = "Invoice must be a non-empty string";
    return result;
  }

  // Trim whitespace
  invoice = invoice.trim();

  // Check length (BOLT11 invoices are typically 200-500 characters)
  if (invoice.length < 10 || invoice.length > 2000) {
    result.error = `Invalid invoice length: ${invoice.length} characters`;
    return result;
  }

  // Parse network prefix
  const networkPrefix = invoice.slice(0, 4);
  result.prefix = networkPrefix;

  switch (networkPrefix) {
    case "lnbc":
      result.network = "mainnet";
      break;
    case "lntb":
      result.network = "testnet";
      break;
    case "lnbr":
      result.network = "regtest";
      break;
    case "lnsb":
      result.network = "simnet";
      break;
    default:
      result.error = `Unknown network prefix: ${networkPrefix}`;
      return result;
  }

  // Parse amount (between prefix and separator '1')
  const afterPrefix = invoice.slice(4);

  // Find the first '1' separator (separates human-readable part from data part)
  const separatorMatch = afterPrefix.match(/^(\d+)([pnmu]?)1/);

  if (separatorMatch) {
    const amountNum = Number.parseInt(separatorMatch[1], 10);
    const multiplier = separatorMatch[2] || "";

    if (Number.isNaN(amountNum)) {
      result.error = "Invalid amount format";
      return result;
    }

    // Convert to satoshis based on multiplier
    let satoshis: number;

    switch (multiplier) {
      case "p": // pico-bitcoin (0.1 nBTC = 0.01 satoshi)
        satoshis = amountNum * 0.01;
        break;
      case "n": // nano-bitcoin (1 satoshi)
        satoshis = amountNum;
        break;
      case "u": // micro-bitcoin (100 satoshi = 0.000001 BTC)
        satoshis = amountNum * 100;
        break;
      case "m": // milli-bitcoin (100,000 satoshi = 0.001 BTC)
        satoshis = amountNum * 100000;
        break;
      default: // bitcoin (100,000,000 satoshi = 1 BTC)
        satoshis = amountNum * 100000000;
        break;
    }

    result.amountSatoshis = satoshis;
    result.amountBTC = satoshis / 100000000;

    // Format amount string
    if (multiplier) {
      result.amountFormatted = `${amountNum} ${multiplier}BTC`;
    } else {
      result.amountFormatted = `${amountNum} BTC`;
    }
  }

  // If we got this far, the invoice has a valid format
  result.valid = true;

  return result;
}

/**
 * Format satoshis as a human-readable string
 *
 * @param satoshis - Amount in satoshis
 * @returns Formatted string (e.g., "1,234,567 sats" or "0.01234567 BTC")
 */
export function formatSatoshis(satoshis: number): string {
  if (!Number.isFinite(satoshis) || satoshis < 0) {
    return "0 sats";
  }

  // Use satoshis for amounts < 0.001 BTC (100,000 sats)
  if (satoshis < 100000) {
    return `${satoshis.toLocaleString()} sats`;
  }

  // Use BTC for larger amounts
  const btc = satoshis / 100000000;
  return `${btc.toFixed(8)} BTC`;
}

/**
 * Check if a string looks like a Lightning Network invoice
 *
 * @param str - String to check
 * @returns True if it looks like a Lightning invoice
 */
export function isLightningInvoice(str: string): boolean {
  if (!str || typeof str !== "string") {
    return false;
  }

  const trimmed = str.trim();

  // Check for Lightning Network prefixes
  return (
    trimmed.startsWith("lnbc") ||
    trimmed.startsWith("lntb") ||
    trimmed.startsWith("lnbr") ||
    trimmed.startsWith("lnsb")
  );
}

/**
 * Validate a Lightning Network invoice
 *
 * @param invoice - The invoice string to validate
 * @returns Object with valid flag and optional error message
 */
export function validateLightningInvoice(invoice: string): {
  valid: boolean;
  error?: string;
} {
  const parsed = parseLightningInvoice(invoice);
  return {
    valid: parsed.valid,
    error: parsed.error,
  };
}
