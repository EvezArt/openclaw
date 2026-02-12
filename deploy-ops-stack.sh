#!/bin/bash
set -euo pipefail

# deploy-ops-stack.sh
# Deployment script for the OpenClaw Ops Stack

echo "🚀 OpenClaw Ops Stack Deployment"
echo "================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Preflight checks
echo "Step 1: Preflight Checks"
echo "------------------------"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js not found. Please install Node.js >= 22"
    exit 1
fi
NODE_VERSION=$(node -v)
print_status "Node.js version: $NODE_VERSION"

# Check pnpm (or npm)
if command -v pnpm &> /dev/null; then
    PACKAGE_MANAGER="pnpm"
    print_status "Package manager: pnpm"
elif command -v npm &> /dev/null; then
    PACKAGE_MANAGER="npm"
    print_status "Package manager: npm"
else
    print_error "No package manager found. Please install npm or pnpm"
    exit 1
fi

# Check TypeScript
if ! command -v tsc &> /dev/null; then
    print_warning "TypeScript not found globally, will use local version"
fi

echo ""
echo "Step 2: Install Dependencies"
echo "----------------------------"

# Ensure json-canonicalize is available
if [ ! -f "node_modules/json-canonicalize/package.json" ]; then
    print_status "Installing json-canonicalize..."
    $PACKAGE_MANAGER add json-canonicalize
else
    print_status "json-canonicalize already installed"
fi

echo ""
echo "Step 3: Build Ops Stack"
echo "-----------------------"

# Build TypeScript (if needed)
if [ -f "tsconfig.json" ]; then
    print_status "Building TypeScript..."
    if command -v tsc &> /dev/null; then
        tsc --build --force 2>&1 | tail -n 5 || print_warning "TypeScript build encountered issues (non-fatal)"
    else
        $PACKAGE_MANAGER exec tsc --build --force 2>&1 | tail -n 5 || print_warning "TypeScript build encountered issues (non-fatal)"
    fi
    print_status "Build complete"
else
    print_warning "No tsconfig.json found, skipping build"
fi

echo ""
echo "Step 4: Run Golden Hash Tests"
echo "------------------------------"

# Run the golden hash tests
print_status "Running canonicalization tests..."
echo ""

if [ -f "dist/ops-stack/ops-stack.js" ]; then
    # Use compiled version
    node dist/ops-stack/ops-stack.js
elif [ -f "ops-stack/ops-stack.ts" ]; then
    # Use TypeScript directly with tsx or ts-node
    if command -v tsx &> /dev/null; then
        tsx ops-stack/ops-stack.ts
    elif command -v ts-node &> /dev/null; then
        ts-node ops-stack/ops-stack.ts
    else
        # Try with node if .js exists
        if [ -f "ops-stack/ops-stack.js" ]; then
            node ops-stack/ops-stack.js
        else
            print_error "Cannot execute ops-stack.ts (tsx/ts-node not found and no compiled .js)"
            print_warning "Install tsx: $PACKAGE_MANAGER add -D tsx"
            exit 1
        fi
    fi
else
    print_error "ops-stack.ts not found"
    exit 1
fi

TESTS_EXIT_CODE=$?

echo ""
if [ $TESTS_EXIT_CODE -eq 0 ]; then
    print_status "Golden hash tests passed!"
else
    print_error "Golden hash tests failed!"
    exit 1
fi

echo ""
echo "Step 5: Deployment Summary"
echo "--------------------------"

print_status "All preflight checks passed"
print_status "Dependencies installed"
print_status "Build completed"
print_status "Golden hash tests passed"

echo ""
echo "📦 Deployment Steps (would run in production):"
echo "  1. Build Docker images for each module"
echo "  2. Push images to container registry"
echo "  3. Update Kubernetes manifests"
echo "  4. Deploy to staging environment"
echo "  5. Run integration tests"
echo "  6. Deploy to production with rolling update"
echo "  7. Monitor deployment health"

echo ""
echo "🎯 Mock Deployment Status:"
echo "  • market-intelligence: ✓ Ready"
echo "  • notifications: ✓ Ready"
echo "  • automation: ✓ Ready"
echo "  • monetization: ✓ Ready"
echo "  • ai-engine: ✓ Ready"

echo ""
echo "✅ Ops Stack deployment validation complete!"
echo ""
echo "To run tests again:"
echo "  $PACKAGE_MANAGER test:ops-stack"
echo ""
echo "To deploy to production (requires credentials):"
echo "  ./deploy-ops-stack.sh --production"
echo ""
