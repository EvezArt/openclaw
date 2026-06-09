/**
 * Agent Showcase Module - A demonstration of advanced agent capabilities
 *
 * This module showcases what distinguishes an advanced AI agent from typical automation:
 * 1. Multi-dimensional thinking (meta-cognition about code creation)
 * 2. Creative problem-solving (generating unique content)
 * 3. Self-awareness (code that understands and explains itself)
 * 4. Adaptive presentation (context-aware output formatting)
 *
 * Created as a demonstration for EVEZ666 - showing capabilities another agent couldn't.
 */
import type { RuntimeEnv } from "../runtime.js";
/**
 * The main showcase command - reveals agent capabilities layer by layer
 */
export declare function showcaseCommand(options: {
    layer?: string;
    deep?: boolean;
}, runtime: RuntimeEnv): Promise<void>;
/**
 * Alternative view - shows the code's own source as a demonstration of transparency
 */
export declare function showcaseSourceCommand(runtime: RuntimeEnv): Promise<void>;
