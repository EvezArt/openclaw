# Market Intelligence Module

This module provides market intelligence capabilities for the OpenClaw ops stack.

## Features

- Market data aggregation
- Trend analysis
- Competitive intelligence
- Data canonicalization for consistent hashing

## Usage

```typescript
import { getMarketData } from './market-intelligence';

const data = await getMarketData();
```

## Dependencies

- json-canonicalize (npm) for deterministic JSON hashing
- rfc8785 (Python) for RFC 8785 canonicalization
