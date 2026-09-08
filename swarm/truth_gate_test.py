"""Offline invariants for the falsification-first claim state machine."""
from __future__ import annotations

from truth_gate import claim, execute, observe, reject, verify


def main() -> int:
    proposed = claim("test-claim", "the bridge can produce a durable verified result")
    assert proposed.state == "claimed"
    seen = observe(proposed, {"signal": "present"}, "test-sensor")
    ran = execute(seen, {"exit_code": 0, "artifact": "projection.json"}, "test-harness")
    witnessed = verify(ran, "independent-witness")
    assert witnessed.state == "verified"
    assert len(witnessed.evidence_sha256) == 2

    try:
        verify(proposed, "bad-witness")
    except ValueError:
        pass
    else:
        raise AssertionError("claim without execution evidence must not verify")

    blocked = reject(observe(proposed, {"signal": "conflict"}, "contradictor"), "conflicting observation")
    assert blocked.state == "rejected"
    print("truth-gate: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
