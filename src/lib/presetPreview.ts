import { buildRampTextureData, RAMP_TEX_WIDTH } from './gradientRampUtils';
import { buildMeshGradientField } from './meshGradientField';
import { normalizeMeshGradientConfig, type GradientConfig, type MeshGradientConfig, type Vec2Tuple } from '../types/gradient';

const PREVIEW_MAX_WIDTH = 360;
const PREVIEW_MAX_HEIGHT = 240;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function fract(value: number): number {
  return value - Math.floor(value);
}

function dot2(ax: number, ay: number, bx: number, by: number): number {
  return ax * bx + ay * by;
}

function length2(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}

function cubicBezierPoint(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number,
): [number, number] {
  const mt = 1 - t;
  return [
    mt * mt * mt * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t * t * t * p3[0],
    mt * mt * mt * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t * t * t * p3[1],
  ];
}

function cubicBezierDerivative(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number,
): [number, number] {
  const mt = 1 - t;
  return [
    3 * mt * mt * (p1[0] - p0[0]) + 6 * mt * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]),
    3 * mt * mt * (p1[1] - p0[1]) + 6 * mt * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]),
  ];
}

function cubicBezierSecondDerivative(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number,
): [number, number] {
  return [
    6 * (1 - t) * (p2[0] - 2 * p1[0] + p0[0]) + 6 * t * (p3[0] - 2 * p2[0] + p1[0]),
    6 * (1 - t) * (p2[1] - 2 * p1[1] + p0[1]) + 6 * t * (p3[1] - 2 * p2[1] + p1[1]),
  ];
}

function normalize2(x: number, y: number, fallbackX: number, fallbackY: number): [number, number] {
  const length = length2(x, y);
  if (length >= 1e-5) return [x / length, y / length];
  const fallbackLength = length2(fallbackX, fallbackY);
  return fallbackLength < 1e-5 ? [0, 1] : [fallbackX / fallbackLength, fallbackY / fallbackLength];
}

function meshBezier(p0: Vec2Tuple, p1: Vec2Tuple, p2: Vec2Tuple, p3: Vec2Tuple, t: number): Vec2Tuple {
  const mt = 1 - t;
  return [
    mt * mt * mt * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t * t * t * p3[0],
    mt * mt * mt * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t * t * t * p3[1],
  ];
}

function meshBezierDerivative(p0: Vec2Tuple, p1: Vec2Tuple, p2: Vec2Tuple, p3: Vec2Tuple, t: number): Vec2Tuple {
  const mt = 1 - t;
  return [
    3 * mt * mt * (p1[0] - p0[0]) + 6 * mt * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]),
    3 * mt * mt * (p1[1] - p0[1]) + 6 * mt * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]),
  ];
}

function meshPatchPoint(mesh: MeshGradientConfig, u: number, v: number): Vec2Tuple {
  const [bl, br, tl, tr] = mesh.corners;
  const bottom = meshBezier(bl, mesh.handles.bottom[0], mesh.handles.bottom[1], br, u);
  const right = meshBezier(br, mesh.handles.right[0], mesh.handles.right[1], tr, v);
  const top = meshBezier(tl, mesh.handles.top[1], mesh.handles.top[0], tr, u);
  const left = meshBezier(bl, mesh.handles.left[1], mesh.handles.left[0], tl, v);
  const bilinear: Vec2Tuple = [
    (1 - u) * (1 - v) * bl[0] + u * (1 - v) * br[0] + (1 - u) * v * tl[0] + u * v * tr[0],
    (1 - u) * (1 - v) * bl[1] + u * (1 - v) * br[1] + (1 - u) * v * tl[1] + u * v * tr[1],
  ];
  return [
    (1 - v) * bottom[0] + v * top[0] + (1 - u) * left[0] + u * right[0] - bilinear[0],
    (1 - v) * bottom[1] + v * top[1] + (1 - u) * left[1] + u * right[1] - bilinear[1],
  ];
}

