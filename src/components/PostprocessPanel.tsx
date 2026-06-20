import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createEmptyManualDistortMap, createEmptyManualSmoothMask, STORE_DEFAULTS, useGradientStore } from '../store/gradientStore';
import { applyMirrorT, applyRampRepeatT, getColorAtPosition } from '../lib/gradientRampUtils';
import type { ColorStop, RampColorMode, RampInterpolation } from '../types/gradient';
import type { ManualDistortConfig, PostprocessParticleEmitterType } from '../types/distortion';
import { Collapsible } from './Collapsible';
import { CustomSelect } from './CustomSelect';
import { SliderField } from './SliderField';
import { Toggle } from './Toggle';

const D = STORE_DEFAULTS.manualDistort;
const POSTPROCESS_DIFFUSE_MODES: Array<{ value: string; label: string }> = [
  { value: 'block', label: 'Block' },
  { value: 'smooth', label: 'Smooth' },
  { value: 'dither', label: 'Dither' },
];
const MIRROR_AXIS_OPTIONS = [
  { value: 'horizontal', label: 'Left / Right' },
  { value: 'vertical', label: 'Top / Bottom' },
  { value: 'quad', label: 'Both' },
];
const KALEIDOSCOPE_TYPE_OPTIONS = [
  { value: 'unfold', label: 'Unfold' },
  { value: 'flower', label: 'Flower' },
  { value: 'starlish', label: 'Starlish' },
];
const PARTICLE_EMITTER_TYPE_OPTIONS = [
  { value: 'field', label: 'Full Field' },
  { value: 'line', label: 'A-B Line' },
  { value: 'burst', label: 'Center Burst' },
  { value: 'point', label: 'Point' },
];

