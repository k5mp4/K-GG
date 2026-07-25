import { useRef, useState } from 'react';
import { useGradientStore, STORE_DEFAULTS } from '../store/gradientStore';
import type { SlitScanConfig } from '../types/distortion';
import { SliderField } from './SliderField';
import { Collapsible } from './Collapsible';
import { AnimatedButton } from './AnimatedButton';
import { Toggle } from './Toggle';
import { imageFileToCanvas } from '../lib/applySlitToImage';
import { Icon } from './Icon';
import { CustomSelect } from './CustomSelect';
import { AnimationPropertyControls } from './AnimationPropertyControls';

const D = STORE_DEFAULTS.slitScan;
const WAVE_DEFAULT_DIRECTION = 90;
const WAVE_DEFAULT_WIDTH = 250;
const WAVE_TYPE_OPTIONS = [
  { value: 'sine', label: 'Sine' },
  { value: 'sawtooth', label: 'Sawtooth' },
  { value: 'semicircle', label: 'Semicircle' },
];

const isSlitDirty = (value: SlitScanConfig) =>
  Object.keys(D).some((key) => {
    if (key === 'enabled') return false;
    const typedKey = key as keyof typeof D;
    return JSON.stringify(value[typedKey as keyof SlitScanConfig]) !== JSON.stringify(D[typedKey]);
  });

type Props = {
  sourceImageName: string;
  hasSourceImage: boolean;
  onSourceImageLoad: (canvas: HTMLCanvasElement, name: string) => void;
  onSourceImageClear: () => void;
};

