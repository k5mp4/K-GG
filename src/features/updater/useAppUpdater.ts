import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { relaunch } from '@tauri-apps/plugin-process';
import {
  check,
  type DownloadEvent,
  type Update,
} from '@tauri-apps/plugin-updater';
import { isTauriRuntime } from '../../adapters/tauri/exportService';
import { initialUpdateState } from './types';
import { updateReducer } from './updateState';

const CHECK_TIMEOUT_MS = 15_000;
const DOWNLOAD_TIMEOUT_MS = 5 * 60_000;

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  return 'アップデート処理に失敗しました。時間をおいて再試行してください。';
}

export function useAppUpdater() {
  const tauriRuntime = useMemo(() => isTauriRuntime(), []);
  const supported = tauriRuntime && import.meta.env.PROD;
  const [state, dispatch] = useReducer(updateReducer, initialUpdateState);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const pendingUpdateRef = useRef<Update | null>(null);
  const checkingRef = useRef(false);
  const startupCheckStartedRef = useRef(false);

  useEffect(() => {
    if (!tauriRuntime) return;
    void getVersion()
      .then(setAppVersion)
      .catch((error) => console.error('Failed to read app version:', error));
  }, [tauriRuntime]);

  const checkForUpdates = useCallback(async (showResult: boolean) => {
    if (!supported || checkingRef.current) return;

    checkingRef.current = true;
    dispatch({ type: 'checkStarted' });

    try {
      const update = await check({ timeout: CHECK_TIMEOUT_MS });
      const previousUpdate = pendingUpdateRef.current;
      if (previousUpdate && previousUpdate !== update) {
        await previousUpdate.close().catch(() => undefined);
      }
      pendingUpdateRef.current = update;

      if (!update) {
        dispatch({ type: 'upToDate' });
        if (showResult) setDialogOpen(true);
        return;
      }

      setAppVersion(update.currentVersion);
      dispatch({
        type: 'updateAvailable',
        info: {
          currentVersion: update.currentVersion,
          version: update.version,
          date: update.date,
          notes: update.body,
        },
      });
      setDialogOpen(true);
    } catch (error) {
      console.error('Update check failed:', error);
      dispatch({ type: 'failed', error: errorMessage(error) });
      if (showResult) setDialogOpen(true);
    } finally {
      checkingRef.current = false;
    }
  }, [supported]);

  useEffect(() => {
    if (!supported || startupCheckStartedRef.current) return;
    startupCheckStartedRef.current = true;
    const timer = window.setTimeout(() => {
      void checkForUpdates(false);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [checkForUpdates, supported]);

  const openDialog = useCallback(() => {
    setDialogOpen(true);
    if (state.status === 'idle' || state.status === 'upToDate' || state.status === 'error') {
      void checkForUpdates(true);
    }
  }, [checkForUpdates, state.status]);

  const closeDialog = useCallback(() => {
    if (state.status === 'downloading' || state.status === 'installing') return;
    setDialogOpen(false);
  }, [state.status]);

  const installUpdate = useCallback(async () => {
    const update = pendingUpdateRef.current;
    if (!update) {
      dispatch({
        type: 'failed',
        error: '更新情報が失効しました。もう一度アップデートを確認してください。',
      });
      return;
    }

    dispatch({ type: 'downloadStarted' });
    try {
      await update.downloadAndInstall((event: DownloadEvent) => {
        switch (event.event) {
          case 'Started':
            dispatch({
              type: 'downloadStarted',
              contentLength: event.data.contentLength,
            });
            break;
          case 'Progress':
            dispatch({
              type: 'downloadProgress',
              chunkLength: event.data.chunkLength,
            });
            break;
          case 'Finished':
            dispatch({ type: 'installStarted' });
            break;
        }
      }, { timeout: DOWNLOAD_TIMEOUT_MS });
      dispatch({ type: 'installStarted' });
      await relaunch();
    } catch (error) {
      console.error('Update installation failed:', error);
      dispatch({ type: 'failed', error: errorMessage(error) });
    }
  }, []);

  return {
    appVersion,
    state,
    supported,
    dialogOpen,
    openDialog,
    closeDialog,
    checkForUpdates: () => checkForUpdates(true),
    installUpdate,
  };
}
