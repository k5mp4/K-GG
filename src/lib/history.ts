import { useGradientStore } from '../store/gradientStore';
import type { StoreSnapshot as PresetStoreSnapshot } from './presets';
import { MAX_HISTORY, HISTORY_DEBOUNCE_MS } from './constants';
import { debounce } from './debounce';

type StoreState = ReturnType<typeof useGradientStore.getState>;
type HistorySnapshot = Omit<
  PresetStoreSnapshot,
  'iridescence' | 'manualDistort' | 'postprocess' | 'matcap' | 'keyframeTracks' | 'selectedStops'
> & {
  iridescence: StoreState['iridescence'];
  manualDistort: StoreState['manualDistort'];
  postprocess: StoreState['postprocess'];
  matcap: StoreState['matcap'];
  keyframeTracks: StoreState['keyframeTracks'];
  selectedStops: StoreState['selectedStops'];
};

function extractSnapshot(s: StoreState): HistorySnapshot {
  return {
    gradient: s.gradient,
    noiseDistortion: s.noiseDistortion,
    diffuse: s.diffuse,
    imageGradient: s.imageGradient,
    slitScan: s.slitScan,
    animation: s.animation,
    normalMap: s.normalMap,
    radon: s.radon,
    iridescence: s.iridescence,
    manualDistort: s.manualDistort,
    postprocess: s.postprocess,
    matcap: s.matcap,
    keyframeTracks: s.keyframeTracks,
    selectedStops: s.selectedStops, // 追加
  };
}

class HistoryManager {
  private historyStack: HistorySnapshot[] = [];
  private futureStack: HistorySnapshot[] = [];
  private applyingSnapshot = false;
  private pendingPrev: HistorySnapshot | null = null;
  private schedulePush: ReturnType<typeof debounce>;

  constructor() {
    this.schedulePush = debounce(() => {
      if (this.pendingPrev) {
        this.historyStack.push(this.pendingPrev);
        if (this.historyStack.length > MAX_HISTORY) this.historyStack.shift();
        this.futureStack.length = 0;
        this.pendingPrev = null;
      }
    }, HISTORY_DEBOUNCE_MS);

    // モジュールロード時にサブスクライブ
    useGradientStore.subscribe((state, prev) => {
      if (this.applyingSnapshot) return;

      // 重要なステートの変化を検知
      const hasChanged = 
        state.gradient !== prev.gradient ||
        state.noiseDistortion !== prev.noiseDistortion ||
        state.diffuse !== prev.diffuse ||
        state.imageGradient !== prev.imageGradient ||
        state.slitScan !== prev.slitScan ||
        state.animation !== prev.animation ||
        state.normalMap !== prev.normalMap ||
        state.radon !== prev.radon ||
        state.iridescence !== prev.iridescence ||
        state.manualDistort !== prev.manualDistort ||
        state.postprocess !== prev.postprocess ||
        state.matcap !== prev.matcap ||
        state.keyframeTracks !== prev.keyframeTracks ||
        state.selectedStops !== prev.selectedStops; // 追加

      if (!hasChanged) return;

      // バッチ先頭の「変更前」スナップショットを保持
      if (!this.pendingPrev) this.pendingPrev = extractSnapshot(prev);

      this.schedulePush();
    });
  }

  private applySnapshot(snap: HistorySnapshot): void {
    this.applyingSnapshot = true;
    useGradientStore.setState({
      gradient: snap.gradient,
      noiseDistortion: snap.noiseDistortion,
      diffuse: snap.diffuse,
      imageGradient: snap.imageGradient,
      slitScan: snap.slitScan,
      animation: snap.animation,
      normalMap: snap.normalMap,
      radon: snap.radon,
      iridescence: snap.iridescence ?? useGradientStore.getState().iridescence,
      manualDistort: snap.manualDistort ?? useGradientStore.getState().manualDistort,
      postprocess: snap.postprocess ?? useGradientStore.getState().postprocess,
      matcap: snap.matcap ?? useGradientStore.getState().matcap,
      keyframeTracks: snap.keyframeTracks ?? useGradientStore.getState().keyframeTracks,
      selectedStops: (snap as any).selectedStops ?? [], // 追加
    });
    this.applyingSnapshot = false;
  }

  undo(): void {
    // pending 中（デバウンス待ち）なら、まず現在の状態を future に保存してから、
    // 溜まっていた「変更前」の状態を適用する
    if (this.pendingPrev) {
      this.schedulePush.cancel();
      const current = extractSnapshot(useGradientStore.getState());
      this.futureStack.push(current);
      const prev = this.pendingPrev;
      this.pendingPrev = null;
      this.applySnapshot(prev);
      return;
    }
    if (this.historyStack.length === 0) return;
    const current = extractSnapshot(useGradientStore.getState());
    this.futureStack.push(current);
    this.applySnapshot(this.historyStack.pop()!);
  }

  redo(): void {
    if (this.futureStack.length === 0) return;
    const current = extractSnapshot(useGradientStore.getState());
    const next = this.futureStack.pop()!;
    this.historyStack.push(current);
    if (this.historyStack.length > MAX_HISTORY) this.historyStack.shift();
    this.applySnapshot(next);
  }

  canUndo(): boolean {
    return this.historyStack.length > 0 || this.pendingPrev !== null;
  }

  canRedo(): boolean {
    return this.futureStack.length > 0;
  }
}

const historyManager = new HistoryManager();

// 後方互換エクスポート (App.tsx の import 変更不要)
export const undo = () => historyManager.undo();
export const redo = () => historyManager.redo();
export const canUndo = () => historyManager.canUndo();
export const canRedo = () => historyManager.canRedo();
