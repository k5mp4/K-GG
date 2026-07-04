import { useGradientStore } from '../store/gradientStore';
import { STORE_DEFAULTS } from '../store/gradientStore';
import type { NoiseDistortionConfig } from '../types/distortion';
import { SliderField } from './SliderField';
import { Collapsible } from './Collapsible';
import { Toggle } from './Toggle';
import { CustomSelect } from './CustomSelect';
import { Icon } from './Icon';

const D = STORE_DEFAULTS.noiseDistortion;

const isNoiseDirty = (value: NoiseDistortionConfig) =>
  Object.keys(D).some((key) => {
    if (key === 'enabled') return false;
    const typedKey = key as keyof typeof D;
    return JSON.stringify(value[typedKey as keyof NoiseDistortionConfig]) !== JSON.stringify(D[typedKey]);
  });

// hidden: true にするとUIに表示されなくなる（コード・機能は保持される）
const NOISE_TYPES = [
  { value: 'simplex',          label: 'Simplex' },
  { value: 'fbm',              label: 'fBm' },
  { value: 'voronoi',          label: 'Voronoi' },
  { value: 'ridged_fbm',       label: 'Aura Ridges' },
  { value: 'ae_fractal',       label: 'Fractal Drift' },
  { value: 'curl',             label: 'Curl' },
  { value: 'domain_warp_anim', label: 'Domain Warp' },
  { value: 'seamless',         label: 'Seamless'},
] as { value: string; label: string; hidden?: boolean }[];

const AE_FRACTAL_TYPES = [
  { value: 'basic', label: 'Basic' },
  { value: 'turbulent', label: 'Turbulent' },
];

const SEAMLESS_BASE_TYPES = [
  { value: 'simplex', label: 'Simplex' },
  { value: 'fbm', label: 'fBm (Fractal)' },
  { value: 'curl', label: 'Curl' },
];

const SEAMLESS_ANIM_TYPES = [
  { value: 'drift', label: 'Drift (Sideways)' },
  { value: 'radial', label: 'Radial (Expand)' },
];

const VORONOI_METRICS = [
  { value: 'euclidean', label: 'Euclidean' },
  { value: 'manhattan', label: 'Manhattan' },
  { value: 'chebyshev', label: 'Chebyshev' },
  { value: 'minkowski', label: 'Minkowski' },
];

