import { useCallback, useEffect, useRef, useState } from 'react';
import { isTauriRuntime } from '../../adapters/tauri/exportService';
import { openToolWindow, setupToolWindowHost } from '../../adapters/tauri/toolWindows';
import type { EffectStackKind } from '../../types/distortion';
import { createLocalEffectStackActions, getEffectStackViewStore } from './effectStackController';
import { parseEffectStackIntent, runEffectStackIntent } from './effectStackIntents';

const LABEL = 'effect-stack';

/**
 * Main window side of the native Effect Stack window (Tauri only). `isOpen`
 * turns true once the window has loaded, so the inline panel stays visible
 * if the window cannot be created.
 */
export function useEffectStackWindowHost(onSelectEffectStack?: (kind: EffectStackKind) => void) {
  const supported = isTauriRuntime();
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(onSelectEffectStack);
  selectRef.current = onSelectEffectStack;

  useEffect(() => {
    if (!supported) return;
    const actions = createLocalEffectStackActions(() => selectRef.current);
    let disposed = false;
    let cleanup: (() => void) | null = null;
    setupToolWindowHost({
      label: LABEL,
      store: getEffectStackViewStore(),
      keys: ['view'] as const,
      onIntent: payload => {
        const intent = parseEffectStackIntent(payload);
        if (intent) runEffectStackIntent(intent, actions);
      },
      onOpenChange: setIsOpen,
    })
      .then(dispose => {
        if (disposed) dispose();
        else cleanup = dispose;
      })
      .catch((error: unknown) => console.warn('[effect-stack-window] host setup failed', error));
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [supported]);

  const open = useCallback(() => {
    openToolWindow(LABEL).catch((error: unknown) => {
      console.warn('[effect-stack-window] native window unavailable; keeping the inline panel', error);
    });
  }, []);

  return { supported, isOpen, open };
}
