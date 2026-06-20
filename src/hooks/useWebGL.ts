import { useEffect, useRef, useReducer, useState } from 'react';
import { initWebGL, render, SHADER_VERSION } from '../lib/webgl';
import { generateDistanceMap, uploadDistanceMap } from '../lib/bezierAxis';
import { buildRampTextureData } from '../lib/gradientRampUtils';
import { renderBridge } from '../lib/renderBridge';
import { AnimationLoop } from '../lib/animation';
import { SDF_MAP_SIZE, RAMP_TEX_WIDTH } from '../lib/constants';
import { interpolateKeyframes } from '../lib/keyframeInterpolator';
import { applyTimeRemap } from '../lib/timeRemap';
import { withAnimatedDiffuseSeed } from '../lib/diffuseSeed';
import { useGradientStore } from '../store/gradientStore';
import type { WebGLContext } from '../lib/webgl';
import type { GradientConfig } from '../types/gradient';
import type { NoiseDistortionConfig, BezierAxisConfig, SlitScanConfig, StretchConfig, RadonConfig, IridescenceConfig } from '../types/distortion';
import type { LatestState } from '../types/latestState';

export function useWebGL(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  animLoopRef: React.MutableRefObject<AnimationLoop | null>,
  gradient: GradientConfig,
) {
  const webglRef = useRef<WebGLContext | null>(null);
  const sdfReadyRef = useRef(false);
  const latestRef = useRef<LatestState | null>(null);
  const initFailedRef = useRef(false);
  const initializingRef = useRef(false);
  const compiledShaderVersionRef = useRef(0); // コンパイル済みシェーダーのバージョン
  const [isWebGLReady, setIsWebGLReady] = useState(false);
  // abort 後に再試行をトリガーするためのカウンター（値は不使用、再レンダーだけが目的）
  const [, forceRetry] = useReducer((x: number) => x + 1, 0);

  // WebGL 初期化（非同期・stale チェック付き）
  useEffect(() => {
    if (!canvasRef.current) return;
    if (initFailedRef.current) return; // 初期化失敗後はリトライしない
    if (initializingRef.current) return; // 初期化中は重複実行しない
    // stale 検出: 古いコンテキストで必要な uniform が未登録なら再初期化
    // SHADER_VERSION が変わった場合（GLSL が HMR で更新された場合）も再初期化
    // キャンバスサイズ変更時も再初期化
    const stale = webglRef.current !== null && (
      webglRef.current.gl.canvas !== canvasRef.current ||
      webglRef.current.uniforms['u_bezierRadius'] === undefined ||
      webglRef.current.uniforms['u_iridEnabled'] === undefined ||
      webglRef.current.uniforms['u_manualDistortEnabled'] === undefined ||
      webglRef.current.uniforms['u_matcapEnabled'] === undefined ||
      webglRef.current.stretchProgram === undefined ||
      webglRef.current.postprocessProgram === undefined ||
      webglRef.current.blurProgram === undefined ||
      compiledShaderVersionRef.current !== SHADER_VERSION ||
      // キャンバスサイズが変更されたら再初期化
      (canvasRef.current && (
        webglRef.current.gl.canvas.width !== canvasRef.current.width ||
        webglRef.current.gl.canvas.height !== canvasRef.current.height
      ))
    );
    if (webglRef.current && !stale) return;

    initializingRef.current = true;
    if (stale) setIsWebGLReady(false);

    // cancelled フラグ: cleanup 時に true にするだけで rAF poll は止めない。
    // AbortController で poll を即停止すると init1 の GPU linkProgram が完了前に
    // init2 の linkProgram が走り、ドライバーによっては link failed（空メッセージ）が発生する。
    // poll を自然完了させることで GPU 上の link 操作を直列化し、この衝突を防ぐ。
    let cancelled = false;
    initWebGL(canvasRef.current).then(ctx => {
      if (cancelled) {
        // cleanup によるキャンセル: 結果を破棄してガードをリセットし再試行
        initializingRef.current = false;
        forceRetry();
        return;
      }
      webglRef.current = ctx;
      compiledShaderVersionRef.current = SHADER_VERSION;
      initFailedRef.current = false;
      initializingRef.current = false;
      if (stale && latestRef.current) {
        const latest = latestRef.current;
        sdfReadyRef.current = false;
        if (latest.bezierAxis.enabled && latest.bezierAxis.paths.some(p => p.anchors.length >= 2)) {
          const mapData = generateDistanceMap(latest.bezierAxis.paths, SDF_MAP_SIZE, SDF_MAP_SIZE, latest.width, latest.height);
          uploadDistanceMap(ctx.gl, mapData, SDF_MAP_SIZE, SDF_MAP_SIZE, ctx.distanceTexture);
          sdfReadyRef.current = true;
        }
      }
      setIsWebGLReady(true);
    }).catch(e => {
      if (cancelled) {
        // キャンセル済みの init が失敗しても initFailed にしない（次の init で再試行）
        initializingRef.current = false;
        forceRetry();
        return;
      }
      console.error('WebGL init failed:', e);
      initFailedRef.current = true;
      initializingRef.current = false;
    });

    return () => {
      // rAF poll は止めない（GPU linkProgram を自然完了させて次 init との衝突を防ぐ）。
      // initializingRef.current はここでリセットしない——.then()/.catch() でリセットされるまで
      // ガードを保持することで並行 initWebGL の乱立（CPU スパイク）を防ぐ。
      cancelled = true;
    };
  });

  // renderBridge への登録
  useEffect(() => {
    renderBridge.register(
      (t: number, nt?: number, tile?: import('../lib/webgl').TileRenderOptions) => {
        const ctx = webglRef.current;
        const latest = latestRef.current;
        if (!ctx || !latest) return;

        const anim = latest.animation || { enabled: false, speed: 1, duration: 1, direction: 1 };
        const totalDuration = (anim.speed ?? 1) * (anim.duration ?? 1) || 1;
        const baseNormalizedTime = nt !== undefined ? nt : (t / totalDuration);
        const loopNormalizedTime = baseNormalizedTime;
        const easedNormalizedTime = applyTimeRemap(loopNormalizedTime, anim.duration ?? 1, anim.easing);

        // キーフレーム補間を適用して最新値をクローン・上書き
        // すべてのプロパティに対して存在チェックを行い、なければ空オブジェクトで受ける
        const keyframed = {
          noiseDistortion: latest.noiseDistortion ? { ...latest.noiseDistortion } : {} as NoiseDistortionConfig,
          bezierAxis: latest.bezierAxis ? { ...latest.bezierAxis } : {} as BezierAxisConfig,
          slitScan: latest.slitScan ? { ...latest.slitScan } : {} as SlitScanConfig,
          stretch: latest.stretch ? { ...latest.stretch } : {} as StretchConfig,
          radon: latest.radon ? { ...latest.radon } : {} as RadonConfig,
          iridescence: latest.iridescence ? { ...latest.iridescence } : {} as IridescenceConfig,
        };
        
        if (latest.keyframeTracks) {
          Object.values(latest.keyframeTracks).forEach(track => {
            if (!track || !track.enabled || !track.keyframes || track.keyframes.length === 0) return;
            const val = interpolateKeyframes(loopNormalizedTime, track.keyframes);
            const parts = track.propertyId.split('.');
            if (parts.length !== 2) return;
            const category = parts[0] as keyof typeof keyframed;
            const field = parts[1];
            if (keyframed[category]) {
              (keyframed[category] as any)[field] = val;
            }
          });
        }

        const effectiveBezier = (keyframed.bezierAxis && keyframed.bezierAxis.enabled && !sdfReadyRef.current)
          ? { ...keyframed.bezierAxis, enabled: false }
          : keyframed.bezierAxis;

        // すべての引数が存在することを確認してからレンダー
        if (latest.gradient && keyframed.noiseDistortion && latest.diffuse && effectiveBezier && keyframed.slitScan && keyframed.stretch && latest.normalMap && keyframed.radon && keyframed.iridescence && latest.manualDistort && latest.postprocess && latest.matcap) {
          const prismAnimActive = latest.postprocess.enabled && latest.postprocess.effectMode === 'prism';
          const renderTime = anim.affectNoise || prismAnimActive
            ? easedNormalizedTime * (anim.speed ?? 1) * (anim.duration ?? 1)
            : 0;
          const noiseLoopPeriod = Math.max(Math.abs((anim.speed ?? 1) * (anim.duration ?? 1)), 0.0001);
          const slitAnimTimeOverride = anim.affectSlit && keyframed.slitScan.animEnabled
            ? easedNormalizedTime * (anim.duration ?? 1)
            : null;
          const seedFrame = anim.enabled
            ? Math.floor(baseNormalizedTime * (anim.duration ?? 1) * (anim.fps ?? 60))
            : 0;
          const diffuseForFrame = withAnimatedDiffuseSeed(latest.diffuse, seedFrame);
          render(
            ctx,
            latest.gradient,
            keyframed.noiseDistortion,
            diffuseForFrame,
            effectiveBezier,
            keyframed.slitScan,
            keyframed.stretch,
            latest.normalMap,
            keyframed.radon,
            keyframed.iridescence,
            latest.manualDistort,
            latest.postprocess,
            latest.matcap,
            latest.width || 800,
            latest.height || 600,
            renderTime,
            anim.direction ?? 1,
            slitAnimTimeOverride,
            latest.animation?.affectStretch ? easedNormalizedTime : null,
            tile,
            latest.sourceImageCanvas ?? null,
            noiseLoopPeriod,
            Math.abs(anim.speed ?? 1),
            latest.imageMaskSource ?? null,
            latest.imageMaskEnabled ?? false,
          );
        }
      },
      () => { animLoopRef.current?.stop(); },
      () => { animLoopRef.current?.start(); },
    );
    renderBridge.registerPause(
      () => {
        const loop = animLoopRef.current;
        if (!loop) return;
        loop.togglePause();
        useGradientStore.getState().setCurrentTime(loop.currentNormalizedTime);
      },
      () => animLoopRef.current?.isPaused ?? false,
      () => animLoopRef.current?.currentLoopTime ?? 0,
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // グラデーションランプテクスチャの更新
  useEffect(() => {
    const ctx = webglRef.current;
    if (!ctx) return;
    const data = buildRampTextureData(gradient.stops, gradient.rampInterpolation, gradient.rampMirror ?? false, gradient.opacityStops, gradient.rampColorMode, gradient.rampVariable);
    const { gl, gradientRampTexture } = ctx;
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, gradientRampTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, RAMP_TEX_WIDTH, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  }, [gradient.stops, gradient.opacityStops, gradient.rampColorMode, gradient.rampInterpolation, gradient.rampVariable, gradient.rampMirror, isWebGLReady]); // isWebGLReady: WebGL 初期化完了時に初回アップロードを確実に行う

  return { webglRef, sdfReadyRef, latestRef, isWebGLReady };
}
