"""Phone-first federation primitives for NextClaw.

The federation layer is transport-neutral: peers exchange signed-looking,
content-addressed envelopes over any future transport (HTTP, WebSocket,
Bluetooth relay, local network, or GitHub-backed polling). No transport or
model provider is required here.
"""
from __future__ import annotations

from dataclasses import dataclass, asdict
import hashlib
import json
import time
from typing import Any, Iterable

PROTOCOL_VERSION = "nextclaw/1"


@dataclass(frozen=True)
class Envelope:
    kind: str
    node_id: str
    message_id: str
    created_at: float
    payload: dict[str, Any]
    protocol: str = PROTOCOL_VERSION

    @property
    def digest(self) -> str:
        body = json.dumps(asdict(self), sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(body.encode("utf-8")).hexdigest()

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["digest"] = self.digest
        return data


def message_id(node_id: str, kind: str, payload: dict[str, Any]) -> str:
    canonical = json.dumps({"node": node_id, "kind": kind, "payload": payload}, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()[:24]


def make_envelope(node_id: str, kind: str, payload: dict[str, Any]) -> Envelope:
    return Envelope(kind=kind, node_id=node_id, message_id=message_id(node_id, kind, payload), created_at=time.time(), payload=payload)


def capability_match(required: Iterable[str], available: Iterable[str]) -> bool:
    have = {item.strip().lower() for item in available}
    return all(item.strip().lower() in have for item in required)


def select_workers(required_skills: Iterable[str], peers: Iterable[dict[str, Any]], limit: int = 0) -> list[dict[str, Any]]:
    candidates = [peer for peer in peers if peer.get("healthy", True) and capability_match(required_skills, peer.get("capabilities", []))]
    candidates.sort(key=lambda peer: (-int(peer.get("reliability", 0)), str(peer.get("node_id", ""))))
    return candidates[:limit] if limit > 0 else candidates


def quorum(verdicts: Iterable[str], minimum: int = 2) -> dict[str, Any]:
    counts: dict[str, int] = {}
    for verdict in verdicts:
        key = str(verdict).strip().lower()
        counts[key] = counts.get(key, 0) + 1
    total = sum(counts.values())
    winner = max(counts, key=counts.get) if counts else None
    votes = counts.get(winner, 0) if winner else 0
    return {
        "winner": winner,
        "votes": votes,
        "total": total,
        "quorum": votes >= minimum and votes > total / 2,
        "counts": counts,
    }
