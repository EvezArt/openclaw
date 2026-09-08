"""Minimal HTTP gateway intended for phone-driven NextClaw control.

The gateway exposes only orchestration primitives. It does not execute shell
commands, manage secrets, deploy infrastructure, or invoke model providers.
A future authenticated transport can forward the same JSON envelopes to peer
nodes. For now the gateway can create a mission and fan it into local tasks.
"""
from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

from control_plane import ControlPlane
from prompt_gateway import plan_prompt


class Gateway:
    def __init__(self, db_path: str = "state/swarm.db") -> None:
        self.cp = ControlPlane(db_path)

    def mission(self, prompt: str) -> dict[str, Any]:
        plan = plan_prompt(self.cp, prompt)
        return {
            "parent": plan.parent.task_id,
            "children": [task.task_id for task in plan.children],
            "state": plan.parent.state,
            "mode": "free-first",
        }


class Handler(BaseHTTPRequestHandler):
    gateway = Gateway()

    def _json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, sort_keys=True).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/health":
            self._json(200, {"ok": True, "service": "nextclaw-phone-gateway", "mode": "free-first"})
            return
        self._json(404, {"ok": False, "error": "not_found"})

    def do_POST(self) -> None:  # noqa: N802
        if self.path != "/mission":
            self._json(404, {"ok": False, "error": "not_found"})
            return
        length = int(self.headers.get("Content-Length", "0"))
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            prompt = str(payload.get("prompt", "")).strip()
            if not prompt:
                raise ValueError("prompt is required")
            self._json(201, {"ok": True, **self.gateway.mission(prompt)})
        except (ValueError, json.JSONDecodeError) as exc:
            self._json(400, {"ok": False, "error": str(exc)})


def serve(host: str = "127.0.0.1", port: int = 8787) -> None:
    ThreadingHTTPServer((host, port), Handler).serve_forever()


if __name__ == "__main__":
    serve()
