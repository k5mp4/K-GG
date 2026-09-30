import noiseGLSL from '../shaders/noise.glsl?raw';
import vertexGLSL from '../shaders/vertex.vert.glsl?raw';
import gradientGLSL from '../shaders/gradient.frag.glsl?raw';
import blurGLSL from '../shaders/blur.frag.glsl?raw';
import normalMapGLSL from '../shaders/normalmap.frag.glsl?raw';
import stretchGLSL from '../shaders/stretch.frag.glsl?raw';
import postprocessUniformsGLSL from '../shaders/postprocess/uniforms.glsl?raw';
import postprocessSharedGLSL from '../shaders/postprocess/shared.glsl?raw';
import postprocessPrismGLSL from '../shaders/postprocess/prism.glsl?raw';
import postprocessStackGLSL from '../shaders/postprocess/stack.glsl?raw';
import postprocessDiffuseGLSL from '../shaders/postprocess/diffuse.glsl?raw';
import postprocessGlassFieldGLSL from '../shaders/postprocess/glass-field.glsl?raw';
import postprocessGlassOpticsGLSL from '../shaders/postprocess/glass-optics.glsl?raw';
import postprocessGlassCompactGLSL from '../shaders/postprocess/glass-compact.glsl?raw';
import postprocessGlassTileGLSL from '../shaders/postprocess/glass-tile.glsl?raw';
import postprocessMainGLSL from '../shaders/postprocess/main.glsl?raw';
import postprocessNoiseMainGLSL from '../shaders/postprocess/noise-main.glsl?raw';
import postprocessNoiseDiffuseMainGLSL from '../shaders/postprocess/noise-diffuse-main.glsl?raw';
import prismCompositeGLSL from '../shaders/prismComposite.frag.glsl?raw';
import particlesVertexGLSL from '../shaders/particles.vert.glsl?raw';
import particlesFragmentGLSL from '../shaders/particles.frag.glsl?raw';
import seamlessGLSL from '../shaders/seamless.frag.glsl?raw';
import flowSplatVertexGLSL from '../shaders/flow-splat.vert.glsl?raw';
import flowSplatFragmentGLSL from '../shaders/flow-splat.frag.glsl?raw';
import flowTrailFragmentGLSL from '../shaders/flow-trail.frag.glsl?raw';
import flowGradientFragmentGLSL from '../shaders/flow-gradient.frag.glsl?raw';
import datamoshUniformsGLSL from '../shaders/datamosh/uniforms.glsl?raw';
import datamoshMotionFieldGLSL from '../shaders/datamosh/motion-field.glsl?raw';
import datamoshMainGLSL from '../shaders/datamosh/main.glsl?raw';
import threeDGLSL from '../shaders/three-d.frag.glsl?raw';
import textureGLSL from '../shaders/texture.frag.glsl?raw';
import { CONE_GRADIENT_REAPPLY_SHADER } from './coneSeam';

const postprocessGLSL = [
  postprocessUniformsGLSL,
  postprocessSharedGLSL,
  postprocessPrismGLSL,
  postprocessStackGLSL,
  postprocessDiffuseGLSL,
  postprocessGlassFieldGLSL,
  postprocessGlassOpticsGLSL,
  postprocessGlassTileGLSL,
  postprocessMainGLSL,
].join('');

// The motion field is a separate chunk so another source (codec vectors,
// optical flow) can replace it without touching the feedback composite.
const datamoshGLSL = [
  datamoshUniformsGLSL,
  datamoshMotionFieldGLSL,
  datamoshMainGLSL,
].join('\n');

export type LazyProgramKey =
  | 'generator'
  | 'blur'
  | 'normalMap'
  | 'stretch'
  | 'stackCore'
  | 'noiseStack'
  | 'noiseDiffuseStack'
  | 'glass'
  | 'glassV2'
  | 'glassTile'
  | 'prism'
  | 'postprocess'
  | 'prismComposite'
  | 'particles'
  | 'seamless'
  | 'flowSplat'
  | 'flowTrail'
  | 'flowComposite'
  | 'datamosh'
  | 'threeD'
  | 'texture';

