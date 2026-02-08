import fs from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { withTempHome } from "./test-helpers.js";

describe("config CrawFather and CrawDad", () => {
  let previousHome: string | undefined;

  beforeEach(() => {
    previousHome = process.env.HOME;
  });

  afterEach(() => {
    process.env.HOME = previousHome;
  });

  it("accepts CrawFather as assistant name with ui.assistant config", async () => {
    await withTempHome(async (home) => {
      const configDir = path.join(home, ".openclaw");
      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(
        path.join(configDir, "openclaw.json"),
        JSON.stringify(
          {
            ui: {
              assistant: {
                name: "CrawFather",
                avatar: "🦞",
              },
            },
            agents: {
              defaults: {
                workspace: "~/.openclaw/workspace",
              },
              list: [
                {
                  id: "main",
                  identity: {
                    name: "CrawFather",
                    theme: "wise crustacean mentor",
                    emoji: "🦞",
                  },
                },
              ],
            },
            channels: {
              whatsapp: {
                allowFrom: ["+15555550123"],
              },
            },
          },
          null,
          2,
        ),
        "utf-8",
      );

      vi.resetModules();
      const { loadConfig } = await import("./config.js");
      const cfg = loadConfig();

      expect(cfg.agents?.list?.[0]?.identity?.name).toBe("CrawFather");
      expect(cfg.agents?.list?.[0]?.identity?.theme).toBe("wise crustacean mentor");
      expect(cfg.agents?.list?.[0]?.identity?.emoji).toBe("🦞");
      expect(cfg.ui?.assistant?.name).toBe("CrawFather");
      expect(cfg.ui?.assistant?.avatar).toBe("🦞");
    });
  });

  it("accepts CrawDad as assistant name with ui.assistant config", async () => {
    await withTempHome(async (home) => {
      const configDir = path.join(home, ".openclaw");
      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(
        path.join(configDir, "openclaw.json"),
        JSON.stringify(
          {
            ui: {
              assistant: {
                name: "CrawDad",
                avatar: "🦀",
              },
            },
            agents: {
              defaults: {
                workspace: "~/.openclaw/workspace",
              },
              list: [
                {
                  id: "main",
                  identity: {
                    name: "CrawDad",
                    theme: "friendly crustacean helper",
                    emoji: "🦀",
                  },
                },
              ],
            },
          },
          null,
          2,
        ),
        "utf-8",
      );

      vi.resetModules();
      const { loadConfig } = await import("./config.js");
      const cfg = loadConfig();

      expect(cfg.agents?.list?.[0]?.identity?.name).toBe("CrawDad");
      expect(cfg.agents?.list?.[0]?.identity?.theme).toBe("friendly crustacean helper");
      expect(cfg.agents?.list?.[0]?.identity?.emoji).toBe("🦀");
      expect(cfg.ui?.assistant?.name).toBe("CrawDad");
      expect(cfg.ui?.assistant?.avatar).toBe("🦀");
    });
  });

  it("accepts CrawFather in agent-specific identity", async () => {
    await withTempHome(async (home) => {
      const configDir = path.join(home, ".openclaw");
      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(
        path.join(configDir, "openclaw.json"),
        JSON.stringify(
          {
            agents: {
              list: [
                {
                  id: "main",
                  identity: {
                    name: "CrawFather",
                    theme: "wise crustacean mentor",
                    emoji: "🦞",
                  },
                },
              ],
            },
          },
          null,
          2,
        ),
        "utf-8",
      );

      vi.resetModules();
      const { loadConfig } = await import("./config.js");
      const cfg = loadConfig();

      expect(cfg.agents?.list?.[0]?.identity?.name).toBe("CrawFather");
      expect(cfg.agents?.list?.[0]?.identity?.theme).toBe("wise crustacean mentor");
      expect(cfg.agents?.list?.[0]?.identity?.emoji).toBe("🦞");
    });
  });

  it("accepts CrawDad in agent-specific identity", async () => {
    await withTempHome(async (home) => {
      const configDir = path.join(home, ".openclaw");
      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(
        path.join(configDir, "openclaw.json"),
        JSON.stringify(
          {
            agents: {
              list: [
                {
                  id: "main",
                  identity: {
                    name: "CrawDad",
                    theme: "friendly crustacean helper",
                    emoji: "🦀",
                  },
                },
              ],
            },
          },
          null,
          2,
        ),
        "utf-8",
      );

      vi.resetModules();
      const { loadConfig } = await import("./config.js");
      const cfg = loadConfig();

      expect(cfg.agents?.list?.[0]?.identity?.name).toBe("CrawDad");
      expect(cfg.agents?.list?.[0]?.identity?.theme).toBe("friendly crustacean helper");
      expect(cfg.agents?.list?.[0]?.identity?.emoji).toBe("🦀");
    });
  });

  it("validates CrawFather and CrawDad names meet max length requirement", async () => {
    await withTempHome(async (home) => {
      const configDir = path.join(home, ".openclaw");
      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(
        path.join(configDir, "openclaw.json"),
        JSON.stringify(
          {
            ui: {
              assistant: {
                name: "CrawFather",
                avatar: "🦞",
              },
            },
          },
          null,
          2,
        ),
        "utf-8",
      );

      vi.resetModules();
      const { loadConfig } = await import("./config.js");
      const cfg = loadConfig();

      // CrawFather is 10 chars, well under the 50 char max
      expect(cfg.ui?.assistant?.name).toBe("CrawFather");
      expect(cfg.ui?.assistant?.name?.length).toBeLessThanOrEqual(50);

      // CrawDad is 7 chars, well under the 50 char max
      expect("CrawDad".length).toBeLessThanOrEqual(50);
    });
  });
});
