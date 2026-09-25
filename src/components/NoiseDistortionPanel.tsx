import { useGradientStore } from '../store/gradientStore';
import { applicationCommands } from '../application/commands';
import { STORE_DEFAULTS } from '../store/gradientStore';
import type { NoiseDistortionConfig } from '../types/distortion';
import { SliderField } from './SliderField';
import { Collapsible } from './Collapsible';
import { Toggle } from './Toggle';
import { CustomSelect } from './CustomSelect';
import { Icon } from './Icon';
import { InputShuffle, fromNumber } from 'tweeq';
import { useLanguage } from '../i18n/LanguageProvider';
import { getNoiseSeedField } from '../lib/noiseSeed';
import { VORONOI_FEATURES, VORONOI_METRICS } from '../lib/voronoi';

const D = STORE_DEFAULTS.noiseDistortion;

const isNoiseDirty = (value: NoiseDistortionConfig) =>
  Object.keys(D).some((key) => {
    if (key === 'enabled') return false;
    const typedKey = key as keyof typeof D;
    return JSON.stringify(value[typedKey as keyof NoiseDistortionConfig]) !== JSON.stringify(D[typedKey]);
  });

// hidden: true にするとUIに表示されなくなる（コード・機能は保持される）
const NOISE_TYPES = [
  { value: 'fast_curl',        label: 'Fast Curl' },
  { value: 'curl',             label: 'Curl (Legacy)' },
  { value: 'simplex',          label: 'Simplex' },
  { value: 'fbm',              label: 'fBm' },
  { value: 'ridged_fbm',       label: 'Aura Ridges' },
  { value: 'ae_fractal',       label: 'Fractal Drift' },
  { value: 'domain_warp_anim', label: 'Domain Warp' },
  { value: 'seamless',         label: 'Seamless' },
  { value: 'voronoi',          label: 'Voronoi' },
  { value: 'caustics',         label: 'Caustics' },
  { value: 'phasor',           label: 'Phasor Lines' },
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

const NOISE_LOOP_MODES = [
  { value: 'legacy', label: 'Legacy' },
  { value: 'seamless', label: 'Seamless' },
];

const PHASOR_DIRECTION_MODES = [
  { value: 'directional', label: 'Directional' },
  { value: 'radial', label: 'Radial' },
  { value: 'swirl', label: 'Swirl' },
];

export function NoiseDistortionPanel() {
  const { t } = useLanguage();
  const { noiseDistortion } = useGradientStore();
  const { setNoiseDistortion } = applicationCommands;
  const canReset = isNoiseDirty(noiseDistortion);
  const isDWAnim = noiseDistortion.type === 'domain_warp_anim';
  const isSeamless = noiseDistortion.type === 'seamless';
  const isVoronoi = noiseDistortion.type === 'voronoi';
  const isFbm = noiseDistortion.type === 'fbm';
  const isRidged = noiseDistortion.type === 'ridged_fbm';
  const isAeFractal = noiseDistortion.type === 'ae_fractal';
  const isCurl = noiseDistortion.type === 'curl';
  const isFastCurl = noiseDistortion.type === 'fast_curl';
  const seedField = getNoiseSeedField(noiseDistortion.type);
  const seed = noiseDistortion[seedField] ?? 0;
  const isCaustics = noiseDistortion.type === 'caustics';
  const isPhasor = noiseDistortion.type === 'phasor';
  const hasOctaves = noiseDistortion.type === 'fbm' ||
                    noiseDistortion.type === 'ridged_fbm' ||
                    noiseDistortion.type === 'ae_fractal' ||
                    isCurl ||
                    isFastCurl ||
                    isCaustics ||
                    isPhasor ||
                    noiseDistortion.type === 'domain_warp_anim' ||
                    (isSeamless && (noiseDistortion.seamlessType === 'fbm' || noiseDistortion.seamlessType === 'curl'));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pr-1">
        <h2 className="font-semibold text-sm text-k-text">{t('effect.noise')}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNoiseDistortion({ ...D, enabled: noiseDistortion.enabled })}
            disabled={!canReset}
            className={`w-6 h-6 inline-flex items-center justify-center bg-transparent hover:bg-k-muted text-tab-inactive hover:text-k-text rounded-none transition-all ${
              canReset ? 'opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none'
            }`}
            title={t('common.reset')}
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

          <SliderField
            label="Amount"
            value={noiseDistortion.amount}
            onChange={(v) => setNoiseDistortion({ amount: v })}
            format={(v) => v.toFixed(2)}
            trackId="noiseDistortion.amount"
            limitKey="noise.amount"
          />

          <SliderField
            label="Scale"
            value={noiseDistortion.scale}
            onChange={(v) => setNoiseDistortion({ scale: v })}
            format={(v) => v.toFixed(isCaustics ? 2 : 1)}
            trackId="noiseDistortion.scale"
            limitKey={isCaustics ? 'noise.causticsScale' : 'noise.scale'}
          />

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <SliderField
                label="Seed"
                value={seed}
                onChange={(v) => setNoiseDistortion({ [seedField]: v })}
                format={(v) => v.toFixed(1)}
                trackId={`noiseDistortion.${seedField}`}
                limitKey="noise.seed"
              />
            </div>
            <InputShuffle
              value={seed}
              onChange={(seed) => setNoiseDistortion({ [seedField]: seed })}
              generate={fromNumber(0, 100, 0)}
              className="shrink-0"
              aria-label={t('common.shuffle')}
              title={t('common.shuffle')}
            />
          </div>

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
              value={noiseDistortion.seamlessTwist}
              onChange={(v) => setNoiseDistortion({ seamlessTwist: v })}
              format={(v) => v.toFixed(1)}
              trackId="noiseDistortion.seamlessTwist"
              limitKey="noise.seamlessTwist"
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
                  value={noiseDistortion.voronoiMinkowskiExp}
                  onChange={(v) => setNoiseDistortion({ voronoiMinkowskiExp: v })}
                  format={(v) => v.toFixed(1)}
                  trackId="noiseDistortion.voronoiMinkowskiExp"
                  limitKey="noise.voronoiMinkowskiExp"
                />
              )}
              <div>
                <label className="block text-xs mb-1 text-deep">Feature</label>
                <div className="flex gap-1">
                  {VORONOI_FEATURES.map(([val, label]) => (
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
                value={noiseDistortion.voronoiRandomness}
                onChange={(v) => setNoiseDistortion({ voronoiRandomness: v })}
                format={(v) => v.toFixed(2)}
                trackId="noiseDistortion.voronoiRandomness"
                limitKey="noise.voronoiRandomness"
              />
            </>
          )}

          {isCaustics && (
            <>
              <SliderField
                label="Depth"
                value={noiseDistortion.causticsDepth ?? D.causticsDepth}
                onChange={(v) => setNoiseDistortion({ causticsDepth: v })}
                format={(v) => v.toFixed(2)}
                trackId="noiseDistortion.causticsDepth"
                limitKey="noise.causticsDepth"
              />
              <SliderField
                label="Boundary Width"
                value={noiseDistortion.causticsBoundaryWidth ?? D.causticsBoundaryWidth}
                onChange={(v) => setNoiseDistortion({ causticsBoundaryWidth: v })}
                format={(v) => v.toFixed(2)}
                trackId="noiseDistortion.causticsBoundaryWidth"
                limitKey="noise.causticsBoundaryWidth"
              />
              <SliderField
                label="Sharpness"
                value={noiseDistortion.causticsSharpness ?? D.causticsSharpness}
                onChange={(v) => setNoiseDistortion({ causticsSharpness: v })}
                format={(v) => v.toFixed(2)}
                trackId="noiseDistortion.causticsSharpness"
                limitKey="noise.causticsSharpness"
              />
              <SliderField
                label="Complexity"
                value={noiseDistortion.causticsComplexity ?? D.causticsComplexity}
                onChange={(v) => setNoiseDistortion({ causticsComplexity: v })}
                format={(v) => `${Math.round(v)}`}
                trackId="noiseDistortion.causticsComplexity"
                limitKey="noise.causticsComplexity"
              />
              <SliderField
                label="Wave Spread"
                value={noiseDistortion.causticsWaveSpread ?? D.causticsWaveSpread}
                onChange={(v) => setNoiseDistortion({ causticsWaveSpread: v })}
                format={(v) => v.toFixed(2)}
                trackId="noiseDistortion.causticsWaveSpread"
                limitKey="noise.causticsWaveSpread"
              />
            </>
          )}

          {isPhasor && (
            <>
              <CustomSelect
                label="Direction Mode"
                value={noiseDistortion.phasorDirectionMode}
                options={PHASOR_DIRECTION_MODES}
                onChange={(val) => setNoiseDistortion({ phasorDirectionMode: val as NoiseDistortionConfig['phasorDirectionMode'] })}
              />
              <SliderField
                label="Frequency"
                value={noiseDistortion.phasorFrequency ?? D.phasorFrequency}
                onChange={(v) => setNoiseDistortion({ phasorFrequency: v })}
                format={(v) => v.toFixed(2)}
                trackId="noiseDistortion.phasorFrequency"
                limitKey="noise.phasorFrequency"
              />
              <SliderField
                label="Direction"
                value={noiseDistortion.phasorDirection ?? D.phasorDirection}
                onChange={(v) => setNoiseDistortion({ phasorDirection: v })}
                format={(v) => `${Math.round(v)}°`}
                trackId="noiseDistortion.phasorDirection"
                control="angle"
                limitKey="noise.phasorDirection"
              />
              <SliderField
                label="Direction Spread"
                value={noiseDistortion.phasorDirectionSpread ?? D.phasorDirectionSpread}
                onChange={(v) => setNoiseDistortion({ phasorDirectionSpread: v })}
                format={(v) => v.toFixed(2)}
                trackId="noiseDistortion.phasorDirectionSpread"
                limitKey="noise.phasorDirectionSpread"
              />
              <SliderField
                label="Sharpness"
                value={noiseDistortion.phasorSharpness ?? D.phasorSharpness}
                onChange={(v) => setNoiseDistortion({ phasorSharpness: v })}
                format={(v) => v.toFixed(2)}
                trackId="noiseDistortion.phasorSharpness"
                limitKey="noise.phasorSharpness"
              />
              <SliderField
                label="Warp Strength"
                value={noiseDistortion.phasorWarpStrength ?? D.phasorWarpStrength}
                onChange={(v) => setNoiseDistortion({ phasorWarpStrength: v })}
                format={(v) => v.toFixed(2)}
                trackId="noiseDistortion.phasorWarpStrength"
                limitKey="noise.phasorWarpStrength"
              />
              <SliderField
                label="Tangent Mix"
                value={noiseDistortion.phasorTangentMix ?? D.phasorTangentMix}
                onChange={(v) => setNoiseDistortion({ phasorTangentMix: v })}
                format={(v) => v.toFixed(2)}
                trackId="noiseDistortion.phasorTangentMix"
                limitKey="noise.phasorTangentMix"
              />
              <SliderField
                label="Bandwidth"
                value={noiseDistortion.phasorBandwidth ?? D.phasorBandwidth}
                onChange={(v) => setNoiseDistortion({ phasorBandwidth: v })}
                format={(v) => v.toFixed(2)}
                trackId="noiseDistortion.phasorBandwidth"
                limitKey="noise.phasorBandwidth"
              />
              <SliderField
                label="Kernel Density"
                value={noiseDistortion.phasorKernelDensity ?? D.phasorKernelDensity}
                onChange={(v) => setNoiseDistortion({ phasorKernelDensity: v })}
                format={(v) => v.toFixed(2)}
                trackId="noiseDistortion.phasorKernelDensity"
                limitKey="noise.phasorKernelDensity"
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
                value={noiseDistortion.aeSubRotation ?? 45}
                onChange={(v) => setNoiseDistortion({ aeSubRotation: v })}
                format={(v) => `${v}°`}
                trackId="noiseDistortion.aeSubRotation"
                control="angle"
                limitKey="noise.aeSubRotation"
              />
              <SliderField
                label="Sub Influence"
                value={noiseDistortion.aeSubInfluence ?? 0.7}
                onChange={(v) => setNoiseDistortion({ aeSubInfluence: v })}
                format={(v) => v.toFixed(2)}
                trackId="noiseDistortion.aeSubInfluence"
                limitKey="noise.aeSubInfluence"
              />
              <SliderField
                label="Sub Scaling"
                value={noiseDistortion.aeSubScaling ?? 1.78}
                onChange={(v) => setNoiseDistortion({ aeSubScaling: v })}
                format={(v) => v.toFixed(2)}
                trackId="noiseDistortion.aeSubScaling"
                limitKey="noise.aeSubScaling"
              />
              <SliderField
                label="Contrast"
                value={noiseDistortion.aeContrast ?? 1.0}
                onChange={(v) => setNoiseDistortion({ aeContrast: v })}
                format={(v) => v.toFixed(2)}
                trackId="noiseDistortion.aeContrast"
                limitKey="noise.aeContrast"
              />
              <SliderField
                label="Brightness"
                value={noiseDistortion.aeBrightness ?? 0.0}
                onChange={(v) => setNoiseDistortion({ aeBrightness: v })}
                format={(v) => v.toFixed(2)}
                trackId="noiseDistortion.aeBrightness"
                limitKey="noise.aeBrightness"
              />
            </>
          )}

          {isFbm && (
            <SliderField
              label="Tonality"
              value={noiseDistortion.fbmTonality ?? D.fbmTonality}
              onChange={(v) => setNoiseDistortion({ fbmTonality: v })}
              format={(v) => v.toFixed(1)}
              trackId="noiseDistortion.fbmTonality"
              limitKey="noise.fbmTonality"
            />
          )}

          {isRidged && (
            <>
              <SliderField
                label="Warp"
                value={noiseDistortion.ridgeWarp ?? 1.0}
                onChange={(v) => setNoiseDistortion({ ridgeWarp: v })}
                format={(v) => v.toFixed(2)}
                trackId="noiseDistortion.ridgeWarp"
                limitKey="noise.ridgeWarp"
              />
              <SliderField
                label="Sharpness"
                value={noiseDistortion.ridgeSharpness ?? 2.0}
                onChange={(v) => setNoiseDistortion({ ridgeSharpness: v })}
                format={(v) => v.toFixed(1)}
                trackId="noiseDistortion.ridgeSharpness"
                limitKey="noise.ridgeSharpness"
              />
              <SliderField
                label="Offset"
                value={noiseDistortion.ridgeOffset ?? 1.0}
                onChange={(v) => setNoiseDistortion({ ridgeOffset: v })}
                format={(v) => v.toFixed(2)}
                trackId="noiseDistortion.ridgeOffset"
                limitKey="noise.ridgeOffset"
              />
              <SliderField
                label="Lacunarity"
                value={noiseDistortion.ridgeLacunarity ?? 2.0}
                onChange={(v) => setNoiseDistortion({ ridgeLacunarity: v })}
                format={(v) => v.toFixed(2)}
                trackId="noiseDistortion.ridgeLacunarity"
                limitKey="noise.ridgeLacunarity"
              />
              <SliderField
                label="Persistence"
                value={noiseDistortion.ridgePersistence ?? 0.5}
                onChange={(v) => setNoiseDistortion({ ridgePersistence: v })}
                format={(v) => v.toFixed(2)}
                trackId="noiseDistortion.ridgePersistence"
                limitKey="noise.ridgePersistence"
              />
              <SliderField
                label="Cascade Gain"
                value={noiseDistortion.ridgeGain ?? 0.0}
                onChange={(v) => setNoiseDistortion({ ridgeGain: v })}
                format={(v) => v.toFixed(2)}
                trackId="noiseDistortion.ridgeGain"
                limitKey="noise.ridgeGain"
              />
            </>
          )}

          {hasOctaves && (
            <SliderField
              label="Octaves"
              value={noiseDistortion.octaves}
              onChange={(v) => setNoiseDistortion({ octaves: v })}
              trackId="noiseDistortion.octaves"
              limitKey="noise.octaves"
            />
          )}

          {(isCaustics || isPhasor) && (
            <>
              <SliderField
                label="Speed"
                value={noiseDistortion.speed ?? D.speed}
                onChange={(v) => setNoiseDistortion({ speed: v })}
                format={(v) => v.toFixed(2)}
                trackId="noiseDistortion.speed"
                limitKey="noise.speed"
              />
              <CustomSelect
                label="Loop Mode"
                value={noiseDistortion.noiseLoopMode}
                options={NOISE_LOOP_MODES}
                onChange={(val) => setNoiseDistortion({ noiseLoopMode: val as NoiseDistortionConfig['noiseLoopMode'] })}
              />
            </>
          )}

          {(isCurl || isFastCurl) && (
            <>
              <SliderField
                label="Flow Steps"
                value={noiseDistortion.curlSteps}
                onChange={(v) => setNoiseDistortion({ curlSteps: v })}
                format={(v) => `${v}x`}
                trackId="noiseDistortion.curlSteps"
                limitKey="noise.curlSteps"
              />
              <SliderField
                label={isFastCurl ? 'Flow Strength' : 'Flow Speed'}
                value={noiseDistortion.curlSpeed ?? 0.5}
                onChange={(v) => setNoiseDistortion({ curlSpeed: v })}
                format={(v) => v.toFixed(2)}
                trackId="noiseDistortion.curlSpeed"
                limitKey="noise.curlSpeed"
              />
              {isCurl && <SliderField
                label="Curl Eps"
                value={noiseDistortion.curlEps ?? 0.01}
                onChange={(v) => setNoiseDistortion({ curlEps: v })}
                format={(v) => v.toFixed(3)}
                trackId="noiseDistortion.curlEps"
                limitKey="noise.curlEps"
              />}
            </>
          )}

          {!isDWAnim && (
            <SliderField
              label="Evolution"
              value={noiseDistortion.evolution}
              onChange={(v) => setNoiseDistortion({ evolution: v })}
              format={(v) => v.toFixed(2)}
              trackId="noiseDistortion.evolution"
              limitKey="noise.evolution"
            />
          )}

          {isDWAnim && (
            <>
              <div className="border-t border-cream/40 pt-2">
                <p className="text-xs text-tab-inactive mb-2">Domain Warp</p>

                <SliderField
                  label="Warp Strength"
                  value={noiseDistortion.dwInitAmp}
                  onChange={(v) => setNoiseDistortion({ dwInitAmp: v })}
                  format={(v) => v.toFixed(2)}
                  trackId="noiseDistortion.dwInitAmp"
                  limitKey="noise.dwInitAmp"
                />
                <SliderField
                  label="Final Mix"
                  value={noiseDistortion.dwInitVal}
                  onChange={(v) => setNoiseDistortion({ dwInitVal: v })}
                  format={(v) => v.toFixed(2)}
                  trackId="noiseDistortion.dwInitVal"
                  limitKey="noise.dwInitVal"
                />
                <SliderField
                  label="Rot Angle 1"
                  value={noiseDistortion.dwRotAngle1}
                  onChange={(v) => setNoiseDistortion({ dwRotAngle1: v })}
                  format={(v) => `${Math.round(v * 180 / Math.PI)}°`}
                  trackId="noiseDistortion.dwRotAngle1"
                  control="angle"
                  limitKey="noise.dwRotAngle1"
                />
                <SliderField
                  label="Rot Angle 2"
                  value={noiseDistortion.dwRotAngle2}
                  onChange={(v) => setNoiseDistortion({ dwRotAngle2: v })}
                  format={(v) => `${Math.round(v * 180 / Math.PI)}°`}
                  trackId="noiseDistortion.dwRotAngle2"
                  control="angle"
                  limitKey="noise.dwRotAngle2"
                />
                <SliderField
                  label="Drift Angle"
                  value={noiseDistortion.dwDriftAngle}
                  onChange={(v) => setNoiseDistortion({ dwDriftAngle: v })}
                  format={(v) => v + '°'}
                  trackId="noiseDistortion.dwDriftAngle"
                  control="angle"
                  limitKey="noise.dwDriftAngle"
                />
                <SliderField
                  label="Drift Speed"
                  value={noiseDistortion.dwDist1}
                  onChange={(v) => setNoiseDistortion({ dwDist1: v })}
                  format={(v) => v.toFixed(5)}
                  trackId="noiseDistortion.dwDist1"
                  limitKey="noise.dwDist1"
                />
                <SliderField
                  label="Mid Speed"
                  value={noiseDistortion.dwDist2}
                  onChange={(v) => setNoiseDistortion({ dwDist2: v })}
                  format={(v) => v.toFixed(4)}
                  trackId="noiseDistortion.dwDist2"
                  limitKey="noise.dwDist2"
                />
                <SliderField
                  label="Outer Speed"
                  value={noiseDistortion.dwDist3}
                  onChange={(v) => setNoiseDistortion({ dwDist3: v })}
                  format={(v) => v.toFixed(3)}
                  trackId="noiseDistortion.dwDist3"
                  limitKey="noise.dwDist3"
                />
              </div>
            </>
          )}
        </div>
      </Collapsible>
    </div>
  );
}