export type ProgramSource = {
  vertex: string;
  fragment: string;
};

function normalizeShaderLineEndings(source: string): string {
  return source.replace(/\r\n?/g, '\n');
}

// Keep the specialized programs independent from the declaration order in
// noise.glsl. This is the intentionally small contract shared by Glass/Prism
// and the postprocess shader; the full noise implementation is not needed by
// either program.
const SPECIALIZED_NOISE_UNIFORMS = `
uniform float u_time;
uniform float u_noiseLoopPeriod;
uniform int u_noiseLoopMode;
uniform float u_noiseLoopBlend;
uniform vec2 u_animDir;
uniform vec2 u_fullResolution;
uniform float u_dwInitVal;
uniform float u_dwInitAmp;
uniform float u_dwRotAngle1;
uniform float u_dwRotAngle2;
uniform float u_dwDist1;
uniform float u_dwDist2;
uniform float u_dwDist3;
uniform float u_dwDriftAngle;
uniform int u_noiseSeamlessType;
uniform int u_seamlessAnimation;
uniform float u_seamlessTwist;
uniform int u_voronoiDistMetric;
uniform float u_voronoiRandomness;
uniform int u_voronoiFeature;
uniform float u_voronoiMinkowskiExp;
uniform float u_noiseSeed;
uniform float u_ridgeSharpness;
uniform float u_ridgeGain;
uniform float u_ridgeLacunarity;
uniform float u_ridgePersistence;
uniform float u_ridgeOffset;
uniform float u_ridgeWarp;
uniform float u_perlinRoughness;
uniform float u_perlinSharpness;
uniform float u_perlinLayerMix;
uniform float u_perlinAngle;
uniform int u_perlinDimension;
uniform float u_perlinLoopWobble;
uniform int u_aeFractalType;
uniform float u_aeSubInfluence;
uniform float u_aeSubScaling;
uniform float u_aeSubRotation;
uniform float u_aeContrast;
uniform float u_aeBrightness;
`;

// Caustics, Phasor, and Chladni uniforms are intentionally absent here: specialized
// Glass/Prism programs do not evaluate Noise. The full generator, general
// postprocess, and V2 noiseStack receive them from noise.glsl exactly once.

// noise.glsl owns the time, loop, fractal, and seamless-noise uniforms. The
// dedicated V2 Noise pass must add only its texture interface and the few
// controls that belong to the stack layer; appending postprocess/uniforms.glsl
// would redeclare those noise uniforms and fail GLSL compilation.
const NOISE_STACK_UNIFORMS = `
uniform sampler2D u_sourceTex;
uniform vec2 u_tileResolution;
uniform vec2 u_tileOffset;
uniform bool u_noiseEnabled;
uniform int u_noiseType;
uniform float u_noiseAmount;
uniform float u_noiseScale;
uniform int u_noiseOctaves;
uniform float u_noiseEvolution;
`;

const NOISE_DIFFUSE_STACK_UNIFORMS = `
const float PI = 3.141592653589793;
uniform bool u_diffuseEnabled;
uniform int u_diffuseMode;
uniform float u_diffuseScatter;
uniform float u_diffuseGrain;
uniform float u_diffuseSeed;
uniform bool u_diffuseAdaptiveEnabled;
uniform int u_diffuseAdaptiveChannel;
uniform bool u_diffuseGrainAdaptiveEnabled;
uniform float u_diffuseGrainAdaptiveAmount;
uniform sampler2D u_diffuseCurve;
`;