type ParticleControlGroupProps = {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

function ParticleControlGroup({ title, defaultOpen = true, children }: ParticleControlGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-cream/35 bg-k-surface/45">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-display uppercase tracking-wider text-deep hover:bg-k-muted/40"
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <span className={`material-symbols-rounded text-[16px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>
      <Collapsible isOpen={isOpen} duration={0.2}>
        <div className="space-y-4 px-3 pb-3 pt-1">
          {children}
        </div>
      </Collapsible>
    </div>
  );
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function ParticleLifeGraph({
  label,
  value,
  stops,
  interpolation = 'ease',
  colorMode,
  variable = 0,
  mirror = false,
  repeat = 1,
}: {
  label: string;
  value: number;
  stops?: ColorStop[];
  interpolation?: RampInterpolation;
  colorMode?: RampColorMode;
  variable?: number;
  mirror?: boolean;
  repeat?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 220;
    const h = 58;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#141414';
    ctx.fillRect(0, 0, w, h);

    const padX = 10;
    const padY = 8;
    const graphW = w - padX * 2;
    const graphH = h - padY * 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const x = padX + graphW * (i / 4);
      ctx.beginPath();
      ctx.moveTo(x + 0.5, padY);
      ctx.lineTo(x + 0.5, padY + graphH);
      ctx.stroke();
    }
    for (let i = 0; i <= 2; i++) {
      const y = padY + graphH * (i / 2);
      ctx.beginPath();
      ctx.moveTo(padX, y + 0.5);
      ctx.lineTo(padX + graphW, y + 0.5);
      ctx.stroke();
    }

    const amount = clamp01(value);
    const sampleY = (t: number) => {
      const scale = 1 - amount * t;
      return padY + (1 - scale) * graphH;
    };
    const sampleColor = (t: number) => {
      const sourceStops = stops && stops.length > 0 ? stops : STORE_DEFAULTS.gradient.stops;
      const colorT = t;
      const repeatedT = applyRampRepeatT(colorT, repeat);
      const rampT = mirror ? applyMirrorT(repeatedT) : repeatedT;
      return getColorAtPosition(sourceStops, rampT, interpolation, colorMode, variable);
    };

    ctx.beginPath();
    ctx.moveTo(padX, padY + graphH);
    for (let i = 0; i <= 48; i++) {
      const t = i / 48;
      ctx.lineTo(padX + t * graphW, sampleY(t));
    }
    ctx.lineTo(padX + graphW, padY + graphH);
    ctx.closePath();
    ctx.save();
    ctx.clip();
    ctx.globalAlpha = 0.8;
    for (let i = 0; i < Math.ceil(graphW); i++) {
      const t = graphW <= 1 ? 0 : i / (graphW - 1);
      ctx.fillStyle = sampleColor(t);
      ctx.fillRect(padX + i, padY, 1.5, graphH);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    ctx.beginPath();
    for (let i = 0; i <= 48; i++) {
      const t = i / 48;
      const x = padX + t * graphW;
      const y = sampleY(t);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#F0EAD9';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.strokeRect(padX + 0.5, padY + 0.5, graphW - 1, graphH - 1);
  }, [colorMode, interpolation, mirror, repeat, stops, value, variable]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-display uppercase tracking-wider text-deep">{label}</span>
        <span className="text-[10px] tabular-nums text-k-text">{Math.round(clamp01(value) * 100)}%</span>
      </div>
      <canvas
        ref={canvasRef}
        className="block h-[58px] w-full border border-cream/25 bg-[#141414]"
      />
    </div>
  );
}

const isManualDistortDirty = (value: ManualDistortConfig, defaults: ManualDistortConfig = D) => {
  const hasDisplacement = value.displacement.some((v) => Math.abs(v) > 1e-6);
  const hasSmoothMask = value.smoothMask.some((v) => Math.abs(v) > 1e-6);
  if (hasDisplacement || hasSmoothMask) return true;
  return Object.keys(defaults).some((key) => {
    if (key === 'enabled' || key === 'displacement' || key === 'smoothMask') return false;
    const typedKey = key as keyof ManualDistortConfig;
    return JSON.stringify(value[typedKey]) !== JSON.stringify(defaults[typedKey]);
  });
};

type ManualDistortControlsProps = {
  title: string;
  value: ManualDistortConfig;
  defaults?: ManualDistortConfig;
  onChange: (v: Partial<ManualDistortConfig>) => void;
};

export function ManualDistortControls({ title, value: manualDistort, defaults = D, onChange: setManualDistort }: ManualDistortControlsProps) {
  const canReset = isManualDistortDirty(manualDistort, defaults);

  const resetManualDistort = () => {
    setManualDistort({
      ...defaults,
      enabled: manualDistort.enabled,
      displacement: createEmptyManualDistortMap(manualDistort.mapResolution),
      smoothMask: createEmptyManualSmoothMask(manualDistort.mapResolution),
      mapResolution: manualDistort.mapResolution,
    });
  };

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm text-k-text">{title}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={resetManualDistort}
              disabled={!canReset}
              className={`w-6 h-6 inline-flex items-center justify-center bg-transparent hover:bg-k-muted text-tab-inactive hover:text-k-text rounded-none transition-all ${
                canReset ? 'opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none'
              }`}
              title="Manual Distort のパラメータと変位マップをリセット"
            >
              <span className="material-symbols-rounded text-[14px]">restart_alt</span>
            </button>
            <Toggle
              variant="switch"
              checked={manualDistort.enabled}
              onChange={(v) => setManualDistort({ enabled: v })}
            />
          </div>
        </div>

        <Collapsible isOpen={manualDistort.enabled}>
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs mb-1 text-deep">Brush Mode</label>
              <div className="grid grid-cols-3 gap-1">
                {([
                  ['warp', 'Warp'],
                  ['swirl', 'Swirl'],
                  ['spiky', 'Spiky'],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setManualDistort({ mode: value })}
                    className={`text-xs py-1.5 rounded-none transition-colors ${
                      manualDistort.mode === value
                        ? 'bg-fire text-k-text'
                        : 'bg-k-muted hover:bg-k-muted/70 text-k-text'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <SliderField
              label="Brush Size"
              min={8}
              max={640}
              step={1}
              value={manualDistort.brushSize}
              onChange={(v) => setManualDistort({ brushSize: v })}
              format={(v) => `${Math.round(v)}px`}
              defaultValue={defaults.brushSize}
            />
            <SliderField
              label="Strength"
              min={0.05}
              max={4}
              step={0.01}
              value={manualDistort.strength}
              onChange={(v) => setManualDistort({ strength: v })}
              format={(v) => v.toFixed(2)}
              defaultValue={defaults.strength}
            />
            <SliderField
              label="Falloff"
              min={0.25}
              max={5}
              step={0.05}
              value={manualDistort.falloff}
              onChange={(v) => setManualDistort({ falloff: v })}
              format={(v) => v.toFixed(2)}
              defaultValue={defaults.falloff}
            />
            <SliderField
              label="Max Displacement"
              min={0.02}
              max={2}
              step={0.01}
              value={manualDistort.maxDisplacement}
              onChange={(v) => setManualDistort({ maxDisplacement: v })}
              format={(v) => `${Math.round(v * 100)}%`}
              defaultValue={defaults.maxDisplacement}
            />
            <div className="flex items-center justify-between border-t border-cream/40 pt-3">
              <span className="text-xs text-deep font-display uppercase tracking-wider">Overlay</span>
              <Toggle
                variant="switch"
                size="xs"
                checked={manualDistort.showOverlay}
                onChange={(v) => setManualDistort({ showOverlay: v })}
              />
            </div>
            <button
              type="button"
              onClick={() => setManualDistort({ displacement: createEmptyManualDistortMap(manualDistort.mapResolution) })}
              className="w-full text-xs bg-k-muted hover:bg-k-muted/70 text-k-text py-1.5 rounded-none"
            >
              {manualDistort.mode === 'swirl'
                ? 'Clear Swirl Map'
                : manualDistort.mode === 'spiky'
                  ? 'Clear Spiky Map'
                  : 'Clear Warp Map'}
            </button>
          </div>
        </Collapsible>
    </div>
  );
}

export function PostprocessPanel() {
  const { gradient, setGradient, postprocess, setPostprocess } = useGradientStore();
  const isDistort = postprocess.effectMode === 'distort';
  const particleEmitterType = ((postprocess.particleEmitterType as string) === 'nexus'
    ? 'point'
    : postprocess.particleEmitterType) as PostprocessParticleEmitterType;
  const particleEmitterPoint = postprocess.particleEmitterPoint ?? STORE_DEFAULTS.postprocess.particleEmitterPoint;
  const particleRampStops = gradient.stops ?? STORE_DEFAULTS.gradient.stops;
  const particleRampInterpolation = gradient.rampInterpolation ?? STORE_DEFAULTS.gradient.rampInterpolation;

  const setEffectMode = (value: typeof postprocess.effectMode) => {
    setPostprocess({ effectMode: value });
    if (value === 'prism') {
      const anchors = gradient.anchors ?? STORE_DEFAULTS.gradient.anchors;
      setGradient({
        anchors: [
          [0.5, 0.5],
          anchors[1],
          anchors[2],
          anchors[3],
        ],
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm text-k-text">Postprocess</h2>
        <Toggle
          variant="switch"
          checked={postprocess.enabled}
          onChange={(v) => setPostprocess({ enabled: v })}
        />
      </div>

      <Collapsible isOpen={postprocess.enabled}>
        <div className="space-y-4 pt-2">
          <CustomSelect
            label="Mode"
            value={postprocess.effectMode}
            options={[
              { value: 'distort', label: 'Distort' },
              { value: 'mirror', label: 'Mirror' },
              { value: 'kaleidoscope', label: 'Kaleidoscope' },
              { value: 'prism', label: 'Prism' },
              { value: 'voronoi', label: 'Voronoi' },
              { value: 'particles', label: 'Particles' },
            ]}
            onChange={(value) => setEffectMode(value as typeof postprocess.effectMode)}
          />

          {isDistort ? (
            <ManualDistortControls
              title="Distort"
              value={postprocess}
              defaults={STORE_DEFAULTS.postprocess}
              onChange={setPostprocess}
            />
          ) : postprocess.effectMode === 'mirror' ? (
            <div className="space-y-4">
              <CustomSelect
                label="Mirror Axis"
                value={postprocess.mirrorMode}
                options={MIRROR_AXIS_OPTIONS}
                onChange={(value) => setPostprocess({ mirrorMode: value as typeof postprocess.mirrorMode })}
              />
              <div className="flex items-center justify-between border-t border-cream/40 pt-3">
                <span className="text-xs text-deep font-display uppercase tracking-wider">Overlay</span>
                <Toggle
                  variant="switch"
                  size="xs"
                  checked={postprocess.showOverlay}
                  onChange={(v) => setPostprocess({ showOverlay: v })}
                />
              </div>
            </div>
          ) : postprocess.effectMode === 'kaleidoscope' ? (
            <div className="space-y-4">
              <CustomSelect
                label="Mirroring Type"
                value={postprocess.kaleidoscopeType}
                options={KALEIDOSCOPE_TYPE_OPTIONS}
                onChange={(value) => setPostprocess({ kaleidoscopeType: value as typeof postprocess.kaleidoscopeType })}
              />
              <SliderField
                label="Slices"
                min={2}
                max={24}
                step={1}
                value={postprocess.kaleidoscopeSlices}
                onChange={(v) => setPostprocess({ kaleidoscopeSlices: Math.round(v) })}
                format={(v) => `${Math.round(v)}`}
                defaultValue={STORE_DEFAULTS.postprocess.kaleidoscopeSlices}
              />
              <SliderField
                label="Rotation"
                min={0}
                max={360}
                step={1}
                value={postprocess.kaleidoscopeRotation}
                onChange={(v) => setPostprocess({ kaleidoscopeRotation: v })}
                format={(v) => `${Math.round(v)}°`}
                defaultValue={STORE_DEFAULTS.postprocess.kaleidoscopeRotation}
              />
              <SliderField
                label="Zoom"
                min={0.25}
                max={4}
                step={0.01}
                value={postprocess.kaleidoscopeZoom}
                onChange={(v) => setPostprocess({ kaleidoscopeZoom: v })}
                format={(v) => v.toFixed(2)}
                defaultValue={STORE_DEFAULTS.postprocess.kaleidoscopeZoom}
              />
              <div className="flex items-center justify-between border-t border-cream/40 pt-3">
                <span className="text-xs text-deep font-display uppercase tracking-wider">Overlay</span>
                <Toggle
                  variant="switch"
                  size="xs"
                  checked={postprocess.showOverlay}
                  onChange={(v) => setPostprocess({ showOverlay: v })}
                />
              </div>
            </div>
          ) : postprocess.effectMode === 'prism' ? (
            <div className="space-y-4">
              <SliderField
                label="Ray Count"
                min={1}
                max={96}
                step={1}
                value={postprocess.prismRayCount}
                onChange={(v) => setPostprocess({ prismRayCount: Math.round(v) })}
                format={(v) => `${Math.round(v)}`}
                defaultValue={STORE_DEFAULTS.postprocess.prismRayCount}
              />
              <SliderField
                label="Length"
                min={0.05}
                max={1.5}
                step={0.01}
                value={postprocess.prismLength}
                onChange={(v) => setPostprocess({ prismLength: v })}
                format={(v) => v.toFixed(2)}
                defaultValue={STORE_DEFAULTS.postprocess.prismLength}
              />
              <SliderField
                label="Length Randomness"
                min={0}
                max={1}
                step={0.01}
                value={postprocess.prismLengthRandomness}
                onChange={(v) => setPostprocess({ prismLengthRandomness: v })}
                format={(v) => `${Math.round(v * 100)}%`}
                defaultValue={STORE_DEFAULTS.postprocess.prismLengthRandomness}
              />
              <SliderField
                label="Width"
                min={0.001}
                max={0.08}
                step={0.001}
                value={postprocess.prismWidth}
                onChange={(v) => setPostprocess({ prismWidth: v })}
                format={(v) => v.toFixed(3)}
                defaultValue={STORE_DEFAULTS.postprocess.prismWidth}
              />
              <SliderField
                label="Randomness"
                min={0}
                max={1}
                step={0.01}
                value={postprocess.prismRandomness}
                onChange={(v) => setPostprocess({ prismRandomness: v })}
                format={(v) => `${Math.round(v * 100)}%`}
                defaultValue={STORE_DEFAULTS.postprocess.prismRandomness}
              />
              <SliderField
                label="Blur"
                min={0}
                max={1}
                step={0.01}
                value={postprocess.prismBlur}
                onChange={(v) => setPostprocess({ prismBlur: v })}
                format={(v) => `${Math.round(v * 100)}%`}
                defaultValue={STORE_DEFAULTS.postprocess.prismBlur}
              />
              <SliderField
                label="Intensity"
                min={0}
                max={3}
                step={0.01}
                value={postprocess.prismIntensity}
                onChange={(v) => setPostprocess({ prismIntensity: v })}
                format={(v) => v.toFixed(2)}
                defaultValue={STORE_DEFAULTS.postprocess.prismIntensity}
              />
              <SliderField
                label="Glow Radius"
                min={0}
                max={80}
                step={1}
                value={postprocess.prismGlowRadius}
                onChange={(v) => setPostprocess({ prismGlowRadius: v })}
                format={(v) => `${Math.round(v)}px`}
                defaultValue={STORE_DEFAULTS.postprocess.prismGlowRadius}
              />
              <SliderField
                label="Chromatic Aberration"
                min={0}
                max={40}
                step={0.1}
                value={postprocess.prismChromaticAberration}
                onChange={(v) => setPostprocess({ prismChromaticAberration: v })}
                format={(v) => `${v.toFixed(1)}px`}
                defaultValue={STORE_DEFAULTS.postprocess.prismChromaticAberration}
              />
              <SliderField
                label="Inner Radius"
                min={0}
                max={0.8}
                step={0.01}
                value={postprocess.prismInnerRadius}
                onChange={(v) => setPostprocess({ prismInnerRadius: v })}
                format={(v) => v.toFixed(2)}
                defaultValue={STORE_DEFAULTS.postprocess.prismInnerRadius}
              />
              <SliderField
                label="Center X"
                min={0}
                max={1}
                step={0.01}
                value={postprocess.prismCenter[0]}
                onChange={(v) => setPostprocess({ prismCenter: [v, postprocess.prismCenter[1]] })}
                format={(v) => `${Math.round(v * 100)}%`}
                defaultValue={STORE_DEFAULTS.postprocess.prismCenter[0]}
              />
              <SliderField
                label="Center Y"
                min={0}
                max={1}
                step={0.01}
                value={postprocess.prismCenter[1]}
                onChange={(v) => setPostprocess({ prismCenter: [postprocess.prismCenter[0], v] })}
                format={(v) => `${Math.round(v * 100)}%`}
                defaultValue={STORE_DEFAULTS.postprocess.prismCenter[1]}
              />
              <SliderField
                label="Seed"
                min={0}
                max={99}
                step={1}
                value={postprocess.prismSeed}
                onChange={(v) => setPostprocess({ prismSeed: Math.round(v) })}
                defaultValue={STORE_DEFAULTS.postprocess.prismSeed}
              />
            </div>
          ) : postprocess.effectMode === 'voronoi' ? (
            <div className="space-y-4">
              <SliderField
                label="Cell Scale"
                min={1}
                max={48}
                step={0.1}
                value={postprocess.voronoiScale}
                onChange={(v) => setPostprocess({ voronoiScale: v })}
                format={(v) => v.toFixed(1)}
                defaultValue={STORE_DEFAULTS.postprocess.voronoiScale}
              />
              <SliderField
                label="Randomness"
                min={0}
                max={1}
                step={0.01}
                value={postprocess.voronoiRandomness}
                onChange={(v) => setPostprocess({ voronoiRandomness: v })}
                format={(v) => `${Math.round(v * 100)}%`}
                defaultValue={STORE_DEFAULTS.postprocess.voronoiRandomness}
              />
              <SliderField
                label="Angle"
                min={0}
                max={360}
                step={1}
                value={postprocess.voronoiAngle}
                onChange={(v) => setPostprocess({ voronoiAngle: v })}
                format={(v) => `${Math.round(v)}°`}
                defaultValue={STORE_DEFAULTS.postprocess.voronoiAngle}
              />
              <SliderField
                label="Gradient Scale"
                min={0.25}
                max={4}
                step={0.01}
                value={postprocess.voronoiGradientScale}
                onChange={(v) => setPostprocess({ voronoiGradientScale: v })}
                format={(v) => v.toFixed(2)}
                defaultValue={STORE_DEFAULTS.postprocess.voronoiGradientScale}
              />
              <SliderField
                label="Edge"
                min={0}
                max={0.2}
                step={0.001}
                value={postprocess.voronoiEdgeWidth}
                onChange={(v) => setPostprocess({ voronoiEdgeWidth: v })}
                format={(v) => `${Math.round(v * 1000) / 10}%`}
                defaultValue={STORE_DEFAULTS.postprocess.voronoiEdgeWidth}
              />
              <SliderField
                label="Seed"
                min={0}
                max={99}
                step={1}
                value={postprocess.voronoiSeed}
                onChange={(v) => setPostprocess({ voronoiSeed: Math.round(v) })}
                defaultValue={STORE_DEFAULTS.postprocess.voronoiSeed}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <ParticleControlGroup title="Emission">
                <CustomSelect
                  label="Emitter Type"
                  value={particleEmitterType}
                  options={PARTICLE_EMITTER_TYPE_OPTIONS}
                  onChange={(value) => setPostprocess({ particleEmitterType: value as typeof postprocess.particleEmitterType })}
                />
                {particleEmitterType === 'point' && (
                  <>
                    <SliderField
                      label="Point X"
                      min={0}
                      max={1}
                      step={0.01}
                      value={particleEmitterPoint[0]}
                      onChange={(v) => setPostprocess({ particleEmitterPoint: [v, particleEmitterPoint[1]] })}
                      format={(v) => `${Math.round(v * 100)}%`}
                      defaultValue={STORE_DEFAULTS.postprocess.particleEmitterPoint[0]}
                    />
                    <SliderField
                      label="Point Y"
                      min={0}
                      max={1}
                      step={0.01}
                      value={particleEmitterPoint[1]}
                      onChange={(v) => setPostprocess({ particleEmitterPoint: [particleEmitterPoint[0], v] })}
                      format={(v) => `${Math.round(v * 100)}%`}
                      defaultValue={STORE_DEFAULTS.postprocess.particleEmitterPoint[1]}
                    />
                  </>
                )}
                <SliderField
                  label="Count"
                  min={1000}
                  max={500000}
                  step={1000}
                  value={postprocess.particleCount}
                  onChange={(v) => setPostprocess({ particleCount: Math.round(v / 1000) * 1000 })}
                  format={(v) => `${Math.round(v).toLocaleString()}`}
                  defaultValue={STORE_DEFAULTS.postprocess.particleCount}
                />
                <SliderField
                  label="Seed"
                  min={0}
                  max={99}
                  step={1}
                  value={postprocess.particleSeed}
                  onChange={(v) => setPostprocess({ particleSeed: Math.round(v) })}
                  defaultValue={STORE_DEFAULTS.postprocess.particleSeed}
                />
                <CustomSelect
                  label="Blend"
                  value={postprocess.particleBlendMode}
                  options={[
                    { value: 'alpha', label: 'Alpha' },
                    { value: 'add', label: 'Add' },
                  ]}
                  onChange={(value) => setPostprocess({ particleBlendMode: value as typeof postprocess.particleBlendMode })}
                />
              </ParticleControlGroup>

              <ParticleControlGroup title="Shape">
                <SliderField
                  label="Size"
                  min={0.5}
                  max={18}
                  step={0.1}
                  value={postprocess.particleSize}
                  onChange={(v) => setPostprocess({ particleSize: v })}
                  format={(v) => `${v.toFixed(1)}px`}
                  defaultValue={STORE_DEFAULTS.postprocess.particleSize}
                />
                <SliderField
                  label="Size Random"
                  min={0}
                  max={1}
                  step={0.01}
                  value={postprocess.particleSizeRandomness}
                  onChange={(v) => setPostprocess({ particleSizeRandomness: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  defaultValue={STORE_DEFAULTS.postprocess.particleSizeRandomness}
                />
                <SliderField
                  label="Feather"
                  min={0}
                  max={1}
                  step={0.01}
                  value={postprocess.particleFeather}
                  onChange={(v) => setPostprocess({ particleFeather: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  defaultValue={STORE_DEFAULTS.postprocess.particleFeather}
                />
                <SliderField
                  label="Core"
                  min={0}
                  max={1}
                  step={0.01}
                  value={postprocess.particleCore}
                  onChange={(v) => setPostprocess({ particleCore: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  defaultValue={STORE_DEFAULTS.postprocess.particleCore}
                />
              </ParticleControlGroup>

              <ParticleControlGroup title="Lifetime">
                <SliderField
                  label="Life Time"
                  min={0.25}
                  max={20}
                  step={0.05}
                  value={postprocess.particleLifeCycle ?? STORE_DEFAULTS.postprocess.particleLifeCycle}
                  onChange={(v) => setPostprocess({ particleLifeCycle: v })}
                  format={(v) => `${v.toFixed(2)}s`}
                  defaultValue={STORE_DEFAULTS.postprocess.particleLifeCycle}
                />
                <SliderField
                  label="Life Random"
                  min={0}
                  max={1}
                  step={0.01}
                  value={postprocess.particleLifeRandom ?? STORE_DEFAULTS.postprocess.particleLifeRandom}
                  onChange={(v) => setPostprocess({ particleLifeRandom: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  defaultValue={STORE_DEFAULTS.postprocess.particleLifeRandom}
                />
                <ParticleLifeGraph
                  label="Size Over Life"
                  value={postprocess.particleSizeOverLife ?? STORE_DEFAULTS.postprocess.particleSizeOverLife}
                />
                <SliderField
                  label="Size Over Life"
                  min={0}
                  max={1}
                  step={0.01}
                  value={postprocess.particleSizeOverLife ?? STORE_DEFAULTS.postprocess.particleSizeOverLife}
                  onChange={(v) => setPostprocess({ particleSizeOverLife: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  defaultValue={STORE_DEFAULTS.postprocess.particleSizeOverLife}
                />
              </ParticleControlGroup>

              <ParticleControlGroup title="Motion" defaultOpen={false}>
                <SliderField
                  label="Speed"
                  min={0}
                  max={2}
                  step={0.01}
                  value={postprocess.particleSpeed}
                  onChange={(v) => setPostprocess({ particleSpeed: v })}
                  format={(v) => v.toFixed(2)}
                  defaultValue={STORE_DEFAULTS.postprocess.particleSpeed}
                />
                <SliderField
                  label="Direction"
                  min={0}
                  max={360}
                  step={1}
                  value={postprocess.particleDirection}
                  onChange={(v) => setPostprocess({ particleDirection: v })}
                  format={(v) => `${Math.round(v)}°`}
                  defaultValue={STORE_DEFAULTS.postprocess.particleDirection}
                />
                <SliderField
                  label="Spread"
                  min={0}
                  max={1}
                  step={0.01}
                  value={postprocess.particleSpread}
                  onChange={(v) => setPostprocess({ particleSpread: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  defaultValue={STORE_DEFAULTS.postprocess.particleSpread}
                />
                <SliderField
                  label="Turbulence"
                  min={0}
                  max={1}
                  step={0.01}
                  value={postprocess.particleTurbulence}
                  onChange={(v) => setPostprocess({ particleTurbulence: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  defaultValue={STORE_DEFAULTS.postprocess.particleTurbulence}
                />
                <SliderField
                  label="Curl Scale"
                  min={0.5}
                  max={16}
                  step={0.1}
                  value={postprocess.particleCurlScale}
                  onChange={(v) => setPostprocess({ particleCurlScale: v })}
                  format={(v) => v.toFixed(1)}
                  defaultValue={STORE_DEFAULTS.postprocess.particleCurlScale}
                />
                <SliderField
                  label="Curl Strength"
                  min={0}
                  max={2}
                  step={0.01}
                  value={postprocess.particleCurlStrength}
                  onChange={(v) => setPostprocess({ particleCurlStrength: v })}
                  format={(v) => v.toFixed(2)}
                  defaultValue={STORE_DEFAULTS.postprocess.particleCurlStrength}
                />
                <SliderField
                  label="Curl Speed"
                  min={0}
                  max={3}
                  step={0.01}
                  value={postprocess.particleCurlSpeed}
                  onChange={(v) => setPostprocess({ particleCurlSpeed: v })}
                  format={(v) => v.toFixed(2)}
                  defaultValue={STORE_DEFAULTS.postprocess.particleCurlSpeed}
                />
                <SliderField
                  label="Curl Evolution"
                  min={0}
                  max={10}
                  step={0.01}
                  value={postprocess.particleCurlEvolution}
                  onChange={(v) => setPostprocess({ particleCurlEvolution: v })}
                  format={(v) => v.toFixed(2)}
                  defaultValue={STORE_DEFAULTS.postprocess.particleCurlEvolution}
                />
                <SliderField
                  label="Center Force"
                  min={-2}
                  max={2}
                  step={0.01}
                  value={postprocess.particleRadialForce}
                  onChange={(v) => setPostprocess({ particleRadialForce: v })}
                  format={(v) => v.toFixed(2)}
                  defaultValue={STORE_DEFAULTS.postprocess.particleRadialForce}
                />
                <SliderField
                  label="Center Falloff"
                  min={0.1}
                  max={3}
                  step={0.01}
                  value={postprocess.particleRadialFalloff}
                  onChange={(v) => setPostprocess({ particleRadialFalloff: v })}
                  format={(v) => v.toFixed(2)}
                  defaultValue={STORE_DEFAULTS.postprocess.particleRadialFalloff}
                />
                <SliderField
                  label="Depth"
                  min={0}
                  max={2}
                  step={0.01}
                  value={postprocess.particleDepth}
                  onChange={(v) => setPostprocess({ particleDepth: v })}
                  format={(v) => v.toFixed(2)}
                  defaultValue={STORE_DEFAULTS.postprocess.particleDepth}
                />
              </ParticleControlGroup>

              <ParticleControlGroup title="Color">
                <SliderField
                  label="Brightness"
                  min={0.1}
                  max={4}
                  step={0.01}
                  value={postprocess.particleBrightness}
                  onChange={(v) => setPostprocess({ particleBrightness: v })}
                  format={(v) => v.toFixed(2)}
                  defaultValue={STORE_DEFAULTS.postprocess.particleBrightness}
                />
                <SliderField
                  label="Opacity"
                  min={0}
                  max={1}
                  step={0.01}
                  value={postprocess.particleOpacity}
                  onChange={(v) => setPostprocess({ particleOpacity: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  defaultValue={STORE_DEFAULTS.postprocess.particleOpacity}
                />
                <SliderField
                  label="Color Variance"
                  min={0}
                  max={0.5}
                  step={0.01}
                  value={postprocess.particleColorVariance}
                  onChange={(v) => setPostprocess({ particleColorVariance: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  defaultValue={STORE_DEFAULTS.postprocess.particleColorVariance}
                />
                <div
                  className="h-6 border border-cream/25"
                  style={{
                    background: `linear-gradient(to right, ${particleRampStops
                      .slice()
                      .sort((a, b) => a.position - b.position)
                      .map((stop) => `${stop.color} ${Math.round(stop.position * 1000) / 10}%`)
                      .join(', ')})`,
                  }}
                  title="Gradient Ramp"
                />
                <div className="flex items-center justify-between text-[10px] font-display uppercase tracking-wider text-deep">
                  <span>Ramp 0%</span>
                  <span>Ramp 100%</span>
                </div>
                <ParticleLifeGraph
                  label="Color Over Life"
                  value={postprocess.particleColorOverLife ?? STORE_DEFAULTS.postprocess.particleColorOverLife}
                  stops={particleRampStops}
                  interpolation={particleRampInterpolation}
                  colorMode={gradient.rampColorMode}
                  variable={gradient.rampVariable ?? 0}
                  mirror={gradient.rampMirror ?? false}
                  repeat={gradient.rampRepeat ?? 1}
                />
                <SliderField
                  label="Color Over Life"
                  min={0}
                  max={1}
                  step={0.01}
                  value={postprocess.particleColorOverLife ?? STORE_DEFAULTS.postprocess.particleColorOverLife}
                  onChange={(v) => setPostprocess({ particleColorOverLife: v, particleColorOverLifeMode: 'ramp' })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  defaultValue={STORE_DEFAULTS.postprocess.particleColorOverLife}
                />
                <SliderField
                  label="Edge Fade"
                  min={0}
                  max={1}
                  step={0.01}
                  value={postprocess.particleEdgeFade}
                  onChange={(v) => setPostprocess({ particleEdgeFade: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  defaultValue={STORE_DEFAULTS.postprocess.particleEdgeFade}
                />
              </ParticleControlGroup>
            </div>
          )}

          {postprocess.effectMode !== 'particles' && (
          <div className="border-t border-cream/40 pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-deep font-display uppercase tracking-wider">Post Diffuse</span>
              <Toggle
                variant="switch"
                size="xs"
                checked={postprocess.diffuseEnabled}
                onChange={(v) => setPostprocess({ diffuseEnabled: v })}
              />
            </div>
            <Collapsible isOpen={postprocess.diffuseEnabled}>
              <div className="space-y-4 pt-2">
                <CustomSelect
                  label="Diffuse Mode"
                  value={postprocess.diffuseMode}
                  options={POSTPROCESS_DIFFUSE_MODES}
                  onChange={(value) => setPostprocess({ diffuseMode: value as typeof postprocess.diffuseMode })}
                />
                {postprocess.diffuseMode !== 'dither' && (
                  <SliderField
                    label="Scatter"
                    min={0}
                    max={300}
                    step={1}
                    value={postprocess.diffuseScatter}
                    onChange={(v) => setPostprocess({ diffuseScatter: v })}
                    format={(v) => `${Math.round(v)}px`}
                    defaultValue={STORE_DEFAULTS.postprocess.diffuseScatter}
                  />
                )}
                <SliderField
                  label={postprocess.diffuseMode === 'dither' ? 'Dot Size' : 'Grain'}
                  min={0.01}
                  max={postprocess.diffuseMode === 'dither' ? 12 : 5}
                  step={0.01}
                  value={postprocess.diffuseGrain}
                  onChange={(v) => setPostprocess({ diffuseGrain: v })}
                  format={(v) => `${v.toFixed(2)}px`}
                  defaultValue={STORE_DEFAULTS.postprocess.diffuseGrain}
                />
                {postprocess.diffuseMode === 'dither' && (
                  <SliderField
                    label="Threshold"
                    min={0}
                    max={1}
                    step={0.01}
                    value={postprocess.diffuseDitherThreshold}
                    onChange={(v) => setPostprocess({ diffuseDitherThreshold: v })}
                    format={(v) => `${Math.round(v * 100)}%`}
                    defaultValue={STORE_DEFAULTS.postprocess.diffuseDitherThreshold}
                  />
                )}
                <SliderField
                  label="Seed"
                  min={0}
                  max={99}
                  step={1}
                  value={postprocess.diffuseSeed}
                  onChange={(v) => setPostprocess({ diffuseSeed: v })}
                  defaultValue={STORE_DEFAULTS.postprocess.diffuseSeed}
                />
              </div>
            </Collapsible>
          </div>
          )}
        </div>
      </Collapsible>
    </div>
  );
}
