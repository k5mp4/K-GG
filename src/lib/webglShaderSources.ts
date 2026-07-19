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
import postprocessMainGLSL from '../shaders/postprocess/main.glsl?raw';
import postprocessNoiseMainGLSL from '../shaders/postprocess/noise-main.glsl?raw';
import prismCompositeGLSL from '../shaders/prismComposite.frag.glsl?raw';
import particlesVertexGLSL from '../shaders/particles.vert.glsl?raw';
import particlesFragmentGLSL from '../shaders/particles.frag.glsl?raw';

const postprocessGLSL = [
  postprocessUniformsGLSL,
  postprocessSharedGLSL,
  postprocessPrismGLSL,
  postprocessStackGLSL,
  postprocessDiffuseGLSL,
  postprocessGlassFieldGLSL,
  postprocessGlassOpticsGLSL,
  postprocessMainGLSL,
].join('');

export type LazyProgramKey =
  | 'generator'
  | 'blur'
  | 'normalMap'
  | 'stretch'
  | 'stackCore'
  | 'noiseStack'
  | 'glass'
  | 'glassV2'
  | 'prism'
  | 'postprocess'
  | 'prismComposite'
  | 'particles';

export type ProgramSource = {
  vertex: string;
  fragment: string;
};

/** Bump this automatically when any shader source changes. */
export const SHADER_VERSION = (
  gradientGLSL.length * 1000003
  + noiseGLSL.length
  + normalMapGLSL.length * 997
  + stretchGLSL.length * 313
  + postprocessGLSL.length * 191
  + postprocessNoiseMainGLSL.length * 179
  + prismCompositeGLSL.length * 127
  + particlesVertexGLSL.length * 89
  + particlesFragmentGLSL.length * 83
) | 0;

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
uniform int u_aeFractalType;
uniform float u_aeSubInfluence;
uniform float u_aeSubScaling;
uniform float u_aeSubRotation;
uniform float u_aeContrast;
uniform float u_aeBrightness;
`;

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
  define: 'KGG_LEGACY_GLASS_ONLY' | 'KGG_GLASS_V2_ONLY' | 'KGG_PRISM_ONLY',
): string {
  const glassOnly = define === 'KGG_LEGACY_GLASS_ONLY' || define === 'KGG_GLASS_V2_ONLY';
  const specializedSource = glassOnly
    ? [
        postprocessUniformsGLSL,
        postprocessSharedGLSL,
        GLASS_DIFFUSE_STUBS_GLSL,
        postprocessGlassFieldGLSL,
        postprocessGlassOpticsGLSL,
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

function createNoiseStackSource(): string {
  const noiseSource = noiseGLSL
    .replace('uniform vec2 u_resolution;', 'uniform vec2 u_fullResolution;')
    .replaceAll('u_resolution', 'u_fullResolution');
  return [
    noiseSource,
    '\n#define KGG_LIGHTWEIGHT\n#define KGG_STACK_NOISE_ONLY\n',
    postprocessUniformsGLSL,
    postprocessStackGLSL,
    postprocessNoiseMainGLSL,
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

/**
 * Returns the exact source pair for one lazy program. Keeping this mapping
 * declarative makes the compile boundary reviewable and testable without a
 * WebGL context.
 */
export function getProgramSource(key: LazyProgramKey): ProgramSource {
  if (key === 'generator') return { vertex: vertexGLSL, fragment: `${noiseGLSL}\n${gradientGLSL}` };
  if (key === 'blur') return { vertex: vertexGLSL, fragment: blurGLSL };
  if (key === 'normalMap') return { vertex: vertexGLSL, fragment: normalMapGLSL };
  if (key === 'stretch') return { vertex: vertexGLSL, fragment: stretchGLSL };
  if (key === 'stackCore') return { vertex: vertexGLSL, fragment: createStackCoreSource() };
  if (key === 'noiseStack') return { vertex: vertexGLSL, fragment: createNoiseStackSource() };
  if (key === 'glass') return { vertex: vertexGLSL, fragment: createSpecializedPostprocessSource('KGG_LEGACY_GLASS_ONLY') };
  if (key === 'glassV2') return { vertex: vertexGLSL, fragment: createSpecializedPostprocessSource('KGG_GLASS_V2_ONLY') };
  if (key === 'prism') return { vertex: vertexGLSL, fragment: createSpecializedPostprocessSource('KGG_PRISM_ONLY') };
  if (key === 'postprocess') return { vertex: vertexGLSL, fragment: createGeneralPostprocessSource() };
  if (key === 'prismComposite') return { vertex: vertexGLSL, fragment: prismCompositeGLSL };
  return { vertex: particlesVertexGLSL, fragment: particlesFragmentGLSL };
}

export function getInitialProgramSource(): ProgramSource {
  // The bootstrap program keeps the canvas out of the CPU-only fallback while
  // the full generator remains lazy. Its noise transform is an
  // identity, but base gradients, source images, Slit, and Diffuse stay live.
  const begin = noiseGLSL.indexOf('// KGG_BOOTSTRAP_NOISE_BEGIN');
  const end = noiseGLSL.indexOf('// KGG_BOOTSTRAP_NOISE_END');
  const bootstrapNoise = begin >= 0 && end >= begin
    ? noiseGLSL.slice(0, begin) + noiseGLSL.slice(end + '// KGG_BOOTSTRAP_NOISE_END'.length)
    : noiseGLSL;
  return { vertex: vertexGLSL, fragment: `${bootstrapNoise}\n#define KGG_BOOTSTRAP\n${gradientGLSL}` };
}
