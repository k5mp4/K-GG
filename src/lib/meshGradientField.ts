import {
  normalizeMeshGradientConfig,
  straightEdgeHandles,
  type MeshGradientConfig,
  type Vec2Tuple,
} from '../types/gradient';

/** Resolution used by the GPU lookup texture for a Mesh Gradation field. */
export const MESH_FIELD_SIZE = 256;

/** The reference implementation renders a tessellated Bezier patch. */
export const MESH_FIELD_SUBDIVISIONS = 32;

type Rgba = [number, number, number, number];

export type MeshGradientFieldOptions = {
  width?: number;
  height?: number;
  subdivisions?: number;
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function cubicBezier(
  p0: Vec2Tuple,
  p1: Vec2Tuple,
  p2: Vec2Tuple,
  p3: Vec2Tuple,
  t: number,
): Vec2Tuple {
  const mt = 1 - t;
  return [
    mt * mt * mt * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t * t * t * p3[0],
    mt * mt * mt * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t * t * t * p3[1],
  ];
}

function sampleRamp(rampData: Uint8Array, rampWidth: number, position: number): Rgba {
  const coordinate = clamp01(finiteOr(position, 0)) * Math.max(rampWidth - 1, 0);
  const left = Math.floor(coordinate);
  const right = Math.min(left + 1, Math.max(rampWidth - 1, 0));
  const amount = coordinate - left;
  const leftOffset = left * 4;
  const rightOffset = right * 4;
  return [
    lerp(rampData[leftOffset] ?? 0, rampData[rightOffset] ?? 0, amount),
    lerp(rampData[leftOffset + 1] ?? 0, rampData[rightOffset + 1] ?? 0, amount),
    lerp(rampData[leftOffset + 2] ?? 0, rampData[rightOffset + 2] ?? 0, amount),
    lerp(rampData[leftOffset + 3] ?? 255, rampData[rightOffset + 3] ?? 255, amount),
  ];
}

function hexToRgba(hex: string): Rgba | null {
  if (hex.length !== 7 || hex[0] !== '#') return null;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) return null;
  return [r, g, b, 255];
}

/**
 * Resolve one grid point's color.
 *
 * - Direct mode: the point's own hex (`pointColors[index]`) is used verbatim.
 * - Ramp mode (default): the shared gradient ramp is sampled at the point's
 *   grid vertical position `v` (v = 0 bottom → v = 1 top), so ramp edits
 *   update the whole mesh and the ramp flows along the grid's v axis.
 */
function gridPointColor(
  mesh: MeshGradientConfig,
  rampData: Uint8Array,
  rampWidth: number,
  row: number,
  col: number,
): Rgba {
  const { rows, columns } = mesh;
  const index = row * columns + col;
  if (mesh.colorMode === 'direct' && mesh.pointColors) {
    const direct = mesh.pointColors[index];
    if (direct) {
      const color = hexToRgba(direct);
      if (color) return color;
    }
  }
  const [, v] = gridToUV(row, col, rows, columns);
  return sampleRamp(rampData, rampWidth, v);
}

/** Map grid coordinates (row/col indices) to a global 0..1 domain position. */
export function gridToUV(row: number, col: number, rows: number, columns: number): Vec2Tuple {
  return [
    columns <= 1 ? 0 : col / (columns - 1),
    rows <= 1 ? 0 : row / (rows - 1),
  ];
}

/**
 * Evaluate the cell at (cellRow, cellCol) in its own local (u, v) domain.
 * Each cell is a Coons patch bounded by its four shared cubic Bezier edges.
 * For the legacy 2×2 grid this matches the original single Coons patch.
 */
