import { describe, expect, it } from 'vitest';
import type { LatestState } from '../types/latestState';
import { createExportStateSnapshot } from './exportRenderState';

describe('createExportStateSnapshot', () => {
  it('freezes mutable render parameters while retaining uncloneable image sources', () => {
    const sourceImageCanvas = { source: true } as unknown as HTMLCanvasElement;
    const imageGradientSource = { recolor: true } as unknown as HTMLCanvasElement;
    const imageMaskSource = { mask: true } as unknown as TexImageSource;
    const state = {
      gradient: { stops: [{ position: 0, color: '#000000' }] },
      effectPipeline: {
        version: 'stack-v2',
        effectStack: [{ kind: 'glass', enabled: true }],
      },
      postprocess: { glassSeed: 7 },
      animation: { speed: 1 },
      keyframeTracks: { glass: { keyframes: [{ time: 0, value: 1 }] } },
      sourceImageCanvas,
      imageGradientSource,
      imageMaskSource,
    } as unknown as LatestState;

    const snapshot = createExportStateSnapshot(state);
    (state.effectPipeline.effectStack[0] as { enabled: boolean }).enabled = false;
    (state.postprocess as { glassSeed: number }).glassSeed = 99;

    expect(snapshot.effectPipeline.effectStack[0].enabled).toBe(true);
    expect(snapshot.postprocess.glassSeed).toBe(7);
    expect(snapshot.sourceImageCanvas).toBe(sourceImageCanvas);
    expect(snapshot.imageGradientSource).toBe(imageGradientSource);
    expect(snapshot.imageMaskSource).toBe(imageMaskSource);
  });
});
