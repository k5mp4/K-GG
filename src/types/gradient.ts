export type RampColorMode =
  | 'rgb'
  | 'linearrgb'
  | 'hsv'
  | 'hsl'
  | 'lab'
  | 'lch'
  | 'xyz'
  | 'oklab'
  | 'oklch';

export type RampInterpolation =
  | 'ease'
  | 'cardinal'
  | 'linear'
  | 'b-spline'
  | 'constant'
  | 'variable'
  | 'near'
  | 'far'
  | 'clockwise'
  | 'counterclockwise'
  // Legacy values kept so older presets/localStorage can be migrated safely.
  | 'srgb'
  | 'linearrgb'
  | 'hsl'
  | 'hsv'
  | 'lab'
  | 'lch'
  | 'xyz'
  | 'oklab'
  | 'oklch';

export type ColorStop = {
  stopId?: string;   // アニメーション用の安定した一意ID
  position: number;  // 0.0–1.0
  color: string;     // hex
};

export type OpacityStop = {
  stopId?: string;   // アニメーション用の安定した一意ID
  position: number;  // 0.0–1.0
  opacity: number;   // 0.0–1.0
};

export type GradientType = 'linear' | 'radial' | 'fourcolor' | 'diamond' | 'angle' | 'bezier' | 'mesh';

export type Vec2Tuple = [number, number];
export type MeshEdge = 'bottom' | 'right' | 'top' | 'left';

export type MeshGradientConfig = {
  /** MVP is always one 2×2 patch; these fields reserve the future grid shape. */
  rows: 2;
  columns: 2;
  /** UV coordinates: 0=bottom-left, 1=bottom-right, 2=top-left, 3=top-right. */
  corners: [Vec2Tuple, Vec2Tuple, Vec2Tuple, Vec2Tuple];
  /** Stored edge directions: bottom BL→BR, right BR→TR, top TR→TL, left TL→BL. */
  handles: {
    bottom: [Vec2Tuple, Vec2Tuple];
    right: [Vec2Tuple, Vec2Tuple];
    top: [Vec2Tuple, Vec2Tuple];
    left: [Vec2Tuple, Vec2Tuple];
  };
  /** Ramp positions for BL, BR, TL, TR respectively. */
  colorPositions: [number, number, number, number];
  colorInterpolation: 'bilinear';
};

export const DEFAULT_MESH_GRADIENT: MeshGradientConfig = {
  rows: 2,
  columns: 2,
  corners: [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ],
  handles: {
    bottom: [[1 / 3, 0], [2 / 3, 0]],
    right: [[1, 1 / 3], [1, 2 / 3]],
    top: [[2 / 3, 1], [1 / 3, 1]],
    left: [[0, 2 / 3], [0, 1 / 3]],
  },
  colorPositions: [0, 1 / 3, 2 / 3, 1],
  colorInterpolation: 'bilinear',
};

// Coordinates may leave the canvas so a user can pull a boundary beyond an edge.
// The finite safety range prevents accidental values from destabilizing Newton steps.
export const MESH_COORDINATE_MIN = -4;
export const MESH_COORDINATE_MAX = 5;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cloneVec2(value: Vec2Tuple): Vec2Tuple {
  return [value[0], value[1]];
}

function cloneMeshGradient(value: MeshGradientConfig): MeshGradientConfig {
  return {
    rows: 2,
    columns: 2,
    corners: value.corners.map(cloneVec2) as MeshGradientConfig['corners'],
    handles: {
      bottom: value.handles.bottom.map(cloneVec2) as MeshGradientConfig['handles']['bottom'],
      right: value.handles.right.map(cloneVec2) as MeshGradientConfig['handles']['right'],
      top: value.handles.top.map(cloneVec2) as MeshGradientConfig['handles']['top'],
      left: value.handles.left.map(cloneVec2) as MeshGradientConfig['handles']['left'],
    },
    colorPositions: [...value.colorPositions] as MeshGradientConfig['colorPositions'],
    colorInterpolation: 'bilinear',
  };
}

