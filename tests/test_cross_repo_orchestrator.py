import unittest
from unittest.mock import MagicMock, patch

from orchestrator.cross_repo import CrossRepoOrchestrator, _gh_post


class CrossRepoOrchestratorTests(unittest.TestCase):
    def test_gh_post_treats_empty_204_body_as_success(self) -> None:
        response = MagicMock()
        response.read.return_value = b""
        response.status = 204
        response.__enter__.return_value = response
        response.__exit__.return_value = None

        with patch("orchestrator.cross_repo.urlopen", return_value=response):
            result = _gh_post("https://example.test/dispatches", {"event_type": "dependency-update"})

        self.assertEqual(result, {"status": 204})

    def test_trigger_dependents_only_reports_successful_dispatches(self) -> None:
        orchestrator = CrossRepoOrchestrator()
        dependents = orchestrator.graph.get_dependents("EvezArt/evez-os")
        self.assertGreaterEqual(len(dependents), 2)

        post_results = [{"status": 204}] + [None] * (len(dependents) - 1)
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
