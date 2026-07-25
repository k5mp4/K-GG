import { PostprocessStackPanel } from './PostprocessStackPanel';

/** The entry point rendered by the native Tauri Effect Stack WebviewWindow. */
export function DetachedEffectStackApp() {
  return (
    <main className="min-h-screen bg-k-bg p-2 text-k-text">
      <PostprocessStackPanel detached />
    </main>
  );
}
