/**
 * Rollback Netcode — Authoritative Server Implementation
 * 
 * Fixed tick loop at 20Hz
 * Buffers inputs per player, applies in seq order
 * Emits snapshots with acks and state hash
 */

import {
  InputCmd,
  GameState,
  Snapshot,
  TickConfig,
  DEFAULT_TICK_CONFIG,
  quantize,
  hashState,
  EntityState,
} from './protocol';

/**
 * AuthoritativeServer: single source of truth
 */
export class AuthoritativeServer {
  private config: TickConfig;
  private currentTick = 0;
  private gameState: GameState = {
    tick: 0,
    entities: {},
    events: [],
  };

  // Per-player input buffers and acks
  private inputBuffers: Record<string, InputCmd[]> = {};
  private lastProcessedSeq: Record<string, number> = {};

  // Tick loop
  private tickIntervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  // Snapshot emission
  private snapshotHandlers: ((snapshot: Snapshot) => void)[] = [];

  // Physics constants (must match client exactly)
  private physicsConstants = {
    friction: 0.95,
    maxSpeed: 5.0,
    acceleration: 0.3,
  };

  constructor(config: TickConfig = DEFAULT_TICK_CONFIG) {
    this.config = config;
  }

  /**
   * Register a handler to receive snapshots (e.g., to broadcast to clients)
   */
  onSnapshot(handler: (snapshot: Snapshot) => void): void {
    this.snapshotHandlers.push(handler);
  }

  /**
   * Start the authoritative tick loop
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    this.tickIntervalId = setInterval(() => {
      this.tick();
    }, this.config.tickDtMs);
  }

  /**
   * Stop the tick loop
   */
  stop(): void {
    if (this.tickIntervalId) {
      clearInterval(this.tickIntervalId);
      this.tickIntervalId = null;
    }
    this.isRunning = false;
  }

  /**
   * Add input from a client (may arrive out of order; we queue)
   */
  enqueueInput(input: InputCmd): void {
    const playerId = input.playerId;
    if (!this.inputBuffers[playerId]) {
      this.inputBuffers[playerId] = [];
    }
    // Only buffer if we haven't processed it yet
    if (input.seq > (this.lastProcessedSeq[playerId] || 0)) {
      this.inputBuffers[playerId].push(input);
      // Sort by seq to handle out-of-order arrivals
      this.inputBuffers[playerId].sort((a, b) => a.seq - b.seq);
    }
  }

  /**
   * Core tick: apply all pending inputs, update state, emit snapshot
   */
  private tick(): void {
    this.currentTick++;

    // Process inputs in strict seq order per player
    for (const playerId in this.inputBuffers) {
      const buffer = this.inputBuffers[playerId];
      const lastSeq = this.lastProcessedSeq[playerId] || 0;

      // Remove and apply
      let i = 0;
      while (i < buffer.length) {
        const input = buffer[i];
        if (input.seq === lastSeq + 1) {
          this.applyInput(this.gameState, input);
          this.lastProcessedSeq[playerId] = input.seq;
          buffer.splice(i, 1);
        } else if (input.seq <= lastSeq) {
          // Duplicate, discard
          buffer.splice(i, 1);
        } else {
          // Gap, wait for earlier inputs
          i++;
        }
      }
    }

    // Emit snapshot with ack
    const snapshot: Snapshot = {
      tick: this.currentTick,
      lastProcessedSeq: { ...this.lastProcessedSeq },
      state: JSON.parse(JSON.stringify(this.gameState)),
      hash: hashState(this.gameState),
    };

    // Broadcast to all handlers
    for (const handler of this.snapshotHandlers) {
      handler(snapshot);
    }

    // Update game state tick counter
    this.gameState.tick = this.currentTick;
  }

  /**
   * Apply input deterministically (must match client applyInput)
   */
  private applyInput(state: GameState, input: InputCmd): void {
    // Ensure entity exists
    if (!state.entities[input.playerId]) {
      state.entities[input.playerId] = {
        id: input.playerId,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        rotation: 0,
        animFrame: 0,
      };
    }

    const entity = state.entities[input.playerId];

    // Apply movement (same as client)
    const accel = this.physicsConstants.acceleration;
    entity.vx = quantize(entity.vx + input.moveX * accel);
    entity.vy = quantize(entity.vy + input.moveY * accel);

    // Clamp speed
    const speed = Math.hypot(entity.vx, entity.vy);
    if (speed > this.physicsConstants.maxSpeed) {
      const scale = this.physicsConstants.maxSpeed / speed;
      entity.vx = quantize(entity.vx * scale);
      entity.vy = quantize(entity.vy * scale);
    }

    // Apply friction
    entity.vx = quantize(entity.vx * this.physicsConstants.friction);
    entity.vy = quantize(entity.vy * this.physicsConstants.friction);

    // Update position
    entity.x = quantize(entity.x + entity.vx);
    entity.y = quantize(entity.y + entity.vy);

    // Update rotation
    if (entity.vx !== 0 || entity.vy !== 0) {
      entity.rotation = Math.atan2(entity.vy, entity.vx);
    }
  }

  /**
   * Get current game state (mainly for diagnostics)
   */
  getState(): GameState {
    return JSON.parse(JSON.stringify(this.gameState));
  }

  /**
   * Get pending inputs per player
   */
  getPendingInputCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const playerId in this.inputBuffers) {
      counts[playerId] = this.inputBuffers[playerId].length;
    }
    return counts;
  }

  /**
   * Reset server state
   */
  reset(): void {
    this.stop();
    this.currentTick = 0;
    this.gameState = {
      tick: 0,
      entities: {},
      events: [],
    };
    this.inputBuffers = {};
    this.lastProcessedSeq = {};
  }

  /**
   * Register a new player (initialize entity)
   */
  registerPlayer(playerId: string): void {
    if (!this.gameState.entities[playerId]) {
      this.gameState.entities[playerId] = {
        id: playerId,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        rotation: 0,
        animFrame: 0,
      };
    }
    this.lastProcessedSeq[playerId] = 0;
  }

  getCurrentTick(): number {
    return this.currentTick;
  }

  isServerRunning(): boolean {
    return this.isRunning;
  }
}
