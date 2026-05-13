/**
 * Rollback Netcode Package
 * 
 * Drop-in stack: Protocol + Server + Client
 * 
 * Usage:
 *   import { RollbackClient, AuthoritativeServer } from '@/src/netcode';
 *   import { InputCmd, Snapshot, DEFAULT_TICK_CONFIG } from '@/src/netcode';
 */

export * from './protocol.js';
export { RollbackClient } from './rollback-client.js';
export { AuthoritativeServer } from './game-server.js';
