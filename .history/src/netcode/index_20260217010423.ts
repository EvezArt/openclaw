/**
 * Rollback Netcode Package
 * 
 * Drop-in stack: Protocol + Server + Client
 * 
 * Usage:
 *   import { RollbackClient, AuthoritativeServer } from '@/src/netcode';
 *   import { InputCmd, Snapshot, DEFAULT_TICK_CONFIG } from '@/src/netcode';
 */

export * from './protocol';
export { RollbackClient } from './rollback-client';
export { AuthoritativeServer } from './game-server';
