import { useEffect, useRef, useState } from 'react';
import type { EffectStackKind, PostprocessStackKind } from '../types/distortion';
import {
  moveEffectStackLayer,
  normalizeEffectStack,
  updateEffectStackLayer,
} from '../lib/effectPipeline';
import { useGradientStore } from '../store/gradientStore';
import { Toggle } from './Toggle';
import { Icon } from './Icon';

const ROW_HEIGHT = 38;
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

const CATEGORY: Record<EffectStackKind, string> = {
  diffuse: 'Texture', noise: 'Texture',
  slit: 'Transform', stretch: 'Transform', distort: 'Transform', mirror: 'Transform', kaleidoscope: 'Transform',
  voronoi: 'Structure', glass: 'Structure',
};

type DragState = {
  kind: EffectStackKind;
  fromIndex: number;
  targetIndex: number;
  deltaY: number;
};

type LazyProgramKey = 'stackCore' | 'glass' | 'stretch' | 'prism' | 'prismComposite' | 'normalMap' | 'blur' | 'particles';
type LazyProgramStatus = 'loading' | 'ready' | 'failed' | 'fallback';

const CORE_EFFECTS = new Set<EffectStackKind>([
  'diffuse', 'noise', 'slit', 'distort', 'mirror', 'kaleidoscope', 'voronoi',
]);

function programKeyForEffect(kind: EffectStackKind): LazyProgramKey {
  if (CORE_EFFECTS.has(kind)) return 'stackCore';
  if (kind === 'glass') return 'glass';
  return 'stretch';
}

