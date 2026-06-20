import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useGradientStore } from '../store/gradientStore';
import { render } from '../lib/webgl';
import { AnimationLoop } from '../lib/animation';
import { useWebGL } from '../hooks/useWebGL';
import { useSdfUpdate } from '../hooks/useSdfUpdate';
import { applyTimeRemap } from '../lib/timeRemap';
import { interpolateKeyframes } from '../lib/keyframeInterpolator';
import { hexToRgb255, rgb255ToHex } from '../lib/gradientRampUtils';
import { withAnimatedDiffuseSeed } from '../lib/diffuseSeed';
import { setTimelineTime } from '../lib/timelineClock';
import type { GradientConfig } from '../types/gradient';
import type { StretchConfig } from '../types/distortion';
import type { PropertyTrack } from '../types/keyframe';

function applyGradientKeyframes(
  gradient: GradientConfig,
  keyframeTracks: Record<string, PropertyTrack>,
  normalizedTime: number
): GradientConfig {
  let result = gradient;

  // ── gradientStop.{stopId}.{position|r|g|b} / opacityStop.{stopId}.{position|opacity} ──
  const stopOverrides = new Map<string, { position?: number; r?: number; g?: number; b?: number }>();
  const opacityStopOverrides = new Map<string, { position?: number; opacity?: number }>();

  // ── gradientAnchor.{idx}.{x|y} ──
  const anchorOverrides = new Map<number, { x?: number; y?: number }>();

  for (const track of Object.values(keyframeTracks)) {
    if (!track.enabled || track.keyframes.length === 0) continue;
    const val = interpolateKeyframes(normalizedTime, track.keyframes);

    if (track.propertyId.startsWith('gradientStop.')) {
      const parts = track.propertyId.split('.');
      if (parts.length !== 3) continue;
      const stopId = parts[1]; const field = parts[2];
      let ov = stopOverrides.get(stopId);
      if (!ov) { ov = {}; stopOverrides.set(stopId, ov); }
      if (field === 'position') ov.position = val;
      else if (field === 'r') ov.r = val;
      else if (field === 'g') ov.g = val;
      else if (field === 'b') ov.b = val;
      continue;
    }

    if (track.propertyId.startsWith('opacityStop.')) {
      const parts = track.propertyId.split('.');
      if (parts.length !== 3) continue;
      const stopId = parts[1]; const field = parts[2];
      let ov = opacityStopOverrides.get(stopId);
      if (!ov) { ov = {}; opacityStopOverrides.set(stopId, ov); }
      if (field === 'position') ov.position = val;
      else if (field === 'opacity') ov.opacity = val;
      continue;
    }

    if (track.propertyId.startsWith('gradientAnchor.')) {
      const parts = track.propertyId.split('.');
      if (parts.length !== 3) continue;
      const idx = parseInt(parts[1], 10); const field = parts[2];
      if (isNaN(idx)) continue;
      let ov = anchorOverrides.get(idx);
      if (!ov) { ov = {}; anchorOverrides.set(idx, ov); }
      if (field === 'x') ov.x = val;
      else if (field === 'y') ov.y = val;
    }
  }

  if (stopOverrides.size > 0) {
    const newStops = result.stops.map(stop => {
      if (!stop.stopId) return stop;
      const ov = stopOverrides.get(stop.stopId);
      if (!ov) return stop;
      let next = { ...stop };
      if (ov.position !== undefined) next.position = Math.max(0, Math.min(1, ov.position));
      if (ov.r !== undefined || ov.g !== undefined || ov.b !== undefined) {
        const [baseR, baseG, baseB] = hexToRgb255(stop.color);
        next.color = rgb255ToHex(ov.r ?? baseR, ov.g ?? baseG, ov.b ?? baseB);
      }
      return next;
    });
    result = { ...result, stops: newStops };
  }

  if (opacityStopOverrides.size > 0 && result.opacityStops) {
    const newStops = result.opacityStops.map(stop => {
      if (!stop.stopId) return stop;
      const ov = opacityStopOverrides.get(stop.stopId);
      if (!ov) return stop;
      return {
        ...stop,
        ...(ov.position !== undefined ? { position: Math.max(0, Math.min(1, ov.position)) } : {}),
        ...(ov.opacity !== undefined ? { opacity: Math.max(0, Math.min(1, ov.opacity)) } : {}),
      };
    });
    result = { ...result, opacityStops: newStops };
  }

  if (anchorOverrides.size > 0 && result.anchors) {
    const newAnchors = result.anchors.map((anchor, idx) => {
      const ov = anchorOverrides.get(idx);
      if (!ov) return anchor;
      return [
        ov.x !== undefined ? Math.max(0, Math.min(1, ov.x)) : anchor[0],
        ov.y !== undefined ? Math.max(0, Math.min(1, ov.y)) : anchor[1],
      ] as [number, number];
    }) as typeof result.anchors;
    result = { ...result, anchors: newAnchors };
  }

  return result;
}

