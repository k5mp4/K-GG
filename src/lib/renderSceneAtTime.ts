import type { LatestState } from '../types/latestState';
import {
  blendEffectStackTransitionFrames,
  captureEffectStackTransitionFrame,
  render,
  type TileRenderOptions,
  type WebGLContext,
} from './webgl';
import { evaluateSceneAtTime } from './sceneEvaluation';
import {
  finishEffectStackTransition,
  getEffectStackTransition,
} from './effectStackTransition';

type RenderSceneOptions = {
  tile?: TileRenderOptions;
  allowEffectStackTransition?: boolean;
  renderSessionId?: string;
};

function renderSceneFrame(
  ctx: WebGLContext,
  state: LatestState,
  normalizedTime: number,
  options: RenderSceneOptions,
  effectStack = state.effectPipeline,
): void {
  const scene = evaluateSceneAtTime(state, normalizedTime);
  render(
    ctx,
    scene.gradient,
    scene.noiseDistortion,
    scene.diffuse,
    scene.slitScan,
    scene.stretch,
    state.normalMap,
    scene.radon,
    scene.iridescence,
    state.manualDistort,
    scene.postprocess,
    state.matcap,
    state.width,
    state.height,
    scene.renderTime,
    state.animation.direction,
    scene.slitAnimationTime,
    scene.stretchTime,
    options.tile,
    state.sourceImageCanvas ?? null,
    state.imageGradientSource ?? null,
    state.imageGradient,
    scene.noiseLoopPeriod,
    scene.animationSpeed,
    state.imageMaskSource ?? null,
    state.imageMaskEnabled ?? false,
    effectStack,
    scene.clothGradient,
    scene.clothTime,
    scene.noiseLoopPeriod,
    state.seamless,
    state.flowGradient,
    normalizedTime,
    state.animation.previewLoop ?? true,
    options.renderSessionId ?? 'preview',
  );
}

export function renderSceneAtTime(
  ctx: WebGLContext,
  state: LatestState,
  normalizedTime: number,
  options: RenderSceneOptions,
): void {
  ctx.performanceProfiler?.beginFrame();
  try {
    const transition = options.allowEffectStackTransition === false || options.tile
      ? null
      : getEffectStackTransition();
    if (!transition) {
      renderSceneFrame(ctx, state, normalizedTime, options);
      return;
    }

    if (transition.progress >= 1) {
      finishEffectStackTransition();
      renderSceneFrame(ctx, state, normalizedTime, options);
      return;
    }

    const fromPipeline = {
      ...state.effectPipeline,
      effectStack: transition.from,
    };
    const toPipeline = {
      ...state.effectPipeline,
      effectStack: transition.to,
    };
    renderSceneFrame(ctx, state, normalizedTime, {}, fromPipeline);
    captureEffectStackTransitionFrame(ctx, 'from');
    renderSceneFrame(ctx, state, normalizedTime, {}, toPipeline);
    captureEffectStackTransitionFrame(ctx, 'to');

    const current = getEffectStackTransition();
    if (!current) {
      renderSceneFrame(ctx, state, normalizedTime, options);
      return;
    }
    blendEffectStackTransitionFrames(ctx, current.progress);
  } finally {
    ctx.performanceProfiler?.endFrame();
  }
}
