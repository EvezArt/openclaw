import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { createHookEvent } from "../../hooks.js";
import handler from "./handler.js";

async function createStateDir(): Promise<string> {
  return await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-interaction-ledger-"));
}

describe("interaction-ledger hook", () => {
  it("writes versioned schema records for interaction events", async () => {
    const stateDir = await createStateDir();
    process.env.OPENCLAW_STATE_DIR = stateDir;

    const event = createHookEvent("interaction", "inbound:accepted", "agent:main:main", {
      eventType: "message",
      eventName: "inbound.accepted",
      direction: "inbound",
      channel: "telegram",
      accountId: "default",
      sessionKey: "agent:main:main",
      contentHash: "abc123",
      redaction: { content: true, identifiers: false, metadata: false },
      outcome: { status: "accepted" },
    });

    await handler(event);

    const ledgerPath = path.join(stateDir, "logs", "interaction-ledger.jsonl");
    const content = await fs.readFile(ledgerPath, "utf8");
    const parsed = JSON.parse(content.trim()) as Record<string, unknown>;

    expect(parsed.version).toBe(1);
    expect(parsed.eventType).toBe("message");
    expect(parsed.direction).toBe("inbound");
    expect(parsed.channel).toBe("telegram");
    expect(parsed.outcome).toEqual({ status: "accepted" });
  });

  it("preserves channel-agnostic ingestion fields", async () => {
    const stateDir = await createStateDir();
    process.env.OPENCLAW_STATE_DIR = stateDir;

    const channels = ["slack", "matrix", "msteams"];
    for (const channel of channels) {
      const event = createHookEvent("interaction", "outbound:send", `agent:${channel}:main`, {
        eventType: "message",
        eventName: "outbound.send",
        direction: "outbound",
        channel,
        sessionKey: `agent:${channel}:main`,
        outcome: { status: "sent" },
      });
      await handler(event);
    }

    const ledgerPath = path.join(stateDir, "logs", "interaction-ledger.jsonl");
    const lines = (await fs.readFile(ledgerPath, "utf8")).trim().split("\n");
    const parsedChannels = lines.map((line) => (JSON.parse(line) as { channel: string }).channel);

    expect(parsedChannels).toEqual(channels);
  });

  it("ignores non-interaction events", async () => {
    const stateDir = await createStateDir();
    process.env.OPENCLAW_STATE_DIR = stateDir;

    await handler(createHookEvent("command", "new", "agent:main:main"));

    const ledgerPath = path.join(stateDir, "logs", "interaction-ledger.jsonl");
    await expect(fs.access(ledgerPath)).rejects.toThrow();
  });
});
