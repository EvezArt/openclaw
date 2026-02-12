# Ops Stack Documentation

The OpenClaw Ops Stack is a modular operational infrastructure designed to provide market intelligence, notifications, automation, monetization, and AI engine capabilities. This document describes the architecture, modules, and usage.

## Overview

The Ops Stack consists of five core modules:

1. **Market Intelligence**: Market analysis, trend detection, and intelligence gathering
2. **Notifications**: Multi-channel notification delivery system
3. **Automation**: Workflow automation and task scheduling
4. **Monetization**: Billing, subscriptions, and revenue tracking
5. **AI Engine**: AI model management and inference

## Architecture

```
src/
├── ops-stack.ts                    # Main entry point and orchestrator
└── ops-stack/
    ├── market-intelligence/        # Market intelligence module
    ├── notifications/              # Notifications module
    ├── automation/                 # Automation module
    ├── monetization/               # Monetization module
    └── ai-engine/                  # AI Engine module
```

Each module is independently configurable and can be enabled or disabled as needed.

## Installation

### Standard Installation

```bash
npm install -g openclaw@latest
```

### Development with GitHub Codespaces

The repository includes a comprehensive `.devcontainer` configuration for GitHub Codespaces:

1. Open the repository in GitHub Codespaces
2. Wait for the container to initialize (runs `.devcontainer/setup.sh` automatically)
3. All canonical hashing libraries will be installed automatically

## Configuration

### Basic Configuration

```typescript
import { createOpsStack, createDefaultOpsStackConfig } from 'openclaw';

// Use default configuration
const opsStack = await createOpsStack();

// Or provide custom configuration
const customConfig = {
  marketIntelligence: {
    enabled: true,
    updateInterval: 60000,
  },
  notifications: {
    enabled: true,
    channels: ['email', 'slack', 'webhook'],
    retryAttempts: 3,
  },
  automation: {
    enabled: true,
    maxConcurrentTasks: 10,
    taskTimeout: 300000,
  },
  monetization: {
    enabled: true,
    currency: 'USD',
    billingCycle: 'monthly',
  },
  aiEngine: {
    enabled: true,
    modelProvider: 'anthropic',
    maxConcurrentRequests: 5,
  },
};

const opsStack = await createOpsStack(customConfig);
```

### Module-Specific Configuration

Each module can be configured independently:

```typescript
// Disable specific modules
const config = {
  marketIntelligence: { enabled: false },
  notifications: { enabled: true, channels: ['email'] },
  automation: { enabled: true },
  monetization: { enabled: false },
  aiEngine: { enabled: true },
};

const opsStack = await createOpsStack(config);
```

## Usage

### Market Intelligence

```typescript
const marketIntelligence = opsStack.getMarketIntelligence();

// Fetch market data
const data = await marketIntelligence.getMarketData();
console.log(data.metrics);
console.log(data.trends);

// Analyze trends
const trends = await marketIntelligence.analyzeTrends();
```

### Notifications

```typescript
const notifications = opsStack.getNotifications();

// Send a notification
const notificationId = await notifications.send({
  type: 'alert',
  message: 'System alert',
  recipient: 'admin@example.com',
  channel: 'email',
});

// Retrieve notifications
const allNotifications = await notifications.getNotifications();
const recentNotifications = await notifications.getNotifications(10);
```

### Automation

```typescript
const automation = opsStack.getAutomation();

// Create a task
const taskId = await automation.createTask('backup-task', async () => {
  // Task logic here
  return { success: true };
});

// Get task status
const task = await automation.getTask(taskId);
console.log(task.status); // 'pending', 'running', 'completed', or 'failed'

// List all tasks
const tasks = await automation.listTasks();
```

### Monetization

```typescript
const monetization = opsStack.getMonetization();

// Create a subscription
const subscriptionId = await monetization.createSubscription(
  'user-123',
  'pro',
  99.99
);

// Get subscription details
const subscription = await monetization.getSubscription(subscriptionId);

// Get revenue metrics
const metrics = await monetization.getRevenueMetrics();
console.log(metrics.totalRevenue);
console.log(metrics.activeSubscriptions);
console.log(metrics.averageRevenuePerUser);
```

### AI Engine

```typescript
const aiEngine = opsStack.getAIEngine();

// Process an AI request
const response = await aiEngine.processRequest('Analyze this data', 'gpt-4');
console.log(response.content);
console.log(response.tokensUsed);

// Get request status
const request = await aiEngine.getRequest(response.requestId);

// Get metrics
const metrics = await aiEngine.getMetrics();
console.log(metrics.totalRequests);
console.log(metrics.completedRequests);
```

### Metrics and Health

```typescript
// Get overall system metrics
const metrics = await opsStack.getMetrics();
console.log(metrics.timestamp);
console.log(metrics.modules); // Status of each module
console.log(metrics.health); // 'healthy', 'degraded', or 'unhealthy'
```

### Shutdown

```typescript
// Gracefully shutdown the ops stack
await opsStack.shutdown();
```

## Deployment

### Using the Deployment Script

The repository includes a comprehensive deployment script that:
- Builds the project
- Creates test data for validation
- Computes golden hashes using multiple canonical hashing libraries
- Tests all ops stack modules
- Creates a deployment manifest

```bash
bash scripts/deploy-ops-stack.sh
```