function normalizedCoordinate(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(MESH_COORDINATE_MIN, Math.min(MESH_COORDINATE_MAX, value));
}

function normalizedColorPosition(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(1, value));
}

function normalizeVec2(value: unknown, fallback: Vec2Tuple): Vec2Tuple {
  if (
    !Array.isArray(value)
    || value.length !== 2
    || typeof value[0] !== 'number'
    || !Number.isFinite(value[0])
    || typeof value[1] !== 'number'
    || !Number.isFinite(value[1])
  ) return cloneVec2(fallback);
  return [
    normalizedCoordinate(value[0], fallback[0]),
    normalizedCoordinate(value[1], fallback[1]),
  ];
}

/** Completes persisted Mesh data without mutating the input object. */
export function normalizeMeshGradientConfig(value: unknown): MeshGradientConfig {
  const source = isRecord(value) ? value : {};
  const sourceCorners = Array.isArray(source.corners) ? source.corners : [];
  const sourceHandles = isRecord(source.handles) ? source.handles : {};
  const sourceColorPositions = Array.isArray(source.colorPositions) ? source.colorPositions : [];
  const corners = DEFAULT_MESH_GRADIENT.corners.map((fallback, index) => (
    normalizeVec2(sourceCorners[index], fallback)
  )) as MeshGradientConfig['corners'];
  const handles = {
    bottom: DEFAULT_MESH_GRADIENT.handles.bottom.map((fallback, index) => normalizeVec2(
      Array.isArray(sourceHandles.bottom) ? sourceHandles.bottom[index] : undefined,
      fallback,
    )) as MeshGradientConfig['handles']['bottom'],
    right: DEFAULT_MESH_GRADIENT.handles.right.map((fallback, index) => normalizeVec2(
      Array.isArray(sourceHandles.right) ? sourceHandles.right[index] : undefined,
      fallback,
    )) as MeshGradientConfig['handles']['right'],
    top: DEFAULT_MESH_GRADIENT.handles.top.map((fallback, index) => normalizeVec2(
      Array.isArray(sourceHandles.top) ? sourceHandles.top[index] : undefined,
      fallback,
    )) as MeshGradientConfig['handles']['top'],
    left: DEFAULT_MESH_GRADIENT.handles.left.map((fallback, index) => normalizeVec2(
      Array.isArray(sourceHandles.left) ? sourceHandles.left[index] : undefined,
      fallback,
    )) as MeshGradientConfig['handles']['left'],
  };
  const colorPositions = DEFAULT_MESH_GRADIENT.colorPositions.map((fallback, index) => (
    normalizedColorPosition(sourceColorPositions[index], fallback)
  )) as MeshGradientConfig['colorPositions'];

  return cloneMeshGradient({
    rows: 2,
    columns: 2,
    corners,
    handles,
    colorPositions,
    colorInterpolation: 'bilinear',
  });
}

export type GradientConfig = {
  angle: number;     // degrees 0–360
  stops: ColorStop[];
  opacityStops?: OpacityStop[];
  rampColorMode?: RampColorMode;
  rampInterpolation: RampInterpolation;
  rampVariable?: number; // -1.0..1.0, 0=Ease, +/-1=Constant寄り
  rampRepeat?: number; // 1–20, グラデーションランプの繰り返し回数
  gradientType: GradientType;
  /** グラデーションのアンカーポイント（UV空間: y=0が底辺）。常に4点保持し、fourcolor以外は0,1のみ使用 */
  anchors?: [[number,number],[number,number],[number,number],[number,number]];
  /** Bezier Gradient用の制御点（UV空間）。0=A側ハンドル、1=B側ハンドル */
  bezierControls?: [[number, number], [number, number]];
  /** Mesh Gradation's structured single Coons Patch data. */
  mesh?: MeshGradientConfig;
  rampMirror?: boolean;  // mirrorモード：ストップ範囲を0–0.5に制限し左右対称にレンダリング
};
