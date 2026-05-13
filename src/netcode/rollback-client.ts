/**
 * Rollback Netcode — Client Implementation
 * 
 * Prediction buffer + rollback + resim = max smoothness on mobile
 * Client renders instantly using prediction; server sends snapshots.
 * On mismatch: rollback + replay buffered inputs.
 */

import {
  InputCmd,
  GameState,
  Snapshot,
  TickConfig,
  DEFAULT_TICK_CONFIG,
  quantize,
  hashState,
} from './protocol.js';

/**
 * Circular ring buffer for frame history (input + state)
 */
class HistoryRing<T> {
  private buffer: (T | null)[] = [];
  private head = 0;
  private size = 0;

  constructor(private capacity: number) {
    this.buffer = new Array(capacity).fill(null);
  }

  push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    if (this.size < this.capacity) this.size++;
  }

  get(index: number): T | null {
    if (index < 0 || index >= this.size) return null;
    const pos = (this.head - this.size + index) % this.capacity;
    return this.buffer[pos];
  }

  getLatest(): T | null {
    if (this.size === 0) return null;
    const pos = (this.head - 1 + this.capacity) % this.capacity;
    return this.buffer[pos];
  }

  clear(): void {
    this.buffer.fill(null);
    this.head = 0;
    this.size = 0;
  }

  getSize(): number {
    return this.size;
  }
}

/**
 * RollbackClient: prediction + rollback
 */
export class RollbackClient {
  private config: TickConfig;
  private playerId: string;
  private currentTick = 0;
  private lastAckedSeq = 0;

  // Ring buffers for history
  private inputHistory: HistoryRing<InputCmd>;
  private stateHistory: HistoryRing<GameState>;

  // Predicted state (volatile, updated each frame before snapshot arrives)
  private predictedState: GameState = {
    tick: 0,
    entities: {},
    events: [],
  };

  // Authoritative state (from server snapshots)
  private authState: GameState = {
    tick: 0,
    entities: {},
    events: [],
  };

  // Metrics
  private metrics = {
    rollbackCount: 0,
    maxRewindDepth: 0,
    divergenceSum: 0,
    frameCount: 0,
    jitterMs: 0,
    snapshotDelayMs: 0,
  };

  // Physics constants (must match server exactly for determinism)
  private physicsConstants = {
    friction: 0.95,
    maxSpeed: 5.0,
    acceleration: 0.3,
  };

  constructor(
    playerId: string,
    config: TickConfig = DEFAULT_TICK_CONFIG
  ) {
    this.playerId = playerId;
    this.config = config;
    this.inputHistory = new HistoryRing(config.maxHistoryTicks);
    this.stateHistory = new HistoryRing(config.maxHistoryTicks);
  }

  /**
   * Apply input deterministically (must match server)
   */
  private applyInput(state: GameState, input: InputCmd): GameState {
    const nextState = JSON.parse(JSON.stringify(state)) as GameState;
    nextState.tick = input.tick;

    // Find or create player entity
    if (!nextState.entities[input.playerId]) {
      nextState.entities[input.playerId] = {
        id: input.playerId,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        rotation: 0,
        animFrame: 0,
      };
    }

    const entity = nextState.entities[input.playerId];

    // Apply movement (same as server)
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

    return nextState;
  }

  /**
   * Main game loop: predict locally, buffer input, track metrics
   */
  step(input: InputCmd, renderCallback: (state: GameState) => void): void {
    this.currentTick++;
    this.metrics.frameCount++;

    // Store input
    input.seq = this.lastAckedSeq + this.inputHistory.getSize() + 1;
    this.inputHistory.push(input);

    // Predict: apply latest input to predicted state
    this.predictedState = this.applyInput(this.predictedState, input);
    this.stateHistory.push(JSON.parse(JSON.stringify(this.predictedState)));

    // Render predicted state immediately (smooth client-side)
    renderCallback(this.predictedState);
  }

  /**
   * Receive authoritative snapshot from server
   * On divergence: rollback + resim
   */
  onSnapshot(snapshot: Snapshot): void {
    const ticksSinceAck = this.currentTick - snapshot.tick;
    this.metrics.snapshotDelayMs = ticksSinceAck * this.config.tickDtMs;

    // Check if we've diverged
    const authHash = snapshot.hash || hashState(snapshot.state);
    const predictedHash = hashState(this.predictedState);

    if (authHash !== predictedHash) {
      this.metrics.rollbackCount++;
      this.metrics.maxRewindDepth = Math.max(
        this.metrics.maxRewindDepth,
        ticksSinceAck
      );

      // Rollback to snapshot tick
      this.authState = JSON.parse(JSON.stringify(snapshot.state));
      this.lastAckedSeq = snapshot.lastProcessedSeq[this.playerId] || 0;

      // Resim all unbuffered inputs
      let resimState = JSON.parse(
        JSON.stringify(this.authState)
      ) as GameState;
      for (let i = 0; i < this.inputHistory.getSize(); i++) {
        const bufferedInput = this.inputHistory.get(i);
        if (bufferedInput && bufferedInput.seq > this.lastAckedSeq) {
          resimState = this.applyInput(resimState, bufferedInput);
        }
      }
      this.predictedState = resimState;

      // Track divergence
      const divergence = this.calcDivergence(snapshot.state, this.predictedState);
      this.metrics.divergenceSum += divergence;
    }
  }

  /**
   * Calculate divergence norm between two states
   */
  private calcDivergence(state1: GameState, state2: GameState): number {
    let sum = 0;
    for (const id in state1.entities) {
      const e1 = state1.entities[id];
      const e2 = state2.entities[id];
      if (e1 && e2) {
        sum += Math.hypot(e1.x - e2.x, e1.y - e2.y);
      }
    }
    return sum;
  }

  /**
   * Serialize pending inputs to send to server
   */
  getPendingInputs(): InputCmd[] {
    const pending: InputCmd[] = [];
    for (let i = 0; i < this.inputHistory.getSize(); i++) {
      const input = this.inputHistory.get(i);
      if (input && input.seq > this.lastAckedSeq) {
        pending.push(input);
      }
    }
    return pending;
  }

  /**
   * Get metrics for FSC visualization
   */
  getMetrics() {
    return {
      rollbackCount: this.metrics.rollbackCount,
      maxRewindDepth: this.metrics.maxRewindDepth,
      avgDivergence:
        this.metrics.frameCount > 0
          ? this.metrics.divergenceSum / this.metrics.frameCount
          : 0,
      snapshotDelayMs: this.metrics.snapshotDelayMs,
      bufferSize: this.inputHistory.getSize(),
      currentTick: this.currentTick,
      predictedState: this.predictedState,
    };
  }

  /**
   * Reset client state
   */
  reset(): void {
    this.currentTick = 0;
    this.lastAckedSeq = 0;
    this.inputHistory.clear();
    this.stateHistory.clear();
    this.predictedState = {
      tick: 0,
      entities: {},
      events: [],
    };
    this.authState = {
      tick: 0,
      entities: {},
      events: [],
    };
    this.metrics = {
      rollbackCount: 0,
      maxRewindDepth: 0,
      divergenceSum: 0,
      frameCount: 0,
      jitterMs: 0,
      snapshotDelayMs: 0,
    };
  }

  getState(): GameState {
    return this.predictedState;
  }

  setPlayerId(id: string): void {
    this.playerId = id;
  }
}
