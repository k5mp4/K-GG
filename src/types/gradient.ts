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

/**
 * Shared cubic-Bezier edge handles of a tensor-product Mesh grid.
 *
 * - `horizontal[row][col]` is the edge from point (row, col) to (row, col+1),
 *   so the array has `rows` rows and each row has `columns - 1` entries.
 * - `vertical[row][col]` is the edge from point (row, col) to (row + 1, col),
 *   so the array has `rows - 1` rows and each row has `columns` entries.
 *
 * Each entry holds the two control points in edge direction. Every edge is
 * shared by the two adjacent cells, so C0 continuity across a cell boundary is
 * structural.
 */
export type MeshEdgeHandles = {
  horizontal: Vec2Tuple[][][];
  vertical: Vec2Tuple[][][];
};

export type MeshColorMode = 'ramp' | 'direct';

export type MeshGradientConfig = {
  /**
   * Vertex-grid dimensions. `rows * columns` grid points form a mesh of
   * `(rows - 1) x (columns - 1)` cells. 2×2 is the legacy single Coons patch.
   */
  rows: number;
  columns: number;
  /**
   * Legacy single-patch corners (BL, BR, TL, TR). Kept in sync with the outer
   * boundary of the grid so older consumers and persisted presets stay valid.
   */
  corners: [Vec2Tuple, Vec2Tuple, Vec2Tuple, Vec2Tuple];
  /**
   * Legacy single-patch edge handles. Stored edge directions:
   * bottom BL→BR, right BR→TR, top TR→TL, left TL→BL.
   * Meaningful only for the 2×2 grid; kept for backward compatibility.
   */
  handles: {
    bottom: [Vec2Tuple, Vec2Tuple];
    right: [Vec2Tuple, Vec2Tuple];
    top: [Vec2Tuple, Vec2Tuple];
    left: [Vec2Tuple, Vec2Tuple];
  };
  /**
   * Color source for the mesh.
   * - `'ramp'`: every grid point samples the shared gradient ramp along the
   *   grid's vertical axis (v = 0 bottom → v = 1 top), so ramp edits update
   *   the whole mesh. This is the default.
   * - `'direct'`: every grid point carries its own hex color in `pointColors`.
   */
  colorMode: MeshColorMode;
  /**
   * Direct-mode per-point hex colors ('#RRGGBB'), row-major, length
   * `rows * columns`. Only meaningful when `colorMode === 'direct'`.
   */
  pointColors?: string[];
  colorInterpolation: 'bilinear';
  /** Grid point positions in UV space, row-major (row 0 = bottom). Length is `rows * columns`. */
  points: Vec2Tuple[];
  /** Shared per-edge Bezier control points. Omitted/partial entries fall back to straight 1/3–2/3 handles. */
  edgeHandles: MeshEdgeHandles;
};

export const MESH_GRID_MIN = 2;
export const MESH_GRID_MAX = 8;

function defaultGridPoints(rows: number, columns: number): Vec2Tuple[] {
  const points: Vec2Tuple[] = [];
  for (let row = 0; row < rows; row += 1) {
    const v = rows === 1 ? 0 : row / (rows - 1);
    for (let col = 0; col < columns; col += 1) {
      const u = columns === 1 ? 0 : col / (columns - 1);
      points.push([u, v]);
    }
  }
  return points;
}

/** Straight 1/3–2/3 control points between two endpoints. */
export function straightEdgeHandles(a: Vec2Tuple, b: Vec2Tuple): [Vec2Tuple, Vec2Tuple] {
  return [
    [a[0] + (b[0] - a[0]) / 3, a[1] + (b[1] - a[1]) / 3],
    [a[0] + (b[0] - a[0]) * (2 / 3), a[1] + (b[1] - a[1]) * (2 / 3)],
  ];
}

export function defaultEdgeHandles(points: Vec2Tuple[], rows: number, columns: number): MeshEdgeHandles {
  const horizontal: Vec2Tuple[][][] = [];
  for (let row = 0; row < rows; row += 1) {
    const edgeRow: Vec2Tuple[][] = [];
    for (let col = 0; col < columns - 1; col += 1) {
      edgeRow.push(straightEdgeHandles(points[row * columns + col], points[row * columns + col + 1]));
    }
    horizontal.push(edgeRow);
  }
  const vertical: Vec2Tuple[][][] = [];
  for (let row = 0; row < rows - 1; row += 1) {
    const edgeRow: Vec2Tuple[][] = [];
    for (let col = 0; col < columns; col += 1) {
      edgeRow.push(straightEdgeHandles(points[row * columns + col], points[(row + 1) * columns + col]));
    }
    vertical.push(edgeRow);
  }
  return { horizontal, vertical };
}

