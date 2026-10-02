import { clampParameter, getParameterDefault, getParameterLimit } from '../lib/parameterLimits';

export type ConeMappingMode = 'flow' | 'projection';
/** Geometry of the 3D layer. The layer kind and preset key stay `cone` for compatibility. */
export type ConeShape = 'cone' | 'torus' | 'lattice' | 'terrain' | 'ribbon' | 'rings' | 'field' | 'discs' | 'crystal';
export const CONE_SHAPES = ['cone', 'torus', 'lattice', 'terrain', 'ribbon', 'rings', 'field', 'discs', 'crystal'] as const satisfies readonly ConeShape[];
export const CONE_SHAPE_INDEX = {
  cone: 0,
  torus: 1,
  lattice: 2,
  terrain: 3,
  ribbon: 4,
  rings: 5,
  field: 6,
  discs: 7,
  crystal: 8,
} as const satisfies Record<ConeShape, number>;
export const CONE_SHAPE_OPTIONS: { value: ConeShape; label: string }[] = [
  { value: 'cone', label: 'Cone' },
  { value: 'torus', label: 'Torus · Tunnel' },
  { value: 'lattice', label: 'Lattice · Gyroid tunnel' },
  { value: 'terrain', label: 'Terrain · Heightfield flyover' },
  { value: 'ribbon', label: 'Ribbons · Growing bands' },
  { value: 'rings', label: 'Square Rings · Frame tunnel' },
  { value: 'field', label: 'Geometry Field · Scattered flythrough' },
  { value: 'discs', label: 'Discs · Slit rings in 3D' },
  { value: 'crystal', label: 'Crystals · Refraction' },
];

/**
 * Shape of each Crystals object, all along a long axis that Length stretches:
 * `quartz` is a hexagonal prism with a pyramid on both ends, `bipyramid`
 * drops the prism so the two pyramids meet, `prism` is a triangular prism,
 * `octahedron` a diamond-like double pyramid on a square, `rhombohedron` a
 * skewed cube like calcite, `dodecahedron` the rhombic dodecahedron of
 * garnet, and `mix` picks one at random per crystal. The faces are defined
 * in src/lib/coneView.ts (getCrystalFaces) and three-d.frag.glsl.
 */
export type CrystalForm = 'quartz' | 'bipyramid' | 'prism' | 'octahedron' | 'rhombohedron' | 'dodecahedron' | 'mix';
export const CRYSTAL_FORMS = ['quartz', 'bipyramid', 'prism', 'octahedron', 'rhombohedron', 'dodecahedron', 'mix'] as const satisfies readonly CrystalForm[];
export const CRYSTAL_FORM_OPTIONS: { value: CrystalForm; label: string }[] = [
  { value: 'quartz', label: 'Quartz · Pointed prism' },
  { value: 'bipyramid', label: 'Bipyramid · Double point' },
  { value: 'prism', label: 'Prism · Triangular' },
  { value: 'octahedron', label: 'Octahedron · Diamond' },
  { value: 'rhombohedron', label: 'Rhombohedron · Calcite' },
  { value: 'dodecahedron', label: 'Dodecahedron · Garnet' },
  { value: 'mix', label: 'Mix · Per crystal' },
];

/**
 * Surface of the Crystals. `refract` is clear glass that bends the canvas
 * behind it; `faces` maps the canvas onto every face with Surface Mapping.
 */
export type CrystalMaterial = 'refract' | 'faces';
export const CRYSTAL_MATERIALS = ['refract', 'faces'] as const satisfies readonly CrystalMaterial[];
export const CRYSTAL_MATERIAL_OPTIONS: { value: CrystalMaterial; label: string }[] = [
  { value: 'refract', label: 'Refraction · Clear glass' },
  { value: 'faces', label: 'Faces · Canvas on faces' },
];

/**
 * Shape of each Discs object: `rings` keeps the Slit circle's annuli, and
 * `discs` fills every object to the center so they stack like coins.
 */
export type DiscsForm = 'rings' | 'discs';
export const DISCS_FORMS = ['rings', 'discs'] as const satisfies readonly DiscsForm[];
export const DISCS_FORM_OPTIONS: { value: DiscsForm; label: string }[] = [
  { value: 'rings', label: 'Rings · Slit circle' },
  { value: 'discs', label: 'Discs · Solid' },
];

/**
 * How the Discs rings turn. `together` spins every ring at the same speed,
 * `alternate` reverses every other ring, and `stagger` turns each ring in
 * eased steps that start one ring after another from the center outward.
 */