export function evaluateMeshCell(
  mesh: MeshGradientConfig,
  cellRow: number,
  cellCol: number,
  u: number,
  v: number,
): Vec2Tuple {
  const { rows, columns, points, edgeHandles } = mesh;
  const row0 = Math.max(0, Math.min(rows - 2, Math.floor(cellRow)));
  const col0 = Math.max(0, Math.min(columns - 2, Math.floor(cellCol)));
  const p00 = points[row0 * columns + col0];
  const p10 = points[row0 * columns + col0 + 1];
  const p01 = points[(row0 + 1) * columns + col0];
  const p11 = points[(row0 + 1) * columns + col0 + 1];
  const bottomH = edgeHandles.horizontal[row0]?.[col0] ?? straightEdgeHandles(p00, p10);
  const topH = edgeHandles.horizontal[row0 + 1]?.[col0] ?? straightEdgeHandles(p01, p11);
  const leftV = edgeHandles.vertical[row0]?.[col0] ?? straightEdgeHandles(p00, p01);
  const rightV = edgeHandles.vertical[row0]?.[col0 + 1] ?? straightEdgeHandles(p10, p11);
  const bottom = cubicBezier(p00, bottomH[0], bottomH[1], p10, u);
  const right = cubicBezier(p10, rightV[0], rightV[1], p11, v);
  const top = cubicBezier(p01, topH[0], topH[1], p11, u);
  const left = cubicBezier(p00, leftV[0], leftV[1], p01, v);
  const bilinear: Vec2Tuple = [
    (1 - u) * (1 - v) * p00[0] + u * (1 - v) * p10[0] + (1 - u) * v * p01[0] + u * v * p11[0],
    (1 - u) * (1 - v) * p00[1] + u * (1 - v) * p10[1] + (1 - u) * v * p01[1] + u * v * p11[1],
  ];
  return [
    finiteOr((1 - v) * bottom[0] + v * top[0] + (1 - u) * left[0] + u * right[0] - bilinear[0], 0.5),
    finiteOr((1 - v) * bottom[1] + v * top[1] + (1 - u) * left[1] + u * right[1] - bilinear[1], 0.5),
  ];
}

function cubicBezierDerivative(
  p0: Vec2Tuple,
  p1: Vec2Tuple,
  p2: Vec2Tuple,
  p3: Vec2Tuple,
  t: number,
): Vec2Tuple {
  const mt = 1 - t;
  return [
    3 * mt * mt * (p1[0] - p0[0]) + 6 * mt * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]),
    3 * mt * mt * (p1[1] - p0[1]) + 6 * mt * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]),
  ];
}

/**
 * Partial derivatives of one cell's Coons evaluation with respect to its local
 * (u, v). Used by inverse (canvas → grid domain) solves.
 */
export function evaluateMeshCellDerivatives(
  mesh: MeshGradientConfig,
  cellRow: number,
  cellCol: number,
  u: number,
  v: number,
): { du: Vec2Tuple; dv: Vec2Tuple } {
  const { rows, columns, points, edgeHandles } = mesh;
  const row0 = Math.max(0, Math.min(rows - 2, Math.floor(cellRow)));
  const col0 = Math.max(0, Math.min(columns - 2, Math.floor(cellCol)));
  const p00 = points[row0 * columns + col0];
  const p10 = points[row0 * columns + col0 + 1];
  const p01 = points[(row0 + 1) * columns + col0];
  const p11 = points[(row0 + 1) * columns + col0 + 1];
  const bottomH = edgeHandles.horizontal[row0]?.[col0] ?? straightEdgeHandles(p00, p10);
  const topH = edgeHandles.horizontal[row0 + 1]?.[col0] ?? straightEdgeHandles(p01, p11);
  const leftV = edgeHandles.vertical[row0]?.[col0] ?? straightEdgeHandles(p00, p01);
  const rightV = edgeHandles.vertical[row0]?.[col0 + 1] ?? straightEdgeHandles(p10, p11);

  const bottom = cubicBezier(p00, bottomH[0], bottomH[1], p10, u);
  const right = cubicBezier(p10, rightV[0], rightV[1], p11, v);
  const top = cubicBezier(p01, topH[0], topH[1], p11, u);
  const left = cubicBezier(p00, leftV[0], leftV[1], p01, v);
  const bottomD = cubicBezierDerivative(p00, bottomH[0], bottomH[1], p10, u);
  const rightD = cubicBezierDerivative(p10, rightV[0], rightV[1], p11, v);
  const topD = cubicBezierDerivative(p01, topH[0], topH[1], p11, u);
  const leftD = cubicBezierDerivative(p00, leftV[0], leftV[1], p01, v);

  // d/du of the bilinear term.
  const dBilinU: Vec2Tuple = [
    (1 - v) * (p10[0] - p00[0]) + v * (p11[0] - p01[0]),
    (1 - v) * (p10[1] - p00[1]) + v * (p11[1] - p01[1]),
  ];
  // d/dv of the bilinear term.
  const dBilinV: Vec2Tuple = [
    (1 - u) * (p01[0] - p00[0]) + u * (p11[0] - p10[0]),
    (1 - u) * (p01[1] - p00[1]) + u * (p11[1] - p10[1]),
  ];

  return {
    du: [
      finiteOr((1 - v) * bottomD[0] + v * topD[0] - left[0] + right[0] - dBilinU[0], 1),
      finiteOr((1 - v) * bottomD[1] + v * topD[1] - left[1] + right[1] - dBilinU[1], 0),
    ],
    dv: [
      finiteOr(-bottom[0] + top[0] + (1 - u) * leftD[0] + u * rightD[0] - dBilinV[0], 0),
      finiteOr(-bottom[1] + top[1] + (1 - u) * leftD[1] + u * rightD[1] - dBilinV[1], 1),
    ],
  };
}

