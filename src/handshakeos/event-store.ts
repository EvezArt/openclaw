/**
 * HandshakeOS-E Event Store
 *
 * Persistent storage for universal event records with audit trail.
 * All events are reversibly logged and fully traceable.
 */

import type { ActorIdentity, EventRecord } from "./types.js";

/**
 * Query options for retrieving events.
 */
export type EventQuery = {
  /** Filter by event type */
  type?: string;
  /** Filter by actor ID */
  actorId?: string;
  /** Filter by session ID */
  sessionId?: string;
  /** Filter by tags (any match) */
  tags?: string[];
  /** Filter by parent event ID */
  parentEventId?: string;
  /** Start timestamp (inclusive) */
  startTime?: number;
  /** End timestamp (inclusive) */
  endTime?: number;
  /** Maximum number of results */
  limit?: number;
  /** Skip first N results */
  offset?: number;
};

/**
 * In-memory event store for MVP implementation.
 * In production, this would be backed by a database.
 */
class EventStore {
  private events: Map<string, EventRecord> = new Map();
  private eventsByType: Map<string, Set<string>> = new Map();
  private eventsByActor: Map<string, Set<string>> = new Map();
  private eventsBySession: Map<string, Set<string>> = new Map();

  /**
   * Store a new event record.
   */
  store(event: EventRecord): void {
    if (this.events.has(event.id)) {
      throw new Error(`Event with ID ${event.id} already exists`);
    }

    this.events.set(event.id, event);

    // Index by type
    if (!this.eventsByType.has(event.type)) {
      this.eventsByType.set(event.type, new Set());
    }
    this.eventsByType.get(event.type)!.add(event.id);

    // Index by actor
    if (!this.eventsByActor.has(event.actor.id)) {
      this.eventsByActor.set(event.actor.id, new Set());
    }
    this.eventsByActor.get(event.actor.id)!.add(event.id);

    // Index by session
    if (event.sessionId) {
      if (!this.eventsBySession.has(event.sessionId)) {
        this.eventsBySession.set(event.sessionId, new Set());
      }
      this.eventsBySession.get(event.sessionId)!.add(event.id);
    }
  }

  /**
   * Retrieve an event by ID.
   */
  get(id: string): EventRecord | undefined {
    return this.events.get(id);
  }

  /**
   * Query events based on criteria.
   */
  query(options: EventQuery = {}): EventRecord[] {
    let candidateIds: Set<string> | undefined;

    // Start with most selective index
    if (options.type) {
      candidateIds = this.eventsByType.get(options.type);
    } else if (options.actorId) {
      candidateIds = this.eventsByActor.get(options.actorId);
    } else if (options.sessionId) {
      candidateIds = this.eventsBySession.get(options.sessionId);
    }

    // If no index matched, use all events
    if (!candidateIds) {
      candidateIds = new Set(this.events.keys());
    }

    // Filter candidates
    let results: EventRecord[] = [];
    for (const id of candidateIds) {
      const event = this.events.get(id);
      if (!event) {
        continue;
      }

      // Apply filters
      if (options.type && event.type !== options.type) {
        continue;
      }
      if (options.actorId && event.actor.id !== options.actorId) {
        continue;
      }
      if (options.sessionId && event.sessionId !== options.sessionId) {
        continue;
      }
      if (options.parentEventId && event.parentEventId !== options.parentEventId) {
        continue;
      }
      if (options.startTime && event.timestamp < options.startTime) {
        continue;
      }
      if (options.endTime && event.timestamp > options.endTime) {
        continue;
      }
      if (options.tags && options.tags.length > 0) {
        const eventTags = event.tags ?? [];
        const hasMatch = options.tags.some((tag) => eventTags.includes(tag));
        if (!hasMatch) {
          continue;
        }
      }

      results.push(event);
    }

    // Sort by timestamp (newest first)
    results.sort((a, b) => b.timestamp - a.timestamp);

    // Apply pagination
    if (options.offset) {
      results = results.slice(options.offset);
    }
    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Get the event chain (parent -> child relationships).
   */
  getEventChain(eventId: string): EventRecord[] {
    const chain: EventRecord[] = [];
    let currentId: string | undefined = eventId;

    while (currentId) {
      const event = this.events.get(currentId);
      if (!event) {
        break;
      }
      chain.push(event);
      currentId = event.parentEventId;
    }

    return chain.reverse(); // Return in chronological order
  }

  /**
   * Get all child events of a parent.
   */
  getChildEvents(parentId: string): EventRecord[] {
    return this.query({ parentEventId: parentId });
  }

  /**
   * Get events by actor.
   */
  getEventsByActor(actor: ActorIdentity, limit?: number): EventRecord[] {
    return this.query({ actorId: actor.id, limit });
  }

  /**
   * Get events by session.
   */
  getEventsBySession(sessionId: string, limit?: number): EventRecord[] {
    return this.query({ sessionId, limit });
  }

  /**
   * Get recent events.
   */
  getRecentEvents(limit = 100): EventRecord[] {
    return this.query({ limit });
  }

  /**
   * Count total events.
   */
  count(): number {
    return this.events.size;
  }

  /**
   * Clear all events (for testing).
   */
  clear(): void {
    this.events.clear();
    this.eventsByType.clear();
    this.eventsByActor.clear();
    this.eventsBySession.clear();
  }

  /**
   * Export all events (for backup/audit).
   */
  exportAll(): EventRecord[] {
    return Array.from(this.events.values());
  }
}

// Singleton instance
const eventStore = new EventStore();

export { eventStore, EventStore };
