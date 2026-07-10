import { useEffect, useRef, useState } from 'react';
import { initWebGL, SHADER_VERSION } from '../lib/webgl';
import { buildRampTextureData } from '../lib/gradientRampUtils';
import { renderBridge } from '../lib/renderBridge';
import { AnimationLoop } from '../lib/animation';
import { RAMP_TEX_WIDTH } from '../lib/constants';
import { renderSceneAtTime } from '../lib/renderSceneAtTime';
import { getGlassSamplePadding } from '../lib/glass';
import { useGradientStore } from '../store/gradientStore';
import type { WebGLContext } from '../lib/webgl';
import type { GradientConfig } from '../types/gradient';
import type { LatestState } from '../types/latestState';

type WebGLInitRequest = {
  canvas: HTMLCanvasElement;
  shaderVersion: number;
  promise: Promise<WebGLContext>;
};

export function useWebGL(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  animLoopRef: React.MutableRefObject<AnimationLoop | null>,
  gradient: GradientConfig,
) {
  const webglRef = useRef<WebGLContext | null>(null);
  const latestRef = useRef<LatestState | null>(null);
  const initRequestRef = useRef<WebGLInitRequest | null>(null);
  const compiledShaderVersionRef = useRef(0); // コンパイル済みシェーダーのバージョン
  const [isWebGLReady, setIsWebGLReady] = useState(false);
  const shaderVersion = SHADER_VERSION;

  // WebGL 初期化（非同期・stale チェック付き）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    // stale 検出: 古いコンテキストで必要な uniform が未登録なら再初期化
    // SHADER_VERSION が変わった場合（GLSL が HMR で更新された場合）も再初期化
    const stale = webglRef.current !== null && (
      webglRef.current.gl.canvas !== canvas ||
      webglRef.current.uniforms['u_imageGradientEnabled'] === undefined ||
      webglRef.current.uniforms['u_iridEnabled'] === undefined ||
      webglRef.current.uniforms['u_manualDistortEnabled'] === undefined ||
      webglRef.current.uniforms['u_matcapEnabled'] === undefined ||
      webglRef.current.stretchProgram === undefined ||
      webglRef.current.postprocessProgram === undefined ||
      webglRef.current.blurProgram === undefined ||
      compiledShaderVersionRef.current !== shaderVersion
    );
    if (webglRef.current && !stale) {
      setIsWebGLReady(true);
      return;
    }

    setIsWebGLReady(false);

    // StrictMode は setup → cleanup → setup を意図的に行う。同じ canvas/version の
    // 初期化Promiseを共有することで、最初のcleanupが進行中のGPUコンパイルを無効化しない。
    // HMRでversionが変わった場合は、ドライバー上のlinkProgramを並列化しないよう直列実行する。
    const currentRequest = initRequestRef.current;
    let request: WebGLInitRequest;
    if (
      currentRequest &&
      currentRequest.canvas === canvas &&
      currentRequest.shaderVersion === shaderVersion
    ) {
      request = currentRequest;
    } else {
      const waitForPrevious = currentRequest
        ? currentRequest.promise.then(() => undefined, () => undefined)
        : Promise.resolve();
      request = {
        canvas,
        shaderVersion,
        promise: waitForPrevious.then(() => initWebGL(canvas)),
      };
      initRequestRef.current = request;
      void request.promise.then(
        () => {
          if (initRequestRef.current === request) initRequestRef.current = null;
        },
        () => {
          if (initRequestRef.current === request) initRequestRef.current = null;
        },
      );
    }

    void request.promise.then(ctx => {
      if (disposed) return;
      webglRef.current = ctx;
      compiledShaderVersionRef.current = shaderVersion;
      setIsWebGLReady(true);
    }).catch(e => {
      if (disposed) return;
      console.error('WebGL init failed:', e);
      setIsWebGLReady(false);
    });

    return () => {
      disposed = true;
    };
  }, [canvasRef, shaderVersion]);

  // renderBridge への登録
  useEffect(() => {
    renderBridge.register(
      (t: number, nt?: number, tile?: import('../lib/webgl').TileRenderOptions) => {
        const ctx = webglRef.current;
        const latest = latestRef.current;
        if (!ctx || !latest) return;
        const totalDuration = Math.max((latest.animation.speed ?? 1) * (latest.animation.duration ?? 1), 0.0001);
        const normalizedTime = nt !== undefined ? nt : t / totalDuration;
        renderSceneAtTime(ctx, latest, normalizedTime, { tile });
      },
      () => { animLoopRef.current?.stop(); },
      () => { animLoopRef.current?.start(); },
      () => getGlassSamplePadding(latestRef.current?.postprocess),
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
          renderSceneAtTime(ctx, latest, normalizedTime, {});
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

  return { webglRef, latestRef, isWebGLReady };
}
