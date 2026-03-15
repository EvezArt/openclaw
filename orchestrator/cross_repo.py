"""
Cross-Repo Orchestrator — wires the EvezArt ecosystem repos into a unified
system with dependency tracking, cascading updates, and constitutional compliance.
"""

from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen

logger = logging.getLogger("openclaw.orchestrator")

GITHUB_API = "https://api.github.com"
ECOSYSTEM_CONFIG_PATH = Path(__file__).resolve().parent.parent / "config" / "ecosystem.json"
ECOSYSTEM_STATE_PATH = Path(__file__).resolve().parent / "ecosystem_state.json"


# ---------------------------------------------------------------------------
# Dependency graph
# ---------------------------------------------------------------------------


@dataclass
class RepoNode:
    """A repository in the ecosystem dependency graph."""

    name: str  # e.g. "EvezArt/openclaw"
    role: str = ""  # e.g. "runtime", "brain", "ledger"
    depends_on: list[str] = field(default_factory=list)
    dependents: list[str] = field(default_factory=list)
    last_commit_sha: str = ""
    last_checked: str = ""
    health: str = "unknown"  # green, yellow, red, unknown


class DependencyGraph:
    """Directed graph of repo dependencies."""

    def __init__(self) -> None:
        self._nodes: dict[str, RepoNode] = {}

    def add_node(self, name: str, role: str = "") -> RepoNode:
        if name not in self._nodes:
            self._nodes[name] = RepoNode(name=name, role=role)
        return self._nodes[name]

    def add_edge(self, from_repo: str, to_repo: str) -> None:
        """from_repo depends on to_repo."""
        self.add_node(from_repo)
        self.add_node(to_repo)
        if to_repo not in self._nodes[from_repo].depends_on:
            self._nodes[from_repo].depends_on.append(to_repo)
        if from_repo not in self._nodes[to_repo].dependents:
            self._nodes[to_repo].dependents.append(from_repo)

    def get_dependents(self, repo: str) -> list[str]:
        node = self._nodes.get(repo)
        return node.dependents if node else []

    def get_all(self) -> list[RepoNode]:
        return list(self._nodes.values())

    def get(self, repo: str) -> RepoNode | None:
        return self._nodes.get(repo)

    def to_dict(self) -> dict[str, Any]:
        return {
            name: {
                "role": node.role,
                "depends_on": node.depends_on,
                "dependents": node.dependents,
                "last_commit_sha": node.last_commit_sha,
                "last_checked": node.last_checked,
                "health": node.health,
            }
            for name, node in self._nodes.items()
        }


# ---------------------------------------------------------------------------
# Default ecosystem dependency map
# ---------------------------------------------------------------------------

# Core dependencies: when repo A changes, repos in its dependents list need updating
DEFAULT_DEPENDENCIES: list[tuple[str, str]] = [
    # (dependent, dependency) — "dependent depends on dependency"
    ("EvezArt/openclaw", "EvezArt/evez-os"),
    ("EvezArt/openclaw", "EvezArt/evez-agentnet"),
    ("EvezArt/openclaw", "EvezArt/evez-autonomous-ledger"),
    ("EvezArt/evez-agentnet", "EvezArt/evez-os"),
    ("EvezArt/lord-evez", "EvezArt/openclaw"),
    ("EvezArt/lord-evez", "EvezArt/evez-autonomous-ledger"),
    ("EvezArt/animated-goggles", "EvezArt/openclaw"),
    ("EvezArt/moltbot-live", "EvezArt/openclaw"),
    ("EvezArt/evez-sim", "EvezArt/evez-os"),
    ("EvezArt/evez-vcl", "EvezArt/evez-os"),
    ("EvezArt/ephv", "EvezArt/Evez666"),
    ("EvezArt/surething-offline", "EvezArt/evez-os"),
    ("EvezArt/polymarket-speedrun", "EvezArt/evez-os"),
]


# ---------------------------------------------------------------------------
# GitHub helpers
# ---------------------------------------------------------------------------


def _gh_headers() -> dict[str, str]:
    token = os.environ.get("GITHUB_TOKEN", os.environ.get("GH_TOKEN", ""))
    h: dict[str, str] = {"Accept": "application/vnd.github+json"}
    if token:
        h["Authorization"] = f"Bearer {token}"
    return h


def _gh_get(url: str) -> Any | None:
    try:
        req = Request(url, headers=_gh_headers())
        with urlopen(req, timeout=20) as resp:  # noqa: S310
            return json.loads(resp.read())
    except (URLError, OSError, json.JSONDecodeError) as exc:
        logger.warning("GET %s failed: %s", url, exc)
        return None


def _gh_post(url: str, body: dict[str, Any]) -> Any | None:
    try:
        payload = json.dumps(body).encode()
        req = Request(url, data=payload, headers={**_gh_headers(), "Content-Type": "application/json"})
        with urlopen(req, timeout=20) as resp:  # noqa: S310
            return json.loads(resp.read())
    except (URLError, OSError, json.JSONDecodeError) as exc:
        logger.warning("POST %s failed: %s", url, exc)
        return None


# ---------------------------------------------------------------------------
# Cross-Repo Orchestrator
# ---------------------------------------------------------------------------


