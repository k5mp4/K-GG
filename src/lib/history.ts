import { normalizeNoiseDistortionConfig } from '../store/documentModel';
import { useGradientStore } from '../store/gradientStore';
import type { StoreSnapshot as PresetStoreSnapshot } from './presets';
import { MAX_HISTORY, HISTORY_DEBOUNCE_MS } from './constants';
import { debounce } from './debounce';

type StoreState = ReturnType<typeof useGradientStore.getState>;
type HistorySnapshot = Omit<
  PresetStoreSnapshot,
  'manualDistort' | 'postprocess' | 'keyframeTracks' | 'selectedStops'
> & {
  manualDistort: StoreState['manualDistort'];
  postprocess: StoreState['postprocess'];
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
    seamless: s.seamless,
    texture: s.texture,
    shapes: s.shapes,
    manualDistort: s.manualDistort,
    postprocess: s.postprocess,
    keyframeTracks: s.keyframeTracks,
    selectedStops: s.selectedStops, // 追加
  };
}

/** 状態スナップショットでは戻せない操作（Presetライブラリの削除・移動など）を、同じ履歴に積むための取り消し単位。 */
export type HistoryCommand = {
  undo: () => void | Promise<void>;
  redo: () => void | Promise<void>;
};

type HistoryEntry =
  | { kind: 'state'; snapshot: HistorySnapshot }
  | { kind: 'command'; command: HistoryCommand };

class HistoryManager {
  private historyStack: HistoryEntry[] = [];
  private futureStack: HistoryEntry[] = [];
  /** 非同期のコマンドが入れ替わって実行されないよう、順番に実行する。 */
  private commandQueue: Promise<void> = Promise.resolve();
  private applyingSnapshot = false;
  private pendingPrev: HistorySnapshot | null = null;
  private schedulePush: ReturnType<typeof debounce>;

  constructor() {
    this.schedulePush = debounce(() => {
      if (this.pendingPrev) {
        this.pushHistory({ kind: 'state', snapshot: this.pendingPrev });
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
        state.seamless !== prev.seamless ||
        state.texture !== prev.texture ||
        state.shapes !== prev.shapes ||
        state.manualDistort !== prev.manualDistort ||
        state.postprocess !== prev.postprocess ||
        state.keyframeTracks !== prev.keyframeTracks ||
        state.selectedStops !== prev.selectedStops; // 追加

      if (!hasChanged) return;

      // バッチ先頭の「変更前」スナップショットを保持
      if (!this.pendingPrev) this.pendingPrev = extractSnapshot(prev);

      this.schedulePush();
    });
  }

  private pushHistory(entry: HistoryEntry): void {
    this.historyStack.push(entry);
    if (this.historyStack.length > MAX_HISTORY) this.historyStack.shift();
  }

  private runCommand(task: () => void | Promise<void>): void {
    this.commandQueue = this.commandQueue.then(task).catch(error => {
      console.error('Failed to apply an undo/redo command:', error);
    });
  }

  /** 実行済みの操作を履歴へ積む。デバウンス待ちの状態変更は、この操作より前の履歴として先に確定する。 */
  record(command: HistoryCommand): void {
    if (this.pendingPrev) {
      this.schedulePush.cancel();
      this.pushHistory({ kind: 'state', snapshot: this.pendingPrev });
      this.pendingPrev = null;
    }
    this.pushHistory({ kind: 'command', command });
    this.futureStack.length = 0;
  }

  /** テスト用。履歴を空にする。 */
  reset(): void {
    this.schedulePush.cancel();
    this.pendingPrev = null;
    this.historyStack.length = 0;
    this.futureStack.length = 0;
    this.commandQueue = Promise.resolve();
  }

  private applySnapshot(snap: HistorySnapshot): void {
    this.applyingSnapshot = true;
    useGradientStore.setState({
      gradient: snap.gradient,
      noiseDistortion: normalizeNoiseDistortionConfig(snap.noiseDistortion),
      diffuse: snap.diffuse,
      imageGradient: snap.imageGradient,
      slitScan: snap.slitScan,
      animation: snap.animation,
      normalMap: snap.normalMap,
      seamless: snap.seamless ?? useGradientStore.getState().seamless,
      texture: snap.texture ?? useGradientStore.getState().texture,
      shapes: snap.shapes ?? useGradientStore.getState().shapes,
      manualDistort: snap.manualDistort ?? useGradientStore.getState().manualDistort,
      postprocess: snap.postprocess ?? useGradientStore.getState().postprocess,
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
      this.futureStack.push({ kind: 'state', snapshot: current });
      const prev = this.pendingPrev;
      this.pendingPrev = null;
      this.applySnapshot(prev);
      return;
    }
    const entry = this.historyStack.pop();
    if (!entry) return;
    if (entry.kind === 'command') {
      this.futureStack.push(entry);
      this.runCommand(entry.command.undo);
      return;
    }
    const current = extractSnapshot(useGradientStore.getState());
    this.futureStack.push({ kind: 'state', snapshot: current });
    this.applySnapshot(entry.snapshot);
  }

  redo(): void {
    const entry = this.futureStack.pop();
    if (!entry) return;
    if (entry.kind === 'command') {
      this.pushHistory(entry);
      this.runCommand(entry.command.redo);
      return;
    }
    const current = extractSnapshot(useGradientStore.getState());
    this.pushHistory({ kind: 'state', snapshot: current });
    this.applySnapshot(entry.snapshot);
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
export const recordHistoryCommand = (command: HistoryCommand) => historyManager.record(command);
export const resetHistoryForTest = () => historyManager.reset();
