import {
  CONE_APEX_LIMIT,
  CONE_SEAM_MODE_INDEX,
  CONE_SHAPE_INDEX,
  CRYSTAL_FORMS,
  DISCS_FORMS,
  DISCS_SPIN_PATTERNS,
  LATTICE_TYPES,
  FIELD_GEOMETRIES,
  FIELD_RENDERS,
  RINGS_MAPPINGS,
  RINGS_PATTERNS,
  THREE_D_PROJECTIONS,
  THREE_D_SURFACE_MAPPING_INDEX,
  type ConeViewConfig,
  type CrystalForm,
  type ConeSeamMode,
  type CameraWigglePreset,
} from '../types/coneView';

export const CONE_CAMERA_DISTANCE = 1.25;
export const CONE_CAMERA_FOV = 60;
export const CONE_APERTURE_OVERSCAN = 1.08;
export { CONE_APEX_LIMIT } from '../types/coneView';

export type ConeTextureTransform = {
  repeatU: number;
  offsetU: number;
  offsetV: number;
  seamBlend: number;
  seamMode: ConeSeamMode;
};

export type ConeApexOffset = {
  x: number;
  y: number;
};

export type ConeApexCanvasPoint = {
  x: number;
  y: number;
};

function safeFinite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getConeApertureRadius(
  cameraDistance: number,
  aspect: number,
  overscan = CONE_APERTURE_OVERSCAN,
): number {
  const safeDistance = Math.max(0.001, safeFinite(cameraDistance, CONE_CAMERA_DISTANCE));
  const safeAspect = Math.max(0.001, safeFinite(aspect, 1));
  const halfHeight = safeDistance * Math.tan(CONE_CAMERA_FOV * Math.PI / 360);
  const halfWidth = halfHeight * safeAspect;
  return Math.hypot(halfWidth, halfHeight) * Math.max(1, safeFinite(overscan, 1));
}

/**
 * World offset of the apex that puts it at the normalized screen point
 * (apexX, apexY) through a camera with the given vertical field of view, so
 * the apex handle stays on the apex whatever the Cone's FOV is.
 */
export function getConeApexOffset(
  cameraDistance: number,
  depth: number,
  aspect: number,
  apexX: number,
  apexY: number,
  fovDegrees = CONE_CAMERA_FOV,
): ConeApexOffset {
  const safeDistance = Math.max(0.001, safeFinite(cameraDistance, CONE_CAMERA_DISTANCE));
  const safeDepth = Math.max(0.001, safeFinite(depth, 6));
  const safeAspect = Math.max(0.001, safeFinite(aspect, 1));
  const safeFov = clamp(safeFinite(fovDegrees, CONE_CAMERA_FOV), CAMERA_FOV_MIN, CAMERA_FOV_MAX);
  const apexDistance = safeDistance + safeDepth;
  const halfHeight = apexDistance * Math.tan(safeFov * Math.PI / 360);
  const halfWidth = halfHeight * safeAspect;
  return {
    x: clamp(safeFinite(apexX, 0), -CONE_APEX_LIMIT, CONE_APEX_LIMIT) * halfWidth,
    y: clamp(safeFinite(apexY, 0), -CONE_APEX_LIMIT, CONE_APEX_LIMIT) * halfHeight,
  };
}

/** Converts the normalized apex offset into the CSS canvas coordinate system. */
export function getConeApexCanvasPoint(
  width: number,
  height: number,
  apexX: number,
  apexY: number,
): ConeApexCanvasPoint {
  const safeWidth = Math.max(1, safeFinite(width, 1));
  const safeHeight = Math.max(1, safeFinite(height, 1));
  return {
    x: safeWidth * (0.5 + clamp(safeFinite(apexX, 0), -CONE_APEX_LIMIT, CONE_APEX_LIMIT) * 0.5),
    y: safeHeight * (0.5 - clamp(safeFinite(apexY, 0), -CONE_APEX_LIMIT, CONE_APEX_LIMIT) * 0.5),
  };
}

export function getConeTextureTransform(
  config: ConeViewConfig,
  normalizedTime: number,
): ConeTextureTransform {
  const time = Number.isFinite(normalizedTime) ? Math.max(0, Math.min(1, normalizedTime)) : 0;
  const rotationTurns = config.rotation / 360;
  return {
    repeatU: config.textureRepeat,
    // Torus uses Rotation as a camera roll (see getThreeDCamera) so the
    // tunnel's bend direction can be chosen. Its texture turns around the tube
    // only through Spin, in whole turns per loop.
    offsetU: config.shape === 'torus'
      ? getTorusSpinOffset(config, time)
      : rotationTurns - Math.floor(rotationTurns),
    // Direct Projection keeps the processed 2D frame fixed on the cone.
    // Flow mode is the only mode that advances the texture from apex to opening.
    offsetV: config.mappingMode === 'projection' ? 0 : time * config.flowCycles,
    seamBlend: config.seamBlend,
    seamMode: config.seamMode,
  };
}

export function getConeShapeIndex(config: ConeViewConfig): number {
  return CONE_SHAPE_INDEX[config.shape];
}

function getTorusSpinOffset(config: ConeViewConfig, normalizedTime: number): number {
  const turns = Math.round(safeFinite(config.spin, 0)) * normalizedTime;
  return turns - Math.floor(turns);
}

/**
 * Whole texture turns around the tube over one full ring. Twist is set per
 * ring tile; rounding the ring total keeps the texture continuous where the
 * ring angle wraps.
 */
export function getTorusTwistTurns(config: ConeViewConfig): number {
  const ringRepeat = Math.max(1, Math.round(safeFinite(config.ringRepeat, 1)));
  return Math.round(safeFinite(config.torusTwist, 0) * ringRepeat);
}

/** Ring radius of the torus when its tube radius is 1. */
export function getTorusMajorRadius(config: ConeViewConfig): number {
  return 1 / Math.max(0.01, Math.min(0.95, safeFinite(config.torusBend, 0.3)));
}

export type ThreeDCamera = {
  /** Offset inside the tube cross-section in camera-right/up tube radii, before roll. */
  offsetX: number;
  offsetY: number;
  yawRadians: number;
  pitchRadians: number;
  /** Base roll (Rotation) plus the wiggle roll. */
  rollRadians: number;
  /** Perspective vertical field of view including the wiggle. */
  fovDegrees: number;
  /** Camera move along the view direction, in shape-relative units. */
  dolly: number;
};

/** Keeps the animated field of view inside a usable perspective range. */
export const CAMERA_FOV_MIN = 10;
export const CAMERA_FOV_MAX = 170;

/** Keeps the camera clear of the tube wall (radius 1) regardless of direction. */
export const CAMERA_MAX_OFFSET = 0.8;

type WiggleChannel = 'yaw' | 'pitch' | 'roll' | 'x' | 'y' | 'fov' | 'dolly';

/**
 * One sinusoid of a wiggle preset. Angles are in degrees and offsets in tube
 * radii. `harmonic` is an integer count of cycles per loop, which makes every
 * preset return to its start value at the loop boundary.
 */
type WiggleTerm = {
  channel: WiggleChannel;
  amplitude: number;
  harmonic: number;
  phase: number;
};