function meshPatchDerivatives(mesh: MeshGradientConfig, u: number, v: number): { du: Vec2Tuple; dv: Vec2Tuple } {
  const [bl, br, tl, tr] = mesh.corners;
  const bottom = meshBezier(bl, mesh.handles.bottom[0], mesh.handles.bottom[1], br, u);
  const right = meshBezier(br, mesh.handles.right[0], mesh.handles.right[1], tr, v);
  const top = meshBezier(tl, mesh.handles.top[1], mesh.handles.top[0], tr, u);
  const left = meshBezier(bl, mesh.handles.left[1], mesh.handles.left[0], tl, v);
  const bottomD = meshBezierDerivative(bl, mesh.handles.bottom[0], mesh.handles.bottom[1], br, u);
  const rightD = meshBezierDerivative(br, mesh.handles.right[0], mesh.handles.right[1], tr, v);
  const topD = meshBezierDerivative(tl, mesh.handles.top[1], mesh.handles.top[0], tr, u);
  const leftD = meshBezierDerivative(bl, mesh.handles.left[1], mesh.handles.left[0], tl, v);
  return {
    du: [
      (1 - v) * bottomD[0] + v * topD[0] - left[0] + right[0] - (-(1 - v) * bl[0] + (1 - v) * br[0] - v * tl[0] + v * tr[0]),
      (1 - v) * bottomD[1] + v * topD[1] - left[1] + right[1] - (-(1 - v) * bl[1] + (1 - v) * br[1] - v * tl[1] + v * tr[1]),
    ],
    dv: [
      -bottom[0] + top[0] + (1 - u) * leftD[0] + u * rightD[0] - (-(1 - u) * bl[0] - u * br[0] + (1 - u) * tl[0] + u * tr[0]),
      -bottom[1] + top[1] + (1 - u) * leftD[1] + u * rightD[1] - (-(1 - u) * bl[1] - u * br[1] + (1 - u) * tl[1] + u * tr[1]),
    ],
  };
}

function inversePreviewMeshUV(mesh: MeshGradientConfig, x: number, y: number): Vec2Tuple {
  let u = clamp01(x);
  let v = clamp01(y);
  for (let iteration = 0; iteration < 6; iteration += 1) {
    const point = meshPatchPoint(mesh, u, v);
    const derivatives = meshPatchDerivatives(mesh, u, v);
    const errorX = point[0] - x;
    const errorY = point[1] - y;
    const determinant = derivatives.du[0] * derivatives.dv[1] - derivatives.du[1] * derivatives.dv[0];
    if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-6) break;
    const deltaU = (derivatives.dv[1] * errorX - derivatives.dv[0] * errorY) / determinant;
    const deltaV = (-derivatives.du[1] * errorX + derivatives.du[0] * errorY) / determinant;
    if (!Number.isFinite(deltaU) || !Number.isFinite(deltaV)) break;
    u = Math.max(-0.25, Math.min(1.25, u - deltaU));
    v = Math.max(-0.25, Math.min(1.25, v - deltaV));
  }
  return [clamp01(Number.isFinite(u) ? u : x), clamp01(Number.isFinite(v) ? v : y)];
}

export function samplePreviewMeshUV(gradient: GradientConfig, x: number, y: number): Vec2Tuple {
  return inversePreviewMeshUV(normalizeMeshGradientConfig(gradient.mesh), x, y);
}

