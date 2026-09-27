import { useLanguage } from '../i18n/LanguageProvider';
import { useGradientStore } from '../store/gradientStore';
import { applicationCommands } from '../application/commands';
import { InputPosition } from 'tweeq';
import { getParameterLimit } from '../lib/parameterLimits';
import {
  CONE_SEAM_MODE_OPTIONS,
  DEFAULT_CONE_VIEW,
  TORUS_WIGGLE_PRESET_OPTIONS,
  type ConeSeamMode,
  type ConeShape,
  type TorusWigglePreset,
} from '../types/coneView';
import { CustomSelect } from './CustomSelect';
import { SliderField } from './SliderField';

// Tweeq's InputPosition adds pointer pixels to the value and grows Y downward.
// Edit the offset in hundredths of a tube radius with Y flipped so a drag
// moves the camera the same way on screen.
const CAMERA_POSITION_SCALE = 100;
const CAMERA_X_LIMIT = getParameterLimit('cone.torusCameraX');
const CAMERA_Y_LIMIT = getParameterLimit('cone.torusCameraY');

function toCameraPositionInput(x: number, y: number): [number, number] {
  return [x * CAMERA_POSITION_SCALE, -y * CAMERA_POSITION_SCALE];
}

export function ConeViewPanel() {
  const { t } = useLanguage();
  const { coneView } = useGradientStore();
  const { setConeView } = applicationCommands;
  const isTorus = coneView.shape === 'torus';

  return (
    <div className="space-y-3 text-[11px]" data-cone-view-panel>
      <div className="border border-cyan-200/25 bg-cyan-300/[0.04] p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="font-display text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
            {t(isTorus ? 'cone.torusSurface' : 'cone.surface')}
          </span>
          <span className="border border-cyan-200/25 bg-k-bg/45 px-2 py-1 font-display text-[8px] font-bold uppercase tracking-[0.13em] text-cyan-100/75">
            {t('cone.unlit')}
          </span>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-cream/65">{t(isTorus ? 'cone.torusDescription' : 'cone.description')}</p>
      </div>

      <div className="space-y-3 border border-cream/25 bg-k-surface/35 p-3">
        <CustomSelect
          label="Shape"
          value={coneView.shape}
          localizeLabel={false}
          localizeOptions={false}
          options={[
            { value: 'cone', label: 'Cone' },
            { value: 'torus', label: 'Torus · Tunnel' },
          ]}
          onChange={(shape) => setConeView({ shape: shape as ConeShape })}
        />
        <CustomSelect
          label="Mapping"
          value={coneView.mappingMode}
          localizeOptions={false}
          options={[
            { value: 'flow', label: 'Flow · Apex → Opening' },
            { value: 'projection', label: 'Direct Projection · Fixed' },
          ]}
          onChange={(mappingMode) => setConeView({ mappingMode: mappingMode as 'flow' | 'projection' })}
        />
        {isTorus ? (
          <>
            <SliderField
              label="Bend"
              value={coneView.torusBend}
              limitKey="cone.torusBend"
              onChange={(torusBend) => setConeView({ torusBend })}
            />
            <SliderField
              label="Ring Repeat"
              value={coneView.torusRingRepeat}
              limitKey="cone.torusRingRepeat"
              onChange={(torusRingRepeat) => setConeView({ torusRingRepeat })}
            />
          </>
        ) : (
          <SliderField
            label="Depth"
            value={coneView.depth}
            limitKey="cone.depth"
            onChange={(depth) => setConeView({ depth })}
          />
        )}
        <SliderField
          label={isTorus ? 'Camera Roll' : 'Rotation'}
          value={coneView.rotation}
          limitKey="cone.rotation"
          control="angle"
          format={(value) => `${Math.round(value)}°`}
          onChange={(rotation) => setConeView({ rotation })}
        />
        {isTorus && (
          <>
            <SliderField
              label="Camera Yaw"
              value={coneView.torusCameraYaw}
              limitKey="cone.torusCameraYaw"
              control="angle"
              format={(value) => `${Math.round(value)}°`}
              onChange={(torusCameraYaw) => setConeView({ torusCameraYaw })}
            />
            <SliderField
              label="Camera Pitch"
              value={coneView.torusCameraPitch}
              limitKey="cone.torusCameraPitch"
              control="angle"
              format={(value) => `${Math.round(value)}°`}
              onChange={(torusCameraPitch) => setConeView({ torusCameraPitch })}
            />
            <div className="space-y-1" data-torus-camera-position>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-deep">Camera Position</span>
                <button
                  type="button"
                  className="text-[9px] text-cream/55 transition-colors hover:text-fire disabled:opacity-0"
                  disabled={coneView.torusCameraX === DEFAULT_CONE_VIEW.torusCameraX && coneView.torusCameraY === DEFAULT_CONE_VIEW.torusCameraY}
                  onClick={() => setConeView({ torusCameraX: DEFAULT_CONE_VIEW.torusCameraX, torusCameraY: DEFAULT_CONE_VIEW.torusCameraY })}
                >
                  {t('cone.resetPosition')}
                </button>
              </div>
              <InputPosition
                value={toCameraPositionInput(coneView.torusCameraX, coneView.torusCameraY)}
                min={toCameraPositionInput(CAMERA_X_LIMIT.min, CAMERA_Y_LIMIT.max)}
                max={toCameraPositionInput(CAMERA_X_LIMIT.max, CAMERA_Y_LIMIT.min)}
                step={1}
                onChange={([x, y]) => setConeView({
                  torusCameraX: x / CAMERA_POSITION_SCALE,
                  torusCameraY: -y / CAMERA_POSITION_SCALE,
                })}
              />
            </div>
            <CustomSelect
              label="Camera Wiggle"
              value={coneView.torusWigglePreset}
              localizeLabel={false}
              localizeOptions={false}
              options={[...TORUS_WIGGLE_PRESET_OPTIONS]}
              onChange={(torusWigglePreset) => setConeView({ torusWigglePreset: torusWigglePreset as TorusWigglePreset })}
            />
            <SliderField
              label="Wiggle Amount"
              value={coneView.torusWiggleAmount}
              limitKey="cone.torusWiggleAmount"
              disabled={coneView.torusWigglePreset === 'off'}
              format={(value) => `${Math.round(value * 100)}%`}
              onChange={(torusWiggleAmount) => setConeView({ torusWiggleAmount })}
            />
            <SliderField
              label="Wiggle Speed"
              value={coneView.torusWiggleSpeed}
              limitKey="cone.torusWiggleSpeed"
              disabled={coneView.torusWigglePreset === 'off'}
              format={(value) => `×${Math.round(value)}`}
              onChange={(torusWiggleSpeed) => setConeView({ torusWiggleSpeed })}
            />
          </>
        )}
        {!isTorus && (
        <div className="flex items-center justify-between gap-3 border border-cyan-200/20 bg-cyan-300/[0.04] px-2.5 py-2">
          <div className="min-w-0">
            <span className="block font-display text-[9px] font-semibold uppercase tracking-[0.12em] text-cyan-100">{t('cone.apexPosition')}</span>
            <span className="mt-1 block text-[9px] text-cream/55">{t('cone.apexHint')}</span>
          </div>
          <button
            type="button"
            className="shrink-0 border border-cream/25 px-2 py-1 font-display text-[9px] font-semibold uppercase tracking-[0.08em] text-cream/75 transition-colors hover:border-fire/60 hover:bg-fire/10 hover:text-fire focus:outline-none focus-visible:ring-2 focus-visible:ring-fire"
            onClick={() => setConeView({ apexX: DEFAULT_CONE_VIEW.apexX, apexY: DEFAULT_CONE_VIEW.apexY })}
          >
            {t('cone.resetPosition')}
          </button>
        </div>
        )}
        <SliderField
          label="Texture Repeat"
          value={coneView.textureRepeat}
          limitKey="cone.textureRepeat"
          onChange={(textureRepeat) => setConeView({ textureRepeat })}
        />
        <CustomSelect
          label="Seam Mode"
          value={coneView.seamMode}
          localizeLabel={false}
          localizeOptions={false}
          options={[...CONE_SEAM_MODE_OPTIONS]}
          onChange={(seamMode) => setConeView({ seamMode: seamMode as ConeSeamMode })}
        />
        <SliderField
          label="Seam Blend"
          value={coneView.seamBlend}
          limitKey="cone.seamBlend"
          format={(value) => `${Math.round(value * 100)}%`}
          onChange={(seamBlend) => setConeView({ seamBlend })}
        />
        <SliderField
          label="Flow Cycles"
          value={coneView.flowCycles}
          limitKey="cone.flowCycles"
          disabled={coneView.mappingMode === 'projection'}
          onChange={(flowCycles) => setConeView({ flowCycles })}
        />
      </div>

      <p className="px-1 text-[9px] leading-relaxed text-cream/55">
        {coneView.mappingMode === 'projection'
          ? 'Direct Projection keeps the processed 2D frame fixed on the cone and does not advance Flow Cycles.'
          : t('cone.flowHint')}
      </p>
      {isTorus && <p className="px-1 text-[9px] leading-relaxed text-cream/55">{t('cone.torusHint')}</p>}
      <p className="px-1 text-[9px] leading-relaxed text-cream/55">{t('cone.seamHint')}</p>
    </div>
  );
}