/**
 * A continuous rotation of an angle channel by whole turns per loop. Whole
 * turns close the loop, so Amount does not scale them; Speed multiplies them.
 */
type WiggleSpin = {
  channel: Extract<WiggleChannel, 'yaw' | 'pitch' | 'roll'>;
  turns: number;
};

const CAMERA_WIGGLE_TERMS: Record<CameraWigglePreset, readonly WiggleTerm[]> = {
  off: [],
  // A slow look-around: one wide sweep per loop with a lazy second harmonic.
  drift: [
    { channel: 'yaw', amplitude: 7, harmonic: 1, phase: 0 },
    { channel: 'yaw', amplitude: 2, harmonic: 2, phase: 0.9 },
    { channel: 'pitch', amplitude: 4, harmonic: 1, phase: 1.7 },
    { channel: 'roll', amplitude: 2, harmonic: 1, phase: 2.6 },
  ],
  // Small incommensurate-looking but integer harmonics read as hand shake.
  handheld: [
    { channel: 'yaw', amplitude: 1.1, harmonic: 5, phase: 0.3 },
    { channel: 'yaw', amplitude: 0.6, harmonic: 13, phase: 2.1 },
    { channel: 'pitch', amplitude: 0.9, harmonic: 7, phase: 1.2 },
    { channel: 'pitch', amplitude: 0.5, harmonic: 17, phase: 0.4 },
    { channel: 'roll', amplitude: 0.8, harmonic: 4, phase: 2.8 },
    { channel: 'roll', amplitude: 0.4, harmonic: 11, phase: 1.5 },
    { channel: 'x', amplitude: 0.02, harmonic: 9, phase: 0.7 },
    { channel: 'y', amplitude: 0.02, harmonic: 8, phase: 2.4 },
  ],
  // The camera bobs on a figure-eight inside the tube.
  float: [
    { channel: 'x', amplitude: 0.22, harmonic: 1, phase: 0 },
    { channel: 'y', amplitude: 0.16, harmonic: 2, phase: 0 },
    { channel: 'roll', amplitude: 4, harmonic: 1, phase: Math.PI / 2 },
    { channel: 'pitch', amplitude: 2, harmonic: 2, phase: Math.PI / 2 },
  ],
  // The camera circles the tube center line once per loop.
  orbit: [
    { channel: 'x', amplitude: 0.35, harmonic: 1, phase: Math.PI / 2 },
    { channel: 'y', amplitude: 0.35, harmonic: 1, phase: 0 },
    { channel: 'roll', amplitude: 3, harmonic: 2, phase: 0 },
  ],
  // A rocking barrel roll with a matching sideways drift.
  sway: [
    { channel: 'roll', amplitude: 14, harmonic: 1, phase: 0 },
    { channel: 'x', amplitude: 0.15, harmonic: 1, phase: Math.PI },
    { channel: 'yaw', amplitude: 2, harmonic: 1, phase: Math.PI / 2 },
  ],
  // The look direction turns a full circle while nodding gently, so the
  // camera glances at the walls and behind before facing forward again.
  // The field of view beats on the loop like a bass drum zoom.
  zoomPulse: [
    { channel: 'fov', amplitude: 10, harmonic: 2, phase: 0 },
    { channel: 'fov', amplitude: 4, harmonic: 4, phase: Math.PI / 2 },
  ],
  // The field of view swings while the camera dollies to compensate, the
  // Hitchcock dolly zoom: the subject keeps its size and the space warps.
  vertigo: [
    { channel: 'fov', amplitude: 25, harmonic: 1, phase: 0 },
  ],
  lookAround: [
    { channel: 'pitch', amplitude: 6, harmonic: 2, phase: 0 },
    { channel: 'roll', amplitude: 3, harmonic: 1, phase: Math.PI / 2 },
  ],
};

const CAMERA_WIGGLE_SPINS: Partial<Record<CameraWigglePreset, readonly WiggleSpin[]>> = {
  lookAround: [{ channel: 'yaw', turns: 1 }],
};

export type CameraWiggle = Record<WiggleChannel, number>;

/**
 * Evaluates the wiggle preset at a loop-normalized time. Amplitudes are
 * scaled by Amount and harmonics and spins by the integer Speed, so time 0 and
 * 1 give identical values (angles modulo a full turn) and the camera motion
 * loops seamlessly.
 */
export function getCameraWiggle(config: ConeViewConfig, normalizedTime: number): CameraWiggle {
  const wiggle: CameraWiggle = { yaw: 0, pitch: 0, roll: 0, x: 0, y: 0, fov: 0, dolly: 0 };
  const terms = CAMERA_WIGGLE_TERMS[config.wigglePreset] ?? CAMERA_WIGGLE_TERMS.off;
  const spins = CAMERA_WIGGLE_SPINS[config.wigglePreset] ?? [];
  const amount = Math.max(0, safeFinite(config.wiggleAmount, 1));
  const speed = Math.max(1, Math.round(safeFinite(config.wiggleSpeed, 1)));
  const time = safeFinite(normalizedTime, 0);
  for (const spin of spins) {
    // Keep the angle in [0, 360) so the end of the loop equals its start.
    const turns = spin.turns * speed * time;
    wiggle[spin.channel] += (turns - Math.floor(turns)) * 360;
  }
  if (amount === 0) return wiggle;
  for (const term of terms) {
    wiggle[term.channel] += amount * term.amplitude
      * Math.sin(2 * Math.PI * term.harmonic * speed * time + term.phase);
  }
  return wiggle;
}

export function getThreeDCamera(config: ConeViewConfig, normalizedTime = 0): ThreeDCamera {
  const wiggle = getCameraWiggle(config, normalizedTime);
  let offsetX = safeFinite(config.cameraX, 0) + wiggle.x;
  let offsetY = safeFinite(config.cameraY, 0) + wiggle.y;
  const length = Math.hypot(offsetX, offsetY);
  if (length > CAMERA_MAX_OFFSET) {
    offsetX *= CAMERA_MAX_OFFSET / length;
    offsetY *= CAMERA_MAX_OFFSET / length;
  }
  const degrees = Math.PI / 180;
  const baseFov = clamp(safeFinite(config.cameraFov, 60), CAMERA_FOV_MIN, CAMERA_FOV_MAX);
  const fovDegrees = clamp(baseFov + wiggle.fov, CAMERA_FOV_MIN, CAMERA_FOV_MAX);
  // Vertigo keeps distance * tan(fov / 2) constant: a unit-distance subject
  // stays the same size while the perspective around it stretches.
  const vertigoDolly = config.wigglePreset === 'vertigo'
    ? Math.tan(baseFov * degrees / 2) / Math.tan(fovDegrees * degrees / 2) - 1
    : 0;
  return {
    offsetX,
    offsetY,
    yawRadians: (safeFinite(config.cameraYaw, 0) + wiggle.yaw) * degrees,
    pitchRadians: (safeFinite(config.cameraPitch, 0) + wiggle.pitch) * degrees,
    rollRadians: (safeFinite(config.rotation, 0) + wiggle.roll) * degrees,
    fovDegrees,
    // Positive dolly moves forward; pulling back is the vertigo compensation.
    dolly: safeFinite(config.cameraDolly, 0) + wiggle.dolly - vertigoDolly,
  };
}