function sampleBezierT(gradient: GradientConfig, x: number, y: number, width: number, height: number): number {
  const anchors = gradient.anchors ?? [[0.5, 0], [0.5, 1], [0.5, 0.5], [0.5, 0.5]];
  const controls = gradient.bezierControls ?? [[anchors[0][0], anchors[0][1]], [anchors[1][0], anchors[1][1]]];
  const p0: [number, number] = [anchors[0][0] * width, anchors[0][1] * height];
  const p1: [number, number] = [controls[0][0] * width, controls[0][1] * height];
  const p2: [number, number] = [controls[1][0] * width, controls[1][1] * height];
  const p3: [number, number] = [anchors[1][0] * width, anchors[1][1] * height];
  const target: [number, number] = [x * width, y * height];
  const axisLength = Math.max(
    length2(p1[0] - p0[0], p1[1] - p0[1]) + length2(p2[0] - p1[0], p2[1] - p1[1]) + length2(p3[0] - p2[0], p3[1] - p2[1]),
    length2(p3[0] - p0[0], p3[1] - p0[1]),
    1,
  );
  let bestT = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const point = cubicBezierPoint(p0, p1, p2, p3, t);
    const dx = target[0] - point[0];
    const dy = target[1] - point[1];
    const distance = dx * dx + dy * dy;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestT = t;
    }
  }
  let t = bestT;
  for (let i = 0; i < 6; i++) {
    const point = cubicBezierPoint(p0, p1, p2, p3, t);
    const derivative = cubicBezierDerivative(p0, p1, p2, p3, t);
    const secondDerivative = cubicBezierSecondDerivative(p0, p1, p2, p3, t);
    const rx = point[0] - target[0];
    const ry = point[1] - target[1];
    const denominator = dot2(derivative[0], derivative[1], derivative[0], derivative[1]) + dot2(rx, ry, secondDerivative[0], secondDerivative[1]);
    if (Math.abs(denominator) > 1e-5) t = clamp01(t - dot2(rx, ry, derivative[0], derivative[1]) / denominator);
  }
  const curvePoint = cubicBezierPoint(p0, p1, p2, p3, t);
  bestDistance = dot2(target[0] - curvePoint[0], target[1] - curvePoint[1], target[0] - curvePoint[0], target[1] - curvePoint[1]);
  bestT = t;
  const startDerivative = cubicBezierDerivative(p0, p1, p2, p3, 0);
  const startDirection = normalize2(startDerivative[0], startDerivative[1], p3[0] - p0[0], p3[1] - p0[1]);
  const startS = dot2(target[0] - p0[0], target[1] - p0[1], startDirection[0], startDirection[1]);
  if (startS < 0) {
    const dx = target[0] - (p0[0] + startDirection[0] * startS);
    const dy = target[1] - (p0[1] + startDirection[1] * startS);
    if (dx * dx + dy * dy < bestDistance) bestT = startS / axisLength;
  }
  const endDerivative = cubicBezierDerivative(p0, p1, p2, p3, 1);
  const endDirection = normalize2(endDerivative[0], endDerivative[1], p3[0] - p0[0], p3[1] - p0[1]);
  const endS = dot2(target[0] - p3[0], target[1] - p3[1], endDirection[0], endDirection[1]);
  if (endS > 0) bestT = 1 + endS / axisLength;
  return Number.isFinite(bestT) ? bestT : 0;
}

