import { useEffect, useRef, useState } from 'react';
import {
  getRequiredExportProgramKeys,
  initWebGL,
  prepareExportPrograms,
  SHADER_VERSION,
} from '../lib/webgl';
import { buildRampTextureData } from '../lib/gradientRampUtils';
import { renderBridge } from '../lib/renderBridge';
import { AnimationLoop } from '../lib/animation';
import { RAMP_TEX_WIDTH } from '../lib/constants';
import { renderSceneAtTime } from '../lib/renderSceneAtTime';
import { getPostprocessStackSamplePadding } from '../lib/glass';
import { useGradientStore } from '../store/gradientStore';
import type { WebGLContext } from '../lib/webgl';
import type { GradientConfig } from '../types/gradient';
import type { LatestState } from '../types/latestState';
import { createExportStateSnapshot } from '../lib/exportRenderState';
import { registerKggControlRuntime, unregisterKggControlRuntime } from '../lib/kggControlRuntime';
import { KggRuntimeBridgeClient } from '../lib/kggRuntimeBridgeClient';
import { isTauriWebView, resolveKggRuntimeBridgeConfig } from '../lib/kggRuntimeBridgeConfig';
import type { KggControlProjectAdapter, KggControlUiAdapter } from '../lib/kggControlRuntime';

type WebGLInitRequest = {
  canvas: HTMLCanvasElement;
  shaderVersion: number;
  promise: Promise<WebGLContext>;
};

export function useWebGL(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  animLoopRef: React.MutableRefObject<AnimationLoop | null>,
  gradient: GradientConfig,
  controlAdapters: { ui?: KggControlUiAdapter; project?: KggControlProjectAdapter } = {},
) {
  const webglRef = useRef<WebGLContext | null>(null);
  const latestRef = useRef<LatestState | null>(null);
  const initRequestRef = useRef<WebGLInitRequest | null>(null);
  const compiledShaderVersionRef = useRef(0); // コンパイル済みシェーダーのバージョン
  const [isWebGLReady, setIsWebGLReady] = useState(false);
  const [contextEpoch, setContextEpoch] = useState(0);
  const shaderVersion = SHADER_VERSION;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      webglRef.current = null;
      compiledShaderVersionRef.current = 0;
      setIsWebGLReady(false);
    };
    const handleContextRestored = () => {
      setContextEpoch(epoch => epoch + 1);
    };
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);
    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [canvasRef]);

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
  }, [canvasRef, shaderVersion, contextEpoch]);

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
      () => getPostprocessStackSamplePadding(
        latestRef.current?.postprocess,
        latestRef.current?.effectPipeline,
      ),
    );
    renderBridge.registerExportRenderer(async (signal?: AbortSignal) => {
      const ctx = webglRef.current;
      const latest = latestRef.current;
      if (!ctx || !latest) throw new Error('WebGL export renderer is not ready');

      const snapshot = createExportStateSnapshot(latest);
      const tilePadding = getPostprocessStackSamplePadding(
        snapshot.postprocess,
        snapshot.effectPipeline,
      );
      await prepareExportPrograms(ctx, snapshot, signal);
      const requiredPrograms = getRequiredExportProgramKeys(snapshot);

      return {
        renderAtTime: (_time, normalizedTime = 0, tile) => {
          renderSceneAtTime(ctx, snapshot, normalizedTime, {
            tile,
            allowEffectStackTransition: false,
          });
        },
        finishGpu: () => ctx.gl.finish(),
        tilePadding,
        diagnostics: {
          effectStack: snapshot.effectPipeline.effectStack
            .filter(layer => layer.enabled)
            .map(layer => layer.kind),
          requiredPrograms,
          readyPrograms: requiredPrograms,
          glassFallback: !ctx.glassProgram && ctx.glassFallbackActive,
          glassV2Fallback: !ctx.glassV2Program && ctx.glassV2FallbackActive,
          canvasSize: [snapshot.width, snapshot.height],
          tilePadding,
        },
        restorePreview: () => {
          const currentContext = webglRef.current;
          const currentState = latestRef.current;
          if (!currentContext || !currentState) return;
          const normalizedTime = currentState.animation.enabled
            ? (animLoopRef.current?.currentNormalizedTime ?? useGradientStore.getState().currentTime)
            : 0;
          renderSceneAtTime(currentContext, currentState, normalizedTime, {});
        },
      };
    });
    renderBridge.registerPause(
      () => {
        const loop = animLoopRef.current;
        const state = useGradientStore.getState();
        if (!loop || !state.animation.enabled) {
          renderBridge.requestPlay();
          state.setAnimation({ enabled: true });
          return;
        }
        if (loop.isPaused && loop.currentNormalizedTime >= 0.999999) {
          loop.seekTo(0);
        }
        loop.togglePause();
        useGradientStore.getState().setCurrentTime(loop.currentNormalizedTime);
      },
      () => animLoopRef.current?.isPaused ?? false,
      () => animLoopRef.current?.currentLoopTime ?? 0,
      (normalizedTime: number) => {
        const loop = animLoopRef.current;
        loop?.seekTo(normalizedTime);
        const snappedTime = loop?.currentNormalizedTime ?? normalizedTime;
        useGradientStore.getState().setCurrentTime(snappedTime);
        const ctx = webglRef.current;
        const latest = latestRef.current;
        if (ctx && latest) {
          renderSceneAtTime(ctx, latest, snappedTime, {});
        }
      },
      () => animLoopRef.current?.currentNormalizedTime ?? useGradientStore.getState().currentTime,
      () => {
        const loop = animLoopRef.current;
        if (!loop || loop.isPaused) return false;
        loop.pause();
        return true;
      },
      () => {
        const loop = animLoopRef.current;
        if (!loop) return;
        if (loop.isPaused) loop.resume();
        else loop.start();
      },
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // MCP developer interface bridge. It is opt-in: without both environment
  // variables the renderer has no polling loop and no external surface.
  useEffect(() => {
    if (!isWebGLReady) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const runtime = registerKggControlRuntime({
      canvas,
      getWebGLContext: () => webglRef.current,
      ui: controlAdapters.ui,
      project: controlAdapters.project,
    });
    const bridgeConfig = import.meta.env.DEV
      ? resolveKggRuntimeBridgeConfig({
        bridgeUrl: import.meta.env.VITE_KGG_MCP_BRIDGE_URL as string | undefined,
        token: import.meta.env.VITE_KGG_MCP_TOKEN as string | undefined,
        isTauriDevelopment: import.meta.env.VITE_KGG_TAURI_DEV === '1'
          || isTauriWebView(),
        isDevelopment: true,
      })
      : null;
    const bridge = bridgeConfig
      ? new KggRuntimeBridgeClient({
        baseUrl: bridgeConfig.baseUrl,
        token: bridgeConfig.token,
        handleRequest: (method, params) => runtime.handleRequest(method, params),
      })
      : null;
    bridge?.start();
    return () => {
      bridge?.stop();
      unregisterKggControlRuntime(runtime);
    };
  }, [canvasRef, isWebGLReady, controlAdapters.ui, controlAdapters.project]);

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
