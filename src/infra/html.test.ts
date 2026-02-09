import { describe, it, expect } from "vitest";
import { escapeHtml, escapeHtmlAttr } from "./html.js";

describe("html utilities", () => {
  describe("escapeHtml", () => {
    it("should escape ampersand", () => {
      expect(escapeHtml("A & B")).toBe("A &amp; B");
    });

    it("should escape less than", () => {
      expect(escapeHtml("A < B")).toBe("A &lt; B");
    });

    it("should escape greater than", () => {
      expect(escapeHtml("A > B")).toBe("A &gt; B");
    });

    it("should escape all special characters", () => {
      expect(escapeHtml("<script>alert('XSS & more')</script>")).toBe(
        "&lt;script&gt;alert('XSS &amp; more')&lt;/script&gt;",
      );
    });

    it("should not escape quotes", () => {
      expect(escapeHtml('Say "hello"')).toBe('Say "hello"');
    });

    it("should handle empty string", () => {
      expect(escapeHtml("")).toBe("");
    });

    it("should handle text with no special characters", () => {
      expect(escapeHtml("Hello World")).toBe("Hello World");
    });
  });

  describe("escapeHtmlAttr", () => {
    it("should escape ampersand", () => {
      expect(escapeHtmlAttr("A & B")).toBe("A &amp; B");
    });

    it("should escape less than", () => {
      expect(escapeHtmlAttr("A < B")).toBe("A &lt; B");
    });

    it("should escape greater than", () => {
      expect(escapeHtmlAttr("A > B")).toBe("A &gt; B");
    });

    it("should escape double quotes", () => {
      expect(escapeHtmlAttr('Say "hello"')).toBe("Say &quot;hello&quot;");
    });

    it("should escape all special characters including quotes", () => {
      expect(escapeHtmlAttr('<a href="url?a=1&b=2">Link</a>')).toBe(
        "&lt;a href=&quot;url?a=1&amp;b=2&quot;&gt;Link&lt;/a&gt;",
      );
    });

    it("should handle empty string", () => {
      expect(escapeHtmlAttr("")).toBe("");
    });

    it("should handle text with no special characters", () => {
      expect(escapeHtmlAttr("Hello World")).toBe("Hello World");
    });
  });
});