export function SlitScanPanel({ sourceImageName, hasSourceImage, onSourceImageLoad, onSourceImageClear }: Props) {
  const { slitScan, setSlitScan, slitOverlayEnabled, setSlitOverlayEnabled } = useGradientStore();
  const canReset = isSlitDirty(slitScan);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    document.body.style.cursor = '';
    const file = e.target.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;

    setImageError(null);
    setIsLoadingImage(true);
    try {
      const canvas = await imageFileToCanvas(file);
      onSourceImageLoad(canvas, file.name);
    } catch (err) {
      console.error('Slit source image load failed:', err);
      setImageError('画像の読み込みに失敗しました。');
    } finally {
      setIsLoadingImage(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm">Slit Scan</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSlitScan({ ...D, enabled: slitScan.enabled })}
            disabled={!canReset}
            className={`w-6 h-6 inline-flex items-center justify-center bg-transparent hover:bg-k-muted text-tab-inactive hover:text-k-text rounded-none transition-all ${
              canReset ? 'opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none'
            }`}
            title="Slit Scan のパラメータをリセット"
          >
            <Icon name="restart" className="text-[14px]" />
          </button>
          <Toggle variant="switch" checked={slitScan.enabled} onChange={(v) => setSlitScan({ enabled: v })} />
        </div>
      </div>

      <Collapsible isOpen={slitScan.enabled}>
        <div className="space-y-4 pt-2">
          {/* Overlay ON/OFF */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-deep">Overlay Edit</p>
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="text-[10px] text-k-text/40">PixelPerfect</span>
              <Toggle
                variant="switch"
                size="xs"
                checked={slitScan.pixelPerfect}
                onChange={(v) => {
                  if (v) {
                    // ON 切り替え時: 既存の全値を整数に丸めてシェーダーと完全一致させる
                    setSlitScan({
                      pixelPerfect: true,
                      slitWidth: Math.round(slitScan.slitWidth),
                      slitPhase: Math.round(slitScan.slitPhase ?? 0),
                      slitDeltas: Object.fromEntries(
                        Object.entries(slitScan.slitDeltas ?? {})
                          .map(([k, d]) => [k, Math.round(d)])
                          .filter(([, d]) => (d as number) !== 0)
                      ),
                    });
                  } else {
                    setSlitScan({ pixelPerfect: false });
                  }
                }}
              />
              <div className="w-[1px] h-3 bg-cream/10 mx-1" />
              {slitOverlayEnabled && Object.values(slitScan.slitDeltas ?? {}).some(v => v !== 0) && (
                <button
                  onClick={() => setSlitScan({ slitDeltas: {}, selectedSlitIdx: -1 })}
                  className="text-[10px] leading-tight text-amber-400 hover:text-amber-200 transition-colors"
                >
                  Reset Edit
                </button>
              )}
              <Toggle variant="switch" size="xs" checked={slitOverlayEnabled} onChange={setSlitOverlayEnabled} />
            </div>
          </div>

          <SliderField
            label="Offset"
            min={0} max={1.0} step={0.001}
            value={slitScan.offset}
            onChange={(v) => setSlitScan({ offset: v })}
            format={(v) => v.toFixed(3)}
            defaultValue={D.offset}
            trackId="slitScan.offset"
          />

          {/* Mode toggle */}
          <div>
            <p className="text-xs text-deep mb-1">Mode</p>
            <div className="grid grid-cols-2 gap-1">
              {(['linear', 'circular', 'polygon', 'wave'] as const).map((m) => (
                <AnimatedButton
                  key={m}
                  onClick={() => setSlitScan(
                    m === 'wave'
                      ? { mode: m, angle: WAVE_DEFAULT_DIRECTION, slitWidth: WAVE_DEFAULT_WIDTH }
                      : { mode: m }
                  )}
                  isActive={slitScan.mode === m}
                  className="w-full py-1 capitalize"
                >
                  {m === 'linear' ? 'Linear' : m === 'circular' ? 'Circular' : m === 'polygon' ? 'Polygon' : 'Wave'}
                </AnimatedButton>
              ))}
            </div>
          </div>

          <div className="border border-panel-border border-panel bg-k-bg/40 p-2 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-deep">Source Image</p>
              <div className="flex items-center gap-1">
                {hasSourceImage && (
                  <button
                    onClick={() => {
                      setImageError(null);
                      onSourceImageClear();
                    }}
                    className="text-[10px] text-red-400 hover:text-red-300 px-2 py-0.5 bg-red-900/30 hover:bg-red-900/50 transition-colors"
                  >
                    削除
                  </button>
                )}
                <button
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isLoadingImage}
                  className="text-[10px] text-cream hover:text-k-text px-2 py-0.5 bg-cream/10 hover:bg-cream/20 transition-all"
                >
                  {isLoadingImage ? 'Loading...' : '読み込み'}
                </button>
                <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </div>
            </div>

            {hasSourceImage ? (
              <p className="text-[10px] text-k-text/60 truncate">{sourceImageName}</p>
            ) : (
              <p className="text-[10px] text-k-muted">画像未選択</p>
            )}
            <p className="text-[10px] text-tab-inactive">読み込んだ画像をメインキャンバスに表示し、現在のSlit設定を適用します</p>
            {imageError && <p className="text-[10px] text-red-400">{imageError}</p>}
          </div>

          {/* Angle / Twist */}
          <SliderField
            label={slitScan.mode === 'linear' ? 'Angle' : slitScan.mode === 'polygon' ? 'Rotation / Twist' : slitScan.mode === 'wave' ? 'Direction' : 'Twist'}
            min={0} max={360} step={1}
            value={slitScan.angle}
            onChange={(v) => setSlitScan({ angle: v })}
            format={(v) => v + '°'}
            defaultValue={slitScan.mode === 'wave' ? WAVE_DEFAULT_DIRECTION : D.angle}
            trackId="slitScan.angle"
            control="angle"
            limitKey="slit.angle"
          />

          {slitScan.mode === 'polygon' && (
            <SliderField
              label="Sides"
              min={3} max={32} step={1}
              value={slitScan.polygonSides ?? D.polygonSides}
              onChange={(v) => setSlitScan({ polygonSides: Math.round(v) })}
              format={(v) => `${Math.round(v)}`}
              defaultValue={D.polygonSides}
              trackId="slitScan.polygonSides"
            />
          )}

          {slitScan.mode === 'wave' && (
            <>
              <CustomSelect
                label="Wave Type"
                value={slitScan.waveType ?? D.waveType}
                options={WAVE_TYPE_OPTIONS}
                onChange={(value) => setSlitScan({ waveType: value as SlitScanConfig['waveType'] })}
              />
              <SliderField
                label="Wave Height"
                min={-500} max={500} step={1}
                value={slitScan.waveHeight ?? D.waveHeight}
                onChange={(v) => setSlitScan({ waveHeight: v })}
                format={(v) => `${Math.round(v)}px`}
                defaultValue={D.waveHeight}
                trackId="slitScan.waveHeight"
              />
            </>
          )}

          {slitScan.mode === 'linear' && (
            <SliderField
              label="Offset Angle"
              min={0} max={360} step={1}
              value={slitScan.offsetAngle ?? 90}
              onChange={(v) => setSlitScan({ offsetAngle: v })}
              format={(v) => v + '°'}
              defaultValue={D.offsetAngle ?? 90}
              trackId="slitScan.offsetAngle"
              control="angle"
              limitKey="slit.offsetAngle"
            />
          )}

          <SliderField
            label={slitScan.mode === 'wave' ? 'Wave Width' : 'Width'}
            min={1} max={500} step={1}
            value={slitScan.slitWidth}
            onChange={(v) => setSlitScan({ slitWidth: v })}
            format={(v) => v + 'px'}
            defaultValue={slitScan.mode === 'wave' ? WAVE_DEFAULT_WIDTH : D.slitWidth}
            trackId="slitScan.slitWidth"
          />

          {/* Auto modifier settings. Activation is controlled by property mode. */}
          <div className="space-y-3 border-t border-panel-border/30 pt-3">
            <p className="text-[9px] font-display font-semibold uppercase tracking-widest text-tab-inactive">Auto Modifier</p>
            <div className="flex gap-1">
              {(['unidirectional', 'pingpong'] as const).map((m) => (
                <AnimatedButton
                  key={m}
                  onClick={() => setSlitScan({ animMode: m })}
                  isActive={slitScan.animMode === m}
                  className="flex-1 py-1"
                >
                  {m === 'unidirectional' ? '→ Loop' : '↔ PingPong'}
                </AnimatedButton>
              ))}
            </div>
            <SliderField
              label="Offset Speed"
              min={-2} max={2} step={0.01}
              value={slitScan.offsetSpeed}
              onChange={(v) => setSlitScan({ offsetSpeed: v })}
              format={(v) => v.toFixed(2)}
              defaultValue={D.offsetSpeed}
              trackId="slitScan.offsetSpeed"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-deep">Phase Motion</p>
              <AnimationPropertyControls
                trackId="slitScan.slitPhase"
                label="Phase Motion"
                value={slitScan.slitPhase}
              />
            </div>
            <SliderField
              label="Phase Speed"
              min={-4} max={4} step={0.01}
              value={slitScan.phaseSpeed ?? D.phaseSpeed}
              onChange={(v) => setSlitScan({ phaseSpeed: v })}
              format={(v) => v.toFixed(2)}
              defaultValue={D.phaseSpeed}
              trackId="slitScan.phaseSpeed"
            />
          </div>

          {slitScan.mode === 'linear' && (
            <SliderField
              label="Variance"
              min={0} max={1} step={0.01}
              value={slitScan.variance}
              onChange={(v) => setSlitScan({ variance: v })}
              format={(v) => v.toFixed(2)}
              defaultValue={D.variance}
              trackId="slitScan.variance"
            />
          )}

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <SliderField
                label="Seed"
                min={0} max={99} step={1}
                value={slitScan.seed}
                onChange={(v) => setSlitScan({ seed: v })}
                defaultValue={D.seed}
                trackId="slitScan.seed"
              />
            </div>
            <button
              onClick={() => setSlitScan({ seed: Math.floor(Math.random() * 100) })}
              className="px-2 py-1 mb-1 text-[10px] bg-k-surface hover:bg-k-muted text-k-text/80 rounded-none border border-cream/40 transition-colors shrink-0"
              title="乱数シードをランダムに変更"
            >
              Dice
            </button>
          </div>
        </div>
      </Collapsible>
    </div>
  );
}
