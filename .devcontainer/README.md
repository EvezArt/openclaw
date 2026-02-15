# OpenClaw Development Container

This devcontainer configuration enables GitHub Codespaces development for OpenClaw with support for canonical hashing libraries across multiple languages.

## Features

- **Node.js 22**: TypeScript/JavaScript development environment
- **Go**: For Go-based canonical hashing (webpki/jcs)
- **Rust**: For Rust-based canonical hashing (serde_jcs)
- **Java 21**: For Java-based canonical hashing (WebPKI)
- **Python 3.12**: For Python-based canonical hashing (rfc8785)
- **Git**: Version control

## Canonical Hashing Libraries

The setup automatically installs the following canonical hashing libraries:

1. **npm**: `json-canonicalize` - RFC 8785 implementation for JavaScript
2. **Go**: `webpki/jcs` - JSON Canonicalization Scheme for Go
3. **Rust**: `serde_jcs` - JCS serialization for Rust
4. **Java**: WebPKI - Configured in Maven for Java projects
5. **Python**: `rfc8785` - RFC 8785 implementation for Python

## Getting Started

### In GitHub Codespaces

1. Open this repository in GitHub Codespaces
2. Wait for the container to build and initialize (runs `.devcontainer/setup.sh` automatically)
3. Start developing!

### Ops Stack Deployment

To deploy and test the ops stack:

```bash
bash scripts/deploy-ops-stack.sh
```

This script will:
- Build the OpenClaw project
- Create test data for golden hash validation
- Compute canonical hashes using multiple libraries
- Test all ops stack modules
- Create a deployment manifest

### Available Commands

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Run tests
pnpm test

# Start the gateway
pnpm openclaw gateway

# Deploy ops stack
bash scripts/deploy-ops-stack.sh
```

## Port Forwarding

The following ports are automatically forwarded:

- **18789**: OpenClaw Gateway
- **3000**: Web UI
- **8080**: Ops Stack

## Ops Stack Modules

The ops stack includes the following modules:

1. **Market Intelligence**: Market analysis and trend detection
2. **Notifications**: Multi-channel notification delivery
3. **Automation**: Workflow automation and task scheduling
4. **Monetization**: Billing, subscriptions, and revenue tracking
5. **AI Engine**: AI model management and inference

Each module can be enabled/disabled independently via configuration.

## Golden Hash Testing

Golden hash testing ensures data integrity across different canonical hashing implementations. The deployment script tests that all libraries produce consistent canonical representations:

- Test data is created in `/tmp/ops-stack-data/test-data/`
- Golden hashes are stored in `/tmp/ops-stack-data/golden-hashes/`
- Deployment manifests are saved in `/tmp/ops-stack-data/deployments/`

## Troubleshooting

### Setup Script Failed

If the setup script fails, you can run it manually:

```bash
bash .devcontainer/setup.sh
```

### Missing Canonical Hashing Tools

Check which tools are installed:

```bash
# npm
which json-canonicalize || npm list -g json-canonicalize

# Go
which jcs || go version

# Python
python3 -c "import rfc8785; print(rfc8785.__version__)"

# Rust
cargo --version
```

### Ops Stack Tests Failed

Check the deployment logs in `/tmp/ops-stack-data/` for details.

## Development

For local development without Codespaces, see the main [README.md](../README.md) for installation instructions.
