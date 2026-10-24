import { describe, expect, it } from 'vitest';
import sharedShader from '../shaders/postprocess/shared.glsl?raw';
import {
  POSTPROCESS_KALEIDOSCOPE_LATTICE_TYPES,
  POSTPROCESS_KALEIDOSCOPE_SHADER_IDS,
  POSTPROCESS_KALEIDOSCOPE_TYPES,
  isKaleidoscopeLatticeType,
} from './distortion';

describe('Kaleidoscope mirroring types', () => {
  it('keeps the shader ids of types saved by earlier presets', () => {
    expect(POSTPROCESS_KALEIDOSCOPE_SHADER_IDS.unfold).toBe(0);
    expect(POSTPROCESS_KALEIDOSCOPE_SHADER_IDS.flower).toBe(1);
    expect(POSTPROCESS_KALEIDOSCOPE_SHADER_IDS.starlish).toBe(2);
  });

  it('gives every type a distinct shader id', () => {
    const ids = POSTPROCESS_KALEIDOSCOPE_TYPES.map((type) => POSTPROCESS_KALEIDOSCOPE_SHADER_IDS[type]);
    expect(new Set(ids).size).toBe(POSTPROCESS_KALEIDOSCOPE_TYPES.length);
    expect(Object.keys(POSTPROCESS_KALEIDOSCOPE_SHADER_IDS).sort()).toEqual([...POSTPROCESS_KALEIDOSCOPE_TYPES].sort());
  });

  it('branches on every non-default id in the shader', () => {
    for (const type of POSTPROCESS_KALEIDOSCOPE_TYPES) {
      const id = POSTPROCESS_KALEIDOSCOPE_SHADER_IDS[type];
      if (id === 0) continue;
      expect(sharedShader, type).toMatch(new RegExp(`u_kaleidoscopeType == ${id}\\b`));
    }
  });

  it('routes only the lattice types through the lattice branch', () => {
    const latticeIds = POSTPROCESS_KALEIDOSCOPE_LATTICE_TYPES.map((type) => POSTPROCESS_KALEIDOSCOPE_SHADER_IDS[type]);
    const routing = sharedShader.match(/if \((u_kaleidoscopeType == \d+(?: \|\| )?)+\) \{\n\s+vec2 latticeSampled/)?.[0] ?? '';
    const routedIds = [...routing.matchAll(/u_kaleidoscopeType == (\d+)/g)].map((match) => Number(match[1]));
    expect(routedIds.sort()).toEqual([...latticeIds].sort());
    expect(POSTPROCESS_KALEIDOSCOPE_TYPES.filter(isKaleidoscopeLatticeType)).toEqual(
      POSTPROCESS_KALEIDOSCOPE_TYPES.filter((type) => (POSTPROCESS_KALEIDOSCOPE_LATTICE_TYPES as readonly string[]).includes(type)),
    );
  });
});
