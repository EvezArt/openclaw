"""End-to-end offline proof for the EVEZ -> NextClaw -> VCL bridge."""
from __future__ import annotations

import json
import tempfile
from pathlib import Path

from evez_bridge import EvezBridge, digest


def main() -> int:
    with tempfile.TemporaryDirectory(prefix="evez-bridge-") as tmp:
        root = Path(tmp)
        bridge = EvezBridge(str(root / "swarm.db"), str(root / "projection"))
        evidence = [
            {"kind": "repo-claim", "source": "EvezArt/evez-vcl", "claim": "offline visual cognition pipeline"},
            {"kind": "execution", "source": "test-harness", "claim": "bridge path executed by this harness"},
        ]
        result = bridge.ingest(
            title="Bridge self-test",
            objective="Prove declared EVEZ work becomes durable, hashed, verifiable state.",
            agent="SPINE",
            evidence=evidence,
        )
        assert result["state"] == "verifying"
        assert result["evidence_count"] == 2
        assert len(result["projection"]["payload_sha256"]) == 64
        verified = bridge.verify_projection(result["task_id"], witness="WITNESS")
        assert verified["state"] == "completed"
        assert verified["verification"] == "verified"
        assert verified["evidence_count"] == 2
        projection_path = root / "projection" / f"{result['task_id']}.json"
        projection = json.loads(projection_path.read_text(encoding="utf-8"))
        assert projection["payload_sha256"] == result["projection"]["payload_sha256"]
        assert digest({"a": 1, "b": 2}) == digest({"b": 2, "a": 1})
    print(json.dumps({"ok": True, "bridge": "executed", "verification": "verified"}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
