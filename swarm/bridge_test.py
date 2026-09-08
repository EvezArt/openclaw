from __future__ import annotations

import tempfile
from pathlib import Path

from .evez_bridge import EvezBridge, digest


def test_digest_is_deterministic() -> None:
    assert digest({"b": 2, "a": 1}) == digest({"a": 1, "b": 2})


def test_bridge_records_projection() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        db = str(Path(tmp) / "control.db")
        projections = Path(tmp) / "projections"
        bridge = EvezBridge(db, str(projections))
        result = bridge.ingest(
            title="bridge smoke",
            objective="record one auditable interaction",
            evidence=[{"kind": "test", "value": "pass"}],
        )
        assert result["state"] == "verifying"
        assert result["evidence_count"] == 1
        assert (projections / f"{result['task_id']}.json").exists()
