import { useCallback, useRef, useState } from 'react';
import {
  getNativeFfmpegStatus,
  nativeFfmpegSupported,
  openFfmpegBuildsPage,
  openNativeFfmpegFolder,
} from '../../lib/exportVideo';
import type { NativeFfmpegStatus } from '../../adapters';

function statusAfterError(error: unknown, current: NativeFfmpegStatus | null): NativeFfmpegStatus {
  return {
    supported: true,
    available: current?.available ?? false,
    source: current?.source ?? null,
    path: current?.path ?? null,
    version: current?.version ?? null,
    error: error instanceof Error ? error.message : String(error),
    warning: current?.warning ?? null,
    folderPath: current?.folderPath ?? null,
  };
}

/** Owns FFmpeg discovery state while keeping native calls behind lib/adapters. */
export function useNativeFfmpeg(isExportTabActive: () => boolean) {
  const activeTabCheckRef = useRef(isExportTabActive);
  activeTabCheckRef.current = isExportTabActive;
  const [ffmpegStatus, setFfmpegStatus] = useState<NativeFfmpegStatus | null>(null);
  const [ffmpegChecking, setFfmpegChecking] = useState(false);
  const [ffmpegDialogOpen, setFfmpegDialogOpen] = useState(false);
  const ffmpegCheckRequestRef = useRef(0);

  const refreshFfmpegStatus = useCallback(async (showDialog: boolean): Promise<NativeFfmpegStatus | null> => {
    if (!nativeFfmpegSupported()) return null;
    const requestId = ++ffmpegCheckRequestRef.current;
    setFfmpegChecking(true);
    try {
      const status = await getNativeFfmpegStatus();
      if (requestId !== ffmpegCheckRequestRef.current) return status;
      setFfmpegStatus(status);
      if (status.available) {
        setFfmpegDialogOpen(false);
      } else if (showDialog && activeTabCheckRef.current()) {
        setFfmpegDialogOpen(true);
      }
      return status;
    } catch (error) {
      const status = statusAfterError(error, null);
      if (requestId === ffmpegCheckRequestRef.current) {
        setFfmpegStatus(status);
        if (showDialog && activeTabCheckRef.current()) setFfmpegDialogOpen(true);
      }
      return status;
    } finally {
      if (requestId === ffmpegCheckRequestRef.current) setFfmpegChecking(false);
    }
  }, []);

  const closeFfmpegDialog = useCallback(() => setFfmpegDialogOpen(false), []);

  const recordFfmpegError = useCallback((error: unknown) => {
    setFfmpegStatus(current => statusAfterError(error, current));
  }, []);

  const handleOpenBuildsPage = useCallback(() => {
    void openFfmpegBuildsPage().catch(recordFfmpegError);
  }, [recordFfmpegError]);

  const handleOpenFolder = useCallback(() => {
    void openNativeFfmpegFolder().catch(recordFfmpegError);
  }, [recordFfmpegError]);

  return {
    ffmpegStatus,
    ffmpegChecking,
    ffmpegDialogOpen,
    refreshFfmpegStatus,
    closeFfmpegDialog,
    handleOpenBuildsPage,
    handleOpenFolder,
  };
}
