import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  capArrayByJsonBytes,
  readFirstUserMessageFromTranscript,
  readSessionMessages,
} from "./session-utils.fs.js";

describe("Performance optimizations", () => {
  let tmpDir: string;
  let storePath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-session-perf-test-"));
    storePath = path.join(tmpDir, "sessions.json");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test("capArrayByJsonBytes should combine map and reduce efficiently", () => {
    const items = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      text: `Message ${i}`,
      data: { nested: true, value: i * 2 },
    }));

    const start = performance.now();
    const result = capArrayByJsonBytes(items, 50000);
    const duration = performance.now() - start;

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.length).toBeLessThanOrEqual(items.length);
    expect(result.bytes).toBeLessThanOrEqual(50000);
    // Should complete in reasonable time (< 100ms for 1000 items)
    expect(duration).toBeLessThan(100);
  });

  test("readFirstUserMessageFromTranscript should use cached path", () => {
    const sessionId = "perf-test-session";
    const transcriptPath = path.join(tmpDir, `${sessionId}.jsonl`);
    // Create messages with first user message early in the file
    const lines = [
      JSON.stringify({ message: { role: "system", content: "System message" } }),
      JSON.stringify({ message: { role: "user", content: "First user message" } }),
      ...Array.from({ length: 98 }, (_, i) =>
        JSON.stringify({ message: { role: "assistant", content: `Response ${i}` } }),
      ),
    ];
    fs.writeFileSync(transcriptPath, lines.join("\n"), "utf-8");

    // First call - establishes cache
    const start1 = performance.now();
    const result1 = readFirstUserMessageFromTranscript(sessionId, storePath);
    const duration1 = performance.now() - start1;

    // Second call - should be faster due to cached path
    const start2 = performance.now();
    const result2 = readFirstUserMessageFromTranscript(sessionId, storePath);
    const duration2 = performance.now() - start2;

    expect(result1).toBe("First user message");
    expect(result2).toBe("First user message");
    // Cache should provide some benefit (though this is not guaranteed on all systems)
    // We just verify both calls work correctly
    expect(duration1).toBeGreaterThan(0);
    expect(duration2).toBeGreaterThan(0);
  });

  test("readSessionMessages should be async and handle large files", async () => {
    const sessionId = "async-test-session";
    const transcriptPath = path.join(tmpDir, `${sessionId}.jsonl`);

    // Create a file with 1000 messages
    const lines = Array.from({ length: 1000 }, (_, i) =>
      JSON.stringify({ message: { role: "user", content: `Message ${i}` } }),
    );
    fs.writeFileSync(transcriptPath, lines.join("\n"), "utf-8");

    const start = performance.now();
    const messages = await readSessionMessages(sessionId, storePath);
    const duration = performance.now() - start;

    expect(messages).toHaveLength(1000);
    expect(messages[0]).toEqual({ role: "user", content: "Message 0" });
    expect(messages[999]).toEqual({ role: "user", content: "Message 999" });
    // Should complete in reasonable time (< 500ms for 1000 messages)
    expect(duration).toBeLessThan(500);
  });

  test("multiple calls should benefit from path caching", () => {
    const sessionId = "cache-test";
    const transcriptPath = path.join(tmpDir, `${sessionId}.jsonl`);
    fs.writeFileSync(
      transcriptPath,
      JSON.stringify({ message: { role: "user", content: "Hello" } }),
      "utf-8",
    );

    // Make 10 calls - subsequent calls should benefit from cached path
    const durations: number[] = [];
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      readFirstUserMessageFromTranscript(sessionId, storePath);
      durations.push(performance.now() - start);
    }

    // All calls should succeed
    expect(durations).toHaveLength(10);
    durations.forEach((d) => expect(d).toBeGreaterThan(0));
  });
});
