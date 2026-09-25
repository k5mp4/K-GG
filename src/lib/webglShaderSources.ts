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
import videoMotionGLSL from '../shaders/video-motion.frag.glsl?raw';
import { CONE_GRADIENT_REAPPLY_SHADER } from './coneSeam';

// The orderable Cone layer projects the preceding stack texture onto the same
// open cone surface used by ConeViewRenderer. Keeping this shader beside the
// seam reference preserves the existing input-texture mapping instead of
// synthesizing a separate color ramp.
const coneStackGLSL = `
#if !defined(KGG_STACK_NOISE_ONLY)
vec4 coneTextureLookup(vec2 uv) {
  return texture2D(u_sourceTex, sourceUvFromGlobal(uv));
}

float coneSeamWeight(float coordinate, float blendWidth) {
  float distanceToSeam = min(coordinate, 1.0 - coordinate);
  return 1.0 - smoothstep(0.0, max(blendWidth, 0.00001), distanceToSeam);
}

vec2 coneMirrorRepeatUv(vec2 uv) {
  return abs(fract(uv) * 2.0 - 1.0);
}

vec4 coneMirrorRepeatSample(vec2 uv, float blendWidth) {
  vec2 tiledUv = fract(uv);
  float seamWeight = max(coneSeamWeight(tiledUv.x, blendWidth), coneSeamWeight(tiledUv.y, blendWidth));
  vec4 normal = coneTextureLookup(tiledUv);
  if (seamWeight <= 0.0) return normal;
  vec4 mirrored = coneTextureLookup(coneMirrorRepeatUv(uv));
  return mix(normal, mirrored, seamWeight);
}

vec4 coneEdgeWeldSample(vec2 uv, float blendWidth) {
  float seamX = coneSeamWeight(uv.x, blendWidth);
  float seamY = coneSeamWeight(uv.y, blendWidth);
  vec4 center = coneTextureLookup(uv);
  vec4 welded = center;
  if (seamX > 0.0) {
    vec4 edgeX = 0.5 * (
      coneTextureLookup(vec2(0.0, uv.y)) +
      coneTextureLookup(vec2(1.0, uv.y))
    );
    welded = mix(welded, edgeX, seamX);
  }
  if (seamY > 0.0) {
    vec4 edgeY = 0.5 * (
      coneTextureLookup(vec2(uv.x, 0.0)) +
      coneTextureLookup(vec2(uv.x, 1.0))
    );
    welded = mix(welded, edgeY, seamY);
  }
  if (seamX > 0.0 && seamY > 0.0) {
    vec4 corners = 0.25 * (
      coneTextureLookup(vec2(0.0, 0.0)) +
      coneTextureLookup(vec2(1.0, 0.0)) +
      coneTextureLookup(vec2(0.0, 1.0)) +
      coneTextureLookup(vec2(1.0, 1.0))
    );
    welded = mix(welded, corners, seamX * seamY);
  }
  return welded;
}

${CONE_GRADIENT_REAPPLY_SHADER}

vec2 coneMappedUv(vec2 globalUv, out bool hitCone) {
  float aspect = u_fullResolution.x / max(u_fullResolution.y, 1.0);
  vec2 ndc = globalUv * 2.0 - 1.0;
  vec3 rayDirection = vec3(
    ndc.x * aspect * u_coneTangentHalfFov,
    ndc.y * u_coneTangentHalfFov,
    -1.0
  );
  float depth = max(u_coneDepth, 0.001);
  float cameraDistance = max(u_coneCameraDistance, 0.001);
  vec2 apexOffset = u_coneApexOffset;
  vec2 rayFromBase = rayDirection.xy - apexOffset / depth;
  vec2 baseOffset = apexOffset * cameraDistance / depth;
  float radiusSlope = u_coneApertureRadius / depth;
  float radiusIntercept = u_coneApertureRadius * (cameraDistance + depth) / depth;
  float qa = dot(rayFromBase, rayFromBase) - radiusSlope * radiusSlope;
  float qb = 2.0 * dot(rayFromBase, baseOffset) + 2.0 * radiusSlope * radiusIntercept;
  float qc = dot(baseOffset, baseOffset) - radiusIntercept * radiusIntercept;
  hitCone = false;
  float minDistance = cameraDistance;
  float maxDistance = cameraDistance + depth;
  float distance = maxDistance + 1.0;
  if (abs(qa) < 0.000001) {
    if (abs(qb) < 0.000001) return vec2(0.0);
    float linearDistance = -qc / qb;
    if (linearDistance >= minDistance && linearDistance <= maxDistance) distance = linearDistance;
  } else {
    float discriminant = qb * qb - 4.0 * qa * qc;
    if (discriminant < 0.0) return vec2(0.0);
    float root = sqrt(max(discriminant, 0.0));
    float firstDistance = (-qb - root) / (2.0 * qa);
    float secondDistance = (-qb + root) / (2.0 * qa);
    if (firstDistance >= minDistance && firstDistance <= maxDistance) distance = firstDistance;
    if (secondDistance >= minDistance && secondDistance <= maxDistance) distance = min(distance, secondDistance);
  }
  if (distance < minDistance || distance > maxDistance) return vec2(0.0);
  vec2 surfacePoint = rayDirection.xy * distance;
  float depthFraction = (distance - cameraDistance) / depth;
  vec2 radialPoint = surfacePoint - apexOffset * depthFraction;
  float u = fract(atan(radialPoint.x, radialPoint.y) / 6.283185307179586);
  float v = clamp((distance - cameraDistance) / depth, 0.0, 1.0);
  hitCone = true;
  return vec2(u, v);
}

vec4 coneViewSample(vec2 globalUv) {
  bool hitCone;
  vec2 mappedUv = coneMappedUv(globalUv, hitCone);
  if (!hitCone) return vec4(0.0, 0.0, 0.0, 1.0);
  vec2 unwrappedUv = mappedUv * vec2(u_coneTextureRepeat, 1.0) + u_coneTextureOffset;
  vec2 sampleUv = fract(unwrappedUv);
  if (u_coneSeamMode == 0) return coneMirrorRepeatSample(unwrappedUv, u_coneSeamBlend);
  if (u_coneSeamMode == 1) return coneEdgeWeldSample(sampleUv, u_coneSeamBlend);
  return coneGradientReapplySample(sampleUv, u_coneSeamBlend);
}
#endif
`;

const postprocessGLSL = [
  postprocessUniformsGLSL,
  postprocessSharedGLSL,
  postprocessPrismGLSL,
  postprocessStackGLSL,
  coneStackGLSL,
  postprocessDiffuseGLSL,
  postprocessGlassFieldGLSL,
  postprocessGlassOpticsGLSL,
  postprocessGlassTileGLSL,
  postprocessMainGLSL,
].join('');

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
  | 'videoMotion';

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

// Caustics and Phasor uniforms are intentionally absent here: specialized
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
  + videoMotionGLSL.length * 47
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
    coneStackGLSL,
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
  if (key === 'videoMotion') return { vertex: vertexGLSL, fragment: videoMotionGLSL };
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
  return {
    vertex: normalizeShaderLineEndings(vertexGLSL),
    fragment: normalizeShaderLineEndings(`${bootstrapNoise}\n#define KGG_BOOTSTRAP\n${gradientGLSL}`),
  };
}
