/**
 * Real-Time Action Monitoring Demo
 *
 * Demonstrates "word for word wirelessly" what actions are being measured
 */

import { ActionMonitor, WirelessActionReporter, ActionMeasurement } from "./action-monitoring.js";

async function demonstrateActionMonitoring() {
  console.log("=== Real-Time Action Monitoring Demo ===\n");

  const monitor = new ActionMonitor();
  const reporter = new WirelessActionReporter(monitor);
  const userId = "user123";
  const sessionId = "session_" + Date.now();

  // Start monitoring
  console.log("1. Starting monitoring...\n");
  monitor.startMonitoring(userId, sessionId);

  // Subscribe to wireless reports
  console.log("2. Subscribing to wireless action stream...\n");
  const unsubscribe = reporter.subscribe(userId, (report) => {
    console.log("[WIRELESS BROADCAST]");
    console.log(report);
    console.log("---\n");
  });

  // Subscribe to individual actions
  monitor.subscribe((action: ActionMeasurement) => {
    console.log(`[ACTION CAPTURED] ${action.timestamp / 1000}: ${action.description}`);
    if (action.pattern) {
      console.log(`  → Pattern: ${action.pattern}`);
    }
  });

  // Simulate user actions with measurements
  console.log("3. Simulating user actions...\n");

  // Keystroke actions
  monitor.recordAction(
    userId,
    "keystroke",
    'User typed: "Hello"',
    { location: "text_editor", key: "H", character: "H" },
    { durationMs: 5.2, latencyMs: 1.1 },
  );

  await sleep(50);

  monitor.recordAction(
    userId,
    "keystroke",
    'User typed: "e"',
    { location: "text_editor", key: "e", character: "e" },
    { durationMs: 4.8, latencyMs: 1.0 },
  );

  await sleep(50);

  monitor.recordAction(
    userId,
    "keystroke",
    'User typed: "l"',
    { location: "text_editor", key: "l", character: "l" },
    { durationMs: 5.1, latencyMs: 1.2 },
  );

  await sleep(50);

  monitor.recordAction(
    userId,
    "keystroke",
    'User typed: "l"',
    { location: "text_editor", key: "l", character: "l" },
    { durationMs: 5.0, latencyMs: 1.1 },
  );

  await sleep(50);

  monitor.recordAction(
    userId,
    "keystroke",
    'User typed: "o"',
    { location: "text_editor", key: "o", character: "o" },
    { durationMs: 4.9, latencyMs: 1.0 },
  );

  await sleep(100);

  // File operations
  monitor.recordAction(
    userId,
    "file_save",
    "User saved file: document.txt",
    { location: "text_editor", filename: "document.txt", size: 1024 },
    { durationMs: 12.5, latencyMs: 8.3 },
  );

  await sleep(200);

  // Command execution
  monitor.recordAction(
    userId,
    "command_execute",
    "User executed command: npm test",
    { location: "terminal", command: "npm test", exitCode: 0 },
    { durationMs: 2500, latencyMs: 5.2 },
  );

  await sleep(100);

  // Network request
  monitor.recordAction(
    userId,
    "network_request",
    "User made HTTP GET request to /api/data",
    { location: "browser", url: "/api/data", method: "GET", status: 200 },
    { durationMs: 45.2, latencyMs: 42.1, networkActivity: 2048 },
  );

  await sleep(150);

  // Mouse click
  monitor.recordAction(
    userId,
    "mouse_click",
    'User clicked button: "Submit"',
    { location: "browser", element: "submit_button", x: 450, y: 300 },
    { durationMs: 3.1, latencyMs: 0.5 },
  );

  await sleep(100);

  // Context switch
  monitor.recordAction(
    userId,
    "context_switch",
    "User switched to application: Chrome",
    { location: "desktop", from_app: "VSCode", to_app: "Chrome" },
    { durationMs: 150, latencyMs: 120 },
  );

  await sleep(50);

  // Rapid sequence (triggers pattern detection)
  monitor.recordAction(
    userId,
    "scroll",
    "User scrolled down in page",
    { location: "browser", direction: "down", amount: 100 },
    { durationMs: 5, latencyMs: 2 },
  );

  await sleep(30);

  monitor.recordAction(
    userId,
    "scroll",
    "User scrolled down in page",
    { location: "browser", direction: "down", amount: 100 },
    { durationMs: 5, latencyMs: 2 },
  );

  await sleep(30);

  monitor.recordAction(
    userId,
    "scroll",
    "User scrolled down in page",
    { location: "browser", direction: "down", amount: 100 },
    { durationMs: 5, latencyMs: 2 },
  );

  console.log("\n4. Getting current activity description...\n");
  const currentDescription = monitor.describeCurrentActivity(userId);
  console.log(currentDescription);

  console.log("\n5. Generating full action report...\n");
  const report = monitor.generateActionReport(userId);
  console.log(report);

  console.log("\n6. Broadcasting wireless report...\n");
  const wirelessReport = reporter.sendReport(userId);
  console.log("[WIRELESS TRANSMISSION]");
  console.log(wirelessReport);

  // Cleanup
  unsubscribe();
  monitor.stopMonitoring(userId);

  console.log("\n=== Demo Complete ===");
  console.log("\nKey capabilities demonstrated:");
  console.log("✓ Real-time action capture (microsecond precision)");
  console.log('✓ "Word for word" action descriptions');
  console.log("✓ Wireless reporting (live stream)");
  console.log("✓ Measurement tracking (duration, latency, resources)");
  console.log("✓ Pattern detection (repeated actions, rapid sequences)");
  console.log("✓ Context tracking (location, previous actions, device)");
  console.log("✓ Complete audit trail with timestamps");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run demo
demonstrateActionMonitoring().catch(console.error);
