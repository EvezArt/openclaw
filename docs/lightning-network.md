# Lightning Network Support in OpenClaw

OpenClaw has limited support for the Lightning Network, Bitcoin's layer 2 payment protocol.

## Current Features

### 1. Lightning Addresses (LUD-16)

The Nostr extension supports Lightning addresses for receiving payments.

**Location:** `extensions/nostr/src/nostr-profile.ts`

**Format:** Lightning addresses follow an email-like format: `username@domain.com`

**Examples:**
- `user@getalby.com`
- `testuser@walletofsatoshi.com`
- `satoshi@lightning.tips`

**Usage:** Set the `lud16` field in your Nostr profile to receive Lightning tips.

### 2. BOLT11 Invoice Parser

A utility for parsing and validating Lightning Network BOLT11 invoices.

**Location:** `src/infra/lightning-invoice.ts`

**Supported Networks:**
- Bitcoin mainnet (`lnbc`)
- Bitcoin testnet (`lntb`)
- Bitcoin regtest (`lnbr`)
- Bitcoin simnet (`lnsb`)

**Supported Denominations:**
- `p` - pico-bitcoin (0.01 satoshi)
- `n` - nano-bitcoin (1 satoshi)
- `u` - micro-bitcoin (100 satoshi = 0.000001 BTC)
- `m` - milli-bitcoin (100,000 satoshi = 0.001 BTC)
- (none) - bitcoin (100,000,000 satoshi = 1 BTC)

## API Reference

### `parseLightningInvoice(invoice: string): LightningInvoice`

Parse a BOLT11 invoice and extract information.

**Example:**
```typescript
import { parseLightningInvoice } from "./infra/lightning-invoice";

const invoice = "lnbc13863u1p5c2f7n...";
const parsed = parseLightningInvoice(invoice);

console.log(parsed.network);         // "mainnet"
console.log(parsed.amountSatoshis);  // 1386300
console.log(parsed.amountBTC);       // 0.013863
console.log(parsed.valid);           // true
```

### `formatSatoshis(satoshis: number): string`

Format satoshis as a human-readable string.

**Example:**
```typescript
import { formatSatoshis } from "./infra/lightning-invoice";

console.log(formatSatoshis(1000));      // "1,000 sats"
console.log(formatSatoshis(1386300));   // "0.01386300 BTC"
```

### `isLightningInvoice(str: string): boolean`

Check if a string looks like a Lightning Network invoice.

**Example:**
```typescript
import { isLightningInvoice } from "./infra/lightning-invoice";

console.log(isLightningInvoice("lnbc1000u1...")); // true
console.log(isLightningInvoice("bitcoin:1A1...")); // false
```

### `validateLightningInvoice(invoice: string): { valid: boolean; error?: string }`

Validate a Lightning Network invoice.

**Example:**
```typescript
import { validateLightningInvoice } from "./infra/lightning-invoice";

const result = validateLightningInvoice("lnbc1000u1...");
if (result.valid) {
  console.log("Invoice is valid");
} else {
  console.error("Invalid invoice:", result.error);
}
```

## Invoice Format

BOLT11 invoices follow this structure:

```
lnbc<amount><multiplier>1<data><signature>
```

**Example Breakdown:**

Invoice: `lnbc13863u1p5c2f7n...`

- `lnbc` - Network prefix (Bitcoin mainnet)
- `13863` - Amount (numeric part)
- `u` - Multiplier (micro-bitcoin)
- `1` - Separator
- `p5c2f7n...` - Encoded data (timestamp, payment hash, signature, etc.)

**Amount Calculation:**
- 13,863 µBTC = 13,863 × 100 satoshis = 1,386,300 satoshis
- 1,386,300 satoshis = 0.01386300 BTC
- At $100,000/BTC ≈ $1,386 USD

## Limitations

### What is NOT Currently Supported

- **Invoice Generation:** Cannot create Lightning invoices
- **Payment Processing:** Cannot send or receive Lightning payments
- **Lightning Node:** No Lightning node integration
- **LNURL Protocol:** Only LUD-16 addresses (for display), no full LNURL implementation
- **Routing:** No Lightning routing capabilities
- **Channel Management:** No Lightning channel operations

### Cryptographic Verification