/** Every uniform value of the dedicated 3D program, independent of WebGL. */
export type ThreeDRenderParams = {
  shape: number;
  surfaceMapping: number;
  projection: number;
  /** Half of the Fisheye angle in radians. */
  fisheyeHalfAngle: number;
  lensDistortion: number;
  /** Cone only: texture turns around the cone from the opening to the apex. */
  coneTwist: number;
  /** Cone only: 0 for the classic fixed camera, 1 for the shared Camera settings. */
  coneCameraMode: number;
  /** Torus only: 0..1 strength of the aim into the bend. */
  torusAim: number;
  /** Camera distance of the shapes seen from outside. */
  distance: number;
  fog: number;
  shade: number;
  /** Loop-normalized geometric motion (in shape-specific units), 0 when fixed. */
  travel: number;
  tangentHalfFov: number;
  textureRepeat: number;
  textureOffset: [number, number];
  seamBlend: number;
  seamMode: number;
  camera: ThreeDCamera;
  cone: {
    cameraDistance: number;
    depth: number;
    apertureRadius: number;
    apexOffset: [number, number];
  };
  torus: {
    majorRadius: number;
    ringRepeat: number;
    twistTurns: number;
  };
  lattice: {
    type: number;
    scale: number;
    thickness: number;
  };
  terrain: {
    height: number;
    altitude: number;
  };
  ribbon: {
    count: number;
    radius: number;
    stagger: number;
    /** Whole turns of the bands around the tube axis per loop length. */
    twistTurns: number;
    loopLength: number;
    /** Half turns of each band about its center line per loop length. */
    halfTwists: number;
    width: number;
    /** Loop lengths travelled per Flow Cycle: 2 when odd half twists need two to repeat. */
    laps: number;
    /** Turn of the band formation from Spin, in [0, 2π). */
    spinRadians: number;
  };
  rings: {
    pattern: number;
    mapping: number;
    perTile: number;
    spacing: number;
    thickness: number;
    depth: number;
    twistRadians: number;
    /** Roll of every frame from Spin, in [0, 2π). */
    spinRadians: number;
    pulse: number;
    /** Size wave phase from Beats, in [0, 1) turns. */
    pulsePhase: number;
    amount: number;
  };
  field: {
    geometry: number;
    render: number;
    loopCells: number;
    density: number;
    size: number;
    clearance: number;
    spread: number;
    arms: number;
    /** Arm turn per cell along the path, in radians; whole turns per Loop Length. */
    twistPerCell: number;
    armWidth: number;
    wire: number;
    /** Turn of an object spinning once per loop per Spin, in [0, 2π). */
    spinRadians: number;
    variation: number;
  };
  discs: {
    /** 0 for annuli, 1 for solid discs. */
    form: number;
    count: number;
    gap: number;
    thickness: number;
    spread: number;
    waves: number;
    scatter: number;
    spinPattern: number;
    /** Whole turns per loop; the shader eases or reverses them per ring. */
    spin: number;
    twistRadians: number;
    offset: number;
    tiltRadians: number;
    tiltTurns: number;
    viewRadians: number;
    /** Camera revolution around the vertical axis from Orbit, in [0, 2π). */
    orbitRadians: number;
    /** Loop-normalized time in [0, 1] that drives Spin and the tilt wobble. */
    time: number;
    /** Camera distance to the center, pulled back as the camera leaves the ring axis. */
    frameDistance: number;
    /** Outer ring radius: the canvas half diagonal in canvas half heights. */
    outerRadius: number;
  };
  crystal: CrystalUniforms;
};

/**
 * Shapes whose Flow moves the geometry or camera instead of sliding the
 * texture. Their loop-normalized travel is the Flow offset, and the texture
 * offset stays at zero except for the Torus Spin around the tube.
 */
const GEOMETRY_MOTION_SHAPES: ReadonlySet<ConeViewConfig['shape']> = new Set(['torus', 'lattice', 'terrain', 'ribbon', 'rings', 'field', 'discs', 'crystal']);

/** Frames of one Square Rings texture tile; the camera passes this many per Flow Cycle. */
export function getRingsPerTile(config: ConeViewConfig): number {
  return Math.max(1, Math.round(safeFinite(config.ringsPerTile, 8)));
}

/** Cells after which the Geometry Field repeats; the camera passes this many per Flow Cycle. */
export function getFieldLoopCells(config: ConeViewConfig): number {
  return Math.max(1, Math.round(safeFinite(config.fieldLoopCells, 16)));
}

/**
 * Loop lengths the Ribbon camera travels per Flow Cycle. An odd half twist
 * count flips every band across its width after one loop length, so the view
 * repeats only after two.
 */
export function getRibbonLaps(config: ConeViewConfig): number {
  return Math.abs(Math.round(safeFinite(config.ribbonHalfTwists, 0))) % 2 === 1 ? 2 : 1;
}

/**
 * Camera distance of the Discs. Head-on, a camera with the base FOV frames
 * the canvas half height (1 world unit) so the rings fill the canvas like the
 * 2D Slit. Leaning off the ring axis pulls it back until the whole stack
 * fits; an orbiting camera reaches the side view, so it keeps the distance
 * of a side view for the whole loop instead of zooming as it revolves.
 */
export function getDiscsFrameDistance(config: ConeViewConfig, aspect = 1): number {
  const fov = clamp(safeFinite(config.cameraFov, CONE_CAMERA_FOV), CAMERA_FOV_MIN, CAMERA_FOV_MAX);
  const headOn = 1 / Math.tan(fov * Math.PI / 360);
  const orbiting = Math.round(safeFinite(config.discsOrbit, 0)) !== 0;
  const offAxis = orbiting ? 1 : Math.sin(clamp(safeFinite(config.discsView, 0), 0, 89) * Math.PI / 180);
  const sideView = Math.max(1.5 * Math.hypot(Math.max(0.001, safeFinite(aspect, 1)), 1), 1);
  return headOn * (1 + (sideView - 1) * Math.sqrt(offAxis));
}

/** Fraction in [0, 1) of `count` whole cycles at a loop-normalized time. */
function wholeCyclePhase(count: number, normalizedTime: number): number {
  const cycles = Math.round(safeFinite(count, 0)) * Math.max(0, Math.min(1, safeFinite(normalizedTime, 0)));
  return cycles - Math.floor(cycles);
}

/**
 * Loop-periodic motion of the Square Rings. Spin rolls every frame by whole
 * turns per loop and Beats moves the size wave by whole periods per loop, so
 * both return to their start values at the loop boundary.
 */
export function getRingsMotion(config: ConeViewConfig, normalizedTime: number): { spinRadians: number; pulsePhase: number } {
  return {
    spinRadians: wholeCyclePhase(config.spin, normalizedTime) * 2 * Math.PI,
    pulsePhase: wholeCyclePhase(config.ringsBeats, normalizedTime),
  };
}

