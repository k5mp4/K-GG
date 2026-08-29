import { afterEach, describe, expect, it } from 'vitest';
import {
  ANIMATION_DURATION_MAX,
  ANIMATION_DURATION_MIN,
  ANIMATION_SPEED_MAX,
  ANIMATION_SPEED_MIN,
  useGradientStore,
} from './gradientStore';
import type { PropertyTrack } from '../types/keyframe';
import type { SlitScanConfig } from '../types/distortion';

describe('animation store constraints', () => {
  const initialAnimation = useGradientStore.getState().animation;
  const initialTracks = useGradientStore.getState().keyframeTracks;

  afterEach(() => {
    useGradientStore.setState({ animation: initialAnimation, keyframeTracks: initialTracks });
  });

  it('clamps Duration and Speed to the preview control ranges', () => {
    useGradientStore.getState().setAnimation({ duration: 0.1, speed: 99 });
    expect(useGradientStore.getState().animation.duration).toBe(ANIMATION_DURATION_MIN);
    expect(useGradientStore.getState().animation.speed).toBe(ANIMATION_SPEED_MAX);

    useGradientStore.getState().setAnimation({ duration: 99, speed: 0.1 });
    expect(useGradientStore.getState().animation.duration).toBe(ANIMATION_DURATION_MAX);
    expect(useGradientStore.getState().animation.speed).toBe(ANIMATION_SPEED_MIN);
  });

  it('clamps newly added loop keyframes to the editable half', () => {
    useGradientStore.setState({
      animation: { ...initialAnimation, previewLoop: true },
      keyframeTracks: {
        'test.value': {
          propertyId: 'test.value',
          label: 'Test',
          mode: 'keys',
          enabled: true,
          keyframes: [],
        },
      },
    });

    useGradientStore.getState().addKeyframe('test.value', {
      time: 0.9,
      value: 1,
      interpolation: 'linear',
    });

    expect(useGradientStore.getState().keyframeTracks['test.value'].keyframes[0].time).toBe(0.5);
  });

  it('removes legacy Slit phase motion from state and tracks', () => {
    const legacyTrack: PropertyTrack = {
      propertyId: 'slitScan.slitPhase',
      label: 'Phase Motion',
      mode: 'auto',
      enabled: true,
      keyframes: [],
    };

    useGradientStore.getState().setKeyframeTracks({ 'slitScan.slitPhase': legacyTrack });
    expect(useGradientStore.getState().keyframeTracks).not.toHaveProperty('slitScan.slitPhase');

    useGradientStore.getState().setSlitScan({
      phaseAnimEnabled: true,
      phaseSpeed: 0,
      slitPhase: 12,
    } as unknown as Partial<SlitScanConfig>);
    expect(useGradientStore.getState().slitScan).not.toHaveProperty('phaseAnimEnabled');
    expect(useGradientStore.getState().slitScan).not.toHaveProperty('phaseSpeed');
    expect(useGradientStore.getState().slitScan.slitPhase).toBe(12);
  });
});
