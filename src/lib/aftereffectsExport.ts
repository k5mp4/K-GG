/**
 * After Effects連携の環境差をUIから隠すFacade。
 *
 * Web版は既存のlocalhost Bridge、Tauri版はRust commandを使用する。
 * Tauri版で大きなBlobをIPCへ直接渡さないよう、保存・送信の詳細はAdapter側に置く。
 */

import { adapters } from '../adapters';
import type { AeSaveDirStatus, AeStatus, NativeVideoArtifact } from '../adapters';

export type { AeSaveDirStatus, AeStatus } from '../adapters';

export const aeRuntime = adapters.afterEffectsService.runtime;

/** After EffectsまたはWeb版Bridgeが利用可能かを確認する。 */
export async function aeBridgeAvailable(): Promise<boolean> {
  return adapters.afterEffectsService.isAvailable();
}

/** After Effectsへの接続テストを実行する。 */
export async function aePing(): Promise<AeStatus> {
  return adapters.afterEffectsService.ping();
}

export async function aeGetSaveDir(): Promise<AeSaveDirStatus> {
  return adapters.afterEffectsService.getSaveDir();
}

export async function aeChooseSaveDir(): Promise<AeSaveDirStatus> {
  return adapters.afterEffectsService.chooseSaveDir();
}

export async function aeClearSaveDir(): Promise<AeSaveDirStatus> {
  return adapters.afterEffectsService.clearSaveDir();
}

/** 現在のcanvasのPNGをAfter Effectsへ送信する。 */
export async function aeImportImage(blob: Blob, name = 'kagaribi'): Promise<AeStatus> {
  return adapters.afterEffectsService.importImage(blob, name);
}

/** 動画またはネイティブ動画成果物をAfter Effectsへ送信する。 */
export async function aeImportVideo(
  source: Blob | NativeVideoArtifact,
  ext: 'mov' | 'mp4' = 'mov',
  name = 'kagaribi',
): Promise<AeStatus> {
  return adapters.afterEffectsService.importVideo(source, ext, name);
}
