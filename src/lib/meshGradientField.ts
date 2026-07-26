import { normalizeMeshGradientConfig, type MeshGradientConfig, type Vec2Tuple } from '../types/gradient';

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

/** Evaluate the same single Coons patch used by the reference renderers. */
export function evaluateMeshPatch(mesh: MeshGradientConfig, u: number, v: number): Vec2Tuple {
  const normalized = normalizeMeshGradientConfig(mesh);
  const [bl, br, tl, tr] = normalized.corners;
  const bottom = cubicBezier(bl, normalized.handles.bottom[0], normalized.handles.bottom[1], br, u);
  const right = cubicBezier(br, normalized.handles.right[0], normalized.handles.right[1], tr, v);
  const top = cubicBezier(tl, normalized.handles.top[1], normalized.handles.top[0], tr, u);
  const left = cubicBezier(bl, normalized.handles.left[1], normalized.handles.left[0], tl, v);
  const bilinear: Vec2Tuple = [
    (1 - u) * (1 - v) * bl[0] + u * (1 - v) * br[0] + (1 - u) * v * tl[0] + u * v * tr[0],
    (1 - u) * (1 - v) * bl[1] + u * (1 - v) * br[1] + (1 - u) * v * tl[1] + u * v * tr[1],
  ];
  return [
    finiteOr((1 - v) * bottom[0] + v * top[0] + (1 - u) * left[0] + u * right[0] - bilinear[0], 0.5),
    finiteOr((1 - v) * bottom[1] + v * top[1] + (1 - u) * left[1] + u * right[1] - bilinear[1], 0.5),
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

function meshVertexColor(mesh: MeshGradientConfig, rampData: Uint8Array, rampWidth: number, u: number, v: number): Rgba {
  const [bl, br, tl, tr] = mesh.colorPositions.map((position) => sampleRamp(rampData, rampWidth, position)) as [Rgba, Rgba, Rgba, Rgba];
  const bottom = bl.map((value, index) => lerp(value, br[index], u));
  const top = tl.map((value, index) => lerp(value, tr[index], u));
  return top.map((value, index) => lerp(bottom[index], value, v)) as Rgba;
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

/**
 * Rasterize a forward-tessellated Coons patch into a bottom-left-origin RGBA
 * field. The fallback fill keeps the texture opaque even when a deliberately
 * self-intersecting patch leaves holes between forward triangles.
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
  const subdivisions = Math.max(1, Math.min(64, Math.floor(options.subdivisions ?? MESH_FIELD_SUBDIVISIONS)));
  const output = new Uint8Array(width * height * 4);

  // Fill with a stable bilinear field first. This is also the deterministic
  // behavior for pixels outside an intentionally folded/degenerate patch.
  const cornerColors = mesh.colorPositions.map((position) => sampleRamp(rampData, rampWidth, position)) as [Rgba, Rgba, Rgba, Rgba];
  for (let y = 0; y < height; y += 1) {
    const v = height === 1 ? 0 : y / (height - 1);
    for (let x = 0; x < width; x += 1) {
      const u = width === 1 ? 0 : x / (width - 1);
      const bottom = cornerColors[0].map((value, index) => lerp(value, cornerColors[1][index], u));
      const top = cornerColors[2].map((value, index) => lerp(value, cornerColors[3][index], u));
      writeColor(output, (y * width + x) * 4, top.map((value, index) => lerp(bottom[index], value, v)) as Rgba);
    }
  }

  const points: Vec2Tuple[][] = [];
  const colors: Rgba[][] = [];
  for (let y = 0; y <= subdivisions; y += 1) {
    const v = y / subdivisions;
    const pointRow: Vec2Tuple[] = [];
    const colorRow: Rgba[] = [];
    for (let x = 0; x <= subdivisions; x += 1) {
      const u = x / subdivisions;
      pointRow.push(evaluateMeshPatch(mesh, u, v));
      colorRow.push(meshVertexColor(mesh, rampData, rampWidth, u, v));
    }
    points.push(pointRow);
    colors.push(colorRow);
  }

  for (let y = 0; y < subdivisions; y += 1) {
    for (let x = 0; x < subdivisions; x += 1) {
      const p00 = points[y][x];
      const p10 = points[y][x + 1];
      const p01 = points[y + 1][x];
      const p11 = points[y + 1][x + 1];
      rasterizeTriangle(output, width, height, p00, p10, p11, colors[y][x], colors[y][x + 1], colors[y + 1][x + 1]);
      rasterizeTriangle(output, width, height, p00, p11, p01, colors[y][x], colors[y + 1][x + 1], colors[y + 1][x]);
    }
  }

  return output;
}
