import type { ReactNode } from 'react';
import { useLanguage } from '../i18n/LanguageProvider';
import type { MessageKey } from '../i18n/messages';
import { useGradientStore } from '../store/gradientStore';
import { applicationCommands } from '../application/commands';
import { InputPosition } from 'tweeq';
import { getParameterLimit } from '../lib/parameterLimits';
import {
  CAMERA_WIGGLE_PRESET_OPTIONS,
  CONE_SEAM_MODE_OPTIONS,
  CONE_SHAPE_OPTIONS,
  DEFAULT_CONE_VIEW,
  LATTICE_TYPE_OPTIONS,
  THREE_D_PROJECTION_OPTIONS,
  THREE_D_SURFACE_MAPPING_OPTIONS,
  type CameraWigglePreset,
  type ConeSeamMode,
  type ConeShape,
  type ConeViewConfig,
  type LatticeType,
  type ThreeDProjection,
  type ThreeDSurfaceMapping,
} from '../types/coneView';
import { CustomSelect } from './CustomSelect';
import { SliderField } from './SliderField';

// Tweeq's InputPosition adds pointer pixels to the value and grows Y downward.
// Edit the offset in hundredths with Y flipped so a drag moves the camera the
// same way on screen.
const CAMERA_POSITION_SCALE = 100;
const CAMERA_X_LIMIT = getParameterLimit('cone.cameraX');
const CAMERA_Y_LIMIT = getParameterLimit('cone.cameraY');

const SHAPE_TEXT: Record<ConeShape, { title: MessageKey; description: MessageKey; hint?: MessageKey }> = {
  cone: { title: 'cone.surface', description: 'cone.description' },
  torus: { title: 'cone.torusSurface', description: 'cone.torusDescription', hint: 'cone.torusHint' },
  lattice: { title: 'cone.latticeSurface', description: 'cone.latticeDescription', hint: 'cone.latticeHint' },
  terrain: { title: 'cone.terrainSurface', description: 'cone.terrainDescription', hint: 'cone.terrainHint' },
  extrusion: { title: 'cone.extrusionSurface', description: 'cone.extrusionDescription', hint: 'cone.extrusionHint' },
  ribbon: { title: 'cone.ribbonSurface', description: 'cone.ribbonDescription', hint: 'cone.ribbonHint' },
};

function toCameraPositionInput(x: number, y: number): [number, number] {
  return [x * CAMERA_POSITION_SCALE, -y * CAMERA_POSITION_SCALE];
}

function formatDegrees(value: number): string {
  return `${Math.round(value)}°`;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3 border border-cream/25 bg-k-surface/35 p-3">
      <span className="block font-display text-[9px] font-semibold uppercase tracking-[0.14em] text-cream/60">{title}</span>
      {children}
    </div>
  );
}

type SetConeView = (value: Partial<ConeViewConfig>) => void;

