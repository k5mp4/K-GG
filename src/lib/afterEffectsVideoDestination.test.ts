import { describe, expect, it } from 'vitest';
import {
  shouldRetryAeVideoFromNativeArtifact,
  shouldReuseExportVideoPath,
} from './afterEffectsVideoDestination';

describe('shouldReuseExportVideoPath', () => {
  it('uses the saved Export file in the default mode', () => {
    expect(
      shouldReuseExportVideoPath('export', 'C:/Exports/gradient.mov', null),
    ).toBe(true);
  });

  it('does not require an AE folder when Export mode is selected', () => {
    expect(
      shouldReuseExportVideoPath('export', 'C:/Exports/gradient.mov', 'C:/Other'),
    ).toBe(true);
  });

  it('reuses the file when a custom AE folder resolves to the Export folder', () => {
    expect(
      shouldReuseExportVideoPath('custom', 'C:/Exports/gradient.mov', 'c:\\exports\\'),
    ).toBe(true);
  });

  it('matches Windows extended paths with their normal form', () => {
    expect(
      shouldReuseExportVideoPath('custom', '\\\\?\\C:\\Exports\\gradient.mov', 'C:\\Exports'),
    ).toBe(true);
  });

  it('keeps the copy path when the AE folder is different or unavailable', () => {
    expect(
      shouldReuseExportVideoPath('custom', 'C:/Exports/gradient.mov', 'C:/AE'),
    ).toBe(false);
    expect(
      shouldReuseExportVideoPath('custom', 'C:/Exports/gradient.mov', null),
    ).toBe(false);
    expect(
      shouldReuseExportVideoPath('export', null, null),
    ).toBe(false);
  });

  it('retries from the retained native artifact when direct Export reuse is rejected before JSX', () => {
    expect(shouldRetryAeVideoFromNativeArtifact('save-failed', true)).toBe(true);
    expect(shouldRetryAeVideoFromNativeArtifact('jsx-failed', true)).toBe(false);
    expect(shouldRetryAeVideoFromNativeArtifact('save-failed', false)).toBe(false);
  });
});
