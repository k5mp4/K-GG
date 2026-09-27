import { clampParameter, getParameterDefault, getParameterLimit } from '../lib/parameterLimits';

export type ConeMappingMode = 'flow' | 'projection';
/** Geometry of the 3D layer. The layer kind and preset key stay `cone` for compatibility. */
export type ConeShape = 'cone' | 'torus' | 'lattice' | 'mirrorRoom' | 'sphere';
export const CONE_SHAPES = ['cone', 'torus', 'lattice', 'mirrorRoom', 'sphere'] as const satisfies readonly ConeShape[];
export const CONE_SHAPE_INDEX = {
  cone: 0,
  torus: 1,
  lattice: 2,
  mirrorRoom: 3,
  sphere: 4,
} as const satisfies Record<ConeShape, number>;
export const CONE_SHAPE_OPTIONS: { value: ConeShape; label: string }[] = [
  { value: 'cone', label: 'Cone' },
  { value: 'torus', label: 'Torus · Tunnel' },
  { value: 'lattice', label: 'Lattice · Gyroid tunnel' },
  { value: 'mirrorRoom', label: 'Mirror Room · Polyhedron' },
  { value: 'sphere', label: 'Sphere · Dome / Planet' },
];

/**
 * Camera projection of every shape except the Cone. Fisheye is a 180 degree
 * dome master and Equirect a full 360 x 180 degree panorama for VR.
 */
export type ThreeDProjection = 'perspective' | 'fisheye' | 'equirect';
export const THREE_D_PROJECTIONS = ['perspective', 'fisheye', 'equirect'] as const satisfies readonly ThreeDProjection[];
export const THREE_D_PROJECTION_OPTIONS: { value: ThreeDProjection; label: string }[] = [
  { value: 'perspective', label: 'Perspective' },
  { value: 'fisheye', label: 'Fisheye · Dome master 180°' },
  { value: 'equirect', label: 'Equirect · 360° panorama' },
];

export type SphereView = 'inside' | 'outside';
export const SPHERE_VIEWS = ['inside', 'outside'] as const satisfies readonly SphereView[];
export const SPHERE_VIEW_OPTIONS: { value: SphereView; label: string }[] = [
  { value: 'inside', label: 'Inside · 360° room' },
  { value: 'outside', label: 'Outside · Planet' },
];

/** Triply periodic minimal surfaces used by the Lattice shape. */
export type LatticeType = 'gyroid' | 'schwarzP';
export const LATTICE_TYPES = ['gyroid', 'schwarzP'] as const satisfies readonly LatticeType[];
export const LATTICE_TYPE_OPTIONS: { value: LatticeType; label: string }[] = [
  { value: 'gyroid', label: 'Gyroid' },
  { value: 'schwarzP', label: 'Schwarz P' },
];

/** Convex polyhedra used by the Mirror Room shape. */
export type RoomShape = 'cube' | 'octahedron' | 'dodecahedron';
export const ROOM_SHAPES = ['cube', 'octahedron', 'dodecahedron'] as const satisfies readonly RoomShape[];
export const ROOM_SHAPE_INDEX = {
  cube: 0,
  octahedron: 1,
  dodecahedron: 2,
} as const satisfies Record<RoomShape, number>;
/** Which Mirror Room walls show the canvas; the others are mirrors. */
export type RoomCanvasFaces = 'all' | 'alternate' | 'front';
export const ROOM_CANVAS_FACES = ['all', 'alternate', 'front'] as const satisfies readonly RoomCanvasFaces[];
export const ROOM_CANVAS_FACE_OPTIONS: { value: RoomCanvasFaces; label: string }[] = [
  { value: 'alternate', label: 'Alternate · Kaleidoscope' },
  { value: 'front', label: 'Front · Infinite corridor' },
  { value: 'all', label: 'All · Blended' },
];
export const ROOM_SHAPE_OPTIONS: { value: RoomShape; label: string }[] = [
  { value: 'cube', label: 'Cube' },
  { value: 'octahedron', label: 'Octahedron' },
  { value: 'dodecahedron', label: 'Dodecahedron' },
];
export type ConeSeamMode = 'mirror' | 'weld' | 'reapply';