The script will:
1. Build OpenClaw
2. Create test data with canonical JSON representations
3. Compute hashes using npm (json-canonicalize), Python (rfc8785), and Go (jcs)
4. Run integration tests for all modules
5. Generate a deployment manifest with golden hashes

### Deployment Artifacts

Deployment creates the following artifacts in `/tmp/ops-stack-data/`:

- `golden-hashes/`: Canonical hash references for data integrity validation
- `test-data/`: Test configuration and data files
- `deployments/`: Deployment manifests with timestamps and module status

### Golden Hash Validation

Golden hashes ensure data integrity across different canonical hashing implementations:

```json
{
  "deploymentId": "ops-stack-20260212-155012",
  "timestamp": "2026-02-12T15:50:12Z",
  "version": "2026.1.30",
  "goldenHashes": {
    "testConfig": {
      "npm": "b1b614a44e9d704348969a78a70f0a697946297c37e98f60def2e4aba0541129",
      "python": "b1b614a44e9d704348969a78a70f0a697946297c37e98f60def2e4aba0541129",
      "go": "b1b614a44e9d704348969a78a70f0a697946297c37e98f60def2e4aba0541129"
    }
  }
}
```

All three implementations produce identical hashes, ensuring canonical JSON consistency.

## Development

### Running Tests

```bash
# Run all tests
pnpm test

# Run ops stack tests only
pnpm test ops-stack.test.ts
```

### Building

```bash
pnpm build
```

### Linting

```bash
pnpm lint
```

## Canonical Hashing Libraries

The Ops Stack deployment includes support for multiple canonical hashing libraries:

- **npm**: `json-canonicalize` - RFC 8785 implementation for JavaScript
- **Go**: `webpki/jcs` - JSON Canonicalization Scheme for Go
- **Rust**: `serde_jcs` - JCS serialization for Rust
- **Java**: WebPKI - Maven-based canonical hashing
- **Python**: `rfc8785` - RFC 8785 implementation for Python

These libraries ensure consistent JSON canonicalization across different programming languages, which is crucial for cryptographic signing, content-addressable storage, and data integrity validation.

## GitHub Codespaces

The `.devcontainer` configuration provides a fully-configured development environment:

- Node.js 22
- Go (latest)
- Rust (latest)
- Java 21 with Maven
- Python 3.12
- All canonical hashing libraries pre-installed
- Port forwarding for gateway (18789), web UI (3000), and ops stack (8080)

### Using Codespaces

1. Open the repository in GitHub Codespaces
2. Wait for initialization (automatic setup via `.devcontainer/setup.sh`)
3. Run `pnpm build` to build the project
4. Run `bash scripts/deploy-ops-stack.sh` to deploy and test

## API Reference

### OpsStack

**Constructor**: `new OpsStack(config: OpsStackConfig, logger?: Logger)`

**Methods**:
- `initialize(): Promise<void>` - Initialize all modules
- `getMetrics(): Promise<OpsStackMetrics>` - Get system metrics
- `getMarketIntelligence(): MarketIntelligence` - Get market intelligence module
- `getNotifications(): Notifications` - Get notifications module
- `getAutomation(): Automation` - Get automation module
- `getMonetization(): Monetization` - Get monetization module
- `getAIEngine(): AIEngine` - Get AI engine module
- `shutdown(): Promise<void>` - Gracefully shutdown

### Helper Functions

- `createDefaultOpsStackConfig(): OpsStackConfig` - Create default configuration
- `createOpsStack(config?: Partial<OpsStackConfig>, logger?: Logger): Promise<OpsStack>` - Create and initialize an ops stack instance

## Examples

### Complete Example

```typescript
import { createOpsStack } from 'openclaw';

async function main() {
  // Create and initialize ops stack
  const opsStack = await createOpsStack({
    notifications: {
      enabled: true,
      channels: ['email', 'slack'],
    },
    automation: {
      enabled: true,
      maxConcurrentTasks: 5,
    },
  });

  // Send a notification
  await opsStack.getNotifications().send({
    type: 'info',
    message: 'System started',
    recipient: 'admin@example.com',
    channel: 'email',
  });

  // Create an automated task
  await opsStack.getAutomation().createTask('startup-check', async () => {
    // Perform startup checks
    return { status: 'healthy' };
  });

  // Get metrics
  const metrics = await opsStack.getMetrics();
  console.log('System health:', metrics.health);

  // Shutdown gracefully
  await opsStack.shutdown();
}

main();
```

## Troubleshooting

### Build Issues

If you encounter build issues:

```bash
# Clean install dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Rebuild
pnpm build
```

### Deployment Issues

If the deployment script fails:

```bash
# Check if canonical hashing tools are installed
which json-canonicalize
python3 -c "import rfc8785; print(rfc8785.__version__)"
which jcs

# Re-run the devcontainer setup script
bash .devcontainer/setup.sh
```

### Module Initialization Issues

If a module fails to initialize, check the logs:

```typescript
import { Logger } from 'tslog';

const logger = new Logger({ name: 'OpsStack', minLevel: 'debug' });
const opsStack = await createOpsStack(config, logger);
```

## Contributing

Contributions are welcome! Please ensure:

1. All tests pass: `pnpm test`
2. Code is linted: `pnpm lint`
3. Build succeeds: `pnpm build`
4. Deployment script works: `bash scripts/deploy-ops-stack.sh`

## License

MIT License - see LICENSE file for details.
