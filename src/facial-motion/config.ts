/**
 * Configuration for privacy-preserving facial motion analysis
 */

import type { FacialMotionConfig } from "./types.js";

export type { FacialMotionConfig };

export const SCHEMA_VERSION = "1.0.0";

export const DEFAULT_CONFIG: FacialMotionConfig = {
  targetFps: 30,
  enablePreview: true,
  enableNdjsonStream: true,
  enableWebSocket: false,
  webSocketPort: 8765,
  windowSize: 90, // 3 seconds at 30fps
  consentAcknowledged: false,
};

export const PRIVACY_NOTICE = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                        PRIVACY & CONSENT NOTICE                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  This facial motion analysis tool is PRIVACY-PRESERVING:                    ║
║                                                                              ║
║  ✓ NO identity recognition or face identification                           ║
║  ✓ NO face embeddings or biometric templates stored                         ║
║  ✓ NO background data collection or telemetry                               ║
║  ✓ ONLY cyclical motion patterns analyzed (blinks, mouth, head pose)        ║
║  ✓ ALL data processing is LOCAL to your device                              ║
║  ✓ Data streams are OPT-IN via explicit configuration                       ║
║                                                                              ║
║  By continuing, you acknowledge:                                            ║
║  • You have read and understood this privacy notice                         ║
║  • You consent to webcam access for motion analysis only                    ║
║  • You understand this tool does not perform identity recognition           ║
║  • You are using this tool in compliance with applicable laws               ║
║                                                                              ║
║  Use --consent flag to acknowledge and proceed                              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;

export function validateConfig(config: FacialMotionConfig): string[] {
  const errors: string[] = [];

  if (!config.consentAcknowledged) {
    errors.push("Privacy consent not acknowledged. Use --consent flag.");
  }

  if (config.targetFps <= 0 || config.targetFps > 120) {
    errors.push("Target FPS must be between 1 and 120");
  }

  if (config.windowSize < 10) {
    errors.push("Window size must be at least 10 frames");
  }

  if (config.webSocketPort < 1024 || config.webSocketPort > 65535) {
    errors.push("WebSocket port must be between 1024 and 65535");
  }

  if (!config.enableNdjsonStream && !config.enableWebSocket && !config.enablePreview) {
    errors.push("At least one output method must be enabled (NDJSON, WebSocket, or Preview)");
  }

  return errors;
}

export function mergeConfig(
  base: FacialMotionConfig,
  overrides: Partial<FacialMotionConfig>,
): FacialMotionConfig {
  return { ...base, ...overrides };
}
