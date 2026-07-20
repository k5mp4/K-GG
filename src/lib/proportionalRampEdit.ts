type PositionedStop = {
  position: number;
};

const POSITION_DECIMAL_PLACES = 12;
const POSITION_SCALE = 10 ** POSITION_DECIMAL_PLACES;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizePosition(value: number): number {
  return Math.round(value * POSITION_SCALE) / POSITION_SCALE;
}

function clampPosition(value: number, min: number, max: number): number {
  return clamp(normalizePosition(value), min, max);
}

/**
 * Shift-drag 用に、選択したストップを中心として他のストップを減衰移動する。
 * 選択ストップは常にドラッグ量の全量を移動し、非選択ストップは選択集合からの
 * 距離に応じた二次減衰で移動する。位置はランプの編集範囲内に保持する。
 */
export function moveStopsProportionally<T extends PositionedStop>(
  stops: T[],
  selectedIndexes: ReadonlySet<number>,
  activeIndex: number,
  requestedDelta: number,
  maxPosition: number,
): T[] {
  if (
    stops.length === 0
    || activeIndex < 0
    || activeIndex >= stops.length
    || selectedIndexes.size === 0
    || maxPosition <= 0
  ) {
    return stops.map(stop => ({ ...stop }));
  }

  const selectedPositions = [...selectedIndexes]
    .filter(index => index >= 0 && index < stops.length)
    .map(index => stops[index].position);

  if (selectedPositions.length === 0) return stops.map(stop => ({ ...stop }));

  const activePosition = stops[activeIndex].position;
  const effectiveDelta = clamp(activePosition + requestedDelta, 0, maxPosition) - activePosition;

  return stops.map((stop, index) => {
    if (selectedIndexes.has(index)) {
      return { ...stop, position: clampPosition(stop.position + effectiveDelta, 0, maxPosition) };
    }

    const nearestDistance = Math.min(...selectedPositions.map(position => Math.abs(stop.position - position)));
    const normalizedDistance = clamp(nearestDistance / maxPosition, 0, 1);
    const weight = (1 - normalizedDistance) ** 2;
    return { ...stop, position: clampPosition(stop.position + effectiveDelta * weight, 0, maxPosition) };
  });
}
