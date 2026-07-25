let currentTimelineTime = 0;
let hasTimelineTime = false;
const listeners = new Set<() => void>();

export function setTimelineTime(value: number) {
  if (!Number.isFinite(value)) return;
  const next = Math.max(0, Math.min(1, value));
  if (hasTimelineTime && Math.abs(next - currentTimelineTime) < 1e-7) return;
  currentTimelineTime = next;
  hasTimelineTime = true;
  listeners.forEach(listener => listener());
}

export function getTimelineTime(fallback = 0) {
  return hasTimelineTime ? currentTimelineTime : Math.max(0, Math.min(1, fallback));
}

export function subscribeTimelineTime(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTimelineTimeSnapshot(): number {
  return currentTimelineTime;
}
