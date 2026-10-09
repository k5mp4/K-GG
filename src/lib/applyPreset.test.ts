import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { STORE_DEFAULTS, useGradientStore } from '../store/gradientStore';
import { createDocumentState } from '../store/documentSlice';
import type { PropertyTrack } from '../types/keyframe';
import { applyPresetToDocument, preparePresetToDocument, applyPreparedPresetToDocument } from './applyPreset';
import { makePreset, type Preset, type StoreSnapshot } from './presetModel';

function preset(state: Partial<StoreSnapshot> = {}): Preset {
  return {
    id: 'performance-preset', name: 'Performance', createdAt: 1,
    state: {
      ...structuredClone(createDocumentState(STORE_DEFAULTS)),
      animation: { ...structuredClone(STORE_DEFAULTS.animation), enabled: false },
      ...state,
    },
  };
}

const track: PropertyTrack = {
  propertyId: 'noiseDistortion.amount', label: 'Amount', enabled: true, mode: 'keys',
  keyframes: [{ id: 'key', time: 0, value: 0.25, interpolation: 'linear' }],
};

describe('shared preset application', () => {
  const initialState = useGradientStore.getState();
  beforeEach(() => useGradientStore.setState(structuredClone(createDocumentState(STORE_DEFAULTS))));
  afterEach(() => useGradientStore.setState(initialState));

  it('loads a full preset through the document normalization boundary', () => {
    const saved = preset({
      gradient: { ...structuredClone(STORE_DEFAULTS.gradient), angle: 42 },
      coneView: { ...STORE_DEFAULTS.coneView, depth: 15 },
      texture: { ...STORE_DEFAULTS.texture, roughness: 0.35 },
    });

    expect(applyPresetToDocument(saved)).toEqual({});

    expect(useGradientStore.getState()).toMatchObject({
      presetName: 'Performance',
      gradient: { angle: 42 }, coneView: { depth: 15 }, texture: { roughness: 0.35 },
      effectPipeline: { version: 'stack-v2' },
    });
  });

  it('reconstructs compacted Distort maps rather than leaking the previous preset', () => {
    const state = preset().state;
    state.postprocess = { ...STORE_DEFAULTS.postprocess, mapResolution: 2, brushSize: 77,
      displacement: Array(8).fill(0), smoothMask: Array(4).fill(0) };
    const compact = makePreset('Compact', state);
    expect(compact.state).not.toHaveProperty('manualDistort');
    expect(compact.state.postprocess).not.toHaveProperty('displacement');
    useGradientStore.getState().setPostprocess({ mapResolution: 2, displacement: Array(8).fill(0.8), smoothMask: Array(4).fill(0.4) });

    applyPresetToDocument(compact);

    expect(useGradientStore.getState().postprocess.displacement).toEqual(Array(8).fill(0));
    expect(useGradientStore.getState().manualDistort).toMatchObject({
      enabled: false, mapResolution: 2, brushSize: 77,
      displacement: Array(8).fill(0), smoothMask: Array(4).fill(0),
    });
  });

  it('migrates a legacy preset and resets missing optional effect settings', () => {
    const saved = preset();
    delete saved.state.effectPipeline;
    delete saved.state.coneView;
    delete saved.state.texture;
    delete saved.state.postprocess;
    saved.state.postprocessDistort = { effectMode: 'glass' } as unknown as StoreSnapshot['postprocess'];
    saved.state.manualDistort = { ...STORE_DEFAULTS.manualDistort, enabled: true, mapResolution: 2,
      displacement: [Number.NaN], smoothMask: [1] };
    useGradientStore.getState().setConeView({ depth: 24 });
    useGradientStore.getState().setTexture({ roughness: 0.8 });

    applyPresetToDocument(saved);

    const loaded = useGradientStore.getState();
    expect(loaded.coneView).toEqual(STORE_DEFAULTS.coneView);
    expect(loaded.texture).toEqual(STORE_DEFAULTS.texture);
    expect(loaded.effectPipeline.version).toBe('stack-v2');
    expect(loaded.postprocess.effectMode).toBe('glassV2');
    expect(loaded.manualDistort).toMatchObject({
      enabled: false, displacement: Array(8).fill(0), smoothMask: Array(4).fill(0),
    });
  });

  it('keeps the current Preview Loop, easing and BPM while loading animation settings', () => {
    const easing = { ...structuredClone(STORE_DEFAULTS.animation.easing),
      enabled: true,
      beatSync: { enabled: true, bpm: 128, beatsPerBar: 4, subdivision: 4 as const, rate: 1 as const },
    };
    useGradientStore.getState().setAnimation({ previewLoop: false, easing });
    const saved = preset({ animation: { ...structuredClone(STORE_DEFAULTS.animation), speed: 1.5, fps: 24 } });

    applyPresetToDocument(saved);

    expect(useGradientStore.getState().animation).toMatchObject({
      previewLoop: false, easing, speed: 1.5, fps: 24, duration: 240 / 128,
    });
  });

  it('replaces keyframe tracks and clears them when the next preset has none', () => {
    const saved = preset({ keyframeTracks: { 'noiseDistortion.amount': track } });
    applyPresetToDocument(saved);
    expect(useGradientStore.getState().keyframeTracks['noiseDistortion.amount']).toEqual(track);

    const withoutTracks = preset();
    delete withoutTracks.state.keyframeTracks;
    applyPresetToDocument(withoutTracks);

    expect(useGradientStore.getState().keyframeTracks).toEqual({});
  });

  it('returns normalized resolution for the caller to apply', () => {
    const saved = preset({ resolution: { width: 9999, height: 270.3 } });
    const before = useGradientStore.getState();

    expect(applyPresetToDocument(saved)).toEqual({ resolution: { width: 4096, height: 270 } });

    expect(useGradientStore.getState()).not.toHaveProperty('resolution');
    expect(useGradientStore.getState().currentTime).toBe(before.currentTime);
  });

  it('does not mutate saved state or share mutable maps with the live document', () => {
    const saved = preset({ keyframeTracks: { 'noiseDistortion.amount': structuredClone(track) } });
    const before = structuredClone(saved);

    applyPresetToDocument(saved);
    const live = useGradientStore.getState();
    live.gradient.stops[0].color = '#123456';
    live.manualDistort.displacement[0] = 0.5;
    live.keyframeTracks['noiseDistortion.amount'].keyframes[0].value = 0.9;

    expect(saved).toEqual(before);
  });

  it('rejects a malformed nested track before changing or publishing the live document', () => {
    const saved = preset({ gradient: { ...STORE_DEFAULTS.gradient, angle: 77 },
      keyframeTracks: { 'noiseDistortion.amount': null } as unknown as StoreSnapshot['keyframeTracks'] });
    const before = useGradientStore.getState();
    let publications = 0;
    const unsubscribe = useGradientStore.subscribe(() => { publications++; });
    try {
      expect(() => applyPresetToDocument(saved)).toThrow();
      expect(useGradientStore.getState()).toBe(before);
      expect(publications).toBe(0);
    } finally { unsubscribe(); }
  });

  it('publishes one fully normalized scene for a valid preset', () => {
    const saved = preset({ gradient: { ...STORE_DEFAULTS.gradient, angle: 77 },
      keyframeTracks: { 'noiseDistortion.amount': track } });
    const publications: unknown[] = [];
    const unsubscribe = useGradientStore.subscribe(state => publications.push({
      angle: state.gradient.angle, name: state.presetName, track: state.keyframeTracks['noiseDistortion.amount'],
    }));
    try {
      applyPresetToDocument(saved);
      expect(publications).toEqual([{ angle: 77, name: 'Performance', track }]);
    } finally { unsubscribe(); }
  });

  it('prepares without modifying the scene and preserves live timing changed after preparation', () => {
    const before = useGradientStore.getState();
    const prepared = preparePresetToDocument(preset());
    expect(useGradientStore.getState()).toBe(before);
    const easing = { ...before.animation.easing, beatSync: { enabled: true, bpm: 133, beatsPerBar: 4, subdivision: 4 as const, rate: 1 as const } };
    useGradientStore.getState().setAnimation({ previewLoop: false, easing });
    applyPreparedPresetToDocument(prepared);
    expect(useGradientStore.getState().animation).toMatchObject({ previewLoop: false, easing, duration: 240 / 133 });
  });

  it('rebases partial legacy fields onto the live document without recreating maps', () => {
    const legacy = { id: 'partial', name: 'Partial', createdAt: 1, state: {
      gradient: { angle: 77 }, stretch: { variation: 0.2 }, normalMap: { blur: 3 },
    } } as unknown as Preset;
    const prepared = preparePresetToDocument(legacy);
    useGradientStore.getState().setGradient({ rampRepeat: 7 });
    useGradientStore.getState().setNoiseDistortion({ scale: 2.2 });
    useGradientStore.getState().setStretch({ bandHeight: 45 });
    useGradientStore.getState().setNormalMap({ strength: 3 });
    applyPreparedPresetToDocument(prepared);
    expect(useGradientStore.getState()).toMatchObject({ gradient: { angle: 77, rampRepeat: 7 },
      noiseDistortion: { scale: 2.2 }, stretch: { variation: 0.2, bandHeight: 45 }, normalMap: { blur: 3, strength: 3 } });
    expect(useGradientStore.getState().postprocess.displacement).toBe(prepared.patch.postprocess!.displacement);
  });
});