function ShapeControls({ coneView, setConeView }: { coneView: ConeViewConfig; setConeView: SetConeView }) {
  if (coneView.shape === 'lattice') {
    return (
      <>
        <CustomSelect
          label="Lattice"
          value={coneView.latticeType}
          localizeLabel={false}
          localizeOptions={false}
          options={[...LATTICE_TYPE_OPTIONS]}
          onChange={(latticeType) => setConeView({ latticeType: latticeType as LatticeType })}
        />
        <SliderField
          label="Scale"
          value={coneView.latticeScale}
          limitKey="cone.latticeScale"
          onChange={(latticeScale) => setConeView({ latticeScale })}
        />
        <SliderField
          label="Thickness"
          value={coneView.latticeThickness}
          limitKey="cone.latticeThickness"
          onChange={(latticeThickness) => setConeView({ latticeThickness })}
        />
      </>
    );
  }
  if (coneView.shape === 'ribbon') {
    return (
      <>
        <SliderField
          label="Half Twists"
          value={coneView.ribbonHalfTwists}
          limitKey="cone.ribbonHalfTwists"
          format={(value) => `${Math.round(value)}`}
          onChange={(ribbonHalfTwists) => setConeView({ ribbonHalfTwists })}
        />
        <SliderField
          label="Width"
          value={coneView.ribbonWidth}
          limitKey="cone.ribbonWidth"
          onChange={(ribbonWidth) => setConeView({ ribbonWidth })}
        />
        <SliderField
          label="Ring Repeat"
          value={coneView.ringRepeat}
          limitKey="cone.ringRepeat"
          onChange={(ringRepeat) => setConeView({ ringRepeat })}
        />
        <SliderField
          label="Spin"
          value={coneView.spin}
          limitKey="cone.spin"
          format={(value) => `${Math.round(value)}`}
          onChange={(spin) => setConeView({ spin })}
        />
        <SliderField
          label="Distance"
          value={coneView.depth}
          limitKey="cone.depth"
          onChange={(depth) => setConeView({ depth })}
        />
      </>
    );
  }
  if (coneView.shape === 'terrain') {
    return (
      <>
        <SliderField
          label="Height"
          value={coneView.terrainHeight}
          limitKey="cone.terrainHeight"
          onChange={(terrainHeight) => setConeView({ terrainHeight })}
        />
        <SliderField
          label="Altitude"
          value={coneView.terrainAltitude}
          limitKey="cone.terrainAltitude"
          onChange={(terrainAltitude) => setConeView({ terrainAltitude })}
        />
      </>
    );
  }
  if (coneView.shape === 'torus') {
    return (
      <>
        <SliderField
          label="Bend"
          value={coneView.torusBend}
          limitKey="cone.torusBend"
          onChange={(torusBend) => setConeView({ torusBend })}
        />
        <SliderField
          label="Ring Repeat"
          value={coneView.ringRepeat}
          limitKey="cone.ringRepeat"
          onChange={(ringRepeat) => setConeView({ ringRepeat })}
        />
        <SliderField
          label="Twist"
          value={coneView.torusTwist}
          limitKey="cone.torusTwist"
          format={(value) => value.toFixed(2)}
          onChange={(torusTwist) => setConeView({ torusTwist })}
        />
        <SliderField
          label="Spin"
          value={coneView.spin}
          limitKey="cone.spin"
          format={(value) => `${Math.round(value)}`}
          onChange={(spin) => setConeView({ spin })}
        />
      </>
    );
  }
  if (coneView.shape === 'extrusion') {
    return (
      <>
        <SliderField
          label="Cells"
          value={coneView.extrudeCells}
          limitKey="cone.extrudeCells"
          format={(value) => `${Math.round(value)}`}
          onChange={(extrudeCells) => setConeView({ extrudeCells })}
        />
        <SliderField
          label="Height"
          value={coneView.extrudeHeight}
          limitKey="cone.extrudeHeight"
          onChange={(extrudeHeight) => setConeView({ extrudeHeight })}
        />
        <SliderField
          label="Gap"
          value={coneView.extrudeGap}
          limitKey="cone.extrudeGap"
          format={(value) => `${Math.round(value * 100)}%`}
          onChange={(extrudeGap) => setConeView({ extrudeGap })}
        />
        <SliderField
          label="Distance"
          value={coneView.depth}
          limitKey="cone.depth"
          onChange={(depth) => setConeView({ depth })}
        />
      </>
    );
  }
  return (
    <>
      <SliderField
        label="Depth"
        value={coneView.depth}
        limitKey="cone.depth"
        onChange={(depth) => setConeView({ depth })}
      />
      <SliderField
        label="Rotation"
        value={coneView.rotation}
        limitKey="cone.rotation"
        control="angle"
        format={formatDegrees}
        onChange={(rotation) => setConeView({ rotation })}
      />
    </>
  );
}

