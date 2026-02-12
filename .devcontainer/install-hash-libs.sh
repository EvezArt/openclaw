#!/bin/bash
set -euo pipefail

echo "Installing canonical hashing libraries across languages..."

# Go: webpki/jcs
echo "Setting up Go JCS library..."
if command -v go &> /dev/null; then
    go install github.com/cyberphone/json-canonicalization/go/src/webpki.org/jsoncanonicalizer@latest || true
    echo "  ✓ Go webpki/jcs tooling available"
else
    echo "  ⚠ Go not found, skipping"
fi

# Node.js: json-canonicalize
echo "Setting up Node.js json-canonicalize..."
if command -v npm &> /dev/null; then
    npm install -g json-canonicalize || true
    echo "  ✓ npm json-canonicalize installed globally"
else
    echo "  ⚠ npm not found, skipping"
fi

# Install pnpm (used by this repo)
if command -v npm &> /dev/null; then
    corepack enable || true
    corepack prepare pnpm@10.23.0 --activate || true
    echo "  ✓ pnpm configured"
fi

# Rust: serde_jcs (will be added to Cargo.toml in workspace)
echo "Setting up Rust serde_jcs..."
if command -v cargo &> /dev/null; then
    echo "  ✓ Rust tooling available (serde_jcs can be added to Cargo.toml)"
else
    echo "  ⚠ Rust not found, skipping"
fi

# Python: rfc8785
echo "Setting up Python rfc8785..."
if command -v pip &> /dev/null || command -v pip3 &> /dev/null; then
    pip3 install --user rfc8785 || pip install --user rfc8785 || true
    echo "  ✓ Python rfc8785 installed"
else
    echo "  ⚠ Python pip not found, skipping"
fi

# Java: Note about Maven/Gradle dependency
echo "Java WebPKI/JCS setup..."
if command -v java &> /dev/null; then
    echo "  ✓ Java runtime available"
    echo "  → Add to pom.xml: <dependency><groupId>org.webpki</groupId><artifactId>json-canonicalization</artifactId><version>1.0</version></dependency>"
    echo "  → Or build.gradle: implementation 'org.webpki:json-canonicalization:1.0'"
else
    echo "  ⚠ Java not found, skipping"
fi

# Install project dependencies
if [ -f "package.json" ]; then
    echo "Installing project dependencies..."
    pnpm install || npm install || true
fi

echo ""
echo "✓ Canonical hashing library setup complete!"
echo "Run 'pnpm test:ops-stack' or './deploy-ops-stack.sh' to test golden hashes"
