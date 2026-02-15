/**
 * CLI for facial motion analysis
 * Privacy-preserving real-time facial motion tracking and prediction
 */

import { Command } from "commander";
import {
  DEFAULT_CONFIG,
  PRIVACY_NOTICE,
  validateConfig,
  mergeConfig,
  type FacialMotionConfig,
} from "../facial-motion/config.js";
import { FacialMotionPipeline } from "../facial-motion/pipeline.js";

export function registerFacialMotionCli(program: Command): void {
  const facialMotionCommand = program
    .command("facial-motion")
    .description("Privacy-preserving real-time facial motion analysis and prediction")
    .option("--consent", "Acknowledge privacy notice and consent to webcam usage", false)
    .option("--fps <number>", "Target frames per second (1-120)", String(DEFAULT_CONFIG.targetFps))
    .option(
      "--window-size <number>",
      "Sliding window size for cyclical analysis (frames)",
      String(DEFAULT_CONFIG.windowSize),
    )
    .option("--camera <deviceId>", "Camera device ID (optional)")
    .option("--no-preview", "Disable preview window")
    .option("--no-ndjson", "Disable NDJSON stdout stream")
    .option("--websocket", "Enable WebSocket server", DEFAULT_CONFIG.enableWebSocket)
    .option(
      "--websocket-port <number>",
      "WebSocket server port",
      String(DEFAULT_CONFIG.webSocketPort),
    )
    .option("--prediction-method <method>", "Prediction method: kalman, ema, ar", "kalman")
    .action(async (options) => {
      await runFacialMotion(options);
    });

  facialMotionCommand
    .command("list-cameras")
    .description("List available camera devices")
    .action(async () => {
      console.error("Note: Camera listing requires browser environment with MediaDevices API");
      console.error("This feature is currently only available when running in a browser context.");
      process.exit(0);
    });
}

async function runFacialMotion(options: {
  consent: boolean;
  fps: string;
  windowSize: string;
  camera?: string;
  preview: boolean;
  ndjson: boolean;
  websocket: boolean;
  websocketPort: string;
  predictionMethod: string;
}): Promise<void> {
  // Display privacy notice
  console.error(PRIVACY_NOTICE);

  if (!options.consent) {
    console.error("\n❌ Privacy consent not acknowledged.");
    console.error("Please read the privacy notice above and use --consent flag to proceed.");
    process.exit(1);
  }

  // Parse options
  const targetFps = Number.parseInt(options.fps, 10);
  const windowSize = Number.parseInt(options.windowSize, 10);
  const webSocketPort = Number.parseInt(options.websocketPort, 10);

  if (Number.isNaN(targetFps) || Number.isNaN(windowSize) || Number.isNaN(webSocketPort)) {
    console.error("❌ Invalid numeric option. Please check fps, window-size, and websocket-port.");
    process.exit(1);
  }

  // Build configuration
  const config: FacialMotionConfig = mergeConfig(DEFAULT_CONFIG, {
    consentAcknowledged: options.consent,
    targetFps,
    windowSize,
    cameraDevice: options.camera,
    enablePreview: options.preview,
    enableNdjsonStream: options.ndjson,
    enableWebSocket: options.websocket,
    webSocketPort,
  });

  // Validate configuration
  const errors = validateConfig(config);
  if (errors.length > 0) {
    console.error("\n❌ Configuration errors:");
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  console.error("\n✅ Privacy consent acknowledged");
  console.error("\nConfiguration:");
  console.error(`  Target FPS: ${config.targetFps}`);
  console.error(`  Window size: ${config.windowSize} frames`);
  console.error(`  Preview: ${config.enablePreview ? "enabled" : "disabled"}`);
  console.error(`  NDJSON stream: ${config.enableNdjsonStream ? "enabled" : "disabled"}`);
  console.error(
    `  WebSocket: ${config.enableWebSocket ? `enabled (port ${config.webSocketPort})` : "disabled"}`,
  );
  console.error(`  Prediction method: ${options.predictionMethod}`);

  // Note about browser requirement
  console.error("\n⚠️  NOTE: This feature requires a browser environment with:");
  console.error("  - MediaDevices API for webcam access");
  console.error("  - Canvas API for frame processing");
  console.error("");
  console.error("  Current environment: Node.js CLI");
  console.error("  This is a demonstration of the pipeline architecture.");
  console.error("  For full functionality, integrate this module into a browser-based");
  console.error("  application or use a Node.js library like node-webcam.");
  console.error("");

  // Create and initialize pipeline
  const pipeline = new FacialMotionPipeline(config);

  // Setup graceful shutdown
  const shutdown = async () => {
    console.error("\n\nShutting down...");
    await pipeline.cleanup();

    const stats = pipeline.getStats();
    console.error("\nFinal statistics:");
    console.error(`  Total frames processed: ${stats.totalFrames}`);
    console.error(`  NDJSON packets sent: ${stats.ndjson.packetCount}`);
    if (config.enableWebSocket) {
      console.error(`  WebSocket packets sent: ${stats.websocket.packetCount}`);
      console.error(`  WebSocket clients: ${stats.websocket.connectedClients}`);
    }

    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  try {
    await pipeline.initialize();

    console.error("\nStarting facial motion analysis...");
    console.error("Press Ctrl+C to stop\n");

    // In a browser environment, this would start the capture loop
    // In Node.js CLI, we demonstrate the architecture but note the limitation
    console.error("Pipeline initialized successfully.");
    console.error("In a browser environment, capture would begin now.");
    console.error("\nExample output packet structure:");
    console.error(
      JSON.stringify(
        {
          schemaVersion: "1.0.0",
          timestamp: Date.now(),
          frameNumber: 0,
          faceDetected: true,
          features: {
            leftEyeAspectRatio: 0.285,
            rightEyeAspectRatio: 0.29,
            mouthAspectRatio: 0.15,
            headPose: { yaw: -5.2, pitch: 2.1, roll: 0.8 },
            timestamp: Date.now(),
          },
          cyclical: null,
          prediction: null,
        },
        null,
        2,
      ),
    );

    // Keep process alive until shutdown signal
    await new Promise(() => {
      // Wait indefinitely for shutdown signal
    });
  } catch (error) {
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    await pipeline.cleanup();
    process.exit(1);
  }
}