function legacyHandlesFromGrid(points: Vec2Tuple[], rows: number, columns: number): MeshGradientConfig['handles'] {
  const bl = points[0];
  const br = points[columns - 1];
  const tl = points[(rows - 1) * columns];
  const tr = points[rows * columns - 1];
  if (rows === 2 && columns === 2) {
    // Reuse the true outer-boundary edges (horizontal h0/h1 and vertical v0/v1)
    // with the legacy direction convention:
    //   bottom BL→BR, right BR→TR, top TR→TL, left TL→BL.
    const h0 = straightEdgeHandles(points[0], points[1]);
    const v1 = straightEdgeHandles(points[1], points[3]);
    const h1 = straightEdgeHandles(points[2], points[3]);
    const v0 = straightEdgeHandles(points[0], points[2]);
    return {
      bottom: [h0[0], h0[1]],
      right: [v1[0], v1[1]],
      // top stored TR→TL, left stored TL→BL (reversed directions).
      top: [h1[1], h1[0]],
      left: [v0[1], v0[0]],
    };
  }
  return {
    bottom: straightEdgeHandles(bl, br),
    right: straightEdgeHandles(br, tr),
    top: [straightEdgeHandles(tl, tr)[1], straightEdgeHandles(tl, tr)[0]],
    left: [straightEdgeHandles(bl, tl)[1], straightEdgeHandles(bl, tl)[0]],
  };
}

/**
 * Build the legacy single-patch `corners`/`handles` fields from grid points and
 * edge handles. `handles` is only meaningfully represented for a 2×2 grid.
 */
export function legacyProjection(mesh: {
  points: Vec2Tuple[];
  edgeHandles: MeshEdgeHandles;
  rows: number;
  columns: number;
}): Pick<MeshGradientConfig, 'corners' | 'handles'> {
  const { points, edgeHandles, rows, columns } = mesh;
  const corners: MeshGradientConfig['corners'] = [
    [...points[0]] as Vec2Tuple,
    [...points[columns - 1]] as Vec2Tuple,
    [...points[(rows - 1) * columns]] as Vec2Tuple,
    [...points[rows * columns - 1]] as Vec2Tuple,
  ];
  if (rows === 2 && columns === 2) {
    const h0 = edgeHandles.horizontal[0][0] ?? straightEdgeHandles(corners[0], corners[1]);
    const v1 = edgeHandles.vertical[0][1] ?? straightEdgeHandles(corners[1], corners[3]);
    const h1 = edgeHandles.horizontal[1][0] ?? straightEdgeHandles(corners[2], corners[3]);
    const v0 = edgeHandles.vertical[0][0] ?? straightEdgeHandles(corners[0], corners[2]);
    return {
      corners,
      handles: {
        bottom: [h0[0], h0[1]],
        right: [v1[0], v1[1]],
        top: [h1[1], h1[0]],
        left: [v0[1], v0[0]],
      },
    };
  }
  return { corners, handles: legacyHandlesFromGrid(points, rows, columns) };
}

export const DEFAULT_MESH_GRADIENT: MeshGradientConfig = (() => {
  const rows = 2;
  const columns = 2;
  const points = [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ] as Vec2Tuple[];
  const edgeHandles = defaultEdgeHandles(points, rows, columns);
  return {
    rows,
    columns,
    ...legacyProjection({ points, edgeHandles, rows, columns }),
    colorMode: 'ramp',
    colorInterpolation: 'bilinear',
    points,
    edgeHandles,
  };
})();

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
    rows: value.rows,
    columns: value.columns,
    corners: value.corners.map(cloneVec2) as MeshGradientConfig['corners'],
    handles: {
      bottom: value.handles.bottom.map(cloneVec2) as MeshGradientConfig['handles']['bottom'],
      right: value.handles.right.map(cloneVec2) as MeshGradientConfig['handles']['right'],
      top: value.handles.top.map(cloneVec2) as MeshGradientConfig['handles']['top'],
      left: value.handles.left.map(cloneVec2) as MeshGradientConfig['handles']['left'],
    },
    colorMode: value.colorMode,
    ...(value.pointColors ? { pointColors: [...value.pointColors] } : {}),
    colorInterpolation: 'bilinear',
    points: value.points.map(cloneVec2),
    edgeHandles: cloneEdgeHandles(value.edgeHandles),
  };
}

