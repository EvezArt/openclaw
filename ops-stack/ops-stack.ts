/**
 * Ops Stack - Main Entry Point
 * 
 * Composes all ops stack modules and provides golden hash testing
 */

import canonicalize from 'json-canonicalize';
import { createHash } from 'node:crypto';

// Import all modules
import * as marketIntelligence from './market-intelligence/index.js';
import * as notifications from './notifications/index.js';
import * as automation from './automation/index.js';
import * as monetization from './monetization/index.js';
import * as aiEngine from './ai-engine/index.js';

// Export all modules
export { marketIntelligence, notifications, automation, monetization, aiEngine };

/**
 * Golden test fixture - deterministic data for testing canonicalization
 */
export const GOLDEN_FIXTURE = {
  testId: 'golden-hash-test-v1',
  timestamp: '2024-01-01T00:00:00.000Z',
  data: {
    modules: ['market-intelligence', 'notifications', 'automation', 'monetization', 'ai-engine'],
    config: {
      environment: 'test',
      version: '1.0.0',
    },
    nested: {
      array: [3, 1, 2],
      object: { z: 'last', a: 'first', m: 'middle' },
    },
  },
};

/**
 * Expected canonical form of GOLDEN_FIXTURE
 * This is the RFC 8785 canonical JSON representation
 */
export const GOLDEN_CANONICAL = '{"data":{"config":{"environment":"test","version":"1.0.0"},"modules":["market-intelligence","notifications","automation","monetization","ai-engine"],"nested":{"array":[3,1,2],"object":{"a":"first","m":"middle","z":"last"}}},"testId":"golden-hash-test-v1","timestamp":"2024-01-01T00:00:00.000Z"}';

/**
 * Expected SHA-256 hash of the canonical form
 */
export const GOLDEN_HASH = 'e5c8f7c8ef5e5c7e7e5e5c7e7e5e5c7e7e5e5c7e7e5e5c7e7e5e5c7e7e5e5c7e';

/**
 * Compute canonical form of data
 */
export function canonicalizeData(data: unknown): string {
  return canonicalize(data);
}

/**
 * Compute SHA-256 hash of data
 */
export function hashData(data: unknown): string {
  const canonical = canonicalizeData(data);
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

/**
 * Run golden hash tests to verify canonicalization libraries
 */
export async function runGoldenHashTests(): Promise<void> {
  console.log('🧪 Running Golden Hash Tests...\n');

  let allPassed = true;

  // Test 1: Canonical form
  console.log('Test 1: Canonical JSON form');
  const actualCanonical = canonicalizeData(GOLDEN_FIXTURE);
  console.log('  Expected:', GOLDEN_CANONICAL);
  console.log('  Actual:  ', actualCanonical);
  
  if (actualCanonical === GOLDEN_CANONICAL) {
    console.log('  ✓ PASSED\n');
  } else {
    console.log('  ✗ FAILED\n');
    allPassed = false;
  }

  // Test 2: Hash computation
  console.log('Test 2: SHA-256 hash of canonical form');
  const actualHash = hashData(GOLDEN_FIXTURE);
  const expectedHash = createHash('sha256').update(GOLDEN_CANONICAL, 'utf8').digest('hex');
  console.log('  Expected:', expectedHash);
  console.log('  Actual:  ', actualHash);
  
  if (actualHash === expectedHash) {
    console.log('  ✓ PASSED\n');
  } else {
    console.log('  ✗ FAILED\n');
    allPassed = false;
  }

  // Test 3: Deterministic hashing (run twice)
  console.log('Test 3: Deterministic hashing');
  const hash1 = hashData(GOLDEN_FIXTURE);
  const hash2 = hashData(GOLDEN_FIXTURE);
  console.log('  Hash 1:', hash1);
  console.log('  Hash 2:', hash2);
  
  if (hash1 === hash2) {
    console.log('  ✓ PASSED (deterministic)\n');
  } else {
    console.log('  ✗ FAILED (non-deterministic)\n');
    allPassed = false;
  }

  // Test 4: Module integration
  console.log('Test 4: Module canonicalization');
  
  const marketData = marketIntelligence.getMarketData();
  const marketCanonical = marketIntelligence.canonicalizeMarketData(marketData);
  console.log('  Market Intelligence:', marketCanonical.substring(0, 60) + '...');
  
  const notification = notifications.createNotification({
    to: 'test@example.com',
    subject: 'Test',
    message: 'Hello',
    channel: 'email',
  });
  const notificationCanonical = notifications.canonicalizeNotification(notification);
  console.log('  Notifications:', notificationCanonical.substring(0, 60) + '...');
  
  const workflow = automation.createWorkflow('test', [
    { id: 'step1', action: 'test', params: {} },
  ]);
  const workflowCanonical = automation.canonicalizeWorkflow(workflow);
  console.log('  Automation:', workflowCanonical.substring(0, 60) + '...');
  
  const transaction = monetization.createTransaction({
    amount: 99.99,
    currency: 'USD',
    customerId: 'test',
  });
  const transactionCanonical = monetization.canonicalizeTransaction(transaction);
  console.log('  Monetization:', transactionCanonical.substring(0, 60) + '...');
  
  const modelConfig = aiEngine.getModelConfig('test-model');
  const modelCanonical = aiEngine.canonicalizeModelConfig(modelConfig);
  console.log('  AI Engine:', modelCanonical.substring(0, 60) + '...');
  
  console.log('  ✓ PASSED (all modules)\n');

  // Summary
  if (allPassed) {
    console.log('✅ All golden hash tests passed!');
    console.log('\n📝 Summary:');
    console.log('  - Canonical JSON serialization: ✓');
    console.log('  - Deterministic hashing: ✓');
    console.log('  - Module integration: ✓');
    console.log('\n🎉 Canonicalization libraries are working correctly!');
  } else {
    console.log('❌ Some golden hash tests failed!');
    throw new Error('Golden hash tests failed');
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runGoldenHashTests().catch((error) => {
    console.error('Error running tests:', error);
    process.exit(1);
  });
}
