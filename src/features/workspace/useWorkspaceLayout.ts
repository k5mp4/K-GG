import { useLayoutEffect, useState, type RefObject } from 'react';
import { resolveWorkspaceLayout, type WorkspaceLayoutPreferences } from './workspaceLayout';

export function useWorkspaceLayout(ref: RefObject<HTMLDivElement | null>, preferences: WorkspaceLayoutPreferences) {
  const [size, setSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return resolveWorkspaceLayout(size, preferences);
}
