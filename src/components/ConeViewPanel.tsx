import { useRef, useState, useSyncExternalStore, type ChangeEvent, type ReactNode } from 'react';
import { useLanguage } from '../i18n/LanguageProvider';
import { getFieldModel, setFieldModel, subscribeFieldModel } from '../lib/fieldModelRuntime';
import type { MessageKey } from '../i18n/messages';
import { useGradientStore } from '../store/gradientStore';
import { applicationCommands } from '../application/commands';
import { InputPosition } from 'tweeq';
import { getParameterLimit } from '../lib/parameterLimits';
import {
  CAMERA_WIGGLE_PRESET_OPTIONS,
  CONE_CAMERA_MODE_OPTIONS,
  CONE_SEAM_MODE_OPTIONS,
  CONE_SHAPE_OPTIONS,
  DEFAULT_CONE_VIEW,
  DISCS_FORM_OPTIONS,
  DISCS_SPIN_PATTERN_OPTIONS,
  FIELD_GEOMETRY_OPTIONS,
  FIELD_RENDER_OPTIONS,
  LATTICE_TYPE_OPTIONS,
  RINGS_MAPPING_OPTIONS,
  RINGS_PATTERN_OPTIONS,
  THREE_D_PROJECTION_OPTIONS,
  THREE_D_SURFACE_MAPPING_OPTIONS,
  type CameraWigglePreset,
  type ConeCameraMode,
  type ConeSeamMode,
  type ConeShape,
  type ConeViewConfig,
  type DiscsForm,
  type DiscsSpinPattern,
  type FieldGeometry,
  type FieldRender,
  type LatticeType,
  type RingsMapping,
  type RingsPattern,
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
  cone: { title: 'cone.surface', description: 'cone.description', hint: 'cone.coneHint' },
  torus: { title: 'cone.torusSurface', description: 'cone.torusDescription', hint: 'cone.torusHint' },
  lattice: { title: 'cone.latticeSurface', description: 'cone.latticeDescription', hint: 'cone.latticeHint' },
  terrain: { title: 'cone.terrainSurface', description: 'cone.terrainDescription', hint: 'cone.terrainHint' },
  ribbon: { title: 'cone.ribbonSurface', description: 'cone.ribbonDescription', hint: 'cone.ribbonHint' },
  rings: { title: 'cone.ringsSurface', description: 'cone.ringsDescription', hint: 'cone.ringsHint' },
  field: { title: 'cone.fieldSurface', description: 'cone.fieldDescription', hint: 'cone.fieldHint' },
  discs: { title: 'cone.discsSurface', description: 'cone.discsDescription', hint: 'cone.discsHint' },
};

/** Serpent bends its path and Tumble scatters its frames with the same amount. */
const RINGS_AMOUNT_LABEL: Partial<Record<RingsPattern, string>> = {
  serpent: 'Curve',
  tumble: 'Scatter',
};

function toCameraPositionInput(x: number, y: number): [number, number] {
  return [x * CAMERA_POSITION_SCALE, -y * CAMERA_POSITION_SCALE];
}

function formatDegrees(value: number): string {
  return `${Math.round(value)}°`;
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-3 border border-cream/25 bg-k-surface/35 p-3">
      <span className={`block w-fit font-display text-[9px] font-semibold uppercase tracking-[0.14em] text-cream/60${hint ? ' hint-label' : ''}`} title={hint}>{title}</span>
      {children}
    </div>
  );
}

type SetConeView = (value: Partial<ConeViewConfig>) => void;

