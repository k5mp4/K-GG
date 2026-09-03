import { useEffect, useRef, useState } from 'react';
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
import { applicationCommands } from '../application/commands';
import { Toggle } from './Toggle';
import { Icon } from './Icon';
import { useLanguage } from '../i18n/LanguageProvider';
import type { MessageKey } from '../i18n/messages';
import { renderBridge } from '../lib/renderBridge';
import {
  EFFECT_STACK_TRANSITION_DURATION_MS,
  beginEffectStackTransition,
  finishEffectStackTransition,
  isEffectStackTransitionActive,
} from '../lib/effectStackTransition';

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

type Props = {
  onSwapWorkspace?: () => void;
  onSelectEffectStack?: (kind: EffectStackKind) => void;
};

function programKeyForEffect(kind: EffectStackKind): LazyProgramKey {
  if (kind === 'noise') return 'noiseStack';
  if (CORE_EFFECTS.has(kind)) return 'stackCore';
  if (kind === 'glass') return 'glassV2';
  return 'stretch';
}

export function PostprocessStackPanel({ onSwapWorkspace, onSelectEffectStack }: Props = {}) {
  const { t } = useLanguage();
  const { effectPipeline, normalMap, imageGradient } = useGradientStore();
  const { setPostprocess, setEffectPipeline } = applicationCommands;
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
  const [randomizingOrder, setRandomizingOrder] = useState(false);
  const [rowTransitionPhase, setRowTransitionPhase] = useState<RowTransitionPhase>('idle');
  const swapWorkspaceRef = useRef(onSwapWorkspace);
  const selectEffectStackRef = useRef(onSelectEffectStack);
  const previousStackOrderRef = useRef<EffectStackKind[]>(stack.map(layer => layer.kind));
  const soloSnapshotRef = useRef<SoloSnapshot | null>(null);
  stackRef.current = stack;
  swapWorkspaceRef.current = onSwapWorkspace;
  selectEffectStackRef.current = onSelectEffectStack;

  useEffect(() => () => {
    dragCleanupRef.current?.();
    if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current);
    document.body.style.cursor = '';
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
    setEffectPipeline({
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
    <div data-effect-stack-panel className="min-h-8 w-[232px] overflow-hidden border border-cream/20 bg-k-bg/90 shadow-[0_18px_46px_rgba(0,0,0,0.36)] backdrop-blur-md">
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
          {onSwapWorkspace && (
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

  return panel;
}
