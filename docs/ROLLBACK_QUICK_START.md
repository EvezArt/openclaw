# Rollback Netcode Stack — Quick Start

**Status:** ✅ **All files generated, builds successfully, ready to integrate**

---

## File Manifest

| File | Purpose | Size |
|------|---------|------|
| `src/netcode/protocol.ts` | Shared types, quantization, FSC metrics | 3.6K |
| `src/netcode/rollback-client.ts` | Client-side prediction + rollback + ring buffers | 7.8K |
| `src/netcode/game-server.ts` | Authoritative server, fixed tick loop, snapshots | 6.1K |
| `src/netcode/index.ts` | Barrel export (convenient imports) | 394B |
| `ui/pages/rollback-test.tsx` | Next.js interactive demo (WASD + chaos controls) | 9.0K |
| `docs/rollback-netcode.md` | Full technical guide + tuning reference | 11K |

**Total:** ~37KB TypeScript (drop-in, no external deps beyond stdlib)

---

## Ω Invariant (What Makes It Deterministic)

```
Ω = immutable input seq + authoritative snapshots + deterministic replay
```

Verified in code:
- ✅ `quantize()` ensures float precision (1e-3)
- ✅ `hashState()` detects divergence
- ✅ Ring buffers bounded (no memory leak)
- ✅ `applyInput()` identical on client & server
- ✅ `lastProcessedSeq` ack prevents replay duplication

---

## How to Use (5 minutes)

### 1. **Server Code** (your game loop)

```typescript
import { AuthoritativeServer, InputCmd } from '@/src/netcode';

const server = new AuthoritativeServer();
server.registerPlayer('player-1');

// Wire up WS/HTTP to queue inputs
wsServer.on('input', (input: InputCmd) => {
  server.enqueueInput(input);
});

// Broadcast snapshots to clients
server.onSnapshot((snapshot) => {
  wsServer.yaml.broadcast({ type: 'snapshot', data: snapshot });
});

server.start(); // starts fixed 20Hz tick loop
```

### 2. **Client Code** (your game UI)

```typescript
import { RollbackClient } from '@/src/netcode';

const client = new RollbackClient('player-1');

// Every frame
function gameFrame(moveX, moveY, buttons) {
  client.step(
    { playerId: 'player-1', moveX, moveY, buttons, ... },
    (predictedState) => {
      renderGame(predictedState); // instant, smooth
    }
  );
  
  // Send pending inputs to server
  ws.send({ type: 'inputs', data: client.getPendingInputs() });
}

// Receive snapshots from server
ws.on('snapshot', (snapshot) => {
  client.onSnapshot(snapshot); // handles rollback automatically
});

// Monitor metrics
setInterval(() => {
  const m = client.getMetrics();
  console.log(`Rollbacks: ${m.rollbackCount}, Rewind: ${m.maxRewindDepth} ticks`);
}, 1000);
```

### 3. **Test It** (Next.js page)

Navigate to `/rollback-test` in your dev environment:
- Press **WASD** to move
- Drag sliders to inject chaos (jitter, packet loss, snapshot delay)
- Watch rollback count + rewind depth climb as network gets worse
- Verify mechanics stay smooth

---

## FSC Visibility (Metrics Dashboard)

The client tracks all collapse-sequence signals:

```typescript
const metrics = client.getMetrics();
console.log({
  rollbackCount,         // Σf → CS: how many rollbacks
  maxRewindDepth,        // CS: how deep (in ticks)
  avgDivergence,         // Σf → CS: state mismatch magnitude
  bufferSize,            // PS: buffer utilization
  snapshotDelayMs,       // Σf: network latency
  predictedState,        // actual state for rendering
});
```

Integrate into your observability:
- Feed metrics to Datadog / New Relic / custom dashboard
- Set alerts on `rollbackCount > threshold` or `maxRewindDepth > window`
- Correlate with network RTT / jitter measurements

---

## Tuning Parameters

**For your game, adjust in `protocol.ts` → `DEFAULT_TICK_CONFIG`:**

```typescript
export const DEFAULT_TICK_CONFIG: TickConfig = {
  tickRate: 20,              // Hz (raise for less latency, more CPU)
  tickDtMs: 50,              // ms per tick (1000/tickRate)
  maxHistoryTicks: 120,      // ~6 seconds (adjust for your rewind needs)
  rewindWindowTicks: 10,     // safety margin for RTT spike
};
```

**Calculate rewind window:**

