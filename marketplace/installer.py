"""
Skill Installer — downloads, validates, installs, updates, and removes skills
at runtime with rollback capability.
"""

from __future__ import annotations

import json
import logging
import os
import shutil
import tempfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen

from marketplace.registry import SkillEntry, SkillRegistry

logger = logging.getLogger("openclaw.marketplace.installer")

SKILLS_DIR = Path(__file__).resolve().parent.parent / "skills"
BACKUP_DIR = Path(__file__).resolve().parent / ".backups"
GITHUB_API = "https://api.github.com"

# Constitutional rules that skills must not violate
CONSTITUTIONAL_RULES = [
    "no_data_exfiltration",
    "no_arbitrary_code_execution_without_sandbox",
    "no_credential_harvesting",
    "respect_user_privacy",
    "log_all_actions",
]


@dataclass
class InstallResult:
    success: bool
    message: str
    skill_name: str
    version: str = ""
    rollback_available: bool = False


class ConstitutionalViolation(Exception):
    """Raised when a skill violates constitutional rules."""


class SkillInstaller:
    """Manages the lifecycle of skills — install, update, remove, rollback."""

    def __init__(self, registry: SkillRegistry | None = None) -> None:
        self._registry = registry or SkillRegistry()
        BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    # -- validation ---------------------------------------------------------

    @staticmethod
    def validate_constitutional_compliance(skill_dir: Path) -> list[str]:
        """Check a skill directory for constitutional rule violations.

        Returns a list of violation descriptions (empty = compliant).
        """
        violations: list[str] = []

        for py_file in skill_dir.rglob("*.py"):
            try:
                content = py_file.read_text(errors="replace")
            except OSError:
                continue

            # Basic static checks — not exhaustive, but catches obvious issues
            if "subprocess.call" in content and "shell=True" in content:
                violations.append(f"{py_file.name}: shell=True in subprocess — potential arbitrary execution")
            if "os.environ" in content and ("send" in content or "post" in content.lower()):
                violations.append(f"{py_file.name}: possible credential exfiltration via environment variables")

        return violations

    # -- install ------------------------------------------------------------

    def install(self, skill: SkillEntry, source_url: str | None = None) -> InstallResult:
        """Download and install a skill from GitHub."""
        target_dir = SKILLS_DIR / skill.name

        # Back up existing version if upgrading
        if target_dir.exists():
            self._backup(skill.name)

        try:
            # Download skill files
            src = self._download(skill, source_url)
            if src is None:
                return InstallResult(success=False, message="Download failed", skill_name=skill.name)

            # Validate constitutional compliance
            violations = self.validate_constitutional_compliance(src)
            if violations:
                shutil.rmtree(src, ignore_errors=True)
                msg = f"Constitutional violations: {'; '.join(violations)}"
                logger.warning("Skill %s rejected: %s", skill.name, msg)
                return InstallResult(success=False, message=msg, skill_name=skill.name)

            # Move into place
            if target_dir.exists():
                shutil.rmtree(target_dir)
            shutil.move(str(src), str(target_dir))

            # Update registry
            skill.health_status = "installed"
            skill.last_checked = datetime.now(timezone.utc).isoformat()
            self._registry.register(skill)
            self._registry.save()

            logger.info("Installed skill: %s v%s", skill.name, skill.version)
            return InstallResult(
                success=True,
                message="Installed successfully",
                skill_name=skill.name,
                version=skill.version,
                rollback_available=True,
            )
        except Exception as exc:
            logger.error("Install failed for %s: %s", skill.name, exc)
            self.rollback(skill.name)
            return InstallResult(success=False, message=str(exc), skill_name=skill.name, rollback_available=True)

    def _download(self, skill: SkillEntry, source_url: str | None = None) -> Path | None:
        """Download skill files to a temporary directory."""
        token = os.environ.get("GITHUB_TOKEN", os.environ.get("GH_TOKEN", ""))
        headers: dict[str, str] = {"Accept": "application/vnd.github+json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        repo = skill.source_repo or f"EvezArt/{skill.name}"
        url = source_url or f"{GITHUB_API}/repos/{repo}/contents/skills/{skill.name}"

        try:
            req = Request(url, headers=headers)
            with urlopen(req, timeout=30) as resp:  # noqa: S310
                contents = json.loads(resp.read())
        except (URLError, OSError, json.JSONDecodeError) as exc:
            logger.warning("Download failed for %s: %s", skill.name, exc)
            return None

        tmp = Path(tempfile.mkdtemp(prefix=f"openclaw-skill-{skill.name}-"))

        if isinstance(contents, list):
            for item in contents:
                if item.get("type") == "file" and item.get("download_url"):
                    self._download_file(item["download_url"], tmp / item["name"], headers)
        elif isinstance(contents, dict) and contents.get("download_url"):
            self._download_file(contents["download_url"], tmp / contents.get("name", "file"), headers)

        return tmp

    @staticmethod
    def _download_file(url: str, dest: Path, headers: dict[str, str]) -> None:
        try:
            req = Request(url, headers=headers)
            with urlopen(req, timeout=30) as resp:  # noqa: S310
                dest.write_bytes(resp.read())
        except (URLError, OSError) as exc:
            logger.warning("Failed to download %s: %s", url, exc)

    # -- backup & rollback --------------------------------------------------

    def _backup(self, name: str) -> None:
        src = SKILLS_DIR / name
        if not src.exists():
            return
        ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")
        dest = BACKUP_DIR / f"{name}_{ts}"
        shutil.copytree(str(src), str(dest))
        logger.info("Backed up skill %s to %s", name, dest)

    def rollback(self, name: str) -> bool:
        """Restore the most recent backup of a skill."""
        backups = sorted(BACKUP_DIR.glob(f"{name}_*"), reverse=True)
        if not backups:
            logger.warning("No backup found for %s", name)
            return False

        target = SKILLS_DIR / name
        if target.exists():
            shutil.rmtree(target)
        shutil.copytree(str(backups[0]), str(target))
        logger.info("Rolled back skill %s from %s", name, backups[0].name)
        return True

    # -- remove -------------------------------------------------------------

    def remove(self, name: str) -> InstallResult:
        """Remove a skill (with backup first)."""
        target = SKILLS_DIR / name
        if not target.exists():
            return InstallResult(success=False, message="Skill not found", skill_name=name)

        self._backup(name)
        shutil.rmtree(target)
        self._registry.unregister(name)
        self._registry.save()
        logger.info("Removed skill: %s", name)
        return InstallResult(success=True, message="Removed (backup preserved)", skill_name=name, rollback_available=True)

    # -- update -------------------------------------------------------------

    def update(self, name: str) -> InstallResult:
        """Re-install the latest version of a skill."""
        skill = self._registry.get(name)
        if skill is None:
            return InstallResult(success=False, message="Skill not in registry", skill_name=name)
        return self.install(skill)
