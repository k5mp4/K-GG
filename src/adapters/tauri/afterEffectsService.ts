import { invoke } from '@tauri-apps/api/core';
import { join, tempDir } from '@tauri-apps/api/path';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { mkdir, remove, writeFile } from '@tauri-apps/plugin-fs';
import { isTauriRuntime } from './exportService';
import type {
  AeSaveDirStatus,
  AeStatus,
  AfterEffectsService,
  NativeVideoArtifact,
} from '../types';

type NativeStatus = {
  supported: boolean;
  running: boolean;
  executablePath: string | null;
  error: string | null;
};

type NativeTransferResult = {
  status: AeStatus;
  destinationKind: 'custom' | 'project' | 'temp' | null;
  message: string | null;
};

const AUTO_SAVE_DIR: AeSaveDirStatus = { mode: 'auto', path: null, name: null };
let customSaveDir: string | null = null;

function requestToken(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function directoryName(path: string): string {
  const normalized = path.replace(/[\\/]+$/, '');
  return normalized.split(/[\\/]/).pop() || path;
}

function saveDirStatus(): AeSaveDirStatus {
  return customSaveDir
    ? { mode: 'custom', path: customSaveDir, name: directoryName(customSaveDir) }
    : AUTO_SAVE_DIR;
}

async function withTemporaryInput<T>(
  blob: Blob,
  extension: 'png' | 'mov' | 'mp4',
  callback: (inputPath: string) => Promise<T>,
): Promise<T> {
  const root = await join(await tempDir(), 'kagaribi-grad', 'after-effects-client');
  const requestDir = await join(root, `request-${requestToken()}`);
  const inputPath = await join(requestDir, `input.${extension}`);
  await mkdir(requestDir, { recursive: true });

  try {
    await writeFile(inputPath, new Uint8Array(await blob.arrayBuffer()));
    return await callback(inputPath);
  } finally {
    await remove(requestDir, { recursive: true }).catch(() => undefined);
  }
}

async function invokeTransfer(
  inputPath: string,
  extension: 'png' | 'mov' | 'mp4',
  name: string,
): Promise<AeStatus> {
  try {
    const result = await invoke<NativeTransferResult>('send_after_effects_asset', {
      request: {
        inputPath,
        extension,
        name,
        saveDir: customSaveDir,
      },
    });
    return result.status;
  } catch {
    return 'error';
  }
}

export const tauriAfterEffectsService: AfterEffectsService = {
  runtime: 'tauri-native',

  async isAvailable(): Promise<boolean> {
    try {
      const status = await invoke<NativeStatus>('get_after_effects_status');
      return status.supported
        && status.running
        && status.executablePath !== null
        && status.error === null;
    } catch {
      return false;
    }
  },

  async ping(): Promise<AeStatus> {
    try {
      const result = await invoke<NativeTransferResult>('ping_after_effects');
      return result.status;
    } catch {
      return 'error';
    }
  },

  async getSaveDir(): Promise<AeSaveDirStatus> {
    return saveDirStatus();
  },

  async chooseSaveDir(): Promise<AeSaveDirStatus> {
    try {
      const selected = await openDialog({
        title: 'After Effects送信ファイルの保存先を選択',
        directory: true,
        multiple: false,
        recursive: true,
        canCreateDirectories: true,
      });
      if (typeof selected === 'string' && selected.length > 0) {
        customSaveDir = selected;
      }
    } catch {
      // キャンセルやダイアログ失敗時は現在の指定を維持する。
    }
    return saveDirStatus();
  },

  async clearSaveDir(): Promise<AeSaveDirStatus> {
    customSaveDir = null;
    return AUTO_SAVE_DIR;
  },

  async importImage(blob: Blob, name = 'kagaribi'): Promise<AeStatus> {
    try {
      return await withTemporaryInput(blob, 'png', inputPath => invokeTransfer(inputPath, 'png', name));
    } catch {
      return 'save-failed';
    }
  },

  async importVideo(source: Blob | NativeVideoArtifact, ext: 'mov' | 'mp4' = 'mov', name = 'kagaribi'): Promise<AeStatus> {
    try {
      if (source instanceof Blob) {
        return await withTemporaryInput(source, ext, inputPath => invokeTransfer(inputPath, ext, name));
      }
      return await invokeTransfer(source.path, ext, name);
    } catch {
      return 'save-failed';
    }
  },
};

export { isTauriRuntime };
