# Rollback Netcode Implementation

**Date:** 2026-02-17  
**Status:** Complete drop-in stack (protocol + server + client + test UI)  
**Maturity:** Reference implementation; phone-ready

---

## TL;DR

Rollback netcode = **prediction buffer + rollback + resim = max smoothness on mobile**.

- Client renders **instantly** using prediction
- Server computes **truth** and sends snapshots + acks
- Client compares snapshot to predicted past → **rollback if diverged**
- Client then re-simulates buffered inputs after ack

**Ω Invariant:** immutable commands + authoritative snapshots + deterministic replay. Same operator powers games, trading, distributed systems.

---

## Files Generated

```
src/netcode/
  ├─ protocol.ts              # Shared types + quantization + FSC metrics
  ├─ rollback-client.ts       # Prediction buffer + rollback + metrics
  └─ game-server.ts           # Authoritative tick loop + snapshot emit

ui/pages/
  └─ rollback-test.tsx        # Next.js interactive demo (WASD + chaos controls)
```

---

## Protocol (Minimal but Sufficient)

### Client → Server: `InputCmd`

```typescript
type InputCmd = {
  playerId: string;
  seq: number;              // strictly increasing per player
  tick: number;             // client tick (diagnostic)
  dtMs: number;             // time delta (diagnostic)
  moveX: number;            // -1..1
  moveY: number;            // -1..1
  buttons: number;          // bitmask (bit 0 = jump, bit 1 = attack, etc.)
};
```

**Why `seq`?** Client only replays inputs with `seq > lastProcessedSeq` (the ack pivot).

### Server → Client: `Snapshot`

```typescript
type Snapshot = {
  tick: number;                          // authoritative tick
  lastProcessedSeq: Record<string, number>; // ack: last input seq per player
  state: GameState;                      // authoritative state
  hash?: number;                         // optional: state hash for divergence detection
};
```

---

## Determinism Constraints (Ω)

Rollback netcode **lives or dies** by determinism. The **Ω invariant** is:

**Ω = deterministic sim + monotonic input seq + snapshot ack + bounded rewind window**

Concrete requirements:

- ✅ **Fixed tick rate** both sides (20Hz = 50ms per tick, great for mobile)
- ✅ **Identical physics** both sides (no nondeterministic RNG unless seeded identically)
- ✅ **Quantized floats** at consistent precision (1e-3 in the patch)
- ✅ **Strictly increasing `seq`** per player (drop out-of-order duplicates)
- ✅ **Bounded buffers** (prevent memory blowup on backlog)

---

## Rewind Window Math

Let:
- `tickRate` = 20 Hz (50ms per tick)
- `RTTp95` ≈ 200ms (varies; tune to your network)
- `jitter` ≈ 60ms

Safe rewind window:

```
W_ticks = ceil((RTTp95 + 2*jitter) / tickDt) + margin
        = ceil((200 + 120) / 50) + 3
        = 7 + 3
        = 10 ticks (~0.5 sec)
```

In the patch: `maxHistoryTicks = 120` (~6 seconds headroom), so you can safely rewind within ~10 ticks and still have history for debugging.

---

## How It Works (Client)

### 1. Prediction Phase (every frame)

```typescript
const input = { playerId, seq, moveX, moveY, ... };
client.step(input, (state) => {
  render(state); // render immediately, no wait
});
```

Internally:
1. Store input in `inputHistory[]`
2. `applyInput(predictedState, input)` → deterministic update
3. Store updated state in `stateHistory[]`
4. Call render callback with predicted state

**Result:** smooth client-side animation (no jitter from network delay).

### 2. Snapshot Arrives (from server)

```typescript
client.onSnapshot(snapshot);
```

Internally:
1. Compare `snapshot.state` hash to `predictedState` hash
2. **If mismatch:**
   - Rollback: `authState = snapshot.state`
   - `lastAckedSeq = snapshot.lastProcessedSeq[playerId]`
   - Resim: replay all inputs with `seq > lastAckedSeq`
   - Update `predictedState`
3. **If match:**
   - Continue (no visible rubber-banding)

**Metrics tracked:** rollback count, rewind depth, divergence sum.

---

## How It Works (Server)

### 1. Tick Loop (fixed at 20Hz)

```typescript
server.start();
```

Every 50ms:
1. Process all queued inputs **in strictly increasing `seq` order per player**
2. Apply each input to game state deterministically
3. Emit snapshot with `lastProcessedSeq` ack
4. Broadcast snapshot to all clients

### 2. Input Handling (may arrive out-of-order)

```typescript
server.enqueueInput(input);
```

Internally:
1. Queue input if `seq > lastProcessedSeq[playerId]`
2. Sort buffer by seq (handle packet reorder)
3. Apply only when we have `seq === lastProcessedSeq + 1`
4. Drop duplicates automatically

---

## FSC Integration (Failure Surface → Collapse Sequence → Preservation)

### Σf (Failure Surface)

Perturbations that break rollback UX:

- **Jitter spike** → snapshot delay ↑ → rewind depth ↑
- **Packet loss** → ack delay ↑ → buffer bloat
- **Tick drift** (client step ≠ server tick) → determinism fail
- **Nondeterminism** (float drift, RNG, dt coupling) → divergence ↑
- **Backlog storm** → input queue blowup → memory exhaustion

### CS (Collapse Sequence)

What you observe in live play:

1. jitter ↑
2. snapshot delay ↑
3. divergence norm ↑
4. rollback frequency ↑
5. rewind depth ↑
6. **visible rubber-banding / desync** (game over)

