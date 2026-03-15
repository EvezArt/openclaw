"""
Agent Factory — creates, manages, and monitors agents dynamically based on
skill definitions. Agents communicate via an in-process event bus.
"""

from __future__ import annotations

import asyncio
import logging
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Callable, Coroutine

logger = logging.getLogger("openclaw.agents.factory")


# ---------------------------------------------------------------------------
# Agent bus — lightweight pub/sub for inter-agent communication
# ---------------------------------------------------------------------------


class AgentBus:
    """Simple async event bus for agent-to-agent messaging."""

    def __init__(self) -> None:
        self._subscribers: dict[str, list[Callable[..., Any]]] = {}

    def subscribe(self, topic: str, handler: Callable[..., Any]) -> None:
        self._subscribers.setdefault(topic, []).append(handler)

    def unsubscribe(self, topic: str, handler: Callable[..., Any]) -> None:
        if topic in self._subscribers:
            self._subscribers[topic] = [h for h in self._subscribers[topic] if h is not handler]

    async def publish(self, topic: str, payload: dict[str, Any]) -> None:
        for handler in self._subscribers.get(topic, []):
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler(payload)
                else:
                    handler(payload)
            except Exception as exc:
                logger.error("Bus handler error on topic '%s': %s", topic, exc)


# ---------------------------------------------------------------------------
# Agent model
# ---------------------------------------------------------------------------


class AgentState(Enum):
    IDLE = "idle"
    RUNNING = "running"
    STOPPED = "stopped"
    FAILED = "failed"


@dataclass
class AgentMetrics:
    tasks_handled: int = 0
    tasks_failed: int = 0
    avg_latency_ms: float = 0.0
    last_active: str = ""
    _latencies: list[float] = field(default_factory=list, repr=False)

    def record_task(self, latency_ms: float, success: bool) -> None:
        if success:
            self.tasks_handled += 1
        else:
            self.tasks_failed += 1
        self._latencies.append(latency_ms)
        # Rolling average over last 100 tasks
        recent = self._latencies[-100:]
        self.avg_latency_ms = sum(recent) / len(recent)
        self.last_active = datetime.now(timezone.utc).isoformat()

    @property
    def success_rate(self) -> float:
        total = self.tasks_handled + self.tasks_failed
        return self.tasks_handled / total if total > 0 else 1.0


@dataclass
class AgentDefinition:
    """Blueprint for an agent, derived from a skill definition."""

    name: str
    capabilities: list[str] = field(default_factory=list)
    handler: Callable[..., Coroutine[Any, Any, Any]] | Callable[..., Any] | None = None
    health_check: Callable[[], bool] | None = None
    max_concurrent_tasks: int = 5
    auto_restart: bool = True


@dataclass
class Agent:
    """A live agent instance managed by the factory."""

    id: str
    definition: AgentDefinition
    state: AgentState = AgentState.IDLE
    metrics: AgentMetrics = field(default_factory=AgentMetrics)
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    _active_tasks: int = 0

    @property
    def name(self) -> str:
        return self.definition.name

    @property
    def capabilities(self) -> list[str]:
        return self.definition.capabilities

    async def handle(self, task: dict[str, Any]) -> dict[str, Any]:
        """Execute a task using this agent's handler."""
        if self.state == AgentState.STOPPED:
            return {"status": "error", "reason": "agent_stopped"}

        if self._active_tasks >= self.definition.max_concurrent_tasks:
            return {"status": "rejected", "reason": "at_capacity"}

        handler = self.definition.handler
        if handler is None:
            return {"status": "error", "reason": "no_handler"}

        self.state = AgentState.RUNNING
        self._active_tasks += 1
        start = time.monotonic()

        try:
            if asyncio.iscoroutinefunction(handler):
                result = await handler(task)
            else:
                result = handler(task)
            latency = (time.monotonic() - start) * 1000
            self.metrics.record_task(latency, success=True)
            return {"status": "completed", "result": result}
        except Exception as exc:
            latency = (time.monotonic() - start) * 1000
            self.metrics.record_task(latency, success=False)
            self.state = AgentState.FAILED
            logger.error("Agent '%s' task failed: %s", self.name, exc)
            return {"status": "failed", "error": str(exc)}
        finally:
            self._active_tasks -= 1
            if self._active_tasks == 0 and self.state == AgentState.RUNNING:
                self.state = AgentState.IDLE

    def is_healthy(self) -> bool:
        if self.definition.health_check:
            try:
                return self.definition.health_check()
            except Exception:
                return False
        return self.state != AgentState.FAILED


