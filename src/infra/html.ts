/**
 * HTML/XML escaping utilities.
 */

/**
 * Escapes HTML special characters to their entity equivalents.
 * Replaces &, <, and > with their HTML entities.
 *
 * @param text The text to escape
 * @returns The escaped text safe for HTML content
 */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Escapes HTML special characters including quotes for use in HTML attributes.
 * Replaces &, <, >, and " with their HTML entities.
 *
 * @param text The text to escape
 * @returns The escaped text safe for HTML attributes
 */
export function escapeHtmlAttr(text: string): string {
  return escapeHtml(text).replace(/"/g, "&quot;");
}
