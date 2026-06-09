import { Container } from "@mariozechner/pi-tui";
import type { HypothesisInfo } from "../tui-types.js";
/**
 * Hypothesis panel component for displaying parallel thinking hypotheses
 * in the CrawFather agent.
 */
export declare class HypothesisPanel extends Container {
    private titleText;
    private hypothesisTexts;
    private hypothesesVisible;
    constructor();
    update(hypotheses: Map<string, HypothesisInfo>): void;
    private getStatusIcon;
    private getOutcomeIcon;
    isVisible(): boolean;
}
