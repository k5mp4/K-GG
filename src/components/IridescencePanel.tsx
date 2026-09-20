import { useGradientStore, STORE_DEFAULTS } from '../store/gradientStore';
import { applicationCommands } from '../application/commands';
import { ManualDistortControls } from './PostprocessPanel';
import { SliderField } from './SliderField';
import { Toggle } from './Toggle';

export function IridescencePanel() {
  const { manualDistort, iridescence } = useGradientStore();
  const { setManualDistort, setIridescence } = applicationCommands;

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
              value={iridescence.angle}
              onChange={(angle) => setIridescence({ angle })}
              format={(value) => `${Math.round(value)}°`}
              control="angle"
              limitKey="iridescence.angle"
            />
            <SliderField
              label="Strength"
              value={iridescence.strength}
              onChange={(strength) => setIridescence({ strength })}
              limitKey="iridescence.strength"
            />
            <SliderField
              label="Frequency"
              value={iridescence.frequency}
              onChange={(frequency) => setIridescence({ frequency })}
              limitKey="iridescence.frequency"
            />
            <SliderField
              label="Speed"
              value={iridescence.speed}
              onChange={(speed) => setIridescence({ speed })}
              limitKey="iridescence.speed"
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
