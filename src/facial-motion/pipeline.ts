/**
 * Main facial motion analysis pipeline
 * Orchestrates capture, tracking, feature extraction, and streaming
 */

import type { FacialMotionConfig, MotionFeatures } from "./types.js";
import { WebcamCapture, type CaptureFrame } from "./capture.js";
import { createFaceTracker, type FaceTracker } from "./tracking.js";
import { extractMotionFeatures } from "./features.js";
import { calculateCyclicalMetrics } from "./entropy.js";
import { MotionPredictor } from "./prediction.js";
import { NdjsonStreamer } from "./streaming/ndjson.js";
import { MotionWebSocketServer } from "./streaming/websocket.js";
import { createPacket } from "./streaming/schema.js";

export class FacialMotionPipeline {
  private config: FacialMotionConfig;
  private capture: WebcamCapture;
  private tracker: FaceTracker;
  private predictor: MotionPredictor;
  private ndjsonStreamer: NdjsonStreamer;
  private wsServer: MotionWebSocketServer | null = null;

  private featureWindow: MotionFeatures[] = [];
  private frameNumber: number = 0;
  private running: boolean = false;

  constructor(config: FacialMotionConfig) {
    this.config = config;
    this.capture = new WebcamCapture(config.targetFps, config.cameraDevice);
    this.tracker = createFaceTracker("stub");
    this.predictor = new MotionPredictor("kalman");
    this.ndjsonStreamer = new NdjsonStreamer(config.enableNdjsonStream);

    if (config.enableWebSocket) {
      this.wsServer = new MotionWebSocketServer(config.webSocketPort);
    }
  }

  async initialize(): Promise<void> {
    console.error("Initializing facial motion pipeline...");

    await this.tracker.initialize();

    if (this.wsServer) {
      await this.wsServer.start();
    }

    console.error("Pipeline initialized successfully");
  }

  async start(): Promise<void> {
    if (this.running) {
      throw new Error("Pipeline already running");
    }

    console.error("Starting capture and analysis...");
    this.running = true;
    this.frameNumber = 0;

    this.capture.startCapture(async (frame: CaptureFrame) => {
      if (!this.running) {
        return;
      }

      await this.processFrame(frame);
    });
  }

  private async processFrame(frame: CaptureFrame): Promise<void> {
    try {
      // Convert frame data to ImageData if needed
      let imageData: ImageData;
      if (frame.data instanceof ImageData) {
        imageData = frame.data;
      } else {
        // For browser environments, this would extract ImageData from canvas/video
        // In stub mode, create dummy ImageData
        imageData = new ImageData(1, 1);
      }

      // Face detection and landmark tracking
      const landmarks = await this.tracker.detect(imageData);
      const faceDetected = landmarks !== null;

      // Extract motion features
      const features = faceDetected ? extractMotionFeatures(landmarks, frame.timestamp) : null;

      // Update feature window for cyclical analysis
      if (features) {
        this.featureWindow.push(features);
        if (this.featureWindow.length > this.config.windowSize) {
          this.featureWindow.shift();
        }

        // Update predictor
        this.predictor.update(features);
      }

      // Calculate cyclical metrics (only if we have enough data)
      const cyclical =
        this.featureWindow.length >= Math.min(30, this.config.windowSize)
          ? calculateCyclicalMetrics(
              this.featureWindow,
              this.featureWindow.length / this.config.targetFps,
            )
          : null;

      // Get prediction
      const prediction = features ? this.predictor.predict() : null;

      // Create packet
      const packet = createPacket(frame.timestamp, frame.frameNumber, {
        features,
        cyclical,
        prediction,
        faceDetected,
      });

      // Stream to outputs
      this.ndjsonStreamer.write(packet);
      if (this.wsServer) {
        this.wsServer.broadcast(packet);
      }

      this.frameNumber++;
    } catch (error) {
      console.error(
        `Frame processing error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  stop(): void {
    if (!this.running) {
      return;
    }

    console.error("Stopping pipeline...");
    this.running = false;
    this.capture.stopCapture();
    console.error("Pipeline stopped");
  }

  async cleanup(): Promise<void> {
    this.stop();

    console.error("Cleaning up resources...");
    await this.capture.cleanup();
    await this.tracker.cleanup();

    if (this.wsServer) {
      await this.wsServer.stop();
    }

    console.error("Cleanup complete");
  }

  getStats() {
    const captureStats = this.capture.getStats();
    const ndjsonStats = this.ndjsonStreamer.getStats();
    const wsStats = this.wsServer?.getStats() ?? { connectedClients: 0, packetCount: 0 };

    return {
      capture: captureStats,
      ndjson: ndjsonStats,
      websocket: wsStats,
      featureWindowSize: this.featureWindow.length,
      totalFrames: this.frameNumber,
    };
  }
}