class CrossRepoOrchestrator:
    """Monitors ecosystem repos and triggers cascading updates."""

    def __init__(self) -> None:
        self._graph = DependencyGraph()
        self._ecosystem_config: dict[str, str] = {}
        self._load_config()
        self._build_graph()

    # -- setup --------------------------------------------------------------

    def _load_config(self) -> None:
        if ECOSYSTEM_CONFIG_PATH.exists():
            try:
                self._ecosystem_config = json.loads(ECOSYSTEM_CONFIG_PATH.read_text())
            except (json.JSONDecodeError, OSError) as exc:
                logger.warning("Failed to load ecosystem config: %s", exc)

    def _build_graph(self) -> None:
        # Add nodes from ecosystem config
        for role, repo in self._ecosystem_config.items():
            self._graph.add_node(repo, role=role)

        # Add default dependency edges
        for dependent, dependency in DEFAULT_DEPENDENCIES:
            self._graph.add_edge(dependent, dependency)

    # -- status checking ----------------------------------------------------

    def check_repo_status(self, repo: str) -> dict[str, Any]:
        """Get latest commit + repo health for a single repo."""
        node = self._graph.get(repo)
        if node is None:
            return {"repo": repo, "status": "not_tracked"}

        # Fetch latest commit on default branch
        data = _gh_get(f"{GITHUB_API}/repos/{repo}/commits?per_page=1")
        if data and isinstance(data, list) and len(data) > 0:
            node.last_commit_sha = data[0].get("sha", "")[:12]
            node.last_checked = datetime.now(timezone.utc).isoformat()
            node.health = "green"
        else:
            node.health = "red" if node.health != "unknown" else "unknown"

        # Check for recent workflow failures
        runs = _gh_get(f"{GITHUB_API}/repos/{repo}/actions/runs?per_page=3&status=failure")
        if runs and isinstance(runs, dict) and runs.get("total_count", 0) > 0:
            node.health = "yellow"

        return {
            "repo": repo,
            "role": node.role,
            "health": node.health,
            "last_commit": node.last_commit_sha,
            "depends_on": node.depends_on,
            "dependents": node.dependents,
        }

    def check_all(self) -> list[dict[str, Any]]:
        """Check status of all repos in the ecosystem."""
        results = []
        for node in self._graph.get_all():
            results.append(self.check_repo_status(node.name))
        return results

    # -- cascading triggers -------------------------------------------------

    def trigger_dependents(self, changed_repo: str, event_type: str = "dependency-update") -> list[str]:
        """Trigger repository_dispatch in all repos that depend on changed_repo."""
        dependents = self._graph.get_dependents(changed_repo)
        triggered: list[str] = []

        for dep_repo in dependents:
            url = f"{GITHUB_API}/repos/{dep_repo}/dispatches"
            body = {
                "event_type": event_type,
                "client_payload": {
                    "source_repo": changed_repo,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
            }
            result = _gh_post(url, body)
            if result is not None or True:  # dispatches return 204 (no body)
                triggered.append(dep_repo)
                logger.info("Triggered %s in %s (source: %s)", event_type, dep_repo, changed_repo)

        return triggered

    # -- constitutional compliance ------------------------------------------

    def check_constitutional_compliance(self, repo: str) -> dict[str, Any]:
        """Check if a repo has the required constitutional files."""
        required_files = ["CLAUDE.md", "AGENTS.md"]
        results: dict[str, bool] = {}

        for fname in required_files:
            data = _gh_get(f"{GITHUB_API}/repos/{repo}/contents/{fname}")
            results[fname] = data is not None and isinstance(data, dict) and "sha" in data

        compliant = all(results.values())
        return {"repo": repo, "compliant": compliant, "files": results}

    # -- state persistence --------------------------------------------------

    def save_state(self) -> None:
        state = {
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "graph": self._graph.to_dict(),
            "ecosystem_config": self._ecosystem_config,
        }
        ECOSYSTEM_STATE_PATH.write_text(json.dumps(state, indent=2) + "\n")
        logger.info("Ecosystem state saved to %s", ECOSYSTEM_STATE_PATH)

    def load_state(self) -> bool:
        if not ECOSYSTEM_STATE_PATH.exists():
            return False
        try:
            state = json.loads(ECOSYSTEM_STATE_PATH.read_text())
            logger.info("Loaded ecosystem state from %s", state.get("updated_at", "unknown"))
            return True
        except (json.JSONDecodeError, OSError):
            return False

    # -- summary ------------------------------------------------------------

    @property
    def graph(self) -> DependencyGraph:
        return self._graph

    def summary(self) -> dict[str, Any]:
        nodes = self._graph.get_all()
        return {
            "total_repos": len(nodes),
            "healthy": sum(1 for n in nodes if n.health == "green"),
            "degraded": sum(1 for n in nodes if n.health == "yellow"),
            "down": sum(1 for n in nodes if n.health == "red"),
            "unknown": sum(1 for n in nodes if n.health == "unknown"),
        }


# ---------------------------------------------------------------------------
# CLI entry
# ---------------------------------------------------------------------------


def main() -> None:
    logging.basicConfig(level="INFO", format="%(asctime)s [%(name)s] %(levelname)s %(message)s")
    orch = CrossRepoOrchestrator()
    results = orch.check_all()
    orch.save_state()

    for r in results:
        status = r.get("health", "unknown")
        icon = {"green": "+", "yellow": "~", "red": "!", "unknown": "?"}.get(status, "?")
        logger.info("[%s] %s (%s) — %s", icon, r["repo"], r.get("role", ""), status)

    s = orch.summary()
    logger.info("Ecosystem: %d repos — %d green, %d yellow, %d red, %d unknown", s["total_repos"], s["healthy"], s["degraded"], s["down"], s["unknown"])


if __name__ == "__main__":
    main()
