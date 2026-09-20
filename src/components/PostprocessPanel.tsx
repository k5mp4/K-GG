import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createEmptyManualDistortMap, createEmptyManualSmoothMask, STORE_DEFAULTS, useGradientStore } from '../store/gradientStore';
import { applicationCommands } from '../application/commands';
import { applyMirrorT, applyRampRepeatT, getColorAtPosition } from '../lib/gradientRampUtils';
import type { ColorStop, RampColorMode, RampInterpolation } from '../types/gradient';
import type { ManualDistortConfig, PostprocessParticleEmitterType } from '../types/distortion';
import { Collapsible } from './Collapsible';
import { CustomSelect } from './CustomSelect';
import { SliderField } from './SliderField';
import { Icon } from './Icon';
import { Toggle } from './Toggle';
import { useLanguage } from '../i18n/LanguageProvider';
import { InputColor, InputDrum, InputRadio, InputString } from 'tweeq';
import { hasEnabledPostprocessEffectStack } from '../lib/effectPipeline';
import { getDiffuseGrainParameterLimitKey } from '../lib/parameterLimits';
import { VORONOI_FEATURES, VORONOI_METRICS } from '../lib/voronoi';
import { VideoMotionPanel } from './VideoMotionPanel';

const D = STORE_DEFAULTS.manualDistort;
const GLASS_COLOR_INPUT_CLASS = 'tq-color-input w-[132px] min-w-0 flex-none border border-panel-border bg-k-bg/50';
const POSTPROCESS_DIFFUSE_MODES: Array<{ value: string; label: string }> = [
  { value: 'block', label: 'Block' },
  { value: 'smooth', label: 'Smooth' },
  { value: 'dither', label: 'Dither' },
  { value: 'halftone', label: 'Halftone' },
  { value: 'ascii', label: 'ASCII' },
];
const POSTPROCESS_DIFFUSE_MODE_VALUES = POSTPROCESS_DIFFUSE_MODES.map((mode) => mode.value);
const POSTPROCESS_HALFTONE_SHAPES = ['circle', 'square'] as const;
const POSTPROCESS_HALFTONE_SHAPE_LABELS = ['Circle', 'Square'] as const;
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
const GLASS_TILE_PATTERN_OPTIONS = [
  { value: 'square', label: 'Square' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'hexagon', label: 'Hexagon' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'brick', label: 'Brick' },
];
const GLASS_TILE_EDGE_OPTIONS = [
  { value: 'clamp', label: 'Clamp' },
  { value: 'tile', label: 'Tile' },
  { value: 'mirror', label: 'Mirror' },
  { value: 'transparent', label: 'Transparent' },
];
const PARTICLE_EMITTER_TYPE_OPTIONS = [
  { value: 'field', label: 'Full Field' },
  { value: 'line', label: 'A-B Line' },
  { value: 'burst', label: 'Center Burst' },
  { value: 'point', label: 'Point' },
];