The current parser does **not** verify:
- Invoice signatures (schnorr signatures)
- Payment hash checksums
- Expiry timestamps
- Description hashes

The parser focuses on **basic structure validation** and **amount extraction** only.

## Future Enhancements

If full Lightning Network support is desired, consider:

1. **Full BOLT11 Decoder:** Add complete invoice parsing with signature verification
2. **Invoice Generation:** Create invoices with payment hashes and signatures
3. **LND/CLN Integration:** Connect to Lightning Network Daemon or Core Lightning
4. **Payment Flow:** Send and receive Lightning payments
5. **LNURL Support:** Implement LNURL-pay, LNURL-withdraw, LNURL-channel
6. **Invoice Expiry:** Track and warn about expired invoices
7. **Payment Routing:** Show route information and fees

## Security Considerations

### Lightning Address Security

- Lightning addresses are **public identifiers**
- Anyone can see your Lightning address in your Nostr profile
- Receiving payments requires a custodial wallet or self-hosted Lightning node
- Verify the Lightning address domain is legitimate before adding it

### Invoice Validation

- Always validate invoices before displaying them to users
- Check network matches your expectations (mainnet vs testnet)
- Verify amounts are reasonable before proceeding
- Be cautious with invoices from untrusted sources

### Privacy

- Lightning Network provides better privacy than on-chain Bitcoin
- However, Lightning addresses can link your payments to your identity
- Consider privacy implications before sharing Lightning addresses publicly

## Testing

Run the test suite:

```bash
pnpm test src/infra/lightning-invoice.test.ts
```

The test suite includes:
- Invoice parsing for all network types
- Amount calculations in all denominations
- Format validation
- Edge cases and error handling
- Real-world invoice examples

## References

- [BOLT11 Specification](https://github.com/lightning/bolts/blob/master/11-payment-encoding.md)
- [LUD-16: Lightning Address](https://github.com/lnurl/luds/blob/luds/16.md)
- [Lightning Network Documentation](https://lightning.network/)
- [Nostr Implementation Possibilities (NIPs)](https://github.com/nostr-protocol/nips)

## Example: Parsing the Problem Statement Invoice

The invoice from the problem statement:

```
lnbc13863u1p5c2f7npp5c8tnf04nuqjdjax9vk82gjpy7u2ruxsa2ny2l96v3nfv7tyz69dqsp5y0mfum3vhlh5yr7sslt9fju5tgspa7w2dnp8d5ecejm976matt5qxqy8ayqnp4qf0ru8dxm7pht536amqu6re6jzsf4akdc8y7x9ze3npkcd2fh8he2rzjqwghf7zxvfkxq5a6sr65g0gdkv768p83mhsnt0msszapamzx2qvuxqqqqzudjq473cqqqqqqqqqqqqqq9qrzjq25carzepgd4vqsyn44jrk85ezrpju92xyrk9apw4cdjh6yrwt5jgqqqqzudjq473cqqqqqqqqqqqqqq9qcqzpgdqq9qyyssqyulqsajcufpw7ve4cw9qdrntw4nh05h6ynls8a8e98zfv2x77de8n6u8nws4k994ngm88edzkxds66k2v0nk42ruz5hlg9czj79rhusp9ueqhv
```

**Parse it:**

```typescript
import { parseLightningInvoice, formatSatoshis } from "./infra/lightning-invoice";

const invoice = "lnbc13863u1p5c2f7n..."; // Full invoice string
const parsed = parseLightningInvoice(invoice);

console.log(`Network: ${parsed.network}`);                    // mainnet
console.log(`Amount: ${parsed.amountFormatted}`);             // 13863 uBTC
console.log(`Satoshis: ${parsed.amountSatoshis?.toLocaleString()}`); // 1,386,300
console.log(`BTC: ${parsed.amountBTC}`);                      // 0.013863
console.log(`Formatted: ${formatSatoshis(parsed.amountSatoshis!)}`); // 0.01386300 BTC
```

## Contributing

To extend Lightning Network support:

1. Add new features to `src/infra/lightning-invoice.ts`
2. Add corresponding tests to `src/infra/lightning-invoice.test.ts`
3. Update this documentation
4. Consider security and privacy implications
5. Follow the repository's coding standards

---

**Last Updated:** 2026-02-05
