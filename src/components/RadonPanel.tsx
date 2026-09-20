import { useGradientStore } from '../store/gradientStore';
import { applicationCommands } from '../application/commands';
import { SliderField } from './SliderField';
import { Collapsible } from './Collapsible';
import { Toggle } from './Toggle';

export function RadonPanel() {
  const { radon } = useGradientStore();
  const { setRadon } = applicationCommands;

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
            value={radon.strength}
            onChange={(v) => setRadon({ strength: v })}
            format={(v) => v.toFixed(2)}
            limitKey="radon.strength"
          />

          <SliderField
            label="Frequency"
            value={radon.freq}
            onChange={(v) => setRadon({ freq: v })}
            format={(v) => v.toFixed(2)}
            limitKey="radon.freq"
          />

          <SliderField
            label="Radius"
            value={radon.radius}
            onChange={(v) => setRadon({ radius: v })}
            format={(v) => v.toFixed(2)}
            limitKey="radon.radius"
          />

          <SliderField
            label="Blur"
            value={radon.blur}
            onChange={(v) => setRadon({ blur: v })}
            format={(v) => v.toFixed(2)}
            limitKey="radon.blur"
          />

          <SliderField
            label="Angle"
            value={radon.angle}
            onChange={(v) => setRadon({ angle: v })}
            format={(v) => v + '°'}
            control="angle"
            limitKey="radon.angle"
          />

          <SliderField
            label="Evolution"
            value={radon.evolution}
            onChange={(v) => setRadon({ evolution: v })}
            format={(v) => v.toFixed(2)}
            trackId="radon.evolution"
            limitKey="radon.evolution"
          />

          <SliderField
            label="Speed"
            value={radon.speed}
            onChange={(v) => setRadon({ speed: v })}
            format={(v) => v.toFixed(2)}
            limitKey="radon.speed"
          />
        </div>
      </Collapsible>
    </div>
  );
}
