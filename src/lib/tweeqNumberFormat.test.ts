import { describe, expect, it } from 'vitest';
import { inferFormatInfo } from './tweeqNumberFormat';

describe('inferFormatInfo', () => {
  it('keeps percentage format while exposing the model value to the caller', () => {
    const info = inferFormatInfo(value => `${Math.round(value * 100)}%`, 0.25, 0, 1, 0.01);

    expect(info).toMatchObject({ scale: 100, offset: 0, prefix: '', suffix: '%' });
  });

  it('extracts precision and units from a numeric formatter', () => {
    const info = inferFormatInfo(value => `${value.toFixed(2)}px`, 1.25, 0, 10, 0.01);

    expect(info).toMatchObject({ scale: 1, offset: 0, suffix: 'px', precision: 2 });
  });

  it('handles a formatter with a non-numeric display at one boundary', () => {
    const info = inferFormatInfo(value => value < 0.5 ? 'Off' : `${value.toFixed(1)}px σ`, 0, 0, 1, 0.1);

    expect(info).toMatchObject({ scale: 1, offset: 0, suffix: 'px σ' });
  });

  it('returns null when no pair of formatted values contains numbers', () => {
    expect(inferFormatInfo(() => 'Off', 0, 0, 1, 0.1)).toBeNull();
  });
});
