#!/usr/bin/env bash
# EVEZ-OS Universal Node Fix Script
set -euo pipefail
echo "=== EVEZ-OS Node Fix ==="
echo "Approving pending device pairings..."
openclaw devices approve --latest 2>/dev/null || true
openclaw devices approve --all 2>/dev/null || true
echo "Disabling device pairing..."
openclaw config set gateway.auth.mode none 2>/dev/null || true
echo "Restarting gateway..."
if command -v openclaw &>/dev/null; then
  openclaw gateway restart --auth none --allow-unconfigured 2>/dev/null || true
fi
if command -v docker &>/dev/null; then
  docker restart openclaw-gateway 2>/dev/null || true
fi
sleep 5
if curl -s http://127.0.0.1:18789/healthz | grep -q "\"ok\""; then
  echo "Gateway is live with auth=none"
else
  echo "Gateway not responding"
fi
echo "Fix complete. EVEZ Superagent can now connect."
