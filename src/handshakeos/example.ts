/**
 * HandshakeOS-E Demo Example
 *
 * This file demonstrates the complete usage of the HandshakeOS-E nervous system.
 * Run with: node --import tsx src/handshakeos/example.ts
 */

import {
  eventStore,
  intentStore,
  hypothesisStore,
  testStore,
  createUserActor,
  createAgentActor,
  createSystemActor,
  createEmptyDomainSignature,
  createDomainSignature,
  generateId,
} from "./index.js";

// Demo scenario: User wants to optimize their daily productivity

function runDemo() {
  console.log("=== HandshakeOS-E Nervous System Demo ===\n");

  // 1. Create actors
  console.log("1. Creating actors...");
  const user = createUserActor("alice-123", "Alice");
  const agent = createAgentActor("productivity-agent", "Productivity Assistant");
  const system = createSystemActor();

  console.log(`   User: ${user.name} (${user.id})`);
  console.log(`   Agent: ${agent.name} (${agent.id})`);
  console.log(`   System: ${system.name} (${system.id})\n`);

  // 2. Record user interaction event
  console.log("2. Recording user interaction event...");
  const interactionEvent = {
    id: generateId(),
    timestamp: Date.now(),
    actor: user,
    type: "user-request",
    payload: {
      request: "Help me optimize my productivity",
      channel: "chat",
    },
    domainSignature: createDomainSignature({
      productivity: 0.9,
      userInteraction: 0.8,
    }),
    tags: ["productivity", "optimization", "user-request"],
  };
  eventStore.store(interactionEvent);
  console.log(`   Event ID: ${interactionEvent.id}`);
  console.log(`   Type: ${interactionEvent.type}\n`);

  // 3. Create intent token for the goal
  console.log("3. Creating intent token...");
  const intent = {
    id: generateId(),
    timestamp: Date.now(),
    actor: user,
    goal: "Increase daily task completion rate by 20%",
    constraints: [
      "Must maintain work-life balance",
      "No weekend work",
      "Track metrics for 2 weeks",
    ],
    successMetric: "Task completion rate increases from 70% to 90%",
    confidence: 0.75,
    state: "pending" as const,
    eventIds: [interactionEvent.id],
    measurable: true,
    domainSignature: createDomainSignature({
      productivity: 1.0,
      goals: 0.9,
    }),
  };
  intentStore.store(intent);
  console.log(`   Intent ID: ${intent.id}`);
  console.log(`   Goal: ${intent.goal}`);
  console.log(`   Confidence: ${intent.confidence}\n`);

  // 4. Create parallel hypotheses
  console.log("4. Creating parallel hypotheses...");

  // Me model: Personal perspective
  const meHypothesis = {
    id: generateId(),
    modelType: "me" as const,
    description: "I am most productive in the morning between 9-11 AM",
    probability: 0.7,
    falsifiers: [
      {
        description: "Afternoon productivity exceeds morning productivity",
        testCondition: "compareAfternoonToMorning()",
        triggered: false,
      },
    ],
    domainSignature: createEmptyDomainSignature(),
    version: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    evidenceEventIds: [interactionEvent.id],
    actor: user,
  };
  hypothesisStore.store(meHypothesis);
  console.log(`   Me hypothesis: ${meHypothesis.description}`);
  console.log(`   Probability: ${meHypothesis.probability}`);

  // We model: Collaborative perspective
  const weHypothesis = {
    id: generateId(),
    modelType: "we" as const,
    description: "Team meetings reduce individual productivity but increase team output",
    probability: 0.6,
    falsifiers: [
      {
        description: "Individual productivity remains unchanged with meetings",
        testCondition: "checkMeetingImpact()",
        triggered: false,
      },
    ],
    domainSignature: createEmptyDomainSignature(),
    version: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    evidenceEventIds: [],
    actor: agent,
  };
  hypothesisStore.store(weHypothesis);
  console.log(`   We hypothesis: ${weHypothesis.description}`);
  console.log(`   Probability: ${weHypothesis.probability}`);

  // System model: Infrastructure perspective
  const systemHypothesis = {
    id: generateId(),
    modelType: "system" as const,
    description: "System notifications reduce focus and task completion rate",
    probability: 0.8,
    falsifiers: [
      {
        description: "Disabling notifications has no effect on completion rate",
        testCondition: "testNotificationEffect()",
        triggered: false,
      },
    ],
    domainSignature: createEmptyDomainSignature(),
    version: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    evidenceEventIds: [],
    actor: system,
  };
  hypothesisStore.store(systemHypothesis);
  console.log(`   System hypothesis: ${systemHypothesis.description}`);
  console.log(`   Probability: ${systemHypothesis.probability}\n`);

  // 5. Create tests for hypotheses
  console.log("5. Creating tests for hypotheses...");

  const morningTest = {
    id: generateId(),
    name: "Morning vs Afternoon Productivity Test",
    description: "Compare task completion rates between morning and afternoon",
    hypothesisIds: [meHypothesis.id],
    testType: "hypothesis-validation",
    procedure: "Track tasks completed 9-11 AM vs 2-4 PM for 2 weeks",
    expectedOutcome: "Morning shows 20%+ higher completion rate",
    status: "pending" as const,
    createdAt: Date.now(),
    actor: user,
    domainSignature: createEmptyDomainSignature(),
  };
  testStore.store(morningTest);
  console.log(`   Test: ${morningTest.name}`);
  console.log(`   Linked to: Me hypothesis`);

  const notificationTest = {
    id: generateId(),
    name: "Notification Impact Test",
    description: "Measure productivity with and without system notifications",
    hypothesisIds: [systemHypothesis.id],
    testType: "hypothesis-validation",
    procedure: "Week 1: notifications on, Week 2: notifications off",
    expectedOutcome: "Week 2 shows 15%+ improvement in completion rate",
    status: "pending" as const,
    createdAt: Date.now(),
    actor: system,
    domainSignature: createEmptyDomainSignature(),
  };
  testStore.store(notificationTest);
  console.log(`   Test: ${notificationTest.name}`);
  console.log(`   Linked to: System hypothesis\n`);

  // 6. Simulate test execution
  console.log("6. Simulating test execution...");

  // Morning test passes
  testStore.recordTestRun(morningTest.id, {
    status: "passed",
    actualOutcome: "Morning shows 25% higher completion rate (exceeded expected 20%)",
  });
  console.log(`   ${morningTest.name}: PASSED`);

  // Add evidence to hypothesis
  const evidenceEvent = {
    id: generateId(),
    timestamp: Date.now(),
    actor: system,
    type: "test-completed",
    payload: {
      testId: morningTest.id,
      result: "passed",
    },
    domainSignature: createEmptyDomainSignature(),
    parentEventId: interactionEvent.id,
  };
  eventStore.store(evidenceEvent);
  hypothesisStore.addEvidence(meHypothesis.id, evidenceEvent.id);
  console.log(`   Added evidence to Me hypothesis\n`);

  // 7. Update intent with progress
  console.log("7. Updating intent with progress...");
  intentStore.update(intent.id, {
    state: "executing",
    trigger: "User started tracking productivity",
  });
  console.log(`   Intent state: executing\n`);

  // 8. Query system state
  console.log("8. Querying system state...");

  const recentEvents = eventStore.getRecentEvents(10);
  console.log(`   Total events: ${eventStore.count()}`);
  console.log(`   Recent events: ${recentEvents.length}`);

  const pendingIntents = intentStore.getPendingIntents();
  const executingIntents = intentStore.getIntentsByState("executing");
  console.log(`   Pending intents: ${pendingIntents.length}`);
  console.log(`   Executing intents: ${executingIntents.length}`);

  const activeHypotheses = hypothesisStore.getActiveHypotheses();
  console.log(`   Active hypotheses: ${activeHypotheses.length}`);

  const parallelHypotheses = hypothesisStore.getParallelHypotheses(5);
  console.log(`   Me models: ${parallelHypotheses.me.length}`);
  console.log(`   We models: ${parallelHypotheses.we.length}`);
  console.log(`   System models: ${parallelHypotheses.system.length}`);

  const passedTests = testStore.getByStatus("passed");
  const pendingTests = testStore.getPendingTests();
  console.log(`   Passed tests: ${passedTests.length}`);
  console.log(`   Pending tests: ${pendingTests.length}\n`);

  // 9. Demonstrate audit trail
  console.log("9. Demonstrating audit trail...");
  const eventChain = eventStore.getEventChain(evidenceEvent.id);
  console.log(`   Event chain length: ${eventChain.length}`);
  console.log(`   Chain: ${eventChain.map((e) => e.type).join(" -> ")}\n`);

  // 10. Export for backup
  console.log("10. Exporting data for backup...");
  const allEvents = eventStore.exportAll();
  const allIntents = intentStore.exportAll();
  const allHypotheses = hypothesisStore.exportAll();
  const allTests = testStore.exportAll();

  console.log(`   Exported ${allEvents.length} events`);
  console.log(`   Exported ${allIntents.length} intents`);
  console.log(`   Exported ${allHypotheses.length} hypotheses`);
  console.log(`   Exported ${allTests.length} tests\n`);

  console.log("=== Demo Complete ===\n");
  console.log("Summary:");
  console.log("- Created actors with bounded permissions");
  console.log("- Recorded events with full audit trail");
  console.log("- Tracked intents from goal to execution");
  console.log("- Managed parallel hypotheses across models");
  console.log("- Executed and tracked tests");
  console.log("- Demonstrated querying and export capabilities");
  console.log("\nAll data is reversible and audit-traceable!");
}

// Run the demo
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo();
}

export { runDemo };
