import type { GradientConfig } from '../types/gradient';
import type { NoiseDistortionConfig, DiffuseConfig, SlitScanConfig, StretchConfig, NormalMapConfig, RadonConfig, IridescenceConfig, ManualDistortConfig, PostprocessConfig, MatcapConfig, PostprocessStackKind, EffectPipelineConfig } from '../types/distortion';
import { IMAGE_GRADIENT_DEFAULTS, type ImageGradientConfig } from '../types/imageGradient';
import { GRADIENT_ANCHOR_DEFAULTS, defaultBezierControlsForAnchors } from '../store/gradientStore';
import { buildRampTextureData, RAMP_TEX_WIDTH } from './gradientRampUtils';
import {
  getInitialProgramSource,
  getProgramSource,
  SHADER_VERSION,
  type LazyProgramKey,
} from './webglShaderSources';
import {
  collectGpuDiagnostics,
  optimizeNoiseDistortion,
  optimizeNormalMap,
  optimizePostprocess,
  optimizeStretch,
} from './gpuDiagnostics';
import type { GpuDiagnostics, RenderOptimization } from './gpuDiagnostics';
import { isGlassOpticallyIdentity, normalizeGlassRenderParameters } from './glass';
import { getActivePostprocessStackLayers } from './postprocessStack';
import { canRenderV2Direct, getV2RenderPlan } from './effectPipeline';

export { SHADER_VERSION };

type ShaderCompileExt = { COMPLETION_STATUS_KHR: number } | null;
const PARALLEL_SHADER_COMPILE_TIMEOUT_MS = 30_000;
const GLASS_PARALLEL_SHADER_COMPILE_TIMEOUT_MS = Number.POSITIVE_INFINITY;
type TextureStackKind = PostprocessStackKind | 'diffuse' | 'noise' | 'slit';
type LazyProgramState = {
  promise: Promise<void> | null;
  failed: boolean;
  timedOut: boolean;
};

export type WebGLContext = {
  gl: WebGL2RenderingContext;
  gpuDiagnostics: GpuDiagnostics;
  renderOptimization: RenderOptimization;
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
  generatorProgram: WebGLProgram | null;
  generatorUniforms: Record<string, WebGLUniformLocation | null>;
  gradientRampTexture: WebGLTexture; // TEXTURE1: グラデーションランプ
  manualDistortTexture: WebGLTexture; // TEXTURE5: 手作業UV変位マップ
  manualDistortDisplacement: number[] | null;
  manualDistortSmoothMask: number[] | null;
  manualDistortMapResolution: number;
  sourceImageTexture: WebGLTexture; // TEXTURE4: 読み込み画像
  sourceImageCanvas: HTMLCanvasElement | null;
  imageGradientTexture: WebGLTexture; // TEXTURE7: 再配色用入力画像
  imageGradientSource: HTMLCanvasElement | null;
  imageMaskTexture: WebGLTexture; // TEXTURE6: IMAGE OVERLAY/MASK の alpha マスク
  imageMaskSource: TexImageSource | null;
  // ノーマルマップ別パス用
  normalMapProgram: WebGLProgram | null;
  normalMapUniforms: Record<string, WebGLUniformLocation | null>;
  gradFbo: WebGLFramebuffer;        // グラデーションを一時レンダリングするFBO
  gradTexture: WebGLTexture;        // TEXTURE2: グラデーション結果テクスチャ
  // Gaussian blur 用
  blurProgram: WebGLProgram | null;
  blurUniforms: Record<string, WebGLUniformLocation | null>;
  stretchProgram: WebGLProgram | null;
  stretchUniforms: Record<string, WebGLUniformLocation | null>;
  postprocessProgram: WebGLProgram | null;
  postprocessUniforms: Record<string, WebGLUniformLocation | null>;
  stackCoreProgram: WebGLProgram | null;
  stackCoreUniforms: Record<string, WebGLUniformLocation | null>;
  noiseStackProgram: WebGLProgram | null;
  noiseStackUniforms: Record<string, WebGLUniformLocation | null>;
  glassProgram: WebGLProgram | null;
  glassUniforms: Record<string, WebGLUniformLocation | null>;
  glassFallbackActive: boolean;
  glassV2Program: WebGLProgram | null;
  glassV2Uniforms: Record<string, WebGLUniformLocation | null>;
  glassV2FallbackActive: boolean;
  prismProgram: WebGLProgram | null;
  prismUniforms: Record<string, WebGLUniformLocation | null>;
  prismCompositeProgram: WebGLProgram | null;
  prismCompositeUniforms: Record<string, WebGLUniformLocation | null>;
  particleProgram: WebGLProgram | null;
  particleUniforms: Record<string, WebGLUniformLocation | null>;
  particleVao: WebGLVertexArrayObject | null;
  particleQuadBuffer: WebGLBuffer | null;
  particleInstanceBuffer: WebGLBuffer | null;
  particleInstanceCount: number;
  particleInstanceSeed: number;
  normalFbo: WebGLFramebuffer;      // ノーマルマップ出力 (ブラー前)
  normalTexture: WebGLTexture;
  hBlurFbo: WebGLFramebuffer;       // 水平ブラー済み
  hBlurTexture: WebGLTexture;
  postprocessFboA: WebGLFramebuffer;
  postprocessTextureA: WebGLTexture;
  postprocessFboB: WebGLFramebuffer;
  postprocessTextureB: WebGLTexture;
  prismScratchFbo: WebGLFramebuffer;
  prismScratchTexture: WebGLTexture;
  prismBlurFbo: WebGLFramebuffer;
  prismBlurTexture: WebGLTexture;
  prismGlowFbo: WebGLFramebuffer;
  prismGlowTexture: WebGLTexture;
  fboSize: [number, number];        // 現在の FBO テクスチャサイズ
  v2CoreFboSize: [number, number];
  shaderCompileExt: ShaderCompileExt;
  lazyProgramState: Record<LazyProgramKey, LazyProgramState>;
  hasPresentedFrame: boolean;
};

const DIFFUSE_REFERENCE_WIDTH = 1920;
const DIFFUSE_REFERENCE_HEIGHT = 1080;
const DIFFUSE_REFERENCE_AREA = DIFFUSE_REFERENCE_WIDTH * DIFFUSE_REFERENCE_HEIGHT;
const DISTORT_TEXTURE_UPSCALE = 4;
const DISTORT_TEXTURE_MIN_RESOLUTION = 256;
const DISTORT_TEXTURE_MAX_RESOLUTION = 512;

function diffuseResolutionScale(width: number, height: number): number {
  if (width <= 0 || height <= 0) return 1;
  return Math.sqrt((width * height) / DIFFUSE_REFERENCE_AREA);
}

function clampNumber(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function distortTextureResolution(mapResolution: number): number {
  const resolution = Math.max(1, Math.floor(mapResolution) || 1);
  const upscaled = resolution < DISTORT_TEXTURE_MIN_RESOLUTION
    ? DISTORT_TEXTURE_MIN_RESOLUTION
    : resolution * DISTORT_TEXTURE_UPSCALE;
  return Math.max(resolution, Math.min(DISTORT_TEXTURE_MAX_RESOLUTION, upscaled));
}

function catmullRom(a: number, b: number, c: number, d: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (
    2 * b +
    (-a + c) * t +
    (2 * a - 5 * b + 4 * c - d) * t2 +
    (-a + 3 * b - 3 * c + d) * t3
  );
}

function sampleManualDistortChannel(
  displacement: number[],
  smoothMask: number[] | undefined,
  resolution: number,
  x: number,
  y: number,
  channel: 0 | 1 | 2,
): number {
  const baseX = Math.floor(x);
  const baseY = Math.floor(y);
  const tx = x - baseX;
  const ty = y - baseY;
  const rows = [0, 0, 0, 0];

  for (let row = 0; row < 4; row++) {
    const sy = clampNumber(baseY + row - 1, 0, resolution - 1);
    const values = [0, 0, 0, 0];
    for (let col = 0; col < 4; col++) {
      const sx = clampNumber(baseX + col - 1, 0, resolution - 1);
      const cellIdx = sy * resolution + sx;
      values[col] = channel === 2
        ? smoothMask?.[cellIdx] ?? 0
        : displacement[cellIdx * 2 + channel] ?? 0;
    }
    rows[row] = catmullRom(values[0], values[1], values[2], values[3], tx);
  }

  return catmullRom(rows[0], rows[1], rows[2], rows[3], ty);
}

export async function initWebGL(canvas: HTMLCanvasElement): Promise<WebGLContext> {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    desynchronized: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true,
    premultipliedAlpha: false,
  });
  if (!gl) throw new Error('WebGL2 is required but was not available');
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    const contextEvent = event as WebGLContextEvent;
    console.error('[WebGL context] lost', { statusMessage: contextEvent.statusMessage });
  });
  canvas.addEventListener('webglcontextrestored', () => {
    console.info('[WebGL context] restored; renderer reinitialization is required');
  });

  // WebGL テクスチャサイズ制限を確認（デバッグ用）
  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  const maxRenderbufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
  const maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const dbW = gl.drawingBufferWidth;
  const dbH = gl.drawingBufferHeight;
  const clamped = dbW !== canvasWidth || dbH !== canvasHeight;
  const gpuDiagnostics = await collectGpuDiagnostics(gl);
  const renderOptimization = gpuDiagnostics.optimization;

  if (clamped) {
    console.warn(
      `[WebGL diag] DrawingBuffer was clamped: requested ${canvasWidth}×${canvasHeight}, ` +
      `got ${dbW}×${dbH}. Output will be partially black because viewport extends beyond actual buffer.`
    );
  }
  if (canvasWidth > maxTextureSize || canvasHeight > maxTextureSize) {
    console.warn(
      `[WebGL diag] Canvas size (${canvasWidth}×${canvasHeight}) exceeds MAX_TEXTURE_SIZE (${maxTextureSize}). ` +
      `Rendering may fail or produce black output.`
    );
  }
  if (canvasWidth > maxRenderbufferSize || canvasHeight > maxRenderbufferSize) {
    console.warn(
      `[WebGL diag] Canvas size (${canvasWidth}×${canvasHeight}) exceeds MAX_RENDERBUFFER_SIZE (${maxRenderbufferSize}).`
    );
  }
  if (canvasWidth > maxViewportDims[0] || canvasHeight > maxViewportDims[1]) {
    console.warn(
      `[WebGL diag] Canvas size (${canvasWidth}×${canvasHeight}) exceeds MAX_VIEWPORT_DIMS (${maxViewportDims[0]}×${maxViewportDims[1]}).`
    );
  }

  // KHR_parallel_shader_compile: シェーダーコンパイルを非同期化してメインスレッドをブロックしない
  const ext = gl.getExtension('KHR_parallel_shader_compile') as ShaderCompileExt;
  // 初期表示はメインのグラデーションプログラムだけを待つ。
  // 補助プログラムは init 完了後に順次コンパイルし、最初のグラデーション表示を早める。
  const initialSource = getInitialProgramSource();
  const program = await createProgramAsync(gl, initialSource.fragment, ext, initialSource.vertex);
  setupGeometry(gl, program);
  const uniforms: Record<string, WebGLUniformLocation | null> = {
    u_gradientType: gl.getUniformLocation(program, 'u_gradientType'),
    u_resolution: gl.getUniformLocation(program, 'u_resolution'),
    u_noiseEnabled: gl.getUniformLocation(program, 'u_noiseEnabled'),
    u_noiseType: gl.getUniformLocation(program, 'u_noiseType'),
    u_noiseAmount: gl.getUniformLocation(program, 'u_noiseAmount'),
    u_noiseScale: gl.getUniformLocation(program, 'u_noiseScale'),
    u_noiseOctaves: gl.getUniformLocation(program, 'u_noiseOctaves'),
    u_noiseEvolution: gl.getUniformLocation(program, 'u_noiseEvolution'),
    u_noiseSeamlessType: gl.getUniformLocation(program, 'u_noiseSeamlessType'),
    u_seamlessAnimation: gl.getUniformLocation(program, 'u_seamlessAnimation'),
    u_seamlessTwist: gl.getUniformLocation(program, 'u_seamlessTwist'),
    u_noiseLoopMode: gl.getUniformLocation(program, 'u_noiseLoopMode'),
    u_noiseLoopBlend: gl.getUniformLocation(program, 'u_noiseLoopBlend'),
    u_curlSteps: gl.getUniformLocation(program, 'u_curlSteps'),
    u_curlSpeed: gl.getUniformLocation(program, 'u_curlSpeed'),
    u_curlEps: gl.getUniformLocation(program, 'u_curlEps'),
    u_curlSeed: gl.getUniformLocation(program, 'u_curlSeed'),
    u_noiseSeed: gl.getUniformLocation(program, 'u_noiseSeed'),
    u_voronoiDistMetric: gl.getUniformLocation(program, 'u_voronoiDistMetric'),
    u_voronoiRandomness: gl.getUniformLocation(program, 'u_voronoiRandomness'),
    u_voronoiFeature: gl.getUniformLocation(program, 'u_voronoiFeature'),
    u_voronoiMinkowskiExp: gl.getUniformLocation(program, 'u_voronoiMinkowskiExp'),
    u_ridgeSharpness: gl.getUniformLocation(program, 'u_ridgeSharpness'),
    u_ridgeGain: gl.getUniformLocation(program, 'u_ridgeGain'),
    u_ridgeLacunarity: gl.getUniformLocation(program, 'u_ridgeLacunarity'),
    u_ridgePersistence: gl.getUniformLocation(program, 'u_ridgePersistence'),
    u_ridgeOffset: gl.getUniformLocation(program, 'u_ridgeOffset'),
    u_ridgeWarp: gl.getUniformLocation(program, 'u_ridgeWarp'),
    u_aeFractalType: gl.getUniformLocation(program, 'u_aeFractalType'),
    u_aeSubInfluence: gl.getUniformLocation(program, 'u_aeSubInfluence'),
    u_aeSubScaling: gl.getUniformLocation(program, 'u_aeSubScaling'),
    u_aeSubRotation: gl.getUniformLocation(program, 'u_aeSubRotation'),
    u_aeContrast: gl.getUniformLocation(program, 'u_aeContrast'),
    u_aeBrightness: gl.getUniformLocation(program, 'u_aeBrightness'),
    u_time: gl.getUniformLocation(program, 'u_time'),
    u_noiseLoopPeriod: gl.getUniformLocation(program, 'u_noiseLoopPeriod'),
    u_animDir: gl.getUniformLocation(program, 'u_animDir'),
    u_diffuseEnabled: gl.getUniformLocation(program, 'u_diffuseEnabled'),
    u_diffuseMode:    gl.getUniformLocation(program, 'u_diffuseMode'),
    u_diffuseScatter: gl.getUniformLocation(program, 'u_diffuseScatter'),
    u_diffuseGrain: gl.getUniformLocation(program, 'u_diffuseGrain'),
    u_diffuseSeed: gl.getUniformLocation(program, 'u_diffuseSeed'),
    u_diffuseDitherThreshold: gl.getUniformLocation(program, 'u_diffuseDitherThreshold'),
    u_gradientRamp: gl.getUniformLocation(program, 'u_gradientRamp'),
    u_rampRepeat: gl.getUniformLocation(program, 'u_rampRepeat'),
    u_sourceImageEnabled: gl.getUniformLocation(program, 'u_sourceImageEnabled'),
    u_sourceImage: gl.getUniformLocation(program, 'u_sourceImage'),
    u_imageGradientEnabled: gl.getUniformLocation(program, 'u_imageGradientEnabled'),
    u_imageGradient: gl.getUniformLocation(program, 'u_imageGradient'),
    u_imageGradientSize: gl.getUniformLocation(program, 'u_imageGradientSize'),
    u_imageGradientChannel: gl.getUniformLocation(program, 'u_imageGradientChannel'),
    u_imageGradientAnchorInfluence: gl.getUniformLocation(program, 'u_imageGradientAnchorInfluence'),
    u_imageMaskEnabled: gl.getUniformLocation(program, 'u_imageMaskEnabled'),
    u_imageMask: gl.getUniformLocation(program, 'u_imageMask'),
    u_slitEnabled: gl.getUniformLocation(program, 'u_slitEnabled'),
    u_slitMode: gl.getUniformLocation(program, 'u_slitMode'),
    u_slitAngle: gl.getUniformLocation(program, 'u_slitAngle'),
    u_slitWaveType: gl.getUniformLocation(program, 'u_slitWaveType'),
    u_slitWaveHeight: gl.getUniformLocation(program, 'u_slitWaveHeight'),
    u_slitPolygonSides: gl.getUniformLocation(program, 'u_slitPolygonSides'),
    u_slitOffsetAngle: gl.getUniformLocation(program, 'u_slitOffsetAngle'),
    u_slitWidth: gl.getUniformLocation(program, 'u_slitWidth'),
    u_slitOffset: gl.getUniformLocation(program, 'u_slitOffset'),
    u_slitVariance: gl.getUniformLocation(program, 'u_slitVariance'),
    u_slitParams: gl.getUniformLocation(program, 'u_slitParams'),
    u_slitDelta01: gl.getUniformLocation(program, 'u_slitDelta01'),
    u_slitDelta23: gl.getUniformLocation(program, 'u_slitDelta23'),
    u_slitDelta45: gl.getUniformLocation(program, 'u_slitDelta45'),
    u_slitDelta67: gl.getUniformLocation(program, 'u_slitDelta67'),
    u_slitDelta89: gl.getUniformLocation(program, 'u_slitDelta89'),
    u_slitDeltaAB: gl.getUniformLocation(program, 'u_slitDeltaAB'),
    u_slitDeltaCD: gl.getUniformLocation(program, 'u_slitDeltaCD'),
    u_slitDeltaEF: gl.getUniformLocation(program, 'u_slitDeltaEF'),
    u_slitDeltaGH: gl.getUniformLocation(program, 'u_slitDeltaGH'),
    u_slitDeltaIJ: gl.getUniformLocation(program, 'u_slitDeltaIJ'),
    u_slitDeltaKL: gl.getUniformLocation(program, 'u_slitDeltaKL'),
    u_slitDeltaMN: gl.getUniformLocation(program, 'u_slitDeltaMN'),
    u_slitDeltaOP: gl.getUniformLocation(program, 'u_slitDeltaOP'),
    u_slitDeltaQR: gl.getUniformLocation(program, 'u_slitDeltaQR'),
    u_slitDeltaST: gl.getUniformLocation(program, 'u_slitDeltaST'),
    u_slitDeltaUV: gl.getUniformLocation(program, 'u_slitDeltaUV'),
    u_slitAnimEnabled: gl.getUniformLocation(program, 'u_slitAnimEnabled'),
    u_slitAnimTime: gl.getUniformLocation(program, 'u_slitAnimTime'),
    u_slitAnimMode: gl.getUniformLocation(program, 'u_slitAnimMode'),
    u_slitNoiseAfter: gl.getUniformLocation(program, 'u_slitNoiseAfter'),
    u_slitPixelPerfect: gl.getUniformLocation(program, 'u_slitPixelPerfect'),
    u_dwInitVal: gl.getUniformLocation(program, 'u_dwInitVal'),
    u_dwInitAmp: gl.getUniformLocation(program, 'u_dwInitAmp'),
    u_dwRotAngle1: gl.getUniformLocation(program, 'u_dwRotAngle1'),
    u_dwRotAngle2: gl.getUniformLocation(program, 'u_dwRotAngle2'),
    u_dwDist1: gl.getUniformLocation(program, 'u_dwDist1'),
    u_dwDist2: gl.getUniformLocation(program, 'u_dwDist2'),
    u_dwDist3: gl.getUniformLocation(program, 'u_dwDist3'),
    u_dwDriftAngle: gl.getUniformLocation(program, 'u_dwDriftAngle'),
    u_radonEnabled: gl.getUniformLocation(program, 'u_radonEnabled'),
    u_radonStrength: gl.getUniformLocation(program, 'u_radonStrength'),
    u_radonFreq: gl.getUniformLocation(program, 'u_radonFreq'),
    u_radonRadius: gl.getUniformLocation(program, 'u_radonRadius'),
    u_radonAngle: gl.getUniformLocation(program, 'u_radonAngle'),
    u_radonBlur: gl.getUniformLocation(program, 'u_radonBlur'),
    u_radonEvolution: gl.getUniformLocation(program, 'u_radonEvolution'),
    u_radonSpeed: gl.getUniformLocation(program, 'u_radonSpeed'),
    u_iridEnabled: gl.getUniformLocation(program, 'u_iridEnabled'),
    u_iridAngle: gl.getUniformLocation(program, 'u_iridAngle'),
    u_iridSpeed: gl.getUniformLocation(program, 'u_iridSpeed'),
    u_iridFreq: gl.getUniformLocation(program, 'u_iridFreq'),
    u_iridStrength: gl.getUniformLocation(program, 'u_iridStrength'),
    u_manualDistortEnabled: gl.getUniformLocation(program, 'u_manualDistortEnabled'),
    u_manualDistortMap: gl.getUniformLocation(program, 'u_manualDistortMap'),
    u_manualDistortMaxDisplacement: gl.getUniformLocation(program, 'u_manualDistortMaxDisplacement'),
    u_manualDistortSmoothStrength: gl.getUniformLocation(program, 'u_manualDistortSmoothStrength'),
    u_manualDistortSmoothRadius: gl.getUniformLocation(program, 'u_manualDistortSmoothRadius'),
    u_matcapEnabled: gl.getUniformLocation(program, 'u_matcapEnabled'),
    u_gradAnchor0: gl.getUniformLocation(program, 'u_gradAnchor0'),
    u_gradAnchor1: gl.getUniformLocation(program, 'u_gradAnchor1'),
    u_gradAnchor2: gl.getUniformLocation(program, 'u_gradAnchor2'),
    u_gradAnchor3: gl.getUniformLocation(program, 'u_gradAnchor3'),
    u_gradBezierCp0: gl.getUniformLocation(program, 'u_gradBezierCp0'),
    u_gradBezierCp1: gl.getUniformLocation(program, 'u_gradBezierCp1'),
    u_gradDir: gl.getUniformLocation(program, 'u_gradDir'),
    u_tileOffset: gl.getUniformLocation(program, 'u_tileOffset'),
    u_tileSize: gl.getUniformLocation(program, 'u_tileSize'),
  };
  const imageMaskTexture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, imageMaskTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const gradientRampTexture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, gradientRampTexture);
  const initRamp = new Uint8Array(256 * 4);
  for (let i = 0; i < 256; i++) { initRamp[i * 4] = i; initRamp[i * 4 + 1] = i; initRamp[i * 4 + 2] = i; initRamp[i * 4 + 3] = 255; }
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, initRamp);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const manualDistortTexture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, manualDistortTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([128, 128, 0, 255]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const sourceImageTexture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, sourceImageTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const imageGradientTexture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, imageGradientTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.useProgram(program);
  const { fbo: normalFbo, tex: normalTexture } = createFboWithTexture(gl);
  const { fbo: hBlurFbo, tex: hBlurTexture } = createFboWithTexture(gl);
  const { fbo: gradFbo, tex: gradTexture } = createFboWithTexture(gl);
  const { fbo: postprocessFboA, tex: postprocessTextureA } = createFboWithTexture(gl);
  const { fbo: postprocessFboB, tex: postprocessTextureB } = createFboWithTexture(gl);
  const { fbo: prismScratchFbo, tex: prismScratchTexture } = createFboWithTexture(gl);
  const { fbo: prismBlurFbo, tex: prismBlurTexture } = createFboWithTexture(gl);
  const { fbo: prismGlowFbo, tex: prismGlowTexture } = createFboWithTexture(gl);
  const ctx: WebGLContext = { gl, gpuDiagnostics, renderOptimization, program, uniforms, generatorProgram: null, generatorUniforms: {}, gradientRampTexture, manualDistortTexture, manualDistortDisplacement: null, manualDistortSmoothMask: null, manualDistortMapResolution: 0, sourceImageTexture, sourceImageCanvas: null, imageGradientTexture, imageGradientSource: null, imageMaskTexture, imageMaskSource: null, normalMapProgram: null, normalMapUniforms: {}, gradFbo, gradTexture, blurProgram: null, blurUniforms: {}, stretchProgram: null, stretchUniforms: {}, stackCoreProgram: null, stackCoreUniforms: {}, noiseStackProgram: null, noiseStackUniforms: {}, glassProgram: null, glassUniforms: {}, glassFallbackActive: false, glassV2Program: null, glassV2Uniforms: {}, glassV2FallbackActive: false, prismProgram: null, prismUniforms: {}, postprocessProgram: null, postprocessUniforms: {}, prismCompositeProgram: null, prismCompositeUniforms: {}, particleProgram: null, particleUniforms: {}, particleVao: null, particleQuadBuffer: null, particleInstanceBuffer: null, particleInstanceCount: 0, particleInstanceSeed: Number.NaN, normalFbo, normalTexture, hBlurFbo, hBlurTexture, postprocessFboA, postprocessTextureA, postprocessFboB, postprocessTextureB, prismScratchFbo, prismScratchTexture, prismBlurFbo, prismBlurTexture, prismGlowFbo, prismGlowTexture, fboSize: [0, 0], v2CoreFboSize: [0, 0], shaderCompileExt: ext, lazyProgramState: createLazyProgramState(), hasPresentedFrame: false };
  return ctx;
}