type PostprocessControlGroupProps = {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

function PostprocessControlGroup({ title, defaultOpen = true, children }: PostprocessControlGroupProps) {
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
        <Icon
          name="chevronDown"
          className={`text-[16px] transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
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
  showEnabledToggle?: boolean;
};

export function ManualDistortControls({ title, value: manualDistort, defaults = D, onChange: setManualDistort, showEnabledToggle = true }: ManualDistortControlsProps) {
  const { t } = useLanguage();
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
              title={t('common.reset')}
              aria-label={t('common.reset')}
            >
              <Icon name="restart" className="text-[14px]" />
            </button>
            {showEnabledToggle && (
              <Toggle
                variant="switch"
                checked={manualDistort.enabled}
                onChange={(v) => setManualDistort({ enabled: v })}
              />
            )}
          </div>
        </div>

        <Collapsible isOpen={!showEnabledToggle || manualDistort.enabled}>
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs mb-1 text-deep">Brush Mode</label>
              <InputRadio
                value={manualDistort.mode}
                options={['warp', 'swirl', 'spiky'] as const}
                labels={['Warp', 'Swirl', 'Spiky'] as const}
                onChange={(mode) => mode !== undefined && setManualDistort({ mode })}
                aria-label="Brush Mode"
                className="w-full"
              />
            </div>
            <SliderField
              label="Brush Size"
              value={manualDistort.brushSize}
              onChange={(v) => setManualDistort({ brushSize: v })}
              format={(v) => `${Math.round(v)}px`}
              limitKey="manualDistort.brushSize"
            />
            <SliderField
              label="Strength"
              value={manualDistort.strength}
              onChange={(v) => setManualDistort({ strength: v })}
              format={(v) => v.toFixed(2)}
              limitKey="manualDistort.strength"
            />
            <SliderField
              label="Falloff"
              value={manualDistort.falloff}
              onChange={(v) => setManualDistort({ falloff: v })}
              format={(v) => v.toFixed(2)}
              limitKey="manualDistort.falloff"
            />
            <SliderField
              label="Max Displacement"
              value={manualDistort.maxDisplacement}
              onChange={(v) => setManualDistort({ maxDisplacement: v })}
              format={(v) => `${Math.round(v * 100)}%`}
              limitKey="manualDistort.maxDisplacement"
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

type PostprocessPanelProps = {
  /** Render a fixed-stage module inside SANDBOX without the legacy header. */
  sandboxMode?: 'prism' | 'particles';
  embedded?: boolean;
};

export function PostprocessPanel({ sandboxMode, embedded = false }: PostprocessPanelProps = {}) {
  const { t } = useLanguage();
  const { gradient, postprocess, effectPipeline } = useGradientStore();
  const { setGradient, setPostprocess, setEffectPipeline } = applicationCommands;
  const selectedVideoMotion = !sandboxMode
    && effectPipeline.version === 'stack-v2'
    && effectPipeline.selectedKind === 'videoMotion';
  const activeEffectMode = sandboxMode ?? (
    selectedVideoMotion
      ? 'videoMotion'
      : postprocess.effectMode === 'prism' || postprocess.effectMode === 'particles'
      ? 'distort'
      : postprocess.effectMode
  );
  const isDistort = activeEffectMode === 'distort';
  const particleEmitterType = ((postprocess.particleEmitterType as string) === 'nexus'
    ? 'point'
    : postprocess.particleEmitterType) as PostprocessParticleEmitterType;
  const particleEmitterPoint = postprocess.particleEmitterPoint ?? STORE_DEFAULTS.postprocess.particleEmitterPoint;
  const postprocessDiffuseGrainLimitKey = getDiffuseGrainParameterLimitKey(postprocess.diffuseMode);
  const particleRampStops = gradient.stops ?? STORE_DEFAULTS.gradient.stops;
  const particleRampInterpolation = gradient.rampInterpolation ?? STORE_DEFAULTS.gradient.rampInterpolation;
  const postprocessEnabled = postprocess.enabled || hasEnabledPostprocessEffectStack(effectPipeline);

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
      {!embedded && (
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm text-k-text">{t('effect.postprocess')}</h2>
          <Toggle
            variant="switch"
            checked={postprocessEnabled}
            onChange={(v) => setPostprocess({ enabled: v })}
          />
        </div>
      )}

      {!sandboxMode && (
        <CustomSelect
          label="Edit Layer"
          value={activeEffectMode}
          options={[
            { value: 'distort', label: 'Distort' },
            { value: 'mirror', label: 'Mirror' },
            { value: 'kaleidoscope', label: 'Kaleidoscope' },
            { value: 'voronoi', label: 'Voronoi' },
            { value: 'glassV2', label: 'Glass' },
            { value: 'glassTile', label: 'GlassTile' },
            { value: 'videoMotion', label: 'Video Motion' },
          ]}
          onChange={(value) => {
            if (value === 'videoMotion') {
              setEffectPipeline({ selectedKind: 'videoMotion' });
            } else {
              setEffectMode(value as typeof postprocess.effectMode);
            }
          }}
        />
      )}

      <Collapsible isOpen>
        <div className="space-y-4 pt-2">
          <div hidden={activeEffectMode !== 'videoMotion'}>
            <VideoMotionPanel />
          </div>
          {activeEffectMode !== 'videoMotion' && (
          <>
          {isDistort ? (
            <ManualDistortControls
              title="Distort"
              value={postprocess}
              defaults={STORE_DEFAULTS.postprocess}
              onChange={setPostprocess}
              showEnabledToggle={false}
            />
          ) : activeEffectMode === 'mirror' ? (
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
          ) : activeEffectMode === 'kaleidoscope' ? (
            <div className="space-y-4">
              <CustomSelect
                label="Mirroring Type"
                value={postprocess.kaleidoscopeType}
                options={KALEIDOSCOPE_TYPE_OPTIONS}
                onChange={(value) => setPostprocess({ kaleidoscopeType: value as typeof postprocess.kaleidoscopeType })}
              />
              <SliderField
                label="Slices"
                value={postprocess.kaleidoscopeSlices}
                onChange={(v) => setPostprocess({ kaleidoscopeSlices: Math.round(v) })}
                format={(v) => `${Math.round(v)}`}
                limitKey="postprocess.kaleidoscopeSlices"
              />
              <SliderField
                label="Rotation"
                value={postprocess.kaleidoscopeRotation}
                onChange={(v) => setPostprocess({ kaleidoscopeRotation: v })}
                format={(v) => `${Math.round(v)}°`}
                control="angle"
                limitKey="postprocess.kaleidoscopeRotation"
              />
              <SliderField
                label="Zoom"
                value={postprocess.kaleidoscopeZoom}
                onChange={(v) => setPostprocess({ kaleidoscopeZoom: v })}
                format={(v) => v.toFixed(2)}
                limitKey="postprocess.kaleidoscopeZoom"
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
          ) : activeEffectMode === 'prism' ? (
            <div className="space-y-4">
              <SliderField
                label="Ray Count"
                value={postprocess.prismRayCount}
                onChange={(v) => setPostprocess({ prismRayCount: Math.round(v) })}
                format={(v) => `${Math.round(v)}`}
                limitKey="postprocess.prismRayCount"
              />
              <SliderField
                label="Length"
                value={postprocess.prismLength}
                onChange={(v) => setPostprocess({ prismLength: v })}
                format={(v) => v.toFixed(2)}
                limitKey="postprocess.prismLength"
              />
              <SliderField
                label="Length Randomness"
                value={postprocess.prismLengthRandomness}
                onChange={(v) => setPostprocess({ prismLengthRandomness: v })}
                format={(v) => `${Math.round(v * 100)}%`}
                limitKey="postprocess.prismLengthRandomness"
              />
              <SliderField
                label="Width"
                value={postprocess.prismWidth}
                onChange={(v) => setPostprocess({ prismWidth: v })}
                format={(v) => v.toFixed(3)}
                limitKey="postprocess.prismWidth"
              />
              <SliderField
                label="Randomness"
                value={postprocess.prismRandomness}
                onChange={(v) => setPostprocess({ prismRandomness: v })}
                format={(v) => `${Math.round(v * 100)}%`}
                limitKey="postprocess.prismRandomness"
              />
              <SliderField
                label="Blur"
                value={postprocess.prismBlur}
                onChange={(v) => setPostprocess({ prismBlur: v })}
                format={(v) => `${Math.round(v * 100)}%`}
                limitKey="postprocess.prismBlur"
              />
              <SliderField
                label="Intensity"
                value={postprocess.prismIntensity}
                onChange={(v) => setPostprocess({ prismIntensity: v })}
                format={(v) => v.toFixed(2)}
                limitKey="postprocess.prismIntensity"
              />
              <SliderField
                label="Glow Radius"
                value={postprocess.prismGlowRadius}
                onChange={(v) => setPostprocess({ prismGlowRadius: v })}
                format={(v) => `${Math.round(v)}px`}
                limitKey="postprocess.prismGlowRadius"
              />
              <SliderField
                label="Chromatic Aberration"
                value={postprocess.prismChromaticAberration}
                onChange={(v) => setPostprocess({ prismChromaticAberration: v })}
                format={(v) => `${v.toFixed(1)}px`}
                limitKey="postprocess.prismChromaticAberration"
              />
              <SliderField
                label="Inner Radius"
                value={postprocess.prismInnerRadius}
                onChange={(v) => setPostprocess({ prismInnerRadius: v })}
                format={(v) => v.toFixed(2)}
                limitKey="postprocess.prismInnerRadius"
              />
              <SliderField
                label="Center X"
                value={postprocess.prismCenter[0]}
                onChange={(v) => setPostprocess({ prismCenter: [v, postprocess.prismCenter[1]] })}
                format={(v) => `${Math.round(v * 100)}%`}
                limitKey="postprocess.prismCenterX"
              />
              <SliderField
                label="Center Y"
                value={postprocess.prismCenter[1]}
                onChange={(v) => setPostprocess({ prismCenter: [postprocess.prismCenter[0], v] })}
                format={(v) => `${Math.round(v * 100)}%`}
                limitKey="postprocess.prismCenterY"
              />
              <SliderField
                label="Seed"
                value={postprocess.prismSeed}
                onChange={(v) => setPostprocess({ prismSeed: Math.round(v) })}
                limitKey="postprocess.prismSeed"
              />
            </div>
          ) : activeEffectMode === 'voronoi' ? (
            <div className="space-y-4">
              <SliderField
                label="Cell Scale"
                value={postprocess.voronoiScale}
                onChange={(v) => setPostprocess({ voronoiScale: v })}
                format={(v) => v.toFixed(1)}
                limitKey="postprocess.voronoiScale"
              />
              <SliderField
                label="Randomness"
                value={postprocess.voronoiRandomness}
                onChange={(v) => setPostprocess({ voronoiRandomness: v })}
                format={(v) => `${Math.round(v * 100)}%`}
                limitKey="postprocess.voronoiRandomness"
              />
              <CustomSelect
                label="Distance Metric"
                value={postprocess.voronoiDistMetric}
                options={VORONOI_METRICS}
                onChange={(value) => setPostprocess({ voronoiDistMetric: value as typeof postprocess.voronoiDistMetric })}
              />
              {postprocess.voronoiDistMetric === 'minkowski' && (
                <SliderField
                  label="Exponent"
                  value={postprocess.voronoiMinkowskiExp}
                  onChange={(v) => setPostprocess({ voronoiMinkowskiExp: v })}
                  format={(v) => v.toFixed(1)}
                  limitKey="postprocess.voronoiMinkowskiExp"
                />
              )}
              <div>
                <label className="block text-xs mb-1 text-deep">Feature</label>
                <div className="flex gap-1">
                  {VORONOI_FEATURES.map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setPostprocess({ voronoiFeature: value })}
                      className={`flex-1 text-xs py-1 rounded-none ${postprocess.voronoiFeature === value ? 'bg-fire text-k-text' : 'bg-k-muted hover:bg-k-muted/70 text-k-text'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <SliderField
                label="Angle"
                value={postprocess.voronoiAngle}
                onChange={(v) => setPostprocess({ voronoiAngle: v })}
                format={(v) => `${Math.round(v)}°`}
                control="angle"
                limitKey="postprocess.voronoiAngle"
              />
              <SliderField
                label="Seed"
                value={postprocess.voronoiSeed}
                onChange={(v) => setPostprocess({ voronoiSeed: Math.round(v) })}
                limitKey="postprocess.voronoiSeed"
              />
            </div>
          ) : activeEffectMode === 'glassTile' ? (
            <div className="space-y-4">
              <p className="text-[10px] leading-relaxed text-tab-inactive">
                KG_Glassのタイル表面モデルを、Effect Stack用の独立したGlassTileとして適用します。タイル輸出でも模様の位相を維持します。
              </p>
              <PostprocessControlGroup title="Pattern">
                <CustomSelect
                  label="Pattern"
                  value={postprocess.glassTilePattern}
                  options={GLASS_TILE_PATTERN_OPTIONS}
                  onChange={(value) => setPostprocess({ glassTilePattern: value as typeof postprocess.glassTilePattern })}
                />
                <SliderField
                  label="Tile Size"
                  value={postprocess.glassTileSize}
                  onChange={(v) => setPostprocess({ glassTileSize: Math.round(v) })}
                  format={(v) => `${Math.round(v)}px`}
                  limitKey="postprocess.glassTileSize"
                />
                <SliderField
                  label="Bevel"
                  value={postprocess.glassTileBevel}
                  onChange={(v) => setPostprocess({ glassTileBevel: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  limitKey="postprocess.glassTileBevel"
                />
                <SliderField
                  label="Surface Height"
                  value={postprocess.glassTileSurfaceHeight}
                  onChange={(v) => setPostprocess({ glassTileSurfaceHeight: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  limitKey="postprocess.glassTileSurfaceHeight"
                />
                <SliderField
                  label="Curvature"
                  value={postprocess.glassTileCurvature}
                  onChange={(v) => setPostprocess({ glassTileCurvature: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  limitKey="postprocess.glassTileCurvature"
                />
                <SliderField
                  label="Detail Scale"
                  value={postprocess.glassTileDetailScale}
                  onChange={(v) => setPostprocess({ glassTileDetailScale: v })}
                  format={(v) => v.toFixed(1)}
                  limitKey="postprocess.glassTileDetailScale"
                />
                <SliderField
                  label="Rotation"
                  value={postprocess.glassTileRotation}
                  onChange={(v) => setPostprocess({ glassTileRotation: v })}
                  format={(v) => `${Math.round(v)}°`}
                  limitKey="postprocess.glassTileRotation"
                />
              </PostprocessControlGroup>

              <PostprocessControlGroup title="Optics">
                <SliderField
                  label="Refraction"
                  value={postprocess.glassTileRefraction}
                  onChange={(v) => setPostprocess({ glassTileRefraction: v })}
                  format={(v) => `${v.toFixed(1)}px`}
                  limitKey="postprocess.glassTileRefraction"
                />
                <SliderField
                  label="Dispersion"
                  value={postprocess.glassTileDispersion}
                  onChange={(v) => setPostprocess({ glassTileDispersion: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  limitKey="postprocess.glassTileDispersion"
                />
                <SliderField
                  label="Roughness"
                  value={postprocess.glassTileRoughness}
                  onChange={(v) => setPostprocess({ glassTileRoughness: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  limitKey="postprocess.glassTileRoughness"
                />
                <SliderField
                  label="Mix"
                  value={postprocess.glassTileMix}
                  onChange={(v) => setPostprocess({ glassTileMix: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  limitKey="postprocess.glassTileMix"
                />
                <CustomSelect
                  label="Edge Mode"
                  value={postprocess.glassTileEdgeMode}
                  options={GLASS_TILE_EDGE_OPTIONS}
                  onChange={(value) => setPostprocess({ glassTileEdgeMode: value as typeof postprocess.glassTileEdgeMode })}
                />
                <SliderField
                  label="Seed"
                  value={postprocess.glassTileSeed}
                  onChange={(v) => setPostprocess({ glassTileSeed: Math.round(v) })}
                  format={(v) => `${Math.round(v).toLocaleString()}`}
                  limitKey="postprocess.glassTileSeed"
                />
              </PostprocessControlGroup>
            </div>
          ) : activeEffectMode === 'glassV2' ? (
            <div className="space-y-4">
              <p className="text-[10px] leading-relaxed text-tab-inactive">
                Smooth gradient noise, wavelength-dependent refraction, rough transmission, and Fresnel highlights are combined as a single-layer screen-space approximation.
              </p>
              <PostprocessControlGroup title="Surface">
                <SliderField
                  label="Scale"
                  value={postprocess.glassScale}
                  onChange={(v) => setPostprocess({ glassScale: v })}
                  format={(v) => v.toFixed(1)}
                  trackId="postprocess.glassScale"
                  limitKey="postprocess.glassScale"
                />
                <SliderField
                  label="Stretch"
                  value={postprocess.glassStretch}
                  onChange={(v) => setPostprocess({ glassStretch: v })}
                  format={(v) => v.toFixed(2)}
                  trackId="postprocess.glassStretch"
                  limitKey="postprocess.glassStretch"
                />
                <SliderField
                  label="Rotation"
                  value={postprocess.glassRotation}
                  onChange={(v) => setPostprocess({ glassRotation: v })}
                  format={(v) => `${Math.round(v)}°`}
                  trackId="postprocess.glassRotation"
                  control="angle"
                  limitKey="postprocess.glassRotation"
                />
                <SliderField
                  label="Complexity"
                  value={postprocess.glassComplexity}
                  onChange={(v) => setPostprocess({ glassComplexity: Math.round(v) })}
                  format={(v) => `${Math.round(v)}`}
                  limitKey="postprocess.glassComplexity"
                />
                <SliderField
                  label="Warp"
                  value={postprocess.glassWarp}
                  onChange={(v) => setPostprocess({ glassWarp: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  trackId="postprocess.glassWarp"
                  limitKey="postprocess.glassWarp"
                />
                <SliderField
                  label="Seed"
                  value={postprocess.glassSeed}
                  onChange={(v) => setPostprocess({ glassSeed: Math.round(v) })}
                  limitKey="postprocess.glassSeed"
                />
                <SliderField
                  label="Noise Distortion"
                  value={postprocess.glassNoiseInfluence}
                  onChange={(v) => setPostprocess({ glassNoiseInfluence: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  trackId="postprocess.glassNoiseInfluence"
                  limitKey="postprocess.glassNoiseInfluence"
                />
                <p className="text-[10px] leading-relaxed text-tab-inactive">
                  Noise Distortion パネルの模様とパラメータをガラス表面へブレンドします。
                </p>
              </PostprocessControlGroup>

              <PostprocessControlGroup title="Optics">
                <SliderField
                  label="Refraction"
                  value={postprocess.glassRefraction}
                  onChange={(v) => setPostprocess({ glassRefraction: v })}
                  format={(v) => `${v.toFixed(1)}px`}
                  trackId="postprocess.glassRefraction"
                  limitKey="postprocess.glassRefraction"
                />
                <SliderField
                  label="Chromatic Aberration"
                  value={postprocess.glassChromaticAberration}
                  onChange={(v) => setPostprocess({ glassChromaticAberration: v })}
                  format={(v) => `${v.toFixed(1)}px`}
                  trackId="postprocess.glassChromaticAberration"
                  limitKey="postprocess.glassChromaticAberration"
                />
                <SliderField
                  label="Roughness"
                  value={postprocess.glassRoughness}
                  onChange={(v) => setPostprocess({ glassRoughness: v })}
                  format={(v) => `${v.toFixed(1)}px`}
                  trackId="postprocess.glassRoughness"
                  limitKey="postprocess.glassRoughness"
                />
                <SliderField
                  label="Highlight"
                  value={postprocess.glassHighlight}
                  onChange={(v) => setPostprocess({ glassHighlight: v })}
                  format={(v) => v.toFixed(2)}
                  trackId="postprocess.glassHighlight"
                  limitKey="postprocess.glassHighlight"
                />
                <SliderField
                  label="Mix"
                  value={postprocess.glassMix}
                  onChange={(v) => setPostprocess({ glassMix: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  trackId="postprocess.glassMix"
                  limitKey="postprocess.glassMix"
                />
              </PostprocessControlGroup>

              <PostprocessControlGroup title="Color">
                <SliderField
                  label="Chromatic Hue"
                  value={postprocess.glassV2ChromaticHue}
                  onChange={(v) => setPostprocess({ glassV2ChromaticHue: v })}
                  format={(v) => `${Math.round(v)}°`}
                  limitKey="postprocess.glassV2ChromaticHue"
                />
                <SliderField
                  label="Chromatic Saturation"
                  value={postprocess.glassV2ChromaticSaturation}
                  onChange={(v) => setPostprocess({ glassV2ChromaticSaturation: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  limitKey="postprocess.glassV2ChromaticSaturation"
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-deep font-display uppercase tracking-wider">
                    Transmission Tint
                  </span>
                  <div className={GLASS_COLOR_INPUT_CLASS}>
                    <InputColor
                      value={postprocess.glassV2TransmissionTint}
                      onChange={(value) => setPostprocess({
                        glassV2TransmissionTint: value.toUpperCase(),
                      })}
                      alpha={false}
                      aria-label="Glass Transmission Tint"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-deep font-display uppercase tracking-wider">
                    Highlight Tint
                  </span>
                  <div className={GLASS_COLOR_INPUT_CLASS}>
                    <InputColor
                      value={postprocess.glassV2HighlightTint}
                      onChange={(value) => setPostprocess({
                        glassV2HighlightTint: value.toUpperCase(),
                      })}
                      alpha={false}
                      aria-label="Glass Highlight Tint"
                    />
                  </div>
                </div>
              </PostprocessControlGroup>

              <PostprocessControlGroup title="Motion" defaultOpen={false}>
                <SliderField
                  label="Evolution"
                  value={postprocess.glassEvolution}
                  onChange={(v) => setPostprocess({ glassEvolution: v })}
                  format={(v) => v.toFixed(3)}
                  trackId="postprocess.glassEvolution"
                  limitKey="postprocess.glassEvolution"
                />
                <SliderField
                  label="Motion"
                  value={postprocess.glassMotion}
                  onChange={(v) => setPostprocess({ glassMotion: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  trackId="postprocess.glassMotion"
                  limitKey="postprocess.glassMotion"
                />
              </PostprocessControlGroup>
            </div>
          ) : (
            <div className="space-y-4">
              <PostprocessControlGroup title="Emission">
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
                      value={particleEmitterPoint[0]}
                      onChange={(v) => setPostprocess({ particleEmitterPoint: [v, particleEmitterPoint[1]] })}
                      format={(v) => `${Math.round(v * 100)}%`}
                      limitKey="postprocess.particleEmitterPointX"
                    />
                    <SliderField
                      label="Point Y"
                      value={particleEmitterPoint[1]}
                      onChange={(v) => setPostprocess({ particleEmitterPoint: [particleEmitterPoint[0], v] })}
                      format={(v) => `${Math.round(v * 100)}%`}
                      limitKey="postprocess.particleEmitterPointY"
                    />
                  </>
                )}
                <SliderField
                  label="Count"
                  value={postprocess.particleCount}
                  onChange={(v) => setPostprocess({ particleCount: Math.round(v / 1000) * 1000 })}
                  format={(v) => `${Math.round(v).toLocaleString()}`}
                  limitKey="postprocess.particleCount"
                />
                <SliderField
                  label="Seed"
                  value={postprocess.particleSeed}
                  onChange={(v) => setPostprocess({ particleSeed: Math.round(v) })}
                  limitKey="postprocess.particleSeed"
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
              </PostprocessControlGroup>

              <PostprocessControlGroup title="Shape">
                <SliderField
                  label="Size"
                  value={postprocess.particleSize}
                  onChange={(v) => setPostprocess({ particleSize: v })}
                  format={(v) => `${v.toFixed(1)}px`}
                  limitKey="postprocess.particleSize"
                />
                <SliderField
                  label="Size Random"
                  value={postprocess.particleSizeRandomness}
                  onChange={(v) => setPostprocess({ particleSizeRandomness: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  limitKey="postprocess.particleSizeRandomness"
                />
                <SliderField
                  label="Feather"
                  value={postprocess.particleFeather}
                  onChange={(v) => setPostprocess({ particleFeather: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  limitKey="postprocess.particleFeather"
                />
                <SliderField
                  label="Core"
                  value={postprocess.particleCore}
                  onChange={(v) => setPostprocess({ particleCore: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  limitKey="postprocess.particleCore"
                />
              </PostprocessControlGroup>

              <PostprocessControlGroup title="Lifetime">
                <SliderField
                  label="Life Time"
                  value={postprocess.particleLifeCycle ?? STORE_DEFAULTS.postprocess.particleLifeCycle}
                  onChange={(v) => setPostprocess({ particleLifeCycle: v })}
                  format={(v) => `${v.toFixed(2)}s`}
                  limitKey="postprocess.particleLifeCycle"
                />
                <SliderField
                  label="Life Random"
                  value={postprocess.particleLifeRandom ?? STORE_DEFAULTS.postprocess.particleLifeRandom}
                  onChange={(v) => setPostprocess({ particleLifeRandom: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  limitKey="postprocess.particleLifeRandom"
                />
                <ParticleLifeGraph
                  label="Size Over Life"
                  value={postprocess.particleSizeOverLife ?? STORE_DEFAULTS.postprocess.particleSizeOverLife}
                />
                <SliderField
                  label="Size Over Life"
                  value={postprocess.particleSizeOverLife ?? STORE_DEFAULTS.postprocess.particleSizeOverLife}
                  onChange={(v) => setPostprocess({ particleSizeOverLife: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  limitKey="postprocess.particleSizeOverLife"
                />
              </PostprocessControlGroup>

              <PostprocessControlGroup title="Motion" defaultOpen={false}>
                <SliderField
                  label="Speed"
                  value={postprocess.particleSpeed}
                  onChange={(v) => setPostprocess({ particleSpeed: v })}
                  format={(v) => v.toFixed(2)}
                  limitKey="postprocess.particleSpeed"
                />
                <SliderField
                  label="Direction"
                  value={postprocess.particleDirection}
                  onChange={(v) => setPostprocess({ particleDirection: v })}
                 format={(v) => `${Math.round(v)}°`}
                 control="angle"
                 limitKey="postprocess.particleDirection"
                />
                <SliderField
                  label="Spread"
                  value={postprocess.particleSpread}
                  onChange={(v) => setPostprocess({ particleSpread: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  limitKey="postprocess.particleSpread"
                />
                <SliderField
                  label="Turbulence"
                  value={postprocess.particleTurbulence}
                  onChange={(v) => setPostprocess({ particleTurbulence: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  limitKey="postprocess.particleTurbulence"
                />
                <SliderField
                  label="Curl Scale"
                  value={postprocess.particleCurlScale}
                  onChange={(v) => setPostprocess({ particleCurlScale: v })}
                  format={(v) => v.toFixed(1)}
                  limitKey="postprocess.particleCurlScale"
                />
                <SliderField
                  label="Curl Strength"
                  value={postprocess.particleCurlStrength}
                  onChange={(v) => setPostprocess({ particleCurlStrength: v })}
                  format={(v) => v.toFixed(2)}
                  limitKey="postprocess.particleCurlStrength"
                />
                <SliderField
                  label="Curl Speed"
                  value={postprocess.particleCurlSpeed}
                  onChange={(v) => setPostprocess({ particleCurlSpeed: v })}
                  format={(v) => v.toFixed(2)}
                  limitKey="postprocess.particleCurlSpeed"
                />
                <SliderField
                  label="Curl Evolution"
                  value={postprocess.particleCurlEvolution}
                  onChange={(v) => setPostprocess({ particleCurlEvolution: v })}
                  format={(v) => v.toFixed(2)}
                  limitKey="postprocess.particleCurlEvolution"
                />
                <SliderField
                  label="Center Force"
                  value={postprocess.particleRadialForce}
                  onChange={(v) => setPostprocess({ particleRadialForce: v })}
                  format={(v) => v.toFixed(2)}
                  limitKey="postprocess.particleRadialForce"
                />
                <SliderField
                  label="Center Falloff"
                  value={postprocess.particleRadialFalloff}
                  onChange={(v) => setPostprocess({ particleRadialFalloff: v })}
                  format={(v) => v.toFixed(2)}
                  limitKey="postprocess.particleRadialFalloff"
                />
                <SliderField
                  label="Depth"
                  value={postprocess.particleDepth}
                  onChange={(v) => setPostprocess({ particleDepth: v })}
                  format={(v) => v.toFixed(2)}
                  limitKey="postprocess.particleDepth"
                />
              </PostprocessControlGroup>

              <PostprocessControlGroup title="Color">
                <SliderField
                  label="Brightness"
                  value={postprocess.particleBrightness}
                  onChange={(v) => setPostprocess({ particleBrightness: v })}
                  format={(v) => v.toFixed(2)}
                  limitKey="postprocess.particleBrightness"
                />
                <SliderField
                  label="Opacity"
                  value={postprocess.particleOpacity}
                  onChange={(v) => setPostprocess({ particleOpacity: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  limitKey="postprocess.particleOpacity"
                />
                <SliderField
                  label="Color Variance"
                  value={postprocess.particleColorVariance}
                  onChange={(v) => setPostprocess({ particleColorVariance: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  limitKey="postprocess.particleColorVariance"
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
                  value={postprocess.particleColorOverLife ?? STORE_DEFAULTS.postprocess.particleColorOverLife}
                  onChange={(v) => setPostprocess({ particleColorOverLife: v, particleColorOverLifeMode: 'ramp' })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  limitKey="postprocess.particleColorOverLife"
                />
                <SliderField
                  label="Edge Fade"
                  value={postprocess.particleEdgeFade}
                  onChange={(v) => setPostprocess({ particleEdgeFade: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  limitKey="postprocess.particleEdgeFade"
                />
              </PostprocessControlGroup>
            </div>
          )}

          {!sandboxMode && effectPipeline.version === 'legacy-v1' && postprocess.effectMode !== 'particles' && (
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
                <div>
                  <p className="mb-1 text-xs text-deep">Diffuse Mode</p>
                  <InputDrum
                    value={postprocess.diffuseMode}
                    options={POSTPROCESS_DIFFUSE_MODE_VALUES}
                    labels={POSTPROCESS_DIFFUSE_MODES.map((mode) => mode.label)}
                    onChange={(mode) => mode !== undefined && setPostprocess({ diffuseMode: mode as typeof postprocess.diffuseMode })}
                    aria-label="Post Diffuse mode"
                    className="w-full"
                  />
                </div>
                {(postprocess.diffuseMode === 'block' || postprocess.diffuseMode === 'smooth') && (
                  <SliderField
                    label="Scatter"
                    value={postprocess.diffuseScatter}
                    onChange={(v) => setPostprocess({ diffuseScatter: v })}
                    format={(v) => `${Math.round(v)}px`}
                    limitKey="diffuse.scatter"
                  />
                )}
                <SliderField
                  label={postprocess.diffuseMode === 'dither' ? 'Dot Size' : postprocess.diffuseMode === 'halftone' || postprocess.diffuseMode === 'ascii' ? 'Cell Size' : 'Grain'}
                  value={postprocess.diffuseGrain}
                  onChange={(v) => setPostprocess({ diffuseGrain: v })}
                  format={(v) => postprocess.diffuseMode === 'halftone' || postprocess.diffuseMode === 'ascii' ? `${Math.round(v)}px` : `${v.toFixed(2)}px`}
                  limitKey={postprocessDiffuseGrainLimitKey}
                />
                {postprocess.diffuseMode === 'halftone' && (
                  <>
                    <div>
                      <p className="mb-1 text-xs text-deep">Shape</p>
                      <InputRadio
                        value={postprocess.diffuseHalftoneShape ?? 'circle'}
                        options={POSTPROCESS_HALFTONE_SHAPES}
                        labels={POSTPROCESS_HALFTONE_SHAPE_LABELS}
                        onChange={(diffuseHalftoneShape) => diffuseHalftoneShape !== undefined && setPostprocess({ diffuseHalftoneShape })}
                        aria-label="Post Diffuse halftone shape"
                        className="w-full"
                      />
                    </div>
                    <SliderField
                      label="Shape Size"
                      value={postprocess.diffuseHalftoneSize ?? STORE_DEFAULTS.postprocess.diffuseHalftoneSize}
                      onChange={(v) => setPostprocess({ diffuseHalftoneSize: v })}
                      format={(v) => `${Math.round(v * 100)}%`}
                      limitKey="diffuse.halftoneSize"
                    />
                  </>
                )}
                {postprocess.diffuseMode === 'ascii' && (
                  <div className="space-y-1">
                    <p className="text-xs text-deep">ASCII Characters</p>
                    <InputString
                      value={postprocess.diffuseAsciiCharset ?? STORE_DEFAULTS.postprocess.diffuseAsciiCharset}
                      onChange={(diffuseAsciiCharset) => setPostprocess({ diffuseAsciiCharset })}
                      aria-label="Post Diffuse ASCII character set"
                      className="w-full"
                    />
                    <p className="text-[9px] text-tab-inactive">Dark to light, left to right</p>
                  </div>
                )}
                {(postprocess.diffuseMode === 'halftone' || postprocess.diffuseMode === 'ascii') && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-deep">Background Color</span>
                    <div className="tq-color-input w-[180px]">
                      <InputColor
                        value={postprocess.diffuseBackgroundColor ?? STORE_DEFAULTS.postprocess.diffuseBackgroundColor}
                        onChange={(diffuseBackgroundColor) => setPostprocess({ diffuseBackgroundColor })}
                        alpha={false}
                        aria-label="Post Diffuse background color"
                      />
                    </div>
                  </div>
                )}
                {postprocess.diffuseMode === 'dither' && (
                  <SliderField
                    label="Threshold"
                    value={postprocess.diffuseDitherThreshold}
                    onChange={(v) => setPostprocess({ diffuseDitherThreshold: v })}
                    format={(v) => `${Math.round(v * 100)}%`}
                    limitKey="diffuse.ditherThreshold"
                  />
                )}
                <SliderField
                  label="Seed"
                  value={postprocess.diffuseSeed}
                  onChange={(v) => setPostprocess({ diffuseSeed: v })}
                  limitKey="diffuse.seed"
                />
              </div>
            </Collapsible>
          </div>
          )}
          </>
          )}
        </div>
      </Collapsible>
    </div>
  );
}