export type DiscsSpinPattern = 'together' | 'alternate' | 'stagger';
export const DISCS_SPIN_PATTERNS = ['together', 'alternate', 'stagger'] as const satisfies readonly DiscsSpinPattern[];
export const DISCS_SPIN_PATTERN_OPTIONS: { value: DiscsSpinPattern; label: string }[] = [
  { value: 'together', label: 'Together · Same speed' },
  { value: 'alternate', label: 'Alternate · Counter-rotating' },
  { value: 'stagger', label: 'Stagger · Eased cascade' },
];

/**
 * Primitives of the Geometry Field; `mix` picks one at random per object and
 * includes the loaded model. `model` uses the loaded .glb and draws spheres
 * until one is loaded, since presets do not store the file.
 */
export type FieldGeometry = 'mix' | 'sphere' | 'cube' | 'prism' | 'octahedron' | 'torus' | 'model';
export const FIELD_GEOMETRIES = ['mix', 'sphere', 'cube', 'prism', 'octahedron', 'torus', 'model'] as const satisfies readonly FieldGeometry[];
export const FIELD_GEOMETRY_OPTIONS: { value: FieldGeometry; label: string }[] = [
  { value: 'mix', label: 'Mix · All shapes' },
  { value: 'sphere', label: 'Sphere' },
  { value: 'cube', label: 'Cube' },
  { value: 'prism', label: 'Triangular Prism' },
  { value: 'octahedron', label: 'Octahedron' },
  { value: 'torus', label: 'Torus' },
  { value: 'model', label: 'Model · Loaded GLB' },
];

/** Geometry Field surfaces: filled, edges only, or a random choice per object. */
export type FieldRender = 'solid' | 'wire' | 'mixed';
export const FIELD_RENDERS = ['solid', 'wire', 'mixed'] as const satisfies readonly FieldRender[];
export const FIELD_RENDER_OPTIONS: { value: FieldRender; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'wire', label: 'Wireframe' },
  { value: 'mixed', label: 'Mixed · Per object' },
];

/**
 * Layouts of the Square Rings shape. `corridor` lines the frames up straight,
 * `serpent` threads them on a winding path, and `tumble` scatters and turns
 * them until they line up in front of the camera.
 */
export type RingsPattern = 'corridor' | 'serpent' | 'tumble';
export const RINGS_PATTERNS = ['corridor', 'serpent', 'tumble'] as const satisfies readonly RingsPattern[];
export const RINGS_PATTERN_OPTIONS: { value: RingsPattern; label: string }[] = [
  { value: 'corridor', label: 'Corridor · Straight' },
  { value: 'serpent', label: 'Serpent · Winding path' },
  { value: 'tumble', label: 'Tumble · Assemble' },
];

/**
 * How Surface UV lays the canvas on each frame. `wrap` runs U around the
 * frame and spreads V over the frames of one tile; `picture` shows the whole
 * canvas on every frame, cut out by the hole.
 */
export type RingsMapping = 'wrap' | 'picture';
export const RINGS_MAPPINGS = ['wrap', 'picture'] as const satisfies readonly RingsMapping[];
export const RINGS_MAPPING_OPTIONS: { value: RingsMapping; label: string }[] = [
  { value: 'wrap', label: 'Wrap · Around the frames' },
  { value: 'picture', label: 'Picture · Canvas per frame' },
];

/**
 * Camera projection of every shape. Fisheye is a 180 degree dome master and
 * Equirect a full 360 x 180 degree panorama for VR.
 */
export type ThreeDProjection = 'perspective' | 'fisheye' | 'equirect';
export const THREE_D_PROJECTIONS = ['perspective', 'fisheye', 'equirect'] as const satisfies readonly ThreeDProjection[];
export const THREE_D_PROJECTION_OPTIONS: { value: ThreeDProjection; label: string }[] = [
  { value: 'perspective', label: 'Perspective' },
  { value: 'fisheye', label: 'Fisheye · Dome master 180°' },
  { value: 'equirect', label: 'Equirect · 360° panorama' },
];

/** Triply periodic minimal surfaces used by the Lattice shape. */
export type LatticeType = 'gyroid' | 'schwarzP';
export const LATTICE_TYPES = ['gyroid', 'schwarzP'] as const satisfies readonly LatticeType[];
export const LATTICE_TYPE_OPTIONS: { value: LatticeType; label: string }[] = [
  { value: 'gyroid', label: 'Gyroid' },
  { value: 'schwarzP', label: 'Schwarz P' },
];

