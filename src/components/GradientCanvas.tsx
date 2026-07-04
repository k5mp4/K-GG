import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useGradientStore } from '../store/gradientStore';
import { AnimationLoop } from '../lib/animation';
import { useWebGL } from '../hooks/useWebGL';
import { useSdfUpdate } from '../hooks/useSdfUpdate';
import { buildRampTextureData, RAMP_TEX_WIDTH } from '../lib/gradientRampUtils';
import { setTimelineTime } from '../lib/timelineClock';
import { hasActiveAnimation } from '../lib/sceneEvaluation';
import { renderSceneAtTime } from '../lib/renderSceneAtTime';
import { LatestFrameScheduler } from '../lib/latestFrameScheduler';
import type { GradientConfig } from '../types/gradient';

const FALLBACK_PREVIEW_MAX_W = 360;
const FALLBACK_PREVIEW_MAX_H = 240;

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function fract(v: number): number {
  return v - Math.floor(v);
}

function dot2(ax: number, ay: number, bx: number, by: number): number {
  return ax * bx + ay * by;
}

function len2(x: number, y: number): number {
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
  const l = len2(x, y);
  if (l >= 1e-5) return [x / l, y / l];
  const fallbackLen = len2(fallbackX, fallbackY);
  return fallbackLen < 1e-5 ? [0, 1] : [fallbackX / fallbackLen, fallbackY / fallbackLen];
}

function fallbackBezierT(gradient: GradientConfig, x: number, y: number, width: number, height: number): number {
  const anchors = gradient.anchors ?? [[0.5, 0], [0.5, 1], [0.5, 0.5], [0.5, 0.5]];
  const controls = gradient.bezierControls ?? [[anchors[0][0], anchors[0][1]], [anchors[1][0], anchors[1][1]]];
  const p0: [number, number] = [anchors[0][0] * width, anchors[0][1] * height];
  const p1: [number, number] = [controls[0][0] * width, controls[0][1] * height];
  const p2: [number, number] = [controls[1][0] * width, controls[1][1] * height];
  const p3: [number, number] = [anchors[1][0] * width, anchors[1][1] * height];
  const target: [number, number] = [x * width, y * height];
  const axisLen = Math.max(
    len2(p1[0] - p0[0], p1[1] - p0[1]) + len2(p2[0] - p1[0], p2[1] - p1[1]) + len2(p3[0] - p2[0], p3[1] - p2[1]),
    len2(p3[0] - p0[0], p3[1] - p0[1]),
    1,
  );
  let bestT = 0;
  let bestD = Number.POSITIVE_INFINITY;

  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const p = cubicBezierPoint(p0, p1, p2, p3, t);
    const dx = target[0] - p[0];
    const dy = target[1] - p[1];
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      bestD = d;
      bestT = t;
    }
  }

  let t = bestT;
  for (let i = 0; i < 6; i++) {
    const p = cubicBezierPoint(p0, p1, p2, p3, t);
    const d1 = cubicBezierDerivative(p0, p1, p2, p3, t);
    const d2 = cubicBezierSecondDerivative(p0, p1, p2, p3, t);
    const rx = p[0] - target[0];
    const ry = p[1] - target[1];
    const denom = dot2(d1[0], d1[1], d1[0], d1[1]) + dot2(rx, ry, d2[0], d2[1]);
    if (Math.abs(denom) > 1e-5) {
      t = clamp01(t - dot2(rx, ry, d1[0], d1[1]) / denom);
    }
  }

  const curvePoint = cubicBezierPoint(p0, p1, p2, p3, t);
  bestD = dot2(target[0] - curvePoint[0], target[1] - curvePoint[1], target[0] - curvePoint[0], target[1] - curvePoint[1]);
  bestT = t;

  const startDeriv = cubicBezierDerivative(p0, p1, p2, p3, 0);
  const startDir = normalize2(startDeriv[0], startDeriv[1], p3[0] - p0[0], p3[1] - p0[1]);
  const startS = dot2(target[0] - p0[0], target[1] - p0[1], startDir[0], startDir[1]);
  if (startS < 0) {
    const startDx = target[0] - (p0[0] + startDir[0] * startS);
    const startDy = target[1] - (p0[1] + startDir[1] * startS);
    const startD = startDx * startDx + startDy * startDy;
    if (startD < bestD) {
      bestD = startD;
      bestT = startS / axisLen;
    }
  }

  const endDeriv = cubicBezierDerivative(p0, p1, p2, p3, 1);
  const endDir = normalize2(endDeriv[0], endDeriv[1], p3[0] - p0[0], p3[1] - p0[1]);
  const endS = dot2(target[0] - p3[0], target[1] - p3[1], endDir[0], endDir[1]);
  if (endS > 0) {
    const endDx = target[0] - (p3[0] + endDir[0] * endS);
    const endDy = target[1] - (p3[1] + endDir[1] * endS);
    const endD = endDx * endDx + endDy * endDy;
    if (endD < bestD) {
      bestT = 1 + endS / axisLen;
    }
  }

  return Number.isFinite(bestT) ? bestT : 0;
}

