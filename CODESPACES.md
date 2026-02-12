# GitHub Codespaces Setup for OpenClaw

This document provides comprehensive instructions for using GitHub Codespaces with the OpenClaw repository, including the ops stack and canonical hashing libraries.

## Quick Start

Click the badge to open this repository in GitHub Codespaces:

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/openclaw/openclaw)

## What's Included

The devcontainer environment provides:

### Language Runtimes
- **Node.js 22+** - Primary runtime for OpenClaw
- **Go (latest)** - For Go-based tooling
- **Python 3.12** - For Python scripts and tools
- **Rust (latest)** - For Rust-based components
- **Java 21** - For Java integration
- **Docker** - For containerization and testing

### Canonical Hashing Libraries

The environment includes libraries for deterministic JSON canonicalization across all languages:

#### Node.js
- `json-canonicalize` - RFC 8785 compliant JSON canonicalization
- Installed globally and in project dependencies

#### Go
- `webpki/jcs` - JSON Canonicalization Scheme
- Installed via: `go install github.com/cyberphone/json-canonicalization/go/src/webpki.org/jsoncanonicalizer@latest`

#### Python
- `rfc8785` - RFC 8785 canonical JSON implementation
- Installed via: `pip3 install rfc8785`

#### Rust
- `serde_jcs` - Rust JCS implementation (documentation included)
- Available via Cargo when needed in projects

#### Java
- WebPKI/JCS - Via Maven/Gradle dependencies (instructions included)
- Maven and Gradle pre-installed

### Development Tools
- VS Code extensions for all languages
- Language servers (TypeScript, Go, Rust, Python, Java)
- Docker-in-Docker support
- Git, zsh, oh-my-zsh

## Post-Creation Setup

After your Codespace is created, the environment automatically runs `.devcontainer/install-hash-libs.sh` which:

1. Installs canonical hashing libraries
2. Configures language-specific tooling
3. Installs project dependencies
4. Prepares the ops stack

You can verify the setup by running:

```bash
# Check installed tools
node -v
go version
python --version
rustc --version
java -version

# Test canonical hashing libraries
npm run test:ops-stack
```

## Ops Stack Testing

The ops stack includes five modules demonstrating canonical hashing:

### Running Golden Hash Tests

```bash
# Run via npm script
npm run test:ops-stack

# Run directly with tsx
npx tsx ops-stack/ops-stack.ts

# Run via deployment script
./deploy-ops-stack.sh
```

### Expected Output

```
🧪 Running Golden Hash Tests...

Test 1: Canonical JSON form
  ✓ PASSED

Test 2: SHA-256 hash of canonical form
  ✓ PASSED

Test 3: Deterministic hashing
  ✓ PASSED (deterministic)

Test 4: Module canonicalization
  ✓ PASSED (all modules)

✅ All golden hash tests passed!
```

## Ops Stack Modules

### 1. Market Intelligence
Location: `ops-stack/market-intelligence/`

Market data aggregation with canonical hashing for consistent data representation.

**Try it:**
```typescript
import { getMarketData, canonicalizeMarketData } from './ops-stack/market-intelligence';

const data = getMarketData();
const canonical = canonicalizeMarketData(data);
console.log(canonical);
```

### 2. Notifications
Location: `ops-stack/notifications/`

Multi-channel notification delivery with canonical audit trails.

**Try it:**
```typescript
import { createNotification, sendNotification } from './ops-stack/notifications';

await sendNotification({
  to: 'user@example.com',
  subject: 'Test',
  message: 'Hello from Codespaces!',
  channel: 'email',
});
```

### 3. Automation
Location: `ops-stack/automation/`

Workflow orchestration with deterministic state hashing.

**Try it:**
```typescript
import { createWorkflow, executeWorkflow } from './ops-stack/automation';

const workflow = createWorkflow('test-workflow', [
  { id: 'step1', action: 'fetch', params: {} },
  { id: 'step2', action: 'process', params: {} },
]);

await executeWorkflow(workflow);
```

### 4. Monetization
Location: `ops-stack/monetization/`

Payment processing with canonical transaction records.

**Try it:**
```typescript
import { processPayment } from './ops-stack/monetization';

const transaction = await processPayment({
  amount: 99.99,
  currency: 'USD',
  customerId: 'cust_123',
});
console.log(transaction);
```

