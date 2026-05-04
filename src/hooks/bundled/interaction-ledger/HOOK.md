---
name: interaction-ledger
description: "Record normalized inbound/outbound and agent execution events as JSONL"
homepage: https://docs.openclaw.ai/hooks#interaction-ledger
metadata:
  {
    "openclaw":
      {
        "emoji": "📒",
        "events": ["interaction"],
        "install": [{ "id": "bundled", "kind": "bundled", "label": "Bundled with OpenClaw" }],
      },
  }
---

# Interaction Ledger Hook

Writes normalized interaction records to a local JSONL ledger file.

## Scope

This hook captures internal `interaction:*` events that cover:

- inbound message acceptance
- outbound bot/assistant sends
- agent run lifecycle
- tool invocation lifecycle
- model completion metadata

## Opt-in behavior

This hook is bundled but **not required**. It runs only when internal hooks are enabled and the hook entry is enabled in your hooks config.

## Storage and retention

- Output file: `~/.openclaw/logs/interaction-ledger.jsonl` (or `$OPENCLAW_STATE_DIR/logs/interaction-ledger.jsonl`)
- Format: one JSON object per line (JSONL)
- Retention: no automatic pruning or rotation; manage retention with your own log rotation policy.

## Redaction

The hook is designed for metadata-first auditing:

- content is represented as `contentHash` (SHA-256), not raw message text
- each record includes redaction flags (`content`, `identifiers`, `metadata`)
- callers can mark additional redaction decisions through the event payload

## Schema stability

Each record includes `version` and `timestamp` so downstream tooling can parse consistently across releases.
