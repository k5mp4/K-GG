import { createDocumentActions } from '../store/documentActions';
import type { DocumentStoreSet } from '../store/documentSlice';
import {
  createEmptyManualDistortMap, createEmptyManualSmoothMask,
  normalizeNoiseDistortionConfig, normalizePostprocessConfig, STORE_DEFAULTS, useGradientStore, type GradientStore,
} from '../store/gradientStore';
import { normalizeClothGradientConfig } from '../types/clothGradient';
import { normalizeConeViewConfig } from '../types/coneView';
import { resolvePersistedDatamosh } from '../types/datamosh';
import { normalizeDistortChromaConfig } from '../types/distortChroma';
import { stripSlitPhaseMotionFields } from '../types/distortion';
import { normalizeFlowGradientConfig } from '../types/flowGradient';
import { normalizeImageGradientConfig } from '../types/imageGradient';
import { normalizeSeamlessConfig } from '../types/seamless';
import { normalizeShapesConfig } from '../types/shapes';
import { normalizeTextureConfig } from '../types/texture';
import { keepLoopTimingOnPresetLoad } from './animationConfig';
import { mergeUserColorPalettes } from './colorPalettes';
import { resolveDiffuseBezier } from './diffuseCurve';
import { createDefaultEffectPipeline, normalizeEffectPipelineConfig } from './effectPipeline';
import type { Preset, StoreSnapshot } from './presetModel';

export type PreparedPreset = {
  patch: Partial<GradientStore>;
  resolution?: { width: number; height: number };
  inputs: Partial<Pick<StoreSnapshot, 'gradient' | 'noiseDistortion' | 'slitScan' | 'stretch' | 'normalMap' | 'animation' | 'colorPalettes'>>;
};

function normalizeManualDistortResolution(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(1, Math.min(512, Math.round(value)))
    : STORE_DEFAULTS.manualDistort.mapResolution;
}

function validFiniteArray(value: unknown, expectedLength: number): value is number[] {
  return Array.isArray(value)
    && value.length === expectedLength
    && value.every(item => typeof item === 'number' && Number.isFinite(item));
}

/**
 * Normalizes a library preset through the editor's document actions, then publishes it atomically.
 * Resolution is returned separately so the VJ caller can keep its output size.
 */
export function preparePresetToDocument(preset: Preset): PreparedPreset {
  // Live edits must never change a library preset through shared nested arrays.
  const s = structuredClone(preset.state);
  let staged = useGradientStore.getState();
  let patch: Partial<GradientStore> = {};
  // A malformed nested value must not replace any part of the live scene.
  const stage: DocumentStoreSet = update => {
    const next = typeof update === 'function' ? update(staged) : update;
    patch = { ...patch, ...next };
    staged = { ...staged, ...next };
  };
  const commands = {
    ...createDocumentActions(stage, STORE_DEFAULTS),
    setPresetName: (presetName: string) => stage({ presetName }),
  };
  if (s.gradient) commands.setGradient(s.gradient);
  if (s.noiseDistortion) commands.setNoiseDistortion(normalizeNoiseDistortionConfig(s.noiseDistortion));
  const loadedDiffuse = {
    ...STORE_DEFAULTS.diffuse,
    ...(s.diffuse ?? {}),
    luminanceBezier: resolveDiffuseBezier(s.diffuse?.luminanceBezier, s.diffuse?.luminanceCurve),
  };
  delete loadedDiffuse.luminanceCurve;
  commands.setDiffuse(loadedDiffuse);
  commands.setImageGradient(normalizeImageGradientConfig(s.imageGradient, s.imageGradient ? 0 : STORE_DEFAULTS.imageGradient.anchorInfluence));
  if (s.slitScan) {
    const loadedSlit = { ...STORE_DEFAULTS.slitScan, ...stripSlitPhaseMotionFields(s.slitScan) };
    delete (loadedSlit as Record<string, unknown>).autoLoop;
    commands.setSlitScan(loadedSlit);
  }
  if (s.stretch) commands.setStretch(s.stretch);
  if (s.normalMap) commands.setNormalMap(s.normalMap);
  const loadedPostprocess = normalizePostprocessConfig(s.postprocess ?? s.postprocessDistort, s.manualDistort);
  const legacyDistort = s.manualDistort ?? loadedPostprocess;
  const resolution = normalizeManualDistortResolution(legacyDistort.mapResolution);
  commands.setManualDistort({
    ...STORE_DEFAULTS.manualDistort,
    ...legacyDistort,
    enabled: false,
    mapResolution: resolution,
    displacement: validFiniteArray(legacyDistort.displacement, resolution * resolution * 2)
      ? legacyDistort.displacement : createEmptyManualDistortMap(resolution),
    smoothMask: validFiniteArray(legacyDistort.smoothMask, resolution * resolution)
      ? legacyDistort.smoothMask : createEmptyManualSmoothMask(resolution),
  });
  commands.setPostprocess(loadedPostprocess);
  commands.setClothGradient(normalizeClothGradientConfig(s.clothGradient));
  commands.setConeView(normalizeConeViewConfig(s.coneView));
  commands.setSeamless(normalizeSeamlessConfig(s.seamless));
  commands.setTexture(normalizeTextureConfig(s.texture));
  commands.setDistortChroma(normalizeDistortChromaConfig(s.distortChroma));
  commands.setShapes(normalizeShapesConfig(s.shapes));
  commands.setFlowGradient(normalizeFlowGradientConfig(s.flowGradient));
  commands.setDatamosh(resolvePersistedDatamosh(s));
  // Presets predating Effect Pipeline use the current default Stack v2.
  commands.setEffectPipeline(s.effectPipeline
    ? normalizeEffectPipelineConfig(s.effectPipeline)
    : createDefaultEffectPipeline());
  commands.setKeyframeTracks(s.keyframeTracks ?? {});
  if (s.animation) commands.setAnimation({
    ...keepLoopTimingOnPresetLoad(s.animation, useGradientStore.getState().animation),
    rampOffsetSpeed: s.animation.rampOffsetSpeed ?? 0,
  });
  commands.setPresetName(preset.name);
  const normalizeResolution = (value: number) => Number.isFinite(value)
    ? Math.max(1, Math.min(4096, Math.round(value))) : 1024;
  const result = s.resolution ? { resolution: {
    width: normalizeResolution(s.resolution.width),
    height: normalizeResolution(s.resolution.height),
  } } : {};
  return { ...result, patch, inputs: {
    gradient: s.gradient ? { ...s.gradient, ...(s.gradient.stops ? { stops: patch.gradient!.stops } : {}) } : undefined,
    noiseDistortion: s.noiseDistortion, slitScan: s.slitScan, stretch: s.stretch, normalMap: s.normalMap,
    animation: s.animation, colorPalettes: s.colorPalettes,
  } };
}