/** Bump this automatically when any shader source changes. */
export const SHADER_VERSION = (
  gradientGLSL.length * 1000003
  + noiseGLSL.length
  + normalMapGLSL.length * 997
  + stretchGLSL.length * 313
  + postprocessGLSL.length * 191
  + postprocessGlassCompactGLSL.length * 173
  + postprocessGlassTileGLSL.length * 187
  + postprocessNoiseMainGLSL.length * 179
  + postprocessNoiseDiffuseMainGLSL.length * 181
  + NOISE_STACK_UNIFORMS.length * 167
  + NOISE_DIFFUSE_STACK_UNIFORMS.length * 163
  + prismCompositeGLSL.length * 127
  + particlesVertexGLSL.length * 89
  + particlesFragmentGLSL.length * 83
  + seamlessGLSL.length * 71
  + flowSplatVertexGLSL.length * 67
  + flowSplatFragmentGLSL.length * 61
  + flowTrailFragmentGLSL.length * 59
  + flowGradientFragmentGLSL.length * 53
  + datamoshGLSL.length * 47
  + threeDGLSL.length * 43
  + textureGLSL.length * 41
) | 0;

// Keep these symbols in the dedicated Glass sources explicitly instead of
// depending on the full Diffuse module and its preprocessor branches. V2
// renders Diffuse in a separate stack pass, so both Glass variants only need
// identity implementations for the two functions they call.
const GLASS_DIFFUSE_STUBS_GLSL = `
#if defined(KGG_GLASS_ONLY)
vec2 diffusePanelDisplacement(vec2 globalCoord) {
  return vec2(0.0);
}

vec4 applyDiffuseDither(vec4 color, vec2 globalCoord) {
  return color;
}
#else
#if defined(KGG_PRISM_ONLY)
vec2 diffuseHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;
}
#endif
#endif
`;

function createSpecializedPostprocessSource(
  define: 'KGG_LEGACY_GLASS_ONLY' | 'KGG_GLASS_V2_ONLY' | 'KGG_GLASS_TILE_ONLY' | 'KGG_PRISM_ONLY',
): string {
  const glassOnly = define === 'KGG_LEGACY_GLASS_ONLY'
    || define === 'KGG_GLASS_V2_ONLY'
    || define === 'KGG_GLASS_TILE_ONLY';
  const specializedSource = glassOnly
    ? [
        postprocessUniformsGLSL,
        postprocessSharedGLSL,
        GLASS_DIFFUSE_STUBS_GLSL,
        define === 'KGG_GLASS_TILE_ONLY' ? postprocessGlassTileGLSL : postprocessGlassCompactGLSL,
        postprocessMainGLSL,
      ].join('')
    : [
        postprocessUniformsGLSL,
        postprocessSharedGLSL,
        postprocessPrismGLSL,
        postprocessDiffuseGLSL,
        postprocessMainGLSL,
      ].join('');
  return specializedSource.replace(
    'precision highp float;',
    `precision highp float;\n${SPECIALIZED_NOISE_UNIFORMS}\n${glassOnly ? '#define KGG_GLASS_ONLY\n' : ''}#define ${define}`,
  );
}

