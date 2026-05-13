/**
 * Rollback Netcode Protocol
 * 
 * Shared types for authoritative server + client prediction/rollback.
 * Ω invariant: immutable commands, authoritative snapshots, deterministic replay
 */

/**
 * Client → Server: Input command (immutable, strictly ordered by seq)
 */
export interface InputCmd {
  playerId: string;
  seq: number; // strictly increasing per player; client replays only seq > lastProcessedSeq
  tick: number; // client tick when generated (diagnostic)
  dtMs: number; // diagnostic only; should be stable (~50ms for 20Hz)
  moveX: number; // -1..1
  moveY: number; // -1..1
  buttons: number; // bitmask (bit 0 = jump, bit 1 = attack, etc.)
}

/**
 * Game entity state (quantized to 1e-3 precision for determinism)
 */
export interface EntityState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  animFrame: number; // for anim sync
}

/**
 * Full game state snapshot (authoritative)
 */
export interface GameState {
  tick: number;
  entities: Record<string, EntityState>;
  events: gameEvent[]; // ordered causally
}

/**
 * Game event (immutable spine)
 */
export interface gameEvent {
  tick: number;
  playerId: string;
  type: string; // 'collision', 'damage', 'spawn', etc.
  data?: Record<string, unknown>;
}

/**
 * Server → Client: Authoritative snapshot + ack
 */
export interface Snapshot {
  tick: number; // authoritative tick
  lastProcessedSeq: Record<string, number>; // ack: last input seq per player
  state: GameState;
  hash?: number; // optional: stable hash of quantized state for divergence detection
}

/**
 * Quantize float to 1e-3 precision (for determinism)
 */
export function quantize(x: number, precision = 1e-3): number {
  return Math.round(x / precision) * precision;
}

/**
 * Simple stable hash for a state object
 */
export function hashState(state: GameState): number {
  let hash = 5381;
  const str = JSON.stringify(state);
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0; // ensure unsigned 32-bit
}

/**
 * Rewind window math
 * - tickRate: Hz (e.g. 20)
 * - RTTp95: ms (e.g. 200)
 * - jitter: ms (e.g. 60)
 * Returns: number of ticks to keep in history
 */
export function calcRewindWindow(
  tickRate: number,
  RTTp95: number,
  jitter: number,
  margin: number = 3
): number {
  const tickDtMs = 1000 / tickRate;
  const safeWindow = Math.ceil((RTTp95 + 2 * jitter) / tickDtMs) + margin;
  return safeWindow;
}

/**
 * Compress InputCmd for wire (remove diagnostic fields)
 */
export function compressInput(cmd: InputCmd): Omit<InputCmd, 'tick' | 'dtMs'> {
  const { tick, dtMs, ...rest } = cmd;
  return rest;
}

/**
 * Track FSC metrics for rollback netcode
 */
export interface RollbackMetrics {
  // Σf (failure surface): perturbations that break UX
  jitterMs: number;
  snapshotDelayMs: number;
  divergenceNorm: number;

  // CS (collapse sequence): visible degradation
  rollbackFrequency: number; // how often per second
  rewindDepthTicks: number; // avg rewind depth
  visibleDesyncFrames: number;

  // PS (preservation set): what survives
  immutableSeqCount: number;
  determineReplaySuccess: number; // % of replays that match
  bufferUtilization: number; // 0..1
}

/**
 * Tick configuration (fixed for determinism)
 */
export interface TickConfig {
  tickRate: number; // Hz (e.g. 20)
  tickDtMs: number; // ms per tick
  maxHistoryTicks: number; // ~120 for 6s headroom
  rewindWindowTicks: number; // ~10 for mobile safety
}

export const DEFAULT_TICK_CONFIG: TickConfig = {
  tickRate: 20, // 50ms per tick
  tickDtMs: 50,
  maxHistoryTicks: 120,
  rewindWindowTicks: 10,
};
