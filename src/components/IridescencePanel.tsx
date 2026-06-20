import { useGradientStore, STORE_DEFAULTS } from '../store/gradientStore';
import { ManualDistortControls } from './PostprocessPanel';

export function IridescencePanel() {
  const { manualDistort, setManualDistort } = useGradientStore();

  return (
    <div className="space-y-4">
      <ManualDistortControls
        title="Manual Distort"
        value={manualDistort}
        defaults={STORE_DEFAULTS.manualDistort}
        onChange={setManualDistort}
      />
    </div>
  );
}
