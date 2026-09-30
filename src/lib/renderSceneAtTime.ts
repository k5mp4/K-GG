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
import { resolveShapesMask } from './shapesLibrary';

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
    manualDistort: state.manualDistort,
    postprocess: scene.postprocess,
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
    // Flow, Datamosh, 3D, and Texture are driven by loop phase rather than
    // seconds. Feed them the Loop Timing-remapped phase so they follow the
    // same progress curve as the auto tracks (0 and 1 stay fixed points).
    flowNormalizedTime: scene.autoTime,
    flowLoopEnabled: state.animation.previewLoop ?? true,
    flowSessionId: options.renderSessionId ?? 'preview',
    datamosh: state.datamosh,
    coneView: state.coneView,
    texture: state.texture,
    textureImageSource: state.textureImageSource ?? null,
    textureNormalizedTime: scene.autoTime,
    shapes: state.shapes,
    shapesMask: state.shapes?.enabled ? resolveShapesMask(state.shapes.source, state.shapesCustomMask) : null,
    shapesNormalizedTime: scene.autoTime,
    shapesAnimated: state.animation.enabled,
  });
}

export function renderSceneAtTime(
  ctx: WebGLContext,
  state: LatestState,
  normalizedTime: number,
  options: RenderSceneOptions,
): void {
  if (ctx.disposed || ctx.gl.isContextLost()) return;
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
