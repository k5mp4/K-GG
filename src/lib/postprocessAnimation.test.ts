import { describe, expect, it } from 'vitest';
import { STORE_DEFAULTS } from '../store/gradientStore';
import type {
  PostprocessConfig,
  PostprocessEffectMode,
} from '../types/distortion';
import { isPostprocessTimeAnimationActive } from './postprocessAnimation';
import { createDefaultPostprocessStack } from './postprocessStack';
import { createDefaultEffectPipeline, updateEffectStackLayer } from './effectPipeline';

function createPostprocess(
  effectMode: PostprocessEffectMode,
  overrides: Partial<PostprocessConfig> = {},
): PostprocessConfig {
  return {
    ...STORE_DEFAULTS.postprocess,
    enabled: true,
    effectMode,
    effectStack: createDefaultPostprocessStack(effectMode),
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

  it('uses active stack layers even when another layer is selected for editing', () => {
    expect(isPostprocessTimeAnimationActive(createPostprocess('mirror', {
      effectStack: [
        { kind: 'glass', enabled: true },
        { kind: 'mirror', enabled: false },
        { kind: 'distort', enabled: false },
        { kind: 'kaleidoscope', enabled: false },
        { kind: 'prism', enabled: false },
        { kind: 'voronoi', enabled: false },
      ],
      glassMotion: 0.2,
    }))).toBe(true);
  });

  it('ignores disabled animated stack layers', () => {
    expect(isPostprocessTimeAnimationActive(createPostprocess('glass', {
      effectStack: [
        { kind: 'glass', enabled: false },
        { kind: 'prism', enabled: false },
        { kind: 'distort', enabled: false },
        { kind: 'mirror', enabled: false },
        { kind: 'kaleidoscope', enabled: false },
        { kind: 'voronoi', enabled: false },
      ],
      glassMotion: 1,
    }))).toBe(false);
  });

  it('uses the V2 Glass layer when deciding whether shared time is active', () => {
    const pipeline = createDefaultEffectPipeline();
    const glassPipeline = {
      ...pipeline,
      effectStack: updateEffectStackLayer(pipeline.effectStack, 'glass', { enabled: true }),
    };
    expect(isPostprocessTimeAnimationActive(
      createPostprocess('distort', { glassMotion: 0.2 }),
      glassPipeline,
    )).toBe(true);
    expect(isPostprocessTimeAnimationActive(
      createPostprocess('distort', { glassMotion: 0 }),
      glassPipeline,
    )).toBe(false);
  });
});
