import type { NodeListNode, PairedNode, PairingList, PendingRequest } from "./types.js";

export function formatAge(msAgo: number) {
  const seconds = Math.max(0, Math.floor(msAgo / 1000));
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function parsePairingList(value: unknown): PairingList {
  const obj = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const pending = Array.isArray(obj.pending) ? (obj.pending as PendingRequest[]) : [];
  const paired = Array.isArray(obj.paired) ? (obj.paired as PairedNode[]) : [];
  return { pending, paired };
}

export function parseNodeList(value: unknown): NodeListNode[] {
  const obj = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  return Array.isArray(obj.nodes) ? (obj.nodes as NodeListNode[]) : [];
}

export function formatPermissions(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const entries = Object.entries(raw as Record<string, unknown>)
    .map(([key, value]) => [String(key).trim(), value === true] as const)
    .filter(([key]) => key.length > 0)
    .toSorted((a, b) => a[0].localeCompare(b[0]));
  if (entries.length === 0) {
    return null;
  }
  const parts = entries.map(([key, granted]) => `${key}=${granted ? "yes" : "no"}`);
  return `[${parts.join(", ")}]`;
}
