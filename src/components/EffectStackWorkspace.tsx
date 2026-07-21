import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ColorHistogram } from './ColorHistogram';
import { PostprocessStackPanel } from './PostprocessStackPanel';
import type { EffectStackKind } from '../types/distortion';

const WORKSPACE_ORDER_KEY = 'kgg.effect-stack-workspace.order';
const STACK_SLOT_X = 0;
const HISTOGRAM_SLOT_X = 248;

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

export function EffectStackWorkspace({ sourceCanvasRef, hidden = false, onSelectEffectStack }: Props) {
  const [order, setOrder] = useState<WorkspaceOrder>(readWorkspaceOrder);
  const stackRef = useRef<HTMLDivElement>(null);
  const histogramRef = useRef<HTMLDivElement>(null);

  const swapOrder = useCallback(() => {
    setOrder(current => current === 'stack-first' ? 'histogram-first' : 'stack-first');
  }, []);

  useLayoutEffect(() => {
    const stackX = order === 'stack-first' ? STACK_SLOT_X : HISTOGRAM_SLOT_X;
    const histogramX = order === 'stack-first' ? HISTOGRAM_SLOT_X : STACK_SLOT_X;
    const nodes = [
      [stackRef.current, stackX],
      [histogramRef.current, histogramX],
    ] as const;

    nodes.forEach(([node, x]) => {
      if (!node) return;
      gsap.to(node, {
        x,
        duration: 0.42,
        ease: 'power3.inOut',
        overwrite: 'auto',
      });
    });
  }, [order]);

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
      aria-label="Effect Stack workspace"
    >
      <div className="relative h-full min-w-[480px]">
        <div ref={stackRef} className={`absolute left-0 top-0 ${hidden ? 'pointer-events-none' : 'pointer-events-auto'}`}>
          <PostprocessStackPanel onSwapWorkspace={swapOrder} onSelectEffectStack={onSelectEffectStack} />
        </div>
        <div ref={histogramRef} className={`absolute left-0 top-0 ${hidden ? 'pointer-events-none' : 'pointer-events-auto'}`}>
          <ColorHistogram sourceCanvasRef={sourceCanvasRef} />
        </div>
      </div>
    </div>
  );
}
