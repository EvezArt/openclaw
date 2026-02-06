import { describe, expect, it } from "vitest";
import { ProgressEscalationManager } from "./progress-escalation.js";
import type { NotificationAdapter, NotificationMessage } from "./adapters/types.js";
import type { VoiceCallAdapter, VoiceCallMessage } from "./adapters/twilio.js";

class MockSmsAdapter implements NotificationAdapter {
  readonly sent: NotificationMessage[] = [];

  async send(message: NotificationMessage) {
    this.sent.push(message);
    return { channel: "sms" as const, delivered: true };
  }
}

class MockVoiceAdapter implements VoiceCallAdapter {
  readonly calls: VoiceCallMessage[] = [];

  async call(message: VoiceCallMessage) {
    this.calls.push(message);
    return { channel: "voice" as const, delivered: true };
  }

  async callAndConfirm(message: VoiceCallMessage) {
    this.calls.push(message);
    return { channel: "voice" as const, delivered: true };
  }
}

describe("ProgressEscalationManager", () => {
  it("sends one message per threshold crossing", async () => {
    const sms = new MockSmsAdapter();
    const voice = new MockVoiceAdapter();
    const manager = new ProgressEscalationManager(sms, voice, {
      recipientNumber: "+15550000002",
      enableVoiceCalls: false,
      progressThresholds: [25, 50],
    });

    await manager.notifyProgress("config", 1, 4);
    await manager.notifyProgress("providers", 2, 4);
    await manager.notifyProgress("workers", 2, 4);

    expect(sms.sent).toHaveLength(2);
    expect(sms.sent[0]?.body).toContain("25%");
    expect(sms.sent[1]?.body).toContain("50%");
  });

  it("places calls when decision-required events are raised and calls are enabled", async () => {
    const sms = new MockSmsAdapter();
    const voice = new MockVoiceAdapter();
    const manager = new ProgressEscalationManager(sms, voice, {
      recipientNumber: "+15550000002",
      enableVoiceCalls: true,
    });

    await manager.notifyDecisionRequired("manual approval required");

    expect(sms.sent).toHaveLength(1);
    expect(sms.sent[0]?.priority).toBe("CRITICAL");
    expect(voice.calls).toHaveLength(1);
    expect(voice.calls[0]?.message).toContain("manual approval required");
  });
});
