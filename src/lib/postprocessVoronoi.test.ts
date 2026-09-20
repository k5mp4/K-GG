import { describe, expect, it } from 'vitest';
import { getParameterLimit } from './parameterLimits';
import { getPostprocessFragmentSource } from './webglShaderSources';
import { normalizePostprocessConfig, STORE_DEFAULTS } from '../store/gradientStore';

describe('Postprocess Voronoi texture controls', () => {
  it('keeps Noise Voronoi metric and feature defaults available to Postprocess', () => {
    expect(STORE_DEFAULTS.postprocess.voronoiDistMetric).toBe('euclidean');
    expect(STORE_DEFAULTS.postprocess.voronoiFeature).toBe('f1');
    expect(STORE_DEFAULTS.postprocess.voronoiMinkowskiExp).toBe(2);
    expect(STORE_DEFAULTS.postprocess.voronoiGradientScale).toBe(1.15);
    expect(STORE_DEFAULTS.postprocess.voronoiEdgeWidth).toBe(0.025);
    expect(getParameterLimit('postprocess.voronoiScale')).toMatchObject({ max: 48, defaultValue: 8 });
    expect(getParameterLimit('postprocess.voronoiEdgeWidth')).toMatchObject({ defaultValue: 0.025 });

    const loaded = normalizePostprocessConfig({
      voronoiDistMetric: 'minkowski',
      voronoiFeature: 'distance_to_edge',
      voronoiMinkowskiExp: 8,
    });

    expect(loaded).toMatchObject({
      voronoiDistMetric: 'minkowski',
      voronoiFeature: 'distance_to_edge',
      voronoiMinkowskiExp: 8,
    });

    expect(normalizePostprocessConfig({ voronoiMinkowskiExp: 99 }).voronoiMinkowskiExp).toBe(8);
  });

  it('builds the Postprocess shader with the selectable Voronoi metric and feature', () => {
    const source = getPostprocessFragmentSource();
    expect(source).toContain('u_postVoronoiDistMetric');
    expect(source).toContain('u_postVoronoiFeature');
    expect(source).toContain('u_postVoronoiMinkowskiExp');
    expect(source).toContain('postVoronoiDistance');
    expect(source).not.toContain('u_postVoronoiEdgeWidth');
    expect(source).not.toContain('edgeColor');
  });
});