### 5. AI Engine
Location: `ops-stack/ai-engine/`

AI/ML capabilities with deterministic model versioning.

**Try it:**
```typescript
import { runInference, getModelConfig } from './ops-stack/ai-engine';

const result = await runInference({
  modelId: 'classifier-v1',
  input: { text: 'Hello world' },
});
console.log(result);
```

## Working with the OpenClaw Project

### Install Dependencies

```bash
# Using pnpm (preferred)
corepack enable
corepack prepare pnpm@10.23.0 --activate
pnpm install

# Or using npm
npm install
```

### Build the Project

```bash
# Build TypeScript
pnpm build

# Or with npm
npm run build
```

### Run Tests

```bash
# Run all tests
pnpm test

# Run ops stack tests
pnpm test:ops-stack

# Run specific test suites
pnpm test:e2e
```

### Development Server

```bash
# Start gateway in watch mode
pnpm gateway:watch

# Run in development mode
pnpm dev
```

## Port Forwarding

The devcontainer automatically forwards these ports:

- **18789**: OpenClaw Gateway
- **3000**: Web UI
- **8080**: Ops Stack services

You can access them via the "Ports" tab in VS Code.

## Canonical Hashing Examples

### Node.js Example

```javascript
import { canonicalize } from 'json-canonicalize';

const data = { z: 'last', a: 'first', m: 'middle' };
const canonical = canonicalize(data);
// Result: {"a":"first","m":"middle","z":"last"}
```

### Go Example

```go
import "webpki.org/jsoncanonicalizer"

data := map[string]interface{}{
    "z": "last",
    "a": "first",
    "m": "middle",
}
canonical, _ := jsoncanonicalizer.Transform(data)
// Result: {"a":"first","m":"middle","z":"last"}
```

### Python Example

```python
import rfc8785

data = {"z": "last", "a": "first", "m": "middle"}
canonical = rfc8785.dumps(data)
# Result: {"a":"first","m":"middle","z":"last"}
```

## CI/CD Integration

The `.github/workflows/ops-stack-ci.yml` workflow automatically:

1. Tests canonical hashing across all languages
2. Validates devcontainer configuration
3. Checks module structure
4. Runs golden hash tests
5. Validates deployment script

## Troubleshooting

### Library Installation Issues

If a library fails to install, you can manually install it:

```bash
# Node.js
npm install -g json-canonicalize

# Go
go install github.com/cyberphone/json-canonicalization/go/src/webpki.org/jsoncanonicalizer@latest

# Python
pip3 install --user rfc8785
```

### Build Failures

If the build fails, try:

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Test Failures

To debug test failures:

```bash
# Run tests with verbose output
npx tsx ops-stack/ops-stack.ts

# Check individual modules
npx tsx -e "import * as m from './ops-stack/market-intelligence/index.js'; console.log(m.getMarketData())"
```

## Advanced Usage

### Using Different Package Managers

The project supports multiple package managers:

```bash
# pnpm (preferred)
pnpm install
pnpm build
pnpm test

# npm
npm install
npm run build
npm test

# bun
bun install
bun run build
bun test
```

### Docker Integration

The devcontainer includes Docker-in-Docker:

```bash
# Build Docker images
docker build -t openclaw:dev .

# Run containers
docker-compose up
```

### Adding New Ops Stack Modules

1. Create a new directory under `ops-stack/`
2. Add a `README.md` and `index.ts`
3. Implement canonical hashing functions
4. Update `ops-stack/ops-stack.ts` to test the module

See `ops-stack/README.md` for detailed instructions.

## References

- [RFC 8785: JSON Canonicalization Scheme (JCS)](https://www.rfc-editor.org/rfc/rfc8785)
- [json-canonicalize documentation](https://www.npmjs.com/package/json-canonicalize)
- [OpenClaw Documentation](https://docs.openclaw.ai)
- [GitHub Codespaces Documentation](https://docs.github.com/en/codespaces)

## Support

For issues or questions:

1. Check the [OpenClaw Documentation](https://docs.openclaw.ai)
2. Review existing [GitHub Issues](https://github.com/openclaw/openclaw/issues)
3. Join the [Discord community](https://discord.gg/clawd)
4. Open a new issue with the `codespaces` or `ops-stack` label

## License

MIT - See LICENSE file in the repository root.
