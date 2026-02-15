/**
 * NDJSON streaming to stdout
 * Line-delimited JSON format for easy parsing and piping
 */

import type { FacialMotionPacket } from "../types.js";

export class NdjsonStreamer {
  private enabled: boolean;
  private packetCount: number = 0;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  /**
   * Write packet to stdout as NDJSON
   */
  write(packet: FacialMotionPacket): void {
    if (!this.enabled) {
      return;
    }

    try {
      const json = JSON.stringify(packet);
      console.log(json); // stdout
      this.packetCount++;
    } catch (error) {
      // Don't write error to stdout (would corrupt NDJSON stream)
      // Log to stderr instead
      console.error(
        `NDJSON serialization error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get statistics
   */
  getStats(): { packetCount: number } {
    return { packetCount: this.packetCount };
  }

  /**
   * Reset statistics
   */
  reset(): void {
    this.packetCount = 0;
  }

  /**
   * Enable/disable streaming
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}
