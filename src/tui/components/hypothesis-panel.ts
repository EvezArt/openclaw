import { Container, Text } from "@mariozechner/pi-tui";
import type { HypothesisInfo } from "../tui-types.js";

/**
 * Hypothesis panel component for displaying parallel thinking hypotheses
 * in the CrawFather agent.
 */
export class HypothesisPanel extends Container {
  private titleText: Text;
  private hypothesisTexts: Map<string, Text>;
  private hypothesesVisible = false;

  constructor() {
    super();
    this.titleText = new Text("", 1, 0);
    this.hypothesisTexts = new Map();
  }

  update(hypotheses: Map<string, HypothesisInfo>): void {
    // Clear all children
    this.clear();
    this.hypothesisTexts.clear();

    if (hypotheses.size === 0) {
      this.hypothesesVisible = false;
      return;
    }

    this.hypothesesVisible = true;

    // Build title
    const activeCount = Array.from(hypotheses.values()).filter((h) => h.status === "active").length;
    const titleText = `⚡ Thinking (${activeCount} parallel ${activeCount === 1 ? "hypothesis" : "hypotheses"})`;
    this.titleText = new Text(titleText, 1, 0);
    this.addChild(this.titleText);

    // Sort hypotheses by score (descending) and then by created time
    const sortedHypotheses = Array.from(hypotheses.values()).sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score; // Higher scores first
      }
      return a.createdAt - b.createdAt; // Older first
    });

    // Add hypothesis texts
    for (const hyp of sortedHypotheses) {
      const statusIcon = this.getStatusIcon(hyp);
      const scorePercent = Math.round(hyp.score * 100);
      const text = `${statusIcon} [${scorePercent}%] ${hyp.hypothesis}`;

      const hypText = new Text(text, 1, 0);
      this.hypothesisTexts.set(hyp.id, hypText);
      this.addChild(hypText);

      // Add outcome if resolved
      if (hyp.status === "resolved" && hyp.outcome) {
        const outcomeIcon = this.getOutcomeIcon(hyp.outcome);
        const outcomeText = `  ${outcomeIcon} ${hyp.outcome}${hyp.reason ? `: ${hyp.reason}` : ""}`;
        const outcomeTextComponent = new Text(outcomeText, 1, 0);
        this.addChild(outcomeTextComponent);
      }
    }
  }

  private getStatusIcon(hyp: HypothesisInfo): string {
    switch (hyp.status) {
      case "active":
        return "○"; // Hollow circle for active
      case "resolved":
        return "●"; // Filled circle for resolved
      case "rejected":
        return "✗"; // X for rejected
      default:
        return "•";
    }
  }

  private getOutcomeIcon(outcome: string): string {
    switch (outcome) {
      case "confirmed":
        return "✓"; // Checkmark
      case "rejected":
        return "✗"; // X mark
      case "merged":
        return "⇒"; // Arrow for merge
      default:
        return "→";
    }
  }

  isVisible(): boolean {
    return this.hypothesesVisible;
  }
}
