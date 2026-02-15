# Facial Motion Analysis Examples

## Basic Usage

### Display Help and Privacy Notice

```bash
openclaw facial-motion --help
```

### Run with Default Settings

```bash
openclaw facial-motion --consent
```

This will:
- Display the privacy notice
- Start webcam capture at 30 FPS
- Enable NDJSON stdout stream
- Enable preview window
- Use Kalman filter for predictions

### Headless Mode (No Preview)

```bash
openclaw facial-motion --consent --no-preview
```

### Custom FPS and Window Size

```bash
# 60 FPS with 180-frame window (3 seconds at 60fps)
openclaw facial-motion --consent --fps 60 --window-size 180
```

### Enable WebSocket Streaming

```bash
openclaw facial-motion --consent --websocket --websocket-port 8765
```

## Output Examples

### NDJSON Stream to File

```bash
openclaw facial-motion --consent --no-preview > motion-data.ndjson
```

### Filter for Specific Events

```bash
# Only frames where face is detected
openclaw facial-motion --consent --no-preview | grep '"faceDetected":true'

# Extract blink frequency values
openclaw facial-motion --consent --no-preview | jq -r '.cyclical.blinkFrequency'
```

### Real-time Monitoring with jq

```bash
openclaw facial-motion --consent --no-preview | jq -c '{
  frame: .frameNumber,
  face: .faceDetected,
  blinks: .cyclical.blinkFrequency,
  entropy: .cyclical.spectralEntropy
}'
```

## WebSocket Client Examples

### JavaScript/Node.js

```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8765');

ws.on('open', () => {
  console.log('Connected to facial motion stream');
});

ws.on('message', (data) => {
  const packet = JSON.parse(data);
  
  if (packet.faceDetected && packet.features) {
    console.log('Frame:', packet.frameNumber);
    console.log('Eye Aspect Ratio:', 
      (packet.features.leftEyeAspectRatio + packet.features.rightEyeAspectRatio) / 2
    );
    console.log('Mouth Aspect Ratio:', packet.features.mouthAspectRatio);
    
    if (packet.cyclical) {
      console.log('Blink Frequency (bpm):', packet.cyclical.blinkFrequency);
      console.log('Spectral Entropy:', packet.cyclical.spectralEntropy);
    }
  }
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

### Python

```python
import json
import websocket

def on_message(ws, message):
    packet = json.loads(message)
    
    if packet['faceDetected'] and packet['features']:
        print(f"Frame: {packet['frameNumber']}")
        
        features = packet['features']
        avg_ear = (features['leftEyeAspectRatio'] + features['rightEyeAspectRatio']) / 2
        print(f"Eye Aspect Ratio: {avg_ear:.3f}")
        print(f"Mouth Aspect Ratio: {features['mouthAspectRatio']:.3f}")
        
        if packet['cyclical']:
            print(f"Blink Frequency: {packet['cyclical']['blinkFrequency']:.1f} bpm")

def on_error(ws, error):
    print(f"Error: {error}")

def on_close(ws, close_status_code, close_msg):
    print("Connection closed")

ws = websocket.WebSocketApp("ws://localhost:8765",
                           on_message=on_message,
                           on_error=on_error,
                           on_close=on_close)

ws.run_forever()
```

## Analysis Examples

### Blink Rate Analysis

```bash
# Collect 1 minute of data and analyze blink rate
openclaw facial-motion --consent --no-preview | \
  head -n 1800 | \
  jq -r 'select(.cyclical != null) | .cyclical.blinkFrequency' | \
  awk '{sum+=$1; count++} END {print "Average blink rate:", sum/count, "bpm"}'
```

### Entropy Trend Detection

```python
# entropy_monitor.py
import sys
import json

entropy_window = []
window_size = 30

for line in sys.stdin:
    try:
        packet = json.loads(line)
        if packet.get('cyclical'):
            entropy = packet['cyclical']['spectralEntropy']
            entropy_window.append(entropy)
            
            if len(entropy_window) > window_size:
                entropy_window.pop(0)
            
            avg_entropy = sum(entropy_window) / len(entropy_window)
            
            # Detect significant change
            if abs(entropy - avg_entropy) > 0.2:
                print(f"Entropy spike detected at frame {packet['frameNumber']}: {entropy:.3f}")
    except json.JSONDecodeError:
        continue
```

```bash
openclaw facial-motion --consent --no-preview | python entropy_monitor.py
```

## Advanced Configuration

### Multiple Prediction Methods

```bash
# Use EMA predictor
openclaw facial-motion --consent --prediction-method ema

# Use AR predictor
openclaw facial-motion --consent --prediction-method ar
```

### Large Window for Long-term Patterns

```bash
# 300 frames = 10 seconds at 30fps
openclaw facial-motion --consent --window-size 300
```

## Integration with Other Tools

### Stream to InfluxDB

```bash
# Stream to InfluxDB for time-series analysis
openclaw facial-motion --consent --no-preview | \
  jq -c 'select(.features != null) | {
    measurement: "facial_motion",
    time: .timestamp,
    fields: {
      ear: ((.features.leftEyeAspectRatio + .features.rightEyeAspectRatio) / 2),
      mar: .features.mouthAspectRatio,
      blink_freq: .cyclical.blinkFrequency
    }
  }' | \
  influx write --bucket motion-data
```

### Real-time Dashboard (with websocketd)

```bash
# Serve WebSocket stream via websocketd for browser dashboard
openclaw facial-motion --consent --no-preview | \
  websocketd --port=8080 cat
```

## Privacy Reminders

- Always obtain explicit consent before capturing video
- Use `--consent` flag to acknowledge privacy notice
- All processing is local - no data sent externally
- No identity recognition performed
- Stop capture with Ctrl+C

## Troubleshooting

### No Webcam Access

If running in Node.js CLI mode, you'll see:
```
⚠️  NOTE: This feature requires a browser environment with MediaDevices API
```

Solution: Integrate the module into a browser-based application or use a Node.js webcam library.

### WebSocket Connection Refused

Make sure the WebSocket server is enabled:
```bash
openclaw facial-motion --consent --websocket --websocket-port 8765
```

### High CPU Usage

Reduce FPS or disable preview:
```bash
openclaw facial-motion --consent --fps 15 --no-preview
```