/**
 * How the canvas is applied to a 3D surface. `uv` uses the shape's own surface
 * coordinates (shapes without them fall back to `triplanar`), `triplanar`
 * projects along the three world axes, and `matcap` looks the canvas up by the
 * view-space normal so the gradient reads as a material.
 */
export type ThreeDSurfaceMapping = 'uv' | 'triplanar' | 'matcap';
export const THREE_D_SURFACE_MAPPINGS = ['uv', 'triplanar', 'matcap'] as const satisfies readonly ThreeDSurfaceMapping[];
export const THREE_D_SURFACE_MAPPING_INDEX = {
  uv: 0,
  triplanar: 1,
  matcap: 2,
} as const satisfies Record<ThreeDSurfaceMapping, number>;
export const THREE_D_SURFACE_MAPPING_OPTIONS: { value: ThreeDSurfaceMapping; label: string }[] = [
  { value: 'uv', label: 'Surface UV' },
  { value: 'triplanar', label: 'Triplanar' },
  { value: 'matcap', label: 'Matcap' },
];

export const CONE_SEAM_MODES = ['mirror', 'weld', 'reapply'] as const satisfies readonly ConeSeamMode[];
export const CONE_SEAM_MODE_INDEX = {
  mirror: 0,
  weld: 1,
  reapply: 2,
} as const satisfies Record<ConeSeamMode, number>;

export const CONE_SEAM_MODE_OPTIONS: { value: ConeSeamMode; label: string }[] = [
  { value: 'mirror', label: 'Mirror Repeat' },
  { value: 'weld', label: 'Edge Weld' },
  { value: 'reapply', label: 'Gradient Reapply' },
];
export const DEFAULT_CONE_SEAM_MODE: ConeSeamMode = 'mirror';

/** Procedural 3D camera motion. Every preset is periodic over one loop. */
export type CameraWigglePreset = 'off' | 'drift' | 'handheld' | 'float' | 'orbit' | 'sway' | 'lookAround';
export const CAMERA_WIGGLE_PRESETS = ['off', 'drift', 'handheld', 'float', 'orbit', 'sway', 'lookAround'] as const satisfies readonly CameraWigglePreset[];
export const CAMERA_WIGGLE_PRESET_OPTIONS: { value: CameraWigglePreset; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'drift', label: 'Drift · Slow look' },
  { value: 'handheld', label: 'Handheld · Shake' },
  { value: 'float', label: 'Float · Bobbing' },
  { value: 'orbit', label: 'Orbit · Circle' },
  { value: 'sway', label: 'Sway · Barrel roll' },
  { value: 'lookAround', label: 'Look Around · 360° Yaw' },
];

export type ConeViewConfig = {
  shape: ConeShape;
  depth: number;
  rotation: number;
  textureRepeat: number;
  flowCycles: number;
  apexX: number;
  apexY: number;
  seamBlend: number;
  seamMode: ConeSeamMode;
  mappingMode: ConeMappingMode;
  /** Not used by the Cone shape, which keeps its original unlit UV mapping. */
  surfaceMapping: ThreeDSurfaceMapping;
  /** Not used by the Cone shape. */
  projection: ThreeDProjection;
  /** Fades distant surfaces to black. */
  fog: number;
  /** Mixes in a head light; 0 keeps the surface unlit. */
  shade: number;
  /** Torus only: tube radius divided by ring radius. Larger values bend the tunnel more tightly. */
  torusBend: number;
  /** Torus only: texture tiles around the ring. Integer values keep the ring seamless. */
  ringRepeat: number;
  /**
   * Torus only: turns of the texture around the tube per ring tile. The total
   * over the ring is rounded to whole turns so the ring stays seamless.
   */
  torusTwist: number;
  /** Torus only: whole turns of the texture around the tube per loop. */
  spin: number;
  /** Camera offset in screen right/up. The torus measures it in tube radii inside the cross-section. */
  cameraX: number;
  cameraY: number;
  /** Look-direction adjustment in degrees, relative to each shape's base camera direction. */
  cameraYaw: number;
  cameraPitch: number;
  wigglePreset: CameraWigglePreset;
  /** Scales the preset's amplitudes. */
  wiggleAmount: number;
  /** Integer multiplier of every wiggle frequency, so the motion still closes on the loop. */
  wiggleSpeed: number;
  /** Lattice only: surface family. */
  latticeType: LatticeType;
  /** Lattice only: world length of one lattice period. */
  latticeScale: number;
  /** Lattice only: wall thickness in field units. */
  latticeThickness: number;
  /** Mirror Room only: polyhedron the camera sits in. */
  roomShape: RoomShape;
  /** Mirror Room only: reflections traced per pixel. */
  roomBounces: number;
  /** Mirror Room only: mirror strength; with All walls, the share each wall mirrors instead of showing the canvas. */
  roomReflectivity: number;
  /** Mirror Room only: which walls show the canvas. */
  roomCanvasFaces: RoomCanvasFaces;
  /** Sphere only: camera at the center or outside at Depth / 2. */
  sphereView: SphereView;
};