// The 3D program is compiled as GLSL ES 3.00 so the Geometry Field can read
// its model atlas with explicit LOD inside the ray-march loop: implicit
// derivatives there make ANGLE slow down every shape in the program. The
// shader keeps its ES 1.00 spelling through these aliases.
const THREE_D_VERTEX_SOURCE = `#version 300 es
in vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const THREE_D_FRAGMENT_PRELUDE = `#version 300 es
precision highp float;
out vec4 kggThreeDColor;
#define gl_FragColor kggThreeDColor
#define texture2D texture
`;

// The 3D layer's seam modes share the Gradient Reapply implementation with
// the CPU reference in coneSeam.ts; splice it into the dedicated program.
function createThreeDSource(): string {
  return THREE_D_FRAGMENT_PRELUDE + threeDGLSL.replace('// KGG_CONE_GRADIENT_REAPPLY_SHADER', CONE_GRADIENT_REAPPLY_SHADER);
}

function createStackCoreSource(): string {
  // The ordinary stack never evaluates Noise. Keeping its large procedural
  // implementation out of this program is important on ANGLE, where merely
  // compiling the unused Noise branches can take tens of seconds.
  return [
    '#define KGG_LIGHTWEIGHT\n#define KGG_STACK_CORE_NO_NOISE\n',
    postprocessUniformsGLSL,
    'uniform vec2 u_fullResolution;\nuniform float u_time;\nuniform float u_noiseLoopPeriod;\nuniform float u_noiseSeed;\n',
    'vec2 diffuseHash(vec2 p) {\n  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));\n  p3 += dot(p3, p3.yzx + 33.33);\n  return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;\n}\n',
    postprocessSharedGLSL,
    postprocessStackGLSL,
    postprocessDiffuseGLSL,
    postprocessMainGLSL,
  ].join('');
}

function createNoiseStackPrefix(extraUniforms = '', highPrecision = false): string {
  const noiseSource = noiseGLSL
    .replace(
      'precision mediump float;',
      highPrecision ? 'precision highp float;' : 'precision mediump float;',
    )
    .replace(
      'uniform vec2 u_resolution;',
      `uniform ${highPrecision ? 'highp ' : ''}vec2 u_fullResolution;`,
    )
    .replaceAll('u_resolution', 'u_fullResolution');
  return [
    noiseSource,
    '\n#define KGG_LIGHTWEIGHT\n#define KGG_STACK_NOISE_ONLY\n',
    NOISE_STACK_UNIFORMS,
    extraUniforms,
    postprocessStackGLSL,
  ].join('');
}

function createNoiseStackSource(): string {
  return [
    createNoiseStackPrefix(),
    postprocessNoiseMainGLSL,
  ].join('');
}

function createNoiseDiffuseStackSource(): string {
  return [
    createNoiseStackPrefix(`${NOISE_DIFFUSE_STACK_UNIFORMS}\n#define KGG_DIFFUSE_DISPLACEMENT_ONLY\n`, true),
    postprocessDiffuseGLSL,
    postprocessNoiseDiffuseMainGLSL,
  ].join('');
}

function createGeneralPostprocessSource(): string {
  return noiseGLSL
    .replace('uniform vec2 u_resolution;', 'uniform vec2 u_fullResolution;')
    .replaceAll('u_resolution', 'u_fullResolution')
    + '\n'
    + postprocessGLSL;
}

/** Returns the assembled postprocess fragment before variant-specific prefixes. */
export function getPostprocessFragmentSource(): string {
  return postprocessGLSL;
}

/** Shader-side Noise type index (`u_noiseType`, `KGG_NOISE_VARIANT`). */
export const NOISE_TYPE_MAP = { simplex: 0, fbm: 1, voronoi: 2, curl: 3, domain_warp_anim: 4, seamless: 5, ridged_fbm: 6, ae_fractal: 7, fast_curl: 8, caustics: 9, phasor: 10, perlin: 11, chladni: 12 } as const;

/**
 * Programs that evaluate the Noise dispatcher. They are compiled per Noise
 * type (`KGG_NOISE_VARIANT`) because a program holding every algorithm takes
 * tens of seconds to over a minute to compile on ANGLE/Direct3D.
 */
export const NOISE_VARIANT_PROGRAM_KEYS = ['generator', 'noiseStack', 'noiseDiffuseStack'] as const;
export type NoiseVariantProgramKey = typeof NOISE_VARIANT_PROGRAM_KEYS[number];

export function isNoiseVariantProgramKey(key: LazyProgramKey): key is NoiseVariantProgramKey {
  return (NOISE_VARIANT_PROGRAM_KEYS as readonly LazyProgramKey[]).includes(key);
}

/**
 * The Generator without Noise and Manual Distort. It is exactly the bootstrap
 * program, which is compiled during initialization, so it never needs a lazy
 * compile. V2 frames use it unless the analytic prefix consumes Noise.
 */
export const GENERATOR_WITHOUT_NOISE_VARIANT = -1;

export type ProgramSourceOptions = {
  /** NOISE_TYPE_MAP index for a program in NOISE_VARIANT_PROGRAM_KEYS. Omitted keeps every Noise type. */
  noiseVariant?: number;
};

function withNoiseVariant(fragment: string, noiseVariant: number | undefined): string {
  if (noiseVariant === undefined || noiseVariant < 0) return fragment;
  return `#define KGG_NOISE_VARIANT ${Math.trunc(noiseVariant)}\n${fragment}`;
}

