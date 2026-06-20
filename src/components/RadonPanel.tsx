import { useGradientStore } from '../store/gradientStore';
import { STORE_DEFAULTS } from '../store/gradientStore';
import { SliderField } from './SliderField';
import { Collapsible } from './Collapsible';
import { Toggle } from './Toggle';

const D = STORE_DEFAULTS.radon;

export function RadonPanel() {
  const { radon, setRadon } = useGradientStore();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm flex items-center gap-1.5">
            Radon Warp 
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 leading-none" title="この機能は試験運用中です">🧪 Beta</span>
          </h2>
          <p className="text-xs text-tab-inactive">β</p>
        </div>
        <Toggle variant="switch" checked={radon.enabled} onChange={(v) => setRadon({ enabled: v })} />
      </div>

      <Collapsible isOpen={radon.enabled}>
        <div className="space-y-4 pt-2">
          <p className="text-xs text-tab-inactive leading-relaxed">
            CTスキャンのラドン変換（サイノグラム）を模倣したエフェクトです。
            横軸を投影角度θ（0→π×freq）、縦軸をt座標として、
            投影ライン上をライン積分することでブラーを伴う波形パターンを生成します。
          </p>

          <SliderField
            label="Strength"
            min={0} max={1} step={0.01}
            value={radon.strength}
            onChange={(v) => setRadon({ strength: v })}
            format={(v) => v.toFixed(2)}
            defaultValue={D.strength}
          />

          <SliderField
            label="Frequency"
            min={0.25} max={4} step={0.05}
            value={radon.freq}
            onChange={(v) => setRadon({ freq: v })}
            format={(v) => v.toFixed(2)}
            defaultValue={D.freq}
          />

          <SliderField
            label="Radius"
            min={0.1} max={3} step={0.05}
            value={radon.radius}
            onChange={(v) => setRadon({ radius: v })}
            format={(v) => v.toFixed(2)}
            defaultValue={D.radius}
          />

          <SliderField
            label="Blur"
            min={0} max={2} step={0.05}
            value={radon.blur}
            onChange={(v) => setRadon({ blur: v })}
            format={(v) => v.toFixed(2)}
            defaultValue={D.blur}
          />

          <SliderField
            label="Angle"
            min={0} max={360} step={1}
            value={radon.angle}
            onChange={(v) => setRadon({ angle: v })}
            format={(v) => v + '°'}
            defaultValue={D.angle}
          />

          <SliderField
            label="Evolution"
            min={0} max={10} step={0.01}
            value={radon.evolution}
            onChange={(v) => setRadon({ evolution: v })}
            format={(v) => v.toFixed(2)}
            defaultValue={D.evolution}
          />

          <SliderField
            label="Speed"
            min={0} max={2} step={0.01}
            value={radon.speed}
            onChange={(v) => setRadon({ speed: v })}
            format={(v) => v.toFixed(2)}
            defaultValue={D.speed}
          />
        </div>
      </Collapsible>
    </div>
  );
}