/** Normalized apex movement limit; ±2 reaches 50% of the canvas outside its edge. */
export const CONE_APEX_LIMIT = Math.max(
  Math.abs(getParameterLimit('cone.apexX').min),
  Math.abs(getParameterLimit('cone.apexX').max),
);
export const CONE_SEAM_BLEND_MIN = 0;
// A half-tile is the widest blend that keeps each seam local to its own side.
export const CONE_SEAM_BLEND_MAX = getParameterLimit('cone.seamBlend').max;

export const DEFAULT_CONE_VIEW: ConeViewConfig = {
  shape: 'cone',
  depth: getParameterDefault('cone.depth'),
  rotation: getParameterDefault('cone.rotation'),
  textureRepeat: getParameterDefault('cone.textureRepeat'),
  flowCycles: getParameterDefault('cone.flowCycles'),
  apexX: 0,
  apexY: 0,
  seamBlend: getParameterDefault('cone.seamBlend'),
  seamMode: DEFAULT_CONE_SEAM_MODE,
  mappingMode: 'flow',
  surfaceMapping: 'uv',
  projection: 'perspective',
  fog: getParameterDefault('cone.fog'),
  shade: getParameterDefault('cone.shade'),
  torusBend: getParameterDefault('cone.torusBend'),
  ringRepeat: getParameterDefault('cone.ringRepeat'),
  torusTwist: getParameterDefault('cone.torusTwist'),
  spin: getParameterDefault('cone.spin'),
  cameraX: getParameterDefault('cone.cameraX'),
  cameraY: getParameterDefault('cone.cameraY'),
  cameraYaw: getParameterDefault('cone.cameraYaw'),
  cameraPitch: getParameterDefault('cone.cameraPitch'),
  wigglePreset: 'off',
  wiggleAmount: getParameterDefault('cone.wiggleAmount'),
  wiggleSpeed: getParameterDefault('cone.wiggleSpeed'),
  latticeType: 'gyroid',
  latticeScale: getParameterDefault('cone.latticeScale'),
  latticeThickness: getParameterDefault('cone.latticeThickness'),
  roomShape: 'cube',
  roomBounces: getParameterDefault('cone.roomBounces'),
  roomReflectivity: getParameterDefault('cone.roomReflectivity'),
  roomCanvasFaces: 'alternate',
  sphereView: 'inside',
};

function normalizeOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? value as T : fallback;
}

function normalizeSeamMode(value: unknown): ConeSeamMode {
  return typeof value === 'string' && CONE_SEAM_MODES.includes(value as ConeSeamMode)
    ? value as ConeSeamMode
    : DEFAULT_CONE_SEAM_MODE;
}

