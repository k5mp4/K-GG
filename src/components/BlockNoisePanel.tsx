import { useGradientStore, STORE_DEFAULTS } from '../store/gradientStore';
import { SliderField } from './SliderField';
import { Collapsible } from './Collapsible';
import { AnimatedButton } from './AnimatedButton';
import { Toggle } from './Toggle';
import type { DiffuseConfig } from '../types/distortion';
import { Icon } from './Icon';
import { DiffuseCurveEditor } from './DiffuseCurveEditor';
import { normalizeDiffuseCurve } from '../lib/diffuseCurve';

const D = STORE_DEFAULTS.diffuse;
const isDiffuseDirty = (value: DiffuseConfig) =>
  Object.keys(D).some((key) => {
    if (key === 'enabled') return false;
    const typedKey = key as keyof typeof D;
    return JSON.stringify(value[typedKey as keyof DiffuseConfig]) !== JSON.stringify(D[typedKey]);
  });

const DIFFUSE_MODES: Array<{ value: DiffuseConfig['mode']; label: string }> = [
  { value: 'block', label: 'Block' },
  { value: 'smooth', label: 'Smooth' },
  { value: 'dither', label: 'Dither' },
];

export function DiffusePanel() {
  const { diffuse, setDiffuse } = useGradientStore();
  const canReset = isDiffuseDirty(diffuse);

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Diffuse</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDiffuse({ ...D, enabled: diffuse.enabled })}
              disabled={!canReset}
              className={`w-6 h-6 inline-flex items-center justify-center bg-transparent hover:bg-k-muted text-tab-inactive hover:text-k-text rounded-none transition-all ${
                canReset ? 'opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none'
              }`}
              title="Diffuse のパラメータをリセット"
            >
              <Icon name="restart" className="text-[14px]" />
            </button>
            <Toggle variant="switch" checked={diffuse.enabled} onChange={(v) => setDiffuse({ enabled: v })} />
          </div>
        </div>

        <Collapsible isOpen={diffuse.enabled}>
          <div className="space-y-4 pt-2">
            <div>
              <p className="text-xs text-deep mb-1">Mode</p>
              <div className="grid grid-cols-3 gap-1">
                {DIFFUSE_MODES.map((m) => (
                  <AnimatedButton
                    key={m.value}
                    onClick={() => setDiffuse({ mode: m.value })}
                    isActive={diffuse.mode === m.value}
                    className="py-1"
                  >
                    {m.label}
                  </AnimatedButton>
                ))}
              </div>
            </div>

            {diffuse.mode !== 'dither' && (
              <SliderField
                label="Scatter"
                min={0} max={300} step={1}
                value={diffuse.scatter}
                onChange={(v) => setDiffuse({ scatter: v })}
                format={(v) => v + 'px'}
                defaultValue={D.scatter}
                limitKey="diffuse.scatter"
              />
            )}

            <SliderField
              label={diffuse.mode === 'dither' ? 'Dot Size' : 'Grain'}
              min={0.01} max={diffuse.mode === 'dither' ? 12 : 5} step={0.01}
              value={diffuse.grain}
              onChange={(v) => setDiffuse({ grain: v })}
              format={(v) => v.toFixed(2) + 'px'}
              defaultValue={D.grain}
              limitKey={diffuse.mode === 'dither' ? 'diffuse.ditherGrain' : 'diffuse.grain'}
            />

            {diffuse.mode === 'dither' && (
              <SliderField
                label="Threshold"
                min={0} max={1} step={0.01}
                value={diffuse.ditherThreshold ?? D.ditherThreshold}
                onChange={(v) => setDiffuse({ ditherThreshold: v })}
                format={(v) => Math.round(v * 100) + '%'}
                defaultValue={D.ditherThreshold}
                limitKey="diffuse.ditherThreshold"
              />
            )}

            <div className="flex items-center justify-between border-t border-k-muted/40 pt-3">
              <div>
                <p className="text-xs text-deep">Adaptive Luminance</p>
                <p className="text-[10px] text-tab-inactive">輝度に応じて拡散量を変化</p>
              </div>
              <Toggle checked={diffuse.adaptiveEnabled ?? false} onChange={(v) => setDiffuse({ adaptiveEnabled: v })} />
            </div>
            <DiffuseCurveEditor
              value={diffuse.luminanceCurve}
              onChange={(luminanceCurve) => setDiffuse({ luminanceCurve })}
            />
            <button
              type="button"
              className="w-full border border-k-muted/60 bg-k-surface px-2 py-1 text-[10px] text-tab-inactive hover:border-k-text hover:text-k-text"
              onClick={() => setDiffuse({ luminanceCurve: normalizeDiffuseCurve(undefined) })}
            >
              Reset Luminance Curve
            </button>

            <SliderField
              label="Seed"
              min={0} max={99} step={1}
              value={diffuse.seed}
              onChange={(v) => setDiffuse({ seed: v })}
              defaultValue={D.seed}
              trackId="diffuse.seed"
              limitKey="diffuse.seed"
            />
          </div>
        </Collapsible>
      </div>
    </div>
  );
}
