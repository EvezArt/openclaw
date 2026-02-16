/**
 * WebSocket server for streaming facial motion data
 * Publishes packets to all connected clients
 */

import { WebSocketServer, WebSocket } from "ws";
import type { FacialMotionPacket } from "../types.js";

export class MotionWebSocketServer {
  private wss: WebSocketServer | null = null;
  private port: number;
  private clients: Set<WebSocket> = new Set();
  private packetCount: number = 0;

  constructor(port: number) {
    this.port = port;
  }

  /**
   * Start WebSocket server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocketServer({ port: this.port });

        this.wss.on("listening", () => {
          console.error(`WebSocket server listening on port ${this.port}`); // stderr to not pollute stdout
          resolve();
        });

        this.wss.on("connection", (ws: WebSocket) => {
          this.clients.add(ws);
          console.error(`WebSocket client connected (${this.clients.size} total)`);

          ws.on("close", () => {
            this.clients.delete(ws);
            console.error(`WebSocket client disconnected (${this.clients.size} remaining)`);
          });

          ws.on("error", (error) => {
            console.error(`WebSocket client error: ${error.message}`);
            this.clients.delete(ws);
          });
        });

        this.wss.on("error", (error) => {
          console.error(`WebSocket server error: ${error.message}`);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Broadcast packet to all connected clients
   */
  broadcast(packet: FacialMotionPacket): void {
    if (!this.wss || this.clients.size === 0) {
      return;
    }

    try {
      const json = JSON.stringify(packet);
      this.packetCount++;

      for (const client of this.clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(json);
        }
      }
    } catch (error) {
      console.error(
        `WebSocket broadcast error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Stop WebSocket server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.wss) {
        resolve();
        return;
      }

      // Close all client connections
      for (const client of this.clients) {
        client.close();
      }
      this.clients.clear();

      // Close server
      this.wss.close(() => {
        console.error("WebSocket server stopped");
        this.wss = null;
        resolve();
      });
    });
  }

  /**
   * Get statistics
   */
  getStats(): { connectedClients: number; packetCount: number } {
    return {
      connectedClients: this.clients.size,
      packetCount: this.packetCount,
    };
  }
}
