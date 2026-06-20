import { useGradientStore } from '../store/gradientStore';
import { Toggle } from './Toggle';

export function MatcapPanel() {
  const { matcap, setMatcap } = useGradientStore();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm flex items-center gap-1.5">
          Matcap Creator
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 leading-none" title="この機能は試験運用中です">🧪 Beta</span>
        </h2>
        <Toggle variant="switch" checked={matcap.enabled} onChange={(v) => setMatcap({ enabled: v })} />
      </div>

      {matcap.enabled && (
        <div className="space-y-3 pt-1">
          <p className="text-[10px] text-cream bg-deep/10 rounded-none px-2 py-1.5 leading-tight">
            キャンバスを 1024×1024px に設定し、円形マスクを適用します。
          </p>
          <div className="space-y-1 text-[10px] text-deep leading-relaxed">
            <p className="font-medium text-k-text/80 text-xs">Matcap 推奨設定</p>
            <p>• <span className="text-k-text">Normal Map</span> を有効にすると法線マップ形式のMatcapを生成できます</p>
            <p>• グラデーションの <span className="text-k-text">Angle</span> や <span className="text-k-text">Bezier Distortion</span> でハイライト方向を制御</p>
            <p>• Export パネルから PNG でエクスポート（アルファチャンネル保持）</p>
          </div>
        </div>
      )}
    </div>
  );
}
