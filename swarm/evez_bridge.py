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
from .truth_gate import claim, execute, observe


@dataclass(frozen=True)
class Projection:
    task_id: str
    event_type: str
    source: str
    payload_sha256: str
    truth_state: str
    claim_sha256: str
    created_at: float

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def canonical_json(payload: Any) -> str:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def digest(payload: Any) -> str:
    return hashlib.sha256(canonical_json(payload).encode("utf-8")).hexdigest()


class EvezBridge:
    """Bridge declared cognition work into the authoritative control plane."""

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
        self.control.register_agent(agent, role="bridge", capabilities=["evez_projection"])
        self.control.heartbeat(agent, status="online")

        epistemic_claim = claim(f"{agent}:{digest({\"title\": title, \"objective\": objective})}", objective)
        task = self.control.create_task(
            title=title,
            objective=objective,
            origin="evez-bridge",
            priority=priority,
            required_skills=[],
        )
        claimed = self.control.claim_next(agent, lease_seconds=300)
        if claimed is None or claimed.task_id != task.task_id:
            raise RuntimeError(f"agent {agent!r} could not claim task {task.task_id}")
        self.control.transition(task.task_id, "running", actor=agent)

        observed = epistemic_claim
        for item in rows:
            item.setdefault("source", "evez-bridge")
            unsigned = dict(item)
            item["sha256"] = digest(unsigned)
            self.control.add_evidence(task.task_id, agent, item)
            observed = observe(observed, item, str(item["source"]))
        if not rows:
            observed = observe(observed, {"task_id": task.task_id, "state": "running"}, "control-plane")

        self.control.transition(task.task_id, "verifying", actor=agent)
        executed = execute(observed, {"task_id": task.task_id, "state": "verifying"}, "evez-bridge")
        projection = Projection(
            task_id=task.task_id,
            event_type="cognition_projection",
            source="evez-bridge",
            payload_sha256=digest({
                "task_id": task.task_id,
                "agent": agent,
                "title": title,
                "objective": objective,
                "evidence": rows,
            }),
            truth_state=executed.state,
            claim_sha256=executed.claim_sha256,
            created_at=time.time(),
        )
        self.control.emit(projection.event_type, agent, projection.to_dict())

        if self.projection_dir:
            output = self.projection_dir / f"{task.task_id}.json"
            output.write_text(canonical_json(projection.to_dict()) + "\n", encoding="utf-8")

        return {
            "task_id": task.task_id,
            "state": "verifying",
            "evidence_count": len(rows),
            "truth_state": executed.state,
            "projection": projection.to_dict(),
        }

    def verify_projection(self, task_id: str, witness: str = "WITNESS") -> dict[str, Any]:
        """Close the loop only through the control-plane verification gate."""
        task = self.control.get_task(task_id)
        if task.state != "verifying":
            raise ValueError(f"task {task_id} is {task.state}, not verifying")
        self.control.register_agent(witness, role="audit", capabilities=["verification"])
        self.control.heartbeat(witness, status="online")
        verified = self.control.verify(task_id, witness, "verified", note="projection witnessed")
        return {
            "task_id": task_id,
            "state": verified.state,
            "verification": verified.verification,
            "evidence_count": len(verified.evidence),
        }