/** Resolve legacy partial fields against the live document without publishing or cloning maps. */
export function resolvePreparedPresetPatch(prepared: PreparedPreset): Partial<GradientStore> {
  const current = useGradientStore.getState();
  let patch = { ...prepared.patch };
  // Legacy partial presets inherit the live values at the moment of switching.
  for (const group of ['noiseDistortion', 'slitScan', 'stretch'] as const) {
    if (!prepared.inputs[group] && patch[group]) {
      Object.assign(patch, { [group]: { ...current[group], enabled: patch[group]!.enabled } });
    }
  }
  let staged = { ...current, ...patch, gradient: current.gradient, stretch: current.stretch, normalMap: current.normalMap };
  const commands = createDocumentActions(update => {
    const next = typeof update === 'function' ? update(staged) : update;
    patch = { ...patch, ...next };
    staged = { ...staged, ...next };
  }, STORE_DEFAULTS);
  if (prepared.inputs.gradient) commands.setGradient(prepared.inputs.gradient);
  if (prepared.inputs.stretch) {
    commands.setStretch(prepared.inputs.stretch);
    patch.stretch = { ...patch.stretch!, enabled: prepared.patch.stretch!.enabled };
  }
  if (prepared.inputs.normalMap) commands.setNormalMap(prepared.inputs.normalMap);
  // Partial setter side effects must not supersede the saved stack or tracks.
  patch.effectPipeline = prepared.patch.effectPipeline;
  patch.postprocess = prepared.patch.postprocess;
  patch.keyframeTracks = prepared.patch.keyframeTracks;
  staged = { ...current, ...patch };
  if (prepared.inputs.animation) commands.setAnimation({
    ...keepLoopTimingOnPresetLoad(prepared.patch.animation!, current.animation),
    rampOffsetSpeed: prepared.patch.animation!.rampOffsetSpeed ?? 0,
  });
  return patch;
}

/** Commit a prepared cue without cloning maps or repeating whole-document normalization. */
export function applyPreparedPresetToDocument(prepared: PreparedPreset): { resolution?: { width: number; height: number } } {
  return commitPreparedPresetToDocument(prepared, resolvePreparedPresetPatch(prepared));
}

/** Publish a resolved patch after the caller has checked its effective render plan. */
export function commitPreparedPresetToDocument(prepared: PreparedPreset, patch: Partial<GradientStore>): { resolution?: { width: number; height: number } } {
  if (prepared.inputs.colorPalettes) mergeUserColorPalettes(prepared.inputs.colorPalettes);
  useGradientStore.setState(patch);
  return prepared.resolution ? { resolution: prepared.resolution } : {};
}

export function applyPresetToDocument(preset: Preset): { resolution?: { width: number; height: number } } {
  return applyPreparedPresetToDocument(preparePresetToDocument(preset));
}
