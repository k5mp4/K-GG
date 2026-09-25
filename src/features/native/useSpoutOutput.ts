import { useEffect, useSyncExternalStore } from 'react';
import { isTauriRuntime } from '../../adapters/tauri/exportService';
import { createTauriSpoutOutputBackend } from '../../adapters/tauri/spoutOutputService';
import { subscribeProcessedCanvasFrame } from '../../lib/processedCanvasClock';
import { renderBridge } from '../../lib/renderBridge';
import {
  DEFAULT_SPOUT_FRAME_RATE,
  DEFAULT_SPOUT_SENDER_NAME,
  SPOUT_FRAME_RATES,
  SpoutOutputController,
  validateSpoutSenderName,
  type SpoutFrameRate,
} from '../../lib/spoutOutput';
import { getRegisteredWebGLContext } from '../../lib/webgl';
import { createCanvasFrameSource } from '../../lib/webglFrameReadback';

const SENDER_NAME_STORAGE_KEY = 'kgg_spout_sender_name';
const FRAME_RATE_STORAGE_KEY = 'kgg_spout_frame_rate';

function readStoredSenderName(): string {
  try {
    const saved = window.localStorage.getItem(SENDER_NAME_STORAGE_KEY);
    if (saved && !validateSpoutSenderName(saved)) return saved.trim();
  } catch { /* storage is optional */ }
  return DEFAULT_SPOUT_SENDER_NAME;
}

function readStoredFrameRate(): SpoutFrameRate {
  try {
    const saved = Number(window.localStorage.getItem(FRAME_RATE_STORAGE_KEY));
    const match = SPOUT_FRAME_RATES.find(rate => rate === saved);
    if (match) return match;
  } catch { /* storage is optional */ }
  return DEFAULT_SPOUT_FRAME_RATE;
}

function store(key: string, value: string): void {
  try { window.localStorage.setItem(key, value); } catch { /* keep the in-memory setting */ }
}

let controller: SpoutOutputController | null = null;

/**
 * One controller per window. Spout is only wired in the Tauri desktop app;
 * the web build gets an unsupported controller and never calls native code.
 */
export function getSpoutOutputController(): SpoutOutputController {
  if (!controller) {
    controller = new SpoutOutputController({
      backend: isTauriRuntime() ? createTauriSpoutOutputBackend() : null,
      initialSenderName: readStoredSenderName(),
      initialFps: readStoredFrameRate(),
      isCaptureBlocked: () => renderBridge.isExportSessionActive(),
    });
  }
  return controller;
}

/**
 * Connects the Spout controller to the processed preview canvas while the
 * owning component is mounted, and releases the sender on unmount or unload.
 */
export function useSpoutOutput(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const output = getSpoutOutputController();
  const state = useSyncExternalStore(output.subscribe, output.getState, output.getState);

  useEffect(() => {
    void output.initialize();
    output.setFrameSource(createCanvasFrameSource(() => canvasRef.current, getRegisteredWebGLContext));
    const unsubscribeFrames = subscribeProcessedCanvasFrame(output.markFrameDirty);
    const stopOnUnload = () => { void output.setEnabled(false); };
    window.addEventListener('pagehide', stopOnUnload);
    return () => {
      unsubscribeFrames();
      window.removeEventListener('pagehide', stopOnUnload);
      output.setFrameSource(null);
      void output.setEnabled(false);
    };
  }, [canvasRef, output]);

  return {
    state,
    setEnabled: (enabled: boolean) => output.setEnabled(enabled),
    setSenderName: (name: string) => {
      if (validateSpoutSenderName(name)) return;
      store(SENDER_NAME_STORAGE_KEY, name.trim());
      void output.setSenderName(name);
    },
    setTargetFps: (fps: SpoutFrameRate) => {
      store(FRAME_RATE_STORAGE_KEY, String(fps));
      output.setTargetFps(fps);
    },
  };
}