export function PostprocessStackPanel() {
  const { setPostprocess, effectPipeline, setEffectPipeline } = useGradientStore();
  const stack = normalizeEffectStack(effectPipeline.effectStack);
  const movableStack = stack;
  const stackRef = useRef(stack);
  const draggingRef = useRef<DragState | null>(null);
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
  stackRef.current = stack;

  useEffect(() => () => {
    document.body.style.cursor = '';
  }, []);

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

  const selectLayer = (kind: EffectStackKind) => {
    setEffectPipeline({ selectedKind: kind });
    if (kind === 'distort' || kind === 'mirror' || kind === 'kaleidoscope' || kind === 'voronoi' || kind === 'glass') {
      setPostprocess({ enabled: true, effectMode: kind as PostprocessStackKind });
    }
  };

  const startDrag = (e: React.PointerEvent, kind: EffectStackKind, fromIndex: number) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    selectLayer(kind);
    const startY = e.clientY;
    document.body.style.cursor = 'grabbing';
    setDragging({ kind, fromIndex, targetIndex: fromIndex, deltaY: 0 });
    draggingRef.current = { kind, fromIndex, targetIndex: fromIndex, deltaY: 0 };

    const onMove = (ev: PointerEvent) => {
      const deltaY = ev.clientY - startY;
      const targetIndex = Math.max(
        0,
        Math.max(0, Math.min(movableStack.length - 1, Math.round((fromIndex * ROW_HEIGHT + deltaY) / ROW_HEIGHT))),
      );
      const nextDrag = { kind, fromIndex, targetIndex, deltaY };
      draggingRef.current = nextDrag;
      setDragging(nextDrag);
    };

    const onUp = () => {
      document.body.style.cursor = '';
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      const current = useGradientStore.getState().effectPipeline;
      setEffectPipeline({
        selectedKind: kind,
        effectStack: moveEffectStackLayer(current.effectStack, kind, draggingRef.current?.targetIndex ?? fromIndex),
      });
      setDragging(null);
      draggingRef.current = null;
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const rowTransform = (kind: EffectStackKind, index: number) => {
    if (!dragging) return 'translateY(0px)';
    if (kind === dragging.kind) return `translateY(${dragging.deltaY}px)`;
    if (dragging.targetIndex > dragging.fromIndex && index > dragging.fromIndex && index <= dragging.targetIndex) {
      return `translateY(-${ROW_HEIGHT}px)`;
    }
    if (dragging.targetIndex < dragging.fromIndex && index < dragging.fromIndex && index >= dragging.targetIndex) {
      return `translateY(${ROW_HEIGHT}px)`;
    }
    return 'translateY(0px)';
  };

  const effectStatus = (kind: EffectStackKind, enabled: boolean) => {
    return programStatusLabel(programKeyForEffect(kind), enabled);
  };

  const programStatusLabel = (key: LazyProgramKey, enabled: boolean) => {
    if (!enabled) return { label: 'Off', className: 'text-cream/40' };
    const status = programStatus[key];
    if (status === 'loading') return { label: 'Loading…', className: 'text-amber-300' };
    if (status === 'failed') return { label: 'Unavailable', className: 'text-red-300' };
    if (status === 'fallback') return { label: 'Applied (Fallback)', className: 'text-cyan-300' };
    return { label: 'Applied', className: 'text-emerald-300' };
  };

  return (
    <div className="w-[232px] overflow-hidden border border-cream/20 bg-k-bg/90 shadow-[0_18px_46px_rgba(0,0,0,0.36)] backdrop-blur-md">
      <div className="flex h-8 items-center justify-between border-b border-cream/15 px-2.5">
        <button
          type="button"
          className="flex h-full min-w-0 flex-1 items-center gap-1.5 text-left text-cream/80 transition-colors hover:text-fire focus:outline-none focus-visible:ring-2 focus-visible:ring-fire"
          aria-expanded={!collapsed}
          aria-controls="kgg-effect-stack-content"
          onClick={() => setCollapsed(value => !value)}
        >
          <Icon name={collapsed ? 'chevronRight' : 'chevronDown'} className="shrink-0 text-[12px]" />
          <span className="truncate font-display text-[9px] font-bold uppercase tracking-wider">Effect Stack</span>
        </button>
        <span className="text-[8px] font-bold uppercase text-emerald-300">
          Stack V2
        </span>
      </div>
      <div id="kgg-effect-stack-content" hidden={collapsed}>
      <div className="relative" style={{ height: movableStack.length * ROW_HEIGHT }}>
        {movableStack.map((layer, index) => {
          const selected = effectPipeline.selectedKind === layer.kind;
          const isDragging = dragging?.kind === layer.kind;
          const status = effectStatus(layer.kind, layer.enabled);
          return (
            <div
              key={layer.kind}
              className={`absolute left-0 right-0 flex h-[38px] items-center gap-2 border-b border-cream/10 px-2 transition-[transform,background-color,border-color,opacity] duration-150 ${
                selected ? 'bg-fire/15 text-k-text' : 'bg-transparent text-cream/80 hover:bg-cream/10'
              } ${layer.enabled ? 'opacity-100' : 'opacity-56'} ${isDragging ? 'z-10 shadow-[0_12px_28px_rgba(0,0,0,0.42)]' : 'z-0'}`}
              style={{
                top: index * ROW_HEIGHT,
                transform: rowTransform(layer.kind, index),
                transitionDuration: isDragging ? '0ms' : '150ms',
              }}
              onClick={() => selectLayer(layer.kind)}
            >
              <button
                type="button"
                className="flex h-7 w-6 cursor-grab items-center justify-center text-cream/50 transition-colors hover:text-fire active:cursor-grabbing"
                aria-label={`Drag ${LABELS[layer.kind]}`}
                title={`Drag ${LABELS[layer.kind]}`}
                onPointerDown={(e) => startDrag(e, layer.kind, index)}
              >
                <Icon name="gripVertical" className="text-[15px]" />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 truncate font-display text-[10px] font-bold uppercase tracking-wider">
                  {LABELS[layer.kind]}
                  <span className="rounded border border-cream/20 px-1 text-[7px] font-medium tracking-normal text-cream/60">{CATEGORY[layer.kind]}</span>
                </div>
                <div className={`text-[8px] font-medium uppercase tracking-wide ${status.className}`}>{status.label}</div>
              </div>
              <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
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
      <div className="border-t border-cream/15 px-2 py-1.5 text-[8px] uppercase tracking-wider text-cream/55">
        <div className="mb-1">Fixed: Surface → Prism → Particles</div>
        <div className="flex items-center justify-between py-0.5 text-cream/75">
          <span className="flex items-center gap-2">Prism <span className={`text-[8px] ${programStatusLabel('prism', effectPipeline.prismEnabled).className}`}>{programStatusLabel('prism', effectPipeline.prismEnabled).label}</span></span>
          <Toggle variant="switch" size="xs" checked={effectPipeline.prismEnabled} onChange={(prismEnabled) => setEffectPipeline({ prismEnabled })} />
        </div>
        <div className="flex items-center justify-between py-0.5 text-cream/75">
          <span className="flex items-center gap-2">Particles <span className={`text-[8px] ${programStatusLabel('particles', effectPipeline.particlesEnabled).className}`}>{programStatusLabel('particles', effectPipeline.particlesEnabled).label}</span></span>
          <Toggle variant="switch" size="xs" checked={effectPipeline.particlesEnabled} onChange={(particlesEnabled) => setEffectPipeline({ particlesEnabled })} />
        </div>
      </div>
      </div>
    </div>
  );
}