function applyStretchKeyframes(
  stretch: StretchConfig,
  keyframeTracks: Record<string, PropertyTrack>,
  normalizedTime: number
): StretchConfig {
  let result = stretch;
  for (const track of Object.values(keyframeTracks)) {
    if (!track.enabled || track.keyframes.length === 0) continue;
    const [, field] = track.propertyId.split('.');
    if (!track.propertyId.startsWith('stretch.') || !(field in stretch)) continue;
    const val = interpolateKeyframes(normalizedTime, track.keyframes);
    result = { ...result, [field]: val };
  }
  return result;
}

function applyDistortionKeyframes<T extends Record<string, unknown>>(
  category: string,
  value: T,
  keyframeTracks: Record<string, PropertyTrack>,
  normalizedTime: number
): T {
  let result = value;
  for (const track of Object.values(keyframeTracks)) {
    if (!track.enabled || track.keyframes.length === 0) continue;
    const [trackCategory, field] = track.propertyId.split('.');
    if (trackCategory !== category || !(field in value)) continue;
    const val = interpolateKeyframes(normalizedTime, track.keyframes);
    result = { ...result, [field]: val };
  }

  return result;
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
  const slitAnimRafRef = useRef<number | null>(null);
  const diffuseSeedFrameRef = useRef(0);

  const { gradient, noiseDistortion, diffuse, bezierAxis, slitScan, stretch, animation, normalMap, radon, iridescence, manualDistort, postprocess, matcap, keyframeTracks, currentTime } = useGradientStore();

  const { webglRef, sdfReadyRef, latestRef, isWebGLReady } = useWebGL(canvasRef, animLoopRef, gradient);

  // SDF 生成完了時に静的レンダーを再実行するためのカウンター
  const [sdfGenCount, setSdfGenCount] = useState(0);
  const onSdfReady = useCallback(() => setSdfGenCount(c => c + 1), []);

  // easingRef: アニメーションループのクロージャから常に最新の easing 値を参照するための ref
  const easingRef = useRef(animation.easing);
  useEffect(() => { easingRef.current = animation.easing; });

  // animAffectRef: アニメーションループから最新の対象設定を参照するための ref
  const animAffectRef = useRef({ affectNoise: animation.affectNoise, affectSlit: animation.affectSlit, affectStretch: animation.affectStretch });
  useEffect(() => { animAffectRef.current = { affectNoise: animation.affectNoise, affectSlit: animation.affectSlit, affectStretch: animation.affectStretch }; });

  // latestRef を毎レンダー更新（ブラウザ描画前に同期更新し、RAFループが即座に最新値を参照できるようにする）
  useLayoutEffect(() => {
    latestRef.current = { gradient, noiseDistortion, diffuse, bezierAxis, slitScan, stretch, normalMap, radon, iridescence, manualDistort, postprocess, matcap, animation, keyframeTracks, width, height, animDirection: animation.direction, sourceImageCanvas, imageMaskSource, imageMaskEnabled };
  });

  useSdfUpdate(webglRef, sdfReadyRef, latestRef, bezierAxis.paths, bezierAxis.enabled, width, height, onSdfReady);

  // 静止レンダリング（アニメーション停止中の状態変化に反応）
  useEffect(() => {
    if (!webglRef.current) return;
    const isPaused = animLoopRef.current?.isPaused ?? false;
    const diffuseSeedAnimActive = animation.enabled && diffuse.enabled && (diffuse.seedAnimEnabled ?? false);
    const prismAnimActive = postprocess.enabled && postprocess.effectMode === 'prism';
    const isPlaying = (animation.enabled && !isPaused && (
      (animation.affectNoise && (noiseDistortion.enabled || iridescence.enabled)) ||
      (animation.affectSlit && slitScan.enabled && slitScan.animEnabled) ||
      (animation.affectStretch && stretch.enabled) ||
      animation.affectRamp ||
      prismAnimActive
    )) || (diffuseSeedAnimActive && !isPaused);
    if (isPlaying) return;
    const effectiveBezier = bezierAxis.enabled && !sdfReadyRef.current
      ? { ...bezierAxis, enabled: false }
      : bezierAxis;
    let loopNT = 0;
    let easedNT = 0;
    if (isPaused) {
      loopNT = animLoopRef.current?.currentNormalizedTime ?? currentTime;
      easedNT = applyTimeRemap(loopNT, animation.duration, animation.easing);
    }
    const t = (animation.affectNoise || prismAnimActive) ? easedNT * animation.speed * animation.duration : 0;
    const effectiveGradient = animation.affectRamp
      ? applyGradientKeyframes(gradient, keyframeTracks, loopNT)
      : gradient;
    const noiseWithKeyframes = applyDistortionKeyframes('noiseDistortion', noiseDistortion, keyframeTracks, loopNT);
    const slitWithKeyframes = applyDistortionKeyframes('slitScan', slitScan, keyframeTracks, loopNT);
    const radonWithKeyframes = applyDistortionKeyframes('radon', radon, keyframeTracks, loopNT);
    const iridescenceWithKeyframes = applyDistortionKeyframes('iridescence', iridescence, keyframeTracks, loopNT);
    const stretchWithKeyframes = animation.affectStretch
      ? applyStretchKeyframes(stretch, keyframeTracks, loopNT)
      : stretch;
    const slitAnimTimeOverride = animation.affectSlit && slitWithKeyframes.animEnabled
      ? easedNT * animation.duration
      : null;
    render(webglRef.current, effectiveGradient, noiseWithKeyframes, withAnimatedDiffuseSeed(diffuse, 0), effectiveBezier, slitWithKeyframes, stretchWithKeyframes, normalMap, radonWithKeyframes, iridescenceWithKeyframes, manualDistort, postprocess, matcap, width, height, t, animation.direction, slitAnimTimeOverride, animation.affectStretch ? easedNT : null, undefined, sourceImageCanvas, Math.max(Math.abs(animation.speed * animation.duration), 0.0001), Math.abs(animation.speed), imageMaskSource, imageMaskEnabled);
  }, [gradient, noiseDistortion, diffuse, bezierAxis, slitScan, stretch, normalMap, radon, iridescence, manualDistort, postprocess, width, height, animation.enabled, animation.speed, animation.direction, animation.easing, animation.affectNoise, animation.affectSlit, animation.affectRamp, animation.affectStretch, keyframeTracks, currentTime, sdfGenCount, seekVersion, isWebGLReady, sourceImageCanvas, imageMaskSource, imageMaskEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // スリットスキャン独自アニメーションループ（メインアニメーション停止中に有効）
  useEffect(() => {
    if (slitAnimRafRef.current !== null) {
      cancelAnimationFrame(slitAnimRafRef.current);
      slitAnimRafRef.current = null;
    }
    const diffuseSeedAnimActive = animation.enabled && diffuse.enabled && (diffuse.seedAnimEnabled ?? false);
    const prismAnimActive = postprocess.enabled && postprocess.effectMode === 'prism';
    const mainAnimLoopActive = (animation.enabled && (
      (animation.affectNoise && (noiseDistortion.enabled || iridescence.enabled)) ||
      (animation.affectSlit && slitScan.enabled && slitScan.animEnabled) ||
      (animation.affectStretch && stretch.enabled) ||
      animation.affectRamp ||
      prismAnimActive
    )) || diffuseSeedAnimActive;
    const standaloneSlitActive = slitScan.animEnabled && (
      (slitScan.animMode !== 'off' && slitScan.offsetSpeed !== 0) ||
      ((slitScan.phaseAnimEnabled ?? false) && (slitScan.phaseSpeed ?? 0) !== 0)
    );
    if (!standaloneSlitActive || mainAnimLoopActive) return;
    const loop = () => {
      const ctx = webglRef.current;
      const latest = latestRef.current;
      if (ctx && latest) {
        const effectiveBezier = latest.bezierAxis.enabled && !sdfReadyRef.current
          ? { ...latest.bezierAxis, enabled: false }
          : latest.bezierAxis;
        const diffuseForFrame = withAnimatedDiffuseSeed(latest.diffuse, 0);
        render(ctx, latest.gradient, latest.noiseDistortion, diffuseForFrame, effectiveBezier, latest.slitScan, latest.stretch, latest.normalMap, latest.radon, latest.iridescence, latest.manualDistort, latest.postprocess, latest.matcap, latest.width, latest.height, 0, latest.animDirection, null, null, undefined, latest.sourceImageCanvas ?? null, undefined, 1, latest.imageMaskSource ?? null, latest.imageMaskEnabled ?? false);
      }
      slitAnimRafRef.current = requestAnimationFrame(loop);
    };
    slitAnimRafRef.current = requestAnimationFrame(loop);
    return () => {
      if (slitAnimRafRef.current !== null) {
        cancelAnimationFrame(slitAnimRafRef.current);
        slitAnimRafRef.current = null;
      }
    };
  }, [slitScan.animEnabled, slitScan.animMode, slitScan.offsetSpeed, slitScan.phaseAnimEnabled, slitScan.phaseSpeed, slitScan.enabled, animation.enabled, animation.affectNoise, animation.affectSlit, animation.affectStretch, stretch.enabled, noiseDistortion.enabled, iridescence.enabled, diffuse.enabled, diffuse.seedAnimEnabled, postprocess.enabled, postprocess.effectMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // アニメーションループの管理
  useEffect(() => {
    if (!webglRef.current) return;
    animLoopRef.current?.stop();
    animLoopRef.current = null;
    const diffuseSeedAnimActive = animation.enabled && diffuse.enabled && (diffuse.seedAnimEnabled ?? false);
    const prismAnimActive = postprocess.enabled && postprocess.effectMode === 'prism';
    if ((animation.enabled && (
      (animation.affectNoise && (noiseDistortion.enabled || iridescence.enabled)) ||
      (animation.affectSlit && slitScan.enabled && slitScan.animEnabled) ||
      (animation.affectStretch && stretch.enabled) ||
      animation.affectRamp ||
      prismAnimActive
    )) || diffuseSeedAnimActive) {
      animLoopRef.current = new AnimationLoop(
        animation.duration,
        (_loopTime, normalizedTime) => {
          setTimelineTime(normalizedTime);
          const ctx = webglRef.current;
          const latest = latestRef.current;
          if (!ctx || !latest) return;
          let easedNT = normalizedTime;
          const easing = easingRef.current;
          easedNT = applyTimeRemap(normalizedTime, animation.duration, easing);

          // キーフレーム補間を適用して最新値をクローン・上書き
          const keyframed = {
            gradient: latest.gradient,
            noiseDistortion: { ...latest.noiseDistortion },
            bezierAxis: { ...latest.bezierAxis },
            slitScan: { ...latest.slitScan },
            stretch: { ...latest.stretch },
            radon: { ...latest.radon },
            iridescence: { ...latest.iridescence },
          };

          // gradient 以外のプロパティトラックを適用
          Object.values(latest.keyframeTracks).forEach(track => {
            if (!track.enabled || track.keyframes.length === 0) return;
            if (track.propertyId.startsWith('gradientStop.') || track.propertyId.startsWith('opacityStop.') || track.propertyId.startsWith('gradientAnchor.')) return;
            const val = interpolateKeyframes(normalizedTime, track.keyframes);
            const [category, field] = track.propertyId.split('.') as [keyof typeof keyframed, string];
            if (keyframed[category as keyof typeof keyframed] && category !== 'gradient') {
              (keyframed[category as keyof typeof keyframed] as any)[field] = val;
            }
          });

          // gradient (ストップ + アンカー) のキーフレームを適用
          keyframed.gradient = applyGradientKeyframes(latest.gradient, latest.keyframeTracks, normalizedTime);

          const affect = animAffectRef.current;
          const framePrismAnimActive = latest.postprocess.enabled && latest.postprocess.effectMode === 'prism';
          const t = (affect.affectNoise || framePrismAnimActive) ? easedNT * animation.speed * animation.duration : 0;
          const slitAnimTimeOverride = affect.affectSlit && keyframed.slitScan.animEnabled
            ? easedNT * animation.duration
            : null;
          const effectiveBezier = keyframed.bezierAxis.enabled && !sdfReadyRef.current
            ? { ...keyframed.bezierAxis, enabled: false }
            : keyframed.bezierAxis;
          const diffuseForFrame = withAnimatedDiffuseSeed(latest.diffuse, diffuseSeedFrameRef.current++);
          render(ctx, keyframed.gradient, keyframed.noiseDistortion, diffuseForFrame, effectiveBezier, keyframed.slitScan, keyframed.stretch, latest.normalMap, keyframed.radon, keyframed.iridescence, latest.manualDistort, latest.postprocess, latest.matcap, latest.width, latest.height, t, latest.animDirection, slitAnimTimeOverride, affect.affectStretch ? easedNT : null, undefined, latest.sourceImageCanvas ?? null, Math.max(Math.abs(animation.speed * animation.duration), 0.0001), Math.abs(animation.speed), latest.imageMaskSource ?? null, latest.imageMaskEnabled ?? false);
        }
      );

      animLoopRef.current.start();
    } else {
      const ctx = webglRef.current;
      const latest = latestRef.current;
      if (ctx && latest) {
        const effectiveBezier = latest.bezierAxis.enabled && !sdfReadyRef.current
          ? { ...latest.bezierAxis, enabled: false }
          : latest.bezierAxis;
        render(ctx, latest.gradient, latest.noiseDistortion, withAnimatedDiffuseSeed(latest.diffuse, 0), effectiveBezier, latest.slitScan, latest.stretch, latest.normalMap, latest.radon, latest.iridescence, latest.manualDistort, latest.postprocess, latest.matcap, latest.width, latest.height, 0, latest.animDirection, null, null, undefined, latest.sourceImageCanvas ?? null, undefined, 1, latest.imageMaskSource ?? null, latest.imageMaskEnabled ?? false);
      }
    }
    return () => { animLoopRef.current?.stop(); };
  }, [animation.enabled, animation.duration, animation.speed, animation.affectNoise, animation.affectSlit, animation.affectRamp, animation.affectStretch, noiseDistortion.enabled, iridescence.enabled, slitScan.enabled, slitScan.animEnabled, stretch.enabled, diffuse.enabled, diffuse.seedAnimEnabled, postprocess.enabled, postprocess.effectMode]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {!isWebGLReady && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem', backgroundColor: '#13141f', zIndex: 1 }}>
          <div style={{ color: '#555', fontSize: '13px', letterSpacing: '0.05em' }}>Compiling shaders...</div>
        </div>
      )}
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
