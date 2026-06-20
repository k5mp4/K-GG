let currentTimelineTime = 0;

export function setTimelineTime(value: number) {
  if (!Number.isFinite(value)) return;
  currentTimelineTime = Math.max(0, Math.min(1, value));
}

export function getTimelineTime(fallback = 0) {
  return currentTimelineTime > 0 ? currentTimelineTime : Math.max(0, Math.min(1, fallback));
}
