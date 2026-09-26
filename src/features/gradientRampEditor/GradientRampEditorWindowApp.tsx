import { useEffect, useState } from 'react';
import { GradientRamp } from '../../components/GradientRamp';
import {
  requestGradientRampHistory,
  setupGradientRampEditorClient,
} from '../../adapters/tauri/gradientRampEditorWindow';
import { useGradientStore } from '../../store/gradientStore';
import { removeBootSplash } from '../splash/staticSplashVisual';

const requestUndo = () => requestGradientRampHistory('undo');
const requestRedo = () => requestGradientRampHistory('redo');

/**
 * Root of the native Gradient Ramp editor window. The main window owns the
 * document and history, so undo/redo are forwarded instead of run locally.
 */
export function GradientRampEditorWindowApp() {
  const [ready, setReady] = useState(false);

  // index.html paints the startup poster for every window; the editor has no splash.
  useEffect(() => removeBootSplash(), []);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | null = null;
    // The first state patch from the main window arrives right after the
    // ready handshake; render the editor only once it has been applied.
    const unsubscribeFirstPatch = useGradientStore.subscribe(() => {
      unsubscribeFirstPatch();
      if (!disposed) setReady(true);
    });
    setupGradientRampEditorClient(useGradientStore)
      .then(dispose => {
        if (disposed) dispose();
        else cleanup = dispose;
      })
      .catch((error: unknown) => console.error('[gradient-ramp-editor] failed to connect to the main window', error));
    return () => {
      disposed = true;
      unsubscribeFirstPatch();
      cleanup?.();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLInputElement | null;
      const tag = target?.tagName;
      if ((tag === 'INPUT' && target?.type !== 'range') || tag === 'TEXTAREA') return;
      const ctrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (ctrl && key === 'z' && !e.shiftKey) { e.preventDefault(); requestUndo(); }
      if (ctrl && (key === 'y' || (key === 'z' && e.shiftKey))) { e.preventDefault(); requestRedo(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (!ready) return <div className="h-screen bg-k-surface" />;
  return <GradientRamp variant="window" onUndo={requestUndo} onRedo={requestRedo} />;
}
