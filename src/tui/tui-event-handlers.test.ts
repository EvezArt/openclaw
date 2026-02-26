import { describe, expect, it, vi } from "vitest";

import { createEventHandlers } from "./tui-event-handlers.js";
import type { AgentEvent, ChatEvent, TuiStateAccess } from "./tui-types.js";

type MockChatLog = {
  startTool: ReturnType<typeof vi.fn>;
  updateToolResult: ReturnType<typeof vi.fn>;
  addSystem: ReturnType<typeof vi.fn>;
  updateAssistant: ReturnType<typeof vi.fn>;
  finalizeAssistant: ReturnType<typeof vi.fn>;
};

describe("tui-event-handlers: handleAgentEvent", () => {
  const makeState = (overrides?: Partial<TuiStateAccess>): TuiStateAccess => ({
    agentDefaultId: "main",
    sessionMainKey: "agent:main:main",
    sessionScope: "global",
    agents: [],
    currentAgentId: "main",
    currentSessionKey: "agent:main:main",
    currentSessionId: "session-1",
    activeChatRunId: "run-1",
    historyLoaded: true,
    sessionInfo: {},
    initialSessionApplied: true,
    isConnected: true,
    autoMessageSent: false,
    toolsExpanded: false,
    showThinking: false,
    connectionStatus: "connected",
    activityStatus: "idle",
    statusTimeout: null,
    lastCtrlCAt: 0,
    activeHypotheses: new Map(),
    hypothesesVisible: false,
    ...overrides,
  });

  const makeContext = (state: TuiStateAccess) => {
    const chatLog: MockChatLog = {
      startTool: vi.fn(),
      updateToolResult: vi.fn(),
      addSystem: vi.fn(),
      updateAssistant: vi.fn(),
      finalizeAssistant: vi.fn(),
    };
    const tui = { requestRender: vi.fn() };
    const setActivityStatus = vi.fn();

    return { chatLog, tui, state, setActivityStatus };
  };

  it("processes tool events when runId matches activeChatRunId (even if sessionId differs)", () => {
    const state = makeState({ currentSessionId: "session-xyz", activeChatRunId: "run-123" });
    const { chatLog, tui, setActivityStatus } = makeContext(state);
    const { handleAgentEvent } = createEventHandlers({
      // Casts are fine here: TUI runtime shape is larger than we need in unit tests.
      chatLog: chatLog as any,
      tui: tui as any,
      state,
      setActivityStatus,
    });

    const evt: AgentEvent = {
      runId: "run-123",
      stream: "tool",
      data: {
        phase: "start",
        toolCallId: "tc1",
        name: "exec",
        args: { command: "echo hi" },
      },
    };

    handleAgentEvent(evt);

    expect(chatLog.startTool).toHaveBeenCalledWith("tc1", "exec", { command: "echo hi" });
    expect(tui.requestRender).toHaveBeenCalledTimes(1);
  });

  it("ignores tool events when runId does not match activeChatRunId", () => {
    const state = makeState({ activeChatRunId: "run-1" });
    const { chatLog, tui, setActivityStatus } = makeContext(state);
    const { handleAgentEvent } = createEventHandlers({
      chatLog: chatLog as any,
      tui: tui as any,
      state,
      setActivityStatus,
    });

    const evt: AgentEvent = {
      runId: "run-2",
      stream: "tool",
      data: { phase: "start", toolCallId: "tc1", name: "exec" },
    };

    handleAgentEvent(evt);

    expect(chatLog.startTool).not.toHaveBeenCalled();
    expect(chatLog.updateToolResult).not.toHaveBeenCalled();
    expect(tui.requestRender).not.toHaveBeenCalled();
  });

  it("processes lifecycle events when runId matches activeChatRunId", () => {
    const state = makeState({ activeChatRunId: "run-9" });
    const { tui, setActivityStatus } = makeContext(state);
    const { handleAgentEvent } = createEventHandlers({
      chatLog: { startTool: vi.fn(), updateToolResult: vi.fn() } as any,
      tui: tui as any,
      state,
      setActivityStatus,
    });

    const evt: AgentEvent = {
      runId: "run-9",
      stream: "lifecycle",
      data: { phase: "start" },
    };

    handleAgentEvent(evt);

    expect(setActivityStatus).toHaveBeenCalledWith("running");
    expect(tui.requestRender).toHaveBeenCalledTimes(1);
  });

  it("captures runId from chat events when activeChatRunId is unset", () => {
    const state = makeState({ activeChatRunId: null });
    const { chatLog, tui, setActivityStatus } = makeContext(state);
    const { handleChatEvent, handleAgentEvent } = createEventHandlers({
      chatLog: chatLog as any,
      tui: tui as any,
      state,
      setActivityStatus,
    });

    const chatEvt: ChatEvent = {
      runId: "run-42",
      sessionKey: state.currentSessionKey,
      state: "delta",
      message: { content: "hello" },
    };

    handleChatEvent(chatEvt);

    expect(state.activeChatRunId).toBe("run-42");

    const agentEvt: AgentEvent = {
      runId: "run-42",
      stream: "tool",
      data: { phase: "start", toolCallId: "tc1", name: "exec" },
    };

    handleAgentEvent(agentEvt);

    expect(chatLog.startTool).toHaveBeenCalledWith("tc1", "exec", undefined);
  });

  it("clears run mapping when the session changes", () => {
    const state = makeState({ activeChatRunId: null });
    const { chatLog, tui, setActivityStatus } = makeContext(state);
    const { handleChatEvent, handleAgentEvent } = createEventHandlers({
      chatLog: chatLog as any,
      tui: tui as any,
      state,
      setActivityStatus,
    });

    handleChatEvent({
      runId: "run-old",
      sessionKey: state.currentSessionKey,
      state: "delta",
      message: { content: "hello" },
    });

    state.currentSessionKey = "agent:main:other";
    state.activeChatRunId = null;
    tui.requestRender.mockClear();

    handleAgentEvent({
      runId: "run-old",
      stream: "tool",
      data: { phase: "start", toolCallId: "tc2", name: "exec" },
    });

    expect(chatLog.startTool).not.toHaveBeenCalled();
    expect(tui.requestRender).not.toHaveBeenCalled();
  });

  it("ignores lifecycle updates for non-active runs in the same session", () => {
    const state = makeState({ activeChatRunId: "run-active" });
    const { chatLog, tui, setActivityStatus } = makeContext(state);
    const { handleChatEvent, handleAgentEvent } = createEventHandlers({
      chatLog: chatLog as any,
      tui: tui as any,
      state,
      setActivityStatus,
    });

    handleChatEvent({
      runId: "run-other",
      sessionKey: state.currentSessionKey,
      state: "delta",
      message: { content: "hello" },
    });
    setActivityStatus.mockClear();
    tui.requestRender.mockClear();

    handleAgentEvent({
      runId: "run-other",
      stream: "lifecycle",
      data: { phase: "end" },
    });

    expect(setActivityStatus).not.toHaveBeenCalled();
    expect(tui.requestRender).not.toHaveBeenCalled();
  });
});