function SurfaceControls({ coneView, setConeView }: { coneView: ConeViewConfig; setConeView: SetConeView }) {
  return (
    <>
      <CustomSelect
        label="Surface Mapping"
        value={coneView.surfaceMapping}
        localizeLabel={false}
        localizeOptions={false}
        options={[...THREE_D_SURFACE_MAPPING_OPTIONS]}
        onChange={(surfaceMapping) => setConeView({ surfaceMapping: surfaceMapping as ThreeDSurfaceMapping })}
      />
      <SliderField
        label="Shade"
        value={coneView.shade}
        limitKey="cone.shade"
        format={(value) => `${Math.round(value * 100)}%`}
        onChange={(shade) => setConeView({ shade })}
      />
      <SliderField
        label="Fog"
        value={coneView.fog}
        limitKey="cone.fog"
        format={(value) => `${Math.round(value * 100)}%`}
        onChange={(fog) => setConeView({ fog })}
      />
    </>
  );
}

function CameraControls({ coneView, setConeView, resetLabel }: { coneView: ConeViewConfig; setConeView: SetConeView; resetLabel: string }) {
  return (
    <>
      <CustomSelect
        label="Projection"
        value={coneView.projection}
        localizeLabel={false}
        localizeOptions={false}
        options={[...THREE_D_PROJECTION_OPTIONS]}
        onChange={(projection) => setConeView({ projection: projection as ThreeDProjection })}
      />
      {coneView.projection === 'perspective' && (
        <>
          <SliderField
            label="FOV"
            value={coneView.cameraFov}
            limitKey="cone.cameraFov"
            format={formatDegrees}
            onChange={(cameraFov) => setConeView({ cameraFov })}
          />
          <SliderField
            label="Lens Distortion"
            value={coneView.lensDistortion}
            limitKey="cone.lensDistortion"
            format={(value) => `${value > 0 ? '+' : ''}${Math.round(value * 100)}%`}
            onChange={(lensDistortion) => setConeView({ lensDistortion })}
          />
        </>
      )}
      {coneView.projection === 'fisheye' && (
        <SliderField
          label="Fisheye Angle"
          value={coneView.fisheyeAngle}
          limitKey="cone.fisheyeAngle"
          format={formatDegrees}
          onChange={(fisheyeAngle) => setConeView({ fisheyeAngle })}
        />
      )}
      <SliderField
        label="Dolly"
        value={coneView.cameraDolly}
        limitKey="cone.cameraDolly"
        format={(value) => `${value > 0 ? '+' : ''}${value.toFixed(2)}`}
        onChange={(cameraDolly) => setConeView({ cameraDolly })}
      />
      {coneView.shape === 'torus' && (
        <SliderField
          label="Aim Into Bend"
          value={coneView.torusAim}
          limitKey="cone.torusAim"
          format={(value) => `${Math.round(value * 100)}%`}
          onChange={(torusAim) => setConeView({ torusAim })}
        />
      )}
      <SliderField
        label="Camera Roll"
        value={coneView.rotation}
        limitKey="cone.rotation"
        control="angle"
        format={formatDegrees}
        onChange={(rotation) => setConeView({ rotation })}
      />
      <SliderField
        label="Camera Yaw"
        value={coneView.cameraYaw}
        limitKey="cone.cameraYaw"
        control="angle"
        format={formatDegrees}
        onChange={(cameraYaw) => setConeView({ cameraYaw })}
      />
      <SliderField
        label="Camera Pitch"
        value={coneView.cameraPitch}
        limitKey="cone.cameraPitch"
        control="angle"
        format={formatDegrees}
        onChange={(cameraPitch) => setConeView({ cameraPitch })}
      />
      <div className="space-y-1" data-three-d-camera-position>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-deep">Camera Position</span>
          <button
            type="button"
            className="text-[9px] text-cream/55 transition-colors hover:text-fire disabled:opacity-0"
            disabled={coneView.cameraX === DEFAULT_CONE_VIEW.cameraX && coneView.cameraY === DEFAULT_CONE_VIEW.cameraY}
            onClick={() => setConeView({ cameraX: DEFAULT_CONE_VIEW.cameraX, cameraY: DEFAULT_CONE_VIEW.cameraY })}
          >
            {resetLabel}
          </button>
        </div>
        <InputPosition
          value={toCameraPositionInput(coneView.cameraX, coneView.cameraY)}
          min={toCameraPositionInput(CAMERA_X_LIMIT.min, CAMERA_Y_LIMIT.max)}
          max={toCameraPositionInput(CAMERA_X_LIMIT.max, CAMERA_Y_LIMIT.min)}
          step={1}
          onChange={([x, y]) => setConeView({
            cameraX: x / CAMERA_POSITION_SCALE,
            cameraY: -y / CAMERA_POSITION_SCALE,
          })}
        />
      </div>
      <CustomSelect
        label="Camera Wiggle"
        value={coneView.wigglePreset}
        localizeLabel={false}
        localizeOptions={false}
        options={[...CAMERA_WIGGLE_PRESET_OPTIONS]}
        onChange={(wigglePreset) => setConeView({ wigglePreset: wigglePreset as CameraWigglePreset })}
      />
      <SliderField
        label="Wiggle Amount"
        value={coneView.wiggleAmount}
        limitKey="cone.wiggleAmount"
        disabled={coneView.wigglePreset === 'off'}
        format={(value) => `${Math.round(value * 100)}%`}
        onChange={(wiggleAmount) => setConeView({ wiggleAmount })}
      />
      <SliderField
        label="Wiggle Speed"
        value={coneView.wiggleSpeed}
        limitKey="cone.wiggleSpeed"
        disabled={coneView.wigglePreset === 'off'}
        format={(value) => `×${Math.round(value)}`}
        onChange={(wiggleSpeed) => setConeView({ wiggleSpeed })}
      />
    </>
  );
}

