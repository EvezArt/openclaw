"""Executable proof that worker failure does not strand the swarm."""
from __future__ import annotations

from mesh import Node, NodeState, SwarmMesh


def main() -> int:
    mesh = SwarmMesh([
        Node("a", "SCOUT", "map the problem"),
        Node("b", "HARVEST", "collect evidence"),
        Node("c", "TRUNK", "synthesize", {"a", "b"}),
        Node("d", "WITNESS", "verify synthesis", {"c"}),
    ])

    # Independent roots start together.
    assert [n.node_id for n in mesh.ready()] == ["a", "b"]
    mesh.steer(lambda node: f"worker:{node.node_id}")
    assert mesh.nodes["a"].state == NodeState.RUNNING
    assert mesh.nodes["b"].state == NodeState.RUNNING

    # A worker failure is retried locally and does not touch its sibling.
    mesh.finish("a", {"error": "simulated worker loss"}, success=False, max_attempts=2)
    assert mesh.nodes["a"].state == NodeState.READY
    assert mesh.nodes["b"].state == NodeState.RUNNING

    # The retry succeeds; the sibling continues independently.
    mesh.start("a")
    mesh.finish("a", {"evidence": "map"}, success=True)
    mesh.finish("b", {"evidence": "sources"}, success=True)
    assert mesh.nodes["c"].state == NodeState.READY

    # Exhausted failure degrades, rather than poisoning downstream work.
    mesh.start("c")
    mesh.finish("c", {"error": "all synthesis workers unavailable"}, success=False, max_attempts=1)
    assert mesh.nodes["c"].state == NodeState.DEGRADED
    assert mesh.nodes["d"].state == NodeState.READY

    # Self-steering can select a replacement without replaying completed work.
    mesh.steer(lambda node: "LOCAL-FALLBACK")
    assert mesh.nodes["d"].agent == "LOCAL-FALLBACK"
    mesh.finish("d", {"verdict": "degraded-input-reviewed"}, success=True)

    convergence = mesh.convergence()
    assert convergence["healthy_terminal"] is True
    assert convergence["stuck"] is False
    print("self-steering: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