/** Most crystals the shader holds; its uniform arrays have this length. */
export const CRYSTAL_MAX = 24;
// Circumradius of a full-size crystal in canvas half heights.
const CRYSTAL_BASE_RADIUS = 0.5;
// Pyramid height of a Quartz point relative to the circumradius.
const CRYSTAL_QUARTZ_CAP = 1;
// The crystals cover the frame with this margin, or the disc around it.
export const CRYSTAL_FILL_REACH = 1.05;
// Extra reach of each crystal's central sphere over the widest gap in the fallback.
const CRYSTAL_COVER_MARGIN = 1.05;
// Grid steps across the covered region when coverage is checked.
const CRYSTAL_COVER_GRID = 64;
// Least distance from the camera to a crystal center, in its reach across the
// long axis, whenever covering the view allows it.
export const CRYSTAL_FILL_CAMERA_GAP = 1.15;
// Spheres along the long axis that measure what a crystal covers.
const CRYSTAL_AXIS_SPHERES = 9;
// Tangent of the face tilt of the Rhombohedron, about calcite's 50 degrees.
export const CRYSTAL_RHOMBOHEDRON_TAN = Math.tan(50 * Math.PI / 180);
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/** Shader index of every crystal form; Quartz and Bipyramid share the hexagonal code. */
export const CRYSTAL_SHAPE_INDEX = {
  quartz: 0,
  bipyramid: 1,
  prism: 2,
  octahedron: 3,
  rhombohedron: 4,
  dodecahedron: 5,
} as const satisfies Record<CrystalShape, number>;

export type CrystalShape = Exclude<CrystalForm, 'mix'>;
const CRYSTAL_SHAPES = CRYSTAL_FORMS.filter((form): form is CrystalShape => form !== 'mix');

type Vector3 = [number, number, number];

/** The half-space dot(normal, p) <= offset in the crystal frame. */
export type CrystalHalfSpace = { normal: Vector3; offset: number };

export type CrystalPlacement = {
  form: CrystalShape;
  /** Position before Revolve. */
  center: Vector3;
  /** Circumradius across the long axis before the form's own proportions. */
  radius: number;
  /** Half length along the long axis (+Y). */
  halfLength: number;
  /** Height of each pyramid point; Quartz and Bipyramid only, otherwise 0. */
  capHeight: number;
  /** Radius of the sphere around the center that holds the crystal in any orientation. */
  boundRadius: number;
  /** Farthest the crystal reaches from its long axis. */
  reach: number;
  /** Column-major rotation from the crystal frame (long axis +Y) to the world. */
  rotation: number[];
  /** Whole turns per loop per Spin about the long axis: ±1 or ±2. */
  rollRate: number;
};

type CrystalSolid = Pick<CrystalPlacement, 'form' | 'radius' | 'halfLength' | 'capHeight'>;

