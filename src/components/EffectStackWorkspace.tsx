import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { ColorHistogram } from './ColorHistogram';
import { PostprocessStackPanel } from './PostprocessStackPanel';
import { EFFECT_STACK_PANEL_WIDTH } from './EffectStackPanelView';
import type { EffectStackKind } from '../types/distortion';
import { useLanguage } from '../i18n/LanguageProvider';
import { useEffectStackWindowHost } from '../features/effectStack/useEffectStackWindowHost';
import type { ToolPresentation } from '../features/workspace/workspaceLayout';

const WORKSPACE_ORDER_KEY = 'kgg.effect-stack-workspace.order';
const STACK_SLOT_X = 0;
const HISTOGRAM_SLOT_X = EFFECT_STACK_PANEL_WIDTH + 16;

type WorkspaceOrder = 'stack-first' | 'histogram-first';

function readWorkspaceOrder(): WorkspaceOrder {
  try {
    return window.sessionStorage.getItem(WORKSPACE_ORDER_KEY) === 'histogram-first'
      ? 'histogram-first'
      : 'stack-first';
  } catch {
    return 'stack-first';
  }
}

type Props = {
  sourceCanvasRef: RefObject<HTMLCanvasElement | null>;
  hidden?: boolean;
  onSelectEffectStack?: (kind: EffectStackKind) => void;
  presentation?: ToolPresentation;
};

export function EffectStackWorkspace({
  sourceCanvasRef,
  hidden = false,
  onSelectEffectStack,
  presentation = 'inline',
}: Props) {
  const { t } = useLanguage();
  const [order, setOrder] = useState<WorkspaceOrder>(readWorkspaceOrder);
  const stackRef = useRef<HTMLDivElement>(null);
  const histogramRef = useRef<HTMLDivElement>(null);
  const stackWindow = useEffectStackWindowHost(onSelectEffectStack);
  const stackDetached = stackWindow.isOpen;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawer = presentation === 'drawer';
  const visible = !hidden && (!drawer || drawerOpen);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closeDrawer = () => { setDrawerOpen(false); toggleRef.current?.focus(); };
  useEffect(() => {
    if (drawer && visible) closeRef.current?.focus({ preventScroll: true });
  }, [drawer, visible]);

  const swapOrder = useCallback(() => {
    setOrder(current => current === 'stack-first' ? 'histogram-first' : 'stack-first');
  }, []);

  useLayoutEffect(() => {
    const stackX = order === 'stack-first' ? STACK_SLOT_X : HISTOGRAM_SLOT_X;
    // While the stack lives in its own window the histogram takes the first slot.
    const histogramX = order === 'stack-first' && !stackDetached ? HISTOGRAM_SLOT_X : STACK_SLOT_X;
    const nodes = [
      [stackRef.current, stackX],
      [histogramRef.current, histogramX],
    ] as const;

    nodes.forEach(([node, x]) => {
      if (!node) return;
      node.style.transition = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'none' : 'transform 420ms cubic-bezier(0.65, 0, 0.35, 1)';
      node.style.transform = drawer ? 'none' : `translateX(${x}px)`;
    });
  }, [order, stackDetached, drawer]);

  useLayoutEffect(() => {
    try {
      window.sessionStorage.setItem(WORKSPACE_ORDER_KEY, order);
    } catch {
      // Session storage is optional in restricted/PiP contexts.
    }
  }, [order]);

  return (
    <>
    {drawer && !hidden && (
      <button ref={toggleRef} type="button" data-viewport-ui className="absolute bottom-3 left-2 z-30 min-h-10 border border-panel-border bg-k-surface px-3 text-[10px] text-cream" aria-controls="workspace-tools" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(value => !value)}>{t('workspace.tools')}</button>
    )}
    <div
      id="workspace-tools"
      data-effect-stack-workspace
      data-viewport-ui
      data-presentation={presentation}
      className={`absolute z-30 ${drawer ? 'inset-x-2 top-2 bottom-16 overflow-auto border border-panel-border bg-k-bg/95 p-3 scrollbar-thin' : 'inset-x-4 top-4 bottom-4 pointer-events-none'} ${visible ? 'block' : 'hidden'}`}
      inert={!visible}
      onKeyDown={event => { if (drawer && event.key === 'Escape') { event.stopPropagation(); closeDrawer(); } }}
      aria-label={t('workspace.effectStack')}
    >
      {drawer && <div className="mb-3 flex items-center justify-between gap-2"><span className="text-xs text-cream">{t('workspace.tools')}</span><button ref={closeRef} type="button" className="min-h-8 px-3 text-xs" onClick={closeDrawer}>{t('common.close')}</button></div>}
      <div className={drawer ? 'flex flex-wrap items-start gap-4' : 'relative h-full'}>
        <div ref={stackRef} style={{ order: order === 'stack-first' ? 0 : 1 }} className={`${drawer ? 'relative' : 'absolute left-0 top-0 max-h-full overflow-y-auto scrollbar-thin'} pointer-events-auto`}>
          {!stackDetached && (
            <PostprocessStackPanel
              onSwapWorkspace={swapOrder}
              onSelectEffectStack={kind => { if (drawer) setDrawerOpen(false); onSelectEffectStack?.(kind); }}
              onPopOut={stackWindow.supported ? stackWindow.open : undefined}
              openPropertiesOnDrag={!drawer}
            />
          )}
        </div>
        <div ref={histogramRef} style={{ order: order === 'stack-first' ? 1 : 0 }} className={`${drawer ? 'relative' : 'absolute left-0 top-0 max-h-full overflow-auto scrollbar-thin'} pointer-events-auto`}>
          <ColorHistogram sourceCanvasRef={sourceCanvasRef} active={visible} />
        </div>
      </div>
    </div>
    </>
  );
}
