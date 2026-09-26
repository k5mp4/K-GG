import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { ColorHistogram } from './ColorHistogram';
import { PostprocessStackPanel } from './PostprocessStackPanel';
import { EFFECT_STACK_PANEL_WIDTH } from './EffectStackPanelView';
import type { EffectStackKind } from '../types/distortion';
import { useLanguage } from '../i18n/LanguageProvider';
import { useEffectStackWindowHost } from '../features/effectStack/useEffectStackWindowHost';

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
};

export function EffectStackWorkspace({
  sourceCanvasRef,
  hidden = false,
  onSelectEffectStack,
}: Props) {
  const { t } = useLanguage();
  const [order, setOrder] = useState<WorkspaceOrder>(readWorkspaceOrder);
  const stackRef = useRef<HTMLDivElement>(null);
  const histogramRef = useRef<HTMLDivElement>(null);
  const stackWindow = useEffectStackWindowHost(onSelectEffectStack);
  const stackDetached = stackWindow.isOpen;

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
      node.style.transform = `translateX(${x}px)`;
    });
  }, [order, stackDetached]);

  useLayoutEffect(() => {
    try {
      window.sessionStorage.setItem(WORKSPACE_ORDER_KEY, order);
    } catch {
      // Session storage is optional in restricted/PiP contexts.
    }
  }, [order]);

  return (
    <div
      data-effect-stack-workspace
      className={`hidden md:block pointer-events-none absolute inset-x-4 top-4 bottom-4 z-30 transition-opacity duration-200 ${hidden ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
      aria-label={t('workspace.effectStack')}
    >
      <div className="relative h-full min-w-[480px]">
        <div ref={stackRef} className={`absolute left-0 top-0 ${hidden ? 'pointer-events-none' : 'pointer-events-auto'}`}>
          {!stackDetached && (
            <PostprocessStackPanel
              onSwapWorkspace={swapOrder}
              onSelectEffectStack={onSelectEffectStack}
              onPopOut={stackWindow.supported ? stackWindow.open : undefined}
            />
          )}
        </div>
        <div ref={histogramRef} className={`absolute left-0 top-0 ${hidden ? 'pointer-events-none' : 'pointer-events-auto'}`}>
          <ColorHistogram sourceCanvasRef={sourceCanvasRef} />
        </div>
      </div>
    </div>
  );
}
