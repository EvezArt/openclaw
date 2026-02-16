/**
 * CrawFather Survival Pack: Hypothesis Panel Component
 *
 * This module provides a TUI component that renders the "Thinking (parallel hypotheses)"
 * panel, showing live hypothesis events with scores, statuses, and outcomes.
 */

import { Container, Text } from "@mariozechner/pi-tui";
import type { Hypothesis, HypothesisOutcome, HypothesisStatus } from "../hypothesis-types.js";

/**
 * Formats a hypothesis status with appropriate styling indication.
 * The TUI theme will be applied by the caller based on status type.
 */
export function formatHypothesisStatus(status: HypothesisStatus): string {
  switch (status) {
    case "active":
      return "●";
    case "stale":
      return "○";
    case "resolved":
      return "✓";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

/**
 * Formats a hypothesis outcome with appropriate styling indication.
 */
export function formatHypothesisOutcome(outcome: HypothesisOutcome): string {
  if (!outcome) {
    return "";
  }

  switch (outcome) {
    case "accepted":
      return "✓ accepted";
    case "rejected":
      return "✗ rejected";
    case "abandoned":
      return "⊘ abandoned";
    default: {
      const _exhaustive: never = outcome;
      return _exhaustive;
    }
  }
}

/**
 * Formats a hypothesis score as a percentage (0-100).
 */
export function formatHypothesisScore(score: number): string {
  const percent = Math.max(0, Math.min(100, Math.round(score * 100)));
  return `${percent}%`;
}

/**
 * Format elapsed time since hypothesis creation.
 */
export function formatElapsed(timestamp: number): string {
  const totalSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

/**
 * HypothesisPanel renders a list of hypotheses in the TUI.
 *
 * The panel subscribes to hypothesis events via the TUI event handlers
 * and renders each hypothesis with:
 * - Status indicator (active ●, stale ○, resolved ✓)
 * - Score (percentage)
 * - Description
 * - Outcome (for resolved hypotheses: accepted/rejected/abandoned)
 * - Elapsed time
 * - Evidence count
 */
export class HypothesisPanel {
  private container: Container;
  private headerText: Text;
  private hypothesesText: Text;
  private visible = false;

  constructor(
    private theme: {
      accent: (text: string) => string;
      success: (text: string) => string;
      error: (text: string) => string;
      muted: (text: string) => string;
      warn: (text: string) => string;
    },
  ) {
    this.container = new Container();
    this.headerText = new Text("", 1, 0);
    this.hypothesesText = new Text("", 0, 0);
    this.container.addChild(this.headerText);
    this.container.addChild(this.hypothesesText);
  }

  /**
   * Get the container to add to the TUI root.
   */
  getContainer(): Container {
    return this.container;
  }

  /**
   * Update the panel with the current list of hypotheses.
   * This should be called whenever hypothesis state changes.
   */
  render(hypotheses: Hypothesis[]): void {
    if (hypotheses.length === 0) {
      this.hide();
      return;
    }

    this.visible = true;
    this.headerText.setText(this.theme.accent("Thinking (parallel hypotheses)"));

    const lines: string[] = [];
    for (const h of hypotheses) {
      const statusIcon = formatHypothesisStatus(h.status);
      const score = formatHypothesisScore(h.score);
      const elapsed = formatElapsed(h.updatedAt);
      const evidenceCount = h.evidence.length;

      // Format status line with appropriate coloring based on status
      let statusColor: (text: string) => string;
      if (h.status === "active") {
        statusColor = this.theme.success;
      } else if (h.status === "stale") {
        statusColor = this.theme.muted;
      } else {
        statusColor = this.theme.accent;
      }

      const statusLine = `${statusColor(statusIcon)} ${score} ${h.description}`;

      // Add outcome for resolved hypotheses
      let outcomeText = "";
      if (h.outcome) {
        const outcomeStr = formatHypothesisOutcome(h.outcome);
        if (h.outcome === "accepted") {
          outcomeText = ` ${this.theme.success(outcomeStr)}`;
        } else if (h.outcome === "rejected") {
          outcomeText = ` ${this.theme.error(outcomeStr)}`;
        } else {
          outcomeText = ` ${this.theme.warn(outcomeStr)}`;
        }
      }

      const metaLine = this.theme.muted(
        `  ${elapsed} ago · ${evidenceCount} evidence${evidenceCount !== 1 ? "s" : ""}`,
      );

      lines.push(statusLine + outcomeText);
      lines.push(metaLine);
    }

    this.hypothesesText.setText(lines.join("\n"));
  }

  /**
   * Hide the panel (used when there are no active hypotheses).
   */
  hide(): void {
    this.visible = false;
    this.headerText.setText("");
    this.hypothesesText.setText("");
  }

  /**
   * Check if the panel is currently visible.
   */
  isVisible(): boolean {
    return this.visible;
  }
}