/** Seeded generator in [0, 1), so a layout is the same on every frame and export. */
function createRandom(seed: number): () => number {
  let state = (Math.imul(Math.round(seed), 0x9e3779b1) + 0x6d2b79f5) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomUnitVector(random: () => number): Vector3 {
  const z = random() * 2 - 1;
  const angle = random() * 2 * Math.PI;
  const ring = Math.sqrt(Math.max(0, 1 - z * z));
  return [ring * Math.cos(angle), ring * Math.sin(angle), z];
}

/** Column-major rotation of `angle` radians about a unit axis. */
function axisAngleMatrix(axis: readonly number[], angle: number): number[] {
  const [x, y, z] = axis;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const t = 1 - c;
  return [
    t * x * x + c, t * x * y + s * z, t * x * z - s * y,
    t * x * y - s * z, t * y * y + c, t * y * z + s * x,
    t * x * z + s * y, t * y * z - s * x, t * z * z + c,
  ];
}

function multiplyMatrices(a: readonly number[], b: readonly number[]): number[] {
  const result = new Array<number>(9).fill(0);
  for (let column = 0; column < 3; column += 1) {
    for (let row = 0; row < 3; row += 1) {
      let sum = 0;
      for (let k = 0; k < 3; k += 1) sum += a[k * 3 + row] * b[column * 3 + k];
      result[column * 3 + row] = sum;
    }
  }
  return result;
}

function transformVector(matrix: readonly number[], value: readonly number[]): Vector3 {
  return [
    matrix[0] * value[0] + matrix[3] * value[1] + matrix[6] * value[2],
    matrix[1] * value[0] + matrix[4] * value[1] + matrix[7] * value[2],
    matrix[2] * value[0] + matrix[5] * value[1] + matrix[8] * value[2],
  ];
}

/** Rotation that turns +Y onto a unit direction after rolling `roll` radians about +Y. */
function alignUpMatrix(direction: readonly number[], roll: number): number[] {
  // cross(+Y, direction)
  const axis = [direction[2], 0, -direction[0]];
  const axisLength = Math.hypot(axis[0], axis[2]);
  const angle = Math.acos(clamp(direction[1], -1, 1));
  const tilt = axisAngleMatrix(axisLength > 1e-6 ? axis.map(value => value / axisLength) : [1, 0, 0], angle);
  return multiplyMatrices(tilt, axisAngleMatrix([0, 1, 0], roll));
}

/** Tangent of half the base FOV, which frames the canvas; wiggles do not change it. */
function getCrystalTanHalfFov(config: ConeViewConfig): number {
  return Math.tan(clamp(safeFinite(config.cameraFov, CONE_CAMERA_FOV), CAMERA_FOV_MIN, CAMERA_FOV_MAX) * Math.PI / 360);
}

/**
 * Faces of a form scaled to `radius` across the long axis and `halfLength`
 * along it: a unit face dot(n, p) <= d becomes dot(n / s, p) <= d with
 * s = (radius, halfLength, radius). A slab is the face and its opposite.
 */
function scaledFaces(
  faces: readonly { normal: Vector3; offset: number; slab: boolean }[],
  radius: number,
  halfLength: number,
): CrystalHalfSpace[] {
  return faces.flatMap(({ normal, offset, slab }) => {
    const scaled: Vector3 = [normal[0] / radius, normal[1] / halfLength, normal[2] / radius];
    const length = Math.hypot(...scaled);
    const unit = scaled.map(value => value / length) as Vector3;
    const face = { normal: unit, offset: offset / length };
    return slab ? [face, { normal: unit.map(value => -value) as Vector3, offset: face.offset }] : [face];
  });
}

/**
 * The faces of a crystal in its frame (long axis +Y), matching crystalSpan in
 * three-d.frag.glsl:
 * - Quartz and Bipyramid: a hexagonal prism with a six-sided pyramid of height
 *   capHeight on both ends; Bipyramid has no prism.
 * - Prism: a triangular prism across the long axis with flat ends.
 * - Octahedron: |x| / r + |y| / h + |z| / r <= 1.
 * - Rhombohedron: three slabs tilted CRYSTAL_RHOMBOHEDRON_TAN off the axis,
 *   a skewed cube standing on a corner like calcite.
 * - Dodecahedron: the rhombic dodecahedron of garnet, |x| + |y| <= 1 and its
 *   two companions, scaled.
 */
export function getCrystalFaces(crystal: CrystalSolid): CrystalHalfSpace[] {
  const { radius, halfLength } = crystal;
  if (crystal.form === 'quartz' || crystal.form === 'bipyramid') {
    const apothem = radius * Math.cos(Math.PI / 6);
    const slope = Math.hypot(crystal.capHeight, apothem);
    return Array.from({ length: 6 }, (_, side) => {
      const angle = side * Math.PI / 3;
      const [x, z] = [Math.cos(angle), Math.sin(angle)];
      return [-1, 0, 1].map(end => (end === 0
        ? { normal: [x, 0, z] as Vector3, offset: apothem }
        : {
          normal: [x * crystal.capHeight / slope, end * apothem / slope, z * crystal.capHeight / slope] as Vector3,
          offset: apothem * halfLength / slope,
        }));
    }).flat();
  }
  if (crystal.form === 'prism') {
    return scaledFaces([
      ...[0, 1, 2].map(side => {
        const angle = Math.PI / 2 + side * 2 * Math.PI / 3;
        return { normal: [Math.cos(angle), 0, Math.sin(angle)] as Vector3, offset: 0.5, slab: false };
      }),
      { normal: [0, 1, 0], offset: 1, slab: true },
    ], radius, halfLength);
  }
  if (crystal.form === 'octahedron') {
    return scaledFaces([[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([x, z]) => (
      { normal: [x, 1, z] as Vector3, offset: 1, slab: true }
    )), radius, halfLength);
  }
  if (crystal.form === 'rhombohedron') {
    return scaledFaces([0, 1, 2].map(side => {
      const angle = side * 2 * Math.PI / 3;
      return {
        normal: [CRYSTAL_RHOMBOHEDRON_TAN * Math.cos(angle), 1, CRYSTAL_RHOMBOHEDRON_TAN * Math.sin(angle)] as Vector3,
        offset: 1,
        slab: true,
      };
    }), radius, halfLength);
  }
  return scaledFaces(([[1, 1, 0], [1, -1, 0], [0, 1, 1], [0, 1, -1], [1, 0, 1], [1, 0, -1]] as Vector3[]).map(normal => (
    { normal, offset: 1, slab: true }
  )), radius, halfLength);
}

/** Corners of the solid bounded by `faces`, found as feasible meeting points of three faces. */
function getCrystalVertices(faces: readonly CrystalHalfSpace[]): Vector3[] {
  const vertices: Vector3[] = [];
  for (let a = 0; a < faces.length; a += 1) {
    for (let b = a + 1; b < faces.length; b += 1) {
      for (let c = b + 1; c < faces.length; c += 1) {
        const [n1, n2, n3] = [faces[a].normal, faces[b].normal, faces[c].normal];
        const cross23: Vector3 = [n2[1] * n3[2] - n2[2] * n3[1], n2[2] * n3[0] - n2[0] * n3[2], n2[0] * n3[1] - n2[1] * n3[0]];
        const determinant = n1[0] * cross23[0] + n1[1] * cross23[1] + n1[2] * cross23[2];
        if (Math.abs(determinant) < 1e-9) continue;
        const cross31: Vector3 = [n3[1] * n1[2] - n3[2] * n1[1], n3[2] * n1[0] - n3[0] * n1[2], n3[0] * n1[1] - n3[1] * n1[0]];
        const cross12: Vector3 = [n1[1] * n2[2] - n1[2] * n2[1], n1[2] * n2[0] - n1[0] * n2[2], n1[0] * n2[1] - n1[1] * n2[0]];
        const point = [0, 1, 2].map(axis => (
          faces[a].offset * cross23[axis] + faces[b].offset * cross31[axis] + faces[c].offset * cross12[axis]
        ) / determinant) as Vector3;
        const inside = faces.every(face => (
          face.normal[0] * point[0] + face.normal[1] * point[1] + face.normal[2] * point[2] <= face.offset + 1e-9
        ));
        if (inside) vertices.push(point);
      }
    }
  }
  return vertices;
}

/** Bounding radius, reach from the long axis, and half extent along it. */
function getCrystalExtents(crystal: CrystalSolid): { boundRadius: number; reach: number; axisExtent: number } {
  const vertices = getCrystalVertices(getCrystalFaces(crystal));
  return {
    boundRadius: Math.max(...vertices.map(vertex => Math.hypot(...vertex))),
    reach: Math.max(...vertices.map(vertex => Math.hypot(vertex[0], vertex[2]))),
    axisExtent: Math.max(...vertices.map(vertex => Math.abs(vertex[1]))),
  };
}

/**
 * Spheres centered on the long axis (offsets in the crystal frame) that stay
 * inside the crystal however it rolls about that axis: each radius is the
 * distance from its center to the nearest face.
 */
export function getCrystalAxisSpheres(crystal: CrystalSolid): { offset: number; radius: number }[] {
  const faces = getCrystalFaces(crystal);
  const { axisExtent } = getCrystalExtents(crystal);
  return Array.from({ length: CRYSTAL_AXIS_SPHERES }, (_, index) => {
    const offset = axisExtent * 0.85 * (2 * index / (CRYSTAL_AXIS_SPHERES - 1) - 1);
    return { offset, radius: Math.min(...faces.map(face => face.offset - face.normal[1] * offset)) };
  }).filter(sphere => sphere.radius > 0);
}

/** Radius of the sphere around the center that stays inside the crystal in any orientation. */
export function getCrystalInscribedRadius(crystal: CrystalSolid): number {
  return Math.min(...getCrystalFaces(crystal).map(face => face.offset));
}

/**
 * Largest distance from a point of the disc of `radius` to the nearest of
 * `points`. It is measured on a grid that reaches one step past the disc and
 * padded by half the grid diagonal, so the true value is never larger.
 */
function getCoveringRadius(points: readonly (readonly [number, number])[], radius: number): number {
  const step = 2 * radius / CRYSTAL_COVER_GRID;
  const reach = radius + step;
  let widest = 0;
  for (let column = -1; column <= CRYSTAL_COVER_GRID + 1; column += 1) {
    for (let row = -1; row <= CRYSTAL_COVER_GRID + 1; row += 1) {
      const x = -radius + column * step;
      const y = -radius + row * step;
      if (x * x + y * y > reach * reach) continue;
      let nearest = Infinity;
      for (const point of points) nearest = Math.min(nearest, Math.hypot(x - point[0], y - point[1]));
      widest = Math.max(widest, nearest);
    }
  }
  return widest + step * Math.SQRT1_2;
}

let crystalLayoutCache: { key: string; layout: CrystalPlacement[] } | null = null;

/**
 * Places the Crystals deterministically from Seed so that they always cover
 * the whole view. Each crystal gets a random form (Mix) and size, and aims at
 * the frame (with a CRYSTAL_FILL_REACH margin) on a jittered grid or, while
 * Revolve rolls the crystals about the view axis, at the disc around it on a
 * jittered sunflower spiral. It sits along its direction from the camera,
 * which frames the canvas half height at the base FOV, and lies across its
 * line of sight; Spin only rolls it about its own long axis, so the spheres
 * along that axis (see getCrystalAxisSpheres) stay inside it and in place,
 * and it reaches toward the camera only by its reach from that axis. The
 * crystals start at random depths, from 2 to 2 + 3 * Spread (Field Depth)
 * radii away; while a point of the region is left uncovered by the axis
 * spheres, the crystal that comes closest to it moves 10% closer, but never
 * within CRYSTAL_FILL_CAMERA_GAP reaches of the camera. If that cannot cover
 * the view, every crystal comes as close as needed for its central sphere to
 * span the widest gap between the directions over the disc, which covers it
 * by construction. Every ray of the base camera therefore meets a crystal.
 * Crystals may intersect each other.
 */
export function getCrystalLayout(config: ConeViewConfig, aspect = 1): CrystalPlacement[] {
  // Poses are evaluated every frame, but the layout only changes with these.
  const key = JSON.stringify([
    config.crystalSeed, config.crystalCount, config.crystalSize, config.crystalLength, config.crystalSpread,
    config.crystalForm, config.cameraFov, Math.round(config.crystalRevolve) !== 0, aspect,
  ]);
  if (crystalLayoutCache?.key !== key) crystalLayoutCache = { key, layout: computeCrystalLayout(config, aspect) };
  return crystalLayoutCache.layout;
}

function computeCrystalLayout(config: ConeViewConfig, aspect: number): CrystalPlacement[] {
  const random = createRandom(safeFinite(config.crystalSeed, 0));
  const count = clamp(Math.round(safeFinite(config.crystalCount, 12)), 1, CRYSTAL_MAX);
  const size = Math.max(0.05, safeFinite(config.crystalSize, 1));
  const length = Math.max(1, safeFinite(config.crystalLength, 2.6));
  const spread = Math.max(0.05, safeFinite(config.crystalSpread, 1));
  const safeAspect = clamp(safeFinite(aspect, 1), 0.25, 4);
  // Draw every random value up front, so one crystal does not shift another.
  const drafts = Array.from({ length: count }, () => {
    const radius = CRYSTAL_BASE_RADIUS * size * (0.6 + 0.4 * random());
    const formPick = random();
    const form: CrystalShape = config.crystalForm === 'mix'
      ? CRYSTAL_SHAPES[Math.min(Math.floor(formPick * CRYSTAL_SHAPES.length), CRYSTAL_SHAPES.length - 1)]
      : config.crystalForm;
    const axis = randomUnitVector(random);
    const rollRate = (random() < 0.5 ? -1 : 1) * (random() < 0.6 ? 1 : 2);
    const slot = [random(), random(), random(), random()];
    const halfLength = radius * length;
    const capHeight = form === 'bipyramid' ? halfLength : form === 'quartz' ? Math.min(halfLength, CRYSTAL_QUARTZ_CAP * radius) : 0;
    const solid: CrystalSolid = { form, radius, halfLength, capHeight };
    return { solid, ...getCrystalExtents(solid), axis, rollRate, slot };
  });

  const tanHalfFov = getCrystalTanHalfFov(config);
  const cameraDistance = 1 / tanHalfFov;
  // The region of the image plane, at distance 1 from the camera, that the
  // crystals cover: the frame with a margin, or the disc around it while
  // Revolve rolls the crystals about the view axis.
  const halfWidth = CRYSTAL_FILL_REACH * safeAspect * tanHalfFov;
  const halfHeight = CRYSTAL_FILL_REACH * tanHalfFov;
  const discRadius = Math.hypot(halfWidth, halfHeight);
  const rolling = Math.round(safeFinite(config.crystalRevolve, 0)) !== 0;
  // Directions on a jittered grid over the frame, or a jittered sunflower
  // spiral over the disc.
  const rows = Math.max(1, Math.round(Math.sqrt(count * halfHeight / halfWidth)));
  const columns = Math.ceil(count / rows);
  const directions = drafts.map((draft, index) => {
    if (rolling) {
      const angle = index * GOLDEN_ANGLE + (draft.slot[0] - 0.5) * GOLDEN_ANGLE;
      const ring = discRadius * Math.sqrt((index + draft.slot[1]) / count);
      return [ring * Math.cos(angle), ring * Math.sin(angle)] as const;
    }
    const column = index % columns;
    const row = Math.floor(index / columns);
    return [
      halfWidth * (2 * (column + 0.2 + 0.6 * draft.slot[0]) / columns - 1),
      halfHeight * (2 * (row + 0.2 + 0.6 * draft.slot[1]) / rows - 1),
    ] as const;
  });
  const crystals = drafts.map((draft, index) => {
    const [x, y] = directions[index];
    const view = [x, y, -1].map(value => value / Math.hypot(x, y, 1));
    // Lay the random long axis into the plane across the line of sight.
    const along = draft.axis[0] * view[0] + draft.axis[1] * view[1] + draft.axis[2] * view[2];
    let across = draft.axis.map((value, axis) => value - along * view[axis]);
    if (Math.hypot(...across) < 1e-6) across = [view[1], -view[0], 0];
    const acrossLength = Math.hypot(...across);
    return {
      view,
      axis: across.map(value => value / acrossLength),
      spheres: getCrystalAxisSpheres(draft.solid),
      nearest: CRYSTAL_FILL_CAMERA_GAP * draft.reach,
      // Field Depth sends crystals back at random; covering pulls them in.
      distance: draft.solid.radius * (2 + 3 * Math.min(spread, 2) * draft.slot[2]),
    };
  });
  // A sphere of radius rho at distance d spans sin = rho / d around its
  // direction, which is never wider in the image plane than it looks there.
  const discsOf = (crystal: typeof crystals[number]) => crystal.spheres.map(({ offset, radius }) => {
    const point = crystal.view.map((value, axis) => value * crystal.distance + crystal.axis[axis] * offset);
    return { x: point[0] / -point[2], y: point[1] / -point[2], radius: radius / Math.hypot(...point) };
  });
  const discs = crystals.map(discsOf);
  // Grid points over the region and one step past it. A point covered with
  // half a grid diagonal to spare covers every point of its cell.
  const extentX = rolling ? discRadius : halfWidth;
  const extentY = rolling ? discRadius : halfHeight;
  const step = 2 * Math.max(extentX, extentY) / CRYSTAL_COVER_GRID;
  const pad = step * Math.SQRT1_2;
  const points: [number, number][] = [];
  for (let x = -extentX - step; x <= extentX + step + 1e-9; x += step) {
    for (let y = -extentY - step; y <= extentY + step + 1e-9; y += step) {
      if (!rolling || Math.hypot(x, y) <= discRadius + step) points.push([x, y]);
    }
  }
  const slack = (index: number, x: number, y: number) => Math.min(
    ...discs[index].map(disc => Math.hypot(x - disc.x, y - disc.y) - disc.radius + pad),
  );
  const coverOf = (x: number, y: number) => discs.findIndex((_, index) => slack(index, x, y) <= 0);
  const coverers = points.map(([x, y]) => coverOf(x, y));
  let covered = false;
  for (let attempt = 0; attempt < CRYSTAL_MAX * 20; attempt += 1) {
    const gap = coverers.indexOf(-1);
    if (gap < 0) {
      covered = true;
      break;
    }
    const [gapX, gapY] = points[gap];
    // Pull in the crystal that comes closest to the gap, unless it would
    // reach the camera.
    let best = -1;
    for (let index = 0; index < crystals.length; index += 1) {
      if (crystals[index].distance * 0.9 < crystals[index].nearest) continue;
      if (best < 0 || slack(index, gapX, gapY) < slack(best, gapX, gapY)) best = index;
    }
    if (best < 0) break;
    crystals[best].distance *= 0.9;
    discs[best] = discsOf(crystals[best]);
    points.forEach(([x, y], point) => {
      if (coverers[point] === best && slack(best, x, y) > 0) coverers[point] = coverOf(x, y);
      else if (coverers[point] < 0 && slack(best, x, y) <= 0) coverers[point] = best;
    });
  }
  if (!covered) {
    // Fall back to distances at which the central sphere of each crystal
    // spans the widest gap between directions over the disc, which covers
    // the view by construction even if a crystal then holds the camera.
    const widest = getCoveringRadius(directions, discRadius) * CRYSTAL_COVER_MARGIN;
    crystals.forEach((crystal, index) => {
      crystal.distance = Math.min(crystal.distance, getCrystalInscribedRadius(drafts[index].solid) / widest);
    });
  }
  return crystals.map((crystal, index) => ({
    ...drafts[index].solid,
    center: [
      crystal.view[0] * crystal.distance,
      crystal.view[1] * crystal.distance,
      cameraDistance + crystal.view[2] * crystal.distance,
    ],
    boundRadius: drafts[index].boundRadius,
    reach: drafts[index].reach,
    rotation: alignUpMatrix(crystal.axis, drafts[index].slot[3] * 2 * Math.PI),
    rollRate: drafts[index].rollRate,
  }));
}

/** Every uniform of the Crystals shape; the arrays hold CRYSTAL_MAX entries. */
export type CrystalUniforms = {
  count: number;
  /** Center xyz and bounding radius per crystal. */
  centers: number[];
  /** Column-major mat3 per crystal, from the crystal frame to the world. */
  rotations: number[];
  /** Radius, half length, pyramid height, and CRYSTAL_SHAPE_INDEX per crystal. */
  shapes: number[];
  /** 0 for clear refracting glass, 1 for the canvas mapped onto the faces. */
  material: number;
  faceOpacity: number;
  ior: number;
  dispersion: number;
  /** Wavelengths read across the dispersion range; 1 when Dispersion is 0. */
  dispersionSteps: number;
  /** Dispersion Blur strength; 0 when nothing is dispersed, which skips the blur pass. */
  dispersionBlur: number;
  reflection: number;
  /** Camera distance from the origin along +Z. */
  cameraDistance: number;
  /** The canvas plane z = backdropZ lies behind every crystal for the whole loop. */
  backdropZ: number;
  /** Half height of the canvas on the backdrop, so the base camera sees it fill the frame. */
  backdropHalfHeight: number;
};

/**
 * Poses the Crystals at a loop-normalized time. Spin rolls each crystal about
 * its own long axis by its rate times Spin whole turns per loop, and Revolve
 * rolls all of them about the view axis whole turns per loop, which keeps
 * every depth and the view covered, so the loop closes. The camera looks down
 * -Z at the origin from the distance that frames the canvas half height at
 * the base FOV, and the canvas on the backdrop fills its frame.
 */
export function getCrystalUniforms(config: ConeViewConfig, normalizedTime: number, aspect = 1): CrystalUniforms {
  const layout = getCrystalLayout(config, aspect);
  const spin = Math.round(safeFinite(config.crystalSpin, 0));
  const revolve = axisAngleMatrix([0, 0, 1], wholeCyclePhase(config.crystalRevolve, normalizedTime) * 2 * Math.PI);
  const centers = new Array<number>(CRYSTAL_MAX * 4).fill(0);
  const rotations = new Array<number>(CRYSTAL_MAX * 9).fill(0);
  const shapes = new Array<number>(CRYSTAL_MAX * 4).fill(0);
  // Farthest reach away from the camera; rolling about the view axis keeps it.
  let back = 0;
  layout.forEach((crystal, index) => {
    const rollAngle = wholeCyclePhase(crystal.rollRate * spin, normalizedTime) * 2 * Math.PI;
    const rotation = multiplyMatrices(revolve, multiplyMatrices(crystal.rotation, axisAngleMatrix([0, 1, 0], rollAngle)));
    const center = transformVector(revolve, crystal.center);
    centers.splice(index * 4, 4, center[0], center[1], center[2], crystal.boundRadius);
    rotations.splice(index * 9, 9, ...rotation);
    shapes.splice(index * 4, 4, crystal.radius, crystal.halfLength, crystal.capHeight, CRYSTAL_SHAPE_INDEX[crystal.form]);
    back = Math.max(back, -crystal.center[2] + crystal.boundRadius);
  });
  const tanHalfFov = getCrystalTanHalfFov(config);
  const cameraDistance = 1 / tanHalfFov;
  const backdropZ = -(back + Math.max(0, safeFinite(config.crystalBackdrop, 1)));
  const dispersion = Math.max(0, safeFinite(config.crystalDispersion, 0));
  return {
    count: layout.length,
    centers,
    rotations,
    shapes,
    material: config.crystalMaterial === 'faces' ? 1 : 0,
    faceOpacity: clamp(safeFinite(config.crystalFaceOpacity, 1), 0, 1),
    ior: Math.max(1, safeFinite(config.crystalIor, 1.6)),
    dispersion,
    dispersionSteps: dispersion > 0 ? clamp(Math.round(safeFinite(config.crystalDispersionSteps, 3)), 1, 10) : 1,
    // Only refracted light disperses, and opaque faces hide all of it.
    dispersionBlur: dispersion > 0 && config.crystalDispersionSteps > 1 && !(config.crystalMaterial === 'faces' && config.crystalFaceOpacity >= 0.999)
      ? clamp(safeFinite(config.crystalDispersionBlur, 0), 0, 1)
      : 0,
    reflection: clamp(safeFinite(config.crystalReflection, 0), 0, 1),
    cameraDistance,
    backdropZ,
    backdropHalfHeight: (cameraDistance - backdropZ) * tanHalfFov,
  };
}

export function getThreeDRenderParams(
  config: ConeViewConfig,
  normalizedTime: number,
  aspect: number,
): ThreeDRenderParams {
  const transform = getConeTextureTransform(config, normalizedTime);
  const safeAspect = Math.max(0.001, safeFinite(aspect, 1));
  const isCone = config.shape === 'cone';
  // The classic Cone keeps its original fixed 60 degree camera and ignores
  // every Camera setting.
  const classicCone = isCone && config.coneCameraMode !== 'free';
  // The opening keeps its 60 degree framing so FOV zooms the free Cone, while
  // the apex follows the base FOV so its handle stays on it.
  const apexOffset = getConeApexOffset(
    CONE_CAMERA_DISTANCE, config.depth, safeAspect, config.apexX, config.apexY,
    classicCone ? CONE_CAMERA_FOV : config.cameraFov,
  );
  const camera = getThreeDCamera(config, normalizedTime);
  const geometryMotion = GEOMETRY_MOTION_SHAPES.has(config.shape);
  const ringsPerTile = getRingsPerTile(config);
  const ringsMotion = getRingsMotion(config, normalizedTime);
  return {
    shape: getConeShapeIndex(config),
    surfaceMapping: THREE_D_SURFACE_MAPPING_INDEX[config.surfaceMapping] ?? 0,
    projection: Math.max(0, THREE_D_PROJECTIONS.indexOf(config.projection)),
    fisheyeHalfAngle: clamp(safeFinite(config.fisheyeAngle, 180), 90, 360) * Math.PI / 360,
    lensDistortion: clamp(safeFinite(config.lensDistortion, 0), -0.5, 0.5),
    coneTwist: safeFinite(config.coneTwist, 0),
    coneCameraMode: classicCone ? 0 : 1,
    torusAim: clamp(safeFinite(config.torusAim, 1), 0, 1),
    distance: config.depth * 0.5,
    fog: clamp(safeFinite(config.fog, 0), 0, 1),
    shade: clamp(safeFinite(config.shade, 0), 0, 1),
    // The Square Rings travel in frames, one tile of frames per Flow Cycle,
    // the Geometry Field in cells, one repeat of its layout per cycle, and the
    // Ribbon in loop lengths, two per cycle when its view needs two to repeat.
    travel: geometryMotion
      ? transform.offsetV * (
        config.shape === 'rings' ? ringsPerTile
          : config.shape === 'field' ? getFieldLoopCells(config)
            : config.shape === 'ribbon' ? getRibbonLaps(config)
              : 1
      )
      : 0,
    tangentHalfFov: Math.tan((classicCone ? CONE_CAMERA_FOV : camera.fovDegrees) * Math.PI / 360),
    textureRepeat: transform.repeatU,
    // The Torus camera rides the ring while Spin still turns its texture.
    textureOffset: config.shape === 'torus'
      ? [transform.offsetU, 0]
      : geometryMotion
        ? [0, 0]
        : [transform.offsetU, transform.offsetV],
    seamBlend: transform.seamBlend,
    seamMode: CONE_SEAM_MODE_INDEX[transform.seamMode],
    // The Cone keeps Rotation as a texture offset, so only the wiggle rolls
    // the free Cone camera; the classic Cone camera does not move at all.
    camera: classicCone
      ? { offsetX: 0, offsetY: 0, yawRadians: 0, pitchRadians: 0, rollRadians: 0, fovDegrees: CONE_CAMERA_FOV, dolly: 0 }
      : isCone
        ? { ...camera, rollRadians: getCameraWiggle(config, normalizedTime).roll * Math.PI / 180 }
        : camera,
    cone: {
      cameraDistance: CONE_CAMERA_DISTANCE,
      depth: config.depth,
      apertureRadius: getConeApertureRadius(CONE_CAMERA_DISTANCE, safeAspect),
      apexOffset: [apexOffset.x, apexOffset.y],
    },
    torus: {
      majorRadius: getTorusMajorRadius(config),
      ringRepeat: config.ringRepeat,
      twistTurns: getTorusTwistTurns(config),
    },
    lattice: {
      type: LATTICE_TYPES.indexOf(config.latticeType),
      scale: config.latticeScale,
      thickness: config.latticeThickness,
    },
    terrain: {
      height: config.terrainHeight,
      altitude: config.terrainAltitude,
    },
    ribbon: {
      count: Math.max(1, Math.round(safeFinite(config.ribbonCount, 6))),
      radius: config.ribbonRadius,
      stagger: clamp(safeFinite(config.ribbonStagger, 0), 0, 1),
      twistTurns: Math.round(safeFinite(config.ribbonTwist, 0)),
      loopLength: Math.max(1, safeFinite(config.ribbonLength, 16)),
      halfTwists: Math.round(safeFinite(config.ribbonHalfTwists, 0)),
      width: config.ribbonWidth,
      laps: getRibbonLaps(config),
      spinRadians: wholeCyclePhase(config.spin, normalizedTime) * 2 * Math.PI,
    },
    rings: {
      pattern: Math.max(0, RINGS_PATTERNS.indexOf(config.ringsPattern)),
      mapping: Math.max(0, RINGS_MAPPINGS.indexOf(config.ringsMapping)),
      perTile: ringsPerTile,
      spacing: config.ringsSpacing,
      thickness: config.ringsThickness,
      depth: config.ringsDepth,
      twistRadians: safeFinite(config.ringsTwist, 0) * Math.PI / 180,
      spinRadians: ringsMotion.spinRadians,
      pulse: clamp(safeFinite(config.ringsPulse, 0), 0, 1),
      pulsePhase: ringsMotion.pulsePhase,
      amount: clamp(safeFinite(config.ringsAmount, 0), 0, 1),
    },
    field: {
      geometry: Math.max(0, FIELD_GEOMETRIES.indexOf(config.fieldGeometry)),
      render: Math.max(0, FIELD_RENDERS.indexOf(config.fieldRender)),
      loopCells: getFieldLoopCells(config),
      density: config.fieldDensity,
      size: config.fieldSize,
      clearance: config.fieldClearance,
      spread: config.fieldSpread,
      arms: Math.max(0, Math.round(safeFinite(config.fieldArms, 0))),
      twistPerCell: Math.round(safeFinite(config.fieldTwist, 0)) * 2 * Math.PI / getFieldLoopCells(config),
      armWidth: clamp(safeFinite(config.fieldArmWidth, 0.35), 0, 1),
      wire: config.fieldWire,
      spinRadians: wholeCyclePhase(config.spin, normalizedTime) * 2 * Math.PI,
      variation: config.fieldVariation,
    },
    discs: {
      form: Math.max(0, DISCS_FORMS.indexOf(config.discsForm)),
      count: Math.max(1, Math.round(safeFinite(config.discsCount, 12))),
      gap: clamp(safeFinite(config.discsGap, 0), 0, 0.95),
      thickness: Math.max(0.001, safeFinite(config.discsThickness, 0.06)),
      spread: Math.max(0, safeFinite(config.discsSpread, 0)),
      waves: safeFinite(config.discsWaves, 0),
      scatter: clamp(safeFinite(config.discsScatter, 0), 0, 1),
      spinPattern: Math.max(0, DISCS_SPIN_PATTERNS.indexOf(config.discsSpinPattern)),
      spin: Math.round(safeFinite(config.discsSpin, 0)),
      twistRadians: safeFinite(config.discsTwist, 0) * Math.PI / 180,
      offset: clamp(safeFinite(config.discsOffset, 0), 0, 1),
      tiltRadians: clamp(safeFinite(config.discsTilt, 0), 0, 89) * Math.PI / 180,
      tiltTurns: Math.round(safeFinite(config.discsTiltTurns, 0)),
      viewRadians: clamp(safeFinite(config.discsView, 0), 0, 89) * Math.PI / 180,
      orbitRadians: wholeCyclePhase(config.discsOrbit, normalizedTime) * 2 * Math.PI,
      time: Math.max(0, Math.min(1, safeFinite(normalizedTime, 0))),
      frameDistance: getDiscsFrameDistance(config, safeAspect),
      outerRadius: Math.hypot(safeAspect, 1),
    },
    crystal: getCrystalUniforms(config, normalizedTime, safeAspect),
  };
}

export function getConeSeamModeIndex(mode: ConeSeamMode): number {
  return CONE_SEAM_MODE_INDEX[mode];
}
