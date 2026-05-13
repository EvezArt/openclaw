/**
 * Rollback Netcode Test Page
 * 
 * Interactive demo: local server + client, WS sync, live metrics
 * Use WASD to move, click chaos buttons to simulate jitter/packet loss
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { RollbackClient } from '@/src/netcode/rollback-client';
import { AuthoritativeServer } from '@/src/netcode/game-server';
import {
  InputCmd,
  Snapshot,
  TickConfig,
  DEFAULT_TICK_CONFIG,
} from '@/src/netcode/protocol';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

interface ClientState {
  client: RollbackClient;
  wsOpen: boolean;
  paused: boolean;
}

interface ChaosParams {
  jitterMs: number;
  packetLossRate: number; // 0..1
  snapshotDelay: number; // ticks
}

export default function RollbackNetcodeTest() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<ClientState | null>(null);
  const [chaos, setChaos] = useState<ChaosParams>({
    jitterMs: 0,
    packetLossRate: 0,
    snapshotDelay: 0,
  });
  const [metrics, setMetrics] = useState({
    fps: 0,
    rollbacks: 0,
    maxRewind: 0,
    bufferSize: 0,
    snapshotDelayMs: 0,
    avgDivergence: 0,
  });

  const keysDown = useRef<Record<string, boolean>>({});
  const serverRef = useRef<AuthoritativeServer | null>(null);
  const frameCountRef = useRef(0);
  const fpsRef = useRef(0);
  const lastFpsUpdateRef = useRef(Date.now());

  /**
   * Initialize game (server + client)
   */
  useEffect(() => {
    const server = new AuthoritativeServer(DEFAULT_TICK_CONFIG);
    const playerId = 'player-0';
    server.registerPlayer(playerId);

    const client = new RollbackClient(playerId, DEFAULT_TICK_CONFIG);

    // Server → Client: broadcast snapshots (with simulated jitter/loss)
    server.onSnapshot((snapshot: Snapshot) => {
      // Simulate packet loss
      if (Math.random() < chaos.packetLossRate) {
        return;
      }

      // Simulate jitter
      const delayMs = Math.random() * chaos.jitterMs;
      const snapDelay = chaos.snapshotDelay;

      setTimeout(() => {
        client.onSnapshot(snapshot);
      }, delayMs + snapDelay * DEFAULT_TICK_CONFIG.tickDtMs);
    });

    server.start();
    serverRef.current = server;

    const clientState: ClientState = {
      client,
      wsOpen: true,
      paused: false,
    };
    setGameState(clientState);

    // Cleanup on unmount
    return () => {
      server.stop();
    };
  }, [chaos]);

  /**
   * Handle keyboard input
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysDown.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  /**
   * Main render + physics loop
   */
  useEffect(() => {
    if (!gameState || !canvasRef.current || !serverRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const server = serverRef.current;
    const client = gameState.client;

    let animId = 0;

    const gameLoop = () => {
      // Create input from keyboard
      const input: InputCmd = {
        playerId: 'player-0',
        seq: 0, // set by RollbackClient.step()
        tick: server.getCurrentTick(),
        dtMs: DEFAULT_TICK_CONFIG.tickDtMs,
        moveX: 0,
        moveY: 0,
        buttons: 0,
      };

      if (keysDown.current['w']) input.moveY -= 1;
      if (keysDown.current['s']) input.moveY += 1;
      if (keysDown.current['a']) input.moveX -= 1;
      if (keysDown.current['d']) input.moveX += 1;

      // Clamp
      const m = Math.hypot(input.moveX, input.moveY);
      if (m > 1) {
        input.moveX /= m;
        input.moveY /= m;
      }

      // Client prediction step
      client.step(input, (predictedState) => {
        // Server applies input
        server.enqueueInput(input);

        // Render
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw player
        const state = client.getState();
        if (state.entities['player-0']) {
          const entity = state.entities['player-0'];
          ctx.fillStyle = '#0f0';
          ctx.beginPath();
          ctx.arc(entity.x * 50 + CANVAS_WIDTH / 2, entity.y * 50 + CANVAS_HEIGHT / 2, 10, 0, Math.PI * 2);
          ctx.fill();

          // Draw velocity vector
          ctx.strokeStyle = '#0f0';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(entity.x * 50 + CANVAS_WIDTH / 2, entity.y * 50 + CANVAS_HEIGHT / 2);
          ctx.lineTo(
            entity.x * 50 + CANVAS_WIDTH / 2 + entity.vx * 50,
            entity.y * 50 + CANVAS_HEIGHT / 2 + entity.vy * 50
          );
          ctx.stroke();
        }

        // Draw grid
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        for (let x = 0; x < CANVAS_WIDTH; x += 50) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, CANVAS_HEIGHT);
          ctx.stroke();
        }
        for (let y = 0; y < CANVAS_HEIGHT; y += 50) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(CANVAS_WIDTH, y);
          ctx.stroke();
        }

        // Update metrics
        const m = client.getMetrics();
        frameCountRef.current++;
        const now = Date.now();
        if (now - lastFpsUpdateRef.current >= 1000) {
          fpsRef.current = frameCountRef.current;
          frameCountRef.current = 0;
          lastFpsUpdateRef.current = now;
        }

        setMetrics({
          fps: fpsRef.current,
          rollbacks: m.rollbackCount,
          maxRewind: m.maxRewindDepth,
          bufferSize: m.bufferSize,
          snapshotDelayMs: m.snapshotDelayMs,
          avgDivergence: m.avgDivergence,
        });
      });

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [gameState]);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', background: '#000', color: '#0f0' }}>
      <h1>🎮 Rollback Netcode Test</h1>
      <p>Use <strong>WASD</strong> to move. Adjust chaos knobs below.</p>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{ border: '2px solid #0f0', display: 'block', margin: '10px 0' }}
      />

      <div style={{ marginTop: '20px', padding: '10px', background: '#1a1a1a', border: '1px solid #0f0' }}>
        <h3>📊 Metrics</h3>
        <div>FPS: {metrics.fps}</div>
        <div>Rollbacks: {metrics.rollbacks}</div>
        <div>Max Rewind: {metrics.maxRewind} ticks</div>
        <div>Buffer Size: {metrics.bufferSize}</div>
        <div>Snapshot Delay: {metrics.snapshotDelayMs.toFixed(0)}ms</div>
        <div>Avg Divergence: {metrics.avgDivergence.toFixed(3)}</div>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', background: '#1a1a1a', border: '1px solid #f00' }}>
        <h3>⚡ Σf (Failure Surface) — Chaos Controls</h3>

        <label style={{ display: 'block', marginTop: '10px' }}>
          Jitter: {chaos.jitterMs}ms
          <input
            type="range"
            min="0"
            max="200"
            value={chaos.jitterMs}
            onChange={(e) =>
              setChaos({ ...chaos, jitterMs: parseInt(e.target.value) })
            }
            style={{ marginLeft: '10px', width: '200px' }}
          />
        </label>

        <label style={{ display: 'block', marginTop: '10px' }}>
          Packet Loss: {(chaos.packetLossRate * 100).toFixed(0)}%
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={chaos.packetLossRate}
            onChange={(e) =>
              setChaos({ ...chaos, packetLossRate: parseFloat(e.target.value) })
            }
            style={{ marginLeft: '10px', width: '200px' }}
          />
        </label>

        <label style={{ display: 'block', marginTop: '10px' }}>
          Snapshot Delay: {chaos.snapshotDelay} ticks
          <input
            type="range"
            min="0"
            max="20"
            value={chaos.snapshotDelay}
            onChange={(e) =>
              setChaos({ ...chaos, snapshotDelay: parseInt(e.target.value) })
            }
            style={{ marginLeft: '10px', width: '200px' }}
          />
        </label>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', background: '#1a2a1a', border: '1px solid #0f0' }}>
        <h3>🔒 Ω Invariant (Preservation Set)</h3>
        <ul>
          <li>✓ Immutable INPUT seq (strictly increasing)</li>
          <li>✓ Authoritative SNAPSHOT acks</li>
          <li>✓ Deterministic REPLAY (quantized physics)</li>
          <li>✓ Bounded BUFFERS (prevents memory blowup)</li>
        </ul>
      </div>
    </div>
  );
}
