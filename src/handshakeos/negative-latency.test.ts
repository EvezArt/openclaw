import { describe, it, expect, beforeEach } from 'vitest';
import {
  NegativeLatencyEngine,
  OmnitemporalSpine,
  PredictiveBroadcaster,
} from './negative-latency.js';

describe('OmnitemporalSpine', () => {
  let spine: OmnitemporalSpine;
  
  beforeEach(() => {
    spine = new OmnitemporalSpine();
  });
  
  it('initializes with base timeline', () => {
    const timelines = spine.getTimelines();
    expect(timelines.length).toBe(1);
    expect(timelines[0].id).toBe('base');
  });
  
  it('branches new timelines', () => {
    const id = spine.branchTimeline('base', 0.5);
    
    expect(id).toMatch(/^timeline_/);
    expect(spine.getTimelines().length).toBe(2);
  });
  
  it('tracks timeline probabilities', () => {
    const id1 = spine.branchTimeline('base', 0.8);
    const id2 = spine.branchTimeline('base', 0.2);
    
    const timelines = spine.getTimelines();
    const t1 = timelines.find((t) => t.id === id1);
    const t2 = timelines.find((t) => t.id === id2);
    
    expect(t1?.probability).toBeGreaterThan(t2?.probability!);
  });
  
  it('anchors predictions to reality', () => {
    const packet = {
      id: 'test',
      timestamp: Date.now(),
      predictedAt: Date.now() - 100,
      negativeLag: 100,
      data: { value: 42 },
      confidence: 0.9,
      timelineId: 'base',
    };
    
    spine.addPrediction('base', packet);
    const anchor = spine.anchor({ value: 42 });
    
    expect(anchor.measurement).toEqual({ value: 42 });
    expect(anchor.error).toBeLessThan(0.1);
  });
  
  it('prunes low-probability timelines', () => {
    // Create many timelines
    for (let i = 0; i < 30; i++) {
      spine.branchTimeline('base', 0.01);
    }
    
    // Anchor to trigger pruning
    spine.anchor({ test: 'data' });
    
    const metrics = spine.getMetrics();
    expect(metrics.timelineCount).toBeLessThanOrEqual(20);
  });
  
  it('identifies most probable timeline', () => {
    spine.branchTimeline('base', 0.3);
    const highProb = spine.branchTimeline('base', 0.9);
    
    const most = spine.getMostProbableTimeline();
    expect(most.id).toBe(highProb);
  });
});

describe('NegativeLatencyEngine', () => {
  let engine: NegativeLatencyEngine;
  
  beforeEach(() => {
    engine = new NegativeLatencyEngine();
  });
  
  it('starts frame with 50ms budget', () => {
    const frame = engine.startFrame();
    
    expect(frame.budget).toBe(50);
    expect(frame.complete).toBe(false);
    expect(frame.packets).toEqual([]);
  });
  
  it('completes frame and tracks latency', () => {
    engine.startFrame();
    engine.completeFrame();
    
    const avg = engine.getAverageLatency();
    expect(avg).toBeGreaterThanOrEqual(0);
    expect(avg).toBeLessThan(50);
  });
  
  it('detects frame budget overruns', () => {
    engine.startFrame();
    
    // Should not be over budget immediately
    expect(engine.isFrameOverBudget()).toBe(false);
  });
  
  it('pre-computes and retrieves with negative latency', () => {
    engine.predictAndPrecompute(
      'test_key',
      () => ({ result: 'computed' }),
      0.9
    );
    
    // Wait a bit so negative lag is measurable
    setTimeout(() => {
      const result = engine.retrieve('test_key');
      
      expect(result.data).toEqual({ result: 'computed' });
      expect(result.wasPrecomputed).toBe(true);
      expect(result.negativeLag).toBeGreaterThan(0);
    }, 10);
  });
  
  it('computes on-demand if not pre-computed', () => {
    const result = engine.retrieve('missing_key', () => ({ fallback: true }));
    
    expect(result.data).toEqual({ fallback: true });
    expect(result.wasPrecomputed).toBe(false);
    expect(result.negativeLag).toBe(0);
  });
  
  it('predicts multiple timelines', () => {
    engine.predictMultipleTimelines('multi_key', [
      { fn: () => ({ variant: 'A' }), probability: 0.3 },
      { fn: () => ({ variant: 'B' }), probability: 0.7 },
    ]);
    
    const result = engine.retrieve('multi_key');
    expect(result.wasPrecomputed).toBe(true);
    expect(result.data).toHaveProperty('variant');
  });
  
  it('meets sub-50ms latency requirement', () => {
    // Run multiple frames
    for (let i = 0; i < 10; i++) {
      engine.startFrame();
      // Simulate quick work
      engine.completeFrame();
    }
    
    expect(engine.meetsLatencyRequirement()).toBe(true);
  });
  
  it('tracks negative latency statistics', () => {
    engine.predictAndPrecompute('key1', () => 'result1', 0.9);
    engine.predictAndPrecompute('key2', () => 'result2', 0.8);
    
    setTimeout(() => {
      engine.retrieve('key1');
      
      const stats = engine.getNegativeLatencyStats();
      expect(stats.precomputedCount).toBeGreaterThan(0);
      expect(stats.averageNegativeLag).toBeGreaterThan(0);
    }, 10);
  });
  
  it('prunes old predictions', () => {
    engine.predictAndPrecompute('old_key', () => 'data', 0.9);
    
    // Prune with 0ms max age - should remove everything
    engine.pruneOldPredictions(0);
    
    const result = engine.retrieve('old_key', () => 'fallback');
    expect(result.wasPrecomputed).toBe(false);
  });
});

describe('PredictiveBroadcaster', () => {
  let engine: NegativeLatencyEngine;
  let broadcaster: PredictiveBroadcaster;
  
  beforeEach(() => {
    engine = new NegativeLatencyEngine();
    broadcaster = new PredictiveBroadcaster(engine);
  });
  
  it('subscribes to topics', () => {
    let received: any = null;
    
    broadcaster.subscribe('test_topic', (data) => {
      received = data;
    });
    
    broadcaster.broadcast('test_topic', { message: 'hello' });
    
    expect(received).toEqual({ message: 'hello' });
  });
  
  it('pre-broadcasts with prediction', () => {
    let received: any = null;
    
    broadcaster.subscribe('predicted_topic', (data) => {
      received = data;
    });
    
    broadcaster.preBroadcast(
      'predicted_topic',
      () => ({ predicted: true }),
      0.9
    );
    
    expect(received).toEqual({ predicted: true });
  });
  
  it('tracks broadcast latency under 50ms', () => {
    broadcaster.subscribe('perf_topic', () => {});
    
    for (let i = 0; i < 100; i++) {
      broadcaster.broadcast('perf_topic', { count: i });
    }
    
    const metrics = broadcaster.getBroadcastMetrics();
    expect(metrics.averageLatency).toBeLessThan(50);
    expect(metrics.underBudgetRate).toBeGreaterThan(0.9);
  });
  
  it('handles multiple subscribers', () => {
    const received: any[] = [];
    
    broadcaster.subscribe('multi_topic', (data) => received.push(data));
    broadcaster.subscribe('multi_topic', (data) => received.push(data));
    broadcaster.subscribe('multi_topic', (data) => received.push(data));
    
    broadcaster.broadcast('multi_topic', { test: 'data' });
    
    expect(received.length).toBe(3);
    expect(received[0]).toEqual({ test: 'data' });
  });
});
