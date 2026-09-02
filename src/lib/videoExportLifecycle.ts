export type VideoExportCompletionOptions = {
  save: () => Promise<boolean>;
  onSaved: () => void;
  releaseExport: () => void;
  sendToAe?: () => Promise<void>;
  onSendError?: (error: unknown) => void;
};

/**
 * 保存結果を確定してから、必要ならAfter Effectsへ送信する動画exportの境界。
 * export sessionはAE送信を開始する前に解放し、AE完了を待たずに書き出し処理を返す。
 * 保存キャンセルや送信失敗でも解放済み状態を維持する。
 */
export async function completeVideoExport({
  save,
  onSaved,
  releaseExport,
  sendToAe,
  onSendError = error => console.error('After Effects video send failed:', error),
}: VideoExportCompletionOptions): Promise<boolean> {
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    releaseExport();
  };

  try {
    const saved = await save();
    if (!saved) return false;

    onSaved();
    release();
    if (sendToAe) void sendToAe().catch(onSendError);
    return true;
  } finally {
    release();
  }
}