async function createProgramAsync(
  gl: WebGL2RenderingContext,
  fragSrc: string,
  ext: ShaderCompileExt,
  vertSrc: string,
  diagnosticLabel = 'gradient',
  compileTimeoutMs = PARALLEL_SHADER_COMPILE_TIMEOUT_MS,
): Promise<WebGLProgram> {
  const compileStartedAt = performance.now();
  console.info('[WebGL shader] compile requested', {
    program: diagnosticLabel,
    fragmentSourceLength: fragSrc.length,
    parallelCompile: Boolean(ext),
  });
  if (gl.isContextLost()) throw new Error('WebGL context lost before compile');
  const vert = gl.createShader(gl.VERTEX_SHADER)!;
  gl.shaderSource(vert, vertSrc);
  gl.compileShader(vert);
  const frag = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(frag, fragSrc);
  gl.compileShader(frag);
  const program = gl.createProgram()!;
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.bindAttribLocation(program, 0, 'a_position');
  gl.linkProgram(program);
  if (ext) {
    // KHR_parallel_shader_compileの完了前にステータスを参照すると同期化される。
    // Glass系はドライバ側の長いコンパイルを許容し、通常のprogramだけ有限時間で打ち切る。
    await new Promise<void>((resolve, reject) => {
      const poll = () => {
        if (gl.isContextLost()) {
          reject(new Error('WebGL context lost during compilation'));
          return;
        }
        if (gl.getProgramParameter(program, ext.COMPLETION_STATUS_KHR)) {
          resolve();
          return;
        }
        if (Number.isFinite(compileTimeoutMs) && performance.now() - compileStartedAt >= compileTimeoutMs) {
          reject(new Error(`Parallel shader compile timed out (${diagnosticLabel})`));
          return;
        }
        requestAnimationFrame(poll);
      };
      requestAnimationFrame(poll);
    });
  }
  // エラーチェック（ext なし = ここで初めて同期ブロック、ext あり = すでにコンパイル完了済み）
  if (!gl.getShaderParameter(vert, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(vert);
    console.error('[GLSL] VERTEX compile error:', log);
    throw new Error('Shader compile failed: ' + log);
  }
  if (!gl.getShaderParameter(frag, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(frag);
    console.error('[GLSL] FRAGMENT compile error:', log);
    throw new Error('Shader compile failed: ' + log);
  }
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    console.error('[WebGL] Link failed:', log);
    console.error('[WebGL] MAX_FRAGMENT_UNIFORM_VECTORS:', gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS));
    console.error('[WebGL] MAX_VERTEX_UNIFORM_VECTORS:', gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS));
    console.error('[WebGL] MAX_VARYING_VECTORS:', gl.getParameter(gl.MAX_VARYING_VECTORS));
    throw new Error('Program link failed: ' + log);
  }
  console.info('[WebGL shader] compile completed', {
    program: diagnosticLabel,
    durationMs: Math.round(performance.now() - compileStartedAt),
  });
  return program;
}

function createLazyProgramState(): Record<LazyProgramKey, LazyProgramState> {
  return {
    generator: { promise: null, failed: false, timedOut: false },
    blur: { promise: null, failed: false, timedOut: false },
    normalMap: { promise: null, failed: false, timedOut: false },
    stretch: { promise: null, failed: false, timedOut: false },
    stackCore: { promise: null, failed: false, timedOut: false },
    noiseStack: { promise: null, failed: false, timedOut: false },
    glass: { promise: null, failed: false, timedOut: false },
    glassV2: { promise: null, failed: false, timedOut: false },
    prism: { promise: null, failed: false, timedOut: false },
    postprocess: { promise: null, failed: false, timedOut: false },
    prismComposite: { promise: null, failed: false, timedOut: false },
    particles: { promise: null, failed: false, timedOut: false },
  };
}

function getBlurUniforms(gl: WebGL2RenderingContext, program: WebGLProgram): Record<string, WebGLUniformLocation | null> {
  return {
    u_tex: gl.getUniformLocation(program, 'u_tex'),
    u_resolution: gl.getUniformLocation(program, 'u_resolution'),
    u_blurDir: gl.getUniformLocation(program, 'u_blurDir'),
    u_blurSigma: gl.getUniformLocation(program, 'u_blurSigma'),
    u_blurRadius: gl.getUniformLocation(program, 'u_blurRadius'),
  };
}

function getNormalMapUniforms(gl: WebGL2RenderingContext, program: WebGLProgram): Record<string, WebGLUniformLocation | null> {
  return {
    u_gradientTex: gl.getUniformLocation(program, 'u_gradientTex'),
    u_resolution: gl.getUniformLocation(program, 'u_resolution'),
    u_normalMapStrength: gl.getUniformLocation(program, 'u_normalMapStrength'),
    u_normalMapAngle: gl.getUniformLocation(program, 'u_normalMapAngle'),
    u_normalMapBevelSize: gl.getUniformLocation(program, 'u_normalMapBevelSize'),
    u_normalMapInvert: gl.getUniformLocation(program, 'u_normalMapInvert'),
    u_matcapEnabled: gl.getUniformLocation(program, 'u_matcapEnabled'),
  };
}

function getStretchUniforms(gl: WebGL2RenderingContext, program: WebGLProgram): Record<string, WebGLUniformLocation | null> {
  return {
    u_sourceTex: gl.getUniformLocation(program, 'u_sourceTex'),
    u_gradientRamp: gl.getUniformLocation(program, 'u_gradientRamp'),
    u_resolution: gl.getUniformLocation(program, 'u_resolution'),
    u_bandHeight: gl.getUniformLocation(program, 'u_bandHeight'),
    u_bandHeightVariance: gl.getUniformLocation(program, 'u_bandHeightVariance'),
    u_scan: gl.getUniformLocation(program, 'u_scan'),
    u_variation: gl.getUniformLocation(program, 'u_variation'),
    u_seed: gl.getUniformLocation(program, 'u_seed'),
    u_glowEnabled: gl.getUniformLocation(program, 'u_glowEnabled'),
    u_glowIntensity: gl.getUniformLocation(program, 'u_glowIntensity'),
    u_glowRadius: gl.getUniformLocation(program, 'u_glowRadius'),
    u_glowThreshold: gl.getUniformLocation(program, 'u_glowThreshold'),
    u_glowTint: gl.getUniformLocation(program, 'u_glowTint'),
  };
}

