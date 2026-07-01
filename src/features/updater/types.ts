export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'upToDate'
  | 'available'
  | 'downloading'
  | 'installing'
  | 'error';

export type UpdateInfo = {
  currentVersion: string;
  version: string;
  date?: string;
  notes?: string;
};

export type UpdateProgress = {
  downloadedBytes: number;
  contentLength?: number;
};

export type UpdateState = {
  status: UpdateStatus;
  info: UpdateInfo | null;
  progress: UpdateProgress;
  error: string | null;
};

export type UpdateAction =
  | { type: 'checkStarted' }
  | { type: 'updateAvailable'; info: UpdateInfo }
  | { type: 'upToDate' }
  | { type: 'downloadStarted'; contentLength?: number }
  | { type: 'downloadProgress'; chunkLength: number }
  | { type: 'installStarted' }
  | { type: 'failed'; error: string };

export const initialUpdateState: UpdateState = {
  status: 'idle',
  info: null,
  progress: {
    downloadedBytes: 0,
  },
  error: null,
};
