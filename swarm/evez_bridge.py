"""EVEZ projection adapter for NextClaw.

Turns declared agent work into durable control-plane state and a small,
VCL-compatible projection record. It performs no shell execution, deployment,
or credential access.
"""
from __future__ import annotations

import hashlib
import json
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Iterable

from .control_plane import ControlPlane


@dataclass(frozen=True)
class Projection:
    task_id: str
    event_type: str
    source: str
    payload_sha256: str
    created_at: float

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def canonical_json(payload: Any) -> str:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def digest(payload: Any) -> str:
    return hashlib.sha256(canonical_json(payload).encode("utf-8")).hexdigest()


class EvezBridge:
    def __init__(self, db_path: str, projection_dir: str | None = None) -> None:
        self.control = ControlPlane(db_path)
        self.projection_dir = Path(projection_dir) if projection_dir else None
        if self.projection_dir:
            self.projection_dir.mkdir(parents=True, exist_ok=True)

    def ingest(
        self,
        *,
        title: str,
        objective: str,
        agent: str = "SPINE",
        evidence: Iterable[dict[str, Any]] = (),
        priority: int = 0,
    ) -> dict[str, Any]:
        rows = [dict(item) for item in evidence]
        task_id = self.control.create_task(
            title=title,
            objective=objective,
            origin="evez-bridge",
            priority=priority,
            required_skills=[],
        )
        claimed = self.control.claim(task_id=task_id, agent=agent)
        if claimed != task_id:
            raise RuntimeError(f"agent {agent!r} could not claim task {task_id}")
        self.control.transition(task_id, "running")

        for item in rows:
            item.setdefault("source", "evez-bridge")
            item["sha256"] = digest(item)
            self.control.attach_evidence(task_id, item)

        self.control.transition(task_id, "verifying")
        projection = Projection(
            task_id=task_id,
            event_type="cognition_projection",
            source="evez-bridge",
            payload_sha256=digest({
                "task_id": task_id,
                "agent": agent,
                "title": title,
                "objective": objective,
                "evidence": rows,
            }),
            created_at=time.time(),
        )
        self.control.emit_event(task_id, projection.event_type, projection.to_dict())

        if self.projection_dir:
            output = self.projection_dir / f"{task_id}.json"
            output.write_text(canonical_json(projection.to_dict()) + "\n", encoding="utf-8")

        return {
            "task_id": task_id,
            "state": "verifying",
            "evidence_count": len(rows),
            "projection": projection.to_dict(),
        }