# ---------------------------------------------------------------------------
# Agent Factory
# ---------------------------------------------------------------------------


PERFORMANCE_KILL_THRESHOLD = 0.3  # kill agents below 30% success rate (after 10+ tasks)


class AgentFactory:
    """Creates, monitors, and manages the lifecycle of agents."""

    def __init__(self, bus: AgentBus | None = None) -> None:
        self._agents: dict[str, Agent] = {}
        self._definitions: dict[str, AgentDefinition] = {}
        self._bus = bus or AgentBus()

    @property
    def bus(self) -> AgentBus:
        return self._bus

    # -- definitions --------------------------------------------------------

    def register_definition(self, definition: AgentDefinition) -> None:
        self._definitions[definition.name] = definition
        logger.info("Registered agent definition: %s", definition.name)

    def register_from_skill(self, skill_name: str, capabilities: list[str], handler: Callable[..., Any]) -> None:
        """Convenience: create a definition from a skill and register it."""
        defn = AgentDefinition(name=skill_name, capabilities=capabilities, handler=handler)
        self.register_definition(defn)

    # -- spawn / kill -------------------------------------------------------

    def spawn(self, name: str) -> Agent | None:
        defn = self._definitions.get(name)
        if defn is None:
            logger.warning("No definition found for agent '%s'", name)
            return None

        agent_id = f"{name}-{uuid.uuid4().hex[:8]}"
        agent = Agent(id=agent_id, definition=defn)
        self._agents[agent_id] = agent

        # Subscribe to bus topics matching capabilities
        for cap in defn.capabilities:
            self._bus.subscribe(cap, agent.handle)

        logger.info("Spawned agent '%s' (id=%s)", name, agent_id)
        return agent

    def kill(self, agent_id: str) -> bool:
        agent = self._agents.pop(agent_id, None)
        if agent is None:
            return False
        agent.state = AgentState.STOPPED
        # Unsubscribe from bus
        for cap in agent.capabilities:
            self._bus.unsubscribe(cap, agent.handle)
        logger.info("Killed agent '%s' (id=%s)", agent.name, agent_id)
        return True

    def respawn(self, agent_id: str) -> Agent | None:
        """Kill and re-spawn an agent."""
        agent = self._agents.get(agent_id)
        if agent is None:
            return None
        name = agent.name
        self.kill(agent_id)
        return self.spawn(name)

    # -- monitoring ---------------------------------------------------------

    def get_agent(self, agent_id: str) -> Agent | None:
        return self._agents.get(agent_id)

    def list_agents(self) -> list[Agent]:
        return list(self._agents.values())

    def health_check_all(self) -> dict[str, bool]:
        return {aid: agent.is_healthy() for aid, agent in self._agents.items()}

    def cull_underperformers(self) -> list[str]:
        """Kill agents that have fallen below the performance threshold."""
        culled: list[str] = []
        for agent_id, agent in list(self._agents.items()):
            total = agent.metrics.tasks_handled + agent.metrics.tasks_failed
            if total >= 10 and agent.metrics.success_rate < PERFORMANCE_KILL_THRESHOLD:
                logger.warning(
                    "Culling underperforming agent '%s' (success_rate=%.1f%%)",
                    agent.name,
                    agent.metrics.success_rate * 100,
                )
                self.kill(agent_id)
                culled.append(agent_id)
                # Auto-restart if configured
                if agent.definition.auto_restart:
                    self.spawn(agent.name)
        return culled

    # -- dispatch -----------------------------------------------------------

    async def dispatch(self, task: dict[str, Any]) -> dict[str, Any]:
        """Find the best agent for a task and dispatch it."""
        required_cap = task.get("capability", "")

        candidates = [
            a
            for a in self._agents.values()
            if a.state != AgentState.STOPPED and (not required_cap or required_cap in a.capabilities)
        ]

        if not candidates:
            return {"status": "no_agent", "reason": f"no agent for capability '{required_cap}'"}

        # Pick the agent with the best success rate and lowest load
        best = min(candidates, key=lambda a: (a._active_tasks, -a.metrics.success_rate))
        return await best.handle(task)

    # -- summary ------------------------------------------------------------

    def summary(self) -> dict[str, Any]:
        return {
            "total_agents": len(self._agents),
            "definitions": list(self._definitions.keys()),
            "agents": [
                {
                    "id": a.id,
                    "name": a.name,
                    "state": a.state.value,
                    "tasks_handled": a.metrics.tasks_handled,
                    "success_rate": f"{a.metrics.success_rate:.1%}",
                }
                for a in self._agents.values()
            ],
        }
