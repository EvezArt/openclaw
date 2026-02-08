---
name: interaction-ledger
description: "Write interaction ledger records with treasury audit metadata"
homepage: https://docs.openclaw.ai/hooks
metadata:
  {
    "openclaw":
      {
        "emoji": "📒",
        "events": ["treasury"],
        "install": [{ "id": "bundled", "kind": "bundled", "label": "Bundled with OpenClaw" }],
      },
  }
---

# Interaction Ledger Hook

This hook appends interaction events to a local JSONL ledger.

## Treasury auditing opt-in

Treasury event auditing is opt-in. Enable the `interaction-ledger` hook to record treasury preflight and approval events.
