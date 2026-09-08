"""Falsification-first claim state for NextClaw.

A claim can be proposed freely, but it cannot become trusted merely because an
agent said it happened. State advances require evidence and an independent
witness. Rejected claims remain explicit in the audit record.
"""
from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, asdict
from typing import Any

STATES = {"claimed", "observed", "executed", "verified", "rejected"}


@dataclass(frozen=True)
class Verdict:
    claim_id: str
    state: str
    claim_sha256: str
    evidence_sha256: tuple[str, ...]
    witness: str | None = None
    note: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def canonical(payload: Any) -> str:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sha256(payload: Any) -> str:
    return hashlib.sha256(canonical(payload).encode("utf-8")).hexdigest()


def claim(claim_id: str, text: str) -> Verdict:
    if not claim_id.strip() or not text.strip():
        raise ValueError("claim_id and text are required")
    return Verdict(claim_id, "claimed", sha256({"claim_id": claim_id, "text": text}), ())


def observe(verdict: Verdict, observation: Any, source: str) -> Verdict:
    if verdict.state != "claimed":
        raise ValueError("observation must start from claimed")
    if not source.strip():
        raise ValueError("observation source is required")
    return Verdict(
        verdict.claim_id,
        "observed",
        verdict.claim_sha256,
        (sha256({"source": source, "observation": observation}),),
        note=f"observed:{source}",
    )


def execute(verdict: Verdict, execution: Any, source: str) -> Verdict:
    if verdict.state not in {"claimed", "observed"}:
        raise ValueError("execution must follow claim or observation")
    if not source.strip():
        raise ValueError("execution source is required")
    return Verdict(
        verdict.claim_id,
        "executed",
        verdict.claim_sha256,
        verdict.evidence_sha256 + (sha256({"source": source, "execution": execution}),),
        note=f"executed:{source}",
    )


def verify(verdict: Verdict, witness: str, *, independent: bool = True) -> Verdict:
    if verdict.state != "executed":
        raise ValueError("verification requires executed evidence")
    if not independent:
        raise ValueError("verification witness must be independent")
    if not verdict.evidence_sha256:
        raise ValueError("verification requires evidence")
    if not witness.strip():
        raise ValueError("witness is required")
    return Verdict(
        verdict.claim_id,
        "verified",
        verdict.claim_sha256,
        verdict.evidence_sha256,
        witness=witness,
        note="independent witness accepted",
    )


def reject(verdict: Verdict, reason: str) -> Verdict:
    if verdict.state == "verified":
        raise ValueError("verified claims cannot be retroactively rejected here")
    if not reason.strip():
        raise ValueError("rejection reason is required")
    return Verdict(
        verdict.claim_id,
        "rejected",
        verdict.claim_sha256,
        verdict.evidence_sha256,
        note=reason,
    )