export function samplePreviewGradientT(gradient: GradientConfig, x: number, y: number, width: number, height: number): number {
  const type = gradient.gradientType ?? 'linear';
  const anchors = gradient.anchors ?? [[0.5, 0], [0.5, 1], [0.5, 0.5], [0.5, 0.5]];
  if (type === 'radial') {
    const [ax, ay] = anchors[0] ?? [0.5, 0.5];
    const [bx, by] = anchors[1] ?? [1, 0.5];
    return clamp01(length2((x - ax) * width, (y - ay) * height) / Math.max(length2((bx - ax) * width, (by - ay) * height), 0.001));
  }
  if (type === 'diamond') {
    const [ax, ay] = anchors[0] ?? [0.5, 0.5];
    const [bx, by] = anchors[1] ?? [1, 0.5];
    const referenceLength = length2(bx - ax, by - ay);
    if (referenceLength < 0.00001) return 0;
    const refX = (bx - ax) / referenceLength;
    const refY = (by - ay) / referenceLength;
    return clamp01((Math.abs(dot2(x - ax, y - ay, refX, refY)) + Math.abs(dot2(x - ax, y - ay, -refY, refX))) / Math.max(referenceLength, 0.001));
  }
  if (type === 'angle') {
    const [ax, ay] = anchors[0] ?? [0.5, 0.5];
    const [bx, by] = anchors[1] ?? [1, 0.5];
    const cx = x - ax;
    const cy = y - ay;
    if (dot2(cx, cy, cx, cy) < 0.00001) return 0;
    return fract((Math.atan2(cy, cx) - Math.atan2(by - ay, bx - ax)) / (Math.PI * 2) + 0.5);
  }
  if (type === 'fourcolor') {
    const weights = anchors.map(([ax, ay]) => 1 / Math.max(dot2(x - ax, y - ay, x - ax, y - ay), 0.0001));
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    return clamp01((weights[1] * (1 / 3) + weights[2] * (2 / 3) + weights[3]) / total);
  }
  if (type === 'mesh') return samplePreviewMeshUV(gradient, x, y)[0];
  if (type === 'bezier') return clamp01(sampleBezierT(gradient, x, y, width, height));
  if (type === 'linear') {
    const [ax, ay] = anchors[0] ?? [0.5, 0];
    const [bx, by] = anchors[1] ?? [0.5, 1];
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared > 0.000001) return clamp01(((x - ax) * dx + (y - ay) * dy) / lengthSquared);
  }
  return 0;
}

export function renderFallbackPreview(canvas: HTMLCanvasElement, gradient: GradientConfig, width: number, height: number): void {
  const aspect = Math.max(width / Math.max(height, 1), 0.01);
  const previewWidth = Math.max(1, Math.min(PREVIEW_MAX_WIDTH, Math.round(aspect >= 1 ? PREVIEW_MAX_WIDTH : PREVIEW_MAX_HEIGHT * aspect)));
  const previewHeight = Math.max(1, Math.min(PREVIEW_MAX_HEIGHT, Math.round(previewWidth / aspect)));
  if (canvas.width !== previewWidth) canvas.width = previewWidth;
  if (canvas.height !== previewHeight) canvas.height = previewHeight;
  const context = canvas.getContext('2d');
  if (!context) return;
  const rampData = buildRampTextureData(
    gradient.stops,
    gradient.rampInterpolation,
    gradient.rampMirror ?? false,
    gradient.opacityStops,
    gradient.rampColorMode,
    gradient.rampVariable ?? 0,
    gradient.rampRepeat ?? 1,
  );
  const image = context.createImageData(previewWidth, previewHeight);
  const mesh = gradient.gradientType === 'mesh' ? normalizeMeshGradientConfig(gradient.mesh) : null;
  const meshField = mesh
    ? buildMeshGradientField(mesh, rampData, RAMP_TEX_WIDTH, { width: previewWidth, height: previewHeight })
    : null;
  for (let py = 0; py < previewHeight; py++) {
    for (let px = 0; px < previewWidth; px++) {
      const x = (px + 0.5) / previewWidth;
      const y = 1 - ((py + 0.5) / previewHeight);
      const rampOffset = (position: number) => Math.max(0, Math.min(RAMP_TEX_WIDTH - 1, Math.round(position * (RAMP_TEX_WIDTH - 1)))) * 4;
      const index = (py * previewWidth + px) * 4;
      if (meshField) {
        const fieldIndex = ((previewHeight - 1 - py) * previewWidth + px) * 4;
        image.data[index] = meshField[fieldIndex];
        image.data[index + 1] = meshField[fieldIndex + 1];
        image.data[index + 2] = meshField[fieldIndex + 2];
        image.data[index + 3] = meshField[fieldIndex + 3];
      } else {
        const offset = rampOffset(samplePreviewGradientT(gradient, x, y, previewWidth, previewHeight));
        image.data[index] = rampData[offset];
        image.data[index + 1] = rampData[offset + 1];
        image.data[index + 2] = rampData[offset + 2];
        image.data[index + 3] = rampData[offset + 3];
      }
    }
  }
  context.putImageData(image, 0, 0);
}
