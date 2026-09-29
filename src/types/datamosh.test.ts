import { describe, expect, it } from 'vitest';
import {
  DATAMOSH_DEFAULTS,
  datamoshFromLegacyVideoMotion,
  normalizeDatamoshConfig,
  resolvePersistedDatamosh,
} from './datamosh';

describe('datamosh config', () => {
  it('clamps numeric values and rejects unknown enum values', () => {
    const value = normalizeDatamoshConfig({
      enabled: true,
      motionSource: 'codec',
      mixMode: 'screen',
      strength: 9,
      feedback: 2,
      blockSize: 12.6,
      jitter: Number.NaN,
      lumaStretch: -9,
      blockVariance: 3,
      freeze: 'yes',
    });

    expect(value.enabled).toBe(true);
    expect(value.motionSource).toBe('animation');
    expect(value.mixMode).toBe('mix');
    expect(value.strength).toBe(2);
    expect(value.feedback).toBe(0.995);
    expect(value.blockSize).toBe(13);
    expect(value.jitter).toBe(DATAMOSH_DEFAULTS.jitter);
    expect(value.lumaStretch).toBe(-2);
    expect(value.blockVariance).toBe(1);
    expect(value.freeze).toBe(false);
  });

  it('clamps the Pixel Stretch curl settings and keeps curl off by default', () => {
    const value = normalizeDatamoshConfig({ pixelStretchCurl: 3, pixelStretchCurlScale: 0 });

    expect(value.pixelStretchCurl).toBe(1);
    expect(value.pixelStretchCurlScale).toBe(0.25);
    expect(normalizeDatamoshConfig({ pixelStretchCurl: 'much' }).pixelStretchCurl).toBe(0);
    expect(DATAMOSH_DEFAULTS.pixelStretchCurl).toBe(0);
    expect(normalizeDatamoshConfig({ pixelStretchCurlLoops: 2.6 }).pixelStretchCurlLoops).toBe(3);
    expect(normalizeDatamoshConfig({ pixelStretchCurlLoops: 99 }).pixelStretchCurlLoops).toBe(8);
    expect(normalizeDatamoshConfig({}).pixelStretchCurlLoops).toBe(1);
  });

  it('falls back to defaults for malformed input', () => {
    expect(normalizeDatamoshConfig(null)).toEqual(DATAMOSH_DEFAULTS);
    expect(normalizeDatamoshConfig('datamosh')).toEqual(DATAMOSH_DEFAULTS);
  });

  it('accepts the Pixel Stretch source and clamps its values', () => {
    const value = normalizeDatamoshConfig({
      motionSource: 'pixelStretch',
      pixelStretchAngle: 400,
      pixelStretchLength: 0,
      pixelStretchThreshold: -1,
      pixelStretchVariance: 'wide',
    });

    expect(value.motionSource).toBe('pixelStretch');
    expect(value.pixelStretchAngle).toBe(360);
    expect(value.pixelStretchLength).toBe(1);
    expect(value.pixelStretchThreshold).toBe(0);
    expect(value.pixelStretchVariance).toBe(DATAMOSH_DEFAULTS.pixelStretchVariance);
    // Presets saved before Pixel Stretch keep their source and get default streak settings.
    expect(normalizeDatamoshConfig({ motionSource: 'procedural' })).toMatchObject({
      motionSource: 'procedural',
      pixelStretchAngle: DATAMOSH_DEFAULTS.pixelStretchAngle,
      pixelStretchLength: DATAMOSH_DEFAULTS.pixelStretchLength,
    });
  });
});

describe('legacy Video Motion migration', () => {
  const legacyVideoMotion = {
    enabled: false,
    mode: 'feedback',
    effectStrength: 1,
    blendAmount: 1,
    feedbackAmount: 1,
    decay: 0.9,
    smearLength: 0.5,
    motionDamping: 0.2,
    fieldSmoothing: 0.6,
    stabilization: 0.35,
  };

  it('maps Motion Feedback onto a video-driven, ramp-locked Datamosh without corruption', () => {
    const value = datamoshFromLegacyVideoMotion(legacyVideoMotion, true);

    expect(value).toMatchObject({
      enabled: true,
      motionSource: 'video',
      mixMode: 'rampLock',
      strength: 0.5,
      refresh: 0,
      feedback: 0.82,
      blockSize: 1,
      blockLock: 1,
      blockVariance: 0,
      lumaStretch: 0,
      saturationStretch: 0,
      glitchAmount: 0,
      neighborMix: 0,
      jitter: 0,
      videoMotionDamping: 0.2,
      videoFieldSmoothing: 0.6,
    });
  });

  it('takes the V2 on/off state from the removed Effect Stack layer', () => {
    const enabled = resolvePersistedDatamosh({
      videoMotion: legacyVideoMotion,
      effectPipeline: { version: 'stack-v2', effectStack: [{ kind: 'videoMotion', enabled: true }] },
    });
    const disabled = resolvePersistedDatamosh({
      videoMotion: { ...legacyVideoMotion, enabled: true },
      effectPipeline: { version: 'stack-v2', effectStack: [{ kind: 'videoMotion', enabled: false }] },
    });

    expect(enabled.enabled).toBe(true);
    expect(enabled.motionSource).toBe('video');
    expect(disabled.enabled).toBe(false);
  });

  it('keeps the standalone flag for documents without a Video Motion layer', () => {
    const value = resolvePersistedDatamosh({
      videoMotion: { ...legacyVideoMotion, enabled: true },
      effectPipeline: { version: 'stack-v2', effectStack: [{ kind: 'diffuse', enabled: true }] },
    });

    expect(value.enabled).toBe(true);
  });

  it('prefers a stored datamosh value and defaults when nothing was stored', () => {
    expect(resolvePersistedDatamosh({
      datamosh: { enabled: true, blockSize: 32 },
      videoMotion: legacyVideoMotion,
    })).toMatchObject({ enabled: true, blockSize: 32, motionSource: 'animation' });
    expect(normalizeDatamoshConfig({ motionSource: 'procedural' }).motionSource).toBe('procedural');
    expect(resolvePersistedDatamosh({})).toEqual(DATAMOSH_DEFAULTS);
  });
});
