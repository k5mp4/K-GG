import { useGradientStore, STORE_DEFAULTS } from '../store/gradientStore';
import { ManualDistortControls } from './PostprocessPanel';
import { SliderField } from './SliderField';
import { Toggle } from './Toggle';

export function IridescencePanel() {
  const { manualDistort, setManualDistort, iridescence, setIridescence } = useGradientStore();

  return (
    <div className="space-y-4">
      <div className="space-y-3 border-b border-k-muted/40 pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Iridescence</h2>
          <Toggle checked={iridescence.enabled} onChange={(enabled) => setIridescence({ enabled })} />
        </div>
        {iridescence.enabled && (
          <>
            <SliderField
              label="Angle"
              min={0} max={360} step={1}
              value={iridescence.angle}
              onChange={(angle) => setIridescence({ angle })}
              format={(value) => `${Math.round(value)}°`}
              defaultValue={STORE_DEFAULTS.iridescence.angle}
              control="angle"
              limitKey="iridescence.angle"
            />
            <SliderField
              label="Strength"
              min={0} max={2} step={0.01}
              value={iridescence.strength}
              onChange={(strength) => setIridescence({ strength })}
              defaultValue={STORE_DEFAULTS.iridescence.strength}
            />
            <SliderField
              label="Frequency"
              min={0.1} max={20} step={0.1}
              value={iridescence.frequency}
              onChange={(frequency) => setIridescence({ frequency })}
              defaultValue={STORE_DEFAULTS.iridescence.frequency}
            />
            <SliderField
              label="Speed"
              min={0} max={5} step={0.01}
              value={iridescence.speed}
              onChange={(speed) => setIridescence({ speed })}
              defaultValue={STORE_DEFAULTS.iridescence.speed}
            />
          </>
        )}
      </div>
      <ManualDistortControls
        title="Manual Distort"
        value={manualDistort}
        defaults={STORE_DEFAULTS.manualDistort}
        onChange={setManualDistort}
      />
    </div>
  );
}
