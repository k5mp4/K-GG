import { useEffect, useRef, useState } from 'react';
import type { EffectStackKind, PostprocessStackKind } from '../types/distortion';
import {
  EFFECT_STACK_KINDS,
  moveEffectStackLayer,
  normalizeEffectStack,
  updateEffectStackLayer,
} from '../lib/effectPipeline';
import { useGradientStore } from '../store/gradientStore';
import { Toggle } from './Toggle';
import { Icon } from './Icon';

const ROW_HEIGHT = 38;

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

export function PostprocessStackPanel() {
  const { setPostprocess, effectPipeline, setEffectPipeline } = useGradientStore();
  const stack = normalizeEffectStack(effectPipeline.effectStack);
  const movableStack = stack.filter(layer => layer.kind !== 'diffuse');
  const diffuseLayer = stack.find(layer => layer.kind === 'diffuse')!;
  const stackRef = useRef(stack);
  const draggingRef = useRef<DragState | null>(null);
  const [dragging, setDragging] = useState<DragState | null>(null);
  stackRef.current = stack;

  useEffect(() => () => {
    document.body.style.cursor = '';
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
        Math.min(EFFECT_STACK_KINDS.length - 2, Math.round((fromIndex * ROW_HEIGHT + deltaY) / ROW_HEIGHT)),
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

  return (
    <div className="w-[232px] border border-cream/20 bg-k-bg/90 shadow-[0_18px_46px_rgba(0,0,0,0.36)] backdrop-blur-md">
      <div className="flex h-8 items-center justify-between border-b border-cream/15 px-2.5">
        <span className="font-display text-[9px] font-bold uppercase tracking-wider text-cream/80">Effect Stack</span>
        <span className="text-[8px] font-bold uppercase text-emerald-300">
          Stack V2
        </span>
      </div>
      <div className="relative" style={{ height: movableStack.length * ROW_HEIGHT }}>
        {movableStack.map((layer, index) => {
          const selected = effectPipeline.selectedKind === layer.kind;
          const isDragging = dragging?.kind === layer.kind;
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
        <div className="mb-1">Fixed: Surface → Prism → Diffuse → Particles</div>
        <div className="flex items-center justify-between py-0.5 text-cream/75">
          <span>Prism</span>
          <Toggle variant="switch" size="xs" checked={effectPipeline.prismEnabled} onChange={(prismEnabled) => setEffectPipeline({ prismEnabled })} />
        </div>
        <div
          role="button"
          tabIndex={0}
          className={`flex w-full items-center justify-between py-0.5 text-left ${effectPipeline.selectedKind === 'diffuse' ? 'text-fire' : 'text-cream/75'}`}
          onClick={() => selectLayer('diffuse')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') selectLayer('diffuse');
          }}
        >
          <span>Diffuse · Final</span>
          <span onClick={(event) => event.stopPropagation()}>
            <Toggle
              variant="switch"
              size="xs"
              checked={diffuseLayer.enabled}
              onChange={(enabled) => {
                selectLayer('diffuse');
                setEffectPipeline({ effectStack: updateEffectStackLayer(stackRef.current, 'diffuse', { enabled }) });
              }}
            />
          </span>
        </div>
        <div className="flex items-center justify-between py-0.5 text-cream/75">
          <span>Particles</span>
          <Toggle variant="switch" size="xs" checked={effectPipeline.particlesEnabled} onChange={(particlesEnabled) => setEffectPipeline({ particlesEnabled })} />
        </div>
      </div>
    </div>
  );
}