```typescript
import { calcRewindWindow } from '@/src/netcode';

const window = calcRewindWindow(
  20,    // tickRate Hz
  200,   // your measured RTTp95 in ms
  60,    // your measured jitter in ms
  3      // margin
);
// Result: 10 ticks (you can set maxHistoryTicks = 120 safely)
```

---

## Determinism Checklist (Before Shipping)

- [ ] **Physics match:** `server.applyInput()` ≡ `client.applyInput()`
- [ ] **No RNG:** Eliminate `Math.random()` or seed identically
- [ ] **Quantize:** All floats via `quantize(x, 1e-3)`
- [ ] **Fixed tick:** Both sides use same `tickDtMs`
- [ ] **Seq monotonic:** Input seq strictly increases, duplicates dropped
- [ ] **Buffers bounded:** No memory leak under backlog storm
- [ ] **Hash consistent:** `hashState()` deterministic
- [ ] **Test with chaos:** Run at `/rollback-test`, verify metrics under load

---

## Production Integration

### Step 1: Choose Transport
- **WebSocket:** Ideal for real-time; lower latency
  ```tsx
  ws.on('input', (input) => server.enqueueInput(input));
  server.onSnapshot((snap) => ws.send('snapshot', snap));
  ```
- **HTTP polling:** If WebSocket unavailable; higher latency
  ```tsx
  // Every frame, POST inputs; poll for snapshots
  ```

### Step 2: Network Measurements
In your server, log RTT + jitter:
```typescript
// Track delivery time
const start = Date.now();
server.onSnapshot((snapshot) => {
  // Rough estimate: snapshot age ~ client lag
  const delayMs = Date.now() - start;
  observability.metric('snapshot.latency_ms', delayMs);
});
```

### Step 3: Rollback Tuning
If `avgDivergence` or `rollbackCount` spike:
1. Increase `maxHistoryTicks` (more room to rewind)
2. Lower `tickRate` (more time per tick, easier to sync)
3. Check physics constants match exactly
4. Add logging to `applyInput()` to find nondeterminism

### Step 4: Scale
For multi-player:
- Server processes **all** player inputs per tick
- Each client receives **same** snapshot
- Each client rolls back **only itself**, tracks its own metrics
- Authoritative state is on server

---

## Example: Full Minimal Server

```typescript
// index.ts
import express from 'express';
import { WebSocketServer } from 'ws';
import { AuthoritativeServer, InputCmd } from '@/src/netcode';

const app = express();
const wss = new WebSocketServer({ port: 8080 });
const server = new AuthoritativeServer();

const players = new Map<string, WebSocket>();

server.registerPlayer('player-1');
server.registerPlayer('player-2');

server.onSnapshot((snapshot) => {
  // Broadcast to all connected clients
  for (const [playerId, ws] of players) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'snapshot', data: snapshot }));
    }
  }
});

wss.on('connection', (ws) => {
  const playerId = `player-${players.size + 1}`;
  players.set(playerId, ws);
  
  ws.on('message', (msg) => {
    const { type, data } = JSON.parse(msg.toString());
    if (type === 'inputs') {
      data.forEach((input: InputCmd) => {
        server.enqueueInput(input);
      });
    }
  });
  
  ws.on('close', () => {
    players.delete(playerId);
  });
});

server.start();
app.listen(3000);
```

---

## Debugging Tips

### Divergence Always High?
- Check `quantize()` is applied after every float op
- Verify `applyInput()` logic identical on both sides
- Log intermediate values in both client + server

### Rollbacks Spiking?
- Increase `snapshotDelayMs` simulation to see if it's network
- Check `bufferSize` isn't maxing out (input queue overflow)
- Verify server tick loop is stable (not skipping ticks)

### Memory Leak?
- Ring buffers should stay under `maxHistoryTicks`
- If `bufferSize` keeps growing, server is behind (lower input rate)

### Test Page Freezing?
- Reduce `maxHistoryTicks` (slower rewind math)
- Lower `tickRate` (fewer ticks per second)
- Check browser console for errors

---

## Links

- **Full guide:** [docs/rollback-netcode.md](./rollback-netcode.md)
- **Barrel imports:** `import { RollbackClient, AuthoritativeServer } from '@/src/netcode';`
- **Test page:** Navigate to `/rollback-test` in your Next.js app

---

## What's Next?

1. ✅ Files are in the repo
2. ✅ TypeScript compiles
3. ✅ Next.js test page ready
4. **Your turn:** Wire up to your game server + pick a transport (WS/HTTP)
5. **Test:** Run chaos sim at `/rollback-test`, tune params
6. **Deploy:** Land it

---

**Ready to roll.** 🎮
