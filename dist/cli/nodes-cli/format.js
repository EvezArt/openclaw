export function formatAge(msAgo) {
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
export function parsePairingList(value) {
    const obj = typeof value === "object" && value !== null ? value : {};
    const pending = Array.isArray(obj.pending) ? obj.pending : [];
    const paired = Array.isArray(obj.paired) ? obj.paired : [];
    return { pending, paired };
}
export function parseNodeList(value) {
    const obj = typeof value === "object" && value !== null ? value : {};
    return Array.isArray(obj.nodes) ? obj.nodes : [];
}
export function formatPermissions(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return null;
    }
    const entries = Object.entries(raw)
        .map(([key, value]) => [String(key).trim(), value === true])
        .filter(([key]) => key.length > 0)
        .toSorted((a, b) => a[0].localeCompare(b[0]));
    if (entries.length === 0) {
        return null;
    }
    const parts = entries.map(([key, granted]) => `${key}=${granted ? "yes" : "no"}`);
    return `[${parts.join(", ")}]`;
}
