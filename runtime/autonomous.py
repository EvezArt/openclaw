"""
OpenClaw Autonomous Runtime — persistent event loop that processes tasks,
learns, and expands. Runs 24/7, self-monitors, and logs to the ledger.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import signal
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen

logger = logging.getLogger("openclaw.runtime")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

LEDGER_REPO = "EvezArt/evez-autonomous-ledger"
GITHUB_API = "https://api.github.com"
CONFIG_PATH = Path(__file__).resolve().parent.parent / "config" / "ecosystem.json"
REGISTRY_PATH = (
    Path(__file__).resolve().parent.parent / "marketplace" / "registry.json"
)

TICK_INTERVAL_SECONDS = 60  # main loop cadence
MAX_BACKOFF_SECONDS = 300
INITIAL_BACKOFF_SECONDS = 5
CIRCUIT_BREAKER_THRESHOLD = 5
CIRCUIT_BREAKER_RESET_SECONDS = 120


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


class TaskSource(Enum):
    GITHUB_ISSUE = "github_issue"
    LEDGER_DECISION = "ledger_decision"
    USER_COMMAND = "user_command"
    SELF_GENERATED = "self_generated"


class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


@dataclass
class CircuitBreaker:
    """Protects external API calls with exponential backoff."""

    name: str
    threshold: int = CIRCUIT_BREAKER_THRESHOLD
    reset_seconds: float = CIRCUIT_BREAKER_RESET_SECONDS
    failure_count: int = 0
    state: CircuitState = CircuitState.CLOSED
    last_failure_time: float = 0.0

    def record_failure(self) -> None:
        self.failure_count += 1
        self.last_failure_time = time.monotonic()
        if self.failure_count >= self.threshold:
            self.state = CircuitState.OPEN
            logger.warning("Circuit breaker '%s' OPEN after %d failures", self.name, self.failure_count)

    def record_success(self) -> None:
        self.failure_count = 0
        self.state = CircuitState.CLOSED

    def allow_request(self) -> bool:
        if self.state == CircuitState.CLOSED:
            return True
        elapsed = time.monotonic() - self.last_failure_time
        if elapsed >= self.reset_seconds:
            self.state = CircuitState.HALF_OPEN
            logger.info("Circuit breaker '%s' HALF-OPEN — allowing probe request", self.name)
            return True
        return False


@dataclass
class Task:
    id: str
    source: TaskSource
    title: str
    payload: dict[str, Any] = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    status: str = "pending"


# ---------------------------------------------------------------------------
# GitHub API helpers (stdlib only — no third-party deps required)
# ---------------------------------------------------------------------------


def _github_headers() -> dict[str, str]:
    token = os.environ.get("GITHUB_TOKEN", os.environ.get("GH_TOKEN", ""))
    headers: dict[str, str] = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def _github_get(url: str, breaker: CircuitBreaker) -> Any | None:
    if not breaker.allow_request():
        logger.debug("Circuit breaker '%s' is OPEN — skipping request to %s", breaker.name, url)
        return None
    try:
        req = Request(url, headers=_github_headers())
        with urlopen(req, timeout=30) as resp:  # noqa: S310
            data = json.loads(resp.read())
        breaker.record_success()
        return data
    except (URLError, OSError, json.JSONDecodeError) as exc:
        breaker.record_failure()
        logger.warning("GitHub GET %s failed: %s", url, exc)
        return None


def _github_post(url: str, body: dict[str, Any], breaker: CircuitBreaker) -> Any | None:
    if not breaker.allow_request():
        return None
    try:
        payload = json.dumps(body).encode()
        req = Request(url, data=payload, headers={**_github_headers(), "Content-Type": "application/json"})
        with urlopen(req, timeout=30) as resp:  # noqa: S310
            data = json.loads(resp.read())
        breaker.record_success()
        return data
    except (URLError, OSError, json.JSONDecodeError) as exc:
        breaker.record_failure()
        logger.warning("GitHub POST %s failed: %s", url, exc)
        return None


# ---------------------------------------------------------------------------
# Ledger integration
# ---------------------------------------------------------------------------


def log_to_ledger(breaker: CircuitBreaker, action: str, details: dict[str, Any]) -> None:
    """Append an action record to the ledger repo via GitHub Issues."""
    url = f"{GITHUB_API}/repos/{LEDGER_REPO}/issues"
    body = {
        "title": f"[openclaw-runtime] {action}",
        "body": json.dumps(
            {"action": action, "details": details, "timestamp": datetime.now(timezone.utc).isoformat()},
            indent=2,
        ),
        "labels": ["runtime-log"],
    }
    _github_post(url, body, breaker)


# ---------------------------------------------------------------------------
# Task sources
# ---------------------------------------------------------------------------


def fetch_github_issues(breaker: CircuitBreaker) -> list[Task]:
    """Pull open issues labelled 'openclaw-task' from the runtime repo."""
    repo = os.environ.get("OPENCLAW_REPO", "EvezArt/openclaw")
    url = f"{GITHUB_API}/repos/{repo}/issues?labels=openclaw-task&state=open&per_page=20"
    data = _github_get(url, breaker)
    if not data or not isinstance(data, list):
        return []
    return [
        Task(
            id=f"gh-{item['number']}",
            source=TaskSource.GITHUB_ISSUE,
            title=item.get("title", "untitled"),
            payload={"number": item["number"], "url": item.get("html_url", "")},
        )
        for item in data
    ]


def fetch_ledger_decisions(breaker: CircuitBreaker) -> list[Task]:
    """Pull pending decisions from the autonomous ledger."""
    url = f"{GITHUB_API}/repos/{LEDGER_REPO}/issues?labels=pending-decision&state=open&per_page=10"
    data = _github_get(url, breaker)
    if not data or not isinstance(data, list):
        return []
    return [
        Task(
            id=f"ledger-{item['number']}",
            source=TaskSource.LEDGER_DECISION,
            title=item.get("title", "untitled"),
            payload={"number": item["number"], "body": item.get("body", "")},
        )
        for item in data
    ]


def load_self_generated_todos() -> list[Task]:
    """Read TODO items from a local file produced by previous runtime cycles."""
    todo_path = Path(__file__).resolve().parent / "todos.json"
    if not todo_path.exists():
        return []
    try:
        items = json.loads(todo_path.read_text())
        return [
            Task(id=f"todo-{i}", source=TaskSource.SELF_GENERATED, title=t.get("title", ""), payload=t)
            for i, t in enumerate(items)
        ]
    except (json.JSONDecodeError, OSError) as exc:
        logger.warning("Failed to load todos: %s", exc)
        return []


# ---------------------------------------------------------------------------
# Task dispatcher
# ---------------------------------------------------------------------------


class TaskDispatcher:
    """Routes tasks to the appropriate handler module."""

    def __init__(self) -> None:
        self._handlers: dict[TaskSource, Any] = {}

    def register(self, source: TaskSource, handler: Any) -> None:
        self._handlers[source] = handler

    async def dispatch(self, task: Task) -> dict[str, Any]:
        handler = self._handlers.get(task.source)
        if handler is None:
            logger.info("No handler for task source %s — skipping %s", task.source.value, task.id)
            return {"status": "skipped", "reason": "no_handler"}
        try:
            if asyncio.iscoroutinefunction(handler):
                result = await handler(task)
            else:
                result = handler(task)
            task.status = "completed"
            return {"status": "completed", "result": result}
        except Exception as exc:
            task.status = "failed"
            logger.error("Task %s failed: %s", task.id, exc)
            return {"status": "failed", "error": str(exc)}


# ---------------------------------------------------------------------------
# Health monitoring
# ---------------------------------------------------------------------------


@dataclass
class HealthStatus:
    uptime_seconds: float = 0.0
    tasks_processed: int = 0
    tasks_failed: int = 0
    last_tick: str = ""
    circuit_breakers: dict[str, str] = field(default_factory=dict)


def create_health_issue(breaker: CircuitBreaker, health: HealthStatus, reason: str) -> None:
    """Open a GitHub issue when the runtime detects a problem."""
    repo = os.environ.get("OPENCLAW_REPO", "EvezArt/openclaw")
    url = f"{GITHUB_API}/repos/{repo}/issues"
    body = {
        "title": f"[runtime-alert] {reason}",
        "body": (
            f"**Runtime self-check detected an issue**\n\n"
            f"- Uptime: {health.uptime_seconds:.0f}s\n"
            f"- Tasks processed: {health.tasks_processed}\n"
            f"- Tasks failed: {health.tasks_failed}\n"
            f"- Reason: {reason}\n"
            f"- Timestamp: {datetime.now(timezone.utc).isoformat()}\n"
        ),
        "labels": ["runtime-alert", "automated"],
    }
    _github_post(url, body, breaker)


# ---------------------------------------------------------------------------
# Autonomous runtime
# ---------------------------------------------------------------------------


class AutonomousRuntime:
    """The immortal runtime loop — processes tasks, learns, and expands."""

    def __init__(self) -> None:
        self._running = False
        self._start_time = 0.0
        self._health = HealthStatus()
        self._dispatcher = TaskDispatcher()

        # One circuit breaker per external service
        self._breakers: dict[str, CircuitBreaker] = {
            "github": CircuitBreaker(name="github"),
            "ledger": CircuitBreaker(name="ledger"),
        }

        self._backoff = INITIAL_BACKOFF_SECONDS
        self._consecutive_errors = 0

    # -- lifecycle ----------------------------------------------------------

    def start(self) -> None:
        self._running = True
        self._start_time = time.monotonic()
        logger.info("OpenClaw Autonomous Runtime starting")
        log_to_ledger(self._breakers["ledger"], "runtime_start", {"pid": os.getpid()})

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        for sig in (signal.SIGINT, signal.SIGTERM):
            loop.add_signal_handler(sig, self.stop)

        try:
            loop.run_until_complete(self._run())
        finally:
            log_to_ledger(self._breakers["ledger"], "runtime_stop", {"uptime": self._health.uptime_seconds})
            loop.close()

    def stop(self) -> None:
        logger.info("Shutdown signal received — stopping runtime")
        self._running = False

    # -- main loop ----------------------------------------------------------

    async def _run(self) -> None:
        while self._running:
            tick_start = time.monotonic()
            try:
                await self._tick()
                self._consecutive_errors = 0
                self._backoff = INITIAL_BACKOFF_SECONDS
            except Exception as exc:
                self._consecutive_errors += 1
                logger.error("Tick error (#%d): %s", self._consecutive_errors, exc)
                self._backoff = min(self._backoff * 2, MAX_BACKOFF_SECONDS)

                if self._consecutive_errors >= 10:
                    create_health_issue(
                        self._breakers["github"],
                        self._health,
                        f"10 consecutive tick failures — last: {exc}",
                    )

            self._health.uptime_seconds = time.monotonic() - self._start_time
            self._health.last_tick = datetime.now(timezone.utc).isoformat()
            self._health.circuit_breakers = {k: v.state.value for k, v in self._breakers.items()}

            sleep_time = max(TICK_INTERVAL_SECONDS, self._backoff) if self._consecutive_errors else TICK_INTERVAL_SECONDS
            await asyncio.sleep(sleep_time)

    async def _tick(self) -> None:
        """Single iteration: gather tasks → dispatch → log."""
        tasks: list[Task] = []

        tasks.extend(fetch_github_issues(self._breakers["github"]))
        tasks.extend(fetch_ledger_decisions(self._breakers["ledger"]))
        tasks.extend(load_self_generated_todos())

        if not tasks:
            logger.debug("No pending tasks this tick")
            return

        logger.info("Processing %d task(s)", len(tasks))
        for task in tasks:
            result = await self._dispatcher.dispatch(task)
            if result["status"] == "completed":
                self._health.tasks_processed += 1
            elif result["status"] == "failed":
                self._health.tasks_failed += 1

            log_to_ledger(
                self._breakers["ledger"],
                "task_result",
                {"task_id": task.id, "title": task.title, "result": result},
            )

    # -- public API ---------------------------------------------------------

    @property
    def health(self) -> HealthStatus:
        return self._health

    @property
    def dispatcher(self) -> TaskDispatcher:
        return self._dispatcher


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


def main() -> None:
    logging.basicConfig(
        level=os.environ.get("OPENCLAW_LOG_LEVEL", "INFO").upper(),
        format="%(asctime)s [%(name)s] %(levelname)s %(message)s",
    )
    runtime = AutonomousRuntime()
    runtime.start()


if __name__ == "__main__":
    main()
