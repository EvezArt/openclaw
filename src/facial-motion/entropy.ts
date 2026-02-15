/**
 * Entropy and chaos proxy metrics for cyclical motion analysis
 * These are PROXIES for complexity/regularity, clearly documented as approximations
 */

import type { CyclicalMetrics, MotionFeatures } from "./types.js";

/**
 * Calculate spectral entropy from a signal
 * Proxy for frequency domain complexity
 */
export function calculateSpectralEntropy(signal: number[]): number {
  if (signal.length === 0) {
    return 0;
  }

  // Simple FFT-based spectral entropy (using magnitude spectrum)
  const fft = discreteFourierTransform(signal);
  const magnitudes = fft.map((c) => Math.sqrt(c.real * c.real + c.imag * c.imag));

  // Normalize to probability distribution
  const sum = magnitudes.reduce((a, b) => a + b, 0);
  if (sum === 0) {
    return 0;
  }

  const probabilities = magnitudes.map((m) => m / sum);

  // Calculate Shannon entropy
  let entropy = 0;
  for (const p of probabilities) {
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }

  // Normalize by maximum possible entropy
  const maxEntropy = Math.log2(probabilities.length);
  return maxEntropy > 0 ? entropy / maxEntropy : 0;
}

/**
 * Calculate sample entropy (SampEn)
 * Proxy for signal regularity/complexity
 * Lower values indicate more regularity, higher values indicate more chaos
 */
export function calculateSampleEntropy(signal: number[], m: number = 2, r: number = 0.2): number {
  if (signal.length < m + 1) {
    return 0;
  }

  // Calculate standard deviation for threshold
  const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
  const variance =
    signal.reduce((sum, val) => sum + (val - mean) * (val - mean), 0) / signal.length;
  const std = Math.sqrt(variance);
  const threshold = r * std;

  // Count template matches
  const countMatches = (templateLength: number): number => {
    let count = 0;
    for (let i = 0; i < signal.length - templateLength; i++) {
      for (let j = i + 1; j < signal.length - templateLength; j++) {
        let matches = true;
        for (let k = 0; k < templateLength; k++) {
          if (Math.abs(signal[i + k] - signal[j + k]) > threshold) {
            matches = false;
            break;
          }
        }
        if (matches) {
          count++;
        }
      }
    }
    return count;
  };

  const countM = countMatches(m);
  const countM1 = countMatches(m + 1);

  if (countM === 0 || countM1 === 0) {
    return 0;
  }

  return -Math.log(countM1 / countM);
}

/**
 * Calculate autocorrelation and find dominant lag
 * Used for detecting periodicity in cyclical motion
 */
export function calculateAutocorrelation(signal: number[]): number[] {
  if (signal.length === 0) {
    return [];
  }

  // Remove mean
  const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
  const centered = signal.map((x) => x - mean);

  // Calculate autocorrelation for different lags
  const maxLag = Math.min(signal.length - 1, 100); // Limit computational cost
  const autocorr: number[] = [];

  for (let lag = 0; lag <= maxLag; lag++) {
    let sum = 0;
    let count = 0;
    for (let i = 0; i < centered.length - lag; i++) {
      sum += centered[i] * centered[i + lag];
      count++;
    }
    autocorr.push(count > 0 ? sum / count : 0);
  }

  // Normalize by lag-0 value
  const norm = autocorr[0];
  if (norm > 0) {
    return autocorr.map((x) => x / norm);
  }

  return autocorr;
}

/**
 * Find dominant frequency using simple FFT peak detection
 */
export function findDominantFrequency(signal: number[], sampleRate: number): number {
  if (signal.length < 2) {
    return 0;
  }

  const fft = discreteFourierTransform(signal);
  const magnitudes = fft.map((c) => Math.sqrt(c.real * c.real + c.imag * c.imag));

  // Find peak (excluding DC component at index 0)
  let maxMag = 0;
  let maxIdx = 0;
  for (let i = 1; i < magnitudes.length / 2; i++) {
    if (magnitudes[i] > maxMag) {
      maxMag = magnitudes[i];
      maxIdx = i;
    }
  }

  // Convert bin index to frequency
  const frequency = (maxIdx * sampleRate) / signal.length;
  return frequency;
}

/**
 * Discrete Fourier Transform (simple implementation)
 * For production use, consider a proper FFT library like fft.js
 */
function discreteFourierTransform(signal: number[]): Array<{ real: number; imag: number }> {
  const N = signal.length;
  const result: Array<{ real: number; imag: number }> = [];

  for (let k = 0; k < N; k++) {
    let real = 0;
    let imag = 0;
    for (let n = 0; n < N; n++) {
      const angle = (-2 * Math.PI * k * n) / N;
      real += signal[n] * Math.cos(angle);
      imag += signal[n] * Math.sin(angle);
    }
    result.push({ real, imag });
  }

  return result;
}

/**
 * Calculate all cyclical metrics from a window of motion features
 */
export function calculateCyclicalMetrics(
  features: MotionFeatures[],
  windowDurationSec: number,
): CyclicalMetrics {
  if (features.length === 0) {
    return {
      blinkFrequency: 0,
      dominantFrequency: 0,
      autocorrelationLag: 0,
      spectralEntropy: 0,
      sampleEntropy: 0,
    };
  }

  // Extract eye aspect ratio signal (average of left and right)
  const earSignal = features.map((f) => (f.leftEyeAspectRatio + f.rightEyeAspectRatio) / 2);

  // Detect blinks (EAR drops below threshold)
  const blinkThreshold = 0.2;
  let blinkCount = 0;
  let wasBlinking = false;
  for (const ear of earSignal) {
    const isBlinking = ear < blinkThreshold;
    if (isBlinking && !wasBlinking) {
      blinkCount++;
    }
    wasBlinking = isBlinking;
  }
  const blinkFrequency = windowDurationSec > 0 ? (blinkCount / windowDurationSec) * 60 : 0; // blinks per minute

  // Calculate sample rate (approx)
  const sampleRate = features.length / windowDurationSec;

  // Find dominant frequency
  const dominantFreq = findDominantFrequency(earSignal, sampleRate);

  // Calculate autocorrelation and find peak lag
  const autocorr = calculateAutocorrelation(earSignal);
  let maxAutocorr = 0;
  let maxLag = 0;
  for (let i = 1; i < autocorr.length; i++) {
    // Skip lag 0
    if (autocorr[i] > maxAutocorr) {
      maxAutocorr = autocorr[i];
      maxLag = i;
    }
  }

  // Calculate entropy metrics
  const spectralEnt = calculateSpectralEntropy(earSignal);
  const sampleEnt = calculateSampleEntropy(earSignal, 2, 0.2);

  return {
    blinkFrequency,
    dominantFrequency: dominantFreq,
    autocorrelationLag: maxLag,
    spectralEntropy: spectralEnt,
    sampleEntropy: sampleEnt,
  };
}
