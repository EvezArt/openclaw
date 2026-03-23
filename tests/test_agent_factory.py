import unittest

from agents.factory import AgentFactory


class AgentFactoryBusSubscriptionTests(unittest.IsolatedAsyncioTestCase):
    async def test_kill_removes_bus_subscription(self) -> None:
        factory = AgentFactory()
        handled: list[dict[str, str]] = []

        async def handler(task: dict[str, str]) -> dict[str, str]:
            handled.append(task)
            return {"ok": "true"}

        factory.register_from_skill("bridge", ["sync"], handler)
        agent = factory.spawn("bridge")
        self.assertIsNotNone(agent)

        await factory.bus.publish("sync", {"step": "before-kill"})
        self.assertEqual([task["step"] for task in handled], ["before-kill"])

        self.assertTrue(factory.kill(agent.id))  # type: ignore[union-attr]
        await factory.bus.publish("sync", {"step": "after-kill"})

        self.assertEqual([task["step"] for task in handled], ["before-kill"])

    async def test_respawn_does_not_duplicate_bus_delivery(self) -> None:
        factory = AgentFactory()
        handled: list[dict[str, str]] = []

        async def handler(task: dict[str, str]) -> dict[str, str]:
            handled.append(task)
            return {"ok": "true"}

        factory.register_from_skill("bridge", ["sync"], handler)
        original = factory.spawn("bridge")
        self.assertIsNotNone(original)

        replacement = factory.respawn(original.id)  # type: ignore[union-attr]
        self.assertIsNotNone(replacement)

        await factory.bus.publish("sync", {"step": "after-respawn"})

        self.assertEqual([task["step"] for task in handled], ["after-respawn"])


if __name__ == "__main__":
    unittest.main()