/**
 * Evaluate the whole grid at a global 0..1 domain position by locating the
 * containing cell. For the legacy 2×2 grid this matches the original single
 * Coons patch evaluation.
 */
export function evaluateMeshPatch(mesh: MeshGradientConfig, u: number, v: number): Vec2Tuple {
  const normalized = normalizeMeshGradientConfig(mesh);
  const { rows, columns } = normalized;
  const domainU = clamp01(u) * (columns - 1);
  const domainV = clamp01(v) * (rows - 1);
  const cellCol = Math.max(0, Math.min(columns - 2, Math.floor(domainU)));
  const cellRow = Math.max(0, Math.min(rows - 2, Math.floor(domainV)));
  return evaluateMeshCell(normalized, cellRow, cellCol, domainU - cellCol, domainV - cellRow);
}

/**
 * Resolve one tessellation sample's color. Direct mode bilinearly interpolates
 * the four grid-point colors that bound a cell. Ramp mode samples the shared
 * ramp continuously along the global logical v axis, so intermediate stops are
 * not lost between grid rows.
 */
function cellVertexColor(
  mesh: MeshGradientConfig,
  rampData: Uint8Array,
  rampWidth: number,
  cellRow: number,
  cellCol: number,
  u: number,
  v: number,
): Rgba {
  if (mesh.colorMode === 'ramp') {
    // Ramp mode is a continuous field over the mesh's logical v axis. The
    // previous implementation sampled only the four cell corners and then
    // bilinearly interpolated those colors, which skipped every ramp stop
    // between two grid rows (especially obvious in the default 2x2 mesh).
    // Sample the same ramp texture at each tessellated parametric position so
    // the canvas uses the same color progression that the ramp displays.
    const globalV = mesh.rows <= 1 ? 0 : (cellRow + clamp01(v)) / (mesh.rows - 1);
    return sampleRamp(rampData, rampWidth, globalV);
  }

  const colors = cellCornerColors(mesh, rampData, rampWidth, cellRow, cellCol);
  const bottom = colors[0].map((value, index) => lerp(value, colors[1][index], u));
  const top = colors[2].map((value, index) => lerp(value, colors[3][index], u));
  return top.map((value, index) => lerp(bottom[index], value, v)) as Rgba;
}

/** Resolve the four corner grid-point colors of a cell (BL, BR, TL, TR). */
function cellCornerColors(
  mesh: MeshGradientConfig,
  rampData: Uint8Array,
  rampWidth: number,
  cellRow: number,
  cellCol: number,
): [Rgba, Rgba, Rgba, Rgba] {
  return [
    gridPointColor(mesh, rampData, rampWidth, cellRow, cellCol),
    gridPointColor(mesh, rampData, rampWidth, cellRow, cellCol + 1),
    gridPointColor(mesh, rampData, rampWidth, cellRow + 1, cellCol),
    gridPointColor(mesh, rampData, rampWidth, cellRow + 1, cellCol + 1),
  ];
}

function writeColor(output: Uint8Array, offset: number, color: Rgba): void {
  output[offset] = Math.max(0, Math.min(255, Math.round(finiteOr(color[0], 0))));
  output[offset + 1] = Math.max(0, Math.min(255, Math.round(finiteOr(color[1], 0))));
  output[offset + 2] = Math.max(0, Math.min(255, Math.round(finiteOr(color[2], 0))));
  output[offset + 3] = Math.max(0, Math.min(255, Math.round(finiteOr(color[3], 255))));
}

function rasterizeTriangle(
  output: Uint8Array,
  width: number,
  height: number,
  a: Vec2Tuple,
  b: Vec2Tuple,
  c: Vec2Tuple,
  ca: Rgba,
  cb: Rgba,
  cc: Rgba,
): void {
  const minX = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0]) * width - 0.5));
  const maxX = Math.min(width - 1, Math.ceil(Math.max(a[0], b[0], c[0]) * width - 0.5));
  const minY = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1]) * height - 0.5));
  const maxY = Math.min(height - 1, Math.ceil(Math.max(a[1], b[1], c[1]) * height - 0.5));
  if (minX > maxX || minY > maxY) return;

  const determinant = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
  if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-8) return;

  for (let y = minY; y <= maxY; y += 1) {
    const sampleY = (y + 0.5) / height;
    for (let x = minX; x <= maxX; x += 1) {
      const sampleX = (x + 0.5) / width;
      const weightA = ((b[1] - c[1]) * (sampleX - c[0]) + (c[0] - b[0]) * (sampleY - c[1])) / determinant;
      const weightB = ((c[1] - a[1]) * (sampleX - c[0]) + (a[0] - c[0]) * (sampleY - c[1])) / determinant;
      const weightC = 1 - weightA - weightB;
      if (weightA < -1e-6 || weightB < -1e-6 || weightC < -1e-6) continue;
      const offset = (y * width + x) * 4;
      writeColor(output, offset, [
        weightA * ca[0] + weightB * cb[0] + weightC * cc[0],
        weightA * ca[1] + weightB * cb[1] + weightC * cc[1],
        weightA * ca[2] + weightB * cb[2] + weightC * cc[2],
        weightA * ca[3] + weightB * cb[3] + weightC * cc[3],
      ]);
    }
  }
}

