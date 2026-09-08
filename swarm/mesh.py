"""Dependency-aware swarm mesh for the next EVEZ/OpenClaw runtime.

The mesh is deliberately deterministic and provider-neutral. It schedules
ready tasks from a DAG, supports bounded retries, and records enough state for
an external UI or worker runtime to observe the swarm without owning it.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Iterable


class NodeState(str, Enum):
    PENDING = "pending"
    READY = "ready"
    RUNNING = "running"
    DONE = "done"
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


class SwarmMesh:
    """Small DAG scheduler suitable for a phone-hosted control plane."""

    def __init__(self, nodes: Iterable[Node] = ()) -> None:
        self.nodes: dict[str, Node] = {}
        for node in nodes:
            self.add(node)

    def add(self, node: Node) -> None:
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
        for node in self.nodes.values():
            if node.state in {NodeState.DONE, NodeState.RUNNING, NodeState.FAILED, NodeState.BLOCKED}:
                continue
            deps = [self.nodes[d] for d in node.depends_on]
            if any(d.state in {NodeState.FAILED, NodeState.BLOCKED} for d in deps):
                node.state = NodeState.BLOCKED
            elif all(d.state == NodeState.DONE for d in deps):
                node.state = NodeState.READY

    def ready(self) -> list[Node]:
        self.refresh()
        return sorted((n for n in self.nodes.values() if n.state == NodeState.READY), key=lambda n: n.node_id)

    def start(self, node_id: str) -> Node:
        self.refresh()
        node = self.nodes[node_id]
        if node.state != NodeState.READY:
            raise ValueError(f"node {node_id} is not ready: {node.state.value}")
        node.state = NodeState.RUNNING
        node.attempts += 1
        return node

    def finish(self, node_id: str, result: dict, success: bool = True, max_attempts: int = 3) -> Node:
        node = self.nodes[node_id]
        if node.state != NodeState.RUNNING:
            raise ValueError(f"node {node_id} is not running")
        node.result = result
        if success:
            node.state = NodeState.DONE
        elif node.attempts < max_attempts:
            node.state = NodeState.READY
        else:
            node.state = NodeState.FAILED
        self.refresh()
        return node

    def snapshot(self) -> dict:
        self.refresh()
        return {
            "nodes": [
                {
                    "id": n.node_id,
                    "agent": n.agent,
                    "state": n.state.value,
                    "attempts": n.attempts,
                    "depends_on": sorted(n.depends_on),
                    "result": n.result,
                }
                for n in sorted(self.nodes.values(), key=lambda x: x.node_id)
            ],
            "ready": [n.node_id for n in self.ready()],
            "terminal": all(n.state in {NodeState.DONE, NodeState.FAILED, NodeState.BLOCKED} for n in self.nodes.values()),
        }
