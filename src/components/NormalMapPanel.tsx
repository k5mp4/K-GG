import { useGradientStore, STORE_DEFAULTS } from '../store/gradientStore';
import type { NormalMapConfig } from '../types/distortion';
import { gradientRampPresets } from '../lib/gradientRampUtils';
import { SliderField } from './SliderField';
import { Collapsible } from './Collapsible';
import { Toggle } from './Toggle';

const D = STORE_DEFAULTS.normalMap;
const isNormalMapDirty = (value: NormalMapConfig) =>
  Object.keys(D).some((key) => {
    if (key === 'enabled') return false;
    const typedKey = key as keyof typeof D;
    return JSON.stringify(value[typedKey as keyof NormalMapConfig]) !== JSON.stringify(D[typedKey]);
  });

export function NormalMapPanel() {
  const { normalMap, setNormalMap, diffuse, setDiffuse, setGradient } = useGradientStore();
  const canReset = isNormalMapDirty(normalMap);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm flex items-center gap-1.5">
          Normal Map
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 leading-none" title="この機能は試験運用中です">🧪 Beta</span>
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNormalMap({ ...D, enabled: normalMap.enabled })}
            disabled={!canReset}
            className={`w-6 h-6 inline-flex items-center justify-center bg-transparent hover:bg-k-muted text-tab-inactive hover:text-k-text rounded-none transition-all ${
              canReset ? 'opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none'
            }`}
            title="Normal Map のパラメータをリセット"
          >
            <span className="material-symbols-rounded text-[14px]">restart_alt</span>
          </button>
          <Toggle
            variant="switch"
            checked={normalMap.enabled}
            onChange={(v) => {
              setNormalMap({ enabled: v });
              if (v) setGradient({ stops: [...gradientRampPresets.mono] });
            }}
          />
        </div>
      </div>

      <Collapsible isOpen={normalMap.enabled && diffuse.enabled}>
        <div className="pt-2">
          <div className="flex items-center justify-between gap-2 text-xs text-amber-400 bg-amber-400/10 rounded px-2 py-1.5">
            <span>Diffuse がオンのため無効です</span>
            <button
              onClick={() => setDiffuse({ enabled: false })}
              className="shrink-0 px-2 py-1 bg-amber-500/20 hover:bg-amber-500/40 rounded text-[10px] font-bold transition-colors"
            >
              OFFにする
            </button>
          </div>
        </div>
      </Collapsible>

      <Collapsible isOpen={normalMap.enabled && !diffuse.enabled}>
        <div className="space-y-4 pt-2">
          <SliderField
            label="Strength"
            min={0.01} max={3.0} step={0.01}
            value={normalMap.strength}
            onChange={(v) => setNormalMap({ strength: v })}
            format={(v) => v.toFixed(2)}
            defaultValue={D.strength}
          />

          <SliderField
            label="Blur"
            min={0} max={20} step={0.5}
            value={normalMap.blur}
            onChange={(v) => setNormalMap({ blur: v })}
            format={(v) => v < 0.5 ? 'Off' : v.toFixed(1) + 'px σ'}
            defaultValue={D.blur}
          />

          <SliderField
            label="Angle"
            min={0} max={360} step={1}
            value={normalMap.angle}
            onChange={(v) => setNormalMap({ angle: v })}
            format={(v) => v.toFixed(0) + '°'}
            defaultValue={D.angle}
          />

          <SliderField
            label="Bevel Size"
            min={0.0} max={100.0} step={0.01}
            value={normalMap.bevelSize}
            onChange={(v) => setNormalMap({ bevelSize: v })}
            format={(v) => v.toFixed(2)}
            defaultValue={D.bevelSize}
          />

          <div className="flex items-center justify-between">
            <label className="text-xs text-deep">凹凸反転 (Invert)</label>
            <Toggle checked={normalMap.invert} onChange={(v) => setNormalMap({ invert: v })} />
          </div>

          <p className="text-xs text-tab-inactive">
            グラデーションの形状から法線マップを生成します。
            Bevel Size で凹凸のステップ幅を制御し、Blur はポストエフェクトの Gaussian blur（σ px）です。
            出力は OpenGL 形式（R=右、G=上、B=手前）です。
          </p>
        </div>
      </Collapsible>
    </div>
  );
}