/**
 * Returns the exact source pair for one lazy program. Keeping this mapping
 * declarative makes the compile boundary reviewable and testable without a
 * WebGL context.
 */
export function getProgramSource(key: LazyProgramKey, options: ProgramSourceOptions = {}): ProgramSource {
  const source = getBaseProgramSource(key);
  if (!isNoiseVariantProgramKey(key)) return source;
  return { vertex: source.vertex, fragment: withNoiseVariant(source.fragment, options.noiseVariant) };
}

function getBaseProgramSource(key: LazyProgramKey): ProgramSource {
  if (key === 'generator') return { vertex: vertexGLSL, fragment: `${noiseGLSL}\n${gradientGLSL}` };
  if (key === 'blur') return { vertex: vertexGLSL, fragment: blurGLSL };
  if (key === 'normalMap') return { vertex: vertexGLSL, fragment: normalMapGLSL };
  if (key === 'stretch') return { vertex: vertexGLSL, fragment: stretchGLSL };
  if (key === 'stackCore') return { vertex: vertexGLSL, fragment: createStackCoreSource() };
  if (key === 'noiseStack') return { vertex: vertexGLSL, fragment: createNoiseStackSource() };
  if (key === 'noiseDiffuseStack') return { vertex: vertexGLSL, fragment: createNoiseDiffuseStackSource() };
  if (key === 'glass') return { vertex: vertexGLSL, fragment: createSpecializedPostprocessSource('KGG_LEGACY_GLASS_ONLY') };
  if (key === 'glassV2') return { vertex: vertexGLSL, fragment: createSpecializedPostprocessSource('KGG_GLASS_V2_ONLY') };
  if (key === 'glassTile') return { vertex: vertexGLSL, fragment: createSpecializedPostprocessSource('KGG_GLASS_TILE_ONLY') };
  if (key === 'prism') return { vertex: vertexGLSL, fragment: createSpecializedPostprocessSource('KGG_PRISM_ONLY') };
  if (key === 'postprocess') return { vertex: vertexGLSL, fragment: createGeneralPostprocessSource() };
  if (key === 'prismComposite') return { vertex: vertexGLSL, fragment: prismCompositeGLSL };
  if (key === 'seamless') return { vertex: vertexGLSL, fragment: seamlessGLSL };
  if (key === 'flowSplat') return { vertex: flowSplatVertexGLSL, fragment: flowSplatFragmentGLSL };
  if (key === 'flowTrail') return { vertex: vertexGLSL, fragment: flowTrailFragmentGLSL };
  if (key === 'flowComposite') return { vertex: vertexGLSL, fragment: flowGradientFragmentGLSL };
  if (key === 'datamosh') return { vertex: vertexGLSL, fragment: datamoshGLSL };
  if (key === 'threeD') return { vertex: THREE_D_VERTEX_SOURCE, fragment: createThreeDSource() };
  if (key === 'texture') return { vertex: vertexGLSL, fragment: textureGLSL };
  return { vertex: particlesVertexGLSL, fragment: particlesFragmentGLSL };
}

export function getInitialProgramSource(): ProgramSource {
  // The bootstrap program keeps the canvas out of the CPU-only fallback while
  // the full generator remains lazy, and it is the V2 Generator whenever
  // Noise is not folded into it. Noise and Manual Distort are omitted, but
  // base gradients, source images, Slit, and Diffuse stay live.
  const begin = noiseGLSL.indexOf('// KGG_BOOTSTRAP_NOISE_BEGIN');
  const end = noiseGLSL.indexOf('// KGG_BOOTSTRAP_NOISE_END');
  const bootstrapNoise = begin >= 0 && end >= begin
    ? noiseGLSL.slice(0, begin) + noiseGLSL.slice(end + '// KGG_BOOTSTRAP_NOISE_END'.length)
    : noiseGLSL;
  return {
    vertex: normalizeShaderLineEndings(vertexGLSL),
    fragment: normalizeShaderLineEndings(`${bootstrapNoise}\n#define KGG_BOOTSTRAP\n${gradientGLSL}`),
  };
}
