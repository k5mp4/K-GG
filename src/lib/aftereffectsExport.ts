/**
 * aftereffectsExport.ts
 *
 * クライアントサイドから After Effects 連携 API を呼び出すユーティリティ。
 *
 * dev/prod ともに、ユーザーの PC で起動中の KGG_AE_Bridge (localhost:7749) を使う。
 * Vite dev server の /api/ae/* middleware には依存しない。
 */

const AE_BASE = 'http://localhost:7749';

export type AeStatus = 'ok' | 'not-running' | 'error';

export type AeSaveDirStatus = {
  mode: 'auto' | 'custom';
  path: string | null;
  name: string | null;
};

/**
 * AE Bridge が起動中かを確認する。
 * alert を発生させない status endpoint を使う。
 */
export async function aeBridgeAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${AE_BASE}/api/ae/status`, {
      signal: AbortSignal.timeout(1500),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** AE が起動中かを確認し、alert を出す（接続テスト） */
export async function aePing(): Promise<AeStatus> {
  try {
    const res = await fetch(`${AE_BASE}/api/ae/ping`);
    const body = await res.json() as { status: AeStatus };
    return body.status;
  } catch {
    return 'error';
  }
}

export async function aeGetSaveDir(): Promise<AeSaveDirStatus> {
  try {
    const res = await fetch(`${AE_BASE}/api/ae/save-dir`, {
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) throw new Error('save-dir unavailable');
    return await res.json() as AeSaveDirStatus;
  } catch {
    return { mode: 'auto', path: null, name: null };
  }
}

export async function aeChooseSaveDir(): Promise<AeSaveDirStatus> {
  try {
    const res = await fetch(`${AE_BASE}/api/ae/save-dir/choose`, { method: 'POST' });
    if (!res.ok) throw new Error('save-dir choose failed');
    return await res.json() as AeSaveDirStatus;
  } catch {
    return { mode: 'auto', path: null, name: null };
  }
}

export async function aeClearSaveDir(): Promise<AeSaveDirStatus> {
  try {
    const res = await fetch(`${AE_BASE}/api/ae/save-dir/clear`, { method: 'POST' });
    if (!res.ok) throw new Error('save-dir clear failed');
    return await res.json() as AeSaveDirStatus;
  } catch {
    return { mode: 'auto', path: null, name: null };
  }
}

/** 現在の canvas の PNG を AE にインポートする */
export async function aeImportImage(blob: Blob, name = 'kagaribi'): Promise<AeStatus> {
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
}

/** 動画 Blob を AE にインポートする */
export async function aeImportVideo(blob: Blob, ext: 'mov' | 'mp4' = 'mov', name = 'kagaribi'): Promise<AeStatus> {
  try {
    const params = new URLSearchParams({ ext, name });
    const res = await fetch(`${AE_BASE}/api/ae/import-video?${params.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': blob.type || 'video/quicktime' },
      body: blob,
    });
    const body = await res.json() as { status: AeStatus };
    return body.status;
  } catch {
    return 'error';
  }
}
