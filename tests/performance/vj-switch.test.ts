import { expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { applyPresetToDocument, preparePresetToDocument, applyPreparedPresetToDocument } from '../../src/lib/applyPreset';
import { STORE_DEFAULTS, useGradientStore } from '../../src/store/gradientStore';
import { createDocumentState } from '../../src/store/documentSlice';
import type { Preset } from '../../src/lib/presetModel';

it.skipIf(process.env.KGG_BENCHMARK_VJ !== '1')('measures warmed VJ document switching with displacement maps', () => {
  const original = useGradientStore.getState();
  const state = structuredClone(createDocumentState(STORE_DEFAULTS));
  state.postprocess = { ...state.postprocess, mapResolution: 128,
    displacement: Array(128 * 128 * 2).fill(0.25), smoothMask: Array(128 * 128).fill(0.5) };
  const cues: Preset[] = [0, 1].map(index => ({ id: `measure-${index}`, name: `Measure ${index}`, createdAt: 1,
    state: { ...state, gradient: { ...state.gradient, angle: index * 90 } } }));
  try {
    for (let index = 0; index < 5; index++) applyPresetToDocument(cues[index % 2]);
    const prepared = cues.map(cue => preparePresetToDocument(cue));
    const measure = (apply: (index: number) => void) => {
      const samples: number[] = [];
      for (let index = 0; index < 50; index++) {
        const start = performance.now();
        apply(index % 2);
        samples.push(performance.now() - start);
      }
      samples.sort((a, b) => a - b);
      return { samples: samples.length, medianMs: samples[25], p95Ms: samples[47] };
    };
    const metrics = { uncached: measure(index => { applyPresetToDocument(cues[index]); }),
      prepared: measure(index => { applyPreparedPresetToDocument(prepared[index]); }) };
    mkdirSync('test-results', { recursive: true });
    writeFileSync('test-results/vj-switch-cpu.json', JSON.stringify(metrics, null, 2));
    expect(useGradientStore.getState().gradient.angle).toBe(90);
  } finally { useGradientStore.setState(original); }
});
