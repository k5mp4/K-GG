import type {
  AeSaveDirStatus,
  AeStatus,
  AfterEffectsService,
  NativeVideoArtifact,
} from '../types';

const AE_BASE = 'http://localhost:7749';
const AUTO_SAVE_DIR: AeSaveDirStatus = { mode: 'auto', path: null, name: null };

/** Web版は既存のlocalhost Bridgeを使い、Tauri版と同じサービス契約へ収める。 */
export const browserAfterEffectsService: AfterEffectsService = {
  runtime: 'browser-bridge',

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${AE_BASE}/api/ae/status`, {
        signal: AbortSignal.timeout(1500),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async ping(): Promise<AeStatus> {
    try {
      const res = await fetch(`${AE_BASE}/api/ae/ping`);
      const body = await res.json() as { status: AeStatus };
      return body.status;
    } catch {
      return 'error';
    }
  },

  async getSaveDir(): Promise<AeSaveDirStatus> {
    try {
      const res = await fetch(`${AE_BASE}/api/ae/save-dir`, {
        signal: AbortSignal.timeout(1500),
      });
      if (!res.ok) throw new Error('save-dir unavailable');
      return await res.json() as AeSaveDirStatus;
    } catch {
      return AUTO_SAVE_DIR;
    }
  },

  async chooseSaveDir(): Promise<AeSaveDirStatus> {
    try {
      const res = await fetch(`${AE_BASE}/api/ae/save-dir/choose`, { method: 'POST' });
      if (!res.ok) throw new Error('save-dir choose failed');
      return await res.json() as AeSaveDirStatus;
    } catch {
      return AUTO_SAVE_DIR;
    }
  },

  async clearSaveDir(): Promise<AeSaveDirStatus> {
    try {
      const res = await fetch(`${AE_BASE}/api/ae/save-dir/clear`, { method: 'POST' });
      if (!res.ok) throw new Error('save-dir clear failed');
      return await res.json() as AeSaveDirStatus;
    } catch {
      return AUTO_SAVE_DIR;
    }
  },

  async importImage(blob: Blob, name = 'kagaribi'): Promise<AeStatus> {
    try {
      const params = new URLSearchParams({ name });
      const res = await fetch(`${AE_BASE}/api/ae/import-image?${params.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'image/png' },
        body: blob,
      });
      const body = await res.json() as { status: AeStatus };
      return body.status;
    } catch {
      return 'error';
    }
  },

  async importVideo(source: Blob | NativeVideoArtifact, ext: 'mov' | 'mp4' = 'mov', name = 'kagaribi'): Promise<AeStatus> {
    if (!(source instanceof Blob)) return 'unsupported';
    try {
      const params = new URLSearchParams({ ext, name });
      const res = await fetch(`${AE_BASE}/api/ae/import-video?${params.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': source.type || 'video/quicktime' },
        body: source,
      });
      const body = await res.json() as { status: AeStatus };
      return body.status;
    } catch {
      return 'error';
    }
  },
};
