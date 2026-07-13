import noiseGLSL from '../shaders/noise.glsl?raw';
import vertexGLSL from '../shaders/vertex.vert.glsl?raw';
import gradientGLSL from '../shaders/gradient.frag.glsl?raw';
import blurGLSL from '../shaders/blur.frag.glsl?raw';
import normalMapGLSL from '../shaders/normalmap.frag.glsl?raw';
import stretchGLSL from '../shaders/stretch.frag.glsl?raw';
import postprocessGLSL from '../shaders/postprocess.frag.glsl?raw';
import prismCompositeGLSL from '../shaders/prismComposite.frag.glsl?raw';
import particlesVertexGLSL from '../shaders/particles.vert.glsl?raw';
import particlesFragmentGLSL from '../shaders/particles.frag.glsl?raw';

export type LazyProgramKey =
  | 'blur'
  | 'normalMap'
  | 'stretch'
  | 'stackCore'
  | 'glass'
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

function createSpecializedPostprocessSource(
  define: 'KGG_GLASS_ONLY' | 'KGG_PRISM_ONLY',
): string {
  return postprocessGLSL.replace(
    'precision highp float;',
    `precision highp float;\n${SPECIALIZED_NOISE_UNIFORMS}\n#define ${define}`,
  );
}

function createStackCoreSource(): string {
  return noiseGLSL
    .replace('uniform vec2 u_resolution;', 'uniform vec2 u_fullResolution;')
    .replaceAll('u_resolution', 'u_fullResolution')
    + '\n#define KGG_LIGHTWEIGHT\n'
    + postprocessGLSL;
}

function createGeneralPostprocessSource(): string {
  return noiseGLSL
    .replace('uniform vec2 u_resolution;', 'uniform vec2 u_fullResolution;')
    .replaceAll('u_resolution', 'u_fullResolution')
    + '\n'
    + postprocessGLSL;
}

/**
 * Returns the exact source pair for one lazy program. Keeping this mapping
 * declarative makes the compile boundary reviewable and testable without a
 * WebGL context.
 */
export function getProgramSource(key: LazyProgramKey): ProgramSource {
  if (key === 'blur') return { vertex: vertexGLSL, fragment: blurGLSL };
  if (key === 'normalMap') return { vertex: vertexGLSL, fragment: normalMapGLSL };
  if (key === 'stretch') return { vertex: vertexGLSL, fragment: stretchGLSL };
  if (key === 'stackCore') return { vertex: vertexGLSL, fragment: createStackCoreSource() };
  if (key === 'glass') return { vertex: vertexGLSL, fragment: createSpecializedPostprocessSource('KGG_GLASS_ONLY') };
  if (key === 'prism') return { vertex: vertexGLSL, fragment: createSpecializedPostprocessSource('KGG_PRISM_ONLY') };
  if (key === 'postprocess') return { vertex: vertexGLSL, fragment: createGeneralPostprocessSource() };
  if (key === 'prismComposite') return { vertex: vertexGLSL, fragment: prismCompositeGLSL };
  return { vertex: particlesVertexGLSL, fragment: particlesFragmentGLSL };
}

export function getInitialProgramSource(): ProgramSource {
  return { vertex: vertexGLSL, fragment: `${noiseGLSL}\n${gradientGLSL}` };
}
