"""Offline demonstration of the NextClaw swarm architecture."""
from __future__ import annotations

import json
from consensus import adjudicate
from mesh import Node, SwarmMesh


def main() -> int:
    mesh = SwarmMesh([
        Node("scout", "SCOUT", "map the problem"),
        Node("harvest", "HARVEST", "collect evidence"),
        Node("cain", "CAIN", "attack assumptions"),
        Node("trunk", "TRUNK", "synthesize evidence", {"scout", "harvest"}),
        Node("witness", "WITNESS", "independently verify", {"trunk", "cain"}),
        Node("spine", "SPINE", "publish verified result", {"witness"}),
    ])
    mesh.validate()

    trace = []
    while not mesh.snapshot()["terminal"]:
        for node in mesh.ready():
            mesh.start(node.node_id)
            trace.append({"event": "start", "node": node.node_id, "agent": node.agent})
            mesh.finish(node.node_id, {"ok": True, "evidence": 2 if node.node_id != "cain" else 1})
            trace.append({"event": "done", "node": node.node_id})

    verdict = adjudicate(
        "The swarm can converge without paid model tokens.",
        [0.91, 0.88, 0.84],
        evidence_count=3,
        independent_agents=3,
        dissent=[],
    )
    print(json.dumps({
        "name": "NextClaw",
        "mode": "offline/free-first",
        "parallelism": "DAG-ready workers",
        "trace": trace,
        "verdict": {
            "status": verdict.status,
            "confidence": round(verdict.confidence, 3),
            "claim": verdict.claim,
        },
        "mesh": mesh.snapshot(),
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