describe("tui-event-handlers: CrawFather hypothesis events", () => {
  const makeState = (overrides?: Partial<TuiStateAccess>): TuiStateAccess => ({
    agentDefaultId: "main",
    sessionMainKey: "agent:main:main",
    sessionScope: "global",
    agents: [],
    currentAgentId: "main",
    currentSessionKey: "agent:main:main",
    currentSessionId: "session-1",
    activeChatRunId: "run-1",
    historyLoaded: true,
    sessionInfo: {},
    initialSessionApplied: true,
    isConnected: true,
    autoMessageSent: false,
    toolsExpanded: false,
    showThinking: false,
    connectionStatus: "connected",
    activityStatus: "idle",
    statusTimeout: null,
    lastCtrlCAt: 0,
    activeHypotheses: new Map(),
    hypothesesVisible: false,
    ...overrides,
  });

  const makeContext = (state: TuiStateAccess) => {
    const chatLog: MockChatLog = {
      startTool: vi.fn(),
      updateToolResult: vi.fn(),
      addSystem: vi.fn(),
      updateAssistant: vi.fn(),
      finalizeAssistant: vi.fn(),
    };
    const tui = { requestRender: vi.fn() };
    const setActivityStatus = vi.fn();

    return { chatLog, tui, state, setActivityStatus };
  };

  it("tracks hypothesis creation", () => {
    const state = makeState({ activeChatRunId: "run-1" });
    const { tui, setActivityStatus } = makeContext(state);
    const { handleAgentEvent } = createEventHandlers({
      chatLog: { startTool: vi.fn(), updateToolResult: vi.fn() } as any,
      tui: tui as any,
      state,
      setActivityStatus,
    });

    const evt: AgentEvent = {
      runId: "run-1",
      stream: "hypothesis",
      data: {
        subtype: "created",
        hypothesisId: "h1",
        hypothesis: "User wants to search files",
        score: 0.85,
        status: "active",
      },
    };

    handleAgentEvent(evt);

    expect(state.activeHypotheses.size).toBe(1);
    const hyp = state.activeHypotheses.get("h1");
    expect(hyp).toBeDefined();
    expect(hyp?.hypothesis).toBe("User wants to search files");
    expect(hyp?.score).toBe(0.85);
    expect(hyp?.status).toBe("active");
    expect(state.hypothesesVisible).toBe(true);
    expect(tui.requestRender).toHaveBeenCalled();
  });

  it("updates hypothesis score", () => {
    const state = makeState({ activeChatRunId: "run-1" });
    const { tui, setActivityStatus } = makeContext(state);
    const { handleAgentEvent } = createEventHandlers({
      chatLog: { startTool: vi.fn(), updateToolResult: vi.fn() } as any,
      tui: tui as any,
      state,
      setActivityStatus,
    });

    // Create
    handleAgentEvent({
      runId: "run-1",
      stream: "hypothesis",
      data: {
        subtype: "created",
        hypothesisId: "h1",
        hypothesis: "Test",
        score: 0.5,
        status: "active",
      },
    });

    tui.requestRender.mockClear();

    // Update
    handleAgentEvent({
      runId: "run-1",
      stream: "hypothesis",
      data: {
        subtype: "updated",
        hypothesisId: "h1",
        score: 0.92,
        evidence: "Found matching pattern",
      },
    });

    const hyp = state.activeHypotheses.get("h1");
    expect(hyp?.score).toBe(0.92);
    expect(tui.requestRender).toHaveBeenCalled();
  });

  it("handles hypothesis resolution", () => {
    vi.useFakeTimers();
    const state = makeState({ activeChatRunId: "run-1" });
    const { tui, setActivityStatus } = makeContext(state);
    const { handleAgentEvent } = createEventHandlers({
      chatLog: { startTool: vi.fn(), updateToolResult: vi.fn() } as any,
      tui: tui as any,
      state,
      setActivityStatus,
    });

    // Create
    handleAgentEvent({
      runId: "run-1",
      stream: "hypothesis",
      data: {
        subtype: "created",
        hypothesisId: "h1",
        hypothesis: "Test",
        score: 0.85,
        status: "active",
      },
    });

    expect(state.activeHypotheses.size).toBe(1);

    // Resolve
    handleAgentEvent({
      runId: "run-1",
      stream: "hypothesis",
      data: {
        subtype: "resolved",
        hypothesisId: "h1",
        outcome: "confirmed",
        reason: "Task completed successfully",
      },
    });

    const hyp = state.activeHypotheses.get("h1");
    expect(hyp?.status).toBe("resolved");
    expect(hyp?.outcome).toBe("confirmed");
    expect(hyp?.reason).toBe("Task completed successfully");

    // Should be removed after timeout
    vi.advanceTimersByTime(2100);
    expect(state.activeHypotheses.size).toBe(0);
    expect(state.hypothesesVisible).toBe(false);

    vi.useRealTimers();
  });

  it("handles system event run_started", () => {
    const state = makeState({ activeChatRunId: "run-1" });
    // Pre-populate some hypotheses
    state.activeHypotheses.set("h1", {
      id: "h1",
      hypothesis: "old",
      score: 0.5,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    state.hypothesesVisible = true;

    const { tui, setActivityStatus } = makeContext(state);
    const { handleAgentEvent } = createEventHandlers({
      chatLog: { startTool: vi.fn(), updateToolResult: vi.fn() } as any,
      tui: tui as any,
      state,
      setActivityStatus,
    });

    handleAgentEvent({
      runId: "run-1",
      stream: "system",
      data: {
        subtype: "run_started",
        agentId: "agent:crawfather:main",
      },
    });

    expect(state.activeHypotheses.size).toBe(0);
    expect(state.hypothesesVisible).toBe(false);
    expect(setActivityStatus).toHaveBeenCalledWith("starting");
  });

  it("handles system event run_failed", () => {
    const state = makeState({ activeChatRunId: "run-1" });
    const { chatLog, tui, setActivityStatus } = makeContext(state);
    const { handleAgentEvent } = createEventHandlers({
      chatLog: chatLog as any,
      tui: tui as any,
      state,
      setActivityStatus,
    });

    handleAgentEvent({
      runId: "run-1",
      stream: "system",
      data: {
        subtype: "run_failed",
        error: "timeout exceeded",
      },
    });

    expect(chatLog.addSystem).toHaveBeenCalledWith("CrawFather run failed: timeout exceeded");
    expect(setActivityStatus).toHaveBeenCalledWith("error");
    expect(state.activeHypotheses.size).toBe(0);
  });
});
