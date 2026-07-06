import { describe, expect, it } from 'vitest';
import { STORE_DEFAULTS } from '../store/gradientStore';
import type {
  PostprocessConfig,
  PostprocessEffectMode,
} from '../types/distortion';
import { isPostprocessTimeAnimationActive } from './postprocessAnimation';

function createPostprocess(
  effectMode: PostprocessEffectMode,
  overrides: Partial<PostprocessConfig> = {},
): PostprocessConfig {
  return {
    ...STORE_DEFAULTS.postprocess,
    enabled: true,
    effectMode,
    ...overrides,
  };
}

describe('isPostprocessTimeAnimationActive', () => {
  const allModes: PostprocessEffectMode[] = [
    'distort',
    'mirror',
    'kaleidoscope',
    'prism',
    'voronoi',
    'glass',
    'particles',
  ];

  it.each(allModes)('returns false for disabled %s', effectMode => {
    expect(isPostprocessTimeAnimationActive(createPostprocess(effectMode, {
      enabled: false,
      glassMotion: 1,
    }))).toBe(false);
  });

  it.each(['prism', 'particles'] satisfies PostprocessEffectMode[])(
    'returns true for enabled %s',
    effectMode => {
      expect(isPostprocessTimeAnimationActive(createPostprocess(effectMode))).toBe(true);
    },
  );

  it.each([
    { glassMotion: 0.01, expected: true },
    { glassMotion: 0, expected: false },
    { glassMotion: -1, expected: false },
    { glassMotion: Number.NaN, expected: false },
  ])(
    'returns $expected for Glass motion $glassMotion',
    ({ glassMotion, expected }) => {
      expect(isPostprocessTimeAnimationActive(createPostprocess('glass', {
        glassMotion,
      }))).toBe(expected);
    },
  );

  it.each([
    'distort',
    'mirror',
    'kaleidoscope',
    'voronoi',
  ] satisfies PostprocessEffectMode[])(
    'returns false for static mode %s',
    effectMode => {
      expect(isPostprocessTimeAnimationActive(createPostprocess(effectMode))).toBe(false);
    },
  );

  it('defaults unknown runtime modes to static', () => {
    expect(isPostprocessTimeAnimationActive(createPostprocess(
      'future-mode' as PostprocessEffectMode,
    ))).toBe(false);
  });
});
