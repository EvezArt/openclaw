import { describe, test, expect, beforeEach } from "vitest";
import { EventStore } from "./event-store.js";
import {
  createSystemActor,
  createUserActor,
  createEmptyDomainSignature,
  generateId,
} from "./utils.js";
import type { EventRecord } from "./types.js";

describe("EventStore", () => {
  let store: EventStore;

  beforeEach(() => {
    store = new EventStore();
  });

  test("stores and retrieves events", () => {
    const actor = createSystemActor();
    const event: EventRecord = {
      id: generateId(),
      timestamp: Date.now(),
      actor,
      type: "test-event",
      payload: { key: "value" },
      domainSignature: createEmptyDomainSignature(),
    };

    store.store(event);
    const retrieved = store.get(event.id);

    expect(retrieved).toEqual(event);
  });

  test("prevents duplicate event IDs", () => {
    const actor = createSystemActor();
    const event: EventRecord = {
      id: "duplicate-id",
      timestamp: Date.now(),
      actor,
      type: "test-event",
      payload: {},
      domainSignature: createEmptyDomainSignature(),
    };

    store.store(event);
    expect(() => store.store(event)).toThrow("Event with ID duplicate-id already exists");
  });

  test("queries events by type", () => {
    const actor = createSystemActor();
    const event1: EventRecord = {
      id: generateId(),
      timestamp: Date.now(),
      actor,
      type: "type-a",
      payload: {},
      domainSignature: createEmptyDomainSignature(),
    };
    const event2: EventRecord = {
      id: generateId(),
      timestamp: Date.now(),
      actor,
      type: "type-b",
      payload: {},
      domainSignature: createEmptyDomainSignature(),
    };

    store.store(event1);
    store.store(event2);

    const results = store.query({ type: "type-a" });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(event1.id);
  });

  test("queries events by actor", () => {
    const actor1 = createUserActor("user-1");
    const actor2 = createUserActor("user-2");
    const event1: EventRecord = {
      id: generateId(),
      timestamp: Date.now(),
      actor: actor1,
      type: "test",
      payload: {},
      domainSignature: createEmptyDomainSignature(),
    };
    const event2: EventRecord = {
      id: generateId(),
      timestamp: Date.now(),
      actor: actor2,
      type: "test",
      payload: {},
      domainSignature: createEmptyDomainSignature(),
    };

    store.store(event1);
    store.store(event2);

    const results = store.query({ actorId: "user-1" });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(event1.id);
  });

  test("queries events by session", () => {
    const actor = createSystemActor();
    const event1: EventRecord = {
      id: generateId(),
      timestamp: Date.now(),
      actor,
      type: "test",
      payload: {},
      sessionId: "session-1",
      domainSignature: createEmptyDomainSignature(),
    };
    const event2: EventRecord = {
      id: generateId(),
      timestamp: Date.now(),
      actor,
      type: "test",
      payload: {},
      sessionId: "session-2",
      domainSignature: createEmptyDomainSignature(),
    };

    store.store(event1);
    store.store(event2);

    const results = store.query({ sessionId: "session-1" });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(event1.id);
  });

  test("queries events by time range", () => {
    const actor = createSystemActor();
    const now = Date.now();
    const event1: EventRecord = {
      id: generateId(),
      timestamp: now - 1000,
      actor,
      type: "test",
      payload: {},
      domainSignature: createEmptyDomainSignature(),
    };
    const event2: EventRecord = {
      id: generateId(),
      timestamp: now,
      actor,
      type: "test",
      payload: {},
      domainSignature: createEmptyDomainSignature(),
    };
    const event3: EventRecord = {
      id: generateId(),
      timestamp: now + 1000,
      actor,
      type: "test",
      payload: {},
      domainSignature: createEmptyDomainSignature(),
    };

    store.store(event1);
    store.store(event2);
    store.store(event3);

    const results = store.query({ startTime: now - 500, endTime: now + 500 });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(event2.id);
  });

  test("queries events by tags", () => {
    const actor = createSystemActor();
    const event1: EventRecord = {
      id: generateId(),
      timestamp: Date.now(),
      actor,
      type: "test",
      payload: {},
      tags: ["important", "urgent"],
      domainSignature: createEmptyDomainSignature(),
    };
    const event2: EventRecord = {
      id: generateId(),
      timestamp: Date.now(),
      actor,
      type: "test",
      payload: {},
      tags: ["normal"],
      domainSignature: createEmptyDomainSignature(),
    };

    store.store(event1);
    store.store(event2);

    const results = store.query({ tags: ["urgent"] });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(event1.id);
  });

  test("retrieves event chain", () => {
    const actor = createSystemActor();
    const event1: EventRecord = {
      id: "event-1",
      timestamp: Date.now(),
      actor,
      type: "test",
      payload: {},
      domainSignature: createEmptyDomainSignature(),
    };
    const event2: EventRecord = {
      id: "event-2",
      timestamp: Date.now() + 1,
      actor,
      type: "test",
      payload: {},
      parentEventId: "event-1",
      domainSignature: createEmptyDomainSignature(),
    };
    const event3: EventRecord = {
      id: "event-3",
      timestamp: Date.now() + 2,
      actor,
      type: "test",
      payload: {},
      parentEventId: "event-2",
      domainSignature: createEmptyDomainSignature(),
    };

    store.store(event1);
    store.store(event2);
    store.store(event3);

    const chain = store.getEventChain("event-3");
    expect(chain).toHaveLength(3);
    expect(chain[0].id).toBe("event-1");
    expect(chain[1].id).toBe("event-2");
    expect(chain[2].id).toBe("event-3");
  });

  test("retrieves child events", () => {
    const actor = createSystemActor();
    const parent: EventRecord = {
      id: "parent",
      timestamp: Date.now(),
      actor,
      type: "test",
      payload: {},
      domainSignature: createEmptyDomainSignature(),
    };
    const child1: EventRecord = {
      id: "child-1",
      timestamp: Date.now() + 1,
      actor,
      type: "test",
      payload: {},
      parentEventId: "parent",
      domainSignature: createEmptyDomainSignature(),
    };
    const child2: EventRecord = {
      id: "child-2",
      timestamp: Date.now() + 2,
      actor,
      type: "test",
      payload: {},
      parentEventId: "parent",
      domainSignature: createEmptyDomainSignature(),
    };

    store.store(parent);
    store.store(child1);
    store.store(child2);

    const children = store.getChildEvents("parent");
    expect(children).toHaveLength(2);
    expect(children.map((e) => e.id).sort()).toEqual(["child-1", "child-2"]);
  });

  test("applies pagination", () => {
    const actor = createSystemActor();
    for (let i = 0; i < 10; i++) {
      store.store({
        id: `event-${i}`,
        timestamp: Date.now() + i,
        actor,
        type: "test",
        payload: {},
        domainSignature: createEmptyDomainSignature(),
      });
    }

    const page1 = store.query({ limit: 3 });
    expect(page1).toHaveLength(3);

    const page2 = store.query({ limit: 3, offset: 3 });
    expect(page2).toHaveLength(3);
    expect(page2[0].id).not.toBe(page1[0].id);
  });

  test("counts events", () => {
    expect(store.count()).toBe(0);

    const actor = createSystemActor();
    store.store({
      id: generateId(),
      timestamp: Date.now(),
      actor,
      type: "test",
      payload: {},
      domainSignature: createEmptyDomainSignature(),
    });

    expect(store.count()).toBe(1);
  });

  test("exports all events", () => {
    const actor = createSystemActor();
    const event1: EventRecord = {
      id: generateId(),
      timestamp: Date.now(),
      actor,
      type: "test",
      payload: {},
      domainSignature: createEmptyDomainSignature(),
    };
    const event2: EventRecord = {
      id: generateId(),
      timestamp: Date.now(),
      actor,
      type: "test",
      payload: {},
      domainSignature: createEmptyDomainSignature(),
    };

    store.store(event1);
    store.store(event2);

    const exported = store.exportAll();
    expect(exported).toHaveLength(2);
  });

  test("clears all events", () => {
    const actor = createSystemActor();
    store.store({
      id: generateId(),
      timestamp: Date.now(),
      actor,
      type: "test",
      payload: {},
      domainSignature: createEmptyDomainSignature(),
    });

    expect(store.count()).toBe(1);
    store.clear();
    expect(store.count()).toBe(0);
  });
});
