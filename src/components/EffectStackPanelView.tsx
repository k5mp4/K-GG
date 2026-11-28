import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { EffectStackKind } from '../types/distortion';
import './PostprocessStackPanel.css';
import {
  getEffectStackSettlingOffset,
  getEffectStackTargetIndex,
  type EffectStackDragState,
} from '../lib/effectStackDrag';
import { Toggle } from './Toggle';
import { Icon } from './Icon';
import { EffectStackRailFlyout, type RailFlyoutAnchor } from './EffectStackRailFlyout';
import { useLanguage } from '../i18n/LanguageProvider';
import { EFFECT_STACK_TRANSITION_DURATION_MS } from '../lib/effectStackTransition';
import type { EffectStackActions, EffectStackView } from '../features/effectStack/effectStackView';
import { EFFECT_STACK_LABELS, EFFECT_STACK_RAIL_ABBREVIATIONS, effectDescriptionKey } from '../features/effectStack/effectStackLabels';

const ROW_HEIGHT = 38;
const DRAG_SETTLE_MS = 150;
/** Rows slide to a keyboard-moved order (Alt+Up/Down) over this time. */
const KEYBOARD_MOVE_MS = 160;
/** How long a committed drag waits for the moved order before it gives up. */
const DRAG_COMMIT_TIMEOUT_MS = 1000;

type DragState = Omit<EffectStackDragState, 'kind' | 'phase'> & {
  kind: EffectStackKind;
  pointerId: number;
  /** `committed`: the move was requested and rows hold their settled positions until the new order arrives. */
  phase: EffectStackDragState['phase'] | 'committed';
};

type RowTransitionPhase = 'idle' | 'from' | 'animate';

type ViewProps = {
  view: EffectStackView;
  actions: EffectStackActions;
  /**
   * `column` fills the workspace Layers column, `rail` is its collapsed icon rail
   * and `window` fills a native Effect Stack window.
   */
  variant?: 'column' | 'rail' | 'window';
  /** Collapses the Layers column to its icon rail. */
  onCollapse?: () => void;
  /** Expands the icon rail back to the Layers column. */
  onExpand?: () => void;
  /** Shows the pop-out button when the stack can open in its own window. */
  onPopOut?: () => void;
  /** Select without opening an editor while reordering. */
  onDragSelect?: (kind: EffectStackKind) => void;
};