export function cloneEdgeHandles(edgeHandles: MeshEdgeHandles): MeshEdgeHandles {
  return {
    horizontal: edgeHandles.horizontal.map(row => row.map(edge => edge.map(cloneVec2) as [Vec2Tuple, Vec2Tuple])),
    vertical: edgeHandles.vertical.map(row => row.map(edge => edge.map(cloneVec2) as [Vec2Tuple, Vec2Tuple])),
  };
}

function normalizedCoordinate(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(MESH_COORDINATE_MIN, Math.min(MESH_COORDINATE_MAX, value));
}

const MESH_HEX_COLOR = /^#[0-9a-f]{6}$/i;

function normalizeHexColor(value: unknown): string | undefined {
  return typeof value === 'string' && MESH_HEX_COLOR.test(value) ? value.toUpperCase() : undefined;
}

function normalizedGridSize(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(MESH_GRID_MIN, Math.min(MESH_GRID_MAX, Math.round(value)));
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

/** Read one grid point's normalized coordinates; missing points fall back to an even unit-grid placement. */
function readGridPoint(source: unknown, row: number, col: number, rows: number, columns: number): Vec2Tuple {
  const fallback: Vec2Tuple = [
    columns === 1 ? 0 : col / (columns - 1),
    rows === 1 ? 0 : row / (rows - 1),
  ];
  if (!Array.isArray(source)) return fallback;
  const index = row * columns + col;
  const candidate = source[index];
  if (!Array.isArray(candidate)) return fallback;
  return normalizeVec2(candidate, fallback);
}

/** Resolve an edge handle; missing entries become straight 1/3–2/3 handles between endpoints. */
function readEdgeHandle(
  source: unknown,
  a: Vec2Tuple,
  b: Vec2Tuple,
): [Vec2Tuple, Vec2Tuple] {
  const fallback = straightEdgeHandles(a, b);
  if (!Array.isArray(source) || !Array.isArray(source[0]) || !Array.isArray(source[1])) return fallback;
  return [normalizeVec2(source[0], fallback[0]), normalizeVec2(source[1], fallback[1])];
}

/**
 * Resolve the legacy single-patch representation of a grid's outer boundary.
 * `corners`/`handles` are always derived from the actual outer edges so both
 * representations cannot drift apart. The four corners map to BL, BR, TL, TR.
 */

/**
 * Completes persisted Mesh data without mutating the input object.
 *
 * - Old single-Coons data (`corners`/`handles`/`colorPositions` only) becomes a
 *   2×2 grid whose shared edge handles reproduce the legacy boundary.
 * - Grid dimensions are clamped to `MESH_GRID_MIN..MESH_GRID_MAX`.
 * - `points` are normalized per coordinate; missing/extra entries are completed
 *   or dropped so the array is exactly `rows * columns`.
 * - `edgeHandles` normalize each stored handle; missing entries fall back to
 *   straight 1/3–2/3 handles.
 * - Legacy `corners`/`handles` are recomputed from the grid so both views stay
 *   in sync for the outer boundary.
 */
export function normalizeMeshGradientConfig(value: unknown): MeshGradientConfig {
  const source = isRecord(value) ? value : {};
  const hasLegacy = Array.isArray(source.corners)
    || isRecord(source.handles);
  const hasGrid = Array.isArray(source.points)
    || isRecord(source.edgeHandles);

  // Legacy single-Coons data has no grid fields; its rows/columns were always
  // 2 and any stored value is treated as corrupt, so force 2×2. Grid data with
  // explicit `points` uses rows/columns as the vertex-grid dimensions.
  const legacyOnly = hasLegacy && !hasGrid;
  const rows = legacyOnly ? 2 : normalizedGridSize(source.rows, 2);
  const columns = legacyOnly ? 2 : normalizedGridSize(source.columns, 2);

  const legacyCorners = DEFAULT_MESH_GRADIENT.corners.map((fallback, index) => (
    Array.isArray(source.corners) ? normalizeVec2(source.corners[index], fallback) : fallback
  )) as MeshGradientConfig['corners'];

  // Resolve grid point positions.
  let points: Vec2Tuple[];
  if (Array.isArray(source.points) && source.points.length > 0) {
    points = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        points.push(readGridPoint(source.points, row, col, rows, columns));
      }
    }
  } else if (legacyOnly) {
    // Old single-Coons data: corners ARE the four grid points.
    points = [
      legacyCorners[0],
      legacyCorners[1],
      legacyCorners[2],
      legacyCorners[3],
    ];
  } else {
    points = defaultGridPoints(rows, columns);
  }

  // Resolve edge handles from explicit grid handles, legacy handles, or straight defaults.
  const explicitHorizontal = isRecord(source.edgeHandles) && Array.isArray(source.edgeHandles.horizontal)
    ? source.edgeHandles.horizontal
    : [];
  const explicitVertical = isRecord(source.edgeHandles) && Array.isArray(source.edgeHandles.vertical)
    ? source.edgeHandles.vertical
    : [];
  const legacyHandles = isRecord(source.handles) ? source.handles : {};

  const edgeHandles: MeshEdgeHandles = { horizontal: [], vertical: [] };
  for (let row = 0; row < rows; row += 1) {
    const edgeRow: [Vec2Tuple, Vec2Tuple][] = [];
    for (let col = 0; col < columns - 1; col += 1) {
      const a = points[row * columns + col];
      const b = points[row * columns + col + 1];
      const explicit = Array.isArray(explicitHorizontal[row]) ? explicitHorizontal[row][col] : undefined;
      let handle: [Vec2Tuple, Vec2Tuple];
      if (explicit !== undefined) {
        handle = readEdgeHandle(explicit, a, b);
      } else if (legacyOnly) {
        // Legacy stores one edge as [cp0, cp1]: bottom BL→BR, top TR→TL.
        if (row === 0) {
          handle = readEdgeHandle(legacyHandles.bottom, a, b);
        } else {
          // top stored TR→TL: reverse the control points for TL→TR.
          handle = readEdgeHandle(legacyHandles.top, a, b);
          handle = [handle[1], handle[0]];
        }
      } else {
        handle = straightEdgeHandles(a, b);
      }
      edgeRow.push(handle);
    }
    edgeHandles.horizontal.push(edgeRow);
  }
  for (let row = 0; row < rows - 1; row += 1) {
    const edgeRow: [Vec2Tuple, Vec2Tuple][] = [];
    for (let col = 0; col < columns; col += 1) {
      const a = points[row * columns + col];
      const b = points[(row + 1) * columns + col];
      const explicit = Array.isArray(explicitVertical[row]) ? explicitVertical[row][col] : undefined;
      let handle: [Vec2Tuple, Vec2Tuple];
      if (explicit !== undefined) {
        handle = readEdgeHandle(explicit, a, b);
      } else if (legacyOnly) {
        // Legacy stores right BR→TR and left TL→BL (reversed).
        if (col === columns - 1) {
          handle = readEdgeHandle(legacyHandles.right, a, b);
        } else {
          handle = readEdgeHandle(legacyHandles.left, a, b);
          handle = [handle[1], handle[0]];
        }
      } else {
        handle = straightEdgeHandles(a, b);
      }
      edgeRow.push(handle);
    }
    edgeHandles.vertical.push(edgeRow);
  }

  // Color mode: 'direct' when stored point colors exist, otherwise 'ramp'.
  // Legacy `colorPositions` (corner ramp positions) is dropped: ramp mode
  // projects the shared gradient ramp along the grid's vertical axis instead.
  const hasPointColors = Array.isArray(source.pointColors) && source.pointColors.length > 0;
  const requestedMode = source.colorMode === 'direct' || source.colorMode === 'ramp'
    ? source.colorMode
    : hasPointColors ? 'direct' : 'ramp';
  const colorMode: MeshColorMode = requestedMode;

  // Direct-mode per-point hex colors, row-major, length rows * columns.
  // Ramp mode keeps no point colors so ramp edits always drive the mesh.
  let pointColors: string[] | undefined;
  if (colorMode === 'direct') {
    pointColors = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        const candidate = Array.isArray(source.pointColors) ? source.pointColors[row * columns + col] : undefined;
        const normalized = normalizeHexColor(candidate);
        pointColors.push(normalized ?? '#FFFFFF');
      }
    }
  }

  const projection = legacyProjection({ points, edgeHandles, rows, columns });
  return cloneMeshGradient({
    rows,
    columns,
    ...projection,
    colorMode,
    ...(pointColors ? { pointColors } : {}),
    colorInterpolation: 'bilinear',
    points,
    edgeHandles,
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
