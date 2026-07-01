import type { UpdateAction, UpdateState } from './types';

export function updateReducer(state: UpdateState, action: UpdateAction): UpdateState {
  switch (action.type) {
    case 'checkStarted':
      return {
        ...state,
        status: 'checking',
        error: null,
      };
    case 'updateAvailable':
      return {
        status: 'available',
        info: action.info,
        progress: { downloadedBytes: 0 },
        error: null,
      };
    case 'upToDate':
      return {
        ...state,
        status: 'upToDate',
        info: null,
        progress: { downloadedBytes: 0 },
        error: null,
      };
    case 'downloadStarted':
      return {
        ...state,
        status: 'downloading',
        progress: {
          downloadedBytes: 0,
          contentLength: action.contentLength,
        },
        error: null,
      };
    case 'downloadProgress':
      return {
        ...state,
        status: 'downloading',
        progress: {
          ...state.progress,
          downloadedBytes: state.progress.downloadedBytes + action.chunkLength,
        },
      };
    case 'installStarted':
      return {
        ...state,
        status: 'installing',
        error: null,
      };
    case 'failed':
      return {
        ...state,
        status: 'error',
        error: action.error,
      };
  }
}

export function updateProgressPercent(state: UpdateState): number | null {
  const { downloadedBytes, contentLength } = state.progress;
  if (!contentLength || contentLength <= 0) return null;
  return Math.min(100, Math.round((downloadedBytes / contentLength) * 100));
}
