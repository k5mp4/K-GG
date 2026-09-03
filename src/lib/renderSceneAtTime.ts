import type { LatestState } from '../types/latestState';
import {
  blendEffectStackTransitionFrames,
  captureEffectStackTransitionFrame,
  type WebGLContext,
} from './webgl';
import type { TileRenderOptions } from '../types/rendering';
import { evaluateSceneAtTime } from './sceneEvaluation';
import {
  finishEffectStackTransition,
  getEffectStackTransition,
} from './effectStackTransition';
import { renderFrame } from './renderFrame';

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
  renderFrame(ctx, {
    gradient: scene.gradient,
    noiseDistortion: scene.noiseDistortion,
    diffuse: scene.diffuse,
    slitScan: scene.slitScan,
    stretch: scene.stretch,
    normalMap: state.normalMap,
    radon: scene.radon,
    iridescence: scene.iridescence,
    manualDistort: state.manualDistort,
    postprocess: scene.postprocess,
    matcap: state.matcap,
    width: state.width,
    height: state.height,
    time: scene.renderTime,
    animDirection: state.animation.direction,
    slitAnimTimeOverride: scene.slitAnimationTime,
    stretchScanOverride: scene.stretchTime,
    tile: options.tile,
    sourceImageCanvas: state.sourceImageCanvas ?? null,
    imageGradientSource: state.imageGradientSource ?? null,
    imageGradient: state.imageGradient,
    noiseLoopPeriod: scene.noiseLoopPeriod,
    animationSpeed: scene.animationSpeed,
    imageMaskSource: state.imageMaskSource ?? null,
    imageMaskEnabled: state.imageMaskEnabled ?? false,
    effectPipeline: effectStack,
    clothGradient: scene.clothGradient,
    clothTime: scene.clothTime,
    clothLoopPeriod: scene.noiseLoopPeriod,
    seamless: state.seamless,
    flowGradient: state.flowGradient,
    flowNormalizedTime: normalizedTime,
    flowLoopEnabled: state.animation.previewLoop ?? true,
    flowSessionId: options.renderSessionId ?? 'preview',
  });
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