function getPostprocessUniforms(gl: WebGL2RenderingContext, program: WebGLProgram): Record<string, WebGLUniformLocation | null> {
  return {
    u_sourceTex: gl.getUniformLocation(program, 'u_sourceTex'),
    u_gradientRamp: gl.getUniformLocation(program, 'u_gradientRamp'),
    u_distortMap: gl.getUniformLocation(program, 'u_distortMap'),
    u_resolution: gl.getUniformLocation(program, 'u_tileResolution'),
    u_fullResolution: gl.getUniformLocation(program, 'u_fullResolution'),
    u_tileOffset: gl.getUniformLocation(program, 'u_tileOffset'),
    u_gradAnchor0: gl.getUniformLocation(program, 'u_gradAnchor0'),
    u_gradAnchor1: gl.getUniformLocation(program, 'u_gradAnchor1'),
    u_maxDisplacement: gl.getUniformLocation(program, 'u_maxDisplacement'),
    u_effectEnabled: gl.getUniformLocation(program, 'u_effectEnabled'),
    u_effectMode: gl.getUniformLocation(program, 'u_effectMode'),
    u_noiseEnabled: gl.getUniformLocation(program, 'u_noiseEnabled'),
    u_noiseType: gl.getUniformLocation(program, 'u_noiseType'),
    u_noiseAmount: gl.getUniformLocation(program, 'u_noiseAmount'),
    u_noiseScale: gl.getUniformLocation(program, 'u_noiseScale'),
    u_noiseOctaves: gl.getUniformLocation(program, 'u_noiseOctaves'),
    u_noiseEvolution: gl.getUniformLocation(program, 'u_noiseEvolution'),
    u_noiseSeed: gl.getUniformLocation(program, 'u_noiseSeed'),
    u_time: gl.getUniformLocation(program, 'u_time'),
    u_noiseLoopPeriod: gl.getUniformLocation(program, 'u_noiseLoopPeriod'),
    u_noiseLoopMode: gl.getUniformLocation(program, 'u_noiseLoopMode'),
    u_noiseLoopBlend: gl.getUniformLocation(program, 'u_noiseLoopBlend'),
    u_animDir: gl.getUniformLocation(program, 'u_animDir'),
    u_dwInitVal: gl.getUniformLocation(program, 'u_dwInitVal'),
    u_dwInitAmp: gl.getUniformLocation(program, 'u_dwInitAmp'),
    u_dwRotAngle1: gl.getUniformLocation(program, 'u_dwRotAngle1'),
    u_dwRotAngle2: gl.getUniformLocation(program, 'u_dwRotAngle2'),
    u_dwDist1: gl.getUniformLocation(program, 'u_dwDist1'),
    u_dwDist2: gl.getUniformLocation(program, 'u_dwDist2'),
    u_dwDist3: gl.getUniformLocation(program, 'u_dwDist3'),
    u_dwDriftAngle: gl.getUniformLocation(program, 'u_dwDriftAngle'),
    u_noiseSeamlessType: gl.getUniformLocation(program, 'u_noiseSeamlessType'),
    u_seamlessAnimation: gl.getUniformLocation(program, 'u_seamlessAnimation'),
    u_seamlessTwist: gl.getUniformLocation(program, 'u_seamlessTwist'),
    u_voronoiDistMetric: gl.getUniformLocation(program, 'u_voronoiDistMetric'),
    u_voronoiRandomness: gl.getUniformLocation(program, 'u_voronoiRandomness'),
    u_voronoiFeature: gl.getUniformLocation(program, 'u_voronoiFeature'),
    u_voronoiMinkowskiExp: gl.getUniformLocation(program, 'u_voronoiMinkowskiExp'),
    u_ridgeSharpness: gl.getUniformLocation(program, 'u_ridgeSharpness'),
    u_ridgeGain: gl.getUniformLocation(program, 'u_ridgeGain'),
    u_ridgeLacunarity: gl.getUniformLocation(program, 'u_ridgeLacunarity'),
    u_ridgePersistence: gl.getUniformLocation(program, 'u_ridgePersistence'),
    u_ridgeOffset: gl.getUniformLocation(program, 'u_ridgeOffset'),
    u_ridgeWarp: gl.getUniformLocation(program, 'u_ridgeWarp'),
    u_aeFractalType: gl.getUniformLocation(program, 'u_aeFractalType'),
    u_aeSubInfluence: gl.getUniformLocation(program, 'u_aeSubInfluence'),
    u_aeSubScaling: gl.getUniformLocation(program, 'u_aeSubScaling'),
    u_aeSubRotation: gl.getUniformLocation(program, 'u_aeSubRotation'),
    u_aeContrast: gl.getUniformLocation(program, 'u_aeContrast'),
    u_aeBrightness: gl.getUniformLocation(program, 'u_aeBrightness'),
    u_curlSteps: gl.getUniformLocation(program, 'u_curlSteps'),
    u_curlSpeed: gl.getUniformLocation(program, 'u_curlSpeed'),
    u_curlEps: gl.getUniformLocation(program, 'u_curlEps'),
    u_curlSeed: gl.getUniformLocation(program, 'u_curlSeed'),
    u_prismSpeed: gl.getUniformLocation(program, 'u_prismSpeed'),
    u_mirrorMode: gl.getUniformLocation(program, 'u_mirrorMode'),
    u_kaleidoscopeType: gl.getUniformLocation(program, 'u_kaleidoscopeType'),
    u_kaleidoscopeSlices: gl.getUniformLocation(program, 'u_kaleidoscopeSlices'),
    u_kaleidoscopeRotation: gl.getUniformLocation(program, 'u_kaleidoscopeRotation'),
    u_kaleidoscopeZoom: gl.getUniformLocation(program, 'u_kaleidoscopeZoom'),
    u_prismCenter: gl.getUniformLocation(program, 'u_prismCenter'),
    u_prismRayCount: gl.getUniformLocation(program, 'u_prismRayCount'),
    u_prismLength: gl.getUniformLocation(program, 'u_prismLength'),
    u_prismLengthRandomness: gl.getUniformLocation(program, 'u_prismLengthRandomness'),
    u_prismWidth: gl.getUniformLocation(program, 'u_prismWidth'),
    u_prismRandomness: gl.getUniformLocation(program, 'u_prismRandomness'),
    u_prismBlur: gl.getUniformLocation(program, 'u_prismBlur'),
    u_prismIntensity: gl.getUniformLocation(program, 'u_prismIntensity'),
    u_prismSeed: gl.getUniformLocation(program, 'u_prismSeed'),
    u_prismInnerRadius: gl.getUniformLocation(program, 'u_prismInnerRadius'),
    u_postVoronoiScale: gl.getUniformLocation(program, 'u_postVoronoiScale'),
    u_postVoronoiRandomness: gl.getUniformLocation(program, 'u_postVoronoiRandomness'),
    u_postVoronoiAngle: gl.getUniformLocation(program, 'u_postVoronoiAngle'),
    u_postVoronoiGradientScale: gl.getUniformLocation(program, 'u_postVoronoiGradientScale'),
    u_postVoronoiEdgeWidth: gl.getUniformLocation(program, 'u_postVoronoiEdgeWidth'),
    u_postVoronoiSeed: gl.getUniformLocation(program, 'u_postVoronoiSeed'),
    u_glassScale: gl.getUniformLocation(program, 'u_glassScale'),
    u_glassStretch: gl.getUniformLocation(program, 'u_glassStretch'),
    u_glassRotation: gl.getUniformLocation(program, 'u_glassRotation'),
    u_glassComplexity: gl.getUniformLocation(program, 'u_glassComplexity'),
    u_glassWarp: gl.getUniformLocation(program, 'u_glassWarp'),
    u_glassSeed: gl.getUniformLocation(program, 'u_glassSeed'),
    u_glassNoiseInfluence: gl.getUniformLocation(program, 'u_glassNoiseInfluence'),
    u_glassRefraction: gl.getUniformLocation(program, 'u_glassRefraction'),
    u_glassChromaticAberration: gl.getUniformLocation(program, 'u_glassChromaticAberration'),
    u_glassRoughness: gl.getUniformLocation(program, 'u_glassRoughness'),
    u_glassHighlight: gl.getUniformLocation(program, 'u_glassHighlight'),
    u_glassMix: gl.getUniformLocation(program, 'u_glassMix'),
    u_glassEvolution: gl.getUniformLocation(program, 'u_glassEvolution'),
    u_glassMotion: gl.getUniformLocation(program, 'u_glassMotion'),
    u_diffuseEnabled: gl.getUniformLocation(program, 'u_diffuseEnabled'),
    u_diffuseMode: gl.getUniformLocation(program, 'u_diffuseMode'),
    u_diffuseScatter: gl.getUniformLocation(program, 'u_diffuseScatter'),
    u_diffuseGrain: gl.getUniformLocation(program, 'u_diffuseGrain'),
    u_diffuseSeed: gl.getUniformLocation(program, 'u_diffuseSeed'),
    u_diffuseDitherThreshold: gl.getUniformLocation(program, 'u_diffuseDitherThreshold'),
    u_stackSlitMode: gl.getUniformLocation(program, 'u_stackSlitMode'),
    u_stackSlitAngle: gl.getUniformLocation(program, 'u_stackSlitAngle'),
    u_stackSlitWaveType: gl.getUniformLocation(program, 'u_stackSlitWaveType'),
    u_stackSlitWaveHeight: gl.getUniformLocation(program, 'u_stackSlitWaveHeight'),
    u_stackSlitPolygonSides: gl.getUniformLocation(program, 'u_stackSlitPolygonSides'),
    u_stackSlitOffsetAngle: gl.getUniformLocation(program, 'u_stackSlitOffsetAngle'),
    u_stackSlitWidth: gl.getUniformLocation(program, 'u_stackSlitWidth'),
    u_stackSlitOffset: gl.getUniformLocation(program, 'u_stackSlitOffset'),
    u_stackSlitVariance: gl.getUniformLocation(program, 'u_stackSlitVariance'),
    u_stackSlitParams: gl.getUniformLocation(program, 'u_stackSlitParams'),
    u_stackSlitDiffuseAfter: gl.getUniformLocation(program, 'u_stackSlitDiffuseAfter'),
    u_stackSlitDelta01: gl.getUniformLocation(program, 'u_stackSlitDelta01'),
    u_stackSlitDelta23: gl.getUniformLocation(program, 'u_stackSlitDelta23'),
    u_stackSlitDelta45: gl.getUniformLocation(program, 'u_stackSlitDelta45'),
    u_stackSlitDelta67: gl.getUniformLocation(program, 'u_stackSlitDelta67'),
    u_stackSlitDelta89: gl.getUniformLocation(program, 'u_stackSlitDelta89'),
    u_stackSlitDeltaAB: gl.getUniformLocation(program, 'u_stackSlitDeltaAB'),
    u_stackSlitDeltaCD: gl.getUniformLocation(program, 'u_stackSlitDeltaCD'),
    u_stackSlitDeltaEF: gl.getUniformLocation(program, 'u_stackSlitDeltaEF'),
    u_stackSlitDeltaGH: gl.getUniformLocation(program, 'u_stackSlitDeltaGH'),
    u_stackSlitDeltaIJ: gl.getUniformLocation(program, 'u_stackSlitDeltaIJ'),
    u_stackSlitDeltaKL: gl.getUniformLocation(program, 'u_stackSlitDeltaKL'),
    u_stackSlitDeltaMN: gl.getUniformLocation(program, 'u_stackSlitDeltaMN'),
    u_stackSlitDeltaOP: gl.getUniformLocation(program, 'u_stackSlitDeltaOP'),
    u_stackSlitDeltaQR: gl.getUniformLocation(program, 'u_stackSlitDeltaQR'),
    u_stackSlitDeltaST: gl.getUniformLocation(program, 'u_stackSlitDeltaST'),
    u_stackSlitDeltaUV: gl.getUniformLocation(program, 'u_stackSlitDeltaUV'),
    u_stackSlitAnimEnabled: gl.getUniformLocation(program, 'u_stackSlitAnimEnabled'),
    u_stackSlitAnimTime: gl.getUniformLocation(program, 'u_stackSlitAnimTime'),
    u_stackSlitAnimMode: gl.getUniformLocation(program, 'u_stackSlitAnimMode'),
    u_stackSlitPixelPerfect: gl.getUniformLocation(program, 'u_stackSlitPixelPerfect'),
  };
}

function getPrismCompositeUniforms(gl: WebGL2RenderingContext, program: WebGLProgram): Record<string, WebGLUniformLocation | null> {
  return {
    u_baseTex: gl.getUniformLocation(program, 'u_baseTex'),
    u_glowTex: gl.getUniformLocation(program, 'u_glowTex'),
    u_resolution: gl.getUniformLocation(program, 'u_resolution'),
    u_prismCenter: gl.getUniformLocation(program, 'u_prismCenter'),
    u_glowIntensity: gl.getUniformLocation(program, 'u_glowIntensity'),
    u_chromaticAberration: gl.getUniformLocation(program, 'u_chromaticAberration'),
  };
}

function getParticleUniforms(gl: WebGL2RenderingContext, program: WebGLProgram): Record<string, WebGLUniformLocation | null> {
  return {
    u_sourceTex: gl.getUniformLocation(program, 'u_sourceTex'),
    u_resolution: gl.getUniformLocation(program, 'u_resolution'),
    u_fullResolution: gl.getUniformLocation(program, 'u_fullResolution'),
    u_tileOffset: gl.getUniformLocation(program, 'u_tileOffset'),
    u_gradAnchor0: gl.getUniformLocation(program, 'u_gradAnchor0'),
    u_gradAnchor1: gl.getUniformLocation(program, 'u_gradAnchor1'),
    u_emitterPoint: gl.getUniformLocation(program, 'u_emitterPoint'),
    u_emitterType: gl.getUniformLocation(program, 'u_emitterType'),
    u_time: gl.getUniformLocation(program, 'u_time'),
    u_size: gl.getUniformLocation(program, 'u_size'),
    u_sizeRandomness: gl.getUniformLocation(program, 'u_sizeRandomness'),
    u_lifeCycle: gl.getUniformLocation(program, 'u_lifeCycle'),
    u_lifeRandom: gl.getUniformLocation(program, 'u_lifeRandom'),
    u_sizeOverLife: gl.getUniformLocation(program, 'u_sizeOverLife'),
    u_speed: gl.getUniformLocation(program, 'u_speed'),
    u_spread: gl.getUniformLocation(program, 'u_spread'),
    u_turbulence: gl.getUniformLocation(program, 'u_turbulence'),
    u_opacity: gl.getUniformLocation(program, 'u_opacity'),
    u_colorVariance: gl.getUniformLocation(program, 'u_colorVariance'),
    u_direction: gl.getUniformLocation(program, 'u_direction'),
    u_edgeFade: gl.getUniformLocation(program, 'u_edgeFade'),
    u_curlScale: gl.getUniformLocation(program, 'u_curlScale'),
    u_curlStrength: gl.getUniformLocation(program, 'u_curlStrength'),
    u_curlSpeed: gl.getUniformLocation(program, 'u_curlSpeed'),
    u_curlEvolution: gl.getUniformLocation(program, 'u_curlEvolution'),
    u_radialForce: gl.getUniformLocation(program, 'u_radialForce'),
    u_radialFalloff: gl.getUniformLocation(program, 'u_radialFalloff'),
    u_depth: gl.getUniformLocation(program, 'u_depth'),
    u_feather: gl.getUniformLocation(program, 'u_feather'),
    u_core: gl.getUniformLocation(program, 'u_core'),
    u_brightness: gl.getUniformLocation(program, 'u_brightness'),
    u_colorOverLife: gl.getUniformLocation(program, 'u_colorOverLife'),
    u_colorOverLifeMode: gl.getUniformLocation(program, 'u_colorOverLifeMode'),
  };
}

/**
 * The full generator is compiled after the lightweight bootstrap
 * program. Reflect its active uniforms so program switching cannot leave a
 * stale bootstrap-only location in use. Inactive uniforms deliberately read
 * as null: WebGL treats uploads to null locations as no-ops.
 */
function getGeneratorUniforms(gl: WebGL2RenderingContext, program: WebGLProgram): Record<string, WebGLUniformLocation | null> {
  const locations: Record<string, WebGLUniformLocation | null> = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
  for (let index = 0; index < count; index += 1) {
    const uniform = gl.getActiveUniform(program, index);
    if (!uniform) continue;
    const name = uniform.name.replace(/\[0\]$/, '');
    locations[name] = gl.getUniformLocation(program, uniform.name);
  }

  return new Proxy(locations, {
    get(target, property) {
      return typeof property === 'string' ? (target[property] ?? null) : null;
    },
  }) as Record<string, WebGLUniformLocation | null>;
}

async function compileLazyProgram(ctx: WebGLContext, key: LazyProgramKey): Promise<void> {
  const { gl } = ctx;
  if (gl.isContextLost()) return;
  if (
    (key === 'generator' && ctx.generatorProgram) ||
    (key === 'blur' && ctx.blurProgram) ||
    (key === 'normalMap' && ctx.normalMapProgram) ||
    (key === 'stretch' && ctx.stretchProgram) ||
    (key === 'stackCore' && ctx.stackCoreProgram) ||
    (key === 'noiseStack' && ctx.noiseStackProgram) ||
    (key === 'glass' && ctx.glassProgram) ||
    (key === 'glassV2' && ctx.glassV2Program) ||
    (key === 'prism' && ctx.prismProgram) ||
    (key === 'postprocess' && ctx.postprocessProgram) ||
    (key === 'prismComposite' && ctx.prismCompositeProgram) ||
    (key === 'particles' && ctx.particleProgram)
  ) {
    return;
  }

  const source = getProgramSource(key);
  const fragSrc = source.fragment;
  const compileStartedAt = performance.now();
  let program: WebGLProgram;
  try {
    program = await createProgramAsync(
      gl,
      fragSrc,
      ctx.shaderCompileExt,
      source.vertex,
      key,
      key === 'glass' || key === 'glassV2'
        ? GLASS_PARALLEL_SHADER_COMPILE_TIMEOUT_MS
        : PARALLEL_SHADER_COMPILE_TIMEOUT_MS,
    );
  } catch (error) {
    console.error('[WebGL shader] compile failed', {
      program: key,
      durationMs: Math.round(performance.now() - compileStartedAt),
      fragmentSourceLength: fragSrc.length,
      parallelCompile: Boolean(ctx.shaderCompileExt),
      error,
    });
    throw error;
  }
  if (gl.isContextLost()) return;

  if (key === 'generator') {
    ctx.generatorProgram = program;
    ctx.generatorUniforms = getGeneratorUniforms(gl, program);
    ctx.program = program;
    ctx.uniforms = ctx.generatorUniforms;
  } else if (key === 'blur') {
    ctx.blurProgram = program;
    ctx.blurUniforms = getBlurUniforms(gl, program);
  } else if (key === 'normalMap') {
    ctx.normalMapProgram = program;
    ctx.normalMapUniforms = getNormalMapUniforms(gl, program);
  } else if (key === 'stretch') {
    ctx.stretchProgram = program;
    ctx.stretchUniforms = getStretchUniforms(gl, program);
  } else if (key === 'stackCore') {
    ctx.stackCoreProgram = program;
    ctx.stackCoreUniforms = getPostprocessUniforms(gl, program);
  } else if (key === 'noiseStack') {
    ctx.noiseStackProgram = program;
    ctx.noiseStackUniforms = getPostprocessUniforms(gl, program);
  } else if (key === 'glass') {
    ctx.glassProgram = program;
    ctx.glassUniforms = getPostprocessUniforms(gl, program);
  } else if (key === 'glassV2') {
    ctx.glassV2Program = program;
    ctx.glassV2Uniforms = getPostprocessUniforms(gl, program);
  } else if (key === 'prism') {
    ctx.prismProgram = program;
    ctx.prismUniforms = getPostprocessUniforms(gl, program);
  } else if (key === 'postprocess') {
    ctx.postprocessProgram = program;
    ctx.postprocessUniforms = getPostprocessUniforms(gl, program);
  } else if (key === 'prismComposite') {
    ctx.prismCompositeProgram = program;
    ctx.prismCompositeUniforms = getPrismCompositeUniforms(gl, program);
  } else {
    ctx.particleProgram = program;
    ctx.particleUniforms = getParticleUniforms(gl, program);
    setupParticleGeometry(ctx);
  }
}

function requestLazyProgram(ctx: WebGLContext, key: LazyProgramKey): boolean {
  const ready = (
    (key === 'generator' && ctx.generatorProgram) ||
    (key === 'blur' && ctx.blurProgram) ||
    (key === 'normalMap' && ctx.normalMapProgram) ||
    (key === 'stretch' && ctx.stretchProgram) ||
    (key === 'stackCore' && ctx.stackCoreProgram) ||
    (key === 'noiseStack' && ctx.noiseStackProgram) ||
    (key === 'glass' && ctx.glassProgram) ||
    (key === 'glassV2' && ctx.glassV2Program) ||
    (key === 'prism' && ctx.prismProgram) ||
    (key === 'postprocess' && ctx.postprocessProgram) ||
    (key === 'prismComposite' && ctx.prismCompositeProgram) ||
    (key === 'particles' && ctx.particleProgram)
  );
  if (ready) return true;

  const state = ctx.lazyProgramState[key];
  if (!state.promise && !state.failed) {
    window.dispatchEvent(new CustomEvent('kgg:webgl-lazy-program-state', {
      detail: { key, state: 'loading' as const },
    }));
    state.promise = compileLazyProgram(ctx, key).catch((error) => {
      state.failed = true;
      state.timedOut = error instanceof Error && error.message.includes('timed out');
      console.error(`[WebGL] Lazy shader compile failed (${key}):`, error);
      window.dispatchEvent(new CustomEvent('kgg:webgl-lazy-program-state', {
        detail: { key, state: 'failed' as const },
      }));
    }).finally(() => {
      state.promise = null;
      if (!state.failed) {
        window.dispatchEvent(new CustomEvent('kgg:webgl-lazy-program-state', {
          detail: { key, state: 'ready' as const },
        }));
        window.dispatchEvent(new CustomEvent('kgg:webgl-lazy-program-ready'));
      }
    });
  }
  return false;
}

