"""Self-healing dependency-aware swarm mesh for NextClaw.

The mesh treats worker failure as a local condition, not a mission-wide
failure. Nodes retry, degrade, and allow downstream work to continue with an
explicit degraded dependency. A caller never needs to remember to validate the
DAG before scheduling: every scheduling observation validates it first.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Iterable, Callable, Any


class NodeState(str, Enum):
    PENDING = "pending"
    READY = "ready"
    RUNNING = "running"
    DONE = "done"
    DEGRADED = "degraded"
    FAILED = "failed"
    BLOCKED = "blocked"


@dataclass
class Node:
    node_id: str
    agent: str
    objective: str
    depends_on: set[str] = field(default_factory=set)
    state: NodeState = NodeState.PENDING
    attempts: int = 0
    result: dict | None = None


TERMINAL = {NodeState.DONE, NodeState.DEGRADED, NodeState.FAILED, NodeState.BLOCKED}


class SwarmMesh:
    """Deterministic DAG scheduler with failure containment and self-repair."""

    def __init__(self, nodes: Iterable[Node] = ()) -> None:
        self.nodes: dict[str, Node] = {}
        for node in nodes:
            self.add(node)

    def add(self, node: Node) -> None:
        """Insert a node; full validation happens at scheduling boundaries."""
        if node.node_id in self.nodes:
            raise ValueError(f"duplicate node: {node.node_id}")
        self.nodes[node.node_id] = node

    def validate(self) -> None:
        for node in self.nodes.values():
            missing = node.depends_on - self.nodes.keys()
            if missing:
                raise ValueError(f"{node.node_id} has missing dependencies: {sorted(missing)}")
        visiting: set[str] = set()
        visited: set[str] = set()

        def visit(node_id: str) -> None:
            if node_id in visiting:
                raise ValueError("swarm dependency cycle detected")
            if node_id in visited:
                return
            visiting.add(node_id)
            for dep in self.nodes[node_id].depends_on:
                visit(dep)
            visiting.remove(node_id)
            visited.add(node_id)

        for node_id in self.nodes:
            visit(node_id)

    def refresh(self) -> None:
        """Repair all reachable dependency states in one pass until stable."""
        self.validate()
        changed = True
        while changed:
            changed = False
            for node in self.nodes.values():
                if node.state in {NodeState.DONE, NodeState.RUNNING, NodeState.FAILED, NodeState.DEGRADED}:
                    continue
                deps = [self.nodes[d] for d in node.depends_on]
                if any(d.state == NodeState.FAILED for d in deps):
                    node.state = NodeState.BLOCKED
                    changed = True
                elif any(d.state == NodeState.BLOCKED for d in deps):
                    node.state = NodeState.BLOCKED
                    changed = True
                elif all(d.state in {NodeState.DONE, NodeState.DEGRADED} for d in deps):
                    node.state = NodeState.READY
                    changed = True

    def ready(self) -> list[Node]:
        self.refresh()
        return sorted((n for n in self.nodes.values() if n.state == NodeState.READY), key=lambda n: n.node_id)

    def start(self, node_id: str) -> Node:
        self.refresh()
        if node_id not in self.nodes:
            raise KeyError(node_id)
        node = self.nodes[node_id]
        if node.state != NodeState.READY:
            raise ValueError(f"node {node_id} is not ready: {node.state.value}")
        node.state = NodeState.RUNNING
        node.attempts += 1
        return node

    def finish(
        self,
        node_id: str,
        result: dict,
        success: bool = True,
        max_attempts: int = 3,
    ) -> Node:
        if max_attempts <= 0:
            raise ValueError("max_attempts must be positive")
        node = self.nodes[node_id]
        if node.state != NodeState.RUNNING:
            raise ValueError(f"node {node_id} is not running")
        node.result = result
        if success:
            node.state = NodeState.DONE
        elif node.attempts < max_attempts:
            # Retry is local. No sibling or dependent task is poisoned.
            node.state = NodeState.READY
        else:
            # Exhausted failure becomes explicitly degraded. The mission can
            # continue, but the missing evidence remains visible downstream.
            node.state = NodeState.DEGRADED
            node.result = {**result, "degraded": True, "attempts": node.attempts}
        self.refresh()
        return node

    def recover_agent(
        self,
        failed_agent: str,
        replacement: Callable[[Node], str] | None = None,
    ) -> list[str]:
        """Reassign runnable work from one dead agent without resetting progress."""
        changed: list[str] = []
        for node in self.nodes.values():
            if node.agent != failed_agent or node.state != NodeState.RUNNING:
                continue
            node.state = NodeState.READY
            if replacement is not None:
                node.agent = replacement(node)
            changed.append(node.node_id)
        self.refresh()
        return changed

    def steer(
        self,
        choose_agent: Callable[[Node], str],
    ) -> list[Node]:
        """Assign every currently-ready node without coupling siblings."""
        ready = self.ready()
        for node in ready:
            node.agent = choose_agent(node)
        return [self.start(node.node_id) for node in ready]

    def convergence(self) -> dict[str, Any]:
        """Return whether the swarm progressed, degraded, or genuinely stalled."""
        self.refresh()
        blocked = [n.node_id for n in self.nodes.values() if n.state == NodeState.BLOCKED]
        degraded = [n.node_id for n in self.nodes.values() if n.state == NodeState.DEGRADED]
        active = [n.node_id for n in self.nodes.values() if n.state in {NodeState.READY, NodeState.RUNNING}]
        terminal = bool(self.nodes) and all(n.state in TERMINAL for n in self.nodes.values())
        return {
            "progress": bool(active or degraded or any(n.state == NodeState.DONE for n in self.nodes.values())),
            "stuck": bool(self.nodes) and not active and not terminal,
            "blocked": blocked,
            "degraded": degraded,
            "active": active,
            "healthy_terminal": bool(self.nodes) and all(n.state == NodeState.DONE for n in self.nodes.values()),
        }

    def snapshot(self) -> dict:
        self.refresh()
        return {
            "nodes": [
                {
                    "id": n.node_id,
                    "agent": n.agent,
                    "objective": n.objective,
                    "state": n.state.value,
                    "attempts": n.attempts,
                    "depends_on": sorted(n.depends_on),
                    "result": n.result,
                }
                for n in sorted(self.nodes.values(), key=lambda x: x.node_id)
            ],
            "ready": [n.node_id for n in self.ready()],
            "terminal": bool(self.nodes) and all(n.state in TERMINAL for n in self.nodes.values()),
            "convergence": self.convergence(),
        }