### PS (Preservation Set)

Stuff that survives reduction even under chaos:

- ✅ Monotonic input seq (never reorder)
- ✅ Immutable event spine (causality preserved)
- ✅ Explicit pending/final semantics (ack is the truth boundary)
- ✅ Bounded buffers (memory predictable)
- ✅ Deterministic `applyInput` (replay == reality)

### Ω (Invariant Operator)

**Ω = "immutable commands, authoritative snapshots, deterministic replay"**

Same operator powers:
- **Games** (rollback netcode, GGPO)
- **Trading** (input/execution/settlement)
- **Distributed ledgers** (ordered logs, consensus)
- **Agent memory rewrites** (event sourcing)

---

## Test Page (Next.js)

**File:** `ui/pages/rollback-test.tsx`

### Features

- ✅ **WASD to move** (keyboard input)
- ✅ **Local server + client** (no WS latency on init)
- ✅ **Chaos controls** (jitter, packet loss, snapshot delay)
- ✅ **Live metrics** (FPS, rollbacks, rewind depth, buffer size, divergence)
- ✅ **Canvas render** (green player dot + velocity vector)
- ✅ **Grid visualization** (for positional debugging)

### How to Use

1. Navigate to `/rollback-test` in your Next.js app
2. Press WASD to move
3. Drag sliders to inject chaos:
   - **Jitter**: random delay (0–200ms)
   - **Packet Loss**: % of snapshots dropped (0–100%)
   - **Snapshot Delay**: artificial delays in multiples of ticks
4. Watch metrics update in real-time
5. Notice how rollback depth tracks chaos

---

## Determinism Checklist

Before shipping rollback netcode, verify:

- [ ] Same tick rate server + client (20Hz recommended for mobile)
- [ ] Quantize all floats to 1e-3 precision (`quantize()` helper provided)
- [ ] No `Math.random()` in physics (or seed RNG identically on both sides)
- [ ] No floating-point drift (use `+=` carefully; quantize after each op)
- [ ] Input seq strictly increasing (duplicates dropped)
- [ ] Snapshot acks applied before replaying later inputs
- [ ] Ring buffers bounded (no memory leak under backlog)
- [ ] Hash state deterministically (provided: `hashState()`)

---

## Production Tuning

### Tick Rate

- **Mobile:** 20 Hz (50ms) ✅ safe, low power
- **Competitive:** 30 Hz (33ms) or 60 Hz (16ms) if power budget allows

### Rewind Window

Adjust based on measured RTT:

```typescript
// Example: measured RTTp95 = 200ms, jitter = 60ms
const rewindWindow = calcRewindWindow(tickRate, 200, 60, 3);
// Result: 10 ticks
```

Then set `maxHistoryTicks` to ~10–12× rewind window for headroom.

### Snapshot Frequency

- Default: every tick (highest fidelity)
- Optimized: every 2–5 ticks (lower bandwidth, slower feedback)

### Hash Precision

- Remove `hash` from snapshot if bandwidth is critical (rely on divergence detection)
- Keep if you want fast divergence detection

---

## Example: Integration into Your Game

### Server Side

```typescript
import { AuthoritativeServer } from '@/src/netcode/game-server';

const server = new AuthoritativeServer();
server.registerPlayer('player-1');

// Receive input over WS/HTTP
ws.on('input', (input: InputCmd) => {
  server.enqueueInput(input);
});

// Broadcast snapshots over WS
server.onSnapshot((snapshot: Snapshot) => {
  ws.emit('snapshot', snapshot);
});

server.start();
```

### Client Side

```typescript
import { RollbackClient } from '@/src/netcode/rollback-client';

const client = new RollbackClient('player-1');

// Every frame
const input = { playerId: 'player-1', moveX, moveY, buttons, ... };
client.step(input, (state) => {
  render(state);
});

// Send to server
ws.emit('input', client.getPendingInputs());

// Receive snapshot from server
ws.on('snapshot', (snapshot: Snapshot) => {
  client.onSnapshot(snapshot);
});
```

---

## Metrics & Debugging

### Available on Client

```typescript
const metrics = client.getMetrics();
console.log({
  rollbackCount: metrics.rollbackCount,        // how many times we rolled back
  maxRewindDepth: metrics.maxRewindDepth,      // deepest rewind in ticks
  avgDivergence: metrics.avgDivergence,        // avg positional desync
  snapshotDelayMs: metrics.snapshotDelayMs,    // time since last ack
  bufferSize: metrics.bufferSize,              // pending inputs
  predictedState: metrics.predictedState,      // current predicted state
});
```

### What to Watch

- **High rollback count** → prediction mismatch (likely nondeterminism)
- **Deep rewind** → network jitter; increase `maxHistoryTicks`
- **High avgDivergence** → state divergence; check physics constants match
- **Buffer bloat** → server falling behind; reduce input rate or tick rate

---

## Next Steps

1. **Integrate into your game server** (replace physics loop with `server.tick()`)
2. **Sync physics constants** (client `applyInput` ≡ server `applyInput`)
3. **Test with real network** (replace local server with WS/HTTP)
4. **Tune tick rate + rewind window** to your latency profile
5. **Monitor metrics in production** (feed into your observability stack)

---

## References

- **Original GGPO paper:** https://www.gamasutra.com/view/feature/3356/fighting_game_netcode.php
- **Rollback netcode detailed:** https://en.wikipedia.org/wiki/Video_game_online_play#Rollback_netcode
- **Determinism in games:** https://gafferongames.com/

---

**Commit:** Ready to land. No external dependencies beyond TypeScript.