/**
 * GLASS is allowed to fall back to the general postprocess program when the
 * specialized variant cannot link on a particular WebGL implementation.
 * The fallback is still lazy, so the rest of the stack remains usable while
 * it is compiling.
 */
function requestGlassProgram(ctx: WebGLContext, key: 'glass' | 'glassV2'): boolean {
  const dedicatedProgram = key === 'glass' ? ctx.glassProgram : ctx.glassV2Program;
  if (dedicatedProgram) return true;

  const glassState = ctx.lazyProgramState[key];
  if (!glassState.failed) return requestLazyProgram(ctx, key);
  // A timeout means the driver may still be compiling the dedicated shader;
  // immediately requesting the larger fallback can reproduce the same stall.
  if (glassState.timedOut) return false;

  const fallbackReady = requestLazyProgram(ctx, 'postprocess');
  if (!fallbackReady) return false;

  const fallbackActive = key === 'glass' ? ctx.glassFallbackActive : ctx.glassV2FallbackActive;
  if (!fallbackActive) {
    if (key === 'glass') ctx.glassFallbackActive = true;
    else ctx.glassV2FallbackActive = true;
    window.dispatchEvent(new CustomEvent('kgg:webgl-lazy-program-state', {
      detail: { key, state: 'fallback' as const, fallback: true },
    }));
  }
  return true;
}

function setupParticleGeometry(ctx: WebGLContext): void {
  const { gl, particleProgram } = ctx;
  if (!particleProgram) return;

  const vao = gl.createVertexArray();
  const quadBuffer = gl.createBuffer();
  const instanceBuffer = gl.createBuffer();
  if (!vao || !quadBuffer || !instanceBuffer) return;

  gl.bindVertexArray(vao);

  const quad = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1,
  ]);
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
  const stride = 8 * Float32Array.BYTES_PER_ELEMENT;
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 4, gl.FLOAT, false, stride, 0);
  gl.vertexAttribDivisor(1, 1);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 4, gl.FLOAT, false, stride, 4 * Float32Array.BYTES_PER_ELEMENT);
  gl.vertexAttribDivisor(2, 1);

  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  ctx.particleVao = vao;
  ctx.particleQuadBuffer = quadBuffer;
  ctx.particleInstanceBuffer = instanceBuffer;
}

function setupGeometry(gl: WebGL2RenderingContext, program: WebGLProgram): void {
  const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
}


function createFboWithTexture(gl: WebGL2RenderingContext): { fbo: WebGLFramebuffer; tex: WebGLTexture } {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return { fbo, tex };
}

function reportIncompleteFramebuffer(
  gl: WebGL2RenderingContext,
  label: string,
  framebuffer: WebGLFramebuffer,
): void {
  const previous = gl.getParameter(gl.FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  gl.bindFramebuffer(gl.FRAMEBUFFER, previous);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    console.error('[WebGL framebuffer] incomplete', { label, status });
  }
}

function reportFramebufferSet(ctx: WebGLContext, includeFullSet: boolean): void {
  const { gl } = ctx;
  const entries: Array<[string, WebGLFramebuffer]> = [
    ['gradient', ctx.gradFbo],
    ['postprocess-a', ctx.postprocessFboA],
    ['postprocess-b', ctx.postprocessFboB],
  ];
  if (includeFullSet) {
    entries.push(
      ['normal', ctx.normalFbo],
      ['horizontal-blur', ctx.hBlurFbo],
      ['prism-scratch', ctx.prismScratchFbo],
      ['prism-blur', ctx.prismBlurFbo],
      ['prism-glow', ctx.prismGlowFbo],
    );
  }
  for (const [label, framebuffer] of entries) {
    reportIncompleteFramebuffer(gl, label, framebuffer);
  }
}

