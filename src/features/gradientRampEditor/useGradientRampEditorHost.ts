import { useEffect } from 'react';
import { isTauriRuntime } from '../../adapters/tauri/exportService';
import { setupGradientRampEditorHost } from '../../adapters/tauri/gradientRampEditorWindow';
import { redo, undo } from '../../lib/history';
import { useGradientStore } from '../../store/gradientStore';

/** Main window side of the native Gradient Ramp editor (Tauri only). */
export function useGradientRampEditorHost() {
  useEffect(() => {
    if (!isTauriRuntime()) return;
    let disposed = false;
    let cleanup: (() => void) | null = null;
    setupGradientRampEditorHost(useGradientStore, { undo, redo })
      .then(dispose => {
        if (disposed) dispose();
        else cleanup = dispose;
      })
      .catch((error: unknown) => console.warn('[gradient-ramp-editor] host setup failed', error));
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);
}
