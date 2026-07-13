import { describe, expect, it } from 'vitest';
import { getInitialProgramSource, getProgramSource } from './webglShaderSources';

describe('webglShaderSources', () => {
  it('keeps the initial program on the base generator source', () => {
    const source = getInitialProgramSource();
    expect(source.vertex).toContain('a_position');
    expect(source.fragment).toContain('u_gradientType');
  });

  it('keeps Glass and Prism compile boundaries independent', () => {
    const glass = getProgramSource('glass').fragment;
    const prism = getProgramSource('prism').fragment;
    const core = getProgramSource('stackCore').fragment;

    expect(glass).toContain('#define KGG_GLASS_ONLY');
    expect(glass).not.toContain('#define KGG_PRISM_ONLY');
    expect(prism).toContain('#define KGG_PRISM_ONLY');
    expect(prism).not.toContain('#define KGG_GLASS_ONLY');
    expect(core).toContain('#define KGG_LIGHTWEIGHT');
  });
});