/** The Effect Stack panel, rendered from a serializable view and driven by actions. */
export function EffectStackPanelView({
  view,
  actions,
  variant = 'column',
  onCollapse,
  onExpand,
  onPopOut,
  onDragSelect,
}: ViewProps) {
  const { t } = useLanguage();
  const stack = view.layers;
  const orderKey = useMemo(() => stack.map(layer => layer.kind).join(','), [stack]);
  const draggingRef = useRef<DragState | null>(null);
  const dragCleanupRef = useRef<(() => void) | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [rowTransitionPhase, setRowTransitionPhase] = useState<RowTransitionPhase>('idle');
  const [activeKind, setActiveKind] = useState<EffectStackKind | null>(null);
  /** The rail icon that is stretched into its detail card (hover or keyboard focus). */
  const [flyout, setFlyout] = useState<{ kind: EffectStackKind; element: HTMLElement } | null>(null);
  const selectButtonsRef = useRef(new Map<EffectStackKind, HTMLButtonElement>());
  /** A row moved from the keyboard keeps focus once the new order arrives. */
  const pendingFocusRef = useRef<EffectStackKind | null>(null);
  /** Order before an Alt+Up/Down move, so the rows can slide from it once the new order arrives. */
  const keyboardMoveFromRef = useRef<EffectStackKind[] | null>(null);
  const [keyboardMoveFrom, setKeyboardMoveFrom] = useState<EffectStackKind[] | null>(null);
  const keyboardMoveTimerRef = useRef<number | null>(null);

  const clearSettleTimer = () => {
    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  };

  useEffect(() => () => {
    dragCleanupRef.current?.();
    clearSettleTimer();
    document.body.style.cursor = '';
  }, []);

  // A randomized order first renders at the previous positions ('from'),
  // then animates to the new ones on the next frame.
  useLayoutEffect(() => {
    setRowTransitionPhase(view.randomizing ? 'from' : 'idle');
  }, [view.randomizing]);

  useEffect(() => {
    if (rowTransitionPhase !== 'from') return;
    const frameId = window.requestAnimationFrame(() => setRowTransitionPhase('animate'));
    return () => window.cancelAnimationFrame(frameId);
  }, [rowTransitionPhase]);

  // A committed drag ends when the moved order arrives (before paint, so rows
  // never show the new order with the drag offsets still applied).
  useLayoutEffect(() => {
    if (draggingRef.current?.phase !== 'committed') return;
    clearSettleTimer();
    draggingRef.current = null;
    setDragging(null);
  }, [orderKey]);

  // A keyboard move renders the new order at the old positions ('from'), then slides
  // to the new ones like a drag that settles.
  useLayoutEffect(() => {
    const previous = keyboardMoveFromRef.current;
    if (!previous) return;
    keyboardMoveFromRef.current = null;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    setKeyboardMoveFrom(previous);
    setRowTransitionPhase('from');
    if (keyboardMoveTimerRef.current !== null) window.clearTimeout(keyboardMoveTimerRef.current);
    keyboardMoveTimerRef.current = window.setTimeout(() => {
      keyboardMoveTimerRef.current = null;
      setKeyboardMoveFrom(null);
      setRowTransitionPhase(phase => (phase === 'animate' ? 'idle' : phase));
    }, KEYBOARD_MOVE_MS + 50);
  }, [orderKey]);

  useEffect(() => () => {
    if (keyboardMoveTimerRef.current !== null) window.clearTimeout(keyboardMoveTimerRef.current);
  }, []);

  useLayoutEffect(() => {
    const kind = pendingFocusRef.current;
    if (!kind) return;
    pendingFocusRef.current = null;
    const button = selectButtonsRef.current.get(kind);
    if (button && document.activeElement !== button) button.focus();
  }, [orderKey]);

  const cancelDrag = () => {
    dragCleanupRef.current?.();
    dragCleanupRef.current = null;
    clearSettleTimer();
    draggingRef.current = null;
    setDragging(null);
    document.body.style.cursor = '';
  };

  const commitDrag = (drag: DragState) => {
    const committed: DragState = { ...drag, phase: 'committed' };
    draggingRef.current = committed;
    setDragging(committed);
    document.body.style.cursor = '';
    actions.move(drag.kind, drag.targetIndex);
    // The order normally arrives synchronously (inline) or within a frame
    // (native window); release the rows if it never does.
    settleTimerRef.current = window.setTimeout(() => {
      settleTimerRef.current = null;
      if (draggingRef.current?.phase === 'committed') {
        draggingRef.current = null;
        setDragging(null);
      }
    }, DRAG_COMMIT_TIMEOUT_MS);
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
    if (onDragSelect) onDragSelect(kind);
    else actions.select(kind, false);
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
      const targetIndex = getEffectStackTargetIndex(fromIndex, deltaY, ROW_HEIGHT, stack.length);
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
      const previousIndex = (keyboardMoveFrom ?? view.previousOrder).indexOf(kind);
      if (previousIndex >= 0) return `translate3d(0, ${(previousIndex - index) * ROW_HEIGHT}px, 0)`;
    }
    return 'translate3d(0, 0, 0)';
  };

  const rowTransitionDuration = (isDragging: boolean) => {
    if (rowTransitionPhase === 'from') return '0ms';
    if (view.randomizing) return `${EFFECT_STACK_TRANSITION_DURATION_MS}ms`;
    if (keyboardMoveFrom) return `${KEYBOARD_MOVE_MS}ms`;
    if (!dragging || dragging.phase === 'committed') return '0ms';
    return dragging.phase === 'dragging' && isDragging ? '0ms' : `${DRAG_SETTLE_MS}ms`;
  };

  // Roving focus: one row is in the Tab order, the arrow keys move between rows.
  const rovingKind = (activeKind && stack.some(layer => layer.kind === activeKind))
    ? activeKind
    : (stack.some(layer => layer.kind === view.selectedKind) ? view.selectedKind : stack[0]?.kind) ?? null;

  const handleRowKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, kind: EffectStackKind, index: number) => {
    const last = stack.length - 1;
    if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault();
      const targetIndex = event.key === 'ArrowUp' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex > last || view.randomizing) return;
      pendingFocusRef.current = kind;
      keyboardMoveFromRef.current = stack.map(layer => layer.kind);
      actions.move(kind, targetIndex);
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const targetIndex = event.key === 'ArrowUp' ? index - 1
      : event.key === 'ArrowDown' ? index + 1
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : null;
    if (targetIndex === null) return;
    event.preventDefault();
    const target = stack[Math.max(0, Math.min(last, targetIndex))];
    if (!target || target.kind === kind) return;
    setActiveKind(target.kind);
    // Moving through the list selects without leaving it, like a drag selection.
    if (onDragSelect) onDragSelect(target.kind);
    else actions.select(target.kind, false);
    selectButtonsRef.current.get(target.kind)?.focus();
  };

  const handleLayerToggleClickCapture = (event: React.MouseEvent<HTMLDivElement>, kind: EffectStackKind) => {
    if (!event.altKey) return;
    event.preventDefault();
    event.stopPropagation();
    actions.select(kind, true);
  };

  const flyoutLayer = variant === 'rail' && flyout && !dragging && flyout.element.isConnected
    ? stack.find(layer => layer.kind === flyout.kind)
    : undefined;
  let railFlyoutAnchor: RailFlyoutAnchor | null = null;
  if (flyout && flyoutLayer) {
    const box = flyout.element.getBoundingClientRect();
    railFlyoutAnchor = {
      kind: flyoutLayer.kind,
      enabled: flyoutLayer.enabled,
      selected: view.selectedKind === flyoutLayer.kind,
      statusKey: flyoutLayer.status.labelKey,
      statusClassName: flyoutLayer.status.className,
      rect: { left: box.left, top: box.top, width: box.width, height: box.height },
    };
  }

  const headerButtonClass ='rounded px-1 text-[12px] leading-none text-cream/55 transition-colors hover:bg-cream/10 hover:text-fire focus:outline-none focus-visible:ring-2 focus-visible:ring-fire';

  return (
    <div
      data-effect-stack-panel
      data-variant={variant}
      // The header stays fixed and the rows scroll inside the column or window.
      className={`flex w-full min-w-0 flex-col bg-k-bg ${variant === 'window' ? 'h-screen' : 'h-full'}`}
    >
      {variant === 'rail' ? (
      <div className="flex h-8 shrink-0 items-center justify-center border-b border-cream/15">
        {onExpand && (
          <button
            type="button"
            className="flex h-7 w-8 items-center justify-center p-0 text-cream/70 transition-colors hover:bg-cream/10 hover:text-fire focus:outline-none focus-visible:ring-2 focus-visible:ring-fire"
            title={t('stack.expandColumn')}
            aria-label={t('stack.expandColumn')}
            onClick={onExpand}
          >
            <Icon name="chevronRight" className="text-[14px]" />
          </button>
        )}
      </div>
      ) : (
      <div className="flex h-8 shrink-0 items-center justify-between gap-1.5 border-b border-cream/15 px-2">
        <span className="min-w-0 truncate font-display text-[11px] font-bold uppercase tracking-wider text-cream/90">{t('effect.stack')}</span>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className={`${headerButtonClass} disabled:cursor-wait disabled:opacity-35`}
            title={t('stack.shuffleOrderHint')}
            aria-label={t('stack.shuffleOrder')}
            disabled={view.randomizing}
            onClick={actions.randomize}
          >
            <Icon name="shuffle" className="text-[12px]" />
          </button>
          {onPopOut && (
            <button
              type="button"
              className={headerButtonClass}
              title={t('stack.popOut')}
              aria-label={t('stack.popOut')}
              onClick={onPopOut}
            >
              <Icon name="window" className="text-[12px]" />
            </button>
          )}
          {onCollapse && (
            <button
              type="button"
              className={headerButtonClass}
              title={t('stack.collapseToRail')}
              aria-label={t('stack.collapseToRail')}
              onClick={onCollapse}
            >
              <Icon name="chevronLeft" className="text-[12px]" />
            </button>
          )}
        </div>
      </div>
      )}
      {variant !== 'rail' && (
        // The apply order is part of the list's accessible name; this line shows it.
        <div aria-hidden="true" className="flex h-6 shrink-0 items-center gap-1 border-b border-cream/10 px-2 text-[11px] text-cream/75" data-effect-stack-order>
          <Icon name="chevronDown" className="text-[11px]" />
          <span className="min-w-0 truncate">{t('stack.applyOrder')}</span>
        </div>
      )}
      <div
        id="kgg-effect-stack-content"
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin"
        // The rail's detail card is placed from the icon's box, so scrolling closes it.
        onScroll={flyout ? () => setFlyout(null) : undefined}
      >
      <div
        className="relative"
        style={{ height: stack.length * ROW_HEIGHT }}
        // The rail rows are plain buttons, so only the column exposes a list.
        role={variant === 'rail' ? undefined : 'list'}
        aria-label={variant === 'rail' ? undefined : t('stack.listLabel')}
      >
        {stack.map((layer, index) => {
          const selected = view.selectedKind === layer.kind;
          const isDragging = dragging?.kind === layer.kind;
          if (variant === 'rail') {
            const name = EFFECT_STACK_LABELS[layer.kind];
            const status = t(layer.status.labelKey);
            return (
              <button
                key={layer.kind}
                type="button"
                className="effect-stack-rail-row"
                data-selected={selected ? 'true' : 'false'}
                data-enabled={layer.enabled ? 'true' : 'false'}
                data-dragging={isDragging ? 'true' : 'false'}
                style={{
                  top: index * ROW_HEIGHT,
                  transform: rowTransform(layer.kind, index),
                  transitionDuration: rowTransitionDuration(isDragging),
                }}
                aria-current={selected ? 'true' : undefined}
                aria-label={`${name}: ${status}`}
                aria-description={`${t(effectDescriptionKey(layer.kind))} ${t('stack.railHint')}`}
                // Press selects and starts a drag; a press without movement is a plain selection.
                onPointerDown={(event) => {
                  setFlyout(null);
                  if (!event.altKey) startDrag(event, layer.kind, index);
                }}
                // Keyboard activation (detail 0) and Alt-click solo arrive as clicks.
                onClick={(event) => { if (event.detail === 0 || event.altKey) actions.select(layer.kind, event.altKey); }}
                onPointerEnter={(event) => {
                  if (!layer.enabled) actions.prefetch(layer.kind);
                  if (!draggingRef.current) setFlyout({ kind: layer.kind, element: event.currentTarget });
                }}
                onPointerLeave={() => setFlyout(current => (current?.kind === layer.kind ? null : current))}
                onFocus={(event) => {
                  if (!layer.enabled) actions.prefetch(layer.kind);
                  if (event.currentTarget.matches(':focus-visible')) setFlyout({ kind: layer.kind, element: event.currentTarget });
                }}
                onBlur={() => setFlyout(current => (current?.kind === layer.kind ? null : current))}
              >
                {EFFECT_STACK_RAIL_ABBREVIATIONS[layer.kind]}
                <span aria-hidden="true" className="effect-stack-rail-row__dot" />
              </button>
            );
          }
          const name = EFFECT_STACK_LABELS[layer.kind];
          const focusable = rovingKind === layer.kind;
          return (
            <div
              key={layer.kind}
              role="listitem"
              className="effect-stack-row"
              data-selected={selected ? 'true' : 'false'}
              data-enabled={layer.enabled ? 'true' : 'false'}
              data-dragging={isDragging ? 'true' : 'false'}
              style={{
                top: index * ROW_HEIGHT,
                transform: rowTransform(layer.kind, index),
                transitionDuration: rowTransitionDuration(isDragging),
              }}
              onClick={(event) => actions.select(layer.kind, event.altKey)}
              onPointerEnter={() => {
                // Start a cold shader compile before the toggle click lands.
                if (!layer.enabled) actions.prefetch(layer.kind);
              }}
              onFocusCapture={() => {
                setActiveKind(layer.kind);
                if (!layer.enabled) actions.prefetch(layer.kind);
              }}
            >
              <button
                type="button"
                // Pointer-only; the keyboard reorders with Alt+Up/Down on the layer name.
                tabIndex={-1}
                className="effect-stack-row__drag-handle"
                aria-label={t('stack.drag', { effect: name })}
                title={t('stack.drag', { effect: name })}
                onPointerDown={(e) => startDrag(e, layer.kind, index)}
                onClick={onDragSelect ? event => event.stopPropagation() : undefined}
              >
                <Icon name="gripVertical" className="text-[15px]" />
              </button>
              <button
                type="button"
                ref={element => {
                  if (element) selectButtonsRef.current.set(layer.kind, element);
                  else selectButtonsRef.current.delete(layer.kind);
                }}
                className="effect-stack-row__select"
                tabIndex={focusable ? 0 : -1}
                aria-current={selected ? 'true' : undefined}
                aria-keyshortcuts="ArrowUp ArrowDown Home End Alt+ArrowUp Alt+ArrowDown"
                title={t('stack.rowHint')}
                onKeyDown={(event) => handleRowKeyDown(event, layer.kind, index)}
              >
                <span className="effect-stack-row__title">{name}</span>
                {/* Off and Applied are shown by the switch; only other states get a status word, beside the name. */}
                {layer.status.notice && (
                  <span className={`effect-stack-row__status ${layer.status.className}`} title={t(layer.status.labelKey)}>{t(layer.status.labelKey)}</span>
                )}
              </button>
              <button
                type="button"
                className="effect-stack-row__solo"
                tabIndex={focusable ? 0 : -1}
                aria-label={t('stack.soloLayer', { effect: name })}
                title={t('stack.soloLayer', { effect: name })}
                onClick={(event) => {
                  event.stopPropagation();
                  actions.select(layer.kind, true);
                }}
                onPointerDown={(event) => event.stopPropagation()}
              >
                {t('stack.solo')}
              </button>
              <div
                className="shrink-0"
                onClick={(event) => event.stopPropagation()}
                onClickCapture={(event) => handleLayerToggleClickCapture(event, layer.kind)}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <Toggle
                  variant="switch"
                  size="xs"
                  tabIndex={focusable ? 0 : -1}
                  ariaLabel={t('stack.enableLayer', { effect: name })}
                  checked={layer.enabled}
                  onChange={(enabled) => actions.toggle(layer.kind, enabled)}
                />
              </div>
            </div>
          );
        })}
      </div>
      {view.imageGradientEnabled && variant !== 'rail' && (
        <div className="border-t border-cream/15 px-2 py-1.5 text-[11px] text-amber-300">
          Image Gradient: geometry-resampling layers are protected
        </div>
      )}
      </div>
      {railFlyoutAnchor && <EffectStackRailFlyout key={railFlyoutAnchor.kind} anchor={railFlyoutAnchor} />}
    </div>
  );
}
