/**
 * Core types for privacy-preserving facial motion analysis
 * NO IDENTITY RECOGNITION - motion patterns only
 */

export interface FacialMotionConfig {
  /** Webcam device ID or constraint */
  cameraDevice?: string;
  /** Target FPS for capture */
  targetFps: number;
  /** Enable preview window */
  enablePreview: boolean;
  /** Enable NDJSON stdout stream */
  enableNdjsonStream: boolean;
  /** Enable WebSocket server */
  enableWebSocket: boolean;
  /** WebSocket port */
  webSocketPort: number;
  /** Sliding window size for cyclical analysis (frames) */
  windowSize: number;
  /** Privacy consent acknowledged */
  consentAcknowledged: boolean;
}

export interface FaceLandmarks {
  /** Detected landmarks (x, y coordinates) - no identity features */
  points: Array<{ x: number; y: number }>;
  /** Bounding box */
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface MotionFeatures {
  /** Eye aspect ratio (blink detection) */
  leftEyeAspectRatio: number;
  rightEyeAspectRatio: number;
  /** Mouth aspect ratio */
  mouthAspectRatio: number;
  /** Head pose approximation (yaw, pitch, roll in degrees) */
  headPose: {
    yaw: number;
    pitch: number;
    roll: number;
  };
  /** Timestamp */
  timestamp: number;
}

export interface CyclicalMetrics {
  /** Blink frequency (blinks per minute) */
  blinkFrequency: number;
  /** Dominant frequency from FFT (Hz) */
  dominantFrequency: number;
  /** Autocorrelation peak lag */
  autocorrelationLag: number;
  /** Spectral entropy (chaos proxy) */
  spectralEntropy: number;
  /** Sample entropy (complexity proxy) */
  sampleEntropy: number;
}

export interface PredictionResult {
  /** Predicted eye aspect ratio (next frame) */
  predictedEyeAspectRatio: number;
  /** Predicted mouth aspect ratio (next frame) */
  predictedMouthAspectRatio: number;
  /** Confidence score [0-1] */
  confidence: number;
  /** Prediction method used */
  method: "kalman" | "ema" | "ar";
}

export interface FacialMotionPacket {
  /** Schema version for compatibility */
  schemaVersion: string;
  /** Frame timestamp */
  timestamp: number;
  /** Frame number */
  frameNumber: number;
  /** Current motion features */
  features: MotionFeatures | null;
  /** Cyclical metrics (computed over window) */
  cyclical: CyclicalMetrics | null;
  /** Prediction for next frame */
  prediction: PredictionResult | null;
  /** Face detected in current frame */
  faceDetected: boolean;
}

export interface StreamingOptions {
  enableNdjson: boolean;
  enableWebSocket: boolean;
  webSocketPort: number;
}
