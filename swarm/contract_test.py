"""Deterministic offline checks for the NextClaw federation layer."""
from __future__ import annotations

import json
from pathlib import Path

from federation import capability_match, make_envelope, quorum, select_workers
from phone_gateway import Gateway

ROOT = Path(__file__).resolve().parent


def main() -> int:
    protocol = json.loads((ROOT / "protocol.json").read_text(encoding="utf-8"))
    assert protocol["protocol"] == "nextclaw/1"
    assert capability_match(["research", "evidence"], ["research", "evidence", "audit"])
    assert not capability_match(["deploy"], ["research"])

    peers = [
        {"node_id": "node-b", "healthy": True, "reliability": 90, "capabilities": ["research", "evidence"]},
        {"node_id": "node-a", "healthy": True, "reliability": 95, "capabilities": ["research", "evidence"]},
        {"node_id": "node-c", "healthy": False, "reliability": 99, "capabilities": ["research", "evidence"]},
    ]
    selected = select_workers(["research", "evidence"], peers, limit=2)
    assert [item["node_id"] for item in selected] == ["node-a", "node-b"]

    env = make_envelope("phone", "mission", {"prompt": "test swarm"})
    assert env.protocol == "nextclaw/1"
    assert len(env.digest) == 64

    vote = quorum(["verified", "verified", "blocked"], minimum=2)
    assert vote["winner"] == "verified" and vote["quorum"] is True

    gateway = Gateway(":memory:")
    result = gateway.mission("test federation from phone")
    assert result["mode"] == "free-first"
    assert len(result["children"]) == 5
    print(json.dumps({"ok": True, "protocol": protocol["protocol"], "selected_workers": [p["node_id"] for p in selected], "quorum": vote, "mission": result}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
