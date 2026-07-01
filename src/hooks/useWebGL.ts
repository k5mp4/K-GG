import { useEffect, useRef, useReducer, useState } from 'react';
import { initWebGL, SHADER_VERSION } from '../lib/webgl';
import { generateDistanceMap, uploadDistanceMap } from '../lib/bezierAxis';
import { buildRampTextureData } from '../lib/gradientRampUtils';
import { renderBridge } from '../lib/renderBridge';
import { AnimationLoop } from '../lib/animation';
import { SDF_MAP_SIZE, RAMP_TEX_WIDTH } from '../lib/constants';
import { renderSceneAtTime } from '../lib/renderSceneAtTime';
import { useGradientStore } from '../store/gradientStore';
import type { WebGLContext } from '../lib/webgl';
import type { GradientConfig } from '../types/gradient';
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
    const stale = webglRef.current !== null && (
      webglRef.current.gl.canvas !== canvasRef.current ||
      webglRef.current.uniforms['u_bezierRadius'] === undefined ||
      webglRef.current.uniforms['u_iridEnabled'] === undefined ||
      webglRef.current.uniforms['u_manualDistortEnabled'] === undefined ||
      webglRef.current.uniforms['u_matcapEnabled'] === undefined ||
      webglRef.current.stretchProgram === undefined ||
      webglRef.current.postprocessProgram === undefined ||
      webglRef.current.blurProgram === undefined ||
      compiledShaderVersionRef.current !== SHADER_VERSION
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
        const totalDuration = Math.max((latest.animation.speed ?? 1) * (latest.animation.duration ?? 1), 0.0001);
        const normalizedTime = nt !== undefined ? nt : t / totalDuration;
        renderSceneAtTime(ctx, latest, normalizedTime, {
          sdfReady: sdfReadyRef.current,
          tile,
        });
      },
      () => { animLoopRef.current?.stop(); },
      () => { animLoopRef.current?.start(); },
    );
    renderBridge.registerPause(
      () => {
        const loop = animLoopRef.current;
        if (!loop) return;
        if (loop.isPaused && loop.currentNormalizedTime >= 0.999999) {
          loop.seekTo(0);
        }
        loop.togglePause();
        useGradientStore.getState().setCurrentTime(loop.currentNormalizedTime);
      },
      () => animLoopRef.current?.isPaused ?? false,
      () => animLoopRef.current?.currentLoopTime ?? 0,
      (normalizedTime: number) => {
        animLoopRef.current?.seekTo(normalizedTime);
        useGradientStore.getState().setCurrentTime(normalizedTime);
        const ctx = webglRef.current;
        const latest = latestRef.current;
        if (ctx && latest) {
          renderSceneAtTime(ctx, latest, normalizedTime, { sdfReady: sdfReadyRef.current });
        }
      },
      () => animLoopRef.current?.currentNormalizedTime ?? useGradientStore.getState().currentTime,
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
