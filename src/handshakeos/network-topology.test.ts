import { describe, it, expect, beforeEach } from 'vitest';
import {
  NetworkTopologyPredictor,
  AnticipatorRoutingCache,
  type NetworkNode,
} from './network-topology.js';

describe('NetworkTopologyPredictor', () => {
  let predictor: NetworkTopologyPredictor;
  
  beforeEach(() => {
    predictor = new NetworkTopologyPredictor();
  });
  
  it('initializes with empty topology', () => {
    const metrics = predictor.getMetrics();
    expect(metrics.nodes).toBe(0);
    expect(metrics.connections).toBe(0);
    expect(metrics.observations).toBe(0);
  });
  
  it('adds nodes to topology', () => {
    const node: NetworkNode = {
      id: 'node1',
      address: '192.168.1.100',
      lastSeen: Date.now(),
      reliability: 1.0,
      capabilities: ['routing'],
    };
    
    predictor.addNode(node);
    
    const topology = predictor.getTopology();
    expect(topology).not.toBeNull();
    expect(topology!.nodes.size).toBe(1);
    expect(topology!.nodes.get('node1')).toEqual(node);
  });
  
  it('records connection observations', () => {
    predictor.addNode({
      id: 'node1',
      address: '192.168.1.100',
      lastSeen: Date.now(),
      reliability: 1.0,
      capabilities: [],
    });
    
    predictor.addNode({
      id: 'node2',
      address: '192.168.1.101',
      lastSeen: Date.now(),
      reliability: 1.0,
      capabilities: [],
    });
    
    // Observe successful connection
    predictor.observe('node1', 'node2', true, { latency: 10, bandwidth: 1000 });
    
    const metrics = predictor.getMetrics();
    expect(metrics.observations).toBe(1);
    expect(metrics.connections).toBeGreaterThan(0);
  });
  
  it('updates connection probability based on observations', () => {
    predictor.addNode({
      id: 'node1',
      address: '192.168.1.100',
      lastSeen: Date.now(),
      reliability: 1.0,
      capabilities: [],
    });
    
    predictor.addNode({
      id: 'node2',
      address: '192.168.1.101',
      lastSeen: Date.now(),
      reliability: 1.0,
      capabilities: [],
    });
    
    // Multiple successful observations should increase probability
    for (let i = 0; i < 10; i++) {
      predictor.observe('node1', 'node2', true);
    }
    
    const prediction = predictor.predictConnection('node1', 'node2');
    expect(prediction.probability).toBeGreaterThan(0.8);
    expect(prediction.exists).toBe(true);
  });
  
  it('predicts connection existence without probing', () => {
    predictor.addNode({
      id: 'node1',
      address: '192.168.1.100',
      lastSeen: Date.now(),
      reliability: 1.0,
      capabilities: [],
    });
    
    predictor.addNode({
      id: 'node2',
      address: '192.168.1.101',
      lastSeen: Date.now(),
      reliability: 1.0,
      capabilities: [],
    });
    
    // Train with observations
    for (let i = 0; i < 15; i++) {
      predictor.observe('node1', 'node2', true);
    }
    
    // Should predict connection exists
    const prediction = predictor.predictConnection('node1', 'node2');
    expect(prediction.exists).toBe(true);
    expect(prediction.confidence).toBeGreaterThan(0.5);
  });
  
  it('calculates topology entropy', () => {
    predictor.addNode({
      id: 'node1',
      address: '192.168.1.100',
      lastSeen: Date.now(),
      reliability: 1.0,
      capabilities: [],
    });
    
    predictor.addNode({
      id: 'node2',
      address: '192.168.1.101',
      lastSeen: Date.now(),
      reliability: 1.0,
      capabilities: [],
    });
    
    // Initially high entropy (uncertainty)
    predictor.observe('node1', 'node2', true);
    const metrics1 = predictor.getMetrics();
    const initialEntropy = metrics1.entropy;
    
    // More observations should reduce entropy
    for (let i = 0; i < 20; i++) {
      predictor.observe('node1', 'node2', true);
    }
    
    const metrics2 = predictor.getMetrics();
    expect(metrics2.entropy).toBeLessThan(initialEntropy);
    expect(metrics2.confidence).toBeGreaterThan(metrics1.confidence);
  });
  
  it('collapses topology to most probable state', () => {
    predictor.addNode({
      id: 'node1',
      address: '192.168.1.100',
      lastSeen: Date.now(),
      reliability: 1.0,
      capabilities: [],
    });
    
    predictor.addNode({
      id: 'node2',
      address: '192.168.1.101',
      lastSeen: Date.now(),
      reliability: 1.0,
      capabilities: [],
    });
    
    // Create high-confidence connection
    for (let i = 0; i < 20; i++) {
      predictor.observe('node1', 'node2', true);
    }
    
    const topology = predictor.collapseTopology();
    expect(topology.confidence).toBeGreaterThan(0.5);
    expect(topology.connections.size).toBeGreaterThan(0);
  });
  
  it('calculates optimal path between nodes', () => {
    predictor.addNode({
      id: 'node1',
      address: '192.168.1.100',
      lastSeen: Date.now(),
      reliability: 1.0,
      capabilities: [],
    });
    
    predictor.addNode({
      id: 'node2',
      address: '192.168.1.101',
      lastSeen: Date.now(),
      reliability: 1.0,
      capabilities: [],
    });
    
    predictor.addNode({
      id: 'node3',
      address: '192.168.1.102',
      lastSeen: Date.now(),
      reliability: 1.0,
      capabilities: [],
    });
    
    // Create path: node1 -> node2 -> node3
    for (let i = 0; i < 20; i++) {
      predictor.observe('node1', 'node2', true, { latency: 10 });
      predictor.observe('node2', 'node3', true, { latency: 15 });
    }
    
    const path = predictor.calculateOptimalPath('node1', 'node3');
    expect(path).not.toBeNull();
    expect(path!.segments.length).toBe(2);
    expect(path!.source).toBe('node1');
    expect(path!.destination).toBe('node3');
    expect(path!.totalProbability).toBeGreaterThan(0.5);
  });
  
  it('returns null for path when no route exists', () => {
    predictor.addNode({
      id: 'node1',
      address: '192.168.1.100',
      lastSeen: Date.now(),
      reliability: 1.0,
      capabilities: [],
    });
    
    predictor.addNode({
      id: 'node2',
      address: '192.168.1.101',
      lastSeen: Date.now(),
      reliability: 1.0,
      capabilities: [],
    });
    
    // No observations - no path
    const path = predictor.calculateOptimalPath('node1', 'node2');
    expect(path).toBeNull();
  });
  
  it('handles failed connection observations', () => {
    predictor.addNode({
      id: 'node1',
      address: '192.168.1.100',
      lastSeen: Date.now(),
      reliability: 1.0,
      capabilities: [],
    });
    
    predictor.addNode({
      id: 'node2',
      address: '192.168.1.101',
      lastSeen: Date.now(),
      reliability: 1.0,
      capabilities: [],
    });
    
    // Observe failed connections
    for (let i = 0; i < 15; i++) {
      predictor.observe('node1', 'node2', false);
    }
    
    const prediction = predictor.predictConnection('node1', 'node2');
    expect(prediction.probability).toBeLessThan(0.3);
    expect(prediction.exists).toBe(false);
  });
  
  it('performs bootstrap discovery', async () => {
    const topology = await predictor.bootstrapDiscovery('192.168.1.1');
    
    expect(topology).not.toBeNull();
    expect(topology.nodes.size).toBeGreaterThan(0);
    expect(topology.nodes.has('local')).toBe(true);
  });
});