function fallbackGradientT(gradient: GradientConfig, x: number, y: number, width: number, height: number): number {
  const type = gradient.gradientType ?? 'linear';
  const anchors = gradient.anchors ?? [[0.5, 0], [0.5, 1], [0.5, 0.5], [0.5, 0.5]];
  if (type === 'radial') {
    const [ax, ay] = anchors[0] ?? [0.5, 0.5];
    const [bx, by] = anchors[1] ?? [1, 0.5];
    const cx = (x - ax) * width;
    const cy = (y - ay) * height;
    const rx = (bx - ax) * width;
    const ry = (by - ay) * height;
    return clamp01(len2(cx, cy) / Math.max(len2(rx, ry), 0.001));
  }
  if (type === 'diamond') {
    const [ax, ay] = anchors[0] ?? [0.5, 0.5];
    const [bx, by] = anchors[1] ?? [1, 0.5];
    const refX = bx - ax;
    const refY = by - ay;
    const refLen = len2(refX, refY);
    if (refLen < 0.00001) return 0;
    const refNX = refX / refLen;
    const refNY = refY / refLen;
    const cx = x - ax;
    const cy = y - ay;
    const rotX = dot2(cx, cy, refNX, refNY);
    const rotY = dot2(cx, cy, -refNY, refNX);
    return clamp01((Math.abs(rotX) + Math.abs(rotY)) / Math.max(refLen, 0.001));
  }
  if (type === 'angle') {
    const [ax, ay] = anchors[0] ?? [0.5, 0.5];
    const [bx, by] = anchors[1] ?? [1, 0.5];
    const cx = x - ax;
    const cy = y - ay;
    if (dot2(cx, cy, cx, cy) < 0.00001) return 0;
    const startAngle = Math.atan2(by - ay, bx - ax);
    return fract((Math.atan2(cy, cx) - startAngle) / (Math.PI * 2) + 0.5);
  }
  if (type === 'fourcolor') {
    const weights = anchors.map(([ax, ay]) => 1 / Math.max(dot2(x - ax, y - ay, x - ax, y - ay), 0.0001));
    const total = weights.reduce((sum, w) => sum + w, 0);
    return clamp01((weights[1] * (1 / 3) + weights[2] * (2 / 3) + weights[3]) / total);
  }
  if (type === 'bezier') {
    return clamp01(fallbackBezierT(gradient, x, y, width, height));
  }
  if (type === 'linear') {
    const [ax, ay] = anchors[0] ?? [0.5, 0];
    const [bx, by] = anchors[1] ?? [0.5, 1];
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq > 0.000001) {
      return clamp01(((x - ax) * dx + (y - ay) * dy) / lenSq);
    }
  }
  return 0;
}

function fallbackSampleColor(gradient: GradientConfig, rampData: Uint8Array, x: number, y: number, width: number, height: number): [number, number, number, number] {
  const t = fallbackGradientT(gradient, clamp01(x), clamp01(y), width, height);
  const i = Math.max(0, Math.min(RAMP_TEX_WIDTH - 1, Math.round(t * (RAMP_TEX_WIDTH - 1)))) * 4;
  return [rampData[i], rampData[i + 1], rampData[i + 2], rampData[i + 3]];
}

