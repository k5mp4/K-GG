import { useEffect, useMemo, useState } from 'react';
import { create } from 'zustand';
import { EffectStackPanelView } from '../../components/EffectStackPanelView';
import { sendToolWindowIntent, setupToolWindowClient } from '../../adapters/tauri/toolWindows';
import { removeBootSplash } from '../splash/staticSplashVisual';
import { createRemoteEffectStackActions } from './effectStackIntents';
import type { EffectStackView } from './effectStackView';

const LABEL = 'effect-stack';

type WindowViewState = { view: EffectStackView | null };

const useWindowViewStore = create<WindowViewState>(() => ({ view: null }));

/**
 * Root of the native Effect Stack window. The main window owns the document
 * and the renderer; this window renders the view it receives and sends every
 * user action back as an intent.
 */
export function EffectStackWindowApp() {
  const view = useWindowViewStore(state => state.view);
  const [connectionError, setConnectionError] = useState(false);
  const actions = useMemo(
    () => createRemoteEffectStackActions(intent => sendToolWindowIntent(LABEL, intent)),
    [],
  );

  // index.html paints the startup poster for every window; tool windows have no splash.
  useEffect(() => removeBootSplash(), []);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | null = null;
    setupToolWindowClient({ label: LABEL, store: useWindowViewStore, keys: ['view'] as const })
      .then(dispose => {
        if (disposed) dispose();
        else cleanup = dispose;
      })
      .catch((error: unknown) => {
        console.error('[effect-stack-window] failed to connect to the main window', error);
        setConnectionError(true);
      });
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  if (!view) {
    return <div className="min-h-screen bg-k-bg" aria-busy={!connectionError} />;
  }
  return <EffectStackPanelView view={view} actions={actions} variant="window" />;
}
