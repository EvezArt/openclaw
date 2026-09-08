"""Evidence-weighted consensus for swarm results.

Consensus here is not a popularity contest. Claims are scored by independent
workers and evidence, while CAIN-style dissent is preserved instead of erased.
"""
from __future__ import annotations

from dataclasses import dataclass
from statistics import mean


@dataclass(frozen=True)
class Verdict:
    claim: str
    support: tuple[float, ...]
    dissent: tuple[str, ...] = ()
    evidence_count: int = 0
    independent_agents: int = 0

    @property
    def confidence(self) -> float:
        base = mean(self.support) if self.support else 0.0
        evidence_bonus = min(self.evidence_count * 0.04, 0.20)
        independence_bonus = min(self.independent_agents * 0.03, 0.15)
        dissent_penalty = min(len(self.dissent) * 0.08, 0.30)
        return max(0.0, min(1.0, base + evidence_bonus + independence_bonus - dissent_penalty))

    @property
    def status(self) -> str:
        if not self.support:
            return "unverified"
        if self.confidence >= 0.80 and self.evidence_count >= 2 and self.independent_agents >= 2:
            return "verified"
        if self.confidence >= 0.55:
            return "contested"
        return "rejected"


def adjudicate(claim: str, scores: list[float], *, evidence_count: int, independent_agents: int, dissent: list[str] | None = None) -> Verdict:
    """Return a reproducible verdict suitable for a WITNESS gate."""
    if not claim.strip():
        raise ValueError("claim cannot be empty")
    if not scores or any(score < 0 or score > 1 for score in scores):
        raise ValueError("scores must be non-empty values in [0, 1]")
    return Verdict(claim.strip(), tuple(scores), tuple(dissent or ()), evidence_count, independent_agents)
