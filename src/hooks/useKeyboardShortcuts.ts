import { useEffect } from 'react';
import { renderBridge } from '../lib/renderBridge';
import { undo, redo } from '../lib/history';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLInputElement;
      const tag = target?.tagName;
      // range input はテキスト入力ではないので Space を通す
      const isTextInput = (tag === 'INPUT' && target.type !== 'range') || tag === 'TEXTAREA';

      if (e.code === 'Space') {
        if (isTextInput) return;
        e.preventDefault();
        renderBridge.togglePause();
        return;
      }

      if (isTextInput) return;

      const ctrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (ctrl && key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if (ctrl && (key === 'y' || (key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
