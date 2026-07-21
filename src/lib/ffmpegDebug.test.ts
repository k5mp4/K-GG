import { describe, expect, it } from 'vitest';
import { shouldSimulateMissingFfmpeg } from './exportVideo';

describe('shouldSimulateMissingFfmpeg', () => {
  it('enables simulation only for the development build and exact flag value', () => {
    expect(shouldSimulateMissingFfmpeg(true, '1')).toBe(true);
    expect(shouldSimulateMissingFfmpeg(true, '0')).toBe(false);
    expect(shouldSimulateMissingFfmpeg(true, undefined)).toBe(false);
    expect(shouldSimulateMissingFfmpeg(false, '1')).toBe(false);
  });
});
