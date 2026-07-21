import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useGradientStore } from '../store/gradientStore';
import { AnimationLoop } from '../lib/animation';
import { useWebGL } from '../hooks/useWebGL';
import { renderFallbackPreview } from '../lib/presetPreview';
import { setTimelineTime } from '../lib/timelineClock';
import { hasActiveAnimation } from '../lib/sceneEvaluation';
import { renderSceneAtTime } from '../lib/renderSceneAtTime';
import { renderBridge } from '../lib/renderBridge';
import { LatestFrameScheduler } from '../lib/latestFrameScheduler';


type Props = {
  width?: number;
  height?: number;
  animLoopRef: React.MutableRefObject<AnimationLoop | null>;
  seekVersion?: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  sourceImageCanvas?: HTMLCanvasElement | null;
  imageGradientSource?: HTMLCanvasElement | null;
  imageMaskSource?: TexImageSource | null;
  imageMaskEnabled?: boolean;
};

export function GradientCanvas({ width = 800, height = 800, animLoopRef, seekVersion = 0, canvasRef, sourceImageCanvas = null, imageGradientSource = null, imageMaskSource = null, imageMaskEnabled = false }: Props) {
  const fallbackCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const staticRenderSchedulerRef = useRef<LatestFrameScheduler | null>(null);
  if (!staticRenderSchedulerRef.current) {
    staticRenderSchedulerRef.current = new LatestFrameScheduler();
  }

  const { gradient, noiseDistortion, diffuse, imageGradient, slitScan, stretch, animation, normalMap, radon, iridescence, manualDistort, postprocess, effectPipeline, matcap, keyframeTracks, currentTime } = useGradientStore();

  const { webglRef, latestRef, isWebGLReady } = useWebGL(canvasRef, animLoopRef, gradient);

  const [lazyProgramReadyCount, setLazyProgramReadyCount] = useState(0);

  useEffect(() => {
    if (isWebGLReady) return;
    const canvas = fallbackCanvasRef.current;
    if (!canvas) return;
    renderFallbackPreview(canvas, gradient, width, height);
  }, [isWebGLReady, gradient, width, height]);

  useEffect(() => {
    const handleProgramState = (event: Event) => {
      const state = (event as CustomEvent<{ state?: string }>).detail?.state;
      // A failed optional program changes which V2 layers can be presented.
      // Re-evaluate the render plan so ready Core layers are not left showing
      // the Base frame that was drawn while the failed program was pending.
      if (state === 'ready' || state === 'failed' || state === 'fallback') {
        setLazyProgramReadyCount(c => c + 1);
      }
    };
    window.addEventListener('kgg:webgl-lazy-program-state', handleProgramState);
    return () => window.removeEventListener('kgg:webgl-lazy-program-state', handleProgramState);
  }, []);

  useEffect(() => () => {
    staticRenderSchedulerRef.current?.cancel();
  }, []);

  // latestRef を毎レンダー更新（ブラウザ描画前に同期更新し、RAFループが即座に最新値を参照できるようにする）
  useLayoutEffect(() => {
    latestRef.current = { gradient, noiseDistortion, diffuse, imageGradient, slitScan, stretch, normalMap, radon, iridescence, manualDistort, postprocess, effectPipeline, matcap, animation, keyframeTracks, width, height, animDirection: animation.direction, sourceImageCanvas, imageGradientSource, imageMaskSource, imageMaskEnabled };
  });

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
      renderSceneAtTime(ctx, frameState, normalizedTime, {});
    });
  }, [gradient, noiseDistortion, diffuse, imageGradient, slitScan, stretch, normalMap, radon, iridescence, manualDistort, postprocess, effectPipeline, width, height, animation.enabled, animation.speed, animation.direction, animation.easing, animation.affectNoise, animation.affectSlit, animation.affectRamp, animation.affectStretch, keyframeTracks, currentTime, lazyProgramReadyCount, seekVersion, isWebGLReady, sourceImageCanvas, imageGradientSource, imageMaskSource, imageMaskEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // アニメーションループの管理
  useEffect(() => {
    if (!webglRef.current) return;
    if (renderBridge.isAnimationSuspended()) return;
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
          renderSceneAtTime(ctx, frameState, normalizedTime, {});
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
        });
      });
    }
    return () => { animLoopRef.current?.stop(); };
  }, [animation.enabled, animation.duration, animation.previewLoop, animation.speed, keyframeTracks, noiseDistortion.enabled, iridescence.enabled, radon.enabled, slitScan.enabled, stretch.enabled, diffuse.enabled, diffuse.seedAnimEnabled, postprocess.enabled, postprocess.effectMode, postprocess.effectStack, postprocess.glassMotion, effectPipeline]); // eslint-disable-line react-hooks/exhaustive-deps

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