/** Per-cell subdivision budget from the whole-grid reference subdivisions. */
function perCellSubdivisions(mesh: MeshGradientConfig, requested?: number): number {
  const budget = Math.max(1, Math.min(64, Math.floor(requested ?? MESH_FIELD_SUBDIVISIONS)));
  const maxCells = Math.max(mesh.rows - 1, mesh.columns - 1, 1);
  return Math.max(1, Math.ceil(budget / maxCells));
}

/**
 * Rasterize a forward-tessellated grid of Coons patches into a
 * bottom-left-origin RGBA field. The fallback fill keeps the texture opaque
 * even when a deliberately self-intersecting patch leaves holes between
 * forward triangles.
 */
export function buildMeshGradientField(
  inputMesh: MeshGradientConfig,
  rampData: Uint8Array,
  rampWidth: number,
  options: MeshGradientFieldOptions = {},
): Uint8Array {
  const mesh = normalizeMeshGradientConfig(inputMesh);
  const width = Math.max(1, Math.floor(options.width ?? MESH_FIELD_SIZE));
  const height = Math.max(1, Math.floor(options.height ?? width));
  const perCell = perCellSubdivisions(mesh, options.subdivisions);
  const output = new Uint8Array(width * height * 4);

  // Fill with a stable bilinear field first. This is also the deterministic
  // behavior for pixels outside an intentionally folded/degenerate patch.
  const cornerColors = [
    gridPointColor(mesh, rampData, rampWidth, 0, 0),
    gridPointColor(mesh, rampData, rampWidth, 0, mesh.columns - 1),
    gridPointColor(mesh, rampData, rampWidth, mesh.rows - 1, 0),
    gridPointColor(mesh, rampData, rampWidth, mesh.rows - 1, mesh.columns - 1),
  ];
  for (let y = 0; y < height; y += 1) {
    const v = height === 1 ? 0 : y / (height - 1);
    for (let x = 0; x < width; x += 1) {
      const u = width === 1 ? 0 : x / (width - 1);
      const bottom = cornerColors[0].map((value, index) => lerp(value, cornerColors[1][index], u));
      const top = cornerColors[2].map((value, index) => lerp(value, cornerColors[3][index], u));
      writeColor(output, (y * width + x) * 4, top.map((value, index) => lerp(bottom[index], value, v)) as Rgba);
    }
  }

  for (let cellRow = 0; cellRow < mesh.rows - 1; cellRow += 1) {
    for (let cellCol = 0; cellCol < mesh.columns - 1; cellCol += 1) {
      const points: Vec2Tuple[][] = [];
      const colors: Rgba[][] = [];
      for (let y = 0; y <= perCell; y += 1) {
        const v = y / perCell;
        const pointRow: Vec2Tuple[] = [];
        const colorRow: Rgba[] = [];
        for (let x = 0; x <= perCell; x += 1) {
          const u = x / perCell;
          pointRow.push(evaluateMeshCell(mesh, cellRow, cellCol, u, v));
          colorRow.push(cellVertexColor(mesh, rampData, rampWidth, cellRow, cellCol, u, v));
        }
        points.push(pointRow);
        colors.push(colorRow);
      }

      for (let y = 0; y < perCell; y += 1) {
        for (let x = 0; x < perCell; x += 1) {
          const p00 = points[y][x];
          const p10 = points[y][x + 1];
          const p01 = points[y + 1][x];
          const p11 = points[y + 1][x + 1];
          rasterizeTriangle(output, width, height, p00, p10, p11, colors[y][x], colors[y][x + 1], colors[y + 1][x + 1]);
          rasterizeTriangle(output, width, height, p00, p11, p01, colors[y][x], colors[y + 1][x + 1], colors[y + 1][x]);
        }
      }
    }
  }

  return output;
}
