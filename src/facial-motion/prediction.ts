/**
 * Short-horizon prediction for motion features
 * Supports baseline forecasters: Kalman filter, EMA, AR model
 */

import type { MotionFeatures, PredictionResult } from "./types.js";

/**
 * Exponential Moving Average (EMA) predictor
 */
export class EMAPredictor {
  private alpha: number;
  private earEma: number | null = null;
  private marEma: number | null = null;

  constructor(alpha: number = 0.3) {
    this.alpha = alpha;
  }

  update(features: MotionFeatures): void {
    const avgEar = (features.leftEyeAspectRatio + features.rightEyeAspectRatio) / 2;

    if (this.earEma === null) {
      this.earEma = avgEar;
      this.marEma = features.mouthAspectRatio;
    } else {
      this.earEma = this.alpha * avgEar + (1 - this.alpha) * this.earEma;
      if (this.marEma !== null) {
        this.marEma = this.alpha * features.mouthAspectRatio + (1 - this.alpha) * this.marEma;
      }
    }
  }

  predict(): PredictionResult {
    return {
      predictedEyeAspectRatio: this.earEma ?? 0,
      predictedMouthAspectRatio: this.marEma ?? 0,
      confidence: this.earEma !== null ? 0.7 : 0,
      method: "ema",
    };
  }

  reset(): void {
    this.earEma = null;
    this.marEma = null;
  }
}

/**
 * Simple Kalman filter for 1D signal prediction
 */
export class KalmanFilter1D {
  private x: number = 0; // State estimate
  private p: number = 1; // Estimate uncertainty
  private q: number; // Process noise
  private r: number; // Measurement noise

  constructor(processNoise: number = 0.01, measurementNoise: number = 0.1) {
    this.q = processNoise;
    this.r = measurementNoise;
  }

  update(measurement: number): void {
    // Predict
    const xPrior = this.x;
    const pPrior = this.p + this.q;

    // Update
    const k = pPrior / (pPrior + this.r); // Kalman gain
    this.x = xPrior + k * (measurement - xPrior);
    this.p = (1 - k) * pPrior;
  }

  predict(): number {
    return this.x;
  }

  getUncertainty(): number {
    return this.p;
  }

  reset(): void {
    this.x = 0;
    this.p = 1;
  }
}

/**
 * Kalman filter predictor for motion features
 */
export class KalmanPredictor {
  private earFilter: KalmanFilter1D;
  private marFilter: KalmanFilter1D;
  private initialized: boolean = false;

  constructor() {
    this.earFilter = new KalmanFilter1D(0.01, 0.1);
    this.marFilter = new KalmanFilter1D(0.01, 0.1);
  }

  update(features: MotionFeatures): void {
    const avgEar = (features.leftEyeAspectRatio + features.rightEyeAspectRatio) / 2;
    this.earFilter.update(avgEar);
    this.marFilter.update(features.mouthAspectRatio);
    this.initialized = true;
  }

  predict(): PredictionResult {
    const earPred = this.earFilter.predict();
    const marPred = this.marFilter.predict();
    const confidence = this.initialized
      ? Math.min(1.0, 1.0 / (this.earFilter.getUncertainty() + 0.1))
      : 0;

    return {
      predictedEyeAspectRatio: earPred,
      predictedMouthAspectRatio: marPred,
      confidence: Math.min(confidence, 0.95),
      method: "kalman",
    };
  }

  reset(): void {
    this.earFilter.reset();
    this.marFilter.reset();
    this.initialized = false;
  }
}

/**
 * Autoregressive (AR) model predictor
 * Uses AR(p) model with least squares fitting
 */
export class ARPredictor {
  private order: number;
  private earHistory: number[] = [];
  private marHistory: number[] = [];
  private earCoeffs: number[] = [];
  private marCoeffs: number[] = [];

  constructor(order: number = 3) {
    this.order = order;
  }

  update(features: MotionFeatures): void {
    const avgEar = (features.leftEyeAspectRatio + features.rightEyeAspectRatio) / 2;
    this.earHistory.push(avgEar);
    this.marHistory.push(features.mouthAspectRatio);

    // Keep history at 2x order for fitting
    const maxHistory = this.order * 10;
    if (this.earHistory.length > maxHistory) {
      this.earHistory.shift();
      this.marHistory.shift();
    }

    // Refit coefficients when we have enough data
    if (this.earHistory.length > this.order) {
      this.earCoeffs = this.fitAR(this.earHistory, this.order);
      this.marCoeffs = this.fitAR(this.marHistory, this.order);
    }
  }

  predict(): PredictionResult {
    const earPred = this.predictNext(this.earHistory, this.earCoeffs);
    const marPred = this.predictNext(this.marHistory, this.marCoeffs);
    const confidence = this.earHistory.length > this.order ? 0.8 : 0.3;

    return {
      predictedEyeAspectRatio: earPred,
      predictedMouthAspectRatio: marPred,
      confidence,
      method: "ar",
    };
  }

  private fitAR(data: number[], order: number): number[] {
    if (data.length <= order) {
      return Array.from({ length: order }, () => 0);
    }

    // Simple AR fitting using least squares (simplified)
    // In production, use a proper time series library
    const coeffs: number[] = [];
    for (let i = 0; i < order; i++) {
      // Compute correlation at lag i+1
      let sum = 0;
      let count = 0;
      for (let j = order; j < data.length; j++) {
        sum += data[j] * data[j - i - 1];
        count++;
      }
      coeffs.push(count > 0 ? sum / count : 0);
    }

    // Normalize coefficients
    const sumCoeffs = coeffs.reduce((a, b) => a + Math.abs(b), 0);
    return sumCoeffs > 0 ? coeffs.map((c) => c / sumCoeffs) : coeffs;
  }

  private predictNext(history: number[], coeffs: number[]): number {
    if (history.length < coeffs.length || coeffs.length === 0) {
      return history[history.length - 1] ?? 0;
    }

    let prediction = 0;
    for (let i = 0; i < coeffs.length; i++) {
      prediction += coeffs[i] * history[history.length - i - 1];
    }
    return prediction;
  }

  reset(): void {
    this.earHistory = [];
    this.marHistory = [];
    this.earCoeffs = [];
    this.marCoeffs = [];
  }
}

/**
 * Combined predictor that can switch between methods
 */
export class MotionPredictor {
  private emaPredictor: EMAPredictor;
  private kalmanPredictor: KalmanPredictor;
  private arPredictor: ARPredictor;
  private currentMethod: "ema" | "kalman" | "ar";

  constructor(method: "ema" | "kalman" | "ar" = "kalman") {
    this.emaPredictor = new EMAPredictor();
    this.kalmanPredictor = new KalmanPredictor();
    this.arPredictor = new ARPredictor();
    this.currentMethod = method;
  }

  update(features: MotionFeatures): void {
    this.emaPredictor.update(features);
    this.kalmanPredictor.update(features);
    this.arPredictor.update(features);
  }

  predict(): PredictionResult {
    switch (this.currentMethod) {
      case "ema":
        return this.emaPredictor.predict();
      case "kalman":
        return this.kalmanPredictor.predict();
      case "ar":
        return this.arPredictor.predict();
      default:
        return this.kalmanPredictor.predict();
    }
  }

  setMethod(method: "ema" | "kalman" | "ar"): void {
    this.currentMethod = method;
  }

  reset(): void {
    this.emaPredictor.reset();
    this.kalmanPredictor.reset();
    this.arPredictor.reset();
  }
}