export type ConeSeamMode = 'mirror' | 'weld' | 'reapply';

/**
 * Camera of the Cone shape. `classic` keeps the original fixed 60 degree
 * camera and the cone bounded by its opening, so the apex handle behaves as
 * it always has; `free` applies the shared Camera settings and extends the
 * cone behind its opening.
 */
export type ConeCameraMode = 'classic' | 'free';
export const CONE_CAMERA_MODES = ['classic', 'free'] as const satisfies readonly ConeCameraMode[];
export const CONE_CAMERA_MODE_OPTIONS: { value: ConeCameraMode; label: string }[] = [
  { value: 'classic', label: 'Classic · Fixed camera' },
  { value: 'free', label: 'Free · Camera controls' },
];

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
export type CameraWigglePreset = 'off' | 'drift' | 'handheld' | 'float' | 'orbit' | 'sway' | 'lookAround' | 'zoomPulse' | 'vertigo';
export const CAMERA_WIGGLE_PRESETS = ['off', 'drift', 'handheld', 'float', 'orbit', 'sway', 'lookAround', 'zoomPulse', 'vertigo'] as const satisfies readonly CameraWigglePreset[];
export const CAMERA_WIGGLE_PRESET_OPTIONS: { value: CameraWigglePreset; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'drift', label: 'Drift · Slow look' },
  { value: 'handheld', label: 'Handheld · Shake' },
  { value: 'float', label: 'Float · Bobbing' },
  { value: 'orbit', label: 'Orbit · Circle' },
  { value: 'sway', label: 'Sway · Barrel roll' },
  { value: 'lookAround', label: 'Look Around · 360° Yaw' },
  { value: 'zoomPulse', label: 'Zoom Pulse · FOV beat' },
  { value: 'vertigo', label: 'Vertigo · Dolly zoom' },
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
  /** Cone only: turns of the texture around the cone from the opening to the apex. */
  coneTwist: number;
  /** Cone only: fixed original camera, or the shared Camera settings. */
  coneCameraMode: ConeCameraMode;
  /** Camera offset in screen right/up. The torus measures it in tube radii inside the cross-section. */
  cameraX: number;
  cameraY: number;
  /** Look-direction adjustment in degrees, relative to each shape's base camera direction. */
  cameraYaw: number;
  cameraPitch: number;
  /** Vertical field of view in degrees for the Perspective projection. */
  cameraFov: number;
  /** Full angle in degrees covered by the Fisheye circle; 180 is a dome master. */
  fisheyeAngle: number;
  /** Radial lens distortion of the Perspective projection: positive is barrel, negative pincushion. */
  lensDistortion: number;
  /** Moves the camera along its view direction, in shape-relative units. */
  cameraDolly: number;
  /** Torus only: how strongly the camera aims into the bend. */
  torusAim: number;
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
  /** Terrain only: height of the brightest canvas color. */
  terrainHeight: number;
  /** Terrain only: camera height above the ground plane. */
  terrainAltitude: number;
  /** Ribbon only: bands spaced evenly around the tube axis. */
  ribbonCount: number;
  /** Ribbon only: distance of the bands from the tube axis the camera travels on. */
  ribbonRadius: number;
  /** Ribbon only: how far the band tips scatter along the travel direction. */
  ribbonStagger: number;
  /** Ribbon only: whole turns of the bands around the tube axis per Loop Length. */
  ribbonTwist: number;
  /** Ribbon only: world length after which the bands repeat; each Flow Cycle travels it. */
  ribbonLength: number;
  /** Ribbon only: half turns of each band about its own center line per Loop Length. */
  ribbonHalfTwists: number;
  /** Ribbon only: half width of each band. */
  ribbonWidth: number;
  /** Square Rings only: frame layout. */
  ringsPattern: RingsPattern;
  /** Square Rings only: canvas layout on the frames under Surface UV. */
  ringsMapping: RingsMapping;
  /** Square Rings only: frames per texture tile; each Flow Cycle passes this many frames. */
  ringsPerTile: number;
  /** Square Rings only: distance between frames, in frame half sizes. */
  ringsSpacing: number;
  /** Square Rings only: bar width as a share of the frame half size. */
  ringsThickness: number;
  /** Square Rings only: frame depth along the travel direction. */
  ringsDepth: number;
  /** Square Rings only: degrees each frame turns relative to the one before. */
  ringsTwist: number;
  /** Square Rings only: size wave along the frames; 1 swings the size by ±50%. */
  ringsPulse: number;
  /** Square Rings only: whole size waves passing each frame per loop. */
  ringsBeats: number;
  /** Square Rings only: Serpent path curvature or Tumble scatter strength. */
  ringsAmount: number;
  /** Geometry Field only: primitive of every object, or a random mix. */
  fieldGeometry: FieldGeometry;
  /** Geometry Field only: solid, wireframe, or a random choice per object. */
  fieldRender: FieldRender;
  /** Geometry Field only: cells after which the layout repeats; each Flow Cycle passes this many. */
  fieldLoopCells: number;
  /** Geometry Field only: share of cells holding an object. */
  fieldDensity: number;
  /** Geometry Field only: largest object size as a share of its cell. */
  fieldSize: number;
  /** Geometry Field only: radius in cells around the camera path kept free of objects. */
  fieldClearance: number;
  /** Geometry Field only: outer radius in cells of the swarm; at least Clearance + 1. */
  fieldSpread: number;
  /** Geometry Field only: spiral arms holding the objects; 0 scatters them evenly. */
  fieldArms: number;
  /** Geometry Field only: whole turns of the arms around the path per Loop Length. */
  fieldTwist: number;
  /** Geometry Field only: share of the angle between arms that an arm covers. */
  fieldArmWidth: number;
  /** Geometry Field only: wire thickness relative to the object radius. */
  fieldWire: number;
  /** Geometry Field only: how far each object's texture is shifted from the others. */
  fieldVariation: number;
  /** Discs only: annuli or solid discs. */
  discsForm: DiscsForm;
  /** Discs only: concentric rings cut from the canvas. */
  discsCount: number;
  /** Discs only: share of each ring width left empty between rings. */
  discsGap: number;
  /** Discs only: ring thickness along its axis, in canvas half heights. */
  discsThickness: number;
  /** Discs only: amplitude of the ring positions along the view axis. */
  discsSpread: number;
  /** Discs only: sine periods of the depth wave across the rings. */
  discsWaves: number;
  /** Discs only: random phase added to each ring's depth wave and tilt. */
  discsScatter: number;
  /** Discs only: how the rings turn. */
  discsSpinPattern: DiscsSpinPattern;
  /** Discs only: whole turns of each ring per loop. */
  discsSpin: number;
  /** Discs only: fixed turn in degrees from one ring to the next. */
  discsTwist: number;
  /** Discs only: random fixed turn of each ring, as in the Slit circle; 1 is up to half a turn. */
  discsOffset: number;
  /** Discs only: wobble tilt of the rings in degrees. */
  discsTilt: number;
  /** Discs only: whole turns of the wobble per loop. */
  discsTiltTurns: number;
  /** Discs only: camera angle from the ring axis in degrees; 0 looks straight at the rings. */
  discsView: number;
  /** Discs only: whole camera revolutions per loop around the vertical axis through the center. */
  discsOrbit: number;
  /** Crystals only: clear refracting glass, or the canvas mapped onto the faces. */
  crystalMaterial: CrystalMaterial;
  /** Crystals only: share of the face mapping over the refraction in the Faces material. */
  crystalFaceOpacity: number;
  /** Crystals only: crystal form, or a random choice per crystal. */
  crystalForm: CrystalForm;
  /** Crystals only: number of crystals. */
  crystalCount: number;
  /** Crystals only: crystal size; larger crystals cover the view from farther away. */
  crystalSize: number;
  /** Crystals only: crystal length divided by its width. */
  crystalLength: number;
  /** Crystals only: how far back the crystals may start before covering pulls them in (Field Depth). */
  crystalSpread: number;
  /** Crystals only: random layout and orientation variant. */
  crystalSeed: number;
  /** Crystals only: index of refraction of the green channel. */
  crystalIor: number;
  /** Crystals only: index difference from red to blue, which splits the colors. */
  crystalDispersion: number;
  /** Crystals only: wavelengths read across the Dispersion range; only the ends and middle are traced, 1 traces one. */
  crystalDispersionSteps: number;
  /** Crystals only: strength of the mirrored surroundings and glints on the outer faces. */
  crystalReflection: number;
  /** Crystals only: distance from the farthest crystal to the canvas behind it. */
  crystalBackdrop: number;
  /** Crystals only: whole turns of each crystal about its long axis per loop. */
  crystalSpin: number;
  /** Crystals only: whole turns of all crystals about the view axis per loop. */
  crystalRevolve: number;
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
  coneTwist: getParameterDefault('cone.coneTwist'),
  coneCameraMode: 'classic',
  cameraX: getParameterDefault('cone.cameraX'),
  cameraY: getParameterDefault('cone.cameraY'),
  cameraYaw: getParameterDefault('cone.cameraYaw'),
  cameraPitch: getParameterDefault('cone.cameraPitch'),
  cameraFov: getParameterDefault('cone.cameraFov'),
  fisheyeAngle: getParameterDefault('cone.fisheyeAngle'),
  lensDistortion: getParameterDefault('cone.lensDistortion'),
  cameraDolly: getParameterDefault('cone.cameraDolly'),
  torusAim: getParameterDefault('cone.torusAim'),
  wigglePreset: 'off',
  wiggleAmount: getParameterDefault('cone.wiggleAmount'),
  wiggleSpeed: getParameterDefault('cone.wiggleSpeed'),
  latticeType: 'gyroid',
  latticeScale: getParameterDefault('cone.latticeScale'),
  latticeThickness: getParameterDefault('cone.latticeThickness'),
  terrainHeight: getParameterDefault('cone.terrainHeight'),
  terrainAltitude: getParameterDefault('cone.terrainAltitude'),
  ribbonCount: getParameterDefault('cone.ribbonCount'),
  ribbonRadius: getParameterDefault('cone.ribbonRadius'),
  ribbonStagger: getParameterDefault('cone.ribbonStagger'),
  ribbonTwist: getParameterDefault('cone.ribbonTwist'),
  ribbonLength: getParameterDefault('cone.ribbonLength'),
  ribbonHalfTwists: getParameterDefault('cone.ribbonHalfTwists'),
  ribbonWidth: getParameterDefault('cone.ribbonWidth'),
  ringsPattern: 'corridor',
  ringsMapping: 'wrap',
  ringsPerTile: getParameterDefault('cone.ringsPerTile'),
  ringsSpacing: getParameterDefault('cone.ringsSpacing'),
  ringsThickness: getParameterDefault('cone.ringsThickness'),
  ringsDepth: getParameterDefault('cone.ringsDepth'),
  ringsTwist: getParameterDefault('cone.ringsTwist'),
  ringsPulse: getParameterDefault('cone.ringsPulse'),
  ringsBeats: getParameterDefault('cone.ringsBeats'),
  ringsAmount: getParameterDefault('cone.ringsAmount'),
  fieldGeometry: 'mix',
  fieldRender: 'solid',
  fieldLoopCells: getParameterDefault('cone.fieldLoopCells'),
  fieldDensity: getParameterDefault('cone.fieldDensity'),
  fieldSize: getParameterDefault('cone.fieldSize'),
  fieldClearance: getParameterDefault('cone.fieldClearance'),
  fieldSpread: getParameterDefault('cone.fieldSpread'),
  fieldArms: getParameterDefault('cone.fieldArms'),
  fieldTwist: getParameterDefault('cone.fieldTwist'),
  fieldArmWidth: getParameterDefault('cone.fieldArmWidth'),
  fieldWire: getParameterDefault('cone.fieldWire'),
  fieldVariation: getParameterDefault('cone.fieldVariation'),
  discsForm: 'rings',
  discsCount: getParameterDefault('cone.discsCount'),
  discsGap: getParameterDefault('cone.discsGap'),
  discsThickness: getParameterDefault('cone.discsThickness'),
  discsSpread: getParameterDefault('cone.discsSpread'),
  discsWaves: getParameterDefault('cone.discsWaves'),
  discsScatter: getParameterDefault('cone.discsScatter'),
  discsSpinPattern: 'stagger',
  discsSpin: getParameterDefault('cone.discsSpin'),
  discsTwist: getParameterDefault('cone.discsTwist'),
  discsOffset: getParameterDefault('cone.discsOffset'),
  discsTilt: getParameterDefault('cone.discsTilt'),
  discsTiltTurns: getParameterDefault('cone.discsTiltTurns'),
  discsView: getParameterDefault('cone.discsView'),
  discsOrbit: getParameterDefault('cone.discsOrbit'),
  crystalMaterial: 'refract',
  crystalFaceOpacity: getParameterDefault('cone.crystalFaceOpacity'),
  crystalForm: 'quartz',
  crystalCount: getParameterDefault('cone.crystalCount'),
  crystalSize: getParameterDefault('cone.crystalSize'),
  crystalLength: getParameterDefault('cone.crystalLength'),
  crystalSpread: getParameterDefault('cone.crystalSpread'),
  crystalSeed: getParameterDefault('cone.crystalSeed'),
  crystalIor: getParameterDefault('cone.crystalIor'),
  crystalDispersion: getParameterDefault('cone.crystalDispersion'),
  crystalDispersionSteps: getParameterDefault('cone.crystalDispersionSteps'),
  crystalReflection: getParameterDefault('cone.crystalReflection'),
  crystalBackdrop: getParameterDefault('cone.crystalBackdrop'),
  crystalSpin: getParameterDefault('cone.crystalSpin'),
  crystalRevolve: getParameterDefault('cone.crystalRevolve'),
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
    coneTwist: clampParameter(raw.coneTwist, DEFAULT_CONE_VIEW.coneTwist, getParameterLimit('cone.coneTwist')),
    coneCameraMode: normalizeOption(raw.coneCameraMode, CONE_CAMERA_MODES, DEFAULT_CONE_VIEW.coneCameraMode),
    cameraX: clampParameter(raw.cameraX, DEFAULT_CONE_VIEW.cameraX, getParameterLimit('cone.cameraX')),
    cameraY: clampParameter(raw.cameraY, DEFAULT_CONE_VIEW.cameraY, getParameterLimit('cone.cameraY')),
    cameraYaw: clampParameter(raw.cameraYaw, DEFAULT_CONE_VIEW.cameraYaw, getParameterLimit('cone.cameraYaw')),
    cameraPitch: clampParameter(raw.cameraPitch, DEFAULT_CONE_VIEW.cameraPitch, getParameterLimit('cone.cameraPitch')),
    cameraFov: clampParameter(raw.cameraFov, DEFAULT_CONE_VIEW.cameraFov, getParameterLimit('cone.cameraFov')),
    fisheyeAngle: clampParameter(raw.fisheyeAngle, DEFAULT_CONE_VIEW.fisheyeAngle, getParameterLimit('cone.fisheyeAngle')),
    lensDistortion: clampParameter(raw.lensDistortion, DEFAULT_CONE_VIEW.lensDistortion, getParameterLimit('cone.lensDistortion')),
    cameraDolly: clampParameter(raw.cameraDolly, DEFAULT_CONE_VIEW.cameraDolly, getParameterLimit('cone.cameraDolly')),
    torusAim: clampParameter(raw.torusAim, DEFAULT_CONE_VIEW.torusAim, getParameterLimit('cone.torusAim')),
    wigglePreset: normalizeOption(raw.wigglePreset, CAMERA_WIGGLE_PRESETS, DEFAULT_CONE_VIEW.wigglePreset),
    wiggleAmount: clampParameter(raw.wiggleAmount, DEFAULT_CONE_VIEW.wiggleAmount, getParameterLimit('cone.wiggleAmount')),
    wiggleSpeed: clampParameter(raw.wiggleSpeed, DEFAULT_CONE_VIEW.wiggleSpeed, getParameterLimit('cone.wiggleSpeed')),
    latticeType: normalizeOption(raw.latticeType, LATTICE_TYPES, DEFAULT_CONE_VIEW.latticeType),
    latticeScale: clampParameter(raw.latticeScale, DEFAULT_CONE_VIEW.latticeScale, getParameterLimit('cone.latticeScale')),
    latticeThickness: clampParameter(raw.latticeThickness, DEFAULT_CONE_VIEW.latticeThickness, getParameterLimit('cone.latticeThickness')),
    terrainHeight: clampParameter(raw.terrainHeight, DEFAULT_CONE_VIEW.terrainHeight, getParameterLimit('cone.terrainHeight')),
    terrainAltitude: clampParameter(raw.terrainAltitude, DEFAULT_CONE_VIEW.terrainAltitude, getParameterLimit('cone.terrainAltitude')),
    ribbonCount: clampParameter(raw.ribbonCount, DEFAULT_CONE_VIEW.ribbonCount, getParameterLimit('cone.ribbonCount')),
    ribbonRadius: clampParameter(raw.ribbonRadius, DEFAULT_CONE_VIEW.ribbonRadius, getParameterLimit('cone.ribbonRadius')),
    ribbonStagger: clampParameter(raw.ribbonStagger, DEFAULT_CONE_VIEW.ribbonStagger, getParameterLimit('cone.ribbonStagger')),
    ribbonTwist: clampParameter(raw.ribbonTwist, DEFAULT_CONE_VIEW.ribbonTwist, getParameterLimit('cone.ribbonTwist')),
    ribbonLength: clampParameter(raw.ribbonLength, DEFAULT_CONE_VIEW.ribbonLength, getParameterLimit('cone.ribbonLength')),
    ribbonHalfTwists: clampParameter(raw.ribbonHalfTwists, DEFAULT_CONE_VIEW.ribbonHalfTwists, getParameterLimit('cone.ribbonHalfTwists')),
    ribbonWidth: clampParameter(raw.ribbonWidth, DEFAULT_CONE_VIEW.ribbonWidth, getParameterLimit('cone.ribbonWidth')),
    ringsPattern: normalizeOption(raw.ringsPattern, RINGS_PATTERNS, DEFAULT_CONE_VIEW.ringsPattern),
    ringsMapping: normalizeOption(raw.ringsMapping, RINGS_MAPPINGS, DEFAULT_CONE_VIEW.ringsMapping),
    ringsPerTile: clampParameter(raw.ringsPerTile, DEFAULT_CONE_VIEW.ringsPerTile, getParameterLimit('cone.ringsPerTile')),
    ringsSpacing: clampParameter(raw.ringsSpacing, DEFAULT_CONE_VIEW.ringsSpacing, getParameterLimit('cone.ringsSpacing')),
    ringsThickness: clampParameter(raw.ringsThickness, DEFAULT_CONE_VIEW.ringsThickness, getParameterLimit('cone.ringsThickness')),
    ringsDepth: clampParameter(raw.ringsDepth, DEFAULT_CONE_VIEW.ringsDepth, getParameterLimit('cone.ringsDepth')),
    ringsTwist: clampParameter(raw.ringsTwist, DEFAULT_CONE_VIEW.ringsTwist, getParameterLimit('cone.ringsTwist')),
    ringsPulse: clampParameter(raw.ringsPulse, DEFAULT_CONE_VIEW.ringsPulse, getParameterLimit('cone.ringsPulse')),
    ringsBeats: clampParameter(raw.ringsBeats, DEFAULT_CONE_VIEW.ringsBeats, getParameterLimit('cone.ringsBeats')),
    ringsAmount: clampParameter(raw.ringsAmount, DEFAULT_CONE_VIEW.ringsAmount, getParameterLimit('cone.ringsAmount')),
    fieldGeometry: normalizeOption(raw.fieldGeometry, FIELD_GEOMETRIES, DEFAULT_CONE_VIEW.fieldGeometry),
    fieldRender: normalizeOption(raw.fieldRender, FIELD_RENDERS, DEFAULT_CONE_VIEW.fieldRender),
    fieldLoopCells: clampParameter(raw.fieldLoopCells, DEFAULT_CONE_VIEW.fieldLoopCells, getParameterLimit('cone.fieldLoopCells')),
    fieldDensity: clampParameter(raw.fieldDensity, DEFAULT_CONE_VIEW.fieldDensity, getParameterLimit('cone.fieldDensity')),
    fieldSize: clampParameter(raw.fieldSize, DEFAULT_CONE_VIEW.fieldSize, getParameterLimit('cone.fieldSize')),
    fieldClearance: clampParameter(raw.fieldClearance, DEFAULT_CONE_VIEW.fieldClearance, getParameterLimit('cone.fieldClearance')),
    fieldSpread: clampParameter(raw.fieldSpread, DEFAULT_CONE_VIEW.fieldSpread, getParameterLimit('cone.fieldSpread')),
    fieldArms: clampParameter(raw.fieldArms, DEFAULT_CONE_VIEW.fieldArms, getParameterLimit('cone.fieldArms')),
    fieldTwist: clampParameter(raw.fieldTwist, DEFAULT_CONE_VIEW.fieldTwist, getParameterLimit('cone.fieldTwist')),
    fieldArmWidth: clampParameter(raw.fieldArmWidth, DEFAULT_CONE_VIEW.fieldArmWidth, getParameterLimit('cone.fieldArmWidth')),
    fieldWire: clampParameter(raw.fieldWire, DEFAULT_CONE_VIEW.fieldWire, getParameterLimit('cone.fieldWire')),
    fieldVariation: clampParameter(raw.fieldVariation, DEFAULT_CONE_VIEW.fieldVariation, getParameterLimit('cone.fieldVariation')),
    discsForm: normalizeOption(raw.discsForm, DISCS_FORMS, DEFAULT_CONE_VIEW.discsForm),
    discsCount: clampParameter(raw.discsCount, DEFAULT_CONE_VIEW.discsCount, getParameterLimit('cone.discsCount')),
    discsGap: clampParameter(raw.discsGap, DEFAULT_CONE_VIEW.discsGap, getParameterLimit('cone.discsGap')),
    discsThickness: clampParameter(raw.discsThickness, DEFAULT_CONE_VIEW.discsThickness, getParameterLimit('cone.discsThickness')),
    discsSpread: clampParameter(raw.discsSpread, DEFAULT_CONE_VIEW.discsSpread, getParameterLimit('cone.discsSpread')),
    discsWaves: clampParameter(raw.discsWaves, DEFAULT_CONE_VIEW.discsWaves, getParameterLimit('cone.discsWaves')),
    discsScatter: clampParameter(raw.discsScatter, DEFAULT_CONE_VIEW.discsScatter, getParameterLimit('cone.discsScatter')),
    discsSpinPattern: normalizeOption(raw.discsSpinPattern, DISCS_SPIN_PATTERNS, DEFAULT_CONE_VIEW.discsSpinPattern),
    discsSpin: clampParameter(raw.discsSpin, DEFAULT_CONE_VIEW.discsSpin, getParameterLimit('cone.discsSpin')),
    discsTwist: clampParameter(raw.discsTwist, DEFAULT_CONE_VIEW.discsTwist, getParameterLimit('cone.discsTwist')),
    discsOffset: clampParameter(raw.discsOffset, DEFAULT_CONE_VIEW.discsOffset, getParameterLimit('cone.discsOffset')),
    discsTilt: clampParameter(raw.discsTilt, DEFAULT_CONE_VIEW.discsTilt, getParameterLimit('cone.discsTilt')),
    discsTiltTurns: clampParameter(raw.discsTiltTurns, DEFAULT_CONE_VIEW.discsTiltTurns, getParameterLimit('cone.discsTiltTurns')),
    discsView: clampParameter(raw.discsView, DEFAULT_CONE_VIEW.discsView, getParameterLimit('cone.discsView')),
    discsOrbit: clampParameter(raw.discsOrbit, DEFAULT_CONE_VIEW.discsOrbit, getParameterLimit('cone.discsOrbit')),
    crystalMaterial: normalizeOption(raw.crystalMaterial, CRYSTAL_MATERIALS, DEFAULT_CONE_VIEW.crystalMaterial),
    crystalFaceOpacity: clampParameter(raw.crystalFaceOpacity, DEFAULT_CONE_VIEW.crystalFaceOpacity, getParameterLimit('cone.crystalFaceOpacity')),
    crystalForm: normalizeOption(raw.crystalForm, CRYSTAL_FORMS, DEFAULT_CONE_VIEW.crystalForm),
    crystalCount: clampParameter(raw.crystalCount, DEFAULT_CONE_VIEW.crystalCount, getParameterLimit('cone.crystalCount')),
    crystalSize: clampParameter(raw.crystalSize, DEFAULT_CONE_VIEW.crystalSize, getParameterLimit('cone.crystalSize')),
    crystalLength: clampParameter(raw.crystalLength, DEFAULT_CONE_VIEW.crystalLength, getParameterLimit('cone.crystalLength')),
    crystalSpread: clampParameter(raw.crystalSpread, DEFAULT_CONE_VIEW.crystalSpread, getParameterLimit('cone.crystalSpread')),
    crystalSeed: clampParameter(raw.crystalSeed, DEFAULT_CONE_VIEW.crystalSeed, getParameterLimit('cone.crystalSeed')),
    crystalIor: clampParameter(raw.crystalIor, DEFAULT_CONE_VIEW.crystalIor, getParameterLimit('cone.crystalIor')),
    crystalDispersion: clampParameter(raw.crystalDispersion, DEFAULT_CONE_VIEW.crystalDispersion, getParameterLimit('cone.crystalDispersion')),
    crystalDispersionSteps: clampParameter(raw.crystalDispersionSteps, DEFAULT_CONE_VIEW.crystalDispersionSteps, getParameterLimit('cone.crystalDispersionSteps')),
    crystalReflection: clampParameter(raw.crystalReflection, DEFAULT_CONE_VIEW.crystalReflection, getParameterLimit('cone.crystalReflection')),
    crystalBackdrop: clampParameter(raw.crystalBackdrop, DEFAULT_CONE_VIEW.crystalBackdrop, getParameterLimit('cone.crystalBackdrop')),
    crystalSpin: clampParameter(raw.crystalSpin, DEFAULT_CONE_VIEW.crystalSpin, getParameterLimit('cone.crystalSpin')),
    crystalRevolve: clampParameter(raw.crystalRevolve, DEFAULT_CONE_VIEW.crystalRevolve, getParameterLimit('cone.crystalRevolve')),
  };
}
