export type InterpolationType = 'linear' | 'hold' | 'bezier';
export type AnimationMode = 'static' | 'auto' | 'keys';

export type AutoModifier = {
  kind: 'loop' | 'pingpong' | 'seed';
  speed?: number;
  direction?: number;
  phase?: number;
};

export type Keyframe<T = number> = {
  id: string;
  time: number;       // 0.0 - 1.0 (normalized)
  value: T;
  interpolation: InterpolationType;
  // レガシー: CSS cubic-bezier コントロールポイント (0-1 範囲)
  cp1?: [number, number];
  cp2?: [number, number];
  // Auto-bezier: (time, value) 空間での 2D ハンドル (キーフレームからの相対オフセット)
  inHandle?: [number, number];   // 入力ハンドル [dt, dv] — dt <= 0
  outHandle?: [number, number];  // 出力ハンドル [dt, dv] — dt >= 0
};

export type PropertyTrack = {
  propertyId: string; // 例: "noiseDistortion.amount"
  label: string;      // 表示名
  /**
   * New animation state. `enabled` is retained for preset compatibility:
   * old enabled tracks are migrated to `keys`, disabled tracks to `static`.
   */
  mode?: AnimationMode;
  enabled: boolean;
  group?: string;
  auto?: AutoModifier;
  keyframes: Keyframe<number>[];
};

export type KeyframeStoreState = {
  tracks: Record<string, PropertyTrack>;
};

export function getTrackMode(track: PropertyTrack | null | undefined): AnimationMode {
  if (!track) return 'static';
  return track.mode ?? (track.enabled ? 'keys' : 'static');
}

export function normalizePropertyTrack(track: PropertyTrack): PropertyTrack {
  const mode = getTrackMode(track);
  return {
    ...track,
    mode,
    enabled: mode === 'keys',
  };
}
