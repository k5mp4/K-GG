import { useGradientStore, STORE_DEFAULTS } from '../store/gradientStore';
import type { StretchConfig } from '../types/distortion';
import { SliderField } from './SliderField';
import { Collapsible } from './Collapsible';
import { Toggle } from './Toggle';
import { AnimationPropertyControls } from './AnimationPropertyControls';
import { Icon } from './Icon';

const D = STORE_DEFAULTS.stretch;
const isStretchDirty = (value: StretchConfig) =>
  Object.keys(D).some((key) => {
    if (key === 'enabled') return false;
    const typedKey = key as keyof typeof D;
    return JSON.stringify(value[typedKey as keyof StretchConfig]) !== JSON.stringify(D[typedKey]);
  });

export function StretchPanel() {
  const { stretch, setStretch } = useGradientStore();
  const canReset = isStretchDirty(stretch);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm">Stretch</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStretch({ ...D, enabled: stretch.enabled })}
            disabled={!canReset}
            className={`w-6 h-6 inline-flex items-center justify-center bg-transparent hover:bg-k-muted text-tab-inactive hover:text-k-text rounded-none transition-all ${
              canReset ? 'opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none'
            }`}
            title="Stretch のパラメータをリセット"
          >
            <Icon name="restart" className="text-[14px]" />
          </button>
          <Toggle variant="switch" checked={stretch.enabled} onChange={(v) => setStretch({ enabled: v })} />
        </div>
      </div>

      <Collapsible isOpen={stretch.enabled}>
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-panel-border/30 pb-3">
            <div>
              <p className="text-xs text-deep">Scan Position</p>
              <p className="text-[9px] text-tab-inactive">Auto loops across the composition</p>
            </div>
            <AnimationPropertyControls trackId="stretch.__scan" label="Scan Position" value={0} />
          </div>
          <SliderField
            label="Band Height"
            min={1} max={600} step={1}
            value={stretch.bandHeight}
            onChange={(v) => setStretch({ bandHeight: v })}
            format={(v) => `${v}px`}
            defaultValue={D.bandHeight}
            trackId="stretch.bandHeight"
          />
          <SliderField
            label="Height Variance"
            min={0} max={1} step={0.01}
            value={stretch.bandHeightVariance ?? D.bandHeightVariance}
            onChange={(v) => setStretch({ bandHeightVariance: v })}
            format={(v) => v.toFixed(2)}
            defaultValue={D.bandHeightVariance}
            trackId="stretch.bandHeightVariance"
          />
          <SliderField
            label="Variation"
            min={0} max={1} step={0.01}
            value={stretch.variation}
            onChange={(v) => setStretch({ variation: v })}
            format={(v) => v.toFixed(2)}
            defaultValue={D.variation}
            trackId="stretch.variation"
          />
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <SliderField
                label="Seed"
                min={0} max={99} step={1}
                value={stretch.seed}
                onChange={(v) => setStretch({ seed: v })}
                defaultValue={D.seed}
                trackId="stretch.seed"
              />
            </div>
            <button
              onClick={() => setStretch({ seed: Math.floor(Math.random() * 100) })}
              className="px-2 py-1 mb-1 text-[10px] bg-k-surface hover:bg-k-muted text-k-text/80 rounded-none border border-cream/40 transition-colors shrink-0"
              title="乱数シードをランダムに変更"
            >
              Dice
            </button>
          </div>
          <div className="border-t border-cream/40 pt-3 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-deep font-display uppercase tracking-wider">Glow</span>
              <Toggle variant="switch" size="xs" checked={stretch.glowEnabled ?? false} onChange={(v) => setStretch({ glowEnabled: v })} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-deep font-display uppercase tracking-wider">Glow Tint</span>
              <label className="flex items-center gap-2">
                <span
                  className="block h-6 w-8 border border-cream/40"
                  style={{ backgroundColor: stretch.glowTint ?? D.glowTint }}
                />
                <input
                  type="color"
                  value={stretch.glowTint ?? D.glowTint}
                  onChange={(e) => setStretch({ glowTint: e.target.value })}
                  className="h-7 w-10 cursor-pointer rounded-none border border-cream/40 bg-k-surface p-0"
                  title="Glow tint"
                />
              </label>
            </div>
            <SliderField
              label="Glow Intensity"
              min={0} max={3} step={0.01}
              value={stretch.glowIntensity ?? D.glowIntensity}
              onChange={(v) => setStretch({ glowIntensity: v })}
              format={(v) => v.toFixed(2)}
              defaultValue={D.glowIntensity}
              trackId="stretch.glowIntensity"
            />
            <SliderField
              label="Glow Radius"
              min={1} max={80} step={1}
              value={stretch.glowRadius ?? D.glowRadius}
              onChange={(v) => setStretch({ glowRadius: v })}
              format={(v) => `${Math.round(v)}px`}
              defaultValue={D.glowRadius}
              trackId="stretch.glowRadius"
            />
            <SliderField
              label="Glow Threshold"
              min={0} max={1} step={0.01}
              value={stretch.glowThreshold ?? D.glowThreshold}
              onChange={(v) => setStretch({ glowThreshold: v })}
              format={(v) => v.toFixed(2)}
              defaultValue={D.glowThreshold}
              trackId="stretch.glowThreshold"
            />
          </div>
        </div>
      </Collapsible>
    </div>
  );
}