describe('AnticipatorRoutingCache', () => {
  let predictor: NetworkTopologyPredictor;
  let cache: AnticipatorRoutingCache;
  
  beforeEach(() => {
    predictor = new NetworkTopologyPredictor();
    cache = new AnticipatorRoutingCache(predictor);
    
    // Setup test network
    predictor.addNode({
      id: 'node1',
      address: '192.168.1.100',
      lastSeen: Date.now(),
      reliability: 1.0,
      capabilities: [],
    });
    
    predictor.addNode({
      id: 'node2',
      address: '192.168.1.101',
      lastSeen: Date.now(),
      reliability: 1.0,
      capabilities: [],
    });
    
    predictor.addNode({
      id: 'node3',
      address: '192.168.1.102',
      lastSeen: Date.now(),
      reliability: 1.0,
      capabilities: [],
    });
    
    // Train connections
    for (let i = 0; i < 20; i++) {
      predictor.observe('node1', 'node2', true, { latency: 10 });
      predictor.observe('node2', 'node3', true, { latency: 15 });
    }
  });
  
  it('caches anticipated routes', () => {
    cache.anticipateRoute('node1', 'node3');
    
    const path = cache.getPath('node1', 'node3');
    expect(path).not.toBeNull();
    expect(path!.source).toBe('node1');
    expect(path!.destination).toBe('node3');
  });
  
  it('returns null for non-anticipated routes', () => {
    const path = cache.getPath('node1', 'node3');
    expect(path).toBeNull();
  });
  
  it('refreshes cached paths', () => {
    cache.anticipateRoute('node1', 'node3');
    
    // Add more observations to change probabilities
    for (let i = 0; i < 10; i++) {
      predictor.observe('node1', 'node2', true, { latency: 5 });
    }
    
    cache.refreshPaths();
    
    const path = cache.getPath('node1', 'node3');
    expect(path).not.toBeNull();
  });
});
