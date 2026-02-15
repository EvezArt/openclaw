/**
 * Streaming output schemas and versioning
 */

import type { FacialMotionPacket } from "../types.js";

export const CURRENT_SCHEMA_VERSION = "1.0.0";

/**
 * Validate packet schema version
 */
export function validateSchemaVersion(version: string): boolean {
  const [major] = version.split(".").map(Number);
  const [currentMajor] = CURRENT_SCHEMA_VERSION.split(".").map(Number);
  return major === currentMajor;
}

/**
 * Create a packet with proper schema version
 */
export function createPacket(
  timestamp: number,
  frameNumber: number,
  options: Partial<Omit<FacialMotionPacket, "schemaVersion" | "timestamp" | "frameNumber">>,
): FacialMotionPacket {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    timestamp,
    frameNumber,
    features: options.features ?? null,
    cyclical: options.cyclical ?? null,
    prediction: options.prediction ?? null,
    faceDetected: options.faceDetected ?? false,
  };
}

/**
 * Example NDJSON packet for documentation
 */
export const EXAMPLE_NDJSON_PACKET = `{
  "schemaVersion": "1.0.0",
  "timestamp": 1707428765432,
  "frameNumber": 123,
  "faceDetected": true,
  "features": {
    "leftEyeAspectRatio": 0.285,
    "rightEyeAspectRatio": 0.290,
    "mouthAspectRatio": 0.15,
    "headPose": {
      "yaw": -5.2,
      "pitch": 2.1,
      "roll": 0.8
    },
    "timestamp": 1707428765432
  },
  "cyclical": {
    "blinkFrequency": 18.5,
    "dominantFrequency": 0.31,
    "autocorrelationLag": 15,
    "spectralEntropy": 0.72,
    "sampleEntropy": 0.45
  },
  "prediction": {
    "predictedEyeAspectRatio": 0.287,
    "predictedMouthAspectRatio": 0.16,
    "confidence": 0.85,
    "method": "kalman"
  }
}`;

/**
 * Example WebSocket message for documentation
 */
export const EXAMPLE_WEBSOCKET_MESSAGE = EXAMPLE_NDJSON_PACKET;