export function ConeViewPanel() {
  const { t } = useLanguage();
  const { coneView } = useGradientStore();
  const { setConeView } = applicationCommands;
  const isCone = coneView.shape === 'cone';
  const shapeText = SHAPE_TEXT[coneView.shape];

  return (
    <div className="space-y-3 text-[11px]" data-cone-view-panel>
      <div className="border border-cyan-200/25 bg-cyan-300/[0.04] p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="font-display text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
            {t(shapeText.title)}
          </span>
          {isCone && (
            <span className="border border-cyan-200/25 bg-k-bg/45 px-2 py-1 font-display text-[8px] font-bold uppercase tracking-[0.13em] text-cyan-100/75">
              {t('cone.unlit')}
            </span>
          )}
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-cream/65">{t(shapeText.description)}</p>
      </div>

      <Section title="Shape">
        <CustomSelect
          label="Shape"
          value={coneView.shape}
          localizeLabel={false}
          localizeOptions={false}
          options={[...CONE_SHAPE_OPTIONS]}
          onChange={(shape) => setConeView({ shape: shape as ConeShape })}
        />
        <ShapeControls coneView={coneView} setConeView={setConeView} />
        {isCone && (
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
      </Section>

      {!isCone && (
        <Section title="Surface">
          <SurfaceControls coneView={coneView} setConeView={setConeView} />
        </Section>
      )}

      {!isCone && (
        <Section title="Camera">
          <CameraControls coneView={coneView} setConeView={setConeView} resetLabel={t('cone.resetPosition')} />
        </Section>
      )}

      <Section title="Texture & Motion">
        <CustomSelect
          label="Mapping"
          value={coneView.mappingMode}
          localizeOptions={false}
          options={[
            { value: 'flow', label: 'Flow · Animated' },
            { value: 'projection', label: 'Direct Projection · Fixed' },
          ]}
          onChange={(mappingMode) => setConeView({ mappingMode: mappingMode as 'flow' | 'projection' })}
        />
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
      </Section>

      <p className="px-1 text-[9px] leading-relaxed text-cream/55">
        {coneView.mappingMode === 'projection'
          ? 'Direct Projection keeps the processed 2D frame fixed on the surface and does not advance Flow Cycles.'
          : t('cone.flowHint')}
      </p>
      {shapeText.hint && <p className="px-1 text-[9px] leading-relaxed text-cream/55">{t(shapeText.hint)}</p>}
      <p className="px-1 text-[9px] leading-relaxed text-cream/55">{t('cone.seamHint')}</p>
    </div>
  );
}