export function NoiseDistortionPanel() {
  const { noiseDistortion, setNoiseDistortion } = useGradientStore();
  const canReset = isNoiseDirty(noiseDistortion);
  const isDWAnim = noiseDistortion.type === 'domain_warp_anim';
  const isSeamless = noiseDistortion.type === 'seamless';
  const isVoronoi = noiseDistortion.type === 'voronoi';
  const isRidged = noiseDistortion.type === 'ridged_fbm';
  const isAeFractal = noiseDistortion.type === 'ae_fractal';
  const hasOctaves = noiseDistortion.type === 'fbm' ||
                    noiseDistortion.type === 'ridged_fbm' ||
                    noiseDistortion.type === 'ae_fractal' ||
                    noiseDistortion.type === 'curl' ||
                    noiseDistortion.type === 'domain_warp_anim' ||
                    (isSeamless && (noiseDistortion.seamlessType === 'fbm' || noiseDistortion.seamlessType === 'curl'));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pr-1">
        <h2 className="font-semibold text-sm text-k-text">Noise Distortion</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNoiseDistortion({ ...D, enabled: noiseDistortion.enabled })}
            disabled={!canReset}
            className={`w-6 h-6 inline-flex items-center justify-center bg-transparent hover:bg-k-muted text-tab-inactive hover:text-k-text rounded-none transition-all ${
              canReset ? 'opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none'
            }`}
            title="Noise Distortion のパラメータをリセット"
          >
            <Icon name="restart" className="text-[14px]" />
          </button>
          <Toggle variant="switch" checked={noiseDistortion.enabled} onChange={(v) => setNoiseDistortion({ enabled: v })} />
        </div>
      </div>

      <Collapsible isOpen={noiseDistortion.enabled}>
        <div className="space-y-4 pt-2">
          <CustomSelect
            label="Type"
            value={noiseDistortion.type}
            options={NOISE_TYPES.filter(t => !t.hidden)}
            onChange={(val) => setNoiseDistortion({ type: val as NoiseDistortionConfig['type'] })}
          />

          {isSeamless && (
            <CustomSelect
              label="Seamless Base"
              value={noiseDistortion.seamlessType}
              options={SEAMLESS_BASE_TYPES}
              onChange={(val) => setNoiseDistortion({ seamlessType: val as NoiseDistortionConfig['seamlessType'] })}
            />
          )}

          {isSeamless && (
            <CustomSelect
              label="Seamless Animation"
              value={noiseDistortion.seamlessAnimation}
              options={SEAMLESS_ANIM_TYPES}
              onChange={(val) => setNoiseDistortion({ seamlessAnimation: val as 'drift' | 'radial' })}
            />
          )}

          {isSeamless && (
            <SliderField
              label="Spiral Twist"
              min={-20} max={20} step={0.1}
              value={noiseDistortion.seamlessTwist}
              onChange={(v) => setNoiseDistortion({ seamlessTwist: v })}
              format={(v) => v.toFixed(1)}
              defaultValue={D.seamlessTwist}
              trackId="noiseDistortion.seamlessTwist"
            />
          )}

          {isVoronoi && (
            <>
              <CustomSelect
                label="Distance Metric"
                value={noiseDistortion.voronoiDistMetric}
                options={VORONOI_METRICS}
                onChange={(val) => setNoiseDistortion({ voronoiDistMetric: val as NoiseDistortionConfig['voronoiDistMetric'] })}
              />
              {noiseDistortion.voronoiDistMetric === 'minkowski' && (
                <SliderField
                  label="Exponent"
                  min={0.5} max={8} step={0.1}
                  value={noiseDistortion.voronoiMinkowskiExp}
                  onChange={(v) => setNoiseDistortion({ voronoiMinkowskiExp: v })}
                  format={(v) => v.toFixed(1)}
                  defaultValue={D.voronoiMinkowskiExp}
                  trackId="noiseDistortion.voronoiMinkowskiExp"
                />
              )}
              <div>
                <label className="block text-xs mb-1 text-deep">Feature</label>
                <div className="flex gap-1">
                  {([['f1', 'F1'], ['f2', 'F2'], ['distance_to_edge', 'Edge']] as const).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setNoiseDistortion({ voronoiFeature: val })}
                      className={`flex-1 text-xs py-1 rounded-none ${noiseDistortion.voronoiFeature === val ? 'bg-fire text-k-text' : 'bg-k-muted hover:bg-k-muted/70 text-k-text'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <SliderField
                label="Randomness"
                min={0} max={1} step={0.01}
                value={noiseDistortion.voronoiRandomness}
                onChange={(v) => setNoiseDistortion({ voronoiRandomness: v })}
                format={(v) => v.toFixed(2)}
                defaultValue={D.voronoiRandomness}
                trackId="noiseDistortion.voronoiRandomness"
              />
            </>
          )}

          {isAeFractal && (
            <>
              <CustomSelect
                label="Fractal Type"
                value={noiseDistortion.aeFractalType ?? 'basic'}
                options={AE_FRACTAL_TYPES}
                onChange={(val) => setNoiseDistortion({ aeFractalType: val as 'basic' | 'turbulent' })}
              />
              <SliderField
                label="Sub Rotation"
                min={0} max={180} step={1}
                value={noiseDistortion.aeSubRotation ?? 45}
                onChange={(v) => setNoiseDistortion({ aeSubRotation: v })}
                format={(v) => `${v}°`}
                defaultValue={D.aeSubRotation}
                trackId="noiseDistortion.aeSubRotation"
              />
              <SliderField
                label="Sub Influence"
                min={0.01} max={1} step={0.01}
                value={noiseDistortion.aeSubInfluence ?? 0.7}
                onChange={(v) => setNoiseDistortion({ aeSubInfluence: v })}
                format={(v) => v.toFixed(2)}
                defaultValue={D.aeSubInfluence}
                trackId="noiseDistortion.aeSubInfluence"
              />
              <SliderField
                label="Sub Scaling"
                min={1.01} max={4} step={0.01}
                value={noiseDistortion.aeSubScaling ?? 1.78}
                onChange={(v) => setNoiseDistortion({ aeSubScaling: v })}
                format={(v) => v.toFixed(2)}
                defaultValue={D.aeSubScaling}
                trackId="noiseDistortion.aeSubScaling"
              />
              <SliderField
                label="Contrast"
                min={0.5} max={4} step={0.05}
                value={noiseDistortion.aeContrast ?? 1.0}
                onChange={(v) => setNoiseDistortion({ aeContrast: v })}
                format={(v) => v.toFixed(2)}
                defaultValue={D.aeContrast}
                trackId="noiseDistortion.aeContrast"
              />
              <SliderField
                label="Brightness"
                min={-1} max={1} step={0.01}
                value={noiseDistortion.aeBrightness ?? 0.0}
                onChange={(v) => setNoiseDistortion({ aeBrightness: v })}
                format={(v) => v.toFixed(2)}
                defaultValue={D.aeBrightness}
                trackId="noiseDistortion.aeBrightness"
              />
            </>
          )}

          {isRidged && (
            <>
              <SliderField
                label="Warp"
                min={0} max={4} step={0.05}
                value={noiseDistortion.ridgeWarp ?? 1.0}
                onChange={(v) => setNoiseDistortion({ ridgeWarp: v })}
                format={(v) => v.toFixed(2)}
                defaultValue={D.ridgeWarp}
                trackId="noiseDistortion.ridgeWarp"
              />
              <SliderField
                label="Sharpness"
                min={0.5} max={6} step={0.1}
                value={noiseDistortion.ridgeSharpness ?? 2.0}
                onChange={(v) => setNoiseDistortion({ ridgeSharpness: v })}
                format={(v) => v.toFixed(1)}
                defaultValue={D.ridgeSharpness}
                trackId="noiseDistortion.ridgeSharpness"
              />
              <SliderField
                label="Offset"
                min={0} max={2} step={0.05}
                value={noiseDistortion.ridgeOffset ?? 1.0}
                onChange={(v) => setNoiseDistortion({ ridgeOffset: v })}
                format={(v) => v.toFixed(2)}
                defaultValue={D.ridgeOffset}
                trackId="noiseDistortion.ridgeOffset"
              />
              <SliderField
                label="Lacunarity"
                min={1.1} max={4} step={0.05}
                value={noiseDistortion.ridgeLacunarity ?? 2.0}
                onChange={(v) => setNoiseDistortion({ ridgeLacunarity: v })}
                format={(v) => v.toFixed(2)}
                defaultValue={D.ridgeLacunarity}
                trackId="noiseDistortion.ridgeLacunarity"
              />
              <SliderField
                label="Persistence"
                min={0.1} max={1} step={0.01}
                value={noiseDistortion.ridgePersistence ?? 0.5}
                onChange={(v) => setNoiseDistortion({ ridgePersistence: v })}
                format={(v) => v.toFixed(2)}
                defaultValue={D.ridgePersistence}
                trackId="noiseDistortion.ridgePersistence"
              />
              <SliderField
                label="Cascade Gain"
                min={0} max={1} step={0.01}
                value={noiseDistortion.ridgeGain ?? 0.0}
                onChange={(v) => setNoiseDistortion({ ridgeGain: v })}
                format={(v) => v.toFixed(2)}
                defaultValue={D.ridgeGain}
                trackId="noiseDistortion.ridgeGain"
              />
            </>
          )}

          <SliderField
            label="Amount"
            min={0} max={0.5} step={0.01}
            value={noiseDistortion.amount}
            onChange={(v) => setNoiseDistortion({ amount: v })}
            format={(v) => v.toFixed(2)}
            defaultValue={D.amount}
            trackId="noiseDistortion.amount"
          />

          <SliderField
            label="Scale"
            min={0.01} max={10} step={0.01}
            value={noiseDistortion.scale}
            onChange={(v) => setNoiseDistortion({ scale: v })}
            format={(v) => v.toFixed(1)}
            defaultValue={D.scale}
            trackId="noiseDistortion.scale"
          />

          {hasOctaves && (
            <SliderField
              label="Octaves"
              min={1} max={8} step={1}
              value={noiseDistortion.octaves}
              onChange={(v) => setNoiseDistortion({ octaves: v })}
              defaultValue={D.octaves}
              trackId="noiseDistortion.octaves"
            />
          )}

          {noiseDistortion.type !== 'curl' && (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <SliderField
                  label="Seed"
                  min={0} max={100} step={0.1}
                  value={noiseDistortion.noiseSeed ?? 0}
                  onChange={(v) => setNoiseDistortion({ noiseSeed: v })}
                  format={(v) => v.toFixed(1)}
                  defaultValue={D.noiseSeed ?? 0}
                  trackId="noiseDistortion.noiseSeed"
                />
              </div>
              <button
                onClick={() => setNoiseDistortion({ noiseSeed: Math.random() * 100 })}
                className="px-2 py-1 mb-1 text-[10px] bg-k-surface hover:bg-k-muted text-k-text/80 rounded-none border border-cream/40 transition-colors shrink-0"
                title="乱数シードをランダムに変更"
              >
                Dice
              </button>
            </div>
          )}

          {noiseDistortion.type === 'curl' && (
            <>
              <SliderField
                label="Flow Steps"
                min={1} max={8} step={1}
                value={noiseDistortion.curlSteps}
                onChange={(v) => setNoiseDistortion({ curlSteps: v })}
                format={(v) => `${v}x`}
                defaultValue={D.curlSteps}
                trackId="noiseDistortion.curlSteps"
              />
              <SliderField
                label="Flow Speed"
                min={0} max={2.0} step={0.01}
                value={noiseDistortion.curlSpeed ?? 0.5}
                onChange={(v) => setNoiseDistortion({ curlSpeed: v })}
                format={(v) => v.toFixed(2)}
                defaultValue={D.curlSpeed ?? 0.5}
                trackId="noiseDistortion.curlSpeed"
              />
              <SliderField
                label="Curl Eps"
                min={0.001} max={0.2} step={0.001}
                value={noiseDistortion.curlEps ?? 0.01}
                onChange={(v) => setNoiseDistortion({ curlEps: v })}
                format={(v) => v.toFixed(3)}
                defaultValue={D.curlEps ?? 0.01}
                trackId="noiseDistortion.curlEps"
              />
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <SliderField
                    label="Curl Seed"
                    min={0} max={100} step={0.1}
                    value={noiseDistortion.curlSeed ?? 0}
                    onChange={(v) => setNoiseDistortion({ curlSeed: v })}
                    format={(v) => v.toFixed(1)}
                    defaultValue={D.curlSeed ?? 0}
                    trackId="noiseDistortion.curlSeed"
                  />
                </div>
                <button
                  onClick={() => setNoiseDistortion({ curlSeed: Math.random() * 100 })}
                  className="px-2 py-1 mb-1 text-[10px] bg-k-surface hover:bg-k-muted text-k-text/80 rounded-none border border-cream/40 transition-colors shrink-0"
                  title="乱数シードをランダムに変更"
                >
                  Dice
                </button>
              </div>
            </>
          )}

          {!isDWAnim && (
            <SliderField
              label="Evolution"
              min={0} max={10} step={0.01}
              value={noiseDistortion.evolution}
              onChange={(v) => setNoiseDistortion({ evolution: v })}
              format={(v) => v.toFixed(2)}
              defaultValue={D.evolution}
              trackId="noiseDistortion.evolution"
            />
          )}

          {isDWAnim && (
            <>
              <div className="border-t border-cream/40 pt-2">
                <p className="text-xs text-tab-inactive mb-2">Domain Warp</p>

                <SliderField
                  label="Warp Strength"
                  min={0.1} max={8} step={0.05}
                  value={noiseDistortion.dwInitAmp}
                  onChange={(v) => setNoiseDistortion({ dwInitAmp: v })}
                  format={(v) => v.toFixed(2)}
                  defaultValue={D.dwInitAmp}
                  trackId="noiseDistortion.dwInitAmp"
                />
                <SliderField
                  label="Final Mix"
                  min={0.01} max={2} step={0.01}
                  value={noiseDistortion.dwInitVal}
                  onChange={(v) => setNoiseDistortion({ dwInitVal: v })}
                  format={(v) => v.toFixed(2)}
                  defaultValue={D.dwInitVal}
                  trackId="noiseDistortion.dwInitVal"
                />
                <SliderField
                  label="Rot Angle 1"
                  min={0} max={3.14} step={0.01}
                  value={noiseDistortion.dwRotAngle1}
                  onChange={(v) => setNoiseDistortion({ dwRotAngle1: v })}
                  format={(v) => v.toFixed(2)}
                  defaultValue={D.dwRotAngle1}
                  trackId="noiseDistortion.dwRotAngle1"
                />
                <SliderField
                  label="Rot Angle 2"
                  min={0} max={3.14} step={0.01}
                  value={noiseDistortion.dwRotAngle2}
                  onChange={(v) => setNoiseDistortion({ dwRotAngle2: v })}
                  format={(v) => v.toFixed(2)}
                  defaultValue={D.dwRotAngle2}
                  trackId="noiseDistortion.dwRotAngle2"
                />
                <SliderField
                  label="Drift Angle"
                  min={0} max={360} step={1}
                  value={noiseDistortion.dwDriftAngle}
                  onChange={(v) => setNoiseDistortion({ dwDriftAngle: v })}
                  format={(v) => v + '°'}
                  defaultValue={D.dwDriftAngle}
                  trackId="noiseDistortion.dwDriftAngle"
                />
                <SliderField
                  label="Drift Speed"
                  min={0} max={0.001} step={0.00001}
                  value={noiseDistortion.dwDist1}
                  onChange={(v) => setNoiseDistortion({ dwDist1: v })}
                  format={(v) => v.toFixed(5)}
                  defaultValue={D.dwDist1}
                  trackId="noiseDistortion.dwDist1"
                />
                <SliderField
                  label="Mid Speed"
                  min={0} max={0.1} step={0.001}
                  value={noiseDistortion.dwDist2}
                  onChange={(v) => setNoiseDistortion({ dwDist2: v })}
                  format={(v) => v.toFixed(4)}
                  defaultValue={D.dwDist2}
                  trackId="noiseDistortion.dwDist2"
                />
                <SliderField
                  label="Outer Speed"
                  min={0} max={0.5} step={0.005}
                  value={noiseDistortion.dwDist3}
                  onChange={(v) => setNoiseDistortion({ dwDist3: v })}
                  format={(v) => v.toFixed(3)}
                  defaultValue={D.dwDist3}
                  trackId="noiseDistortion.dwDist3"
                />
              </div>
            </>
          )}
        </div>
      </Collapsible>
    </div>
  );
}
