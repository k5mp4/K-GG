import { describe, expect, it } from 'vitest';
import { initialUpdateState } from './types';
import { updateProgressPercent, updateReducer } from './updateState';

describe('updateReducer', () => {
  it('stores update metadata when a release is available', () => {
    const state = updateReducer(initialUpdateState, {
      type: 'updateAvailable',
      info: {
        currentVersion: '0.1.0',
        version: '0.1.1',
        notes: 'Fix export',
      },
    });

    expect(state.status).toBe('available');
    expect(state.info?.version).toBe('0.1.1');
    expect(state.error).toBeNull();
  });

  it('accumulates download progress and caps the percentage', () => {
    let state = updateReducer(initialUpdateState, {
      type: 'downloadStarted',
      contentLength: 100,
    });
    state = updateReducer(state, { type: 'downloadProgress', chunkLength: 40 });
    state = updateReducer(state, { type: 'downloadProgress', chunkLength: 80 });

    expect(state.progress.downloadedBytes).toBe(120);
    expect(updateProgressPercent(state)).toBe(100);
  });

  it('preserves release metadata when an installation fails', () => {
    const available = updateReducer(initialUpdateState, {
      type: 'updateAvailable',
      info: {
        currentVersion: '0.1.0',
        version: '0.1.1',
      },
    });
    const failed = updateReducer(available, {
      type: 'failed',
      error: 'network unavailable',
    });

    expect(failed.status).toBe('error');
    expect(failed.info?.version).toBe('0.1.1');
    expect(failed.error).toBe('network unavailable');
  });
});