/** Loads a .glb as the Geometry Field model; the model stays runtime-only. */
function FieldModelLoader({ setConeView }: { setConeView: SetConeView }) {
  const { t } = useLanguage();
  const model = useSyncExternalStore(subscribeFieldModel, getFieldModel, getFieldModel);
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      // The glTF loader is only fetched when a model is actually loaded.
      const { loadFieldModelFile } = await import('../lib/loadFieldModel');
      await loadFieldModelFile(file);
      setConeView({ fieldGeometry: 'model' });
    } catch (cause) {
      console.error('Geometry Field model load failed:', cause);
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1.5 border border-cream/20 bg-k-bg/30 px-2.5 py-2" data-field-model-loader>
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-[9px] font-semibold uppercase tracking-[0.12em] text-cream/70">Model</span>
        <div className="flex items-center gap-2">
          {model && (
            <button
              type="button"
              onClick={() => setFieldModel(null)}
              className="px-2 py-0.5 text-[10px] text-red-400 transition-colors hover:text-red-300 bg-red-900/30 hover:bg-red-900/50"
            >
              {t('cone.fieldModelClear')}
            </button>
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="px-2 py-0.5 text-[10px] text-cream transition-all hover:text-k-text bg-cream/10 hover:bg-cream/20 disabled:opacity-50"
          >
            {loading ? t('cone.fieldModelLoading') : t('cone.fieldModelLoad')}
          </button>
          <input ref={inputRef} type="file" accept=".glb,model/gltf-binary" onChange={handleChange} className="hidden" />
        </div>
      </div>
      <p className="truncate text-[9px] leading-relaxed text-cream/55">
        {model
          ? t('cone.fieldModelStatus', { name: model.name, count: model.triangleCount.toLocaleString() })
          : t('cone.fieldModelEmpty')}
      </p>
      {error && <p className="text-[9px] leading-relaxed text-red-300">{t('cone.fieldModelFailed', { reason: error })}</p>}
    </div>
  );
}

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
    const integer = (value: number) => `${Math.round(value)}`;
    return (
      <>
        <SliderField
          label="Ribbons"
          value={coneView.ribbonCount}
          limitKey="cone.ribbonCount"
          format={integer}
          onChange={(ribbonCount) => setConeView({ ribbonCount })}
        />
        <SliderField
          label="Radius"
          value={coneView.ribbonRadius}
          limitKey="cone.ribbonRadius"
          onChange={(ribbonRadius) => setConeView({ ribbonRadius })}
        />
        <SliderField
          label="Width"
          value={coneView.ribbonWidth}
          limitKey="cone.ribbonWidth"
          onChange={(ribbonWidth) => setConeView({ ribbonWidth })}
        />
        <SliderField
          label="Stagger"
          value={coneView.ribbonStagger}
          limitKey="cone.ribbonStagger"
          format={(value) => `${Math.round(value * 100)}%`}
          onChange={(ribbonStagger) => setConeView({ ribbonStagger })}
        />
        <SliderField
          label="Loop Length"
          value={coneView.ribbonLength}
          limitKey="cone.ribbonLength"
          onChange={(ribbonLength) => setConeView({ ribbonLength })}
        />
        <SliderField
          label="Twist"
          value={coneView.ribbonTwist}
          limitKey="cone.ribbonTwist"
          format={integer}
          onChange={(ribbonTwist) => setConeView({ ribbonTwist })}
        />
        <SliderField
          label="Band Twist"
          value={coneView.ribbonHalfTwists}
          limitKey="cone.ribbonHalfTwists"
          format={integer}
          onChange={(ribbonHalfTwists) => setConeView({ ribbonHalfTwists })}
        />
        <SliderField
          label="Spin"
          value={coneView.spin}
          limitKey="cone.spin"
          format={integer}
          onChange={(spin) => setConeView({ spin })}
        />
        <SliderField
          label="Ring Repeat"
          value={coneView.ringRepeat}
          limitKey="cone.ringRepeat"
          onChange={(ringRepeat) => setConeView({ ringRepeat })}
        />
      </>
    );
  }
  if (coneView.shape === 'rings') {
    const amountLabel = RINGS_AMOUNT_LABEL[coneView.ringsPattern];
    return (
      <>
        <CustomSelect
          label="Pattern"
          value={coneView.ringsPattern}
          localizeLabel={false}
          localizeOptions={false}
          options={[...RINGS_PATTERN_OPTIONS]}
          onChange={(ringsPattern) => setConeView({ ringsPattern: ringsPattern as RingsPattern })}
        />
        {amountLabel && (
          <SliderField
            label={amountLabel}
            value={coneView.ringsAmount}
            limitKey="cone.ringsAmount"
            format={(value) => `${Math.round(value * 100)}%`}
            onChange={(ringsAmount) => setConeView({ ringsAmount })}
          />
        )}
        <CustomSelect
          label="Ring Mapping"
          value={coneView.ringsMapping}
          localizeLabel={false}
          localizeOptions={false}
          options={[...RINGS_MAPPING_OPTIONS]}
          onChange={(ringsMapping) => setConeView({ ringsMapping: ringsMapping as RingsMapping })}
        />
        <SliderField
          label="Rings per Tile"
          value={coneView.ringsPerTile}
          limitKey="cone.ringsPerTile"
          format={(value) => `${Math.round(value)}`}
          onChange={(ringsPerTile) => setConeView({ ringsPerTile })}
        />
        <SliderField
          label="Spacing"
          value={coneView.ringsSpacing}
          limitKey="cone.ringsSpacing"
          onChange={(ringsSpacing) => setConeView({ ringsSpacing })}
        />
        <SliderField
          label="Thickness"
          value={coneView.ringsThickness}
          limitKey="cone.ringsThickness"
          format={(value) => `${Math.round(value * 100)}%`}
          onChange={(ringsThickness) => setConeView({ ringsThickness })}
        />
        <SliderField
          label="Frame Depth"
          value={coneView.ringsDepth}
          limitKey="cone.ringsDepth"
          onChange={(ringsDepth) => setConeView({ ringsDepth })}
        />
        <SliderField
          label="Twist"
          value={coneView.ringsTwist}
          limitKey="cone.ringsTwist"
          format={(value) => `${value > 0 ? '+' : ''}${value.toFixed(1)}°`}
          onChange={(ringsTwist) => setConeView({ ringsTwist })}
        />
        <SliderField
          label="Spin"
          value={coneView.spin}
          limitKey="cone.spin"
          format={(value) => `${Math.round(value)}`}
          onChange={(spin) => setConeView({ spin })}
        />
        <SliderField
          label="Pulse"
          value={coneView.ringsPulse}
          limitKey="cone.ringsPulse"
          format={(value) => `${Math.round(value * 100)}%`}
          onChange={(ringsPulse) => setConeView({ ringsPulse })}
        />
        <SliderField
          label="Beats"
          value={coneView.ringsBeats}
          limitKey="cone.ringsBeats"
          disabled={coneView.ringsPulse === 0}
          format={(value) => `${Math.round(value)}`}
          onChange={(ringsBeats) => setConeView({ ringsBeats })}
        />
      </>
    );
  }
  if (coneView.shape === 'field') {
    const percent = (value: number) => `${Math.round(value * 100)}%`;
    return (
      <>
        <CustomSelect
          label="Geometry"
          value={coneView.fieldGeometry}
          localizeLabel={false}
          localizeOptions={false}
          options={[...FIELD_GEOMETRY_OPTIONS]}
          onChange={(fieldGeometry) => setConeView({ fieldGeometry: fieldGeometry as FieldGeometry })}
        />
        <FieldModelLoader setConeView={setConeView} />
        <CustomSelect
          label="Render"
          value={coneView.fieldRender}
          localizeLabel={false}
          localizeOptions={false}
          options={[...FIELD_RENDER_OPTIONS]}
          onChange={(fieldRender) => setConeView({ fieldRender: fieldRender as FieldRender })}
        />
        <SliderField
          label="Wire Width"
          value={coneView.fieldWire}
          limitKey="cone.fieldWire"
          disabled={coneView.fieldRender === 'solid'}
          format={(value) => value.toFixed(3)}
          onChange={(fieldWire) => setConeView({ fieldWire })}
        />
        <SliderField
          label="Loop Length"
          value={coneView.fieldLoopCells}
          limitKey="cone.fieldLoopCells"
          format={(value) => `${Math.round(value)}`}
          onChange={(fieldLoopCells) => setConeView({ fieldLoopCells })}
        />
        <SliderField
          label="Density"
          value={coneView.fieldDensity}
          limitKey="cone.fieldDensity"
          format={percent}
          onChange={(fieldDensity) => setConeView({ fieldDensity })}
        />
        <SliderField
          label="Size"
          value={coneView.fieldSize}
          limitKey="cone.fieldSize"
          format={percent}
          onChange={(fieldSize) => setConeView({ fieldSize })}
        />
        <SliderField
          label="Clearance"
          value={coneView.fieldClearance}
          limitKey="cone.fieldClearance"
          onChange={(fieldClearance) => setConeView({ fieldClearance })}
        />
        <SliderField
          label="Spread"
          value={coneView.fieldSpread}
          limitKey="cone.fieldSpread"
          onChange={(fieldSpread) => setConeView({ fieldSpread })}
        />
        <SliderField
          label="Arms"
          value={coneView.fieldArms}
          limitKey="cone.fieldArms"
          format={(value) => (Math.round(value) === 0 ? 'Off' : `${Math.round(value)}`)}
          onChange={(fieldArms) => setConeView({ fieldArms })}
        />
        <SliderField
          label="Twist"
          value={coneView.fieldTwist}
          limitKey="cone.fieldTwist"
          disabled={coneView.fieldArms === 0}
          format={(value) => `${Math.round(value)}`}
          onChange={(fieldTwist) => setConeView({ fieldTwist })}
        />
        <SliderField
          label="Arm Width"
          value={coneView.fieldArmWidth}
          limitKey="cone.fieldArmWidth"
          disabled={coneView.fieldArms === 0}
          format={percent}
          onChange={(fieldArmWidth) => setConeView({ fieldArmWidth })}
        />
        <SliderField
          label="Spin"
          value={coneView.spin}
          limitKey="cone.spin"
          format={(value) => `${Math.round(value)}`}
          onChange={(spin) => setConeView({ spin })}
        />
        <SliderField
          label="Variation"
          value={coneView.fieldVariation}
          limitKey="cone.fieldVariation"
          format={percent}
          onChange={(fieldVariation) => setConeView({ fieldVariation })}
        />
      </>
    );
  }
  if (coneView.shape === 'discs') {
    const integer = (value: number) => `${Math.round(value)}`;
    const percent = (value: number) => `${Math.round(value * 100)}%`;
    return (
      <>
        <CustomSelect
          label="Form"
          value={coneView.discsForm}
          localizeLabel={false}
          localizeOptions={false}
          options={[...DISCS_FORM_OPTIONS]}
          onChange={(discsForm) => setConeView({ discsForm: discsForm as DiscsForm })}
        />
        <SliderField
          label="Rings"
          value={coneView.discsCount}
          limitKey="cone.discsCount"
          format={integer}
          onChange={(discsCount) => setConeView({ discsCount })}
        />
        <SliderField
          label="Gap"
          value={coneView.discsGap}
          limitKey="cone.discsGap"
          format={percent}
          onChange={(discsGap) => setConeView({ discsGap })}
        />
        <SliderField
          label="Thickness"
          value={coneView.discsThickness}
          limitKey="cone.discsThickness"
          onChange={(discsThickness) => setConeView({ discsThickness })}
        />
        <SliderField
          label="Z Spread"
          value={coneView.discsSpread}
          limitKey="cone.discsSpread"
          onChange={(discsSpread) => setConeView({ discsSpread })}
        />
        <SliderField
          label="Waves"
          value={coneView.discsWaves}
          limitKey="cone.discsWaves"
          format={(value) => value.toFixed(2)}
          onChange={(discsWaves) => setConeView({ discsWaves })}
        />
        <SliderField
          label="Scatter"
          value={coneView.discsScatter}
          limitKey="cone.discsScatter"
          format={percent}
          onChange={(discsScatter) => setConeView({ discsScatter })}
        />
        <CustomSelect
          label="Spin Pattern"
          value={coneView.discsSpinPattern}
          localizeLabel={false}
          localizeOptions={false}
          options={[...DISCS_SPIN_PATTERN_OPTIONS]}
          onChange={(discsSpinPattern) => setConeView({ discsSpinPattern: discsSpinPattern as DiscsSpinPattern })}
        />
        <SliderField
          label="Spin"
          value={coneView.discsSpin}
          limitKey="cone.discsSpin"
          format={integer}
          onChange={(discsSpin) => setConeView({ discsSpin })}
        />
        <SliderField
          label="Twist"
          value={coneView.discsTwist}
          limitKey="cone.discsTwist"
          format={(value) => `${value > 0 ? '+' : ''}${value.toFixed(1)}°`}
          onChange={(discsTwist) => setConeView({ discsTwist })}
        />
        <SliderField
          label="Offset"
          value={coneView.discsOffset}
          limitKey="cone.discsOffset"
          format={percent}
          onChange={(discsOffset) => setConeView({ discsOffset })}
        />
        <SliderField
          label="Tilt"
          value={coneView.discsTilt}
          limitKey="cone.discsTilt"
          format={formatDegrees}
          onChange={(discsTilt) => setConeView({ discsTilt })}
        />
        <SliderField
          label="Tilt Turns"
          value={coneView.discsTiltTurns}
          limitKey="cone.discsTiltTurns"
          disabled={coneView.discsTilt === 0}
          format={integer}
          onChange={(discsTiltTurns) => setConeView({ discsTiltTurns })}
        />
        <SliderField
          label="View Angle"
          value={coneView.discsView}
          limitKey="cone.discsView"
          format={formatDegrees}
          onChange={(discsView) => setConeView({ discsView })}
        />
        <SliderField
          label="Orbit"
          value={coneView.discsOrbit}
          limitKey="cone.discsOrbit"
          format={integer}
          onChange={(discsOrbit) => setConeView({ discsOrbit })}
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
      <SliderField
        label="Twist"
        value={coneView.coneTwist}
        limitKey="cone.coneTwist"
        format={(value) => value.toFixed(2)}
        onChange={(coneTwist) => setConeView({ coneTwist })}
      />
      <CustomSelect
        label="Camera Mode"
        value={coneView.coneCameraMode}
        localizeLabel={false}
        localizeOptions={false}
        options={[...CONE_CAMERA_MODE_OPTIONS]}
        onChange={(coneCameraMode) => setConeView({ coneCameraMode: coneCameraMode as ConeCameraMode })}
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
      {/* The Cone keeps Rotation as its texture rotation in the Shape section. */}
      {coneView.shape !== 'cone' && (
        <SliderField
          label="Camera Roll"
          value={coneView.rotation}
          limitKey="cone.rotation"
          control="angle"
          format={formatDegrees}
          onChange={(rotation) => setConeView({ rotation })}
        />
      )}
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
  // The classic Cone camera is fixed, so it has no Camera section.
  const showCamera = !isCone || coneView.coneCameraMode === 'free';
  const shapeText = SHAPE_TEXT[coneView.shape];

  return (
    <div className="space-y-3 text-[11px]" data-cone-view-panel>
      <Section title="Shape" hint={[t(shapeText.description), shapeText.hint && t(shapeText.hint), isCone && t('cone.unlit')].filter(Boolean).join('\n')}>
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
              <span className="block font-display text-[9px] font-semibold uppercase tracking-[0.12em] text-cyan-100 hint-label" title={t('cone.apexHint')}>{t('cone.apexPosition')}</span>
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

      {showCamera && (
        <Section title="Camera">
          <CameraControls coneView={coneView} setConeView={setConeView} resetLabel={t('cone.resetPosition')} />
        </Section>
      )}

      <Section
        title="Texture & Motion"
        hint={[
          coneView.mappingMode === 'projection'
            ? 'Direct Projection keeps the processed 2D frame fixed on the surface and does not advance Flow Cycles.'
            : t('cone.flowHint'),
          t('cone.seamHint'),
        ].join('\n')}
      >
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

    </div>
  );
}
