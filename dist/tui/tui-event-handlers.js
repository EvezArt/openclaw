import { asString, extractTextFromMessage, isCommandMessage } from "./tui-formatters.js";
import { TuiStreamAssembler } from "./tui-stream-assembler.js";
export function createEventHandlers(context) {
    const { chatLog, tui, state, setActivityStatus, refreshSessionInfo } = context;
    const finalizedRuns = new Map();
    const sessionRuns = new Map();
    let streamAssembler = new TuiStreamAssembler();
    let lastSessionKey = state.currentSessionKey;
    const pruneRunMap = (runs) => {
        if (runs.size <= 200) {
            return;
        }
        const keepUntil = Date.now() - 10 * 60 * 1000;
        for (const [key, ts] of runs) {
            if (runs.size <= 150) {
                break;
            }
            if (ts < keepUntil) {
                runs.delete(key);
            }
        }
        if (runs.size > 200) {
            for (const key of runs.keys()) {
                runs.delete(key);
                if (runs.size <= 150) {
                    break;
                }
            }
        }
    };
    const syncSessionKey = () => {
        if (state.currentSessionKey === lastSessionKey) {
            return;
        }
        lastSessionKey = state.currentSessionKey;
        finalizedRuns.clear();
        sessionRuns.clear();
        streamAssembler = new TuiStreamAssembler();
    };
    const noteSessionRun = (runId) => {
        sessionRuns.set(runId, Date.now());
        pruneRunMap(sessionRuns);
    };
    const noteFinalizedRun = (runId) => {
        finalizedRuns.set(runId, Date.now());
        sessionRuns.delete(runId);
        streamAssembler.drop(runId);
        pruneRunMap(finalizedRuns);
    };
    const handleChatEvent = (payload) => {
        if (!payload || typeof payload !== "object") {
            return;
        }
        const evt = payload;
        syncSessionKey();
        if (evt.sessionKey !== state.currentSessionKey) {
            return;
        }
        if (finalizedRuns.has(evt.runId)) {
            if (evt.state === "delta") {
                return;
            }
            if (evt.state === "final") {
                return;
            }
        }
        noteSessionRun(evt.runId);
        if (!state.activeChatRunId) {
            state.activeChatRunId = evt.runId;
        }
        if (evt.state === "delta") {
            const displayText = streamAssembler.ingestDelta(evt.runId, evt.message, state.showThinking);
            if (!displayText) {
                return;
            }
            chatLog.updateAssistant(displayText, evt.runId);
            setActivityStatus("streaming");
        }
        if (evt.state === "final") {
            if (isCommandMessage(evt.message)) {
                const text = extractTextFromMessage(evt.message);
                if (text) {
                    chatLog.addSystem(text);
                }
                streamAssembler.drop(evt.runId);
                noteFinalizedRun(evt.runId);
                state.activeChatRunId = null;
                setActivityStatus("idle");
                void refreshSessionInfo?.();
                tui.requestRender();
                return;
            }
            const stopReason = evt.message && typeof evt.message === "object" && !Array.isArray(evt.message)
                ? typeof evt.message.stopReason === "string"
                    ? evt.message.stopReason
                    : ""
                : "";
            const finalText = streamAssembler.finalize(evt.runId, evt.message, state.showThinking);
            chatLog.finalizeAssistant(finalText, evt.runId);
            noteFinalizedRun(evt.runId);
            state.activeChatRunId = null;
            setActivityStatus(stopReason === "error" ? "error" : "idle");
            // Refresh session info to update token counts in footer
            void refreshSessionInfo?.();
        }
        if (evt.state === "aborted") {
            chatLog.addSystem("run aborted");
            streamAssembler.drop(evt.runId);
            sessionRuns.delete(evt.runId);
            state.activeChatRunId = null;
            setActivityStatus("aborted");
            void refreshSessionInfo?.();
        }
        if (evt.state === "error") {
            chatLog.addSystem(`run error: ${evt.errorMessage ?? "unknown"}`);
            streamAssembler.drop(evt.runId);
            sessionRuns.delete(evt.runId);
            state.activeChatRunId = null;
            setActivityStatus("error");
            void refreshSessionInfo?.();
        }
        tui.requestRender();
    };
    const handleAgentEvent = (payload) => {
        if (!payload || typeof payload !== "object") {
            return;
        }
        const evt = payload;
        syncSessionKey();
        // Agent events (tool streaming, lifecycle) are emitted per-run. Filter against the
        // active chat run id, not the session id.
        const isActiveRun = evt.runId === state.activeChatRunId;
        if (!isActiveRun && !sessionRuns.has(evt.runId)) {
            return;
        }
        // Handle hypothesis events for CrawFather parallel thinking
        if (evt.stream === "hypothesis") {
            handleHypothesisEvent(evt);
            return;
        }
        // Handle system events for run lifecycle
        if (evt.stream === "system") {
            handleSystemEvent(evt);
            return;
        }
        // Handle heartbeat.run events
        if (evt.stream === "heartbeat.run") {
            // Currently just log/track, no UI changes needed
            return;
        }
        if (evt.stream === "tool") {
            const data = evt.data ?? {};
            const phase = asString(data.phase, "");
            const toolCallId = asString(data.toolCallId, "");
            const toolName = asString(data.name, "tool");
            if (!toolCallId) {
                return;
            }
            if (phase === "start") {
                chatLog.startTool(toolCallId, toolName, data.args);
            }
            else if (phase === "update") {
                chatLog.updateToolResult(toolCallId, data.partialResult, {
                    partial: true,
                });
            }
            else if (phase === "result") {
                chatLog.updateToolResult(toolCallId, data.result, {
                    isError: Boolean(data.isError),
                });
            }
            tui.requestRender();
            return;
        }
        if (evt.stream === "lifecycle") {
            if (!isActiveRun) {
                return;
            }
            const phase = typeof evt.data?.phase === "string" ? evt.data.phase : "";
            if (phase === "start") {
                setActivityStatus("running");
            }
            if (phase === "end") {
                setActivityStatus("idle");
            }
            if (phase === "error") {
                setActivityStatus("error");
            }
            tui.requestRender();
        }
    };
    const handleHypothesisEvent = (evt) => {
        const data = evt.data ?? {};
        const subtype = asString(data.subtype, "");
        const hypothesisId = asString(data.hypothesisId, "");
        if (!hypothesisId) {
            return;
        }
        const now = Date.now();
        if (subtype === "created") {
            const hypothesis = asString(data.hypothesis, "");
            const score = typeof data.score === "number" ? data.score : 0.5;
            const status = asString(data.status, "active");
            state.activeHypotheses.set(hypothesisId, {
                id: hypothesisId,
                hypothesis,
                score,
                status,
                createdAt: now,
                updatedAt: now,
            });
            state.hypothesesVisible = true;
            tui.requestRender();
        }
        else if (subtype === "updated") {
            const existing = state.activeHypotheses.get(hypothesisId);
            if (existing) {
                if (typeof data.score === "number") {
                    existing.score = data.score;
                }
                if (typeof data.evidence === "string") {
                    // Could store evidence if we want to display it
                }
                existing.updatedAt = now;
                tui.requestRender();
            }
        }
        else if (subtype === "resolved") {
            const existing = state.activeHypotheses.get(hypothesisId);
            if (existing) {
                existing.status = "resolved";
                existing.outcome = asString(data.outcome, "confirmed");
                existing.reason = asString(data.reason, "");
                existing.updatedAt = now;
                // Remove resolved hypothesis after a brief display period
                setTimeout(() => {
                    state.activeHypotheses.delete(hypothesisId);
                    if (state.activeHypotheses.size === 0) {
                        state.hypothesesVisible = false;
                    }
                    tui.requestRender();
                }, 2000);
                tui.requestRender();
            }
        }
        else if (subtype === "evidence") {
            const existing = state.activeHypotheses.get(hypothesisId);
            if (existing && typeof data.evidence === "string") {
                // Evidence added - could update UI if we track evidence
                existing.updatedAt = now;
                tui.requestRender();
            }
        }
    };
    const handleSystemEvent = (evt) => {
        const data = evt.data ?? {};
        const subtype = asString(data.subtype, "");
        if (subtype === "run_started") {
            // Clear previous hypotheses on new run
            state.activeHypotheses.clear();
            state.hypothesesVisible = false;
            setActivityStatus("starting");
        }
        else if (subtype === "run_completed") {
            // Run completed successfully
            state.hypothesesVisible = false;
        }
        else if (subtype === "run_failed") {
            // Run failed
            const error = asString(data.error, "unknown error");
            chatLog.addSystem(`CrawFather run failed: ${error}`);
            state.activeHypotheses.clear();
            state.hypothesesVisible = false;
            setActivityStatus("error");
        }
        tui.requestRender();
    };
    return { handleChatEvent, handleAgentEvent };
}