export function normalizeConeViewConfig(value: unknown): ConeViewConfig {
  if (typeof value !== 'object' || value === null) return { ...DEFAULT_CONE_VIEW };
  const raw = value as Partial<ConeViewConfig>;
  return {
    shape: normalizeOption(raw.shape, CONE_SHAPES, DEFAULT_CONE_VIEW.shape),
    depth: clampParameter(raw.depth, DEFAULT_CONE_VIEW.depth, getParameterLimit('cone.depth')),
    rotation: clampParameter(raw.rotation, DEFAULT_CONE_VIEW.rotation, getParameterLimit('cone.rotation')),
    textureRepeat: clampParameter(raw.textureRepeat, DEFAULT_CONE_VIEW.textureRepeat, getParameterLimit('cone.textureRepeat')),
    flowCycles: clampParameter(raw.flowCycles, DEFAULT_CONE_VIEW.flowCycles, getParameterLimit('cone.flowCycles')),
    apexX: clampParameter(raw.apexX, DEFAULT_CONE_VIEW.apexX, getParameterLimit('cone.apexX')),
    apexY: clampParameter(raw.apexY, DEFAULT_CONE_VIEW.apexY, getParameterLimit('cone.apexY')),
    seamBlend: clampParameter(raw.seamBlend, DEFAULT_CONE_VIEW.seamBlend, getParameterLimit('cone.seamBlend')),
    seamMode: normalizeSeamMode(raw.seamMode),
    mappingMode: raw.mappingMode === 'projection' ? 'projection' : DEFAULT_CONE_VIEW.mappingMode,
    surfaceMapping: normalizeOption(raw.surfaceMapping, THREE_D_SURFACE_MAPPINGS, DEFAULT_CONE_VIEW.surfaceMapping),
    projection: normalizeOption(raw.projection, THREE_D_PROJECTIONS, DEFAULT_CONE_VIEW.projection),
    fog: clampParameter(raw.fog, DEFAULT_CONE_VIEW.fog, getParameterLimit('cone.fog')),
    shade: clampParameter(raw.shade, DEFAULT_CONE_VIEW.shade, getParameterLimit('cone.shade')),
    torusBend: clampParameter(raw.torusBend, DEFAULT_CONE_VIEW.torusBend, getParameterLimit('cone.torusBend')),
    ringRepeat: clampParameter(raw.ringRepeat, DEFAULT_CONE_VIEW.ringRepeat, getParameterLimit('cone.ringRepeat')),
    torusTwist: clampParameter(raw.torusTwist, DEFAULT_CONE_VIEW.torusTwist, getParameterLimit('cone.torusTwist')),
    spin: clampParameter(raw.spin, DEFAULT_CONE_VIEW.spin, getParameterLimit('cone.spin')),
    cameraX: clampParameter(raw.cameraX, DEFAULT_CONE_VIEW.cameraX, getParameterLimit('cone.cameraX')),
    cameraY: clampParameter(raw.cameraY, DEFAULT_CONE_VIEW.cameraY, getParameterLimit('cone.cameraY')),
    cameraYaw: clampParameter(raw.cameraYaw, DEFAULT_CONE_VIEW.cameraYaw, getParameterLimit('cone.cameraYaw')),
    cameraPitch: clampParameter(raw.cameraPitch, DEFAULT_CONE_VIEW.cameraPitch, getParameterLimit('cone.cameraPitch')),
    wigglePreset: normalizeOption(raw.wigglePreset, CAMERA_WIGGLE_PRESETS, DEFAULT_CONE_VIEW.wigglePreset),
    wiggleAmount: clampParameter(raw.wiggleAmount, DEFAULT_CONE_VIEW.wiggleAmount, getParameterLimit('cone.wiggleAmount')),
    wiggleSpeed: clampParameter(raw.wiggleSpeed, DEFAULT_CONE_VIEW.wiggleSpeed, getParameterLimit('cone.wiggleSpeed')),
    latticeType: normalizeOption(raw.latticeType, LATTICE_TYPES, DEFAULT_CONE_VIEW.latticeType),
    latticeScale: clampParameter(raw.latticeScale, DEFAULT_CONE_VIEW.latticeScale, getParameterLimit('cone.latticeScale')),
    latticeThickness: clampParameter(raw.latticeThickness, DEFAULT_CONE_VIEW.latticeThickness, getParameterLimit('cone.latticeThickness')),
    roomShape: normalizeOption(raw.roomShape, ROOM_SHAPES, DEFAULT_CONE_VIEW.roomShape),
    roomBounces: clampParameter(raw.roomBounces, DEFAULT_CONE_VIEW.roomBounces, getParameterLimit('cone.roomBounces')),
    roomReflectivity: clampParameter(raw.roomReflectivity, DEFAULT_CONE_VIEW.roomReflectivity, getParameterLimit('cone.roomReflectivity')),
    roomCanvasFaces: normalizeOption(raw.roomCanvasFaces, ROOM_CANVAS_FACES, DEFAULT_CONE_VIEW.roomCanvasFaces),
    sphereView: normalizeOption(raw.sphereView, SPHERE_VIEWS, DEFAULT_CONE_VIEW.sphereView),
  };
}
