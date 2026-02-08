/**
 * Webcam capture with stable FPS and timestamps
 * Privacy-preserving: captures frames for real-time analysis only, no storage
 */

export interface CaptureFrame {
  /** Frame data as ImageData or tensor-compatible format */
  data: ImageData | HTMLVideoElement | HTMLCanvasElement;
  /** Frame timestamp (high-resolution) */
  timestamp: number;
  /** Frame number since capture started */
  frameNumber: number;
  /** Actual FPS (measured) */
  measuredFps: number;
}

export interface CaptureStats {
  totalFrames: number;
  droppedFrames: number;
  averageFps: number;
  captureStartTime: number;
}

export class WebcamCapture {
  private targetFps: number;
  private deviceId?: string;
  private frameNumber: number = 0;
  private startTime: number = 0;
  private lastFrameTime: number = 0;
  private fpsHistory: number[] = [];
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;
  private stream: MediaStream | null = null;

  constructor(targetFps: number, deviceId?: string) {
    this.targetFps = targetFps;
    this.deviceId = deviceId;
  }

  async initialize(): Promise<void> {
    // Check if we're in a browser environment
    if (typeof window === "undefined" || !navigator.mediaDevices) {
      throw new Error(
        "Webcam capture requires a browser environment with MediaDevices API. " +
          "For Node.js environments, consider using node-webcam or similar library.",
      );
    }

    const constraints: MediaStreamConstraints = {
      video: this.deviceId
        ? { deviceId: { exact: this.deviceId } }
        : {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: this.targetFps },
          },
      audio: false, // NO audio capture - privacy preserving
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Create video element
      this.videoElement = document.createElement("video");
      this.videoElement.srcObject = this.stream;
      this.videoElement.autoplay = true;
      this.videoElement.playsInline = true;

      // Create canvas for frame extraction
      this.canvasElement = document.createElement("canvas");
      this.ctx = this.canvasElement.getContext("2d", {
        willReadFrequently: true,
      });

      if (!this.ctx) {
        throw new Error("Failed to create canvas context");
      }

      // Wait for video to be ready
      await new Promise<void>((resolve, reject) => {
        if (!this.videoElement) {
          reject(new Error("Video element not initialized"));
          return;
        }
        this.videoElement.addEventListener("loadedmetadata", () => {
          if (this.videoElement && this.canvasElement) {
            this.canvasElement.width = this.videoElement.videoWidth;
            this.canvasElement.height = this.videoElement.videoHeight;
          }
          resolve();
        });
        this.videoElement.addEventListener("error", () =>
          reject(new Error("Failed to load video stream")),
        );
      });

      this.startTime = performance.now();
      this.lastFrameTime = this.startTime;
    } catch (error) {
      throw new Error(
        `Failed to initialize webcam: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  }

  startCapture(onFrame: (frame: CaptureFrame) => void): void {
    if (!this.videoElement || !this.canvasElement || !this.ctx) {
      throw new Error("Capture not initialized. Call initialize() first.");
    }

    const targetFrameTime = 1000 / this.targetFps;
    let lastCaptureTime = performance.now();

    const captureLoop = () => {
      const now = performance.now();
      const elapsed = now - lastCaptureTime;

      // Maintain target FPS
      if (elapsed >= targetFrameTime) {
        if (this.videoElement && this.canvasElement && this.ctx) {
          // Draw current video frame to canvas
          this.ctx.drawImage(this.videoElement, 0, 0);

          // Get image data (privacy: no storage, immediate processing only)
          const imageData = this.ctx.getImageData(
            0,
            0,
            this.canvasElement.width,
            this.canvasElement.height,
          );

          // Calculate FPS
          const fps = elapsed > 0 ? 1000 / elapsed : 0;
          this.fpsHistory.push(fps);
          if (this.fpsHistory.length > 30) {
            this.fpsHistory.shift();
          }
          const measuredFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;

          const frame: CaptureFrame = {
            data: imageData,
            timestamp: now,
            frameNumber: this.frameNumber++,
            measuredFps,
          };

          onFrame(frame);
          lastCaptureTime = now;
        }
      }

      this.animationFrameId = requestAnimationFrame(captureLoop);
    };

    captureLoop();
  }

  stopCapture(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  async cleanup(): Promise<void> {
    this.stopCapture();

    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop(); // Stop webcam access
      });
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    this.canvasElement = null;
    this.ctx = null;
  }

  getStats(): CaptureStats {
    const averageFps = this.fpsHistory.length
      ? this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
      : 0;

    return {
      totalFrames: this.frameNumber,
      droppedFrames: 0, // TODO: implement dropped frame detection
      averageFps,
      captureStartTime: this.startTime,
    };
  }

  static async listDevices(): Promise<Array<{ deviceId: string; label: string }>> {
    if (typeof window === "undefined" || !navigator.mediaDevices) {
      return [];
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter((device) => device.kind === "videoinput")
      .map((device) => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
      }));
  }
}
