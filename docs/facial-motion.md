# Privacy-Preserving Facial Motion Analysis

## Overview

The Facial Motion Analysis module provides real-time, consent-based analysis of facial motion patterns **without** identity recognition. This tool focuses exclusively on cyclical motion patterns (blinks, mouth movements, head pose) for applications requiring motion analysis but not identification.

## Privacy Model

### What This Tool Does ✅

- Analyzes facial motion patterns (blinks, mouth movements, head pose)
- Extracts cyclical metrics (frequency, periodicity, entropy)
- Provides short-horizon predictions for motion features
- Streams data via NDJSON (stdout) and/or WebSocket
- Processes data locally on your device

### What This Tool Does NOT Do ❌

- **NO** face identification or recognition
- **NO** face embeddings or biometric templates stored
- **NO** background data collection or telemetry
- **NO** covert sensor activation
- **NO** identity-related features

### Consent & Safety

Before using this tool, you must:

1. Read and understand the privacy notice
2. Acknowledge consent via the `--consent` flag
3. Comply with applicable laws regarding video/camera usage
4. Ensure subjects are aware of and consent to video capture

## Installation

The module is included in OpenClaw. No additional dependencies required for the CLI demonstration.

For full browser-based functionality, integrate this module into a web application with access to:
- MediaDevices API (webcam access)
- Canvas API (frame processing)

## Usage

### Basic Usage

```bash
# Display privacy notice and options
openclaw facial-motion --help

# Run with consent and default settings
openclaw facial-motion --consent

# Customize FPS and window size
openclaw facial-motion --consent --fps 60 --window-size 120
```

### CLI Options

- `--consent` - **Required**. Acknowledge privacy notice and consent to webcam usage
- `--fps <number>` - Target frames per second (1-120, default: 30)
- `--window-size <number>` - Sliding window size for cyclical analysis in frames (default: 90)
- `--camera <deviceId>` - Specific camera device ID (optional)
- `--no-preview` - Disable preview window
- `--no-ndjson` - Disable NDJSON stdout stream
- `--websocket` - Enable WebSocket server
- `--websocket-port <number>` - WebSocket server port (default: 8765)
- `--prediction-method <method>` - Prediction method: kalman, ema, ar (default: kalman)

### List Available Cameras

```bash
openclaw facial-motion list-cameras
```

Note: Camera listing requires browser environment with MediaDevices API.

## Output Formats

### NDJSON Stream (stdout)

Line-delimited JSON packets streamed to stdout. Each line is a complete JSON object:

```json
{
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
}
```

### WebSocket Stream

Enable with `--websocket` flag. Connects on `ws://localhost:<port>` (default: 8765).

Messages are JSON objects with the same schema as NDJSON packets.

### Preview Window

Local annotated view showing:
- Face bounding box
- Facial landmarks overlay
- Key metrics (EAR, MAR, head pose)

Disable with `--no-preview` for headless operation.

## Feature Descriptions

### Motion Features

- **Eye Aspect Ratio (EAR)**: Ratio of vertical to horizontal eye distances. Used for blink detection (threshold ~0.2)
- **Mouth Aspect Ratio (MAR)**: Ratio of vertical to horizontal mouth distances. Used for mouth opening detection
- **Head Pose**: Approximate yaw, pitch, and roll angles in degrees (landmark-based approximation)

### Cyclical Metrics

Computed over a sliding window of frames:

- **Blink Frequency**: Blinks per minute detected via EAR threshold crossings
- **Dominant Frequency**: Peak frequency from FFT analysis (Hz)
- **Autocorrelation Lag**: Lag at peak autocorrelation, indicating periodicity
- **Spectral Entropy**: Proxy for frequency domain complexity (normalized 0-1)
- **Sample Entropy**: Proxy for signal regularity/complexity (higher = more chaotic)

**Note**: Entropy metrics are **proxies** for complexity and regularity, not precise measures.

### Prediction Methods

Short-horizon forecasters for next-frame predictions:

- **Kalman Filter** (default): Optimal linear predictor, adapts to measurement uncertainty
- **EMA** (Exponential Moving Average): Simple smoothing predictor
- **AR** (Autoregressive): Linear model fitted on recent history

## Schema Versioning

Packets include `schemaVersion` field (e.g., "1.0.0") for compatibility tracking.

Current version: **1.0.0**

Breaking changes will increment the major version number.

## Integration Example

### Pipe NDJSON to File

```bash
openclaw facial-motion --consent --no-preview > motion-data.ndjson
```

### Connect to WebSocket (JavaScript)

```javascript
const ws = new WebSocket('ws://localhost:8765');

ws.onmessage = (event) => {
  const packet = JSON.parse(event.data);
  console.log('Blink frequency:', packet.cyclical?.blinkFrequency);
};
```

### Filter for Face Detected Frames

```bash
openclaw facial-motion --consent --no-preview | grep '"faceDetected":true'
```

## Architecture

### Modules

- `capture.ts` - Webcam capture with stable FPS
- `tracking.ts` - Face detection and landmark tracking
- `features.ts` - Motion feature extraction (EAR, MAR, head pose)
- `entropy.ts` - Cyclical metrics and entropy proxies
- `prediction.ts` - Short-horizon prediction (Kalman, EMA, AR)
- `streaming/` - NDJSON and WebSocket streaming
- `pipeline.ts` - Main orchestration

### Data Flow

```
Webcam → Capture → Face Detection → Feature Extraction → Prediction
                         ↓                    ↓              ↓
                   Landmark Tracking    Cyclical Metrics    ↓
                                             ↓              ↓
                                     Packet Assembly ←──────┘
                                             ↓
                              ┌──────────────┼──────────────┐
                              ↓              ↓              ↓
                          NDJSON      WebSocket        Preview
```

## Limitations

### Current Implementation

- **Browser Requirement**: Full functionality requires MediaDevices API (browser environment)
- **Node.js CLI**: Demonstrates architecture but webcam capture requires additional integration
- **Stub Tracker**: Default uses synthetic landmarks for demonstration; integrate TensorFlow.js or face-api.js for real detection

### Performance

- Target FPS may not be achievable on low-power devices
- Face detection adds computational overhead
- Preview window adds rendering overhead

### Accuracy

- Head pose is an approximation, not full 3D pose estimation
- Entropy metrics are proxies, not precise measures
- Predictions are short-horizon only (next frame)

## Security Considerations

- Always obtain explicit consent before capturing video
- Be aware of applicable privacy laws (GDPR, CCPA, BIPA, etc.)
- Do not use this tool for surveillance or covert monitoring
- Ensure secure transmission if streaming over network
- Consider adding authentication to WebSocket server for production use

## Future Enhancements

- [ ] TensorFlow.js MediaPipe FaceMesh integration
- [ ] face-api.js integration
- [ ] Node.js native webcam support (node-webcam)
- [ ] Advanced prediction models (LSTM, Transformer)
- [ ] Calibration and personalization
- [ ] Multi-face tracking
- [ ] Hardware acceleration (WebGL, WASM SIMD)
- [ ] Configurable entropy window parameters

## Support

For issues, questions, or feature requests, please file an issue on the OpenClaw repository.

## License

MIT License - See LICENSE file for details