function renderFallbackPreview(
  canvas: HTMLCanvasElement,
  gradient: GradientConfig,
  width: number,
  height: number,
): void {
  const aspect = Math.max(width / Math.max(height, 1), 0.01);
  const previewW = Math.max(1, Math.min(FALLBACK_PREVIEW_MAX_W, Math.round(aspect >= 1 ? FALLBACK_PREVIEW_MAX_W : FALLBACK_PREVIEW_MAX_H * aspect)));
  const previewH = Math.max(1, Math.min(FALLBACK_PREVIEW_MAX_H, Math.round(previewW / aspect)));
  if (canvas.width !== previewW) canvas.width = previewW;
  if (canvas.height !== previewH) canvas.height = previewH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const rampData = buildRampTextureData(
    gradient.stops,
    gradient.rampInterpolation,
    gradient.rampMirror ?? false,
    gradient.opacityStops,
    gradient.rampColorMode,
    gradient.rampVariable ?? 0,
    gradient.rampRepeat ?? 1,
  );
  const image = ctx.createImageData(previewW, previewH);
  const data = image.data;
  for (let py = 0; py < previewH; py++) {
    for (let px = 0; px < previewW; px++) {
      const sx = (px + 0.5) / previewW;
      const sy = 1 - ((py + 0.5) / previewH);
      const [r, g, b, a] = fallbackSampleColor(gradient, rampData, sx, sy, previewW, previewH);
      const i = (py * previewW + px) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
  }
  ctx.putImageData(image, 0, 0);
}

type Props = {
  width?: number;
  height?: number;
  animLoopRef: React.MutableRefObject<AnimationLoop | null>;
  seekVersion?: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  sourceImageCanvas?: HTMLCanvasElement | null;
  imageMaskSource?: TexImageSource | null;
  imageMaskEnabled?: boolean;
};

export function GradientCanvas({ width = 800, height = 800, animLoopRef, seekVersion = 0, canvasRef, sourceImageCanvas = null, imageMaskSource = null, imageMaskEnabled = false }: Props) {
  const fallbackCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const staticRenderSchedulerRef = useRef<LatestFrameScheduler | null>(null);
  if (!staticRenderSchedulerRef.current) {
    staticRenderSchedulerRef.current = new LatestFrameScheduler();
  }

  const { gradient, noiseDistortion, diffuse, bezierAxis, slitScan, stretch, animation, normalMap, radon, iridescence, manualDistort, postprocess, matcap, keyframeTracks, currentTime } = useGradientStore();

  const { webglRef, sdfReadyRef, latestRef, isWebGLReady } = useWebGL(canvasRef, animLoopRef, gradient);

  // SDF 生成完了時に静的レンダーを再実行するためのカウンター
  const [sdfGenCount, setSdfGenCount] = useState(0);
  const onSdfReady = useCallback(() => setSdfGenCount(c => c + 1), []);
  const [lazyProgramReadyCount, setLazyProgramReadyCount] = useState(0);

  useEffect(() => {
    if (isWebGLReady) return;
    const canvas = fallbackCanvasRef.current;
    if (!canvas) return;
    renderFallbackPreview(canvas, gradient, width, height);
  }, [isWebGLReady, gradient, width, height]);

  useEffect(() => {
    const handleReady = () => setLazyProgramReadyCount(c => c + 1);
    window.addEventListener('kgg:webgl-lazy-program-ready', handleReady);
    return () => window.removeEventListener('kgg:webgl-lazy-program-ready', handleReady);
  }, []);

  useEffect(() => () => {
    staticRenderSchedulerRef.current?.cancel();
  }, []);

  // latestRef を毎レンダー更新（ブラウザ描画前に同期更新し、RAFループが即座に最新値を参照できるようにする）
  useLayoutEffect(() => {
    latestRef.current = { gradient, noiseDistortion, diffuse, bezierAxis, slitScan, stretch, normalMap, radon, iridescence, manualDistort, postprocess, matcap, animation, keyframeTracks, width, height, animDirection: animation.direction, sourceImageCanvas, imageMaskSource, imageMaskEnabled };
  });

  useSdfUpdate(webglRef, sdfReadyRef, latestRef, bezierAxis.paths, bezierAxis.enabled, width, height, onSdfReady);

  // 静止レンダリング（アニメーション停止中の状態変化に反応）
  useLayoutEffect(() => {
    const latest = latestRef.current;
    if (!webglRef.current || !latest) return;
    const isPaused = animLoopRef.current?.isPaused ?? false;
    if (hasActiveAnimation(latest) && !isPaused) return;
    staticRenderSchedulerRef.current?.schedule(() => {
      const ctx = webglRef.current;
      const frameState = latestRef.current;
      if (!ctx || !frameState) return;
      const frameIsPaused = animLoopRef.current?.isPaused ?? false;
      if (hasActiveAnimation(frameState) && !frameIsPaused) return;
      const normalizedTime = frameState.animation.enabled
        ? (animLoopRef.current?.currentNormalizedTime ?? useGradientStore.getState().currentTime)
        : 0;
      renderSceneAtTime(ctx, frameState, normalizedTime, { sdfReady: sdfReadyRef.current });
    });
  }, [gradient, noiseDistortion, diffuse, bezierAxis, slitScan, stretch, normalMap, radon, iridescence, manualDistort, postprocess, width, height, animation.enabled, animation.speed, animation.direction, animation.easing, animation.affectNoise, animation.affectSlit, animation.affectRamp, animation.affectStretch, keyframeTracks, currentTime, sdfGenCount, lazyProgramReadyCount, seekVersion, isWebGLReady, sourceImageCanvas, imageMaskSource, imageMaskEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // アニメーションループの管理
  useEffect(() => {
    if (!webglRef.current) return;
    const resumeTime = animLoopRef.current?.currentNormalizedTime ?? currentTime;
    animLoopRef.current?.stop();
    animLoopRef.current = null;
    const latest = latestRef.current;
    if (latest && hasActiveAnimation(latest)) {
      animLoopRef.current = new AnimationLoop(
        animation.duration,
        (_loopTime, normalizedTime) => {
          setTimelineTime(normalizedTime);
          const ctx = webglRef.current;
          const frameState = latestRef.current;
          if (!ctx || !frameState) return;
          renderSceneAtTime(ctx, frameState, normalizedTime, { sdfReady: sdfReadyRef.current });
        },
        {
          loop: animation.previewLoop ?? true,
          onEnd: () => useGradientStore.getState().setCurrentTime(1),
        },
      );

      animLoopRef.current.start();
      if (resumeTime > 0 && resumeTime < 1) animLoopRef.current.seekTo(resumeTime);
    } else if (latest) {
      // effectMode/Motion切替時も静止描画を同期発行しない。
      // 上のlayout effectと同じフレームへ集約し、WebView2へ二重描画を投入しない。
      staticRenderSchedulerRef.current?.schedule(() => {
        const ctx = webglRef.current;
        const frameState = latestRef.current;
        if (!ctx || !frameState || hasActiveAnimation(frameState)) return;
        renderSceneAtTime(ctx, frameState, frameState.animation.enabled
          ? useGradientStore.getState().currentTime
          : 0, {
          sdfReady: sdfReadyRef.current,
        });
      });
    }
    return () => { animLoopRef.current?.stop(); };
  }, [animation.enabled, animation.duration, animation.previewLoop, animation.speed, keyframeTracks, noiseDistortion.enabled, iridescence.enabled, radon.enabled, slitScan.enabled, stretch.enabled, diffuse.enabled, diffuse.seedAnimEnabled, postprocess.enabled, postprocess.effectMode, postprocess.glassMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {!isWebGLReady && (
        <canvas
          ref={fallbackCanvasRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'block',
            width: '100%',
            height: '100%',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      )}
      <div
        aria-live="polite"
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 9px',
          borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.16)',
          background: isWebGLReady ? 'rgba(7, 18, 15, 0.78)' : 'rgba(20, 20, 28, 0.82)',
          color: '#f4f7fb',
          boxShadow: '0 8px 24px rgba(0,0,0,0.24)',
          fontSize: 11,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: 0,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: 999,
            background: isWebGLReady ? '#36d399' : '#f59e0b',
            boxShadow: isWebGLReady ? '0 0 10px rgba(54,211,153,0.65)' : '0 0 10px rgba(245,158,11,0.65)',
            flex: '0 0 auto',
          }}
        />
        <span>{isWebGLReady ? 'GPU RENDER' : 'PREVIEW'}</span>
        {!isWebGLReady && (
          <span style={{ opacity: 0.68, fontWeight: 600 }}>BASE ONLY</span>
        )}
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-none shadow-2xl"
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          backgroundColor: '#3a3a3a',
          backgroundImage: 'repeating-conic-gradient(#555 0% 25%, #333 0% 50%)',
          backgroundSize: matcap.enabled ? '20px 20px' : '24px 24px',
        }}
      />
    </div>
  );
}
