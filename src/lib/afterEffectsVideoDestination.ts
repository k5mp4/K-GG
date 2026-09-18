import type { AeStatus } from '../adapters';

export type AeVideoSendMode = 'export' | 'custom';

function normalizeLocalPath(path: string): string {
  return path
    .replace(/^\\\\\?\\UNC\\/i, '\\\\')
    .replace(/^\\\\\?\\/i, '')
    .replace(/^\/\/\?\/UNC\//i, '//')
    .replace(/^\/\/\?\//i, '')
    .replace(/[\\/]+/g, '/')
    .replace(/\/+$/, '')
    .toLowerCase();
}

function directoryOf(path: string): string {
  const normalized = path.replace(/[\\/]+$/, '');
  const separator = Math.max(normalized.lastIndexOf('/'), normalized.lastIndexOf('\\'));
  return separator >= 0 ? normalized.slice(0, separator) : '';
}

/**
 * AE用の保存先がExport先と同じ場合も、成果物を再コピーしない。
 * パスはTauriのローカルファイルパスを想定する。
 */
export function shouldReuseExportVideoPath(
  mode: AeVideoSendMode,
  exportedPath: string | null,
  aeSaveDir: string | null,
): boolean {
  if (!exportedPath) return false;
  if (mode === 'export') return true;
  if (!aeSaveDir) return false;
  return normalizeLocalPath(directoryOf(exportedPath)) === normalizeLocalPath(aeSaveDir);
}

/**
 * Export先の直接参照だけが送信元パスの許可状態に依存するため、
 * その事前保存チェックに失敗した場合は、保持中のネイティブ成果物へ
 * 一度だけ戻して送信を継続する。
 */
export function shouldRetryAeVideoFromNativeArtifact(
  status: AeStatus,
  reusedExportPath: boolean,
): boolean {
  return reusedExportPath && status === 'save-failed';
}