function resizeFboTextures(gl: WebGL2RenderingContext, ctx: WebGLContext, width: number, height: number): void {
  gl.bindTexture(gl.TEXTURE_2D, ctx.gradTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.bindTexture(gl.TEXTURE_2D, ctx.normalTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.bindTexture(gl.TEXTURE_2D, ctx.hBlurTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.bindTexture(gl.TEXTURE_2D, ctx.postprocessTextureA);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.bindTexture(gl.TEXTURE_2D, ctx.postprocessTextureB);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.bindTexture(gl.TEXTURE_2D, ctx.prismScratchTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.bindTexture(gl.TEXTURE_2D, ctx.prismBlurTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.bindTexture(gl.TEXTURE_2D, ctx.prismGlowTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  ctx.fboSize = [width, height];
  ctx.v2CoreFboSize = [width, height];
  reportFramebufferSet(ctx, true);
}

function resizeV2CoreFboTextures(gl: WebGL2RenderingContext, ctx: WebGLContext, width: number, height: number): void {
  for (const texture of [ctx.gradTexture, ctx.postprocessTextureA, ctx.postprocessTextureB]) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  }
  gl.bindTexture(gl.TEXTURE_2D, null);
  ctx.v2CoreFboSize = [width, height];
  reportFramebufferSet(ctx, false);
}

export function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

const NOISE_TYPE_MAP = { simplex: 0, fbm: 1, voronoi: 2, curl: 3, domain_warp_anim: 4, seamless: 5, ridged_fbm: 6, ae_fractal: 7, fast_curl: 8 } as const;
const GRADIENT_TYPE_MAP = { linear: 0, radial: 1, fourcolor: 2, diamond: 3, angle: 4, bezier: 5 } as const;
const DIFFUSE_MODE_MAP = { block: 0, smooth: 1, dither: 2 } as const;
const PARTICLE_EMITTER_TYPE_MAP = { field: 0, line: 1, burst: 2, point: 3 } as const;

function uploadGradientRampTexture(ctx: WebGLContext, gradient: GradientConfig): void {
  const { gl } = ctx;
  const data = buildRampTextureData(
    gradient.stops,
    gradient.rampInterpolation,
    gradient.rampMirror ?? false,
    gradient.opacityStops,
    gradient.rampColorMode,
    gradient.rampVariable ?? 0,
    gradient.rampRepeat ?? 1,
  );
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, ctx.gradientRampTexture);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, RAMP_TEX_WIDTH, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
}

function uploadManualDistortMap(ctx: WebGLContext, manualDistort: ManualDistortConfig): void {
  const { gl } = ctx;
  const resolution = Math.max(1, Math.floor(manualDistort.mapResolution) || 1);
  if (
    ctx.manualDistortDisplacement === manualDistort.displacement &&
    ctx.manualDistortSmoothMask === manualDistort.smoothMask &&
    ctx.manualDistortMapResolution === resolution
  ) {
    return;
  }

  const textureResolution = distortTextureResolution(resolution);
  const data = new Uint8Array(textureResolution * textureResolution * 4);
  const sourceScale = resolution / textureResolution;

  for (let y = 0; y < textureResolution; y++) {
    const sourceY = (y + 0.5) * sourceScale - 0.5;
    for (let x = 0; x < textureResolution; x++) {
      const sourceX = (x + 0.5) * sourceScale - 0.5;
      const dst = (y * textureResolution + x) * 4;
      const dx = clampNumber(
        sampleManualDistortChannel(manualDistort.displacement, manualDistort.smoothMask, resolution, sourceX, sourceY, 0),
        -1,
        1,
      );
      const dy = clampNumber(
        sampleManualDistortChannel(manualDistort.displacement, manualDistort.smoothMask, resolution, sourceX, sourceY, 1),
        -1,
        1,
      );
      const smooth = clampNumber(
        sampleManualDistortChannel(manualDistort.displacement, manualDistort.smoothMask, resolution, sourceX, sourceY, 2),
        0,
        8,
      );
      data[dst] = Math.round((dx * 0.5 + 0.5) * 255);
      data[dst + 1] = Math.round((dy * 0.5 + 0.5) * 255);
      data[dst + 2] = Math.round((smooth / 8) * 255);
      data[dst + 3] = 255;
    }
  }

  gl.activeTexture(gl.TEXTURE5);
  gl.bindTexture(gl.TEXTURE_2D, ctx.manualDistortTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, textureResolution, textureResolution, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  ctx.manualDistortDisplacement = manualDistort.displacement;
  ctx.manualDistortSmoothMask = manualDistort.smoothMask;
  ctx.manualDistortMapResolution = resolution;
}
/**
 * タイルレンダリングオプション。タイル単位で描画する際に指定。
 * - viewport: drawingBuffer 上の描画範囲（通常は (width, height) と同じ）
 * - offset:   u_resolution（最終出力サイズ）空間における、このタイルの左下原点
 *             gl_FragCoord は bottom-up なので、Y も bottom-up で指定する。
 */
export type TileRenderOptions = {
  viewport: [number, number];
  offset: [number, number];
};

function drawStretchPass(
  ctx: WebGLContext,
  sourceTexture: WebGLTexture,
  stretch: StretchConfig,
  scan: number,
  seed: number,
  width: number,
  height: number,
  targetFramebuffer: WebGLFramebuffer | null = null,
): boolean {
  const { gl } = ctx;
  if (!ctx.stretchProgram) return false;
  gl.useProgram(ctx.stretchProgram);
  gl.viewport(0, 0, width, height);
  gl.bindFramebuffer(gl.FRAMEBUFFER, targetFramebuffer);
  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
  gl.uniform1i(ctx.stretchUniforms.u_sourceTex, 3);
  gl.uniform2f(ctx.stretchUniforms.u_resolution, width, height);
  gl.uniform1f(ctx.stretchUniforms.u_bandHeight, Math.max(stretch.bandHeight, 1));
  gl.uniform1f(ctx.stretchUniforms.u_bandHeightVariance, stretch.bandHeightVariance ?? 0);
  gl.uniform1f(ctx.stretchUniforms.u_scan, scan);
  gl.uniform1f(ctx.stretchUniforms.u_variation, stretch.variation);
  gl.uniform1f(ctx.stretchUniforms.u_seed, seed);
  gl.uniform1i(ctx.stretchUniforms.u_glowEnabled, stretch.glowEnabled ? 1 : 0);
  gl.uniform1f(ctx.stretchUniforms.u_glowIntensity, stretch.glowIntensity ?? 0.6);
  gl.uniform1f(ctx.stretchUniforms.u_glowRadius, stretch.glowRadius ?? 18);
  gl.uniform1f(ctx.stretchUniforms.u_glowThreshold, stretch.glowThreshold ?? 0.55);
  const [glowR, glowG, glowB] = hexToRgb(stretch.glowTint ?? '#F0EAD9');
  gl.uniform3f(ctx.stretchUniforms.u_glowTint, glowR, glowG, glowB);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  return true;
}

function drawPostprocessPass(
  ctx: WebGLContext,
  sourceTexture: WebGLTexture,
  gradient: GradientConfig,
  noiseDistortion: NoiseDistortionConfig,
  postprocess: PostprocessConfig,
  effectMode: TextureStackKind,
  width: number,
  height: number,
  fullWidth: number,
  fullHeight: number,
  offsetX: number,
  offsetY: number,
  time: number,
  noiseLoopPeriod: number,
  animationSpeed: number,
  applyPostDiffuse: boolean,
  targetFramebuffer: WebGLFramebuffer | null = null,
  slitScan: SlitScanConfig | null = null,
  animDirectionDegrees = 0,
  slitAnimTimeOverride?: number | null,
  useV2Programs = false,
  diffuseAfterSlit = false,
): boolean {
  const { gl } = ctx;
  const useNoiseStack = useV2Programs && effectMode === 'noise' && Boolean(ctx.noiseStackProgram);
  const useStackCore = useV2Programs && Boolean(ctx.stackCoreProgram) && (
    effectMode === 'slit'
    || effectMode === 'distort'
    || effectMode === 'mirror'
    || effectMode === 'kaleidoscope'
    || effectMode === 'voronoi'
    || effectMode === 'diffuse'
  );
  const glassProgram = effectMode === 'glassV2' ? ctx.glassV2Program : ctx.glassProgram;
  const glassUniforms = effectMode === 'glassV2' ? ctx.glassV2Uniforms : ctx.glassUniforms;
  const glassFallbackActive = effectMode === 'glassV2' ? ctx.glassV2FallbackActive : ctx.glassFallbackActive;
  const useGlassProgram = useV2Programs
    && (effectMode === 'glass' || effectMode === 'glassV2')
    && Boolean(glassProgram || glassFallbackActive);
  const usePrismProgram = useV2Programs && effectMode === 'prism' && Boolean(ctx.prismProgram);
  const selectedProgram = useNoiseStack
    ? ctx.noiseStackProgram
    : useStackCore
    ? ctx.stackCoreProgram
    : useGlassProgram
      ? (glassProgram ?? ctx.postprocessProgram)
      : usePrismProgram
        ? ctx.prismProgram
        : ctx.postprocessProgram;
  const selectedUniforms = useNoiseStack
    ? ctx.noiseStackUniforms
    : useStackCore
    ? ctx.stackCoreUniforms
    : useGlassProgram
      ? (glassProgram ? glassUniforms : ctx.postprocessUniforms)
      : usePrismProgram
        ? ctx.prismUniforms
        : ctx.postprocessUniforms;
  if (!selectedProgram) return false;
  const previousProgram = ctx.postprocessProgram;
  const previousUniforms = ctx.postprocessUniforms;
  ctx.postprocessProgram = selectedProgram;
  ctx.postprocessUniforms = selectedUniforms;
  if (effectMode === 'distort') uploadManualDistortMap(ctx, postprocess);
  gl.useProgram(ctx.postprocessProgram);
  gl.viewport(0, 0, width, height);
  gl.bindFramebuffer(gl.FRAMEBUFFER, targetFramebuffer);
  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
  gl.uniform1i(ctx.postprocessUniforms.u_sourceTex, 3);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, ctx.gradientRampTexture);
  gl.uniform1i(ctx.postprocessUniforms.u_gradientRamp, 1);
  gl.activeTexture(gl.TEXTURE5);
  gl.bindTexture(gl.TEXTURE_2D, ctx.manualDistortTexture);
  gl.uniform1i(ctx.postprocessUniforms.u_distortMap, 5);
  gl.uniform2f(ctx.postprocessUniforms.u_resolution, width, height);
  gl.uniform2f(ctx.postprocessUniforms.u_fullResolution, fullWidth, fullHeight);
  gl.uniform2f(ctx.postprocessUniforms.u_tileOffset, offsetX, offsetY);
  const anchors = gradient.anchors ?? GRADIENT_ANCHOR_DEFAULTS[gradient.gradientType ?? 'linear'];
  gl.uniform2f(ctx.postprocessUniforms.u_gradAnchor0, anchors[0][0], anchors[0][1]);
  gl.uniform2f(ctx.postprocessUniforms.u_gradAnchor1, anchors[1][0], anchors[1][1]);
  gl.uniform1f(ctx.postprocessUniforms.u_maxDisplacement, postprocess.maxDisplacement);
  gl.uniform1i(ctx.postprocessUniforms.u_effectEnabled, 1);
  const effectModeMap = { distort: 0, mirror: 1, kaleidoscope: 2, prism: 3, voronoi: 4, glass: 5, diffuse: 6, noise: 7, slit: 8, glassV2: 9, particles: 0 } as const;
  gl.uniform1i(ctx.postprocessUniforms.u_effectMode, effectModeMap[effectMode]);
  gl.uniform1i(ctx.postprocessUniforms.u_stackSlitDiffuseAfter, diffuseAfterSlit ? 1 : 0);
  gl.uniform1i(ctx.postprocessUniforms.u_noiseEnabled, noiseDistortion.enabled ? 1 : 0);
  gl.uniform1i(ctx.postprocessUniforms.u_noiseType, NOISE_TYPE_MAP[noiseDistortion.type]);
  gl.uniform1f(ctx.postprocessUniforms.u_noiseAmount, noiseDistortion.amount ?? 0);
  gl.uniform1f(ctx.postprocessUniforms.u_noiseScale, noiseDistortion.scale ?? 1);
  gl.uniform1i(ctx.postprocessUniforms.u_noiseOctaves, noiseDistortion.octaves ?? 3);
  gl.uniform1f(ctx.postprocessUniforms.u_noiseEvolution, noiseDistortion.evolution ?? 0);
  gl.uniform1f(ctx.postprocessUniforms.u_noiseSeed, noiseDistortion.noiseSeed ?? 0);
  gl.uniform1f(ctx.postprocessUniforms.u_time, time);
  gl.uniform1f(ctx.postprocessUniforms.u_noiseLoopPeriod, Math.max(Math.abs(noiseLoopPeriod), 0.0001));
  gl.uniform1i(ctx.postprocessUniforms.u_noiseLoopMode, noiseDistortion.noiseLoopMode === 'seamless' ? 1 : 0);
  gl.uniform1f(ctx.postprocessUniforms.u_noiseLoopBlend, Math.min(Math.max(noiseDistortion.noiseLoopBlend ?? 0.75, 0.001), 1));
  const noiseDirectionRadians = (animDirectionDegrees * Math.PI) / 180;
  gl.uniform2f(ctx.postprocessUniforms.u_animDir, -Math.sin(noiseDirectionRadians), -Math.cos(noiseDirectionRadians));
  gl.uniform1f(ctx.postprocessUniforms.u_dwInitVal, noiseDistortion.dwInitVal);
  gl.uniform1f(ctx.postprocessUniforms.u_dwInitAmp, noiseDistortion.dwInitAmp);
  gl.uniform1f(ctx.postprocessUniforms.u_dwRotAngle1, noiseDistortion.dwRotAngle1);
  gl.uniform1f(ctx.postprocessUniforms.u_dwRotAngle2, noiseDistortion.dwRotAngle2);
  gl.uniform1f(ctx.postprocessUniforms.u_dwDist1, noiseDistortion.dwDist1);
  gl.uniform1f(ctx.postprocessUniforms.u_dwDist2, noiseDistortion.dwDist2);
  gl.uniform1f(ctx.postprocessUniforms.u_dwDist3, noiseDistortion.dwDist3);
  gl.uniform1f(ctx.postprocessUniforms.u_dwDriftAngle, noiseDistortion.dwDriftAngle * Math.PI / 180);
  const seamlessTypeMap = { simplex: 0, fbm: 1, curl: 2 } as const;
  gl.uniform1i(ctx.postprocessUniforms.u_noiseSeamlessType, seamlessTypeMap[noiseDistortion.seamlessType] ?? 0);
  gl.uniform1i(ctx.postprocessUniforms.u_seamlessAnimation, noiseDistortion.seamlessAnimation === 'radial' ? 1 : 0);
  gl.uniform1f(ctx.postprocessUniforms.u_seamlessTwist, noiseDistortion.seamlessTwist);
  const voronoiDistanceMap = { euclidean: 0, manhattan: 1, chebyshev: 2, minkowski: 3 } as const;
  const voronoiFeatureMap = { f1: 0, f2: 1, distance_to_edge: 2 } as const;
  gl.uniform1i(ctx.postprocessUniforms.u_voronoiDistMetric, voronoiDistanceMap[noiseDistortion.voronoiDistMetric] ?? 0);
  gl.uniform1f(ctx.postprocessUniforms.u_voronoiRandomness, noiseDistortion.voronoiRandomness ?? 1);
  gl.uniform1i(ctx.postprocessUniforms.u_voronoiFeature, voronoiFeatureMap[noiseDistortion.voronoiFeature] ?? 0);
  gl.uniform1f(ctx.postprocessUniforms.u_voronoiMinkowskiExp, noiseDistortion.voronoiMinkowskiExp ?? 2);
  gl.uniform1f(ctx.postprocessUniforms.u_ridgeSharpness, noiseDistortion.ridgeSharpness ?? 2);
  gl.uniform1f(ctx.postprocessUniforms.u_ridgeGain, noiseDistortion.ridgeGain ?? 0);
  gl.uniform1f(ctx.postprocessUniforms.u_ridgeLacunarity, noiseDistortion.ridgeLacunarity ?? 2);
  gl.uniform1f(ctx.postprocessUniforms.u_ridgePersistence, noiseDistortion.ridgePersistence ?? 0.6);
  gl.uniform1f(ctx.postprocessUniforms.u_ridgeOffset, noiseDistortion.ridgeOffset ?? 1);
  gl.uniform1f(ctx.postprocessUniforms.u_ridgeWarp, noiseDistortion.ridgeWarp ?? 1);
  gl.uniform1i(ctx.postprocessUniforms.u_aeFractalType, noiseDistortion.aeFractalType === 'turbulent' ? 1 : 0);
  gl.uniform1f(ctx.postprocessUniforms.u_aeSubInfluence, noiseDistortion.aeSubInfluence ?? 0.7);
  gl.uniform1f(ctx.postprocessUniforms.u_aeSubScaling, noiseDistortion.aeSubScaling ?? 1.78);
  gl.uniform1f(ctx.postprocessUniforms.u_aeSubRotation, (noiseDistortion.aeSubRotation ?? 0) * Math.PI / 180);
  gl.uniform1f(ctx.postprocessUniforms.u_aeContrast, noiseDistortion.aeContrast ?? 1);
  gl.uniform1f(ctx.postprocessUniforms.u_aeBrightness, noiseDistortion.aeBrightness ?? 0);
  gl.uniform1i(ctx.postprocessUniforms.u_curlSteps, noiseDistortion.curlSteps);
  gl.uniform1f(ctx.postprocessUniforms.u_curlSpeed, noiseDistortion.curlSpeed ?? 1);
  gl.uniform1f(ctx.postprocessUniforms.u_curlEps, noiseDistortion.curlEps ?? 0.01);
  gl.uniform1f(ctx.postprocessUniforms.u_curlSeed, noiseDistortion.curlSeed ?? 0);
  gl.uniform1f(ctx.postprocessUniforms.u_prismSpeed, Math.max(Math.abs(animationSpeed), 0.0));
  const mirrorModeMap = { horizontal: 0, vertical: 1, quad: 2 } as const;
  gl.uniform1i(ctx.postprocessUniforms.u_mirrorMode, mirrorModeMap[postprocess.mirrorMode ?? 'horizontal']);
  const kaleidoscopeTypeMap = { unfold: 0, flower: 1, starlish: 2 } as const;
  gl.uniform1i(ctx.postprocessUniforms.u_kaleidoscopeType, kaleidoscopeTypeMap[postprocess.kaleidoscopeType ?? 'unfold']);
  gl.uniform1f(ctx.postprocessUniforms.u_kaleidoscopeSlices, postprocess.kaleidoscopeSlices ?? 8);
  gl.uniform1f(ctx.postprocessUniforms.u_kaleidoscopeRotation, ((postprocess.kaleidoscopeRotation ?? 0) * Math.PI) / 180);
  gl.uniform1f(ctx.postprocessUniforms.u_kaleidoscopeZoom, postprocess.kaleidoscopeZoom ?? 1);
  const prismCenter = postprocess.prismCenter ?? [0.5, 0.5];
  gl.uniform2f(ctx.postprocessUniforms.u_prismCenter, prismCenter[0], prismCenter[1]);
  gl.uniform1f(ctx.postprocessUniforms.u_prismRayCount, postprocess.prismRayCount ?? 24);
  gl.uniform1f(ctx.postprocessUniforms.u_prismLength, postprocess.prismLength ?? 0.65);
  gl.uniform1f(ctx.postprocessUniforms.u_prismLengthRandomness, postprocess.prismLengthRandomness ?? 0.45);
  gl.uniform1f(ctx.postprocessUniforms.u_prismWidth, postprocess.prismWidth ?? 0.018);
  gl.uniform1f(ctx.postprocessUniforms.u_prismRandomness, postprocess.prismRandomness ?? 0.45);
  gl.uniform1f(ctx.postprocessUniforms.u_prismBlur, postprocess.prismBlur ?? 0.35);
  gl.uniform1f(ctx.postprocessUniforms.u_prismIntensity, postprocess.prismIntensity ?? 0.9);
  gl.uniform1f(ctx.postprocessUniforms.u_prismSeed, postprocess.prismSeed ?? 0);
  gl.uniform1f(ctx.postprocessUniforms.u_prismInnerRadius, postprocess.prismInnerRadius ?? 0.16);
  gl.uniform1f(ctx.postprocessUniforms.u_postVoronoiScale, postprocess.voronoiScale ?? 8);
  gl.uniform1f(ctx.postprocessUniforms.u_postVoronoiRandomness, postprocess.voronoiRandomness ?? 0.85);
  gl.uniform1f(ctx.postprocessUniforms.u_postVoronoiAngle, ((postprocess.voronoiAngle ?? 35) * Math.PI) / 180);
  gl.uniform1f(ctx.postprocessUniforms.u_postVoronoiGradientScale, postprocess.voronoiGradientScale ?? 1.15);
  gl.uniform1f(ctx.postprocessUniforms.u_postVoronoiEdgeWidth, postprocess.voronoiEdgeWidth ?? 0.025);
  gl.uniform1f(ctx.postprocessUniforms.u_postVoronoiSeed, postprocess.voronoiSeed ?? 0);
  const glass = normalizeGlassRenderParameters(postprocess);
  gl.uniform1f(ctx.postprocessUniforms.u_glassScale, glass.scale);
  gl.uniform1f(ctx.postprocessUniforms.u_glassStretch, glass.stretch);
  gl.uniform1f(ctx.postprocessUniforms.u_glassRotation, glass.rotationRadians);
  gl.uniform1i(ctx.postprocessUniforms.u_glassComplexity, glass.complexity);
  gl.uniform1f(ctx.postprocessUniforms.u_glassWarp, glass.warp);
  gl.uniform1f(ctx.postprocessUniforms.u_glassSeed, glass.seed);
  gl.uniform1f(ctx.postprocessUniforms.u_glassNoiseInfluence, glass.noiseInfluence);
  gl.uniform1f(ctx.postprocessUniforms.u_glassRefraction, glass.refraction);
  gl.uniform1f(ctx.postprocessUniforms.u_glassChromaticAberration, glass.chromaticAberration);
  gl.uniform1f(ctx.postprocessUniforms.u_glassRoughness, glass.roughness);
  gl.uniform1f(ctx.postprocessUniforms.u_glassHighlight, glass.highlight);
  gl.uniform1f(ctx.postprocessUniforms.u_glassMix, glass.mix);
  gl.uniform1f(ctx.postprocessUniforms.u_glassEvolution, glass.evolution);
  gl.uniform1f(ctx.postprocessUniforms.u_glassMotion, glass.motion);
  const diffuseScale = diffuseResolutionScale(fullWidth, fullHeight);
  gl.uniform1i(ctx.postprocessUniforms.u_diffuseEnabled, applyPostDiffuse && postprocess.diffuseEnabled ? 1 : 0);
  gl.uniform1i(ctx.postprocessUniforms.u_diffuseMode, DIFFUSE_MODE_MAP[postprocess.diffuseMode ?? 'block'] ?? 0);
  gl.uniform1f(ctx.postprocessUniforms.u_diffuseScatter, postprocess.diffuseMode === 'dither' ? 100 : postprocess.diffuseScatter * diffuseScale);
  gl.uniform1f(ctx.postprocessUniforms.u_diffuseGrain, postprocess.diffuseGrain * diffuseScale);
  gl.uniform1f(ctx.postprocessUniforms.u_diffuseSeed, postprocess.diffuseSeed);
  gl.uniform1f(ctx.postprocessUniforms.u_diffuseDitherThreshold, postprocess.diffuseDitherThreshold ?? 0.5);
  const stackSlitModeMap = { linear: 0, circular: 1, polygon: 2, wave: 3 } as const;
  const stackSlit: SlitScanConfig = slitScan ?? {
    enabled: false,
    mode: 'linear' as const,
    angle: 0,
    waveType: 'sine',
    waveHeight: 0,
    polygonSides: 6,
    slitWidth: 1,
    offset: 0,
    offsetSpeed: 0,
    animEnabled: false,
    animMode: 'off',
    phaseAnimEnabled: false,
    phaseSpeed: 0,
    variance: 0,
    seed: 0,
    slitPhase: 0,
    selectedSlitIdx: -1,
    slitDeltas: {},
    pixelPerfect: false,
    offsetAngle: 90,
  };
  gl.uniform1i(ctx.postprocessUniforms.u_stackSlitMode, stackSlitModeMap[stackSlit.mode]);
  gl.uniform1f(ctx.postprocessUniforms.u_stackSlitAngle, (stackSlit.angle * Math.PI) / 180);
  const stackSlitWaveTypeMap = { sine: 0, sawtooth: 1, semicircle: 2 } as const;
  gl.uniform1i(ctx.postprocessUniforms.u_stackSlitWaveType, stackSlitWaveTypeMap[stackSlit.waveType ?? 'sine']);
  gl.uniform1f(ctx.postprocessUniforms.u_stackSlitWaveHeight, stackSlit.waveHeight ?? 0);
  gl.uniform1i(ctx.postprocessUniforms.u_stackSlitPolygonSides, Math.max(3, Math.min(32, Math.round(stackSlit.polygonSides ?? 6))));
  gl.uniform1f(ctx.postprocessUniforms.u_stackSlitOffsetAngle, ((stackSlit.offsetAngle ?? 90) * Math.PI) / 180);
  const stackSlitPixelPerfect = stackSlit.pixelPerfect ?? false;
  const roundStackSlit = (value: number) => stackSlitPixelPerfect ? Math.round(value) : value;
  const stackSlitWidth = Math.max(1, roundStackSlit(stackSlit.slitWidth));
  gl.uniform1f(ctx.postprocessUniforms.u_stackSlitWidth, stackSlitWidth);
  gl.uniform1f(ctx.postprocessUniforms.u_stackSlitOffset, stackSlit.offset);
  gl.uniform1f(ctx.postprocessUniforms.u_stackSlitVariance, stackSlit.variance);
  const stackSlitAnimationBaseTime = stackSlit.animEnabled
    ? (slitAnimTimeOverride != null ? slitAnimTimeOverride : performance.now() / 1000)
    : 0;
  const stackSlitOffsetAnimationActive = stackSlit.animEnabled
    && stackSlit.animMode !== 'off'
    && stackSlit.offsetSpeed !== 0;
  const stackSlitAnimationTime = stackSlitOffsetAnimationActive
    ? ((stackSlitAnimationBaseTime * stackSlit.offsetSpeed) % 1 + 1) % 1
    : 0;
  const stackSlitPhaseOffset = stackSlit.animEnabled
    && (stackSlit.phaseAnimEnabled ?? false)
    && (stackSlit.phaseSpeed ?? 0) !== 0
    ? -stackSlitAnimationBaseTime * stackSlitWidth * (stackSlit.phaseSpeed ?? 1)
    : 0;
  gl.uniform2f(
    ctx.postprocessUniforms.u_stackSlitParams,
    roundStackSlit((stackSlit.slitPhase ?? 0) + stackSlitPhaseOffset),
    stackSlit.seed,
  );
  const stackSlitDeltas: Array<[number, number]> = [];
  for (const indexKey in stackSlit.slitDeltas ?? {}) {
    if (!Object.prototype.hasOwnProperty.call(stackSlit.slitDeltas, indexKey)) continue;
    const index = Number(indexKey);
    const rawDelta = stackSlit.slitDeltas[index];
    const delta = stackSlitPixelPerfect ? Math.round(rawDelta) : rawDelta;
    if (!Number.isFinite(index) || !Number.isFinite(delta) || delta === 0) continue;
    stackSlitDeltas.push([index, delta]);
    if (stackSlitDeltas.length === 32) break;
  }
  stackSlitDeltas.sort((a, b) => a[0] - b[0]);
  const stackSlitDeltaUniforms = [
    'u_stackSlitDelta01', 'u_stackSlitDelta23', 'u_stackSlitDelta45', 'u_stackSlitDelta67',
    'u_stackSlitDelta89', 'u_stackSlitDeltaAB', 'u_stackSlitDeltaCD', 'u_stackSlitDeltaEF',
    'u_stackSlitDeltaGH', 'u_stackSlitDeltaIJ', 'u_stackSlitDeltaKL', 'u_stackSlitDeltaMN',
    'u_stackSlitDeltaOP', 'u_stackSlitDeltaQR', 'u_stackSlitDeltaST', 'u_stackSlitDeltaUV',
  ] as const;
  for (let uniformIndex = 0; uniformIndex < stackSlitDeltaUniforms.length; uniformIndex++) {
    const first = stackSlitDeltas[uniformIndex * 2] ?? [-9999, 0];
    const second = stackSlitDeltas[uniformIndex * 2 + 1] ?? [-9999, 0];
    gl.uniform4f(
      ctx.postprocessUniforms[stackSlitDeltaUniforms[uniformIndex]],
      first[0], first[1], second[0], second[1],
    );
  }
  gl.uniform1i(ctx.postprocessUniforms.u_stackSlitAnimEnabled, stackSlitOffsetAnimationActive ? 1 : 0);
  gl.uniform1f(ctx.postprocessUniforms.u_stackSlitAnimTime, stackSlitAnimationTime);
  gl.uniform1i(ctx.postprocessUniforms.u_stackSlitAnimMode, stackSlit.animMode === 'pingpong' ? 1 : 0);
  gl.uniform1i(ctx.postprocessUniforms.u_stackSlitPixelPerfect, stackSlitPixelPerfect ? 1 : 0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  if (targetFramebuffer === null) ctx.hasPresentedFrame = true;
  ctx.postprocessProgram = previousProgram;
  ctx.postprocessUniforms = previousUniforms;
  return true;
}

function drawPrismCompositePass(
  ctx: WebGLContext,
  baseTexture: WebGLTexture,
  glowTexture: WebGLTexture,
  postprocess: PostprocessConfig,
  width: number,
  height: number,
  targetFramebuffer: WebGLFramebuffer | null = null,
): void {
  const { gl } = ctx;
  if (!ctx.prismCompositeProgram) return;
  gl.useProgram(ctx.prismCompositeProgram);
  gl.viewport(0, 0, width, height);
  gl.bindFramebuffer(gl.FRAMEBUFFER, targetFramebuffer);
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, baseTexture);
  gl.uniform1i(ctx.prismCompositeUniforms.u_baseTex, 2);
  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, glowTexture);
  gl.uniform1i(ctx.prismCompositeUniforms.u_glowTex, 3);
  gl.uniform2f(ctx.prismCompositeUniforms.u_resolution, width, height);
  const prismCenter = postprocess.prismCenter ?? [0.5, 0.5];
  gl.uniform2f(ctx.prismCompositeUniforms.u_prismCenter, prismCenter[0], prismCenter[1]);
  gl.uniform1f(ctx.prismCompositeUniforms.u_glowIntensity, postprocess.prismIntensity ?? 0.9);
  gl.uniform1f(ctx.prismCompositeUniforms.u_chromaticAberration, postprocess.prismChromaticAberration ?? 0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  if (targetFramebuffer === null) ctx.hasPresentedFrame = true;
}

function drawPrismPostprocessPass(
  ctx: WebGLContext,
  sourceTexture: WebGLTexture,
  gradient: GradientConfig,
  noiseDistortion: NoiseDistortionConfig,
  postprocess: PostprocessConfig,
  width: number,
  height: number,
  fullWidth: number,
  fullHeight: number,
  offsetX: number,
  offsetY: number,
  time: number,
  noiseLoopPeriod: number,
  animationSpeed: number,
  applyPostDiffuse: boolean,
  targetFramebuffer: WebGLFramebuffer | null = null,
  useV2Programs = false,
): void {
  const { gl } = ctx;
  if (!(ctx.prismProgram || ctx.postprocessProgram) || !ctx.prismCompositeProgram) return;
  drawPostprocessPass(ctx, sourceTexture, gradient, noiseDistortion, postprocess, 'prism', width, height, fullWidth, fullHeight, offsetX, offsetY, time, noiseLoopPeriod, animationSpeed, applyPostDiffuse, ctx.prismScratchFbo, null, 0, null, useV2Programs);

  const sigma = Math.max(postprocess.prismGlowRadius ?? 0, 0);
  if (sigma <= 0.01) {
    drawPrismCompositePass(ctx, ctx.prismScratchTexture, ctx.prismScratchTexture, { ...postprocess, prismIntensity: 0 }, width, height, targetFramebuffer);
    return;
  }

  const radius = Math.min(Math.ceil(sigma * 3), 32);
  if (!ctx.blurProgram) return;
  gl.useProgram(ctx.blurProgram);
  gl.uniform2f(ctx.blurUniforms.u_resolution, width, height);
  gl.uniform1f(ctx.blurUniforms.u_blurSigma, sigma);
  gl.uniform1i(ctx.blurUniforms.u_blurRadius, radius);
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, ctx.prismScratchTexture);
  gl.uniform1i(ctx.blurUniforms.u_tex, 2);
  gl.uniform2f(ctx.blurUniforms.u_blurDir, 1.0, 0.0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, ctx.prismBlurFbo);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.bindTexture(gl.TEXTURE_2D, ctx.prismBlurTexture);
  gl.uniform2f(ctx.blurUniforms.u_blurDir, 0.0, 1.0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, ctx.prismGlowFbo);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  drawPrismCompositePass(ctx, ctx.prismScratchTexture, ctx.prismGlowTexture, postprocess, width, height, targetFramebuffer);
}

function drawPostprocessLayerOutput(
  ctx: WebGLContext,
  sourceTexture: WebGLTexture,
  gradient: GradientConfig,
  noiseDistortion: NoiseDistortionConfig,
  postprocess: PostprocessConfig,
  effectMode: PostprocessStackKind,
  width: number,
  height: number,
  fullWidth: number,
  fullHeight: number,
  offsetX: number,
  offsetY: number,
  time: number,
  noiseLoopPeriod: number,
  animationSpeed: number,
  applyPostDiffuse: boolean,
  targetFramebuffer: WebGLFramebuffer | null,
): void {
  if (effectMode === 'prism') {
    drawPrismPostprocessPass(ctx, sourceTexture, gradient, noiseDistortion, postprocess, width, height, fullWidth, fullHeight, offsetX, offsetY, time, noiseLoopPeriod, animationSpeed, applyPostDiffuse, targetFramebuffer);
  } else {
    drawPostprocessPass(ctx, sourceTexture, gradient, noiseDistortion, postprocess, effectMode, width, height, fullWidth, fullHeight, offsetX, offsetY, time, noiseLoopPeriod, animationSpeed, applyPostDiffuse, targetFramebuffer);
  }
}

function choosePostprocessTarget(
  ctx: WebGLContext,
  sourceTexture: WebGLTexture,
): { fbo: WebGLFramebuffer; texture: WebGLTexture } {
  if (sourceTexture === ctx.postprocessTextureA) {
    return { fbo: ctx.postprocessFboB, texture: ctx.postprocessTextureB };
  }
  return { fbo: ctx.postprocessFboA, texture: ctx.postprocessTextureA };
}

function drawPostprocessStackOutput(
  ctx: WebGLContext,
  sourceTexture: WebGLTexture,
  gradient: GradientConfig,
  noiseDistortion: NoiseDistortionConfig,
  postprocess: PostprocessConfig,
  width: number,
  height: number,
  fullWidth: number,
  fullHeight: number,
  offsetX: number,
  offsetY: number,
  time: number,
  noiseLoopPeriod: number,
  animationSpeed: number,
  outputToTexture: boolean,
): WebGLTexture | null {
  const layers = getActivePostprocessStackLayers(postprocess).filter(layer => (
    (layer.kind !== 'glass' && layer.kind !== 'glassV2') || !isGlassOpticallyIdentity(postprocess)
  ));
  if (layers.length === 0) return null;

  let currentTexture = sourceTexture;
  let outputTexture: WebGLTexture | null = null;
  layers.forEach((layer, index) => {
    const isLast = index === layers.length - 1;
    const renderToScreen = isLast && !outputToTexture;
    const target = renderToScreen ? null : choosePostprocessTarget(ctx, currentTexture);
    drawPostprocessLayerOutput(
      ctx,
      currentTexture,
      gradient,
      noiseDistortion,
      postprocess,
      layer.kind,
      width,
      height,
      fullWidth,
      fullHeight,
      offsetX,
      offsetY,
      time,
      noiseLoopPeriod,
      animationSpeed,
      isLast,
      target?.fbo ?? null,
    );
    if (target) {
      currentTexture = target.texture;
      outputTexture = target.texture;
    }
  });

  return outputToTexture ? outputTexture : null;
}

function seededRandom(seed: number): () => number {
  let state = (Math.floor(seed) ^ 0x9e3779b9) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function ensureParticleInstances(ctx: WebGLContext, count: number, seed: number): void {
  const { gl } = ctx;
  if (!ctx.particleInstanceBuffer) return;
  if (ctx.particleInstanceCount === count && ctx.particleInstanceSeed === seed) return;

  const rand = seededRandom(seed);
  const data = new Float32Array(count * 8);
  const cols = Math.max(1, Math.ceil(Math.sqrt(count)));
  const rows = Math.max(1, Math.ceil(count / cols));
  for (let i = 0; i < count; i++) {
    const o = i * 8;
    const col = i % cols;
    const row = Math.floor(i / cols);
    data[o + 0] = (col + rand()) / cols;
    data[o + 1] = (row + rand()) / rows;
    data[o + 2] = rand();
    data[o + 3] = rand();
    data[o + 4] = rand();
    data[o + 5] = rand();
    data[o + 6] = rand();
    data[o + 7] = rand();
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, ctx.particleInstanceBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  ctx.particleInstanceCount = count;
  ctx.particleInstanceSeed = seed;
}

function drawParticleOverlay(
  ctx: WebGLContext,
  sourceTexture: WebGLTexture,
  gradient: GradientConfig,
  postprocess: PostprocessConfig,
  width: number,
  height: number,
  fullWidth: number,
  fullHeight: number,
  offsetX: number,
  offsetY: number,
  time: number,
): void {
  const { gl } = ctx;
  if (!ctx.particleProgram || !ctx.particleVao) return;

  const count = Math.max(0, Math.min(500000, Math.round(postprocess.particleCount ?? 0)));
  const opacity = Math.max(0, Math.min(1, postprocess.particleOpacity ?? 0.65));
  if (count <= 0 || opacity <= 0) return;

  const seed = postprocess.particleSeed ?? 0;
  ensureParticleInstances(ctx, count, seed);

  const anchors = gradient.anchors ?? GRADIENT_ANCHOR_DEFAULTS[gradient.gradientType ?? 'linear'];
  gl.useProgram(ctx.particleProgram);
  gl.viewport(0, 0, width, height);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
  gl.uniform1i(ctx.particleUniforms.u_sourceTex, 3);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, ctx.gradientRampTexture);
  gl.uniform1i(ctx.particleUniforms.u_gradientRamp, 1);
  gl.uniform2f(ctx.particleUniforms.u_resolution, width, height);
  gl.uniform2f(ctx.particleUniforms.u_fullResolution, fullWidth, fullHeight);
  gl.uniform2f(ctx.particleUniforms.u_tileOffset, offsetX, offsetY);
  gl.uniform2f(ctx.particleUniforms.u_gradAnchor0, anchors[0][0], anchors[0][1]);
  gl.uniform2f(ctx.particleUniforms.u_gradAnchor1, anchors[1][0], anchors[1][1]);
  const emitterType = (postprocess.particleEmitterType as string) === 'nexus'
    ? 'point'
    : postprocess.particleEmitterType ?? 'field';
  const emitterPoint = postprocess.particleEmitterPoint ?? [0.5, 0.5];
  gl.uniform2f(
    ctx.particleUniforms.u_emitterPoint,
    Math.max(0, Math.min(1, emitterPoint[0] ?? 0.5)),
    Math.max(0, Math.min(1, emitterPoint[1] ?? 0.5)),
  );
  gl.uniform1i(ctx.particleUniforms.u_emitterType, PARTICLE_EMITTER_TYPE_MAP[emitterType as keyof typeof PARTICLE_EMITTER_TYPE_MAP] ?? 0);
  gl.uniform1f(ctx.particleUniforms.u_time, time);
  gl.uniform1f(ctx.particleUniforms.u_size, Math.max(0.1, postprocess.particleSize ?? 3.5));
  gl.uniform1f(ctx.particleUniforms.u_sizeRandomness, Math.max(0, Math.min(1, postprocess.particleSizeRandomness ?? 0.65)));
  gl.uniform1f(ctx.particleUniforms.u_lifeCycle, Math.max(0.001, postprocess.particleLifeCycle ?? 4));
  gl.uniform1f(ctx.particleUniforms.u_lifeRandom, Math.max(0, Math.min(1, postprocess.particleLifeRandom ?? 0)));
  gl.uniform1f(ctx.particleUniforms.u_sizeOverLife, Math.max(0, Math.min(1, postprocess.particleSizeOverLife ?? 0)));
  gl.uniform1f(ctx.particleUniforms.u_speed, Math.max(0, postprocess.particleSpeed ?? 0.32));
  gl.uniform1f(ctx.particleUniforms.u_spread, Math.max(0, Math.min(1, postprocess.particleSpread ?? 0.85)));
  gl.uniform1f(ctx.particleUniforms.u_turbulence, Math.max(0, Math.min(1, postprocess.particleTurbulence ?? 0.45)));
  gl.uniform1f(ctx.particleUniforms.u_opacity, opacity);
  gl.uniform1f(ctx.particleUniforms.u_colorVariance, Math.max(0, Math.min(0.5, postprocess.particleColorVariance ?? 0.18)));
  gl.uniform1f(ctx.particleUniforms.u_direction, ((postprocess.particleDirection ?? 0) * Math.PI) / 180);
  gl.uniform1f(ctx.particleUniforms.u_edgeFade, Math.max(0, Math.min(1, postprocess.particleEdgeFade ?? 0.08)));
  gl.uniform1f(ctx.particleUniforms.u_curlScale, Math.max(0.001, postprocess.particleCurlScale ?? 5.5));
  gl.uniform1f(ctx.particleUniforms.u_curlStrength, Math.max(0, postprocess.particleCurlStrength ?? 0.88));
  gl.uniform1f(ctx.particleUniforms.u_curlSpeed, Math.max(0, postprocess.particleCurlSpeed ?? 0.9));
  gl.uniform1f(ctx.particleUniforms.u_curlEvolution, postprocess.particleCurlEvolution ?? 0);
  gl.uniform1f(ctx.particleUniforms.u_radialForce, postprocess.particleRadialForce ?? 0.18);
  gl.uniform1f(ctx.particleUniforms.u_radialFalloff, Math.max(0.001, postprocess.particleRadialFalloff ?? 0.85));
  gl.uniform1f(ctx.particleUniforms.u_depth, Math.max(0, postprocess.particleDepth ?? 0.75));
  gl.uniform1f(ctx.particleUniforms.u_feather, Math.max(0, Math.min(1, postprocess.particleFeather ?? 0.55)));
  gl.uniform1f(ctx.particleUniforms.u_core, Math.max(0, Math.min(1, postprocess.particleCore ?? 0.35)));
  gl.uniform1f(ctx.particleUniforms.u_brightness, Math.max(0, postprocess.particleBrightness ?? 1.25));
  gl.uniform1f(ctx.particleUniforms.u_colorOverLife, Math.max(0, Math.min(1, postprocess.particleColorOverLife ?? 0)));
  gl.uniform1i(ctx.particleUniforms.u_colorOverLifeMode, 1);

  gl.bindVertexArray(ctx.particleVao);
  gl.enable(gl.BLEND);
  if ((postprocess.particleBlendMode ?? 'alpha') === 'add') {
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  } else {
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }
  gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, count);
  gl.disable(gl.BLEND);
  gl.bindVertexArray(null);
}

export function render(
  ctx: WebGLContext,
  gradient: GradientConfig,
  noiseDistortion: NoiseDistortionConfig,
  diffuse: DiffuseConfig,
  slitScan: SlitScanConfig,
  stretch: StretchConfig,
  normalMap: NormalMapConfig,
  radon: RadonConfig,
  iridescence: IridescenceConfig,
  manualDistort: ManualDistortConfig,
  postprocess: PostprocessConfig,
  matcap: MatcapConfig,
  width: number,
  height: number,
  time = 0,
  animDirection = 0,
  slitAnimTimeOverride?: number | null,
  stretchScanOverride?: number | null,
  tile?: TileRenderOptions,
  sourceImageCanvas?: HTMLCanvasElement | null,
  imageGradientSource?: HTMLCanvasElement | null,
  imageGradient: ImageGradientConfig = IMAGE_GRADIENT_DEFAULTS,
  noiseLoopPeriod = 1,
  animationSpeed = 1,
  imageMaskSource?: TexImageSource | null,
  imageMaskEnabled = false,
  effectPipeline?: EffectPipelineConfig,
): void {
  const isV2Pipeline = effectPipeline?.version === 'stack-v2';
  // Start the complete generator only after the lightweight bootstrap has
  // presented a GPU frame. This is also required by V2 because its Base stage
  // supplies the texture consumed by the Effect Stack.
  const generatorReady = requestLazyProgram(ctx, 'generator');
  const { gl, program, uniforms, gradientRampTexture, sourceImageTexture, imageGradientTexture, imageMaskTexture } = ctx;
  noiseDistortion = optimizeNoiseDistortion(noiseDistortion, ctx.renderOptimization);
  stretch = optimizeStretch(stretch, ctx.renderOptimization);
  normalMap = optimizeNormalMap(normalMap, ctx.renderOptimization);
  postprocess = optimizePostprocess(postprocess, ctx.renderOptimization);

  // タイル指定時はタイルの viewport サイズを使用、未指定なら全体サイズ
  const vpW = tile ? tile.viewport[0] : width;
  const vpH = tile ? tile.viewport[1] : height;
  const tileOx = tile ? tile.offset[0] : 0;
  const tileOy = tile ? tile.offset[1] : 0;

  // キャンバスサイズをチェック（readPixels や toBlob が失敗する可能性がある）
  const maxTexSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  if (vpW > maxTexSize || vpH > maxTexSize) {
    console.error(
      `[WebGL render] Viewport size (${vpW}×${vpH}) exceeds MAX_TEXTURE_SIZE (${maxTexSize}). ` +
      `This may cause black or corrupted output. Consider reducing tile size.`
    );
  }
  // 描画前の drawingBuffer 状態を確認（高解像度時の黒出力デバッグ）
  if (gl.drawingBufferWidth !== vpW || gl.drawingBufferHeight !== vpH) {
    console.warn(
      `[WebGL render] drawingBuffer (${gl.drawingBufferWidth}×${gl.drawingBufferHeight}) ` +
      `does not match viewport size (${vpW}×${vpH}). Viewport will overflow → black regions expected.`
    );
  }

  gl.useProgram(program);
  gl.viewport(0, 0, vpW, vpH);
  gl.uniform2f(uniforms.u_tileOffset, tileOx, tileOy);
  gl.uniform2f(uniforms.u_tileSize, vpW, vpH);
  gl.uniform1i(uniforms.u_gradientType, GRADIENT_TYPE_MAP[gradient.gradientType ?? 'linear']);

  // アンカーポイントをシェーダーに渡す（フォールバックはデフォルト値）
  const anchors = gradient.anchors ?? GRADIENT_ANCHOR_DEFAULTS[gradient.gradientType ?? 'linear'];
  gl.uniform2f(uniforms.u_gradAnchor0, anchors[0][0], anchors[0][1]);
  gl.uniform2f(uniforms.u_gradAnchor1, anchors[1][0], anchors[1][1]);
  gl.uniform2f(uniforms.u_gradAnchor2, anchors[2][0], anchors[2][1]);
  gl.uniform2f(uniforms.u_gradAnchor3, anchors[3][0], anchors[3][1]);
  const bezierControls = gradient.bezierControls ?? defaultBezierControlsForAnchors(anchors);
  gl.uniform2f(uniforms.u_gradBezierCp0, bezierControls[0][0], bezierControls[0][1]);
  gl.uniform2f(uniforms.u_gradBezierCp1, bezierControls[1][0], bezierControls[1][1]);

  // グラデーション方向ベクトル（ベジェワープ・Radon用）
  let gradDirX: number, gradDirY: number;
  if ((gradient.gradientType ?? 'linear') === 'linear') {
    const dx = anchors[1][0] - anchors[0][0];
    const dy = anchors[1][1] - anchors[0][1];
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    gradDirX = dx / len; gradDirY = dy / len;
  } else {
    const rad = (gradient.angle * Math.PI) / 180;
    gradDirX = Math.sin(rad); gradDirY = -Math.cos(rad);
  }
  gl.uniform2f(uniforms.u_gradDir, gradDirX, gradDirY);
  gl.uniform2f(uniforms.u_resolution, width, height);
  gl.uniform1i(uniforms.u_noiseEnabled, !isV2Pipeline && noiseDistortion.enabled ? 1 : 0);
  gl.uniform1i(uniforms.u_noiseType, NOISE_TYPE_MAP[noiseDistortion.type]);
  gl.uniform1f(uniforms.u_noiseAmount, noiseDistortion.amount);
  gl.uniform1f(uniforms.u_noiseScale, noiseDistortion.scale);
  gl.uniform1i(uniforms.u_noiseOctaves, noiseDistortion.octaves);
  gl.uniform1f(uniforms.u_noiseEvolution, noiseDistortion.evolution);
  const stMap = { simplex: 0, fbm: 1, curl: 2 };
  gl.uniform1i(uniforms.u_noiseSeamlessType, stMap[noiseDistortion.seamlessType] ?? 0);
  gl.uniform1i(uniforms.u_seamlessAnimation, noiseDistortion.seamlessAnimation === 'radial' ? 1 : 0);
  gl.uniform1f(uniforms.u_seamlessTwist, noiseDistortion.seamlessTwist);
  gl.uniform1i(uniforms.u_noiseLoopMode, noiseDistortion.noiseLoopMode === 'seamless' ? 1 : 0);
  gl.uniform1f(uniforms.u_noiseLoopBlend, Math.min(Math.max(noiseDistortion.noiseLoopBlend ?? 0.75, 0.001), 1.0));
  gl.uniform1i(uniforms.u_curlSteps, noiseDistortion.curlSteps);
  gl.uniform1f(uniforms.u_curlSpeed, noiseDistortion.curlSpeed ?? 1.0);
  gl.uniform1f(uniforms.u_curlEps, noiseDistortion.curlEps ?? 0.01);
  gl.uniform1f(uniforms.u_curlSeed, noiseDistortion.curlSeed ?? 0.0);
  gl.uniform1f(uniforms.u_noiseSeed, noiseDistortion.noiseSeed ?? 0.0);
  const VORONOI_DIST_MAP = { euclidean: 0, manhattan: 1, chebyshev: 2, minkowski: 3 } as const;
  const VORONOI_FEAT_MAP = { f1: 0, f2: 1, distance_to_edge: 2 } as const;
  gl.uniform1i(uniforms.u_voronoiDistMetric, VORONOI_DIST_MAP[noiseDistortion.voronoiDistMetric] ?? 0);
  gl.uniform1f(uniforms.u_voronoiRandomness, noiseDistortion.voronoiRandomness ?? 1.0);
  gl.uniform1i(uniforms.u_voronoiFeature, VORONOI_FEAT_MAP[noiseDistortion.voronoiFeature] ?? 0);
  gl.uniform1f(uniforms.u_voronoiMinkowskiExp, noiseDistortion.voronoiMinkowskiExp ?? 2.0);
  gl.uniform1f(uniforms.u_ridgeSharpness, noiseDistortion.ridgeSharpness ?? 2.0);
  gl.uniform1f(uniforms.u_ridgeGain, noiseDistortion.ridgeGain ?? 0.0);
  gl.uniform1f(uniforms.u_ridgeLacunarity, noiseDistortion.ridgeLacunarity ?? 2.0);
  gl.uniform1f(uniforms.u_ridgePersistence, noiseDistortion.ridgePersistence ?? 0.6);
  gl.uniform1f(uniforms.u_ridgeOffset, noiseDistortion.ridgeOffset ?? 1.0);
  gl.uniform1f(uniforms.u_ridgeWarp, noiseDistortion.ridgeWarp ?? 1.0);
  gl.uniform1i(uniforms.u_aeFractalType, noiseDistortion.aeFractalType === 'turbulent' ? 1 : 0);
  gl.uniform1f(uniforms.u_aeSubInfluence, noiseDistortion.aeSubInfluence ?? 0.7);
  gl.uniform1f(uniforms.u_aeSubScaling, noiseDistortion.aeSubScaling ?? 1.78);
  gl.uniform1f(uniforms.u_aeSubRotation, ((noiseDistortion.aeSubRotation ?? 0) * Math.PI) / 180);
  gl.uniform1f(uniforms.u_aeContrast, noiseDistortion.aeContrast ?? 1.0);
  gl.uniform1f(uniforms.u_aeBrightness, noiseDistortion.aeBrightness ?? 0.0);
  gl.uniform1f(uniforms.u_time, time);
  gl.uniform1f(uniforms.u_noiseLoopPeriod, Math.max(Math.abs(noiseLoopPeriod), 0.0001));
  const animRad = (animDirection * Math.PI) / 180;
  gl.uniform2f(uniforms.u_animDir, -Math.sin(animRad), -Math.cos(animRad));
  const diffuseScale = diffuseResolutionScale(width, height);
  gl.uniform1i(uniforms.u_diffuseEnabled, !isV2Pipeline && diffuse.enabled ? 1 : 0);
  gl.uniform1i(uniforms.u_diffuseMode, DIFFUSE_MODE_MAP[diffuse.mode ?? 'block'] ?? 0);
  gl.uniform1f(uniforms.u_diffuseScatter, diffuse.mode === 'dither' ? 100 : diffuse.scatter * diffuseScale);
  gl.uniform1f(uniforms.u_diffuseGrain, diffuse.grain * diffuseScale);
  gl.uniform1f(uniforms.u_diffuseSeed, diffuse.seed);
  gl.uniform1f(uniforms.u_diffuseDitherThreshold, diffuse.ditherThreshold ?? 0.5);
  uploadGradientRampTexture(ctx, gradient);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, gradientRampTexture);
  gl.uniform1i(uniforms.u_gradientRamp, 1);
  gl.uniform1f(uniforms.u_rampRepeat, Math.max(1, Math.min(20, Math.round(gradient.rampRepeat ?? 1))));
  gl.activeTexture(gl.TEXTURE4);
  gl.bindTexture(gl.TEXTURE_2D, sourceImageTexture);
  if (sourceImageCanvas && ctx.sourceImageCanvas !== sourceImageCanvas) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceImageCanvas);
    ctx.sourceImageCanvas = sourceImageCanvas;
  } else if (!sourceImageCanvas) {
    ctx.sourceImageCanvas = null;
  }
  gl.uniform1i(uniforms.u_sourceImage, 4);
  gl.uniform1i(uniforms.u_sourceImageEnabled, sourceImageCanvas ? 1 : 0);
  gl.activeTexture(gl.TEXTURE7);
  gl.bindTexture(gl.TEXTURE_2D, imageGradientTexture);
  if (imageGradientSource && ctx.imageGradientSource !== imageGradientSource) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageGradientSource);
    ctx.imageGradientSource = imageGradientSource;
  } else if (!imageGradientSource) {
    ctx.imageGradientSource = null;
  }
  const imageGradientActive = imageGradient.enabled && !!imageGradientSource;
  const imageGradientChannel = { luminance: 0, red: 1, green: 2, blue: 3 } as const;
  gl.uniform1i(uniforms.u_imageGradient, 7);
  gl.uniform1i(uniforms.u_imageGradientEnabled, imageGradientActive ? 1 : 0);
  gl.uniform2f(uniforms.u_imageGradientSize, imageGradientSource?.width ?? 1, imageGradientSource?.height ?? 1);
  gl.uniform1i(uniforms.u_imageGradientChannel, imageGradientChannel[imageGradient.channel]);
  gl.uniform1f(uniforms.u_imageGradientAnchorInfluence, Math.min(1, Math.max(0, imageGradient.anchorInfluence)));
  gl.activeTexture(gl.TEXTURE6);
  gl.bindTexture(gl.TEXTURE_2D, imageMaskTexture);
  if (imageMaskSource && ctx.imageMaskSource !== imageMaskSource) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageMaskSource);
    ctx.imageMaskSource = imageMaskSource;
  } else if (!imageMaskSource) {
    ctx.imageMaskSource = null;
  }
  gl.uniform1i(uniforms.u_imageMask, 6);
  gl.uniform1i(uniforms.u_imageMaskEnabled, imageMaskEnabled && imageMaskSource ? 1 : 0);
  gl.uniform1f(uniforms.u_dwInitVal, noiseDistortion.dwInitVal);
  gl.uniform1f(uniforms.u_dwInitAmp, noiseDistortion.dwInitAmp);
  gl.uniform1f(uniforms.u_dwRotAngle1, noiseDistortion.dwRotAngle1);
  gl.uniform1f(uniforms.u_dwRotAngle2, noiseDistortion.dwRotAngle2);
  gl.uniform1f(uniforms.u_dwDist1, noiseDistortion.dwDist1);
  gl.uniform1f(uniforms.u_dwDist2, noiseDistortion.dwDist2);
  gl.uniform1f(uniforms.u_dwDist3, noiseDistortion.dwDist3);
  gl.uniform1f(uniforms.u_dwDriftAngle, noiseDistortion.dwDriftAngle * Math.PI / 180);
  gl.uniform1i(uniforms.u_slitEnabled, !isV2Pipeline && slitScan.enabled ? 1 : 0);
  gl.uniform1i(uniforms.u_slitMode, slitScan.mode === 'circular' ? 1 : slitScan.mode === 'polygon' ? 2 : slitScan.mode === 'wave' ? 3 : 0);
  gl.uniform1f(uniforms.u_slitAngle, (slitScan.angle * Math.PI) / 180);
  const slitWaveTypeMap = { sine: 0, sawtooth: 1, semicircle: 2 } as const;
  gl.uniform1i(uniforms.u_slitWaveType, slitWaveTypeMap[slitScan.waveType ?? 'sine']);
  gl.uniform1f(uniforms.u_slitWaveHeight, slitScan.waveHeight ?? 24);
  gl.uniform1i(uniforms.u_slitPolygonSides, Math.max(3, Math.min(32, Math.round(slitScan.polygonSides ?? 6))));
  gl.uniform1f(uniforms.u_slitOffsetAngle, ((slitScan.offsetAngle ?? 90) * Math.PI) / 180);
  // pixelPerfect 時はシェーダーへ渡す値も丸め、実ピクセル単位でスリット境界を制御する
  const _pp = slitScan.pixelPerfect;
  const _ppR = (v: number) => _pp ? Math.round(v) : v;
  gl.uniform1f(uniforms.u_slitWidth, Math.max(_ppR(slitScan.slitWidth), 1));
  gl.uniform1f(uniforms.u_slitOffset, slitScan.offset);
  gl.uniform1f(uniforms.u_slitVariance, slitScan.variance);
  const slitAnimBaseTime = slitScan.animEnabled
    ? (slitAnimTimeOverride != null ? slitAnimTimeOverride : performance.now() / 1000)
    : 0.0;
  const slitOffsetAnimActive = slitScan.animEnabled && slitScan.animMode !== 'off' && slitScan.offsetSpeed !== 0;
  const slitTime = slitOffsetAnimActive
    ? ((slitAnimBaseTime * slitScan.offsetSpeed) % 1.0 + 1.0) % 1.0
    : 0.0;
  const phaseOffset = slitScan.animEnabled && (slitScan.phaseAnimEnabled ?? false) && (slitScan.phaseSpeed ?? 0) !== 0
    ? -slitAnimBaseTime * Math.max(_ppR(slitScan.slitWidth), 1) * (slitScan.phaseSpeed ?? 1)
    : 0;
  gl.uniform2f(uniforms.u_slitParams, _ppR((slitScan.slitPhase ?? 0) + phaseOffset), slitScan.seed);
  {
    // 最大32エントリ。スリットインデックス昇順ソート。空スロットは (-9999, 0)。
    // センチネルを -9999 にすることでスリットインデックス -1 との混同を回避。
    const E = Object.entries(slitScan.slitDeltas ?? {})
      .map(([k, v]) => [Number(k), _pp ? Math.round(v) : v] as [number, number])
      .filter(([, v]) => v !== 0)
      .sort((a, b) => a[0] - b[0])
      .slice(0, 32);
    const g = (i: number): [number, number] => E[i] ?? [-9999, 0];
    const [s0,  d0]  = g(0);  const [s1,  d1]  = g(1);
    const [s2,  d2]  = g(2);  const [s3,  d3]  = g(3);
    const [s4,  d4]  = g(4);  const [s5,  d5]  = g(5);
    const [s6,  d6]  = g(6);  const [s7,  d7]  = g(7);
    const [s8,  d8]  = g(8);  const [s9,  d9]  = g(9);
    const [s10, d10] = g(10); const [s11, d11] = g(11);
    const [s12, d12] = g(12); const [s13, d13] = g(13);
    const [s14, d14] = g(14); const [s15, d15] = g(15);
    const [s16, d16] = g(16); const [s17, d17] = g(17);
    const [s18, d18] = g(18); const [s19, d19] = g(19);
    const [s20, d20] = g(20); const [s21, d21] = g(21);
    const [s22, d22] = g(22); const [s23, d23] = g(23);
    const [s24, d24] = g(24); const [s25, d25] = g(25);
    const [s26, d26] = g(26); const [s27, d27] = g(27);
    const [s28, d28] = g(28); const [s29, d29] = g(29);
    const [s30, d30] = g(30); const [s31, d31] = g(31);
    gl.uniform4f(uniforms.u_slitDelta01, s0,  d0,  s1,  d1);
    gl.uniform4f(uniforms.u_slitDelta23, s2,  d2,  s3,  d3);
    gl.uniform4f(uniforms.u_slitDelta45, s4,  d4,  s5,  d5);
    gl.uniform4f(uniforms.u_slitDelta67, s6,  d6,  s7,  d7);
    gl.uniform4f(uniforms.u_slitDelta89, s8,  d8,  s9,  d9);
    gl.uniform4f(uniforms.u_slitDeltaAB, s10, d10, s11, d11);
    gl.uniform4f(uniforms.u_slitDeltaCD, s12, d12, s13, d13);
    gl.uniform4f(uniforms.u_slitDeltaEF, s14, d14, s15, d15);
    gl.uniform4f(uniforms.u_slitDeltaGH, s16, d16, s17, d17);
    gl.uniform4f(uniforms.u_slitDeltaIJ, s18, d18, s19, d19);
    gl.uniform4f(uniforms.u_slitDeltaKL, s20, d20, s21, d21);
    gl.uniform4f(uniforms.u_slitDeltaMN, s22, d22, s23, d23);
    gl.uniform4f(uniforms.u_slitDeltaOP, s24, d24, s25, d25);
    gl.uniform4f(uniforms.u_slitDeltaQR, s26, d26, s27, d27);
    gl.uniform4f(uniforms.u_slitDeltaST, s28, d28, s29, d29);
    gl.uniform4f(uniforms.u_slitDeltaUV, s30, d30, s31, d31);
  }
  gl.uniform1i(uniforms.u_slitAnimEnabled, slitOffsetAnimActive ? 1 : 0);
  gl.uniform1f(uniforms.u_slitAnimTime, slitTime);
  gl.uniform1i(uniforms.u_slitAnimMode, slitScan.animMode === 'pingpong' ? 1 : 0);
  // Legacy rendering keeps one fixed order. V2 uses the explicit stack order.
  gl.uniform1i(uniforms.u_slitNoiseAfter, 0);
  gl.uniform1i(uniforms.u_slitPixelPerfect, _pp ? 1 : 0);
  // Stretch is applied later as a post-process that samples the rendered texture.
  gl.uniform1i(uniforms.u_radonEnabled, !isV2Pipeline && radon.enabled ? 1 : 0);
  gl.uniform1f(uniforms.u_radonStrength, radon.strength);
  gl.uniform1f(uniforms.u_radonFreq, radon.freq);
  gl.uniform1f(uniforms.u_radonRadius, radon.radius);
  gl.uniform1f(uniforms.u_radonAngle, (radon.angle * Math.PI) / 180);
  gl.uniform1f(uniforms.u_radonBlur, radon.blur);
  gl.uniform1f(uniforms.u_radonEvolution, radon.evolution);
  gl.uniform1f(uniforms.u_radonSpeed, radon.speed);
  
  // Fluid Warp
  gl.uniform1i(uniforms.u_iridEnabled, !isV2Pipeline && iridescence.enabled ? 1 : 0);
  gl.uniform1f(uniforms.u_iridAngle, (iridescence.angle * Math.PI) / 180);
  gl.uniform1f(uniforms.u_iridSpeed, iridescence.speed);
  gl.uniform1f(uniforms.u_iridFreq, iridescence.frequency);
  gl.uniform1f(uniforms.u_iridStrength, iridescence.strength);
  uploadManualDistortMap(ctx, manualDistort);
  gl.activeTexture(gl.TEXTURE5);
  gl.bindTexture(gl.TEXTURE_2D, ctx.manualDistortTexture);
  gl.uniform1i(uniforms.u_manualDistortMap, 5);
  gl.uniform1i(uniforms.u_manualDistortEnabled, !isV2Pipeline && manualDistort.enabled ? 1 : 0);
  gl.uniform1f(uniforms.u_manualDistortMaxDisplacement, manualDistort.maxDisplacement);
  gl.uniform1f(uniforms.u_manualDistortSmoothStrength, manualDistort.smoothStrength ?? 0.65);
  gl.uniform1f(uniforms.u_manualDistortSmoothRadius, manualDistort.smoothRadius ?? 18);

  if (isV2Pipeline && effectPipeline) {
    const renderPlan = getV2RenderPlan(effectPipeline, {
      normalMapEnabled: normalMap.enabled,
      normalMapBlur: normalMap.blur,
      prismGlowRadius: postprocess.prismGlowRadius ?? 0,
    });
    const diffuseLayerEnabled = renderPlan.diffuseEnabled;
    const mainLayers = renderPlan.enabledLayers;
    const normalRequested = renderPlan.normalRequested;
    const normalNeedsBlur = renderPlan.normalNeedsBlur;
    const prismRequested = renderPlan.prismRequested;
    const prismNeedsBlur = renderPlan.prismNeedsBlur;
    const particlesRequested = renderPlan.particlesRequested;
    const glassIdentity = isGlassOpticallyIdentity(postprocess);

    // The V2 default is Diffuse-only. Base and Diffuse use the same panel
    // uniforms/algorithm, so no intermediate texture is needed when there are
    // no intervening stages. Avoid compiling the large texture-stack shader
    // and allocating full-size ping-pong FBOs for this common path.
    if (canRenderV2Direct(effectPipeline, normalRequested)) {
      gl.uniform1i(uniforms.u_diffuseEnabled, diffuseLayerEnabled ? 1 : 0);
      gl.uniform1i(uniforms.u_matcapEnabled, matcap.enabled ? 1 : 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      ctx.hasPresentedFrame = true;
      return;
    }

    const stackCoreRequested = renderPlan.programs.stackCore;
    // The generator and core both include the noise library. Serialize the
    // first heavyweight compile so drivers are not saturated immediately
    // after Bootstrap becomes visible.
    const stackCoreReady = generatorReady && (
      !stackCoreRequested || requestLazyProgram(ctx, 'stackCore')
    );
    const noiseStackReady = !renderPlan.programs.noiseStack || (
      stackCoreReady && requestLazyProgram(ctx, 'noiseStack')
    );
    // Serialize the two large optical programs so enabling both does not
    // saturate the driver with simultaneous Glass shader compilation.
    const glassReady = glassIdentity || !renderPlan.programs.glass || (
      stackCoreReady && noiseStackReady && requestGlassProgram(ctx, 'glass')
    );
    const glassCompileSettled = glassReady || ctx.lazyProgramState.glass.failed;
    const glassV2Ready = glassIdentity || !renderPlan.programs.glassV2 || (
      stackCoreReady && noiseStackReady && glassCompileSettled && requestGlassProgram(ctx, 'glassV2')
    );
    const normalReady = !normalRequested || (
      requestLazyProgram(ctx, 'normalMap') &&
      (!normalNeedsBlur || requestLazyProgram(ctx, 'blur'))
    );
    const stretchReady = !renderPlan.programs.stretch || requestLazyProgram(ctx, 'stretch');
    const prismReady = !prismRequested || (
      requestLazyProgram(ctx, 'prism') &&
      requestLazyProgram(ctx, 'prismComposite') &&
      (!prismNeedsBlur || requestLazyProgram(ctx, 'blur'))
    );
    const particlesReady = !particlesRequested || requestLazyProgram(ctx, 'particles');

    // Lazy programs compile asynchronously. Keep a usable base frame until every
    // requested V2 stage is available instead of presenting a partial stack.
    if (!stackCoreReady || !noiseStackReady || !normalReady || !stretchReady || !prismReady || !particlesReady) {
      // Keep rendering the current base state while programs compile so
      // anchor and parameter edits remain visible instead of freezing the
      // first frame that happened to be presented.
      gl.uniform1i(uniforms.u_diffuseEnabled, diffuseLayerEnabled ? 1 : 0);
      gl.uniform1i(uniforms.u_matcapEnabled, matcap.enabled ? 1 : 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      ctx.hasPresentedFrame = true;
      return;
    }

    // V2 keeps several full-size intermediate textures. Limit direct preview
    // allocations; high-resolution export continues through the tile path.
    if (vpW * vpH > 16_777_216) {
      console.error('[WebGL render] V2 viewport exceeds the 16M-pixel FBO safety budget. Use tiled export or reduce preview resolution.');
      gl.uniform1i(uniforms.u_matcapEnabled, matcap.enabled ? 1 : 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      return;
    }
    const framebufferAllocationMode = renderPlan.framebufferAllocationMode;
    if (framebufferAllocationMode === 'full') {
      if (ctx.fboSize[0] !== vpW || ctx.fboSize[1] !== vpH) resizeFboTextures(gl, ctx, vpW, vpH);
    } else if (framebufferAllocationMode === 'core' && (ctx.v2CoreFboSize[0] !== vpW || ctx.v2CoreFboSize[1] !== vpH)) {
      resizeV2CoreFboTextures(gl, ctx, vpW, vpH);
    }

    // Base -> Surface. Base-only uniforms above deliberately disabled the
    // stackable generator effects, so every V2 layer receives a color texture.
    gl.uniform1i(uniforms.u_matcapEnabled, normalRequested ? 0 : (matcap.enabled ? 1 : 0));
    gl.bindFramebuffer(gl.FRAMEBUFFER, ctx.gradFbo);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    let currentTexture: WebGLTexture = ctx.gradTexture;

    if (normalRequested && ctx.normalMapProgram) {
      gl.useProgram(ctx.normalMapProgram);
      gl.viewport(0, 0, vpW, vpH);
      gl.uniform2f(ctx.normalMapUniforms.u_resolution, vpW, vpH);
      gl.uniform1f(ctx.normalMapUniforms.u_normalMapStrength, normalMap.strength);
      gl.uniform1f(ctx.normalMapUniforms.u_normalMapAngle, (normalMap.angle * Math.PI) / 180);
      gl.uniform1f(ctx.normalMapUniforms.u_normalMapBevelSize, normalMap.bevelSize);
      gl.uniform1i(ctx.normalMapUniforms.u_normalMapInvert, normalMap.invert ? 1 : 0);
      gl.uniform1i(ctx.normalMapUniforms.u_matcapEnabled, matcap.enabled ? 1 : 0);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, ctx.gradTexture);
      gl.uniform1i(ctx.normalMapUniforms.u_gradientTex, 2);
      gl.bindFramebuffer(gl.FRAMEBUFFER, ctx.normalFbo);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      currentTexture = ctx.normalTexture;

      if (normalNeedsBlur && ctx.blurProgram) {
        const sigma = normalMap.blur;
        gl.useProgram(ctx.blurProgram);
        gl.uniform2f(ctx.blurUniforms.u_resolution, vpW, vpH);
        gl.uniform1f(ctx.blurUniforms.u_blurSigma, sigma);
        gl.uniform1i(ctx.blurUniforms.u_blurRadius, Math.min(Math.ceil(sigma * 3), 32));
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, ctx.normalTexture);
        gl.uniform1i(ctx.blurUniforms.u_tex, 2);
        gl.uniform2f(ctx.blurUniforms.u_blurDir, 1, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, ctx.hBlurFbo);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.bindTexture(gl.TEXTURE_2D, ctx.hBlurTexture);
        gl.uniform2f(ctx.blurUniforms.u_blurDir, 0, 1);
        gl.bindFramebuffer(gl.FRAMEBUFFER, ctx.gradFbo);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        currentTexture = ctx.gradTexture;
      }
    }

    const v2Postprocess: PostprocessConfig = {
      ...postprocess,
      ...manualDistort,
      diffuseEnabled: diffuseLayerEnabled,
      diffuseMode: diffuse.mode,
      diffuseScatter: diffuse.scatter,
      diffuseGrain: diffuse.grain,
      diffuseSeed: diffuse.seed,
      diffuseDitherThreshold: diffuse.ditherThreshold,
    };
    // In V2, Noise is an explicit stack layer. Other effects may reuse the
    // noise material parameters internally, but must not apply the Noise UV
    // transform implicitly or the visible result would depend on hidden order.
    const disabledStackNoise = noiseDistortion.enabled
      ? { ...noiseDistortion, enabled: false }
      : noiseDistortion;
    for (let layerIndex = 0; layerIndex < mainLayers.length; layerIndex++) {
      const layer = mainLayers[layerIndex];
      if (layer.kind === 'glass' && (glassIdentity || !glassReady)) continue;
      if (layer.kind === 'glassV2' && (glassIdentity || !glassV2Ready)) continue;
      // A Diffuse immediately before Slit is evaluated in Slit's destination
      // space. This prevents the slit sampler from stretching the already
      // diffused grid into stripes while keeping the layer order visible.
      const deferDiffuseToSlit = layer.kind === 'diffuse'
        && mainLayers[layerIndex + 1]?.kind === 'slit';
      const diffuseAfterSlit = layer.kind === 'slit'
        && mainLayers[layerIndex - 1]?.kind === 'diffuse';
      const target = choosePostprocessTarget(ctx, currentTexture);
      let passRendered = false;
      if (layer.kind === 'stretch') {
        passRendered = drawStretchPass(ctx, currentTexture, stretch, stretchScanOverride ?? 0, stretchScanOverride != null ? stretch.seed + (1 - Math.cos((stretchScanOverride ?? 0) * Math.PI * 2)) * 0.5 : stretch.seed, vpW, vpH, target.fbo);
      } else {
        const layerNoise = layer.kind === 'noise'
          ? { ...noiseDistortion, enabled: true }
          : disabledStackNoise;
        passRendered = drawPostprocessPass(
          ctx, currentTexture, gradient, layerNoise, v2Postprocess, layer.kind,
          vpW, vpH, width, height, tileOx, tileOy, time, noiseLoopPeriod,
          animationSpeed,
          (layer.kind === 'diffuse' && !deferDiffuseToSlit) || diffuseAfterSlit,
          target.fbo, slitScan, animDirection, slitAnimTimeOverride, true, diffuseAfterSlit,
        );
      }
      if (passRendered) currentTexture = target.texture;
    }

    // Prism and particles intentionally stay outside the reorderable main
    // stack. Diffuse is applied by its own layer at the requested position.
    if (prismRequested) {
      const target = choosePostprocessTarget(ctx, currentTexture);
      drawPrismPostprocessPass(ctx, currentTexture, gradient, disabledStackNoise, v2Postprocess, vpW, vpH, width, height, tileOx, tileOy, time, noiseLoopPeriod, animationSpeed, false, target.fbo, true);
      currentTexture = target.texture;
    }

    // Present the color texture, then draw the optional particle overlay on top.
    drawPostprocessPass(ctx, currentTexture, gradient, disabledStackNoise, v2Postprocess, 'diffuse', vpW, vpH, width, height, tileOx, tileOy, time, noiseLoopPeriod, animationSpeed, false, null, null, 0, null, true);
    if (particlesRequested) {
      drawParticleOverlay(ctx, currentTexture, gradient, postprocess, vpW, vpH, width, height, tileOx, tileOy, time);
    }
    return;
  }

  const normalMapRequested = normalMap.enabled && !diffuse.enabled;
  const normalMapNeedsBlur = normalMapRequested && normalMap.blur >= 0.5;
  const normalMapReady = !normalMapRequested || (
    requestLazyProgram(ctx, 'normalMap') &&
    (!normalMapNeedsBlur || requestLazyProgram(ctx, 'blur'))
  );
  const stretchActive = stretch.enabled && requestLazyProgram(ctx, 'stretch');
  const particleRequested = postprocess.enabled && postprocess.effectMode === 'particles';
  const particleActive = particleRequested && requestLazyProgram(ctx, 'particles');
  const postprocessLayers = getActivePostprocessStackLayers(postprocess).filter(layer => (
    (layer.kind !== 'glass' && layer.kind !== 'glassV2') || !isGlassOpticallyIdentity(postprocess)
  ));
  const postprocessRequested = postprocess.enabled && postprocessLayers.length > 0;
  const prismPostprocess = postprocessRequested && postprocessLayers.some(layer => layer.kind === 'prism');
  const prismNeedsBlur = prismPostprocess && (postprocess.prismGlowRadius ?? 0) > 0.01;
  const postprocessReady = !postprocessRequested || (
    requestLazyProgram(ctx, 'postprocess') &&
    (!prismPostprocess || (
      requestLazyProgram(ctx, 'prismComposite') &&
      (!prismNeedsBlur || requestLazyProgram(ctx, 'blur'))
    ))
  );
  const normalMapActive = normalMapRequested && normalMapReady;
  const postprocessActive = postprocessRequested && postprocessReady;
  const stretchScan = stretchScanOverride ?? 0;
  const stretchSeed = stretchScanOverride != null
    ? stretch.seed + (1 - Math.cos(stretchScan * Math.PI * 2)) * 0.5
    : stretch.seed;
  if ((stretchActive || postprocessActive || particleActive) && (ctx.fboSize[0] !== vpW || ctx.fboSize[1] !== vpH)) {
    resizeFboTextures(gl, ctx, vpW, vpH);
  }
  let particleSourceTexture: WebGLTexture | null = null;
  const applyPostprocessStack = (sourceTexture: WebGLTexture, renderWidth: number, renderHeight: number) => {
    const stackTexture = drawPostprocessStackOutput(
      ctx,
      sourceTexture,
      gradient,
      noiseDistortion,
      postprocess,
      renderWidth,
      renderHeight,
      width,
      height,
      tileOx,
      tileOy,
      time,
      noiseLoopPeriod,
      animationSpeed,
      particleActive,
    );
    if (particleActive) particleSourceTexture = stackTexture ?? sourceTexture;
  };

  if (normalMapActive) {
    // ノーマルマップ有効時: 3パスレンダリング
    // タイルモードでは FBO サイズを viewport サイズに合わせる（タイル境界に継ぎ目が出る可能性あり）
    const fboW = vpW;
    const fboH = vpH;
    // Pass 1: グラデーションを gradFbo にレンダリング（matcapなし、ノーマル計算のため）
    if (ctx.fboSize[0] !== fboW || ctx.fboSize[1] !== fboH) resizeFboTextures(gl, ctx, fboW, fboH);
    gl.uniform1i(uniforms.u_matcapEnabled, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, ctx.gradFbo);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Pass 2: gradFbo テクスチャからノーマルを計算
    gl.useProgram(ctx.normalMapProgram);
    // u_resolution はノーマルマップのサンプル間隔の基準。タイル時は viewport サイズで OK。
    gl.uniform2f(ctx.normalMapUniforms.u_resolution, fboW, fboH);
    gl.uniform1f(ctx.normalMapUniforms.u_normalMapStrength, normalMap.strength);
    gl.uniform1f(ctx.normalMapUniforms.u_normalMapAngle, (normalMap.angle * Math.PI) / 180);
    gl.uniform1f(ctx.normalMapUniforms.u_normalMapBevelSize, normalMap.bevelSize);
    gl.uniform1i(ctx.normalMapUniforms.u_normalMapInvert, normalMap.invert ? 1 : 0);
    gl.uniform1i(ctx.normalMapUniforms.u_matcapEnabled, matcap.enabled ? 1 : 0);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, ctx.gradTexture);
    gl.uniform1i(ctx.normalMapUniforms.u_gradientTex, 2);

    const usePostBlur = normalMap.blur >= 0.5;
    if (usePostBlur) {
      // ノーマルを normalFbo へ
      gl.bindFramebuffer(gl.FRAMEBUFFER, ctx.normalFbo);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // Pass 3: Gaussian blur（H→V）
      gl.useProgram(ctx.blurProgram);
      const sigma = normalMap.blur;
      const radius = Math.min(Math.ceil(sigma * 3), 32);
      gl.uniform2f(ctx.blurUniforms.u_resolution, fboW, fboH);
      gl.uniform1f(ctx.blurUniforms.u_blurSigma, sigma);
      gl.uniform1i(ctx.blurUniforms.u_blurRadius, radius);
      gl.bindTexture(gl.TEXTURE_2D, ctx.normalTexture);
      gl.uniform1i(ctx.blurUniforms.u_tex, 2);
      gl.uniform2f(ctx.blurUniforms.u_blurDir, 1.0, 0.0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, ctx.hBlurFbo);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.bindTexture(gl.TEXTURE_2D, ctx.hBlurTexture);
      gl.uniform2f(ctx.blurUniforms.u_blurDir, 0.0, 1.0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, (stretchActive || postprocessActive || particleActive) ? ctx.gradFbo : null);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (stretchActive) {
        drawStretchPass(ctx, ctx.gradTexture, stretch, stretchScan, stretchSeed, fboW, fboH, (postprocessActive || particleActive) ? ctx.normalFbo : null);
        if (postprocessActive) applyPostprocessStack(ctx.normalTexture, fboW, fboH);
        else if (particleActive) particleSourceTexture = ctx.normalTexture;
      } else if (postprocessActive) {
        applyPostprocessStack(ctx.gradTexture, fboW, fboH);
      } else if (particleActive) {
        particleSourceTexture = ctx.gradTexture;
      }
    } else {
      // ブラーなし: stretch有効時はノーマル結果をテクスチャ化してからポスト処理
      gl.bindFramebuffer(gl.FRAMEBUFFER, (stretchActive || postprocessActive || particleActive) ? ctx.normalFbo : null);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (stretchActive) {
        drawStretchPass(ctx, ctx.normalTexture, stretch, stretchScan, stretchSeed, fboW, fboH, (postprocessActive || particleActive) ? ctx.gradFbo : null);
        if (postprocessActive) applyPostprocessStack(ctx.gradTexture, fboW, fboH);
        else if (particleActive) particleSourceTexture = ctx.gradTexture;
      } else if (postprocessActive) {
        applyPostprocessStack(ctx.normalTexture, fboW, fboH);
      } else if (particleActive) {
        particleSourceTexture = ctx.normalTexture;
      }
    }
  } else {
    // ノーマルマップ無効: stretch有効時は一度FBOへ描いて、その画素を参照する
    gl.uniform1i(uniforms.u_matcapEnabled, matcap.enabled ? 1 : 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, (stretchActive || postprocessActive || particleActive) ? ctx.gradFbo : null);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    if (stretchActive) {
      drawStretchPass(ctx, ctx.gradTexture, stretch, stretchScan, stretchSeed, vpW, vpH, (postprocessActive || particleActive) ? ctx.normalFbo : null);
      if (postprocessActive) applyPostprocessStack(ctx.normalTexture, vpW, vpH);
      else if (particleActive) particleSourceTexture = ctx.normalTexture;
    } else if (postprocessActive) {
      applyPostprocessStack(ctx.gradTexture, vpW, vpH);
    } else if (particleActive) {
      particleSourceTexture = ctx.gradTexture;
    }
  }

  if (particleActive) {
    drawParticleOverlay(ctx, particleSourceTexture ?? ctx.gradTexture, gradient, postprocess, vpW, vpH, width, height, tileOx, tileOy, time);
  }
}
