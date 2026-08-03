import { useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { Viewport } from 'tweeq';
import type { EffectStackKind, PostprocessStackKind } from '../types/distortion';
import {
  canRenderV2Direct,
  captureEffectStackEnabledState,
  isEffectStackLayerTemporarilyHidden,
  moveEffectStackLayer,
  normalizeEffectStack,
  randomizeEffectStackOrder,
  restoreEffectStackEnabledState,
  soloEffectStackLayer,
  updateEffectStackLayer,
} from '../lib/effectPipeline';
import {
  getEffectStackSettlingOffset,
  getEffectStackTargetIndex,
  type EffectStackDragState,
} from '../lib/effectStackDrag';
import { useGradientStore } from '../store/gradientStore';
import { Toggle } from './Toggle';
import { Icon } from './Icon';
import { LanguageProvider, useLanguage } from '../i18n/LanguageProvider';
import type { MessageKey } from '../i18n/messages';
import { renderBridge } from '../lib/renderBridge';
import {
  EFFECT_STACK_TRANSITION_DURATION_MS,
  beginEffectStackTransition,
  finishEffectStackTransition,
  isEffectStackTransitionActive,
} from '../lib/effectStackTransition';
import {
  closeCurrentEffectStackWindow,
  createEffectStackSnapshot,
  EFFECT_STACK_CLOSE_EVENT,
  EFFECT_STACK_READY_EVENT,
  EFFECT_STACK_STATE_EVENT,
  EFFECT_STACK_STATE_UPDATE_EVENT,
  EFFECT_STACK_SWAP_EVENT,
  EFFECT_STACK_WINDOW_LABEL,
  effectStackSnapshotSignature,
  isTauriRuntime,
  openEffectStackWindow,
  type EffectStackSnapshot,
} from '../lib/effectStackWindow';

const ROW_HEIGHT = 38;
const DRAG_SETTLE_MS = 150;
const STACK_PANEL_SESSION_KEY = 'kgg.effect-stack-panel.collapsed';

const LABELS: Record<EffectStackKind, string> = {
  diffuse: 'Diffuse',
  noise: 'Noise',
  slit: 'Slit',
  stretch: 'Stretch',
  distort: 'Distort',
  mirror: 'Mirror',
  kaleidoscope: 'Kaleidoscope',
  voronoi: 'Voronoi',
  glass: 'Glass',
};

const CATEGORY: Record<EffectStackKind, MessageKey> = {
  diffuse: 'stack.category.texture', noise: 'stack.category.texture',
  slit: 'stack.category.transform', stretch: 'stack.category.transform', distort: 'stack.category.transform', mirror: 'stack.category.transform', kaleidoscope: 'stack.category.transform',
  voronoi: 'stack.category.structure', glass: 'stack.category.structure',
};

type DragState = Omit<EffectStackDragState, 'kind'> & {
  kind: EffectStackKind;
  pointerId: number;
};

type RowTransitionPhase = 'idle' | 'from' | 'animate';
type SoloSnapshot = {
  targetKind: EffectStackKind;
  enabledState: ReturnType<typeof captureEffectStackEnabledState>;
};

type LazyProgramKey = 'stackCore' | 'noiseStack' | 'glassV2' | 'stretch' | 'prism' | 'prismComposite' | 'normalMap' | 'blur' | 'particles';
type LazyProgramStatus = 'loading' | 'ready' | 'failed' | 'fallback';

const CORE_EFFECTS = new Set<EffectStackKind>([
  'diffuse', 'noise', 'slit', 'distort', 'mirror', 'kaleidoscope', 'voronoi',
]);
const IMAGE_GRADIENT_PROTECTED_EFFECTS = new Set<EffectStackKind>([
  'stretch', 'distort', 'mirror', 'kaleidoscope', 'voronoi', 'glass',
]);

type DocumentPictureInPictureApi = {
  requestWindow: (options?: { width?: number; height?: number }) => Promise<Window>;
};

type Props = {
  onSwapWorkspace?: () => void;
  onSelectEffectStack?: (kind: EffectStackKind) => void;
  detached?: boolean;
};

function programKeyForEffect(kind: EffectStackKind): LazyProgramKey {
  if (kind === 'noise') return 'noiseStack';
  if (CORE_EFFECTS.has(kind)) return 'stackCore';
  if (kind === 'glass') return 'glassV2';
  return 'stretch';
}

export function PostprocessStackPanel({ onSwapWorkspace, onSelectEffectStack, detached = false }: Props = {}) {
  const { t } = useLanguage();
  const { setPostprocess, effectPipeline, normalMap, imageGradient, setEffectPipeline } = useGradientStore();
  const stack = normalizeEffectStack(effectPipeline.effectStack);
  const movableStack = stack;
  const stackRef = useRef(stack);
  const draggingRef = useRef<DragState | null>(null);
  const dragCleanupRef = useRef<(() => void) | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return typeof window !== 'undefined'
        && window.sessionStorage.getItem(STACK_PANEL_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [programStatus, setProgramStatus] = useState<Partial<Record<LazyProgramKey, LazyProgramStatus>>>({});
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [pipMount, setPipMount] = useState<HTMLElement | null>(null);
  const [tauriWindowOpen, setTauriWindowOpen] = useState(false);
  const [randomizingOrder, setRandomizingOrder] = useState(false);
  const [rowTransitionPhase, setRowTransitionPhase] = useState<RowTransitionPhase>('idle');
  const pipRootRef = useRef<Root | null>(null);
  const pipWindowRef = useRef<Window | null>(null);
  const tauriWindowRef = useRef<WebviewWindow | null>(null);
  const applyingRemoteStateRef = useRef(false);
  const swapWorkspaceRef = useRef(onSwapWorkspace);
  const selectEffectStackRef = useRef(onSelectEffectStack);
  const externalWindowCleanupRef = useRef<(() => void) | null>(null);
  const previousStackOrderRef = useRef<EffectStackKind[]>(stack.map(layer => layer.kind));
  const soloSnapshotRef = useRef<SoloSnapshot | null>(null);
  stackRef.current = stack;
  pipWindowRef.current = pipWindow;
  swapWorkspaceRef.current = onSwapWorkspace;
  selectEffectStackRef.current = onSelectEffectStack;

  // Tauri creates a second native WebviewWindow, so the Zustand store is not
  // shared automatically. The two roots exchange only the Effect Stack
  // state; the panel keeps all controls and drag behavior in one component.
  useEffect(() => {
    if (detached || !isTauriRuntime()) return;
    let disposed = false;
    const cleanups: Array<() => void> = [];
    const sendSnapshot = async () => {
      try {
        const { emitTo } = await import('@tauri-apps/api/event');
        if (disposed) return;
        await emitTo(EFFECT_STACK_WINDOW_LABEL, EFFECT_STACK_STATE_EVENT, createEffectStackSnapshot(useGradientStore.getState()));
      } catch {
        // The native window may not exist yet or may already be closing.
      }
    };

    const setupHost = async () => {
      const { listen } = await import('@tauri-apps/api/event');
      if (disposed) return;
      const readyCleanup = await listen(EFFECT_STACK_READY_EVENT, () => { void sendSnapshot(); });
      if (disposed) {
        readyCleanup();
        return;
      }
      const updateCleanup = await listen<EffectStackSnapshot>(EFFECT_STACK_STATE_UPDATE_EVENT, event => {
        const snapshot = event.payload;
        if (!snapshot?.effectPipeline || !snapshot.postprocess || !snapshot.normalMap || !snapshot.imageGradient) return;
        useGradientStore.setState({
          effectPipeline: snapshot.effectPipeline,
          postprocess: snapshot.postprocess,
          normalMap: snapshot.normalMap,
          imageGradient: snapshot.imageGradient,
        });
      });
      const closeCleanup = await listen(EFFECT_STACK_CLOSE_EVENT, () => {
        setTauriWindowOpen(false);
        tauriWindowRef.current = null;
      });
      const swapCleanup = await listen(EFFECT_STACK_SWAP_EVENT, () => {
        swapWorkspaceRef.current?.();
      });
      if (disposed) {
        readyCleanup();
        updateCleanup();
        closeCleanup();
        swapCleanup();
      } else {
        cleanups.push(readyCleanup, updateCleanup, closeCleanup, swapCleanup);
      }
    };
    void setupHost().catch(error => console.error('Failed to initialize Effect Stack host window:', error));

    let hostSnapshotSignature = '';
    const unsubscribe = useGradientStore.subscribe(state => {
      const snapshot = createEffectStackSnapshot(state);
      const signature = effectStackSnapshotSignature(snapshot);
      if (signature === hostSnapshotSignature) return;
      hostSnapshotSignature = signature;
      void sendSnapshot();
    });
    return () => {
      disposed = true;
      unsubscribe();
      cleanups.forEach(cleanup => cleanup());
    };
  }, [detached]);

  useEffect(() => {
    if (!detached || !isTauriRuntime()) return;
    let disposed = false;
    const cleanups: Array<() => void> = [];
    const sendUpdate = async () => {
      try {
        const { emitTo } = await import('@tauri-apps/api/event');
        if (disposed || applyingRemoteStateRef.current) return;
        await emitTo('main', EFFECT_STACK_STATE_UPDATE_EVENT, createEffectStackSnapshot(useGradientStore.getState()));
      } catch {
        // The main window can close before this WebviewWindow does.
      }
    };
    const setupDetached = async () => {
      const { listen, emitTo } = await import('@tauri-apps/api/event');
      if (disposed) return;
      const stateCleanup = await listen<EffectStackSnapshot>(EFFECT_STACK_STATE_EVENT, event => {
        const snapshot = event.payload;
        if (!snapshot?.effectPipeline || !snapshot.postprocess || !snapshot.normalMap || !snapshot.imageGradient) return;
        applyingRemoteStateRef.current = true;
        useGradientStore.setState({
          effectPipeline: snapshot.effectPipeline,
          postprocess: snapshot.postprocess,
          normalMap: snapshot.normalMap,
          imageGradient: snapshot.imageGradient,
        });
        selectEffectStackRef.current?.(snapshot.effectPipeline.selectedKind);
        queueMicrotask(() => { applyingRemoteStateRef.current = false; });
      });
      if (disposed) {
        stateCleanup();
        return;
      }
      const unsubscribe = useGradientStore.subscribe(() => { void sendUpdate(); });
      if (disposed) {
        stateCleanup();
        unsubscribe();
        return;
      }
      cleanups.push(stateCleanup, unsubscribe);
      if (!disposed) await emitTo('main', EFFECT_STACK_READY_EVENT);
    };
    void setupDetached().catch(error => console.error('Failed to initialize detached Effect Stack window:', error));
    return () => {
      disposed = true;
      cleanups.forEach(cleanup => cleanup());
    };
  }, [detached]);

  useEffect(() => () => {
    dragCleanupRef.current?.();
    if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current);
    document.body.style.cursor = '';
    externalWindowCleanupRef.current?.();
    pipRootRef.current?.unmount();
    pipRootRef.current = null;
    pipWindowRef.current?.close();
    void tauriWindowRef.current?.close();
  }, []);

  useEffect(() => {
    if (!randomizingOrder) return;
    let frameId = 0;
    const tick = () => {
      renderBridge.renderAtTime(
        renderBridge.getCurrentTime(),
        renderBridge.getCurrentNormalizedTime(),
      );
      if (!isEffectStackTransitionActive()) {
        finishEffectStackTransition();
        setRandomizingOrder(false);
        return;
      }
      frameId = window.requestAnimationFrame(tick);
    };
    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [randomizingOrder]);

  useEffect(() => {
    if (!randomizingOrder) {
      setRowTransitionPhase('idle');
      previousStackOrderRef.current = stackRef.current.map(layer => layer.kind);
      return;
    }
    const frameId = window.requestAnimationFrame(() => setRowTransitionPhase('animate'));
    return () => window.cancelAnimationFrame(frameId);
  }, [randomizingOrder]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STACK_PANEL_SESSION_KEY, String(collapsed));
    } catch {
      // sessionStorage may be unavailable in private or restricted contexts.
    }
  }, [collapsed]);

  useEffect(() => {
    const handleProgramState = (event: Event) => {
      const detail = (event as CustomEvent<{ key?: LazyProgramKey; state?: LazyProgramStatus }>).detail;
      if (!detail?.key || !detail.state) return;
      setProgramStatus(current => ({ ...current, [detail.key!]: detail.state }));
    };
    window.addEventListener('kgg:webgl-lazy-program-state', handleProgramState);
    return () => window.removeEventListener('kgg:webgl-lazy-program-state', handleProgramState);
  }, []);

  const togglePiP = async () => {
    if (detached) {
      await closeCurrentEffectStackWindow();
      return;
    }
    if (isTauriRuntime()) {
      if (tauriWindowRef.current || tauriWindowOpen) {
        await tauriWindowRef.current?.close();
        tauriWindowRef.current = null;
        setTauriWindowOpen(false);
        return;
      }
      try {
        const nextWindow = await openEffectStackWindow();
        tauriWindowRef.current = nextWindow;
        setTauriWindowOpen(true);
        void nextWindow.once('tauri://destroyed', () => {
          tauriWindowRef.current = null;
          setTauriWindowOpen(false);
        });
        const { emitTo } = await import('@tauri-apps/api/event');
        await emitTo(
          EFFECT_STACK_WINDOW_LABEL,
          EFFECT_STACK_STATE_EVENT,
          createEffectStackSnapshot(useGradientStore.getState()),
        );
      } catch (error) {
        console.error('Failed to open Effect Stack Tauri window:', error);
      }
      return;
    }
    if (pipWindow) {
      externalWindowCleanupRef.current?.();
      pipWindow.close();
      setPipWindow(null);
      setPipMount(null);
      return;
    }

    const api = (window as Window & {
      documentPictureInPicture?: DocumentPictureInPictureApi;
    }).documentPictureInPicture;
    let nextWindow: Window | null = null;
    let usingPictureInPicture = false;
    try {
      if (api) {
        try {
          nextWindow = await api.requestWindow({ width: 360, height: 620 });
          usingPictureInPicture = true;
        } catch {
          // Some embedded browsers expose the API but reject the request.
          // Continue with the ordinary-window fallback below.
          nextWindow = window.open('', 'kgg-effect-stack', 'popup,width=360,height=620,resizable=yes');
        }
      } else {
        nextWindow = window.open('', 'kgg-effect-stack', 'popup,width=360,height=620,resizable=yes');
      }
      if (!nextWindow) throw new Error('Effect Stackの別ウィンドウを作成できませんでした。');
      const openedWindow = nextWindow;

      [...document.styleSheets].forEach((sheet) => {
        try {
          const cssRules = [...sheet.cssRules].map(rule => rule.cssText).join('');
          const style = document.createElement('style');
          style.textContent = cssRules;
          openedWindow.document.head.appendChild(style);
        } catch {
          if (sheet.href) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = sheet.href;
            openedWindow.document.head.appendChild(link);
          }
        }
      });
      const mount = openedWindow.document.createElement('div');
      mount.dataset.effectStackRoot = 'true';
      mount.style.minHeight = '100vh';
      openedWindow.document.body.appendChild(mount);
      openedWindow.document.title = 'Effect Stack';
      openedWindow.document.body.style.margin = '0';
      openedWindow.document.body.style.minHeight = '100vh';
      openedWindow.document.body.style.backgroundColor = '#141414';
      openedWindow.document.body.style.overflow = 'hidden';
      let monitorId: number | null = null;
      let externalClosed = false;
      const handleExternalClose = () => {
        if (externalClosed) return;
        externalClosed = true;
        if (monitorId !== null) window.clearInterval(monitorId);
        if (externalWindowCleanupRef.current === handleExternalClose) {
          externalWindowCleanupRef.current = null;
        }
        pipRootRef.current?.unmount();
        pipRootRef.current = null;
        setPipWindow(current => current === openedWindow ? null : current);
        setPipMount(current => current === mount ? null : current);
      };
      externalWindowCleanupRef.current = handleExternalClose;
      openedWindow.addEventListener('pagehide', handleExternalClose, { once: true });
      openedWindow.addEventListener('beforeunload', handleExternalClose, { once: true });
      if (!usingPictureInPicture) {
        monitorId = window.setInterval(() => {
          if (openedWindow.closed) handleExternalClose();
        }, 250);
      }
      pipRootRef.current = createRoot(mount);
      setPipMount(mount);
      setPipWindow(openedWindow);
    } catch (error) {
      nextWindow?.close();
      console.error('Failed to open Effect Stack window:', error);
      window.alert('Effect Stackの別ウィンドウ表示を開始できませんでした。インライン表示を維持します。');
    }
  };

  const randomizeOrder = () => {
    if (randomizingOrder || isEffectStackTransitionActive()) return;
    const current = useGradientStore.getState().effectPipeline;
    const nextStack = randomizeEffectStackOrder(current.effectStack);
    previousStackOrderRef.current = normalizeEffectStack(current.effectStack).map(layer => layer.kind);
    setRowTransitionPhase('from');
    beginEffectStackTransition(current.effectStack, nextStack);
    setEffectPipeline({ effectStack: nextStack });
    setRandomizingOrder(true);
  };

  const selectLayer = (kind: EffectStackKind, solo = false) => {
    onSelectEffectStack?.(kind);
    const currentStack = normalizeEffectStack(useGradientStore.getState().effectPipeline.effectStack);
    let effectStack: typeof currentStack | undefined;
    if (solo) {
      const snapshot = soloSnapshotRef.current;
      if (snapshot?.targetKind === kind) {
        effectStack = restoreEffectStackEnabledState(currentStack, snapshot.enabledState);
        soloSnapshotRef.current = null;
      } else {
        if (!snapshot) {
          soloSnapshotRef.current = {
            targetKind: kind,
            enabledState: captureEffectStackEnabledState(currentStack),
          };
        } else {
          soloSnapshotRef.current = { ...snapshot, targetKind: kind };
        }
        effectStack = soloEffectStackLayer(currentStack, kind);
      }
    } else {
      soloSnapshotRef.current = null;
    }
    setEffectPipeline({
      selectedKind: kind,
      ...(effectStack ? { effectStack } : {}),
    });
    if (kind === 'distort' || kind === 'mirror' || kind === 'kaleidoscope' || kind === 'voronoi' || kind === 'glass') {
      setPostprocess({ effectMode: kind === 'glass' ? 'glassV2' : kind as PostprocessStackKind });
    }
  };

  const swapWorkspace = () => {
    if (onSwapWorkspace) {
      onSwapWorkspace();
      return;
    }
    if (detached) {
      void import('@tauri-apps/api/event').then(({ emitTo }) => emitTo('main', EFFECT_STACK_SWAP_EVENT));
    }
  };

  const cancelDrag = () => {
    dragCleanupRef.current?.();
    dragCleanupRef.current = null;
    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    draggingRef.current = null;
    setDragging(null);
    document.body.style.cursor = '';
  };

  const commitDrag = (drag: DragState) => {
    const current = useGradientStore.getState().effectPipeline;
    useGradientStore.getState().setEffectPipeline({
      selectedKind: drag.kind,
      effectStack: moveEffectStackLayer(current.effectStack, drag.kind, drag.targetIndex),
    });
    draggingRef.current = null;
    setDragging(null);
    document.body.style.cursor = '';
  };

  const finishDrag = () => {
    const current = draggingRef.current;
    if (!current || current.phase !== 'dragging') return;
    dragCleanupRef.current?.();
    dragCleanupRef.current = null;

    if (current.targetIndex === current.fromIndex) {
      cancelDrag();
      return;
    }

    const settling: DragState = {
      ...current,
      phase: 'settling',
      deltaY: getEffectStackSettlingOffset(current.fromIndex, current.targetIndex, ROW_HEIGHT),
    };
    draggingRef.current = settling;
    setDragging(settling);
    settleTimerRef.current = window.setTimeout(() => {
      settleTimerRef.current = null;
      const settled = draggingRef.current;
      if (!settled || settled.phase !== 'settling') return;
      commitDrag(settled);
    }, DRAG_SETTLE_MS);
  };

  const startDrag = (e: React.PointerEvent, kind: EffectStackKind, fromIndex: number) => {
    if (e.button !== 0) return;
    cancelDrag();
    e.preventDefault();
    e.stopPropagation();
    selectLayer(kind);
    const startY = e.clientY;
    const captureTarget = e.currentTarget as HTMLElement;
    document.body.style.cursor = 'grabbing';
    const initialDrag: DragState = { kind, fromIndex, targetIndex: fromIndex, deltaY: 0, phase: 'dragging', pointerId: e.pointerId };
    setDragging(initialDrag);
    draggingRef.current = initialDrag;
    e.currentTarget.setPointerCapture?.(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId || draggingRef.current?.phase !== 'dragging') return;
      const deltaY = ev.clientY - startY;
      const targetIndex = getEffectStackTargetIndex(fromIndex, deltaY, ROW_HEIGHT, movableStack.length);
      const nextDrag: DragState = { kind, fromIndex, targetIndex, deltaY, phase: 'dragging', pointerId: e.pointerId };
      draggingRef.current = nextDrag;
      setDragging(nextDrag);
    };

    const onUp = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      finishDrag();
    };

    const onCancel = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      cancelDrag();
    };

    const cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      if (captureTarget.hasPointerCapture?.(e.pointerId)) {
        captureTarget.releasePointerCapture?.(e.pointerId);
      }
    };
    dragCleanupRef.current = cleanup;

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
  };

  const rowTransform = (kind: EffectStackKind, index: number) => {
    if (kind === dragging?.kind) return `translate3d(0, ${dragging.deltaY}px, 0)`;
    if (dragging && dragging.targetIndex > dragging.fromIndex && index > dragging.fromIndex && index <= dragging.targetIndex) {
      return `translate3d(0, -${ROW_HEIGHT}px, 0)`;
    }
    if (dragging && dragging.targetIndex < dragging.fromIndex && index < dragging.fromIndex && index >= dragging.targetIndex) {
      return `translate3d(0, ${ROW_HEIGHT}px, 0)`;
    }
    if (!dragging && rowTransitionPhase === 'from') {
      const previousIndex = previousStackOrderRef.current.indexOf(kind);
      if (previousIndex >= 0) return `translate3d(0, ${(previousIndex - index) * ROW_HEIGHT}px, 0)`;
    }
    return 'translate3d(0, 0, 0)';
  };

  const orderTransitioning = randomizingOrder || isEffectStackTransitionActive();

  const handleLayerToggleClickCapture = (event: React.MouseEvent<HTMLDivElement>, kind: EffectStackKind) => {
    if (!event.altKey) return;
    event.preventDefault();
    event.stopPropagation();
    selectLayer(kind, true);
  };

  const effectStatus = (kind: EffectStackKind, enabled: boolean) => {
    if (imageGradient.enabled && IMAGE_GRADIENT_PROTECTED_EFFECTS.has(kind)) {
      return { label: t('stack.status.protected'), className: 'text-amber-300' };
    }
    // Diffuse-only V2 is drawn directly by the Bootstrap generator and never
    // requests stackCore, so it is genuinely applied without a lazy-program
    // ready event.
    if (enabled && kind === 'diffuse' && canRenderV2Direct(effectPipeline, normalMap.enabled)) {
      return { label: t('stack.status.applied'), className: 'text-emerald-300' };
    }
    return programStatusLabel(programKeyForEffect(kind), enabled);
  };

  const isSoloHidden = (kind: EffectStackKind, enabled: boolean) => {
    const snapshot = soloSnapshotRef.current;
    return Boolean(
      snapshot
      && isEffectStackLayerTemporarilyHidden(
        kind,
        enabled,
        snapshot.targetKind,
        snapshot.enabledState,
      ),
    );
  };

  const programStatusLabel = (key: LazyProgramKey, enabled: boolean) => {
    if (!enabled) return { label: t('stack.status.off'), className: 'text-cream/40' };
    const status = programStatus[key];
    if (status === 'loading') return { label: t('stack.status.loading'), className: 'text-amber-300' };
    if (status === 'failed') return { label: t('stack.status.unavailable'), className: 'text-red-300' };
    if (status === 'fallback') return { label: t('stack.status.fallback'), className: 'text-cyan-300' };
    if (status === 'ready') return { label: t('stack.status.applied'), className: 'text-emerald-300' };
    return { label: t('stack.status.preparing'), className: 'text-amber-300' };
  };

  const panel = (
    <div data-effect-stack-panel className={`min-h-8 ${detached || pipWindow || tauriWindowOpen ? 'w-full' : 'w-[232px]'} overflow-hidden border border-cream/20 bg-k-bg/90 shadow-[0_18px_46px_rgba(0,0,0,0.36)] backdrop-blur-md`}>
      <div className="flex h-8 items-center justify-between border-b border-cream/15 px-2.5">
        <button
          type="button"
          className="flex h-full min-w-0 flex-1 items-center gap-1.5 text-left text-cream/80 transition-colors hover:text-fire focus:outline-none focus-visible:ring-2 focus-visible:ring-fire"
          aria-expanded={!collapsed}
          aria-controls="kgg-effect-stack-content"
          onClick={() => setCollapsed(value => !value)}
        >
          <Icon name={collapsed ? 'chevronRight' : 'chevronDown'} className="shrink-0 text-[12px]" />
          <span className="truncate font-display text-[9px] font-bold uppercase tracking-wider">{t('effect.stack')}</span>
        </button>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="rounded px-1 text-[12px] leading-none text-cream/55 transition-colors hover:bg-cream/10 hover:text-fire focus:outline-none focus-visible:ring-2 focus-visible:ring-fire disabled:cursor-wait disabled:opacity-35"
            title={t('stack.shuffleOrderHint')}
            aria-label={t('stack.shuffleOrder')}
            disabled={randomizingOrder}
            onClick={randomizeOrder}
          >
            <Icon name="shuffle" className="text-[12px]" />
          </button>
          {(onSwapWorkspace || detached) && (
            <button
              type="button"
              className="rounded px-1 text-[12px] leading-none text-cream/55 transition-colors hover:bg-cream/10 hover:text-fire focus:outline-none focus-visible:ring-2 focus-visible:ring-fire"
              title={t('stack.swapHistogram')}
              aria-label={t('stack.swapHistogram')}
              onClick={swapWorkspace}
            >
              ⇄
            </button>
          )}
          <button
            type="button"
            className="rounded px-1 text-[12px] leading-none text-cream/55 transition-colors hover:bg-cream/10 hover:text-fire focus:outline-none focus-visible:ring-2 focus-visible:ring-fire"
            title={detached || pipWindow || tauriWindowOpen ? t('stack.restore') : t('stack.detach')}
            aria-label={detached || pipWindow || tauriWindowOpen ? t('stack.restore') : t('stack.detach')}
            onClick={togglePiP}
          >
            ↗
          </button>
          <span className="text-[8px] font-bold uppercase text-emerald-300">{t('stack.version')}</span>
        </div>
      </div>
      <div id="kgg-effect-stack-content" hidden={collapsed}>
      <div className="relative" style={{ height: movableStack.length * ROW_HEIGHT }}>
        {movableStack.map((layer, index) => {
          const selected = effectPipeline.selectedKind === layer.kind;
          const isDragging = dragging?.kind === layer.kind;
          const status = isSoloHidden(layer.kind, layer.enabled)
            ? { label: t('stack.status.stay'), className: 'text-amber-300' }
            : effectStatus(layer.kind, layer.enabled);
          return (
            <div
              key={layer.kind}
              className={`absolute left-0 right-0 flex h-[38px] items-center gap-2 border-b border-cream/10 px-2 transition-[top,transform,background-color,border-color,opacity] ease-in-out duration-150 ${
                selected ? 'bg-fire/15 text-k-text' : 'bg-transparent text-cream/80 hover:bg-cream/10'
              } ${layer.enabled ? 'opacity-100' : 'opacity-56'} ${isDragging ? 'z-10 shadow-[0_12px_28px_rgba(0,0,0,0.42)]' : 'z-0'}`}
              style={{
                top: index * ROW_HEIGHT,
                transform: rowTransform(layer.kind, index),
                transitionDuration: rowTransitionPhase === 'from'
                  ? '0ms'
                  : orderTransitioning
                  ? `${EFFECT_STACK_TRANSITION_DURATION_MS}ms`
                  : dragging
                  ? (dragging.phase === 'dragging' && isDragging ? '0ms' : `${DRAG_SETTLE_MS}ms`)
                  : '0ms',
              }}
              title={t('stack.soloHint')}
              onClick={(event) => selectLayer(layer.kind, event.altKey)}
            >
              <button
                type="button"
                className="flex h-7 w-6 cursor-grab touch-none items-center justify-center text-cream/50 transition-colors hover:text-fire active:cursor-grabbing"
                aria-label={t('stack.drag', { effect: LABELS[layer.kind] })}
                title={t('stack.drag', { effect: LABELS[layer.kind] })}
                onPointerDown={(e) => startDrag(e, layer.kind, index)}
              >
                <Icon name="gripVertical" className="text-[15px]" />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 truncate font-display text-[10px] font-bold uppercase tracking-wider">
                  {LABELS[layer.kind]}
                  <span className="rounded border border-cream/20 px-1 text-[7px] font-medium tracking-normal text-cream/60">{t(CATEGORY[layer.kind])}</span>
                </div>
                <div className={`text-[8px] font-medium uppercase tracking-wide ${status.className}`}>{status.label}</div>
              </div>
              <div
                onClick={(event) => event.stopPropagation()}
                onClickCapture={(event) => handleLayerToggleClickCapture(event, layer.kind)}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <Toggle
                  variant="switch"
                  size="xs"
                  checked={layer.enabled}
                  onChange={(enabled) => {
                    selectLayer(layer.kind);
                    setEffectPipeline({
                      effectStack: updateEffectStackLayer(stackRef.current, layer.kind, { enabled }),
                    });
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {imageGradient.enabled && (
        <div className="border-t border-cream/15 px-2 py-1.5 text-[8px] uppercase tracking-wider text-amber-300/90">
          Image Gradient: geometry-resampling layers are protected
        </div>
      )}
      </div>
    </div>
  );

  // The external document owns a real React root. Rendering a portal here
  // would keep React's event delegation attached to the opener document,
  // which made toggles and pointer gestures inert in the detached window.
  useEffect(() => {
    if (pipWindow && pipMount && pipRootRef.current) {
      pipRootRef.current.render(
        <LanguageProvider>
          <Viewport appId="k-gg-effect-stack">
            {panel}
          </Viewport>
        </LanguageProvider>,
      );
    }
  }, [panel, pipMount, pipWindow]);

  return (
    <>
      {!pipWindow && !tauriWindowOpen && panel}
    </>
  );
}
