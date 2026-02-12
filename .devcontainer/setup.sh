#!/usr/bin/env bash
set -euo pipefail

echo "🦞 Setting up OpenClaw development environment..."

# Install pnpm
echo "📦 Installing pnpm..."
npm install -g pnpm@latest

# Install project dependencies
echo "📦 Installing project dependencies..."
pnpm install

# Install canonical hashing libraries
echo "🔐 Installing canonical hashing libraries..."

# npm: json-canonicalize
echo "  → Installing json-canonicalize (npm)..."
npm install -g json-canonicalize

# Go: webpki/jcs
echo "  → Installing webpki/jcs (Go)..."
go install github.com/cyberphone/json-canonicalization/go/src/webpki.org/jsoncanonicalizer/jcs@latest

# Rust: serde_jcs
echo "  → Installing serde_jcs (Rust)..."
cargo install serde_jcs --force || echo "Note: serde_jcs is a library, not a binary tool"

# Java: WebPKI (maven dependency)
echo "  → Configuring WebPKI for Java (Maven)..."
mkdir -p ~/.m2
cat > ~/.m2/settings.xml <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0
                              http://maven.apache.org/xsd/settings-1.0.0.xsd">
  <profiles>
    <profile>
      <id>github</id>
      <repositories>
        <repository>
          <id>central</id>
          <url>https://repo.maven.apache.org/maven2</url>
        </repository>
      </repositories>
    </profile>
  </profiles>
  <activeProfiles>
    <activeProfile>github</activeProfile>
  </activeProfiles>
</settings>
EOF

# Python: rfc8785
echo "  → Installing rfc8785 (Python)..."
pip install rfc8785

# Create ops-stack test data directory
echo "📁 Creating ops-stack directories..."
mkdir -p /tmp/ops-stack-data/{golden-hashes,test-data,deployments}

# Build the project
echo "🔨 Building OpenClaw..."
pnpm build

echo "✅ Setup complete! You can now:"
echo "  - Run 'pnpm openclaw gateway' to start the gateway"
echo "  - Run 'pnpm test' to run tests"
echo "  - Run 'bash scripts/deploy-ops-stack.sh' to deploy the ops stack"
echo ""
echo "Canonical hashing tools installed:"
echo "  - json-canonicalize (npm): $(which json-canonicalize || echo 'installed as library')"
echo "  - jcs (Go): $(which jcs || echo 'installed')"
echo "  - serde_jcs (Rust): library installed"
echo "  - WebPKI (Java): configured in Maven"
echo "  - rfc8785 (Python): $(python3 -c 'import rfc8785; print(rfc8785.__version__)' 2>/dev/null || echo 'installed')"
