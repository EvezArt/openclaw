"""
Skill Marketplace Registry — maintains a catalog of all available skills,
auto-discovers new skills from EvezArt repos, and persists to registry.json.
"""

from __future__ import annotations

import json
import logging
import os
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen

logger = logging.getLogger("openclaw.marketplace.registry")

REGISTRY_PATH = Path(__file__).resolve().parent / "registry.json"
GITHUB_API = "https://api.github.com"
EVEZART_ORG = "EvezArt"

# Repos known to contain skills
SKILL_REPOS = [
    "openclaw",
    "evez-agentnet",
    "animated-goggles",
    "agentvault",
]


@dataclass
class SkillEntry:
    name: str
    version: str = "0.0.0"
    capabilities: list[str] = field(default_factory=list)
    author: str = "unknown"
    install_command: str = ""
    health_status: str = "unknown"
    source_repo: str = ""
    last_checked: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> SkillEntry:
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})


class SkillRegistry:
    """In-memory skill registry backed by a JSON file."""

    def __init__(self, path: Path = REGISTRY_PATH) -> None:
        self._path = path
        self._skills: dict[str, SkillEntry] = {}
        self._load()

    # -- persistence --------------------------------------------------------

    def _load(self) -> None:
        if not self._path.exists():
            return
        try:
            data = json.loads(self._path.read_text())
            for name, entry in data.get("skills", {}).items():
                self._skills[name] = SkillEntry.from_dict(entry)
            logger.info("Loaded %d skills from registry", len(self._skills))
        except (json.JSONDecodeError, OSError) as exc:
            logger.warning("Failed to load registry: %s", exc)

    def save(self) -> None:
        payload = {
            "version": "1.0.0",
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "skills": {name: entry.to_dict() for name, entry in sorted(self._skills.items())},
        }
        self._path.write_text(json.dumps(payload, indent=2) + "\n")
        logger.info("Registry saved with %d skills", len(self._skills))

    # -- CRUD ---------------------------------------------------------------

    def register(self, skill: SkillEntry) -> None:
        self._skills[skill.name] = skill

    def unregister(self, name: str) -> bool:
        return self._skills.pop(name, None) is not None

    def get(self, name: str) -> SkillEntry | None:
        return self._skills.get(name)

    def list_all(self) -> list[SkillEntry]:
        return list(self._skills.values())

    def search(self, query: str) -> list[SkillEntry]:
        q = query.lower()
        return [s for s in self._skills.values() if q in s.name.lower() or any(q in c.lower() for c in s.capabilities)]

    # -- discovery ----------------------------------------------------------

    def discover_from_github(self) -> int:
        """Scan EvezArt repos for skill definitions. Returns count of new skills found."""
        token = os.environ.get("GITHUB_TOKEN", os.environ.get("GH_TOKEN", ""))
        headers: dict[str, str] = {"Accept": "application/vnd.github+json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        discovered = 0
        for repo_name in SKILL_REPOS:
            skills = self._scan_repo(repo_name, headers)
            for skill in skills:
                if skill.name not in self._skills:
                    self._skills[skill.name] = skill
                    discovered += 1
                    logger.info("Discovered new skill: %s (from %s)", skill.name, repo_name)

        if discovered:
            self.save()
        return discovered

    def discover_all_repos(self) -> int:
        """Scan ALL repos in the EvezArt org for skills."""
        token = os.environ.get("GITHUB_TOKEN", os.environ.get("GH_TOKEN", ""))
        headers: dict[str, str] = {"Accept": "application/vnd.github+json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        url = f"{GITHUB_API}/orgs/{EVEZART_ORG}/repos?per_page=100&type=public"
        try:
            req = Request(url, headers=headers)
            with urlopen(req, timeout=30) as resp:  # noqa: S310
                repos = json.loads(resp.read())
        except (URLError, OSError, json.JSONDecodeError) as exc:
            logger.warning("Failed to list EvezArt repos: %s", exc)
            return 0

        discovered = 0
        for repo in repos:
            name = repo.get("name", "")
            if not name:
                continue
            skills = self._scan_repo(name, headers)
            for skill in skills:
                if skill.name not in self._skills:
                    self._skills[skill.name] = skill
                    discovered += 1

        if discovered:
            self.save()
        return discovered

    @staticmethod
    def _scan_repo(repo_name: str, headers: dict[str, str]) -> list[SkillEntry]:
        """Look for skill manifests (SKILL.md or skill.json) in a repo's skills/ directory."""
        url = f"{GITHUB_API}/repos/{EVEZART_ORG}/{repo_name}/contents/skills"
        try:
            req = Request(url, headers=headers)
            with urlopen(req, timeout=15) as resp:  # noqa: S310
                contents = json.loads(resp.read())
        except (URLError, OSError, json.JSONDecodeError):
            return []

        skills: list[SkillEntry] = []
        if isinstance(contents, list):
            for item in contents:
                if item.get("type") == "dir":
                    skills.append(
                        SkillEntry(
                            name=item["name"],
                            source_repo=f"{EVEZART_ORG}/{repo_name}",
                            author=EVEZART_ORG,
                            last_checked=datetime.now(timezone.utc).isoformat(),
                        )
                    )
        return skills


# ---------------------------------------------------------------------------
# CLI entry
# ---------------------------------------------------------------------------


def main() -> None:
    logging.basicConfig(level="INFO", format="%(asctime)s [%(name)s] %(levelname)s %(message)s")
    registry = SkillRegistry()
    count = registry.discover_from_github()
    logger.info("Discovery complete — %d new skills found, %d total", count, len(registry.list_all()))


if __name__ == "__main__":
    main()
