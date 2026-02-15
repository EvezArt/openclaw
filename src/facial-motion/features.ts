/**
 * Feature extraction from facial landmarks
 * Focus on cyclical motion patterns: blinks, mouth movement, head pose
 * NO identity recognition - motion metrics only
 */

import type { FaceLandmarks, MotionFeatures } from "./types.js";

/**
 * Calculate Eye Aspect Ratio (EAR) for blink detection
 * Based on Soukupová and Čech (2016)
 */
function calculateEyeAspectRatio(eyePoints: Array<{ x: number; y: number }>): number {
  if (eyePoints.length < 6) {
    return 0;
  }

  // Vertical distances
  const v1 = euclideanDistance(eyePoints[1], eyePoints[5]);
  const v2 = euclideanDistance(eyePoints[2], eyePoints[4]);

  // Horizontal distance
  const h = euclideanDistance(eyePoints[0], eyePoints[3]);

  if (h === 0) {
    return 0;
  }

  return (v1 + v2) / (2.0 * h);
}

/**
 * Calculate Mouth Aspect Ratio (MAR) for mouth opening detection
 */
function calculateMouthAspectRatio(mouthPoints: Array<{ x: number; y: number }>): number {
  if (mouthPoints.length < 8) {
    return 0;
  }

  // Vertical distances (top to bottom)
  const v1 = euclideanDistance(mouthPoints[1], mouthPoints[7]);
  const v2 = euclideanDistance(mouthPoints[2], mouthPoints[6]);
  const v3 = euclideanDistance(mouthPoints[3], mouthPoints[5]);

  // Horizontal distance (left to right)
  const h = euclideanDistance(mouthPoints[0], mouthPoints[4]);

  if (h === 0) {
    return 0;
  }

  return (v1 + v2 + v3) / (3.0 * h);
}

/**
 * Estimate head pose from landmark geometry
 * Returns yaw, pitch, roll approximations in degrees
 * Note: This is a simplified approximation, not full 3D pose estimation
 */
function estimateHeadPose(landmarks: FaceLandmarks): { yaw: number; pitch: number; roll: number } {
  const points = landmarks.points;

  if (points.length < 68) {
    // Need sufficient landmarks for pose estimation
    return { yaw: 0, pitch: 0, roll: 0 };
  }

  // Use key facial points for approximate pose
  // Indices based on common 68-point landmark model
  const leftEye = points[36] || { x: 0, y: 0 };
  const rightEye = points[45] || { x: 0, y: 0 };
  const nose = points[30] || { x: 0, y: 0 };
  const leftMouth = points[48] || { x: 0, y: 0 };

  // Calculate eye center
  const eyeCenterX = (leftEye.x + rightEye.x) / 2;
  const eyeCenterY = (leftEye.y + rightEye.y) / 2;

  // Roll: angle of eye line from horizontal
  const eyeDx = rightEye.x - leftEye.x;
  const eyeDy = rightEye.y - leftEye.y;
  const roll = (Math.atan2(eyeDy, eyeDx) * 180) / Math.PI;

  // Yaw: horizontal deviation of nose from eye-mouth vertical axis
  const faceWidth = euclideanDistance(leftEye, rightEye);
  const noseDeviation = nose.x - eyeCenterX;
  const yaw = faceWidth > 0 ? (noseDeviation / faceWidth) * 60 : 0; // Scaled approximation

  // Pitch: vertical position of nose relative to eyes and mouth
  const faceHeight = Math.abs(eyeCenterY - leftMouth.y);
  const noseVerticalPos = nose.y - eyeCenterY;
  const pitch = faceHeight > 0 ? (noseVerticalPos / faceHeight) * 30 : 0; // Scaled approximation

  return { yaw, pitch, roll };
}

/**
 * Euclidean distance between two points
 */
function euclideanDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Extract motion features from facial landmarks
 * Adapts to different landmark models (68-point, MediaPipe 468-point, etc.)
 */
export function extractMotionFeatures(
  landmarks: FaceLandmarks | null,
  timestamp: number,
): MotionFeatures | null {
  if (!landmarks || !landmarks.points || landmarks.points.length === 0) {
    return null;
  }

  // Detect landmark model and extract appropriate regions
  const numPoints = landmarks.points.length;
  let leftEyePoints: Array<{ x: number; y: number }> = [];
  let rightEyePoints: Array<{ x: number; y: number }> = [];
  let mouthPoints: Array<{ x: number; y: number }> = [];

  if (numPoints === 68) {
    // 68-point face landmark model (dlib/face-api.js)
    leftEyePoints = landmarks.points.slice(42, 48);
    rightEyePoints = landmarks.points.slice(36, 42);
    mouthPoints = landmarks.points.slice(48, 60);
  } else if (numPoints >= 468) {
    // MediaPipe FaceMesh 468-point model
    // Left eye region (approximate indices)
    const leftEyeIndices = [33, 160, 158, 133, 153, 144];
    const rightEyeIndices = [362, 385, 387, 263, 373, 380];
    const mouthIndices = [61, 146, 91, 181, 84, 17, 314, 405];

    leftEyePoints = leftEyeIndices.map((i) => landmarks.points[i]).filter((p) => p !== undefined);
    rightEyePoints = rightEyeIndices.map((i) => landmarks.points[i]).filter((p) => p !== undefined);
    mouthPoints = mouthIndices.map((i) => landmarks.points[i]).filter((p) => p !== undefined);
  } else {
    // Unknown model, try to use first available points
    const third = Math.floor(numPoints / 3);
    leftEyePoints = landmarks.points.slice(0, Math.min(6, third));
    rightEyePoints = landmarks.points.slice(third, Math.min(third + 6, numPoints));
    mouthPoints = landmarks.points.slice(numPoints - 8, numPoints);
  }

  const leftEar = calculateEyeAspectRatio(leftEyePoints);
  const rightEar = calculateEyeAspectRatio(rightEyePoints);
  const mar = calculateMouthAspectRatio(mouthPoints);
  const headPose = estimateHeadPose(landmarks);

  return {
    leftEyeAspectRatio: leftEar,
    rightEyeAspectRatio: rightEar,
    mouthAspectRatio: mar,
    headPose,
    timestamp,
  };
}

/**
 * Detect blink from EAR threshold
 */
export function detectBlink(leftEar: number, rightEar: number, threshold: number = 0.2): boolean {
  const avgEar = (leftEar + rightEar) / 2;
  return avgEar < threshold;
}

/**
 * Detect mouth opening from MAR threshold
 */
export function detectMouthOpen(mar: number, threshold: number = 0.5): boolean {
  return mar > threshold;
}
