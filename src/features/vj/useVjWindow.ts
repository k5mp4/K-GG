import { useEffect, useRef, useState } from 'react';
import { isTauriRuntime } from '../../adapters/tauri/exportService';
import { createTauriVjWindowController, type VjWindowController } from '../../adapters/tauri/vjWindow';

export function useVjWindow(enabled: boolean): boolean {
  const controller = useRef<VjWindowController | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!isTauriRuntime()) return;
    controller.current ??= createTauriVjWindowController();
    let active = true;
    void controller.current.setMode(enabled).then(
      () => { if (active) setFailed(false); },
      () => { if (active) setFailed(true); },
    );
    return () => { active = false; };
  }, [enabled]);
  useEffect(() => () => { void controller.current?.setMode(false).catch(() => undefined); }, []);
  return failed;
}
