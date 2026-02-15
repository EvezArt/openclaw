import { describe, it, expect, vi } from "vitest";
import { withTimeout, withTimeoutFallback, fetchWithTimeout } from "./timeout.js";

describe("timeout utilities", () => {
  describe("withTimeout", () => {
    it("should resolve when promise completes before timeout", async () => {
      const promise = Promise.resolve("success");
      const result = await withTimeout(promise, 1000);
      expect(result).toBe("success");
    });

    it("should reject with timeout error when promise takes too long", async () => {
      const promise = new Promise((resolve) => setTimeout(resolve, 100));
      await expect(withTimeout(promise, 10)).rejects.toThrow("timeout");
    });

    it("should return promise directly when timeout is 0 or negative", async () => {
      const promise = Promise.resolve("success");
      const result1 = await withTimeout(promise, 0);
      const result2 = await withTimeout(promise, -1);
      expect(result1).toBe("success");
      expect(result2).toBe("success");
    });
  });

  describe("withTimeoutFallback", () => {
    it("should resolve with promise result when it completes before timeout", async () => {
      const promise = Promise.resolve("success");
      const result = await withTimeoutFallback(promise, 1000, "fallback");
      expect(result).toBe("success");
    });

    it("should return fallback when promise takes too long", async () => {
      const promise = new Promise((resolve) => setTimeout(() => resolve("success"), 100));
      const result = await withTimeoutFallback(promise, 10, "fallback");
      expect(result).toBe("fallback");
    });
  });

  describe("fetchWithTimeout", () => {
    it("should complete fetch before timeout", async () => {
      const mockResponse = new Response("ok", { status: 200 });
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const response = await fetchWithTimeout("https://example.com", 1000);
      expect(response.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledWith("https://example.com", expect.any(Object));
    });

    it("should pass through fetch init options", async () => {
      const mockResponse = new Response("ok", { status: 200 });
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const init: RequestInit = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      };

      await fetchWithTimeout("https://example.com", 1000, init);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://example.com",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );
    });
  });
});
