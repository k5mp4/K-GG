import { describe, expect, it } from 'vitest';
import { getPostprocessFragmentSource, getProgramSource } from './webglShaderSources';

describe('GlassTile shader source', () => {
  it('exposes a dedicated specialized program separate from Glass V2', () => {
    const source = getProgramSource('glassTile').fragment;

    expect(source).toContain('#define KGG_GLASS_TILE_ONLY');
    expect(source).toContain('vec4 glassTile(');
    expect(source).toContain('glassTileCoordinate');
    expect(source).toContain('glassTileResolveUv');
    expect(source).toContain('u_glassTilePattern');
    expect(source).toContain('u_glassTileEdgeMode');
    expect(source).not.toContain('#define KGG_GLASS_V2_ONLY');
  });

  it('keeps the tile shader on global coordinates for tiled export continuity', () => {
    const source = getPostprocessFragmentSource();

    expect(source).toContain('vec2 glassTileGlobalCoord');
    expect(source).toContain('u_fullResolution');
    expect(source).toContain('u_tileOffset');
    expect(source).toContain('sampleGlassTileSource');
  });

  it('does not add tile-only calls to the lightweight Stack Core variant', () => {
    const source = getProgramSource('stackCore').fragment;

    expect(source).toContain('#if !defined(KGG_LIGHTWEIGHT) && (defined(KGG_GLASS_TILE_ONLY)');
    expect(source).not.toContain('vec4 glassTile(');
  });
});
