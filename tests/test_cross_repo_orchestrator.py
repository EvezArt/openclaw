import unittest
from unittest.mock import patch

from orchestrator.cross_repo import CrossRepoOrchestrator


class CrossRepoOrchestratorTests(unittest.TestCase):
    def test_trigger_dependents_only_reports_successful_dispatches(self) -> None:
        orchestrator = CrossRepoOrchestrator()
        dependents = orchestrator.graph.get_dependents("EvezArt/evez-os")
        self.assertGreaterEqual(len(dependents), 2)

        post_results = [{"ok": True}] + [None] * (len(dependents) - 1)
        with patch("orchestrator.cross_repo._gh_post", side_effect=post_results):
            triggered = orchestrator.trigger_dependents("EvezArt/evez-os")

        self.assertEqual(triggered, [dependents[0]])

    def test_trigger_dependents_returns_empty_when_dispatch_fails(self) -> None:
        orchestrator = CrossRepoOrchestrator()

        with patch("orchestrator.cross_repo._gh_post", return_value=None):
            triggered = orchestrator.trigger_dependents("EvezArt/openclaw")

        self.assertEqual(triggered, [])


if __name__ == "__main__":
    unittest.main()
