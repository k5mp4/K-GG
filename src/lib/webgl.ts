import type { ClothGradientConfig } from '../types/clothGradient';
import { ClothGradientRenderer } from './clothGradientRenderer';
import { normalizeFlowGradientConfig, type FlowGradientConfig } from '../types/flowGradient';
import {
  createFlowGradientResources,
  resetFlowGradientResources,
  resizeFlowGradientResources,
  type FlowGradientResources,
  renderFlowGradient,
} from './flowGradientRenderer';
import type { GradientConfig } from '../types/gradient';
import type { NoiseDistortionConfig, DiffuseConfig, SlitScanConfig, StretchConfig, NormalMapConfig, RadonConfig, IridescenceConfig, ManualDistortConfig, PostprocessConfig, MatcapConfig, PostprocessStackKind, EffectPipelineConfig } from '../types/distortion';
import { DEFAULT_DIFFUSE_ASCII_CHARSET, DEFAULT_DIFFUSE_BACKGROUND_COLOR } from '../types/distortion';
import { IMAGE_GRADIENT_DEFAULTS, type ImageGradientConfig } from '../types/imageGradient';
import { GRADIENT_ANCHOR_DEFAULTS, defaultBezierControlsForAnchors } from '../store/gradientStore';
import { normalizeMeshGradientConfig, type MeshGradientConfig } from '../types/gradient';
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
import { recordShaderError } from './shaderDiagnostics';
import type { GpuDiagnostics, RenderOptimization } from './gpuDiagnostics';
import {
  isGlassOpticallyIdentity,
  normalizeGlassRenderParameters,
  normalizeGlassV2ColorParameters,
} from './glass';
import { getActivePostprocessStackLayers } from './postprocessStack';
import { getV2RenderPlan } from './effectPipeline';
import { buildDiffuseBezierLut, normalizeDiffuseBezier } from './diffuseCurve';
import { buildMeshGradientField, MESH_FIELD_SIZE, MESH_FIELD_SUBDIVISIONS } from './meshGradientField';
import { noiseAngleDegreesForShader, noiseAngleRadiansForShader } from './noiseAngle';
import { clampParameter, getParameterLimit } from './parameterLimits';
import { getAnimationDirectionVector } from './animationDirection';
import { getSlitAnimationPhase } from './slitAnimation';
import { shouldRenderNormalMap } from './normalMap';
import type { LatestState } from '../types/latestState';
import { DEFAULT_SEAMLESS, normalizeSeamlessConfig, type SeamlessConfig } from '../types/seamless';
import {
  exportDiagnosticsEnabled,
  recordGlassPassDiagnostics,
} from './exportDiagnostics';
import {
  createWebGLPerformanceProfiler,
  getSafeWebGLExtension,
  loadDevelopmentWebGLTools,
  type WebGLPerformanceProfiler,
  type DevelopmentTools,
} from './webglPerformance';
import type { PerformanceSnapshot } from '../types/webglPerformance';
import { createWebGL2Context, WebGL2UnavailableError } from './webglCapability';

export { SHADER_VERSION };

type ShaderCompileExt = { COMPLETION_STATUS_KHR: number } | null;
const PARALLEL_SHADER_COMPILE_TIMEOUT_MS = 30_000;
const GLASS_PARALLEL_SHADER_COMPILE_TIMEOUT_MS = Number.POSITIVE_INFINITY;
type TextureStackKind = PostprocessStackKind | 'diffuse' | 'noise' | 'slit';
type LazyProgramState = {
  promise: Promise<void> | null;
  failed: boolean;
  timedOut: boolean;
  fallback: boolean;
};

export type SerialAsyncQueue = {
  enqueue<T>(task: () => Promise<T>): Promise<T>;
};

export function createSerialAsyncQueue(): SerialAsyncQueue {
  let tail: Promise<void> = Promise.resolve();

  return {
    enqueue<T>(task: () => Promise<T>): Promise<T> {
      const next = tail.then(() => task(), () => task());
      tail = next.then(() => undefined, () => undefined);
      return next;
    },
  };
}

/**
 * webgl-lint records program/uniform metadata from the synchronous link
 * callback. KHR_parallel_shader_compile can report LINK_STATUS before that
 * metadata is available, which leaves webgl-lint with no entry for the
 * program. Keep the parallel path for normal startup, but use synchronous
 * linking whenever development validation is enabled.
 */
export function selectShaderCompileExtension(
  extension: ShaderCompileExt,
  validationEnabled: boolean,
): ShaderCompileExt {
  return validationEnabled ? null : extension;
}

export function selectShaderCompileExtensionForSnapshot(
  extension: ShaderCompileExt,
  snapshot: Pick<PerformanceSnapshot, 'validationAvailable' | 'validationEnabled'> | null | undefined,
): ShaderCompileExt {
  return selectShaderCompileExtension(extension, snapshot?.validationEnabled ?? false);
}

const EFFECT_STACK_TRANSITION_FRAGMENT_SHADER = `
  precision mediump float;
  uniform sampler2D u_transitionFrom;
  uniform sampler2D u_transitionTo;
  uniform float u_transitionProgress;
  uniform vec2 u_resolution;
  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    gl_FragColor = mix(
      texture2D(u_transitionFrom, uv),
      texture2D(u_transitionTo, uv),
      clamp(u_transitionProgress, 0.0, 1.0)
    );
  }
`;

export type WebGLContext = {
  gl: WebGL2RenderingContext;
  performanceProfiler: WebGLPerformanceProfiler | null;
  gpuDiagnostics: GpuDiagnostics;
  renderOptimization: RenderOptimization;
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
  generatorProgram: WebGLProgram | null;
  generatorUniforms: Record<string, WebGLUniformLocation | null>;
  gradientRampTexture: WebGLTexture; // TEXTURE1: グラデーションランプ
  meshGradientTexture: WebGLTexture; // TEXTURE2: 前方向テッセレーション済みMeshフィールド
  meshGradientTextureSignature: string;
  diffuseCurveTexture: WebGLTexture; // TEXTURE8: Diffuse輝度カーブLUT
  diffuseCurveSignature: string;
  diffuseAsciiTexture: WebGLTexture; // TEXTURE9: Diffuse ASCIIグリフアトラス
  diffuseAsciiSignature: string;
  diffuseAsciiCount: number;
  diffuseAsciiRows: number;
  diffuseHistogramAt: number;
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
  seamlessProgram: WebGLProgram | null;
  seamlessUniforms: Record<string, WebGLUniformLocation | null>;
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
  flowGradient: FlowGradientResources;
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
  lazyProgramCompileQueue: SerialAsyncQueue;
  clothRenderer?: ClothGradientRenderer | null;
  clothStatus?: 'loading' | 'ready' | 'failed' | 'fallback';
  hasPresentedFrame: boolean;
};

type EffectStackTransitionResources = {
  program: WebGLProgram;
  from: WebGLUniformLocation | null;
  to: WebGLUniformLocation | null;
  progress: WebGLUniformLocation | null;
  resolution: WebGLUniformLocation | null;
  textureFrom: WebGLTexture;
  textureTo: WebGLTexture;
  textureSize: [number, number];
};

const effectStackTransitionResources = new WeakMap<WebGLContext, EffectStackTransitionResources>();
const registeredWebGLContexts = new WeakMap<HTMLCanvasElement, WebGL2RenderingContext>();
const webglLifecycleHandlers = new WeakMap<HTMLCanvasElement, {
  lost: (event: Event) => void;
  restored: () => void;
}>();

export function getRegisteredWebGLContext(canvas: HTMLCanvasElement): WebGL2RenderingContext | null {
  return registeredWebGLContexts.get(canvas) ?? null;
}

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
  const developmentTools: DevelopmentTools = await loadDevelopmentWebGLTools();
  const gl = createWebGL2Context(canvas, {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    desynchronized: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true,
    premultipliedAlpha: false,
  });
  if (!gl) throw new WebGL2UnavailableError();
  if (gl.isContextLost()) throw new Error('WebGL context is currently lost');
  registeredWebGLContexts.set(canvas, gl);
  const performanceProfiler = createWebGLPerformanceProfiler(gl, canvas, developmentTools);
  const previousLifecycleHandlers = webglLifecycleHandlers.get(canvas);
  if (previousLifecycleHandlers) {
    canvas.removeEventListener('webglcontextlost', previousLifecycleHandlers.lost);
    canvas.removeEventListener('webglcontextrestored', previousLifecycleHandlers.restored);
  }
  const handleContextLost = (event: Event) => {
    event.preventDefault();
    const contextEvent = event as WebGLContextEvent;
    console.error('[WebGL context] lost', { statusMessage: contextEvent.statusMessage });
  };
  const handleContextRestored = () => {
    console.info('[WebGL context] restored; renderer reinitialization is required');
  };
  canvas.addEventListener('webglcontextlost', handleContextLost);
  canvas.addEventListener('webglcontextrestored', handleContextRestored);
  webglLifecycleHandlers.set(canvas, { lost: handleContextLost, restored: handleContextRestored });

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
  if (gl.isContextLost()) throw new Error('WebGL context was lost during initialization');
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

  // 浮動小数点テクスチャのリニアフィルタリングとFBOアタッチメント用拡張
  getSafeWebGLExtension(gl, 'OES_texture_float_linear');
  getSafeWebGLExtension(gl, 'EXT_color_buffer_float');

  // KHR_parallel_shader_compile: シェーダーコンパイルを非同期化してメインスレッドをブロックしない
  const ext = getSafeWebGLExtension<ShaderCompileExt>(gl, 'KHR_parallel_shader_compile');
  const shaderCompileExt = selectShaderCompileExtensionForSnapshot(
    ext,
    performanceProfiler?.getSnapshot(),
  );
  // 浮動小数点テクスチャのリニアフィルタリング用拡張 (RGBA32F distortion map)
  getSafeWebGLExtension(gl, 'OES_texture_float_linear');
  // 初期表示はメインのグラデーションプログラムだけを待つ。
  // 補助プログラムは init 完了後に順次コンパイルし、最初のグラデーション表示を早める。
  const initialSource = getInitialProgramSource();
  const program = await createProgramAsync(gl, initialSource.fragment, shaderCompileExt, initialSource.vertex);
  setupGeometry(gl, program);
  const transitionProgram = await createProgramAsync(
    gl,
    EFFECT_STACK_TRANSITION_FRAGMENT_SHADER,
    shaderCompileExt,
    initialSource.vertex,
    'effect-stack-transition',
  );
  setupGeometry(gl, transitionProgram);
  const uniforms: Record<string, WebGLUniformLocation | null> = {
    u_gradientType: gl.getUniformLocation(program, 'u_gradientType'),
    u_resolution: gl.getUniformLocation(program, 'u_resolution'),
    u_noiseEnabled: gl.getUniformLocation(program, 'u_noiseEnabled'),
    u_noiseType: gl.getUniformLocation(program, 'u_noiseType'),
    u_noiseAmount: gl.getUniformLocation(program, 'u_noiseAmount'),
    u_noiseScale: gl.getUniformLocation(program, 'u_noiseScale'),
    u_noiseOctaves: gl.getUniformLocation(program, 'u_noiseOctaves'),
    u_noiseEvolution: gl.getUniformLocation(program, 'u_noiseEvolution'),
    u_noiseSpeed: gl.getUniformLocation(program, 'u_noiseSpeed'),
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
    u_causticsDepth: gl.getUniformLocation(program, 'u_causticsDepth'),
    u_causticsRefraction: gl.getUniformLocation(program, 'u_causticsRefraction'),
    u_causticsSharpness: gl.getUniformLocation(program, 'u_causticsSharpness'),
    u_causticsComplexity: gl.getUniformLocation(program, 'u_causticsComplexity'),
    u_causticsWaveSpread: gl.getUniformLocation(program, 'u_causticsWaveSpread'),
    u_causticsBoundaryWidth: gl.getUniformLocation(program, 'u_causticsBoundaryWidth'),
    u_phasorFrequency: gl.getUniformLocation(program, 'u_phasorFrequency'),
    u_phasorBandwidth: gl.getUniformLocation(program, 'u_phasorBandwidth'),
    u_phasorDirection: gl.getUniformLocation(program, 'u_phasorDirection'),
    u_phasorDirectionSpread: gl.getUniformLocation(program, 'u_phasorDirectionSpread'),
    u_phasorSharpness: gl.getUniformLocation(program, 'u_phasorSharpness'),
    u_phasorWarpStrength: gl.getUniformLocation(program, 'u_phasorWarpStrength'),
    u_phasorTangentMix: gl.getUniformLocation(program, 'u_phasorTangentMix'),
    u_phasorKernelDensity: gl.getUniformLocation(program, 'u_phasorKernelDensity'),
    u_phasorDirectionMode: gl.getUniformLocation(program, 'u_phasorDirectionMode'),
    u_time: gl.getUniformLocation(program, 'u_time'),
    u_noiseLoopPeriod: gl.getUniformLocation(program, 'u_noiseLoopPeriod'),
    u_animDir: gl.getUniformLocation(program, 'u_animDir'),
    u_diffuseEnabled: gl.getUniformLocation(program, 'u_diffuseEnabled'),
    u_diffuseMode:    gl.getUniformLocation(program, 'u_diffuseMode'),
    u_diffuseScatter: gl.getUniformLocation(program, 'u_diffuseScatter'),
    u_diffuseGrain: gl.getUniformLocation(program, 'u_diffuseGrain'),
    u_diffuseSeed: gl.getUniformLocation(program, 'u_diffuseSeed'),
    u_diffuseDitherThreshold: gl.getUniformLocation(program, 'u_diffuseDitherThreshold'),
    u_diffuseAdaptiveEnabled: gl.getUniformLocation(program, 'u_diffuseAdaptiveEnabled'),
    u_diffuseAdaptiveChannel: gl.getUniformLocation(program, 'u_diffuseAdaptiveChannel'),
    u_diffuseGrainAdaptiveEnabled: gl.getUniformLocation(program, 'u_diffuseGrainAdaptiveEnabled'),
    u_diffuseGrainAdaptiveAmount: gl.getUniformLocation(program, 'u_diffuseGrainAdaptiveAmount'),
    u_diffuseHalftoneShape: gl.getUniformLocation(program, 'u_diffuseHalftoneShape'),
    u_diffuseHalftoneSize: gl.getUniformLocation(program, 'u_diffuseHalftoneSize'),
    u_diffuseBackgroundColor: gl.getUniformLocation(program, 'u_diffuseBackgroundColor'),
    u_diffuseAsciiAtlas: gl.getUniformLocation(program, 'u_diffuseAsciiAtlas'),
    u_diffuseAsciiCount: gl.getUniformLocation(program, 'u_diffuseAsciiCount'),
    u_diffuseAsciiColumns: gl.getUniformLocation(program, 'u_diffuseAsciiColumns'),
    u_diffuseAsciiRows: gl.getUniformLocation(program, 'u_diffuseAsciiRows'),
    u_diffuseAsciiRotation: gl.getUniformLocation(program, 'u_diffuseAsciiRotation'),
    u_diffuseCurve: gl.getUniformLocation(program, 'u_diffuseCurve'),
    u_gradientRamp: gl.getUniformLocation(program, 'u_gradientRamp'),
    u_meshGradient: gl.getUniformLocation(program, 'u_meshGradient'),
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
    u_meshCorner0: gl.getUniformLocation(program, 'u_meshCorner0'),
    u_meshCorner1: gl.getUniformLocation(program, 'u_meshCorner1'),
    u_meshCorner2: gl.getUniformLocation(program, 'u_meshCorner2'),
    u_meshCorner3: gl.getUniformLocation(program, 'u_meshCorner3'),
    u_meshBottomCp0: gl.getUniformLocation(program, 'u_meshBottomCp0'),
    u_meshBottomCp1: gl.getUniformLocation(program, 'u_meshBottomCp1'),
    u_meshRightCp0: gl.getUniformLocation(program, 'u_meshRightCp0'),
    u_meshRightCp1: gl.getUniformLocation(program, 'u_meshRightCp1'),
    u_meshTopCp0: gl.getUniformLocation(program, 'u_meshTopCp0'),
    u_meshTopCp1: gl.getUniformLocation(program, 'u_meshTopCp1'),
    u_meshLeftCp0: gl.getUniformLocation(program, 'u_meshLeftCp0'),
    u_meshLeftCp1: gl.getUniformLocation(program, 'u_meshLeftCp1'),
    u_meshColorPositions: gl.getUniformLocation(program, 'u_meshColorPositions'),
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
  const meshGradientTexture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, meshGradientTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, MESH_FIELD_SIZE, MESH_FIELD_SIZE, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(MESH_FIELD_SIZE * MESH_FIELD_SIZE * 4));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const diffuseCurveTexture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, diffuseCurveTexture);
  const identityCurve = new Uint8Array(256 * 4);
  for (let i = 0; i < 256; i++) {
    identityCurve[i * 4] = i;
    identityCurve[i * 4 + 1] = i;
    identityCurve[i * 4 + 2] = i;
    identityCurve[i * 4 + 3] = 255;
  }
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, identityCurve);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const diffuseAsciiTexture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, diffuseAsciiTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, ASCII_ATLAS_WIDTH, ASCII_ATLAS_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const manualDistortTexture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, manualDistortTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 1, 1, 0, gl.RGBA, gl.FLOAT, new Float32Array([0.5, 0.5, 0.0, 1.0]));
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
  const flowGradient = createFlowGradientResources(gl);
  const transitionTextureFrom = createTexture(gl);
  const transitionTextureTo = createTexture(gl);
  const ctx: WebGLContext = { gl, performanceProfiler, gpuDiagnostics, renderOptimization, program, uniforms, generatorProgram: null, generatorUniforms: {}, gradientRampTexture, meshGradientTexture, meshGradientTextureSignature: '', diffuseCurveTexture, diffuseCurveSignature: '', diffuseAsciiTexture, diffuseAsciiSignature: '', diffuseAsciiCount: 1, diffuseAsciiRows: ASCII_ATLAS_MAX_ROWS, diffuseHistogramAt: 0, manualDistortTexture, manualDistortDisplacement: null, manualDistortSmoothMask: null, manualDistortMapResolution: 0, sourceImageTexture, sourceImageCanvas: null, imageGradientTexture, imageGradientSource: null, imageMaskTexture, imageMaskSource: null, normalMapProgram: null, normalMapUniforms: {}, gradFbo, gradTexture, blurProgram: null, blurUniforms: {}, stretchProgram: null, stretchUniforms: {}, seamlessProgram: null, seamlessUniforms: {}, stackCoreProgram: null, stackCoreUniforms: {}, noiseStackProgram: null, noiseStackUniforms: {}, glassProgram: null, glassUniforms: {}, glassFallbackActive: false, glassV2Program: null, glassV2Uniforms: {}, glassV2FallbackActive: false, prismProgram: null, prismUniforms: {}, postprocessProgram: null, postprocessUniforms: {}, prismCompositeProgram: null, prismCompositeUniforms: {}, particleProgram: null, particleUniforms: {}, particleVao: null, particleQuadBuffer: null, particleInstanceBuffer: null, particleInstanceCount: 0, particleInstanceSeed: Number.NaN, flowGradient, normalFbo, normalTexture, hBlurFbo, hBlurTexture, postprocessFboA, postprocessTextureA, postprocessFboB, postprocessTextureB, prismScratchFbo, prismScratchTexture, prismBlurFbo, prismBlurTexture, prismGlowFbo, prismGlowTexture, fboSize: [0, 0], v2CoreFboSize: [0, 0], shaderCompileExt, lazyProgramState: createLazyProgramState(), lazyProgramCompileQueue: createSerialAsyncQueue(), hasPresentedFrame: false };
  effectStackTransitionResources.set(ctx, {
    program: transitionProgram,
    from: gl.getUniformLocation(transitionProgram, 'u_transitionFrom'),
    to: gl.getUniformLocation(transitionProgram, 'u_transitionTo'),
    progress: gl.getUniformLocation(transitionProgram, 'u_transitionProgress'),
    resolution: gl.getUniformLocation(transitionProgram, 'u_resolution'),
    textureFrom: transitionTextureFrom,
    textureTo: transitionTextureTo,
    textureSize: [0, 0],
  });
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
    // Glass系はドライバ側の長いコンパイルを許容し、通常のprogramは有限時間の
    // watchdog後にステータス参照へフォールバックする。完了通知を返さないドライバでも
    // 有効なProgramをタイムアウト扱いで破棄しないための最後の同期確認になる。
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
          console.warn('[WebGL shader] Parallel shader compile completion watchdog expired; falling back to synchronous status checks', {
            program: diagnosticLabel,
            elapsedMs: Math.round(performance.now() - compileStartedAt),
          });
          resolve();
          return;
        }
        requestAnimationFrame(poll);
      };
      requestAnimationFrame(poll);
    });
  }
  // エラーチェック（extなし = ここで初めて同期ブロック、extあり = 完了通知を受信済み、
  // またはwatchdog後の同期フォールバック）
  if (!gl.getShaderParameter(vert, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(vert);
    console.error('[GLSL] VERTEX compile error:', log);
    recordShaderError('vertex', diagnosticLabel, String(log ?? 'unknown vertex shader compile error'));
    throw new Error('Shader compile failed: ' + log);
  }
  if (!gl.getShaderParameter(frag, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(frag);
    console.error('[GLSL] FRAGMENT compile error:', log);
    recordShaderError('fragment', diagnosticLabel, String(log ?? 'unknown fragment shader compile error'));
    throw new Error('Shader compile failed: ' + log);
  }
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    console.error('[WebGL] Link failed:', log);
    console.error('[WebGL] MAX_FRAGMENT_UNIFORM_VECTORS:', gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS));
    console.error('[WebGL] MAX_VERTEX_UNIFORM_VECTORS:', gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS));
    console.error('[WebGL] MAX_VARYING_VECTORS:', gl.getParameter(gl.MAX_VARYING_VECTORS));
    recordShaderError('link', diagnosticLabel, String(log ?? 'unknown program link error'));
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
    generator: { promise: null, failed: false, timedOut: false, fallback: false },
    blur: { promise: null, failed: false, timedOut: false, fallback: false },
    normalMap: { promise: null, failed: false, timedOut: false, fallback: false },
    stretch: { promise: null, failed: false, timedOut: false, fallback: false },
    stackCore: { promise: null, failed: false, timedOut: false, fallback: false },
    noiseStack: { promise: null, failed: false, timedOut: false, fallback: false },
    glass: { promise: null, failed: false, timedOut: false, fallback: false },
    glassV2: { promise: null, failed: false, timedOut: false, fallback: false },
    prism: { promise: null, failed: false, timedOut: false, fallback: false },
    postprocess: { promise: null, failed: false, timedOut: false, fallback: false },
    prismComposite: { promise: null, failed: false, timedOut: false, fallback: false },
    particles: { promise: null, failed: false, timedOut: false, fallback: false },
    seamless: { promise: null, failed: false, timedOut: false, fallback: false },
    flowSplat: { promise: null, failed: false, timedOut: false, fallback: false },
    flowTrail: { promise: null, failed: false, timedOut: false, fallback: false },
    flowComposite: { promise: null, failed: false, timedOut: false, fallback: false },
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

function getSeamlessUniforms(gl: WebGL2RenderingContext, program: WebGLProgram): Record<string, WebGLUniformLocation | null> {
  return {
    u_sourceTex: gl.getUniformLocation(program, 'u_sourceTex'),
    u_resolution: gl.getUniformLocation(program, 'u_resolution'),
    u_blendWidth: gl.getUniformLocation(program, 'u_blendWidth'),
    u_axis: gl.getUniformLocation(program, 'u_axis'),
  };
}

function getPostprocessUniforms(gl: WebGL2RenderingContext, program: WebGLProgram): Record<string, WebGLUniformLocation | null> {
  const locations: Record<string, WebGLUniformLocation | null> = {};
  const activeUniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
  for (let index = 0; index < activeUniformCount; index += 1) {
    const uniform = gl.getActiveUniform(program, index);
    if (!uniform) continue;
    const name = uniform.name.replace(/\[0\]$/, '');
    const location = gl.getUniformLocation(program, uniform.name);
    locations[name] = location;
    // The shared upload path calls this field u_resolution while the
    // postprocess shaders expose the more specific u_tileResolution name.
    if (name === 'u_tileResolution') locations.u_resolution = location;
  }

  // Different stack programs intentionally expose different subsets of this
  // shared uniform contract. Keep missing entries as null so uploads remain
  // no-ops without asking webgl-lint to resolve nonexistent uniforms.
  return new Proxy(locations, {
    get(target, property) {
      return typeof property === 'string' ? (target[property] ?? null) : null;
    },
  }) as Record<string, WebGLUniformLocation | null>;
}

function setUniform1i(
  gl: WebGL2RenderingContext,
  location: WebGLUniformLocation | null | undefined,
  value: number,
): void {
  if (location == null) return;
  gl.uniform1i(location, value);
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

function getFlowSplatUniforms(gl: WebGL2RenderingContext, program: WebGLProgram): Record<string, WebGLUniformLocation | null> {
  return {
    u_resolution: gl.getUniformLocation(program, 'u_resolution'),
    u_fullResolution: gl.getUniformLocation(program, 'u_fullResolution'),
    u_tileOffset: gl.getUniformLocation(program, 'u_tileOffset'),
    u_phase: gl.getUniformLocation(program, 'u_phase'),
    u_seed: gl.getUniformLocation(program, 'u_seed'),
    u_curlScale: gl.getUniformLocation(program, 'u_curlScale'),
    u_curlStrength: gl.getUniformLocation(program, 'u_curlStrength'),
    u_speed: gl.getUniformLocation(program, 'u_speed'),
    u_ribbonWidth: gl.getUniformLocation(program, 'u_ribbonWidth'),
    u_stretch: gl.getUniformLocation(program, 'u_stretch'),
    u_particleSize: gl.getUniformLocation(program, 'u_particleSize'),
    u_density: gl.getUniformLocation(program, 'u_density'),
    u_particleOpacity: gl.getUniformLocation(program, 'u_particleOpacity'),
  };
}

function getFlowTrailUniforms(gl: WebGL2RenderingContext, program: WebGLProgram): Record<string, WebGLUniformLocation | null> {
  return {
    u_densityTex: gl.getUniformLocation(program, 'u_densityTex'),
    u_previousTrailTex: gl.getUniformLocation(program, 'u_previousTrailTex'),
    u_resolution: gl.getUniformLocation(program, 'u_resolution'),
    u_retention: gl.getUniformLocation(program, 'u_retention'),
  };
}

function getFlowCompositeUniforms(gl: WebGL2RenderingContext, program: WebGLProgram): Record<string, WebGLUniformLocation | null> {
  return {
    u_sourceTex: gl.getUniformLocation(program, 'u_sourceTex'),
    u_trailTex: gl.getUniformLocation(program, 'u_trailTex'),
    u_gradientRamp: gl.getUniformLocation(program, 'u_gradientRamp'),
    u_resolution: gl.getUniformLocation(program, 'u_resolution'),
    u_fullResolution: gl.getUniformLocation(program, 'u_fullResolution'),
    u_tileOffset: gl.getUniformLocation(program, 'u_tileOffset'),
    u_contrast: gl.getUniformLocation(program, 'u_contrast'),
    u_flowOpacity: gl.getUniformLocation(program, 'u_flowOpacity'),
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
  if (gl.isContextLost() || lazyProgramReady(ctx, key)) return;

  const source = getProgramSource(key);
  const fragSrc = source.fragment;
  const compileStartedAt = performance.now();
  const shaderCompileExt = selectShaderCompileExtensionForSnapshot(
    ctx.shaderCompileExt,
    ctx.performanceProfiler?.getSnapshot(),
  );
  let program: WebGLProgram | null = null;
  try {
    program = await createProgramAsync(
      gl,
      fragSrc,
      shaderCompileExt,
      source.vertex,
      key,
      key === 'glass' || key === 'glassV2'
        ? GLASS_PARALLEL_SHADER_COMPILE_TIMEOUT_MS
        : PARALLEL_SHADER_COMPILE_TIMEOUT_MS,
    );
    if (gl.isContextLost()) return;
    // Reflect uniforms before publishing the program. If webgl-lint or a
    // driver rejects reflection, no partially initialized program can enter
    // the render path and make the whole effect stack unusable.
    installLazyProgram(ctx, key, program);
  } catch (error) {
    console.error('[WebGL shader] compile failed', {
      program: key,
      durationMs: Math.round(performance.now() - compileStartedAt),
      fragmentSourceLength: fragSrc.length,
      parallelCompile: Boolean(shaderCompileExt),
      error,
    });
    if (program) gl.deleteProgram(program);
    throw error;
  }
}

function installLazyProgram(ctx: WebGLContext, key: LazyProgramKey, program: WebGLProgram): void {
  const { gl } = ctx;
  if (key === 'generator') {
    const generatorUniforms = getGeneratorUniforms(gl, program);
    ctx.generatorProgram = program;
    ctx.generatorUniforms = generatorUniforms;
    ctx.program = program;
    ctx.uniforms = generatorUniforms;
  } else if (key === 'blur') {
    const uniforms = getBlurUniforms(gl, program);
    ctx.blurProgram = program;
    ctx.blurUniforms = uniforms;
  } else if (key === 'normalMap') {
    const uniforms = getNormalMapUniforms(gl, program);
    ctx.normalMapProgram = program;
    ctx.normalMapUniforms = uniforms;
  } else if (key === 'stretch') {
    const uniforms = getStretchUniforms(gl, program);
    ctx.stretchProgram = program;
    ctx.stretchUniforms = uniforms;
  } else if (key === 'seamless') {
    const uniforms = getSeamlessUniforms(gl, program);
    ctx.seamlessProgram = program;
    ctx.seamlessUniforms = uniforms;
  } else if (key === 'stackCore') {
    const uniforms = getPostprocessUniforms(gl, program);
    ctx.stackCoreProgram = program;
    ctx.stackCoreUniforms = uniforms;
  } else if (key === 'noiseStack') {
    const uniforms = getPostprocessUniforms(gl, program);
    ctx.noiseStackProgram = program;
    ctx.noiseStackUniforms = uniforms;
  } else if (key === 'glass') {
    const uniforms = getPostprocessUniforms(gl, program);
    ctx.glassProgram = program;
    ctx.glassUniforms = uniforms;
  } else if (key === 'glassV2') {
    const uniforms = getPostprocessUniforms(gl, program);
    ctx.glassV2Program = program;
    ctx.glassV2Uniforms = uniforms;
  } else if (key === 'prism') {
    const uniforms = getPostprocessUniforms(gl, program);
    ctx.prismProgram = program;
    ctx.prismUniforms = uniforms;
  } else if (key === 'postprocess') {
    const uniforms = getPostprocessUniforms(gl, program);
    ctx.postprocessProgram = program;
    ctx.postprocessUniforms = uniforms;
  } else if (key === 'prismComposite') {
    const uniforms = getPrismCompositeUniforms(gl, program);
    ctx.prismCompositeProgram = program;
    ctx.prismCompositeUniforms = uniforms;
  } else if (key === 'flowSplat') {
    ctx.flowGradient.splatProgram = program;
    ctx.flowGradient.splatUniforms = getFlowSplatUniforms(gl, program);
  } else if (key === 'flowTrail') {
    ctx.flowGradient.trailProgram = program;
    ctx.flowGradient.trailUniforms = getFlowTrailUniforms(gl, program);
  } else if (key === 'flowComposite') {
    ctx.flowGradient.compositeProgram = program;
    ctx.flowGradient.compositeUniforms = getFlowCompositeUniforms(gl, program);
  } else {
    const uniforms = getParticleUniforms(gl, program);
    ctx.particleProgram = program;
    ctx.particleUniforms = uniforms;
    setupParticleGeometry(ctx);
  }
}

function requestLazyProgram(ctx: WebGLContext, key: LazyProgramKey): boolean {
  if (lazyProgramReady(ctx, key)) return true;

  const state = ctx.lazyProgramState[key];
  if (!state.promise && !state.failed) {
    window.dispatchEvent(new CustomEvent('kgg:webgl-lazy-program-state', {
      detail: { key, state: 'loading' as const },
    }));
    state.promise = ctx.lazyProgramCompileQueue.enqueue(() => compileLazyProgram(ctx, key)).catch((error) => {
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

function requestNoiseStackProgram(ctx: WebGLContext): boolean {
  if (lazyProgramReady(ctx, 'noiseStack')) return true;

  const noiseState = ctx.lazyProgramState.noiseStack;
  if (!noiseState.failed) return requestLazyProgram(ctx, 'noiseStack');
  // Noise has a complete legacy/general implementation. If the specialized
  // stack shader was rejected by a driver or a transient WebGL instrumentation
  // wrapper, keep the Effect Stack usable by switching to that implementation
  // instead of leaving the row permanently in an unavailable state.
  const fallbackReady = requestLazyProgram(ctx, 'postprocess');
  if (!fallbackReady) return false;
  if (!noiseState.fallback) {
    noiseState.fallback = true;
    window.dispatchEvent(new CustomEvent('kgg:webgl-lazy-program-state', {
      detail: { key: 'noiseStack', state: 'fallback' as const, fallback: true },
    }));
  }
  return true;
}

function lazyProgramReady(ctx: WebGLContext, key: LazyProgramKey): boolean {
  const resources = {
    generator: [ctx.generatorProgram, ctx.generatorUniforms],
    blur: [ctx.blurProgram, ctx.blurUniforms],
    normalMap: [ctx.normalMapProgram, ctx.normalMapUniforms],
    stretch: [ctx.stretchProgram, ctx.stretchUniforms],
    seamless: [ctx.seamlessProgram, ctx.seamlessUniforms],
    stackCore: [ctx.stackCoreProgram, ctx.stackCoreUniforms],
    noiseStack: [ctx.noiseStackProgram, ctx.noiseStackUniforms],
    glass: [ctx.glassProgram, ctx.glassUniforms],
    glassV2: [ctx.glassV2Program, ctx.glassV2Uniforms],
    prism: [ctx.prismProgram, ctx.prismUniforms],
    postprocess: [ctx.postprocessProgram, ctx.postprocessUniforms],
    prismComposite: [ctx.prismCompositeProgram, ctx.prismCompositeUniforms],
    particles: [ctx.particleProgram, ctx.particleUniforms],
    flowSplat: [ctx.flowGradient.splatProgram, ctx.flowGradient.splatUniforms],
    flowTrail: [ctx.flowGradient.trailProgram, ctx.flowGradient.trailUniforms],
    flowComposite: [ctx.flowGradient.compositeProgram, ctx.flowGradient.compositeUniforms],
  }[key];
  return Boolean(resources?.[0] && resources?.[1]);
}

function abortError(): DOMException {
  return new DOMException('Export cancelled', 'AbortError');
}

async function waitForLazyProgram(
  ctx: WebGLContext,
  key: LazyProgramKey,
  signal?: AbortSignal,
): Promise<void> {
  if (signal?.aborted) throw abortError();
  if (lazyProgramReady(ctx, key)) return;

  requestLazyProgram(ctx, key);
  const pending = ctx.lazyProgramState[key].promise;
  if (pending) {
    if (signal) {
      await new Promise<void>((resolve, reject) => {
        const onAbort = () => reject(abortError());
        signal.addEventListener('abort', onAbort, { once: true });
        void pending.then(resolve, reject).finally(() => {
          signal.removeEventListener('abort', onAbort);
        });
      });
    } else {
      await pending;
    }
  }

  if (signal?.aborted) throw abortError();
  if (!lazyProgramReady(ctx, key)) {
    throw new Error(`Required WebGL program is unavailable: ${key}`);
  }
}

/**
 * Export で使う lazy program を最初のフレームより前に確定する。
 * GLASS/GLASS V2 は専用 program を要求し、途中フレームで fallback へ
 * 切り替わる余地を残さない。
 */
export async function prepareExportPrograms(
  ctx: WebGLContext,
  state: LatestState,
  signal?: AbortSignal,
): Promise<void> {
  const required = getRequiredExportProgramKeys(state);
  for (const key of required) await waitForLazyProgram(ctx, key, signal);
}

export function getRequiredExportProgramKeys(state: LatestState): LazyProgramKey[] {
  const required: LazyProgramKey[] = [];
  const add = (key: LazyProgramKey, needed: boolean) => {
    if (needed && !required.includes(key)) required.push(key);
  };
  const imageGradientProtected = state.imageGradient.enabled && Boolean(state.imageGradientSource);

  if (state.effectPipeline.version === 'stack-v2') {
    const plan = getV2RenderPlan(state.effectPipeline, {
      normalMapEnabled: state.normalMap.enabled,
      normalMapBlur: state.normalMap.blur,
      prismGlowRadius: state.postprocess.prismGlowRadius ?? 0,
      forceTextureDiffusePass: state.diffuse.mode === 'legacy',
      seamlessEnabled: state.seamless?.enabled ?? false,
      gradientType: state.gradient?.gradientType,
      sourceImageEnabled: Boolean(state.sourceImageCanvas),
      imageGradientEnabled: imageGradientProtected,
      noiseType: state.noiseDistortion?.type,
      noiseLoopMode: state.noiseDistortion?.noiseLoopMode,
      diffuseMode: state.diffuse?.mode,
      clothGradientEnabled: state.clothGradient?.enabled ?? false,
      flowGradientEnabled: state.effectPipeline.flowGradientEnabled === true,
    });
    const protectedStipple = imageGradientProtected
      && state.diffuse.mode === 'legacy'
      && plan.diffuseEnabled;
    add('generator', imageGradientProtected || plan.analyticPrefix.enabled);
    add('stackCore', (!imageGradientProtected || protectedStipple) && plan.programs.stackCore);
    add('noiseStack', !imageGradientProtected && plan.programs.noiseStack);
    add('glassV2', !imageGradientProtected && plan.programs.glassV2 && !isGlassOpticallyIdentity(state.postprocess));
    add('normalMap', plan.programs.normalMap);
    add('blur', plan.programs.blur);
    add('stretch', !imageGradientProtected && plan.programs.stretch);
    add('prism', plan.programs.prism);
    add('prismComposite', plan.programs.prismComposite);
    add('particles', plan.programs.particles);
  } else {
    const layers = getActivePostprocessStackLayers(state.postprocess).filter(layer => (
      (layer.kind !== 'glass' && layer.kind !== 'glassV2') || !isGlassOpticallyIdentity(state.postprocess)
    ));
    const postprocessRequested = state.postprocess.enabled && layers.length > 0;
    const prismRequested = postprocessRequested && layers.some(layer => layer.kind === 'prism');
    const normalRequested = state.normalMap.enabled && !state.diffuse.enabled;
    add('generator', true);
    add('normalMap', normalRequested);
    add('blur', (normalRequested && state.normalMap.blur >= 0.5)
      || (prismRequested && (state.postprocess.prismGlowRadius ?? 0) > 0.01));
    add('stretch', state.stretch.enabled);
    add('postprocess', postprocessRequested);
    add('prismComposite', prismRequested);
    add('particles', state.postprocess.enabled && state.postprocess.effectMode === 'particles');
  }

  add('seamless', state.seamless?.enabled ?? false);
  const flowGradientEnabled = state.effectPipeline.flowGradientEnabled === true;
  add('flowSplat', flowGradientEnabled);
  add('flowTrail', flowGradientEnabled);
  add('flowComposite', flowGradientEnabled);

  return required;
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

function createTexture(gl: WebGL2RenderingContext): WebGLTexture {
  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return texture;
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

export function captureEffectStackTransitionFrame(
  ctx: WebGLContext,
  slot: 'from' | 'to',
): void {
  const resources = effectStackTransitionResources.get(ctx);
  if (!resources) return;
  const { gl } = ctx;
  const width = gl.drawingBufferWidth;
  const height = gl.drawingBufferHeight;
  if (width <= 0 || height <= 0) return;

  const texture = slot === 'from' ? resources.textureFrom : resources.textureTo;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  if (resources.textureSize[0] !== width || resources.textureSize[1] !== height) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    resources.textureSize = [width, height];
  }
  gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, width, height, 0);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

export function blendEffectStackTransitionFrames(
  ctx: WebGLContext,
  progress: number,
): void {
  const resources = effectStackTransitionResources.get(ctx);
  if (!resources) return;
  const { gl } = ctx;
  const width = gl.drawingBufferWidth;
  const height = gl.drawingBufferHeight;
  if (width <= 0 || height <= 0) return;

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, width, height);
  gl.useProgram(resources.program);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, resources.textureFrom);
  setUniform1i(gl, resources.from, 0);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, resources.textureTo);
  setUniform1i(gl, resources.to, 1);
  gl.uniform1f(resources.progress, Math.max(0, Math.min(1, progress)));
  gl.uniform2f(resources.resolution, width, height);
  drawArrays(ctx, 'Effect Stack Transition', gl.TRIANGLES, 0, 6);
  gl.bindTexture(gl.TEXTURE_2D, null);
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

export const NOISE_TYPE_MAP = { simplex: 0, fbm: 1, voronoi: 2, curl: 3, domain_warp_anim: 4, seamless: 5, ridged_fbm: 6, ae_fractal: 7, fast_curl: 8, caustics: 9, phasor: 10 } as const;
export const GRADIENT_TYPE_MAP = { linear: 0, radial: 1, fourcolor: 2, diamond: 3, angle: 4, bezier: 5, mesh: 6 } as const;
const DIFFUSE_MODE_MAP = { block: 0, smooth: 1, dither: 2, halftone: 3, ascii: 4, legacy: 5 } as const;
const PARTICLE_EMITTER_TYPE_MAP = { field: 0, line: 1, burst: 2, point: 3 } as const;
const ASCII_ATLAS_COLUMNS = 16;
const ASCII_GLYPH_WIDTH = 32;
const ASCII_GLYPH_HEIGHT = 32;
const ASCII_ATLAS_WIDTH = ASCII_ATLAS_COLUMNS * ASCII_GLYPH_WIDTH;
const ASCII_ATLAS_MAX_ROWS = 4;
const ASCII_ATLAS_HEIGHT = ASCII_ATLAS_MAX_ROWS * ASCII_GLYPH_HEIGHT;

function finiteClamp(value: number | undefined, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export function applyMeshGradientUniforms(
  gl: WebGL2RenderingContext,
  uniforms: Record<string, WebGLUniformLocation | null>,
  config: MeshGradientConfig | undefined,
): void {
  const mesh = normalizeMeshGradientConfig(config);
  const setPoint = (name: string, point: [number, number]) => gl.uniform2f(uniforms[name], point[0], point[1]);
  setPoint('u_meshCorner0', mesh.corners[0]);
  setPoint('u_meshCorner1', mesh.corners[1]);
  setPoint('u_meshCorner2', mesh.corners[2]);
  setPoint('u_meshCorner3', mesh.corners[3]);
  setPoint('u_meshBottomCp0', mesh.handles.bottom[0]);
  setPoint('u_meshBottomCp1', mesh.handles.bottom[1]);
  setPoint('u_meshRightCp0', mesh.handles.right[0]);
  setPoint('u_meshRightCp1', mesh.handles.right[1]);
  setPoint('u_meshTopCp0', mesh.handles.top[0]);
  setPoint('u_meshTopCp1', mesh.handles.top[1]);
  setPoint('u_meshLeftCp0', mesh.handles.left[0]);
  setPoint('u_meshLeftCp1', mesh.handles.left[1]);
  gl.uniform4f(
    uniforms.u_meshColorPositions,
    mesh.colorPositions[0],
    mesh.colorPositions[1],
    mesh.colorPositions[2],
    mesh.colorPositions[3],
  );
}

function buildGradientRampData(gradient: GradientConfig): Uint8Array {
  return buildRampTextureData(
    gradient.stops,
    gradient.rampInterpolation,
    gradient.rampMirror ?? false,
    gradient.opacityStops,
    gradient.rampColorMode,
    gradient.rampVariable ?? 0,
    gradient.rampRepeat ?? 1,
  );
}

function uploadGradientRampTexture(ctx: WebGLContext, data: Uint8Array): void {
  const { gl } = ctx;
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, ctx.gradientRampTexture);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, RAMP_TEX_WIDTH, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
}

function meshFieldSignature(mesh: MeshGradientConfig, rampData: Uint8Array): string {
  let hash = 2166136261;
  for (let index = 0; index < rampData.length; index += 1) {
    hash ^= rampData[index];
    hash = Math.imul(hash, 16777619);
  }
  return `${JSON.stringify(mesh)}:${hash >>> 0}:${MESH_FIELD_SIZE}:${MESH_FIELD_SUBDIVISIONS}`;
}

function uploadMeshGradientTexture(ctx: WebGLContext, gradient: GradientConfig, rampData: Uint8Array): void {
  const mesh = normalizeMeshGradientConfig(gradient.mesh);
  const signature = meshFieldSignature(mesh, rampData);
  if (ctx.meshGradientTextureSignature === signature) return;
  const field = buildMeshGradientField(mesh, rampData, RAMP_TEX_WIDTH, {
    width: MESH_FIELD_SIZE,
    height: MESH_FIELD_SIZE,
    subdivisions: MESH_FIELD_SUBDIVISIONS,
  });
  const { gl } = ctx;
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, ctx.meshGradientTexture);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, MESH_FIELD_SIZE, MESH_FIELD_SIZE, gl.RGBA, gl.UNSIGNED_BYTE, field);
  ctx.meshGradientTextureSignature = signature;
}

function uploadDiffuseCurveTexture(ctx: WebGLContext, diffuse: Pick<DiffuseConfig, 'luminanceBezier' | 'grainBezier'>): void {
  const curve = normalizeDiffuseBezier(diffuse.luminanceBezier);
  const grainCurve = normalizeDiffuseBezier(diffuse.grainBezier);
  const signature = `${curve.map(point => point.toFixed(6)).join('|')}::${grainCurve.map(point => point.toFixed(6)).join('|')}`;
  if (ctx.diffuseCurveSignature === signature) return;
  const lut = buildDiffuseBezierLut(curve);
  const grainLut = buildDiffuseBezierLut(grainCurve, lut.length);
  const rgba = new Uint8Array(lut.length * 4);
  for (let index = 0; index < lut.length; index++) {
    rgba[index * 4] = lut[index];
    rgba[index * 4 + 1] = grainLut[index];
    rgba[index * 4 + 2] = grainLut[index];
    rgba[index * 4 + 3] = 255;
  }
  const { gl } = ctx;
  gl.activeTexture(gl.TEXTURE8);
  gl.bindTexture(gl.TEXTURE_2D, ctx.diffuseCurveTexture);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, lut.length, 1, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
  ctx.diffuseCurveSignature = signature;
}

function normalizeAsciiCharset(value: string | undefined): string[] {
  const chars = Array.from(typeof value === 'string' && value.length > 0 ? value : DEFAULT_DIFFUSE_ASCII_CHARSET).slice(0, 64);
  return chars.length > 0 ? chars : Array.from(DEFAULT_DIFFUSE_ASCII_CHARSET);
}

const ASCII_GENERIC_FONTS = new Set(['monospace', 'serif', 'sans-serif', 'cursive', 'fantasy']);

function cssFontShorthand(size: number, font: string): string {
  const family = ASCII_GENERIC_FONTS.has(font) ? font : `"${font}"`;
  return `bold ${size}px ${family}`;
}

function uploadDiffuseAsciiTexture(
  ctx: WebGLContext,
  value: string | undefined,
  font?: string,
  fontSize?: number,
): void {
  const chars = normalizeAsciiCharset(value);
  const resolvedFont = typeof font === 'string' && font.length > 0 ? font : 'monospace';
  const resolvedSize = Number.isFinite(fontSize) && fontSize! > 0 ? fontSize! : 29;
  // Grow the atlas glyph cell with the font size so a large font never bleeds
  // into the neighboring atlas glyph. The cell fraction in the shader stays in
  // [0, 1], so the glyph fills its own cell at any font size.
  const glyphSize = Math.max(Math.ceil(resolvedSize * 1.15), ASCII_GLYPH_WIDTH);
  const atlasWidth = ASCII_ATLAS_COLUMNS * glyphSize;
  const atlasHeight = ASCII_ATLAS_MAX_ROWS * glyphSize;
  const signature = `${chars.join('')}::${resolvedFont}::${resolvedSize}`;
  if (ctx.diffuseAsciiSignature === signature) return;
  const { gl } = ctx;
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  if (!canvas) return;
  canvas.width = atlasWidth;
  canvas.height = atlasHeight;
  const context = canvas.getContext('2d');
  if (!context) return;
  const fontShorthand = cssFontShorthand(resolvedSize, resolvedFont);
  const draw = (): void => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = fontShorthand;
    chars.forEach((char, index) => {
      const column = index % ASCII_ATLAS_COLUMNS;
      const row = Math.floor(index / ASCII_ATLAS_COLUMNS);
      context.fillText(char, column * glyphSize + glyphSize / 2, row * glyphSize + glyphSize / 2 + 1);
    });
    gl.activeTexture(gl.TEXTURE9);
    gl.bindTexture(gl.TEXTURE_2D, ctx.diffuseAsciiTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    ctx.diffuseAsciiSignature = signature;
    ctx.diffuseAsciiCount = chars.length;
    ctx.diffuseAsciiRows = ASCII_ATLAS_MAX_ROWS;
  };
  // Draw synchronously with the currently available font first, so a font
  // change is visible immediately. `document.fonts.load` resolves for system
  // fonts too; when it settles, invalidate the signature so the next frame
  // re-draws with the fully loaded family instead of a fallback.
  draw();
  const fonts = typeof document !== 'undefined' ? document.fonts : null;
  if (fonts && !fonts.check(fontShorthand)) {
    void fonts.load(fontShorthand).then(() => {
      ctx.diffuseAsciiSignature = '';
    }).catch(() => {
      // Font unavailable on this system; keep the fallback-drawn atlas.
    });
  }
}

function publishDiffuseInputHistogram(ctx: WebGLContext, gradient: GradientConfig, sourceCanvas: HTMLCanvasElement | null | undefined): void {
  if (typeof window === 'undefined') return;
  const now = performance.now();
  if (now - ctx.diffuseHistogramAt < 250) return;
  ctx.diffuseHistogramAt = now;
  const histogram = new Uint32Array(256);
  try {
    if (sourceCanvas) {
      const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
      if (sourceContext) {
        const image = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
        for (let index = 0; index < image.data.length; index += 4) {
          const luminance = Math.max(0, Math.min(255, Math.round(
            image.data[index] * 0.299 + image.data[index + 1] * 0.587 + image.data[index + 2] * 0.114,
          )));
          histogram[luminance]++;
        }
      }
    }
    if (histogram.every(value => value === 0)) {
      const ramp = buildRampTextureData(
        gradient.stops,
        gradient.rampInterpolation,
        gradient.rampMirror ?? false,
        gradient.opacityStops,
        gradient.rampColorMode,
        gradient.rampVariable ?? 0,
        gradient.rampRepeat ?? 1,
      );
      for (let index = 0; index < ramp.length; index += 4) {
        const luminance = Math.max(0, Math.min(255, Math.round(
          ramp[index] * 0.299 + ramp[index + 1] * 0.587 + ramp[index + 2] * 0.114,
        )));
        histogram[luminance]++;
      }
    }
    window.dispatchEvent(new CustomEvent('kgg:diffuse-histogram', { detail: { histogram: Array.from(histogram) } }));
  } catch {
    // A tainted source canvas should not interrupt rendering or curve editing.
  }
}

function publishDiffuseTextureHistogram(ctx: WebGLContext, texture: WebGLTexture, width: number, height: number): void {
  if (typeof window === 'undefined') return;
  const now = performance.now();
  if (now - ctx.diffuseHistogramAt < 250) return;
  ctx.diffuseHistogramAt = now;
  const { gl } = ctx;
  const framebuffer = gl.createFramebuffer();
  if (!framebuffer) return;
  try {
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    const pixels = new Uint8Array(Math.max(1, width * height * 4));
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    const histogram = new Uint32Array(256);
    for (let index = 0; index < pixels.length; index += 4) {
      histogram[Math.max(0, Math.min(255, Math.round(
        pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114,
      )))]++;
    }
    window.dispatchEvent(new CustomEvent('kgg:diffuse-histogram', { detail: { histogram: Array.from(histogram) } }));
  } finally {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(framebuffer);
  }
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
  const data = new Float32Array(textureResolution * textureResolution * 4);
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
      data[dst] = dx * 0.5 + 0.5;
      data[dst + 1] = dy * 0.5 + 0.5;
      data[dst + 2] = smooth / 8;
      data[dst + 3] = 1.0;
    }
  }

  gl.activeTexture(gl.TEXTURE5);
  gl.bindTexture(gl.TEXTURE_2D, ctx.manualDistortTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, textureResolution, textureResolution, 0, gl.RGBA, gl.FLOAT, data);
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

function drawArraysDirect(
  ctx: WebGLContext,
  _label: string,
  mode: number,
  first: number,
  count: number,
): void {
  ctx.gl.drawArrays(mode, first, count);
}

function drawArraysWithProfiler(
  ctx: WebGLContext,
  label: string,
  mode: number,
  first: number,
  count: number,
): void {
  const profiler = ctx.performanceProfiler;
  if (!profiler) {
    drawArraysDirect(ctx, label, mode, first, count);
    return;
  }
  profiler.beginPass(label);
  profiler.recordDraw(label);
  try {
    ctx.gl.drawArrays(mode, first, count);
  } finally {
    profiler.endPass();
  }
}

const drawArrays = import.meta.env.DEV ? drawArraysWithProfiler : drawArraysDirect;

function drawArraysInstancedDirect(
  ctx: WebGLContext,
  _label: string,
  mode: number,
  first: number,
  count: number,
  instanceCount: number,
): void {
  ctx.gl.drawArraysInstanced(mode, first, count, instanceCount);
}

function drawArraysInstancedWithProfiler(
  ctx: WebGLContext,
  label: string,
  mode: number,
  first: number,
  count: number,
  instanceCount: number,
): void {
  const profiler = ctx.performanceProfiler;
  if (!profiler) {
    drawArraysInstancedDirect(ctx, label, mode, first, count, instanceCount);
    return;
  }
  profiler.beginPass(label);
  profiler.recordDraw(label);
  try {
    ctx.gl.drawArraysInstanced(mode, first, count, instanceCount);
  } finally {
    profiler.endPass();
  }
}

const drawArraysInstanced = import.meta.env.DEV ? drawArraysInstancedWithProfiler : drawArraysInstancedDirect;

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
  setUniform1i(gl, ctx.stretchUniforms.u_sourceTex, 3);
  gl.uniform2f(ctx.stretchUniforms.u_resolution, width, height);
  gl.uniform1f(ctx.stretchUniforms.u_bandHeight, Math.max(stretch.bandHeight, 1));
  gl.uniform1f(ctx.stretchUniforms.u_bandHeightVariance, stretch.bandHeightVariance ?? 0);
  gl.uniform1f(ctx.stretchUniforms.u_scan, scan);
  gl.uniform1f(ctx.stretchUniforms.u_variation, stretch.variation);
  gl.uniform1f(ctx.stretchUniforms.u_seed, seed);
  setUniform1i(gl, ctx.stretchUniforms.u_glowEnabled, stretch.glowEnabled ? 1 : 0);
  gl.uniform1f(ctx.stretchUniforms.u_glowIntensity, stretch.glowIntensity ?? 0.6);
  gl.uniform1f(ctx.stretchUniforms.u_glowRadius, stretch.glowRadius ?? 18);
  gl.uniform1f(ctx.stretchUniforms.u_glowThreshold, stretch.glowThreshold ?? 0.55);
  const [glowR, glowG, glowB] = hexToRgb(stretch.glowTint ?? '#F0EAD9');
  gl.uniform3f(ctx.stretchUniforms.u_glowTint, glowR, glowG, glowB);
  drawArrays(ctx, 'Stretch', gl.TRIANGLES, 0, 6);
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
  if (
    (targetFramebuffer === ctx.postprocessFboA && sourceTexture === ctx.postprocessTextureA) ||
    (targetFramebuffer === ctx.postprocessFboB && sourceTexture === ctx.postprocessTextureB)
  ) {
    throw new Error('Postprocess pass cannot sample from its destination texture');
  }
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
  if (!selectedProgram || !selectedUniforms) return false;
  const previousProgram = ctx.postprocessProgram;
  const previousUniforms = ctx.postprocessUniforms;
  ctx.postprocessProgram = selectedProgram;
  ctx.postprocessUniforms = selectedUniforms;
  try {
    if (effectMode === 'distort') uploadManualDistortMap(ctx, postprocess);
    gl.useProgram(ctx.postprocessProgram);
    gl.viewport(0, 0, width, height);
    gl.disable(gl.BLEND);
    gl.disable(gl.SCISSOR_TEST);
    gl.colorMask(true, true, true, true);
    gl.bindFramebuffer(gl.FRAMEBUFFER, targetFramebuffer);
    if (targetFramebuffer) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
  setUniform1i(gl, ctx.postprocessUniforms.u_sourceTex, 3);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, ctx.gradientRampTexture);
  setUniform1i(gl, ctx.postprocessUniforms.u_gradientRamp, 1);
  gl.activeTexture(gl.TEXTURE8);
  uploadDiffuseCurveTexture(ctx, {
    luminanceBezier: postprocess.diffuseLuminanceBezier ?? normalizeDiffuseBezier(undefined),
    grainBezier: postprocess.diffuseGrainBezier ?? normalizeDiffuseBezier(undefined),
  });
  gl.bindTexture(gl.TEXTURE_2D, ctx.diffuseCurveTexture);
  setUniform1i(gl, ctx.postprocessUniforms.u_diffuseCurve, 8);
  uploadDiffuseAsciiTexture(ctx, postprocess.diffuseAsciiCharset, postprocess.diffuseAsciiFont, postprocess.diffuseAsciiFontSize);
  gl.activeTexture(gl.TEXTURE9);
  gl.bindTexture(gl.TEXTURE_2D, ctx.diffuseAsciiTexture);
  setUniform1i(gl, ctx.postprocessUniforms.u_diffuseAsciiAtlas, 9);
  gl.activeTexture(gl.TEXTURE5);
  gl.bindTexture(gl.TEXTURE_2D, ctx.manualDistortTexture);
  setUniform1i(gl, ctx.postprocessUniforms.u_distortMap, 5);
  gl.uniform2f(ctx.postprocessUniforms.u_resolution, width, height);
  gl.uniform2f(ctx.postprocessUniforms.u_fullResolution, fullWidth, fullHeight);
  gl.uniform2f(ctx.postprocessUniforms.u_tileOffset, offsetX, offsetY);
  const anchors = gradient.anchors ?? GRADIENT_ANCHOR_DEFAULTS[gradient.gradientType ?? 'linear'];
  gl.uniform2f(ctx.postprocessUniforms.u_gradAnchor0, anchors[0][0], anchors[0][1]);
  gl.uniform2f(ctx.postprocessUniforms.u_gradAnchor1, anchors[1][0], anchors[1][1]);
  gl.uniform1f(ctx.postprocessUniforms.u_maxDisplacement, postprocess.maxDisplacement);
  setUniform1i(gl, ctx.postprocessUniforms.u_effectEnabled, 1);
  const effectModeMap = { distort: 0, mirror: 1, kaleidoscope: 2, prism: 3, voronoi: 4, glass: 5, diffuse: 6, noise: 7, slit: 8, glassV2: 9, particles: 0 } as const;
  setUniform1i(gl, ctx.postprocessUniforms.u_effectMode, effectModeMap[effectMode]);
  setUniform1i(gl, ctx.postprocessUniforms.u_stackSlitDiffuseAfter, diffuseAfterSlit ? 1 : 0);
  setUniform1i(gl, ctx.postprocessUniforms.u_noiseEnabled, noiseDistortion.enabled ? 1 : 0);
  setUniform1i(gl, ctx.postprocessUniforms.u_noiseType, NOISE_TYPE_MAP[noiseDistortion.type]);
  gl.uniform1f(ctx.postprocessUniforms.u_noiseAmount, noiseDistortion.amount ?? 0);
  gl.uniform1f(ctx.postprocessUniforms.u_noiseScale, noiseDistortion.scale ?? 1);
  setUniform1i(gl, ctx.postprocessUniforms.u_noiseOctaves, noiseDistortion.octaves ?? 3);
  gl.uniform1f(ctx.postprocessUniforms.u_noiseEvolution, noiseDistortion.evolution ?? 0);
  gl.uniform1f(ctx.postprocessUniforms.u_noiseSpeed, finiteClamp(noiseDistortion.speed, 0.5, 0, 4));
  gl.uniform1f(ctx.postprocessUniforms.u_noiseSeed, noiseDistortion.noiseSeed ?? 0);
  gl.uniform1f(ctx.postprocessUniforms.u_time, time);
  gl.uniform1f(ctx.postprocessUniforms.u_noiseLoopPeriod, Math.max(Math.abs(noiseLoopPeriod), 0.0001));
  setUniform1i(gl, ctx.postprocessUniforms.u_noiseLoopMode, noiseDistortion.noiseLoopMode === 'seamless' ? 1 : 0);
  gl.uniform1f(ctx.postprocessUniforms.u_noiseLoopBlend, Math.min(Math.max(noiseDistortion.noiseLoopBlend ?? 0.75, 0.001), 1));
  const [postprocessAnimDirX, postprocessAnimDirY] = getAnimationDirectionVector(animDirectionDegrees);
  gl.uniform2f(ctx.postprocessUniforms.u_animDir, postprocessAnimDirX, postprocessAnimDirY);
  gl.uniform1f(ctx.postprocessUniforms.u_dwInitVal, noiseDistortion.dwInitVal);
  gl.uniform1f(ctx.postprocessUniforms.u_dwInitAmp, noiseDistortion.dwInitAmp);
  // Match Noise's screen-space rotation with the canvas InputAngle. The
  // shader's coordinate rotation uses the opposite sign; persisted values
  // remain unchanged and are mirrored only at the upload boundary.
  gl.uniform1f(ctx.postprocessUniforms.u_dwRotAngle1, noiseAngleRadiansForShader(noiseDistortion.dwRotAngle1));
  gl.uniform1f(ctx.postprocessUniforms.u_dwRotAngle2, noiseAngleRadiansForShader(noiseDistortion.dwRotAngle2));
  gl.uniform1f(ctx.postprocessUniforms.u_dwDist1, noiseDistortion.dwDist1);
  gl.uniform1f(ctx.postprocessUniforms.u_dwDist2, noiseDistortion.dwDist2);
  gl.uniform1f(ctx.postprocessUniforms.u_dwDist3, noiseDistortion.dwDist3);
  gl.uniform1f(ctx.postprocessUniforms.u_dwDriftAngle, noiseAngleDegreesForShader(noiseDistortion.dwDriftAngle));
  const seamlessTypeMap = { simplex: 0, fbm: 1, curl: 2 } as const;
  setUniform1i(gl, ctx.postprocessUniforms.u_noiseSeamlessType, seamlessTypeMap[noiseDistortion.seamlessType] ?? 0);
  setUniform1i(gl, ctx.postprocessUniforms.u_seamlessAnimation, noiseDistortion.seamlessAnimation === 'radial' ? 1 : 0);
  gl.uniform1f(ctx.postprocessUniforms.u_seamlessTwist, noiseDistortion.seamlessTwist);
  const voronoiDistanceMap = { euclidean: 0, manhattan: 1, chebyshev: 2, minkowski: 3 } as const;
  const voronoiFeatureMap = { f1: 0, f2: 1, distance_to_edge: 2 } as const;
  setUniform1i(gl, ctx.postprocessUniforms.u_voronoiDistMetric, voronoiDistanceMap[noiseDistortion.voronoiDistMetric] ?? 0);
  gl.uniform1f(ctx.postprocessUniforms.u_voronoiRandomness, noiseDistortion.voronoiRandomness ?? 1);
  setUniform1i(gl, ctx.postprocessUniforms.u_voronoiFeature, voronoiFeatureMap[noiseDistortion.voronoiFeature] ?? 0);
  gl.uniform1f(ctx.postprocessUniforms.u_voronoiMinkowskiExp, noiseDistortion.voronoiMinkowskiExp ?? 2);
  gl.uniform1f(ctx.postprocessUniforms.u_ridgeSharpness, noiseDistortion.ridgeSharpness ?? 2);
  gl.uniform1f(ctx.postprocessUniforms.u_ridgeGain, noiseDistortion.ridgeGain ?? 0);
  gl.uniform1f(ctx.postprocessUniforms.u_ridgeLacunarity, noiseDistortion.ridgeLacunarity ?? 2);
  gl.uniform1f(ctx.postprocessUniforms.u_ridgePersistence, noiseDistortion.ridgePersistence ?? 0.6);
  gl.uniform1f(ctx.postprocessUniforms.u_ridgeOffset, noiseDistortion.ridgeOffset ?? 1);
  gl.uniform1f(ctx.postprocessUniforms.u_ridgeWarp, noiseDistortion.ridgeWarp ?? 1);
  setUniform1i(gl, ctx.postprocessUniforms.u_aeFractalType, noiseDistortion.aeFractalType === 'turbulent' ? 1 : 0);
  gl.uniform1f(ctx.postprocessUniforms.u_aeSubInfluence, noiseDistortion.aeSubInfluence ?? 0.7);
  gl.uniform1f(ctx.postprocessUniforms.u_aeSubScaling, noiseDistortion.aeSubScaling ?? 1.78);
  gl.uniform1f(ctx.postprocessUniforms.u_aeSubRotation, noiseAngleDegreesForShader(noiseDistortion.aeSubRotation ?? 0));
  gl.uniform1f(ctx.postprocessUniforms.u_aeContrast, noiseDistortion.aeContrast ?? 1);
  gl.uniform1f(ctx.postprocessUniforms.u_aeBrightness, noiseDistortion.aeBrightness ?? 0);
  gl.uniform1f(ctx.postprocessUniforms.u_causticsDepth, finiteClamp(noiseDistortion.causticsDepth, 0.65, 0.05, 3));
  gl.uniform1f(ctx.postprocessUniforms.u_causticsRefraction, 1.0);
  gl.uniform1f(ctx.postprocessUniforms.u_causticsSharpness, finiteClamp(noiseDistortion.causticsSharpness, 2.5, 0.5, 8));
  setUniform1i(gl, ctx.postprocessUniforms.u_causticsComplexity, Math.round(finiteClamp(noiseDistortion.causticsComplexity, 4, 2, 8)));
  gl.uniform1f(ctx.postprocessUniforms.u_causticsWaveSpread, finiteClamp(noiseDistortion.causticsWaveSpread, 0.75, 0, 1));
  gl.uniform1f(ctx.postprocessUniforms.u_causticsBoundaryWidth, finiteClamp(noiseDistortion.causticsBoundaryWidth, 0.75, 0.05, 1));
  const phasorDirectionMode = { directional: 0, radial: 1, swirl: 2 } as const;
  gl.uniform1f(ctx.postprocessUniforms.u_phasorFrequency, finiteClamp(noiseDistortion.phasorFrequency, 5.0, 0.5, 20));
  gl.uniform1f(ctx.postprocessUniforms.u_phasorBandwidth, finiteClamp(noiseDistortion.phasorBandwidth, 0.8, 0.1, 2));
  gl.uniform1f(ctx.postprocessUniforms.u_phasorDirection, finiteClamp(noiseDistortion.phasorDirection, 28, 0, 360) * Math.PI / 180);
  gl.uniform1f(ctx.postprocessUniforms.u_phasorDirectionSpread, finiteClamp(noiseDistortion.phasorDirectionSpread, 0.35, 0, 1));
  gl.uniform1f(ctx.postprocessUniforms.u_phasorSharpness, finiteClamp(noiseDistortion.phasorSharpness, 3.0, 0.5, 10));
  gl.uniform1f(ctx.postprocessUniforms.u_phasorWarpStrength, finiteClamp(noiseDistortion.phasorWarpStrength, 0.18, 0, 1));
  gl.uniform1f(ctx.postprocessUniforms.u_phasorTangentMix, finiteClamp(noiseDistortion.phasorTangentMix, 0.65, 0, 1));
  gl.uniform1f(ctx.postprocessUniforms.u_phasorKernelDensity, finiteClamp(noiseDistortion.phasorKernelDensity, 1.0, 0.25, 2));
  setUniform1i(gl, ctx.postprocessUniforms.u_phasorDirectionMode, phasorDirectionMode[noiseDistortion.phasorDirectionMode] ?? 0);
  setUniform1i(gl, ctx.postprocessUniforms.u_curlSteps, noiseDistortion.curlSteps);
  gl.uniform1f(ctx.postprocessUniforms.u_curlSpeed, noiseDistortion.curlSpeed ?? 1);
  gl.uniform1f(ctx.postprocessUniforms.u_curlEps, noiseDistortion.curlEps ?? 0.01);
  gl.uniform1f(ctx.postprocessUniforms.u_curlSeed, noiseDistortion.curlSeed ?? 0);
  gl.uniform1f(ctx.postprocessUniforms.u_prismSpeed, Math.max(Math.abs(animationSpeed), 0.0));
  const mirrorModeMap = { horizontal: 0, vertical: 1, quad: 2 } as const;
  setUniform1i(gl, ctx.postprocessUniforms.u_mirrorMode, mirrorModeMap[postprocess.mirrorMode ?? 'horizontal']);
  const kaleidoscopeTypeMap = { unfold: 0, flower: 1, starlish: 2 } as const;
  setUniform1i(gl, ctx.postprocessUniforms.u_kaleidoscopeType, kaleidoscopeTypeMap[postprocess.kaleidoscopeType ?? 'unfold']);
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
  const glassV2Color = normalizeGlassV2ColorParameters(postprocess);
  gl.uniform1f(ctx.postprocessUniforms.u_glassScale, glass.scale);
  gl.uniform1f(ctx.postprocessUniforms.u_glassStretch, glass.stretch);
  gl.uniform1f(ctx.postprocessUniforms.u_glassRotation, glass.rotationRadians);
  setUniform1i(gl, ctx.postprocessUniforms.u_glassComplexity, glass.complexity);
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
  gl.uniform1f(ctx.postprocessUniforms.u_glassV2ChromaticHue, glassV2Color.chromaticHueRadians);
  gl.uniform1f(ctx.postprocessUniforms.u_glassV2ChromaticSaturation, glassV2Color.chromaticSaturation);
  const [glassV2TransmissionR, glassV2TransmissionG, glassV2TransmissionB] = hexToRgb(
    glassV2Color.transmissionTint,
  );
  gl.uniform3f(
    ctx.postprocessUniforms.u_glassV2TransmissionTint,
    glassV2TransmissionR,
    glassV2TransmissionG,
    glassV2TransmissionB,
  );
  const [glassV2HighlightR, glassV2HighlightG, glassV2HighlightB] = hexToRgb(
    glassV2Color.highlightTint,
  );
  gl.uniform3f(
    ctx.postprocessUniforms.u_glassV2HighlightTint,
    glassV2HighlightR,
    glassV2HighlightG,
    glassV2HighlightB,
  );
  const diffuseScale = diffuseResolutionScale(fullWidth, fullHeight);
  setUniform1i(gl, ctx.postprocessUniforms.u_diffuseEnabled, applyPostDiffuse && postprocess.diffuseEnabled ? 1 : 0);
  setUniform1i(gl, ctx.postprocessUniforms.u_diffuseMode, DIFFUSE_MODE_MAP[postprocess.diffuseMode ?? 'block'] ?? 0);
  gl.uniform1f(ctx.postprocessUniforms.u_diffuseScatter, postprocess.diffuseMode === 'dither' ? 100 : postprocess.diffuseScatter * diffuseScale);
  gl.uniform1f(ctx.postprocessUniforms.u_diffuseGrain, postprocess.diffuseGrain * diffuseScale);
  gl.uniform1f(ctx.postprocessUniforms.u_diffuseSeed, postprocess.diffuseSeed);
  gl.uniform1f(ctx.postprocessUniforms.u_diffuseDitherThreshold, postprocess.diffuseDitherThreshold ?? 0.5);
  setUniform1i(gl, ctx.postprocessUniforms.u_diffuseAdaptiveEnabled, postprocess.diffuseAdaptiveEnabled ? 1 : 0);
  const postDiffuseChannelMap = { luminance: 0, hue: 1, saturation: 2 } as const;
  setUniform1i(gl, ctx.postprocessUniforms.u_diffuseAdaptiveChannel, postDiffuseChannelMap[postprocess.diffuseAdaptiveChannel ?? 'luminance']);
  setUniform1i(gl, ctx.postprocessUniforms.u_diffuseGrainAdaptiveEnabled, postprocess.diffuseGrainAdaptiveEnabled ? 1 : 0);
  gl.uniform1f(ctx.postprocessUniforms.u_diffuseGrainAdaptiveAmount, postprocess.diffuseGrainAdaptiveAmount ?? 1);
  setUniform1i(gl, ctx.postprocessUniforms.u_diffuseHalftoneShape, postprocess.diffuseHalftoneShape === 'square' ? 1 : 0);
  gl.uniform1f(ctx.postprocessUniforms.u_diffuseHalftoneSize, postprocess.diffuseHalftoneSize ?? 0.82);
  const [postDiffuseBackgroundR, postDiffuseBackgroundG, postDiffuseBackgroundB] = hexToRgb(
    postprocess.diffuseBackgroundColor ?? DEFAULT_DIFFUSE_BACKGROUND_COLOR,
  );
  gl.uniform3f(ctx.postprocessUniforms.u_diffuseBackgroundColor, postDiffuseBackgroundR, postDiffuseBackgroundG, postDiffuseBackgroundB);
  gl.uniform1f(ctx.postprocessUniforms.u_diffuseAsciiCount, ctx.diffuseAsciiCount);
  gl.uniform1f(ctx.postprocessUniforms.u_diffuseAsciiColumns, ASCII_ATLAS_COLUMNS);
  gl.uniform1f(ctx.postprocessUniforms.u_diffuseAsciiRows, ctx.diffuseAsciiRows);
  gl.uniform1f(ctx.postprocessUniforms.u_diffuseAsciiRotation, ((postprocess.diffuseAsciiRotation ?? 0) * Math.PI) / 180);
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
    variance: 0,
    seed: 0,
    slitPhase: 0,
    selectedSlitIdx: -1,
    slitDeltas: {},
    pixelPerfect: false,
    offsetAngle: 90,
  };
  setUniform1i(gl, ctx.postprocessUniforms.u_stackSlitMode, stackSlitModeMap[stackSlit.mode]);
  gl.uniform1f(ctx.postprocessUniforms.u_stackSlitAngle, (stackSlit.angle * Math.PI) / 180);
  const stackSlitWaveTypeMap = { sine: 0, sawtooth: 1, semicircle: 2 } as const;
  setUniform1i(gl, ctx.postprocessUniforms.u_stackSlitWaveType, stackSlitWaveTypeMap[stackSlit.waveType ?? 'sine']);
  gl.uniform1f(ctx.postprocessUniforms.u_stackSlitWaveHeight, stackSlit.waveHeight ?? 0);
  setUniform1i(gl, ctx.postprocessUniforms.u_stackSlitPolygonSides, Math.max(3, Math.min(32, Math.round(stackSlit.polygonSides ?? 6))));
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
    ? getSlitAnimationPhase(stackSlitAnimationBaseTime, noiseLoopPeriod, stackSlit.offsetSpeed)
    : 0;
  gl.uniform2f(
    ctx.postprocessUniforms.u_stackSlitParams,
    roundStackSlit(stackSlit.slitPhase ?? 0),
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
  setUniform1i(gl, ctx.postprocessUniforms.u_stackSlitAnimEnabled, stackSlitOffsetAnimationActive ? 1 : 0);
  gl.uniform1f(ctx.postprocessUniforms.u_stackSlitAnimTime, stackSlitAnimationTime);
  setUniform1i(gl, ctx.postprocessUniforms.u_stackSlitAnimMode, stackSlit.animMode === 'pingpong' ? 1 : 0);
  setUniform1i(gl, ctx.postprocessUniforms.u_stackSlitPixelPerfect, stackSlitPixelPerfect ? 1 : 0);
  if ((effectMode === 'glass' || effectMode === 'glassV2') && exportDiagnosticsEnabled()) {
    const destinationTexture = targetFramebuffer === ctx.postprocessFboA
      ? ctx.postprocessTextureA
      : targetFramebuffer === ctx.postprocessFboB
        ? ctx.postprocessTextureB
        : null;
    recordGlassPassDiagnostics({
      effectMode,
      program: selectedProgram,
      sourceTexture,
      destinationFramebuffer: targetFramebuffer,
      destinationTexture,
      viewport: [width, height],
      activeTexture: gl.getParameter(gl.ACTIVE_TEXTURE) as number,
      sourceSamplerUnit: 3,
      framebufferStatus: targetFramebuffer ? gl.checkFramebufferStatus(gl.FRAMEBUFFER) : null,
      glError: gl.getError(),
      fallback: !glassProgram && glassFallbackActive,
    });
  }
    drawArrays(ctx, effectMode, gl.TRIANGLES, 0, 6);
    if (targetFramebuffer === null) ctx.hasPresentedFrame = true;
    return true;
  } catch (error) {
    // A validation wrapper or driver can reject one optional effect pass.
    // Restore the previous program and let the caller keep the other layers.
    console.error(`[WebGL render] ${effectMode} pass skipped:`, error);
    return false;
  } finally {
    ctx.postprocessProgram = previousProgram;
    ctx.postprocessUniforms = previousUniforms;
  }
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
  setUniform1i(gl, ctx.prismCompositeUniforms.u_baseTex, 2);
  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, glowTexture);
  setUniform1i(gl, ctx.prismCompositeUniforms.u_glowTex, 3);
  gl.uniform2f(ctx.prismCompositeUniforms.u_resolution, width, height);
  const prismCenter = postprocess.prismCenter ?? [0.5, 0.5];
  gl.uniform2f(ctx.prismCompositeUniforms.u_prismCenter, prismCenter[0], prismCenter[1]);
  gl.uniform1f(ctx.prismCompositeUniforms.u_glowIntensity, postprocess.prismIntensity ?? 0.9);
  gl.uniform1f(ctx.prismCompositeUniforms.u_chromaticAberration, postprocess.prismChromaticAberration ?? 0);
  drawArrays(ctx, 'Prism', gl.TRIANGLES, 0, 6);
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
  setUniform1i(gl, ctx.blurUniforms.u_blurRadius, radius);
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, ctx.prismScratchTexture);
  setUniform1i(gl, ctx.blurUniforms.u_tex, 2);
  gl.uniform2f(ctx.blurUniforms.u_blurDir, 1.0, 0.0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, ctx.prismBlurFbo);
  drawArrays(ctx, 'Prism Blur', gl.TRIANGLES, 0, 6);
  gl.bindTexture(gl.TEXTURE_2D, ctx.prismBlurTexture);
  gl.uniform2f(ctx.blurUniforms.u_blurDir, 0.0, 1.0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, ctx.prismGlowFbo);
  drawArrays(ctx, 'Prism Blur', gl.TRIANGLES, 0, 6);

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

export function choosePostprocessTarget(
  ctx: WebGLContext,
  sourceTexture: WebGLTexture,
): { fbo: WebGLFramebuffer; texture: WebGLTexture } {
  if (sourceTexture === ctx.postprocessTextureA) {
    return { fbo: ctx.postprocessFboB, texture: ctx.postprocessTextureB };
  }
  return { fbo: ctx.postprocessFboA, texture: ctx.postprocessTextureA };
}

type SeamlessTarget = { fbo: WebGLFramebuffer; texture: WebGLTexture };

function getSeamlessTargetCandidates(ctx: WebGLContext): SeamlessTarget[] {
  return [
    { fbo: ctx.postprocessFboA, texture: ctx.postprocessTextureA },
    { fbo: ctx.postprocessFboB, texture: ctx.postprocessTextureB },
    { fbo: ctx.gradFbo, texture: ctx.gradTexture },
  ];
}

function drawSeamlessAxisPass(
  ctx: WebGLContext,
  sourceTexture: WebGLTexture,
  width: number,
  height: number,
  blendWidth: number,
  axis: 0 | 1,
  targetFramebuffer: WebGLFramebuffer | null,
): boolean {
  const { gl } = ctx;
  if (!ctx.seamlessProgram) return false;
  const destination = targetFramebuffer === ctx.postprocessFboA
    ? ctx.postprocessTextureA
    : targetFramebuffer === ctx.postprocessFboB
      ? ctx.postprocessTextureB
      : targetFramebuffer === ctx.gradFbo
        ? ctx.gradTexture
        : null;
  if (destination === sourceTexture) {
    throw new Error('Seamless pass cannot sample from its destination texture');
  }

  gl.useProgram(ctx.seamlessProgram);
  gl.viewport(0, 0, width, height);
  gl.disable(gl.BLEND);
  gl.disable(gl.SCISSOR_TEST);
  gl.colorMask(true, true, true, true);
  gl.bindFramebuffer(gl.FRAMEBUFFER, targetFramebuffer);
  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
  setUniform1i(gl, ctx.seamlessUniforms.u_sourceTex, 3);
  gl.uniform2f(ctx.seamlessUniforms.u_resolution, width, height);
  gl.uniform1f(ctx.seamlessUniforms.u_blendWidth, blendWidth);
  setUniform1i(gl, ctx.seamlessUniforms.u_axis, axis);
  drawArrays(ctx, 'Seamless', gl.TRIANGLES, 0, 6);
  return true;
}

function getFramebufferForTexture(ctx: WebGLContext, texture: WebGLTexture): WebGLFramebuffer | null {
  if (texture === ctx.gradTexture) return ctx.gradFbo;
  if (texture === ctx.normalTexture) return ctx.normalFbo;
  if (texture === ctx.hBlurTexture) return ctx.hBlurFbo;
  if (texture === ctx.postprocessTextureA) return ctx.postprocessFboA;
  if (texture === ctx.postprocessTextureB) return ctx.postprocessFboB;
  if (texture === ctx.prismScratchTexture) return ctx.prismScratchFbo;
  if (texture === ctx.prismBlurTexture) return ctx.prismBlurFbo;
  if (texture === ctx.prismGlowTexture) return ctx.prismGlowFbo;
  return null;
}

function copyTextureToFramebuffer(
  ctx: WebGLContext,
  sourceTexture: WebGLTexture,
  targetFramebuffer: WebGLFramebuffer,
  width: number,
  height: number,
): void {
  const sourceFramebuffer = getFramebufferForTexture(ctx, sourceTexture);
  if (!sourceFramebuffer) throw new Error('Seamless particle composition received an unknown source texture');
  if (sourceFramebuffer === targetFramebuffer) throw new Error('Seamless particle composition cannot copy into its source framebuffer');

  const { gl } = ctx;
  gl.bindFramebuffer(gl.READ_FRAMEBUFFER, sourceFramebuffer);
  gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, targetFramebuffer);
  gl.blitFramebuffer(
    0, 0, width, height,
    0, 0, width, height,
    gl.COLOR_BUFFER_BIT,
    gl.NEAREST,
  );
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

/**
 * Runs the two-axis Seamless pass. A texture target is used when a later
 * overlay needs the processed frame as a sampler; null presents directly.
 */
function renderSeamlessPass(
  ctx: WebGLContext,
  sourceTexture: WebGLTexture,
  width: number,
  height: number,
  config: SeamlessConfig,
  targetFramebuffer: WebGLFramebuffer | null,
): WebGLTexture | null {
  const normalized = normalizeSeamlessConfig(config);
  if (!normalized.enabled || !ctx.seamlessProgram) return targetFramebuffer === ctx.postprocessFboA
    ? ctx.postprocessTextureA
    : targetFramebuffer === ctx.postprocessFboB
      ? ctx.postprocessTextureB
      : null;

  const horizontalTarget = getSeamlessTargetCandidates(ctx).find(candidate => (
    candidate.texture !== sourceTexture && candidate.fbo !== targetFramebuffer
  ));
  if (!horizontalTarget) throw new Error('No safe framebuffer is available for Seamless processing');
  if (!drawSeamlessAxisPass(ctx, sourceTexture, width, height, normalized.blendWidth, 0, horizontalTarget.fbo)) {
    return null;
  }
  if (!drawSeamlessAxisPass(ctx, horizontalTarget.texture, width, height, normalized.blendWidth, 1, targetFramebuffer)) {
    return null;
  }
  if (targetFramebuffer === null) ctx.hasPresentedFrame = true;
  return targetFramebuffer === ctx.postprocessFboA
    ? ctx.postprocessTextureA
    : targetFramebuffer === ctx.postprocessFboB
      ? ctx.postprocessTextureB
      : targetFramebuffer === ctx.gradFbo
        ? ctx.gradTexture
        : null;
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
  targetFramebuffer: WebGLFramebuffer | null = null,
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
  gl.bindFramebuffer(gl.FRAMEBUFFER, targetFramebuffer);
  if (!targetFramebuffer) {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
  setUniform1i(gl, ctx.particleUniforms.u_sourceTex, 3);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, ctx.gradientRampTexture);
  setUniform1i(gl, ctx.particleUniforms.u_gradientRamp, 1);
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
  setUniform1i(gl, ctx.particleUniforms.u_emitterType, PARTICLE_EMITTER_TYPE_MAP[emitterType as keyof typeof PARTICLE_EMITTER_TYPE_MAP] ?? 0);
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
  setUniform1i(gl, ctx.particleUniforms.u_colorOverLifeMode, 1);

  gl.bindVertexArray(ctx.particleVao);
  gl.enable(gl.BLEND);
  if ((postprocess.particleBlendMode ?? 'alpha') === 'add') {
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  } else {
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }
  drawArraysInstanced(ctx, 'Particles', gl.TRIANGLES, 0, 6, count);
  gl.disable(gl.BLEND);
  gl.bindVertexArray(null);
}

function drawFlowGradientPass(
  ctx: WebGLContext,
  sourceTexture: WebGLTexture,
  flowGradient: FlowGradientConfig,
  normalizedTime: number,
  loopEnabled: boolean,
  viewportWidth: number,
  viewportHeight: number,
  fullWidth: number,
  fullHeight: number,
  offsetX: number,
  offsetY: number,
  targetFramebuffer: WebGLFramebuffer | null,
  sessionId = 'preview',
): boolean {
  const regionKey = 'region:'
    + viewportWidth + 'x' + viewportHeight
    + '/full:' + fullWidth + 'x' + fullHeight
    + '@' + offsetX + ',' + offsetY;
  return renderFlowGradient(ctx.gl, ctx.flowGradient, {
    config: flowGradient,
    normalizedTime,
    loopEnabled,
    sourceTexture,
    gradientRampTexture: ctx.gradientRampTexture,
    targetFramebuffer,
    viewport: [viewportWidth, viewportHeight],
    fullResolution: [fullWidth, fullHeight],
    tileOffset: [offsetX, offsetY],
    sessionId,
    regionKey,
  });
}

/**
 * SANDBOX Cloth Gradient: 3D布メッシュをオフスクリーン描画し、その結果を
 * V2 パイプラインの Base テクスチャ `ctx.gradTexture` へ転送する。
 * 失敗時は `false` を返し、呼び出し側は既存の Base Gradient へフォールバックする。
 */
function renderClothIntoGradTexture(
  ctx: WebGLContext,
  gradient: GradientConfig,
  clothGradient: ClothGradientConfig,
  clothTime: number,
  vpW: number,
  vpH: number,
  tile: TileRenderOptions | undefined,
  loopPeriod = 1,
): boolean {
  const { gl } = ctx;
  try {
    if (!ctx.clothRenderer) {
      ctx.clothRenderer = new ClothGradientRenderer();
    }
    const rampData = buildRampTextureData(
      gradient.stops,
      gradient.rampInterpolation,
      gradient.rampMirror ?? false,
      gradient.opacityStops,
      gradient.rampColorMode,
      gradient.rampVariable,
      gradient.rampRepeat,
    );
    ctx.clothRenderer.updateRampData(rampData);
    // Cloth はアニメーションON時のみ動く専用の時間 clothTime を使う。
    // 共有の renderTime (time) は noise 等の Auto 有効時以外は進まず、
    // Cloth 単体の波が動かない原因になるため分離している。
    const clothCanvas = ctx.clothRenderer.render(clothGradient, clothTime, vpW, vpH, tile, loopPeriod);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, ctx.gradTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, clothCanvas);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    ctx.clothStatus = 'ready';
    window.dispatchEvent(new CustomEvent('kgg:webgl-lazy-program-state', { detail: { key: 'cloth', state: 'ready' } }));
    return true;
  } catch (err) {
    console.error('[ClothGradientRenderer] Error rendering cloth frame:', err);
    ctx.clothStatus = 'fallback';
    window.dispatchEvent(new CustomEvent('kgg:webgl-lazy-program-state', { detail: { key: 'cloth', state: 'fallback' } }));
    return false;
  }
}

/**
 * gradTexture に転送済みの cloth フレームを画面へコピーする。
 * stack プログラムが未コンパイルでも、Base Generator としての cloth 結果を
 * 提示するために使う。
 */
function presentClothGradTextureToScreen(
  ctx: WebGLContext,
  gradient: GradientConfig,
  width: number,
  height: number,
  vpW: number,
  vpH: number,
  tileOx: number,
  tileOy: number,
): void {
  const { gl } = ctx;
  gl.useProgram(ctx.postprocessProgram ?? ctx.program);
  gl.viewport(0, 0, vpW, vpH);
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, ctx.gradTexture);
  if (ctx.postprocessProgram) {
    setUniform1i(gl, ctx.postprocessUniforms.u_sourceTex, 2);
    gl.uniform2f(ctx.postprocessUniforms.u_resolution, vpW, vpH);
    gl.uniform2f(ctx.postprocessUniforms.u_fullResolution, vpW, vpH);
    gl.uniform2f(ctx.postprocessUniforms.u_tileOffset, tileOx, tileOy);
  } else {
    setUniform1i(gl, ctx.uniforms.u_gradientRamp, 2);
    gl.uniform2f(ctx.uniforms.u_resolution, width, height);
    setUniform1i(gl, ctx.uniforms.u_gradientType, GRADIENT_TYPE_MAP[gradient.gradientType ?? 'linear']);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  drawArrays(ctx, 'Base', gl.TRIANGLES, 0, 6);
  ctx.hasPresentedFrame = true;
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
  clothGradient?: ClothGradientConfig,
  clothTime = 0,
  clothLoopPeriod = 1,
  seamless: SeamlessConfig = DEFAULT_SEAMLESS,
  flowGradient?: FlowGradientConfig,
  flowNormalizedTime = 0,
  flowLoopEnabled = true,
  flowSessionId = 'preview',
): void {
  seamless = normalizeSeamlessConfig(seamless);
  const isV2Pipeline = effectPipeline?.version === 'stack-v2';
  const imageGradientProtected = imageGradient.enabled && !!imageGradientSource;
  const flowRequested = effectPipeline?.flowGradientEnabled === true && flowGradient != null;
  if (!flowRequested && ctx.flowGradient.hasTrail) resetFlowGradientResources(ctx.gl, ctx.flowGradient);
  const normalizedFlowGradient = flowRequested ? normalizeFlowGradientConfig(flowGradient) : null;
  const flowProgramsReady = !flowRequested || (
    requestLazyProgram(ctx, 'flowSplat') &&
    requestLazyProgram(ctx, 'flowTrail') &&
    requestLazyProgram(ctx, 'flowComposite')
  );
  let flowActive = flowRequested && flowProgramsReady && normalizedFlowGradient != null;
  const { gl, program, uniforms, gradientRampTexture, meshGradientTexture, sourceImageTexture, imageGradientTexture, imageMaskTexture } = ctx;
  gradient = { ...gradient, angle: clampParameter(gradient.angle, 0, getParameterLimit('gradient.angle')) };
  noiseDistortion = {
    ...noiseDistortion,
    dwRotAngle1: clampParameter(noiseDistortion.dwRotAngle1, 0.5, getParameterLimit('noise.dwRotAngle1')),
    dwRotAngle2: clampParameter(noiseDistortion.dwRotAngle2, 0.1, getParameterLimit('noise.dwRotAngle2')),
    dwDriftAngle: clampParameter(noiseDistortion.dwDriftAngle, 45, getParameterLimit('noise.dwDriftAngle')),
    aeSubRotation: clampParameter(noiseDistortion.aeSubRotation, 45, getParameterLimit('noise.aeSubRotation')),
    phasorFrequency: clampParameter(noiseDistortion.phasorFrequency, 5, getParameterLimit('noise.phasorFrequency')),
    phasorBandwidth: clampParameter(noiseDistortion.phasorBandwidth, 0.8, getParameterLimit('noise.phasorBandwidth')),
    phasorDirection: clampParameter(noiseDistortion.phasorDirection, 28, getParameterLimit('noise.phasorDirection')),
    phasorDirectionSpread: clampParameter(noiseDistortion.phasorDirectionSpread, 0.35, getParameterLimit('noise.phasorDirectionSpread')),
    phasorSharpness: clampParameter(noiseDistortion.phasorSharpness, 3, getParameterLimit('noise.phasorSharpness')),
    phasorWarpStrength: clampParameter(noiseDistortion.phasorWarpStrength, 0.18, getParameterLimit('noise.phasorWarpStrength')),
    phasorTangentMix: clampParameter(noiseDistortion.phasorTangentMix, 0.65, getParameterLimit('noise.phasorTangentMix')),
    phasorKernelDensity: clampParameter(noiseDistortion.phasorKernelDensity, 1, getParameterLimit('noise.phasorKernelDensity')),
  };
  diffuse = {
    ...diffuse,
    scatter: clampParameter(diffuse.scatter, 0, getParameterLimit('diffuse.scatter')),
    grain: clampParameter(
      diffuse.grain,
      1,
      getParameterLimit(
        diffuse.mode === 'dither'
          ? 'diffuse.ditherGrain'
          : diffuse.mode === 'halftone'
            ? 'diffuse.halftoneGrain'
            : diffuse.mode === 'ascii'
              ? 'diffuse.asciiGrain'
              : 'diffuse.grain',
      ),
    ),
    seed: clampParameter(diffuse.seed, 0, getParameterLimit('diffuse.seed')),
    ditherThreshold: clampParameter(diffuse.ditherThreshold, 0.5, getParameterLimit('diffuse.ditherThreshold')),
    luminanceBezier: normalizeDiffuseBezier(diffuse.luminanceBezier),
    grainBezier: normalizeDiffuseBezier(diffuse.grainBezier),
    grainAdaptiveAmount: clampParameter(diffuse.grainAdaptiveAmount, 1, getParameterLimit('diffuse.grainAdaptiveAmount')),
    halftoneSize: clampParameter(diffuse.halftoneSize, 0.82, getParameterLimit('diffuse.halftoneSize')),
  };
  slitScan = {
    ...slitScan,
    angle: clampParameter(slitScan.angle, 0, getParameterLimit('slit.angle')),
    offsetAngle: clampParameter(slitScan.offsetAngle, 90, getParameterLimit('slit.offsetAngle')),
  };
  normalMap = { ...normalMap, angle: clampParameter(normalMap.angle, 0, getParameterLimit('normalMap.angle')) };
  radon = { ...radon, angle: clampParameter(radon.angle, 0, getParameterLimit('radon.angle')) };
  iridescence = { ...iridescence, angle: clampParameter(iridescence.angle, 0, getParameterLimit('iridescence.angle')) };
  postprocess = {
    ...postprocess,
    kaleidoscopeRotation: clampParameter(postprocess.kaleidoscopeRotation, 0, getParameterLimit('postprocess.kaleidoscopeRotation')),
    voronoiAngle: clampParameter(postprocess.voronoiAngle, 35, getParameterLimit('postprocess.voronoiAngle')),
    glassRotation: clampParameter(postprocess.glassRotation, 12, getParameterLimit('postprocess.glassRotation')),
    particleDirection: clampParameter(postprocess.particleDirection, 0, getParameterLimit('postprocess.particleDirection')),
  };
  noiseDistortion = optimizeNoiseDistortion(noiseDistortion, ctx.renderOptimization);
  stretch = optimizeStretch(stretch, ctx.renderOptimization);
  normalMap = optimizeNormalMap(normalMap, ctx.renderOptimization);
  postprocess = optimizePostprocess(postprocess, ctx.renderOptimization);

  // タイル指定時はタイルの viewport サイズを使用、未指定なら全体サイズ
  const vpW = tile ? tile.viewport[0] : width;
  const vpH = tile ? tile.viewport[1] : height;
  const tileOx = tile ? tile.offset[0] : 0;
  const tileOy = tile ? tile.offset[1] : 0;
  const seamlessRequested = seamless.enabled && !tile;
  const renderPlan = isV2Pipeline && effectPipeline
    ? getV2RenderPlan(effectPipeline, {
      normalMapEnabled: normalMap.enabled,
      normalMapBlur: normalMap.blur,
      prismGlowRadius: postprocess.prismGlowRadius ?? 0,
      clothGradientEnabled: clothGradient?.enabled ?? false,
      forceTextureDiffusePass: diffuse.mode === 'legacy',
      seamlessEnabled: seamless.enabled,
      flowGradientEnabled: flowRequested,
      gradientType: gradient.gradientType,
      sourceImageEnabled: Boolean(sourceImageCanvas),
      imageGradientEnabled: imageGradientProtected,
      noiseType: noiseDistortion.type,
      noiseLoopMode: noiseDistortion.noiseLoopMode,
      diffuseMode: diffuse.mode,
    })
    : null;
  const analyticPrefixEnabled = renderPlan?.analyticPrefix.enabled === true;
  // Legacy and protected Image Gradient rendering still use the full
  // generator. V2 requests it only when the Render Plan can safely consume a
  // leading Noise/Diffuse prefix in one analytic pass.
  if (!isV2Pipeline || imageGradientProtected || analyticPrefixEnabled) requestLazyProgram(ctx, 'generator');
  if (flowActive) {
    resizeFlowGradientResources(
      gl,
      ctx.flowGradient,
      Math.max(1, Math.floor(vpW * 0.4)),
      Math.max(1, Math.floor(vpH * 0.4)),
    );
    flowActive = ctx.flowGradient.available;
  }

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
  setUniform1i(gl, uniforms.u_gradientType, GRADIENT_TYPE_MAP[gradient.gradientType ?? 'linear']);

  // アンカーポイントをシェーダーに渡す（フォールバックはデフォルト値）
  const anchors = gradient.anchors ?? GRADIENT_ANCHOR_DEFAULTS[gradient.gradientType ?? 'linear'];
  gl.uniform2f(uniforms.u_gradAnchor0, anchors[0][0], anchors[0][1]);
  gl.uniform2f(uniforms.u_gradAnchor1, anchors[1][0], anchors[1][1]);
  gl.uniform2f(uniforms.u_gradAnchor2, anchors[2][0], anchors[2][1]);
  gl.uniform2f(uniforms.u_gradAnchor3, anchors[3][0], anchors[3][1]);
  const bezierControls = gradient.bezierControls ?? defaultBezierControlsForAnchors(anchors);
  gl.uniform2f(uniforms.u_gradBezierCp0, bezierControls[0][0], bezierControls[0][1]);
  gl.uniform2f(uniforms.u_gradBezierCp1, bezierControls[1][0], bezierControls[1][1]);
  applyMeshGradientUniforms(gl, uniforms, gradient.mesh);

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
  const generatorLegacyColorFieldEnabled = !isV2Pipeline || imageGradientProtected;
  const analyticNoiseConsumed = renderPlan?.analyticPrefix.consumedLayers.includes('noise') === true;
  const analyticDiffuseConsumed = renderPlan?.analyticPrefix.consumedLayers.includes('diffuse') === true;
  const generatorColorFieldEnabled = generatorLegacyColorFieldEnabled || analyticPrefixEnabled;
  const generatorNoiseEnabled = isV2Pipeline && !imageGradientProtected
    ? analyticNoiseConsumed
    : noiseDistortion.enabled;
  setUniform1i(gl, uniforms.u_noiseEnabled, generatorColorFieldEnabled && generatorNoiseEnabled ? 1 : 0);
  setUniform1i(gl, uniforms.u_noiseType, NOISE_TYPE_MAP[noiseDistortion.type]);
  gl.uniform1f(uniforms.u_noiseAmount, noiseDistortion.amount);
  gl.uniform1f(uniforms.u_noiseScale, noiseDistortion.scale);
  setUniform1i(gl, uniforms.u_noiseOctaves, noiseDistortion.octaves);
  gl.uniform1f(uniforms.u_noiseEvolution, noiseDistortion.evolution);
  gl.uniform1f(uniforms.u_noiseSpeed, finiteClamp(noiseDistortion.speed, 0.5, 0, 4));
  const stMap = { simplex: 0, fbm: 1, curl: 2 };
  setUniform1i(gl, uniforms.u_noiseSeamlessType, stMap[noiseDistortion.seamlessType] ?? 0);
  setUniform1i(gl, uniforms.u_seamlessAnimation, noiseDistortion.seamlessAnimation === 'radial' ? 1 : 0);
  gl.uniform1f(uniforms.u_seamlessTwist, noiseDistortion.seamlessTwist);
  setUniform1i(gl, uniforms.u_noiseLoopMode, noiseDistortion.noiseLoopMode === 'seamless' ? 1 : 0);
  gl.uniform1f(uniforms.u_noiseLoopBlend, Math.min(Math.max(noiseDistortion.noiseLoopBlend ?? 0.75, 0.001), 1.0));
  setUniform1i(gl, uniforms.u_curlSteps, noiseDistortion.curlSteps);
  gl.uniform1f(uniforms.u_curlSpeed, noiseDistortion.curlSpeed ?? 1.0);
  gl.uniform1f(uniforms.u_curlEps, noiseDistortion.curlEps ?? 0.01);
  gl.uniform1f(uniforms.u_curlSeed, noiseDistortion.curlSeed ?? 0.0);
  gl.uniform1f(uniforms.u_noiseSeed, noiseDistortion.noiseSeed ?? 0.0);
  const VORONOI_DIST_MAP = { euclidean: 0, manhattan: 1, chebyshev: 2, minkowski: 3 } as const;
  const VORONOI_FEAT_MAP = { f1: 0, f2: 1, distance_to_edge: 2 } as const;
  setUniform1i(gl, uniforms.u_voronoiDistMetric, VORONOI_DIST_MAP[noiseDistortion.voronoiDistMetric] ?? 0);
  gl.uniform1f(uniforms.u_voronoiRandomness, noiseDistortion.voronoiRandomness ?? 1.0);
  setUniform1i(gl, uniforms.u_voronoiFeature, VORONOI_FEAT_MAP[noiseDistortion.voronoiFeature] ?? 0);
  gl.uniform1f(uniforms.u_voronoiMinkowskiExp, noiseDistortion.voronoiMinkowskiExp ?? 2.0);
  gl.uniform1f(uniforms.u_ridgeSharpness, noiseDistortion.ridgeSharpness ?? 2.0);
  gl.uniform1f(uniforms.u_ridgeGain, noiseDistortion.ridgeGain ?? 0.0);
  gl.uniform1f(uniforms.ridgeLacunarity, noiseDistortion.ridgeLacunarity ?? 2.0);
  gl.uniform1f(uniforms.u_ridgePersistence, noiseDistortion.ridgePersistence ?? 0.6);
  gl.uniform1f(uniforms.u_ridgeOffset, noiseDistortion.ridgeOffset ?? 1.0);
  gl.uniform1f(uniforms.u_ridgeWarp, noiseDistortion.ridgeWarp ?? 1.0);
  setUniform1i(gl, uniforms.u_aeFractalType, noiseDistortion.aeFractalType === 'turbulent' ? 1 : 0);
  gl.uniform1f(uniforms.u_aeSubInfluence, noiseDistortion.aeSubInfluence ?? 0.7);
  gl.uniform1f(uniforms.u_aeSubScaling, noiseDistortion.aeSubScaling ?? 1.78);
  gl.uniform1f(uniforms.u_aeSubRotation, noiseAngleDegreesForShader(noiseDistortion.aeSubRotation ?? 0));
  gl.uniform1f(uniforms.u_aeContrast, noiseDistortion.aeContrast ?? 1.0);
  gl.uniform1f(uniforms.u_aeBrightness, noiseDistortion.aeBrightness ?? 0.0);
  gl.uniform1f(uniforms.u_causticsDepth, finiteClamp(noiseDistortion.causticsDepth, 0.65, 0.05, 3));
  gl.uniform1f(uniforms.u_causticsRefraction, 1.0);
  gl.uniform1f(uniforms.u_causticsSharpness, finiteClamp(noiseDistortion.causticsSharpness, 2.5, 0.5, 8));
  setUniform1i(gl, uniforms.u_causticsComplexity, Math.round(finiteClamp(noiseDistortion.causticsComplexity, 4, 2, 8)));
  gl.uniform1f(uniforms.u_causticsWaveSpread, finiteClamp(noiseDistortion.causticsWaveSpread, 0.75, 0, 1));
  gl.uniform1f(uniforms.u_causticsBoundaryWidth, finiteClamp(noiseDistortion.causticsBoundaryWidth, 0.75, 0.05, 1));
  const phasorDirectionMode = { directional: 0, radial: 1, swirl: 2 } as const;
  gl.uniform1f(uniforms.u_phasorFrequency, finiteClamp(noiseDistortion.phasorFrequency, 5.0, 0.5, 20));
  gl.uniform1f(uniforms.u_phasorBandwidth, finiteClamp(noiseDistortion.phasorBandwidth, 0.8, 0.1, 2));
  gl.uniform1f(uniforms.u_phasorDirection, finiteClamp(noiseDistortion.phasorDirection, 28, 0, 360) * Math.PI / 180);
  gl.uniform1f(uniforms.u_phasorDirectionSpread, finiteClamp(noiseDistortion.phasorDirectionSpread, 0.35, 0, 1));
  gl.uniform1f(uniforms.u_phasorSharpness, finiteClamp(noiseDistortion.phasorSharpness, 3.0, 0.5, 10));
  gl.uniform1f(uniforms.u_phasorWarpStrength, finiteClamp(noiseDistortion.phasorWarpStrength, 0.18, 0, 1));
  gl.uniform1f(uniforms.u_phasorTangentMix, finiteClamp(noiseDistortion.phasorTangentMix, 0.65, 0, 1));
  gl.uniform1f(uniforms.u_phasorKernelDensity, finiteClamp(noiseDistortion.phasorKernelDensity, 1.0, 0.25, 2));
  setUniform1i(gl, uniforms.u_phasorDirectionMode, phasorDirectionMode[noiseDistortion.phasorDirectionMode] ?? 0);
  gl.uniform1f(uniforms.u_time, time);
  gl.uniform1f(uniforms.u_noiseLoopPeriod, Math.max(Math.abs(noiseLoopPeriod), 0.0001));
  const [animDirX, animDirY] = getAnimationDirectionVector(animDirection);
  gl.uniform2f(uniforms.u_animDir, animDirX, animDirY);
  const diffuseScale = diffuseResolutionScale(width, height);
  const generatorDiffuseEnabled = isV2Pipeline && !imageGradientProtected
    ? analyticDiffuseConsumed
    : generatorLegacyColorFieldEnabled && diffuse.enabled && !(isV2Pipeline && imageGradientProtected && diffuse.mode === 'legacy');
  setUniform1i(gl, uniforms.u_diffuseEnabled, generatorDiffuseEnabled ? 1 : 0);
  setUniform1i(gl, uniforms.u_diffuseMode, DIFFUSE_MODE_MAP[diffuse.mode ?? 'block'] ?? 0);
  gl.uniform1f(uniforms.u_diffuseScatter, diffuse.mode === 'dither' ? 100 : diffuse.scatter * diffuseScale);
  gl.uniform1f(uniforms.u_diffuseGrain, diffuse.grain * diffuseScale);
  gl.uniform1f(uniforms.u_diffuseSeed, diffuse.seed);
  gl.uniform1f(uniforms.u_diffuseDitherThreshold, diffuse.ditherThreshold ?? 0.5);
  uploadDiffuseCurveTexture(ctx, diffuse);
  gl.activeTexture(gl.TEXTURE8);
  gl.bindTexture(gl.TEXTURE_2D, ctx.diffuseCurveTexture);
  setUniform1i(gl, uniforms.u_diffuseCurve, 8);
  setUniform1i(gl, uniforms.u_diffuseAdaptiveEnabled, diffuse.adaptiveEnabled ? 1 : 0);
  const diffuseChannelMap = { luminance: 0, hue: 1, saturation: 2 } as const;
  setUniform1i(gl, uniforms.u_diffuseAdaptiveChannel, diffuseChannelMap[diffuse.adaptiveChannel ?? 'luminance']);
  setUniform1i(gl, uniforms.u_diffuseGrainAdaptiveEnabled, diffuse.grainAdaptiveEnabled ? 1 : 0);
  gl.uniform1f(uniforms.u_diffuseGrainAdaptiveAmount, diffuse.grainAdaptiveAmount ?? 1);
  setUniform1i(gl, uniforms.u_diffuseHalftoneShape, diffuse.halftoneShape === 'square' ? 1 : 0);
  gl.uniform1f(uniforms.u_diffuseHalftoneSize, diffuse.halftoneSize ?? 0.82);
  const [diffuseBackgroundR, diffuseBackgroundG, diffuseBackgroundB] = hexToRgb(
    diffuse.backgroundColor ?? DEFAULT_DIFFUSE_BACKGROUND_COLOR,
  );
  gl.uniform3f(uniforms.u_diffuseBackgroundColor, diffuseBackgroundR, diffuseBackgroundG, diffuseBackgroundB);
  uploadDiffuseAsciiTexture(ctx, diffuse.asciiCharset, diffuse.asciiFont, diffuse.asciiFontSize);
  gl.activeTexture(gl.TEXTURE9);
  gl.bindTexture(gl.TEXTURE_2D, ctx.diffuseAsciiTexture);
  setUniform1i(gl, uniforms.u_diffuseAsciiAtlas, 9);
  gl.uniform1f(uniforms.u_diffuseAsciiCount, ctx.diffuseAsciiCount);
  gl.uniform1f(uniforms.u_diffuseAsciiColumns, ASCII_ATLAS_COLUMNS);
  gl.uniform1f(uniforms.u_diffuseAsciiRows, ctx.diffuseAsciiRows);
  gl.uniform1f(uniforms.u_diffuseAsciiRotation, ((diffuse.asciiRotation ?? 0) * Math.PI) / 180);
  const rampData = buildGradientRampData(gradient);
  uploadGradientRampTexture(ctx, rampData);
  if ((gradient.gradientType ?? 'linear') === 'mesh') uploadMeshGradientTexture(ctx, gradient, rampData);
  if (diffuse.enabled && !isV2Pipeline) publishDiffuseInputHistogram(ctx, gradient, imageGradientSource ?? sourceImageCanvas);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, gradientRampTexture);
  setUniform1i(gl, uniforms.u_gradientRamp, 1);
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, meshGradientTexture);
  setUniform1i(gl, uniforms.u_meshGradient, 2);
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
  setUniform1i(gl, uniforms.u_sourceImage, 4);
  setUniform1i(gl, uniforms.u_sourceImageEnabled, sourceImageCanvas ? 1 : 0);
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
  setUniform1i(gl, uniforms.u_imageGradient, 7);
  setUniform1i(gl, uniforms.u_imageGradientEnabled, imageGradientActive ? 1 : 0);
  gl.uniform2f(uniforms.u_imageGradientSize, imageGradientSource?.width ?? 1, imageGradientSource?.height ?? 1);
  setUniform1i(gl, uniforms.u_imageGradientChannel, imageGradientChannel[imageGradient.channel]);
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
  setUniform1i(gl, uniforms.u_imageMask, 6);
  setUniform1i(gl, uniforms.u_imageMaskEnabled, imageMaskEnabled && imageMaskSource ? 1 : 0);
  gl.uniform1f(uniforms.u_dwInitVal, noiseDistortion.dwInitVal);
  gl.uniform1f(uniforms.u_dwInitAmp, noiseDistortion.dwInitAmp);
  gl.uniform1f(uniforms.u_dwRotAngle1, noiseAngleRadiansForShader(noiseDistortion.dwRotAngle1));
  gl.uniform1f(uniforms.u_dwRotAngle2, noiseAngleRadiansForShader(noiseDistortion.dwRotAngle2));
  gl.uniform1f(uniforms.u_dwDist1, noiseDistortion.dwDist1);
  gl.uniform1f(uniforms.u_dwDist2, noiseDistortion.dwDist2);
  gl.uniform1f(uniforms.u_dwDist3, noiseDistortion.dwDist3);
  gl.uniform1f(uniforms.u_dwDriftAngle, noiseAngleDegreesForShader(noiseDistortion.dwDriftAngle));
  setUniform1i(gl, uniforms.u_slitEnabled, generatorLegacyColorFieldEnabled && slitScan.enabled ? 1 : 0);
  setUniform1i(gl, uniforms.u_slitMode, slitScan.mode === 'circular' ? 1 : slitScan.mode === 'polygon' ? 2 : slitScan.mode === 'wave' ? 3 : 0);
  gl.uniform1f(uniforms.u_slitAngle, (slitScan.angle * Math.PI) / 180);
  const slitWaveTypeMap = { sine: 0, sawtooth: 1, semicircle: 2 } as const;
  setUniform1i(gl, uniforms.u_slitWaveType, slitWaveTypeMap[slitScan.waveType ?? 'sine']);
  gl.uniform1f(uniforms.u_slitWaveHeight, slitScan.waveHeight ?? 24);
  setUniform1i(gl, uniforms.u_slitPolygonSides, Math.max(3, Math.min(32, Math.round(slitScan.polygonSides ?? 6))));
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
    ? getSlitAnimationPhase(slitAnimBaseTime, noiseLoopPeriod, slitScan.offsetSpeed)
    : 0.0;
  gl.uniform2f(uniforms.u_slitParams, _ppR(slitScan.slitPhase ?? 0), slitScan.seed);
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
  setUniform1i(gl, uniforms.u_slitAnimEnabled, slitOffsetAnimActive ? 1 : 0);
  gl.uniform1f(uniforms.u_slitAnimTime, slitTime);
  setUniform1i(gl, uniforms.u_slitAnimMode, slitScan.animMode === 'pingpong' ? 1 : 0);
  // Legacy rendering keeps one fixed order. V2 uses the explicit stack order.
  setUniform1i(gl, uniforms.u_slitNoiseAfter, 0);
  setUniform1i(gl, uniforms.u_slitPixelPerfect, _pp ? 1 : 0);
  // Stretch is applied later as a post-process that samples the rendered texture.
  setUniform1i(gl, uniforms.u_radonEnabled, generatorLegacyColorFieldEnabled && radon.enabled ? 1 : 0);
  gl.uniform1f(uniforms.u_radonStrength, radon.strength);
  gl.uniform1f(uniforms.u_radonFreq, radon.freq);
  gl.uniform1f(uniforms.u_radonRadius, radon.radius);
  gl.uniform1f(uniforms.u_radonAngle, (radon.angle * Math.PI) / 180);
  gl.uniform1f(uniforms.u_radonBlur, radon.blur);
  gl.uniform1f(uniforms.u_radonEvolution, radon.evolution);
  gl.uniform1f(uniforms.u_radonSpeed, radon.speed);
  
  // Fluid Warp
  setUniform1i(gl, uniforms.u_iridEnabled, generatorLegacyColorFieldEnabled && iridescence.enabled ? 1 : 0);
  gl.uniform1f(uniforms.u_iridAngle, (iridescence.angle * Math.PI) / 180);
  gl.uniform1f(uniforms.u_iridSpeed, iridescence.speed);
  gl.uniform1f(uniforms.u_iridFreq, iridescence.frequency);
  gl.uniform1f(uniforms.u_iridStrength, iridescence.strength);
  uploadManualDistortMap(ctx, manualDistort);
  gl.activeTexture(gl.TEXTURE5);
  gl.bindTexture(gl.TEXTURE_2D, ctx.manualDistortTexture);
  setUniform1i(gl, uniforms.u_manualDistortMap, 5);
  setUniform1i(gl, uniforms.u_manualDistortEnabled, generatorLegacyColorFieldEnabled && manualDistort.enabled ? 1 : 0);
  gl.uniform1f(uniforms.u_manualDistortMaxDisplacement, manualDistort.maxDisplacement);
  gl.uniform1f(uniforms.u_manualDistortSmoothStrength, manualDistort.smoothStrength ?? 0.65);
  gl.uniform1f(uniforms.u_manualDistortSmoothRadius, manualDistort.smoothRadius ?? 18);

  if (isV2Pipeline && effectPipeline && renderPlan) {
    const diffuseLayerEnabled = renderPlan.diffuseEnabled;
    const protectedLayerEnabled = (kind: EffectPipelineConfig['effectStack'][number]['kind']) =>
      renderPlan.normalizedStack.some(layer => layer.kind === kind && layer.enabled);
    // Protected Image Gradient normally bypasses reorderable geometry layers.
    // Stipple is the exception: it needs the old texture postprocess path.
    const protectedStipple = imageGradientProtected
      && diffuse.mode === 'legacy'
      && diffuseLayerEnabled;
    const consumedAnalyticLayers = new Set<string>(renderPlan.analyticPrefix.consumedLayers);
    const mainLayers = imageGradientProtected
      ? (protectedStipple ? renderPlan.enabledLayers.filter(layer => layer.kind === 'diffuse') : [])
      : renderPlan.enabledLayers.filter(layer => !consumedAnalyticLayers.has(layer.kind));
    const normalRequested = renderPlan.normalRequested;
    const normalNeedsBlur = renderPlan.normalNeedsBlur;
    const prismRequested = renderPlan.prismRequested;
    const prismNeedsBlur = renderPlan.prismNeedsBlur;
    const particlesRequested = renderPlan.particlesRequested;
    const glassIdentity = isGlassOpticallyIdentity(postprocess);

    // The V2 default is Diffuse-only. Analytic Block/Smooth prefixes stay in
    // the Generator, while Stipple and other legacy modes remain texture
    // passes so their existing postprocess contract is preserved.
    const protectedDirect = imageGradientProtected
      && !protectedStipple
      && !normalRequested
      && !renderPlan.prismRequested
      && !renderPlan.particlesRequested
      && !seamlessRequested;
    const generatorReady = !analyticPrefixEnabled || requestLazyProgram(ctx, 'generator');
    if ((renderPlan.framebufferAllocationMode === 'direct' || protectedDirect) && !flowActive && generatorReady) {
      if (imageGradientProtected) {
        setUniform1i(gl, uniforms.u_noiseEnabled, protectedLayerEnabled('noise') && noiseDistortion.enabled ? 1 : 0);
        setUniform1i(gl, uniforms.u_slitEnabled, protectedLayerEnabled('slit') && slitScan.enabled ? 1 : 0);
        setUniform1i(gl, uniforms.u_diffuseEnabled, diffuseLayerEnabled ? 1 : 0);
      }
      setUniform1i(gl, uniforms.u_diffuseEnabled, diffuseLayerEnabled ? 1 : 0);
      setUniform1i(gl, uniforms.u_matcapEnabled, matcap.enabled ? 1 : 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      drawArrays(ctx, 'Base', gl.TRIANGLES, 0, 6);
      ctx.hasPresentedFrame = true;
      return;
    }

    const stackCoreRequested = (!imageGradientProtected || protectedStipple) && renderPlan.programs.stackCore;
    // V2's texture stack has its own specialized programs. It must not wait
    // for the Legacy generator unless the analytic prefix explicitly needs
    // the full Generator output.
    const stackCoreReady = !stackCoreRequested || requestLazyProgram(ctx, 'stackCore');
    const noiseStackReady = imageGradientProtected || !renderPlan.programs.noiseStack || (
      stackCoreReady && requestNoiseStackProgram(ctx)
    );
    const glassV2Ready = imageGradientProtected || glassIdentity || !renderPlan.programs.glassV2 || (
      stackCoreReady && noiseStackReady && requestGlassProgram(ctx, 'glassV2')
    );
    const normalReady = !normalRequested || (
      requestLazyProgram(ctx, 'normalMap') &&
      (!normalNeedsBlur || requestLazyProgram(ctx, 'blur'))
    );
    const stretchReady = imageGradientProtected || !renderPlan.programs.stretch || requestLazyProgram(ctx, 'stretch');
    const seamlessReady = !seamlessRequested || requestLazyProgram(ctx, 'seamless');
    const prismReady = !prismRequested || (
      requestLazyProgram(ctx, 'prism') &&
      requestLazyProgram(ctx, 'prismComposite') &&
      (!prismNeedsBlur || requestLazyProgram(ctx, 'blur'))
    );
    const particlesReady = !particlesRequested || requestLazyProgram(ctx, 'particles');

    // Lazy programs compile asynchronously. Keep a usable base frame until every
    // requested V2 stage is available instead of presenting a partial stack.
    if (!generatorReady || !stackCoreReady || !normalReady || !stretchReady || !prismReady || !particlesReady || !seamlessReady || !flowProgramsReady) {
      // Cloth is a Base generator and does not depend on the stack programs:
      // present the cloth frame even while they compile.
      const clothReady = clothGradient?.enabled
        ? renderClothIntoGradTexture(ctx, gradient, clothGradient, clothTime, vpW, vpH, tile, clothLoopPeriod)
        : false;
      if (clothReady) {
        presentClothGradTextureToScreen(ctx, gradient, width, height, vpW, vpH, tileOx, tileOy);
        return;
      }
      // Keep rendering the current base state while programs compile so
      // anchor and parameter edits remain visible instead of freezing the
      // first frame that happened to be presented.
      setUniform1i(gl, uniforms.u_diffuseEnabled, diffuseLayerEnabled ? 1 : 0);
      setUniform1i(gl, uniforms.u_matcapEnabled, matcap.enabled ? 1 : 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      drawArrays(ctx, 'Base', gl.TRIANGLES, 0, 6);
      ctx.hasPresentedFrame = true;
      return;
    }

    // V2 keeps several full-size intermediate textures. Limit direct preview
    // allocations; high-resolution export continues through the tile path.
    if (vpW * vpH > 16_777_216) {
      console.error('[WebGL render] V2 viewport exceeds the 16M-pixel FBO safety budget. Use tiled export or reduce preview resolution.');
      const clothReady = clothGradient?.enabled
        ? renderClothIntoGradTexture(ctx, gradient, clothGradient, clothTime, vpW, vpH, tile, clothLoopPeriod)
        : false;
      if (clothReady) {
        presentClothGradTextureToScreen(ctx, gradient, width, height, vpW, vpH, tileOx, tileOy);
        return;
      }
      setUniform1i(gl, uniforms.u_matcapEnabled, matcap.enabled ? 1 : 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      drawArrays(ctx, 'Base', gl.TRIANGLES, 0, 6);
      return;
    }
    const framebufferAllocationMode = flowActive && renderPlan.framebufferAllocationMode === 'direct'
      ? 'core'
      : renderPlan.framebufferAllocationMode;
    if (framebufferAllocationMode === 'full') {
      if (ctx.fboSize[0] !== vpW || ctx.fboSize[1] !== vpH) resizeFboTextures(gl, ctx, vpW, vpH);
    } else if (framebufferAllocationMode === 'core' && (ctx.v2CoreFboSize[0] !== vpW || ctx.v2CoreFboSize[1] !== vpH)) {
      resizeV2CoreFboTextures(gl, ctx, vpW, vpH);
    }

    // Base -> Surface. When the analytic prefix is enabled, the Generator
    // evaluates its consumed Noise/Diffuse layers here once; otherwise the
    // Bootstrap/Base result is the input for the existing texture stack.
    let clothRenderSuccess = false;
    if (clothGradient?.enabled) {
      clothRenderSuccess = renderClothIntoGradTexture(ctx, gradient, clothGradient, clothTime, vpW, vpH, tile, clothLoopPeriod);
    }

    if (!clothRenderSuccess) {
      setUniform1i(gl, uniforms.u_matcapEnabled, normalRequested ? 0 : (matcap.enabled ? 1 : 0));
      gl.bindFramebuffer(gl.FRAMEBUFFER, ctx.gradFbo);
      drawArrays(ctx, 'Base', gl.TRIANGLES, 0, 6);
    }
    let currentTexture: WebGLTexture = ctx.gradTexture;

    if (normalRequested && ctx.normalMapProgram) {
      gl.useProgram(ctx.normalMapProgram);
      gl.viewport(0, 0, vpW, vpH);
      gl.uniform2f(ctx.normalMapUniforms.u_resolution, vpW, vpH);
      gl.uniform1f(ctx.normalMapUniforms.u_normalMapStrength, normalMap.strength);
      gl.uniform1f(ctx.normalMapUniforms.u_normalMapAngle, (normalMap.angle * Math.PI) / 180);
      gl.uniform1f(ctx.normalMapUniforms.u_normalMapBevelSize, normalMap.bevelSize);
      setUniform1i(gl, ctx.normalMapUniforms.u_normalMapInvert, normalMap.invert ? 1 : 0);
      setUniform1i(gl, ctx.normalMapUniforms.u_matcapEnabled, matcap.enabled ? 1 : 0);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, ctx.gradTexture);
      setUniform1i(gl, ctx.normalMapUniforms.u_gradientTex, 2);
      gl.bindFramebuffer(gl.FRAMEBUFFER, ctx.normalFbo);
      drawArrays(ctx, 'Normal', gl.TRIANGLES, 0, 6);
      currentTexture = ctx.normalTexture;

      if (normalNeedsBlur && ctx.blurProgram) {
        const sigma = normalMap.blur;
        gl.useProgram(ctx.blurProgram);
        gl.uniform2f(ctx.blurUniforms.u_resolution, vpW, vpH);
        gl.uniform1f(ctx.blurUniforms.u_blurSigma, sigma);
        setUniform1i(gl, ctx.blurUniforms.u_blurRadius, Math.min(Math.ceil(sigma * 3), 32));
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, ctx.normalTexture);
        setUniform1i(gl, ctx.blurUniforms.u_tex, 2);
        gl.uniform2f(ctx.blurUniforms.u_blurDir, 1, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, ctx.hBlurFbo);
        drawArrays(ctx, 'Normal Blur', gl.TRIANGLES, 0, 6);
        gl.bindTexture(gl.TEXTURE_2D, ctx.hBlurTexture);
        gl.uniform2f(ctx.blurUniforms.u_blurDir, 0, 1);
        gl.bindFramebuffer(gl.FRAMEBUFFER, ctx.gradFbo);
        drawArrays(ctx, 'Normal Blur', gl.TRIANGLES, 0, 6);
        currentTexture = ctx.gradTexture;
      }
    }

    const v2Postprocess: PostprocessConfig = {
      ...postprocess,
      diffuseEnabled: diffuseLayerEnabled,
      diffuseMode: diffuse.mode,
      diffuseScatter: diffuse.scatter,
      diffuseGrain: diffuse.grain,
      diffuseSeed: diffuse.seed,
      diffuseDitherThreshold: diffuse.ditherThreshold,
      diffuseAdaptiveEnabled: diffuse.adaptiveEnabled,
      diffuseLuminanceBezier: diffuse.luminanceBezier,
      diffuseAdaptiveChannel: diffuse.adaptiveChannel,
      diffuseGrainAdaptiveEnabled: diffuse.grainAdaptiveEnabled,
      diffuseGrainAdaptiveAmount: diffuse.grainAdaptiveAmount,
      diffuseGrainBezier: diffuse.grainBezier,
      diffuseHalftoneShape: diffuse.halftoneShape,
      diffuseHalftoneSize: diffuse.halftoneSize,
      diffuseAsciiCharset: diffuse.asciiCharset,
      diffuseAsciiFont: diffuse.asciiFont,
      diffuseAsciiFontSize: diffuse.asciiFontSize,
      diffuseAsciiRotation: diffuse.asciiRotation,
      diffuseBackgroundColor: diffuse.backgroundColor,
    };
    // In V2, Noise is an explicit stack layer. Other effects may reuse the
    // noise material parameters internally, but must not apply the Noise UV
    // transform implicitly or the visible result would depend on hidden order.
    const disabledStackNoise = noiseDistortion.enabled
      ? { ...noiseDistortion, enabled: false }
      : noiseDistortion;
    for (let layerIndex = 0; layerIndex < mainLayers.length; layerIndex++) {
      const layer = mainLayers[layerIndex];
      if (layer.kind === 'diffuse') publishDiffuseTextureHistogram(ctx, currentTexture, vpW, vpH);
      // Noise has its own heavy shader. Keep rendering the remaining V2
      // layers while that program compiles (or if this driver rejects it),
      // rather than pinning Slit/Distort/etc. to the Base-only fallback.
      if (layer.kind === 'noise' && !noiseStackReady) continue;
      if (layer.kind === 'glass' && (glassIdentity || !glassV2Ready)) continue;
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
        const renderKind = layer.kind === 'glass' ? 'glassV2' : layer.kind;
        passRendered = drawPostprocessPass(
          ctx, currentTexture, gradient, layerNoise, v2Postprocess, renderKind,
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

    if (flowActive && normalizedFlowGradient) {
      const target = choosePostprocessTarget(ctx, currentTexture);
      if (drawFlowGradientPass(
        ctx,
        currentTexture,
        normalizedFlowGradient,
        flowNormalizedTime,
        flowLoopEnabled,
        vpW,
        vpH,
        width,
        height,
        tileOx,
        tileOy,
        target.fbo,
        flowSessionId,
      )) {
        currentTexture = target.texture;
      }
    }

    // Particles are composited into a texture when Seamless is enabled so the
    // final boundary pass has the same input as tiled CPU export.
    let seamlessSourceTexture = currentTexture;
    if (seamlessRequested && particlesRequested) {
      const particleTarget = choosePostprocessTarget(ctx, currentTexture);
      copyTextureToFramebuffer(ctx, currentTexture, particleTarget.fbo, vpW, vpH);
      drawParticleOverlay(ctx, currentTexture, gradient, postprocess, vpW, vpH, width, height, tileOx, tileOy, time, particleTarget.fbo);
      seamlessSourceTexture = particleTarget.texture;
    }
    if (seamlessRequested) {
      renderSeamlessPass(ctx, seamlessSourceTexture, vpW, vpH, seamless, null);
    }
    if (particlesRequested && !seamlessRequested) {
      drawParticleOverlay(ctx, currentTexture, gradient, postprocess, vpW, vpH, width, height, tileOx, tileOy, time);
    } else if (!seamlessRequested) {
      drawPostprocessPass(ctx, currentTexture, gradient, disabledStackNoise, v2Postprocess, 'diffuse', vpW, vpH, width, height, tileOx, tileOy, time, noiseLoopPeriod, animationSpeed, false, null, null, 0, null, true);
    }
    return;
  }

  const normalMapRequested = shouldRenderNormalMap(normalMap.enabled, diffuse.enabled);
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
  const seamlessReady = !seamlessRequested || requestLazyProgram(ctx, 'seamless');
  const seamlessActive = seamlessRequested && seamlessReady;
  const stretchScan = stretchScanOverride ?? 0;
  const stretchSeed = stretchScanOverride != null
    ? stretch.seed + (1 - Math.cos(stretchScan * Math.PI * 2)) * 0.5
    : stretch.seed;
  if ((stretchActive || postprocessActive || particleActive || seamlessActive || flowActive) && (ctx.fboSize[0] !== vpW || ctx.fboSize[1] !== vpH)) {
    resizeFboTextures(gl, ctx, vpW, vpH);
  }
  let particleSourceTexture: WebGLTexture | null = null;
  let seamlessSourceTexture: WebGLTexture | null = null;
  let flowSourceTexture: WebGLTexture | null = null;
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
      particleActive || seamlessActive || flowActive,
    );
    if (particleActive) particleSourceTexture = stackTexture ?? sourceTexture;
    if (seamlessActive) seamlessSourceTexture = stackTexture ?? sourceTexture;
    if (flowActive) flowSourceTexture = stackTexture ?? sourceTexture;
  };

  if (normalMapActive) {
    // ノーマルマップ有効時: 3パスレンダリング
    // タイルモードでは FBO サイズを viewport サイズに合わせる（タイル境界に継ぎ目が出る可能性あり）
    const fboW = vpW;
    const fboH = vpH;
    // Pass 1: グラデーションを gradFbo にレンダリング（matcapなし、ノーマル計算のため）
    if (ctx.fboSize[0] !== fboW || ctx.fboSize[1] !== fboH) resizeFboTextures(gl, ctx, fboW, fboH);
    setUniform1i(gl, uniforms.u_matcapEnabled, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, ctx.gradFbo);
    drawArrays(ctx, 'Base', gl.TRIANGLES, 0, 6);

    // Pass 2: gradFbo テクスチャからノーマルを計算
    gl.useProgram(ctx.normalMapProgram);
    // u_resolution はノーマルマップのサンプル間隔の基準。タイル時は viewport サイズで OK。
    gl.uniform2f(ctx.normalMapUniforms.u_resolution, fboW, fboH);
    gl.uniform1f(ctx.normalMapUniforms.u_normalMapStrength, normalMap.strength);
    gl.uniform1f(ctx.normalMapUniforms.u_normalMapAngle, (normalMap.angle * Math.PI) / 180);
    gl.uniform1f(ctx.normalMapUniforms.u_normalMapBevelSize, normalMap.bevelSize);
    setUniform1i(gl, ctx.normalMapUniforms.u_normalMapInvert, normalMap.invert ? 1 : 0);
    setUniform1i(gl, ctx.normalMapUniforms.u_matcapEnabled, matcap.enabled ? 1 : 0);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, ctx.gradTexture);
    setUniform1i(gl, ctx.normalMapUniforms.u_gradientTex, 2);

    const usePostBlur = normalMap.blur >= 0.5;
    if (usePostBlur) {
      // ノーマルを normalFbo へ
      gl.bindFramebuffer(gl.FRAMEBUFFER, ctx.normalFbo);
      drawArrays(ctx, 'Normal', gl.TRIANGLES, 0, 6);

      // Pass 3: Gaussian blur（H→V）
      gl.useProgram(ctx.blurProgram);
      const sigma = normalMap.blur;
      const radius = Math.min(Math.ceil(sigma * 3), 32);
      gl.uniform2f(ctx.blurUniforms.u_resolution, fboW, fboH);
      gl.uniform1f(ctx.blurUniforms.u_blurSigma, sigma);
      setUniform1i(gl, ctx.blurUniforms.u_blurRadius, radius);
      gl.bindTexture(gl.TEXTURE_2D, ctx.normalTexture);
      setUniform1i(gl, ctx.blurUniforms.u_tex, 2);
      gl.uniform2f(ctx.blurUniforms.u_blurDir, 1.0, 0.0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, ctx.hBlurFbo);
      drawArrays(ctx, 'Normal Blur', gl.TRIANGLES, 0, 6);
      gl.bindTexture(gl.TEXTURE_2D, ctx.hBlurTexture);
      gl.uniform2f(ctx.blurUniforms.u_blurDir, 0.0, 1.0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, (stretchActive || postprocessActive || particleActive || seamlessActive || flowActive) ? ctx.gradFbo : null);
      drawArrays(ctx, 'Normal Blur', gl.TRIANGLES, 0, 6);
      if (stretchActive) {
        drawStretchPass(ctx, ctx.gradTexture, stretch, stretchScan, stretchSeed, fboW, fboH, (postprocessActive || particleActive || seamlessActive || flowActive) ? ctx.normalFbo : null);
        if (postprocessActive) applyPostprocessStack(ctx.normalTexture, fboW, fboH);
        else if (particleActive) particleSourceTexture = ctx.normalTexture;
        else if (seamlessActive) seamlessSourceTexture = ctx.normalTexture;
      } else if (postprocessActive) {
        applyPostprocessStack(ctx.gradTexture, fboW, fboH);
      } else if (particleActive) {
        particleSourceTexture = ctx.gradTexture;
      } else if (seamlessActive) {
        seamlessSourceTexture = ctx.gradTexture;
      }
    } else {
      // ブラーなし: stretch有効時はノーマル結果をテクスチャ化してからポスト処理
      gl.bindFramebuffer(gl.FRAMEBUFFER, (stretchActive || postprocessActive || particleActive || seamlessActive || flowActive) ? ctx.normalFbo : null);
      drawArrays(ctx, 'Normal', gl.TRIANGLES, 0, 6);
      if (stretchActive) {
        drawStretchPass(ctx, ctx.normalTexture, stretch, stretchScan, stretchSeed, fboW, fboH, (postprocessActive || particleActive || seamlessActive || flowActive) ? ctx.gradFbo : null);
        if (postprocessActive) applyPostprocessStack(ctx.gradTexture, fboW, fboH);
        else if (particleActive) particleSourceTexture = ctx.gradTexture;
        else if (seamlessActive) seamlessSourceTexture = ctx.gradTexture;
      } else if (postprocessActive) {
        applyPostprocessStack(ctx.normalTexture, fboW, fboH);
      } else if (particleActive) {
        particleSourceTexture = ctx.normalTexture;
      } else if (seamlessActive) {
        seamlessSourceTexture = ctx.normalTexture;
      }
    }
    if (flowActive && flowSourceTexture == null) {
      flowSourceTexture = stretchActive
        ? (normalMapNeedsBlur ? ctx.normalTexture : ctx.gradTexture)
        : (normalMapNeedsBlur ? ctx.gradTexture : ctx.normalTexture);
    }
  } else {
    // ノーマルマップ無効: stretch有効時は一度FBOへ描いて、その画素を参照する
    setUniform1i(gl, uniforms.u_matcapEnabled, matcap.enabled ? 1 : 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, (stretchActive || postprocessActive || particleActive || seamlessActive || flowActive) ? ctx.gradFbo : null);
    drawArrays(ctx, 'Base', gl.TRIANGLES, 0, 6);
    if (stretchActive) {
      drawStretchPass(ctx, ctx.gradTexture, stretch, stretchScan, stretchSeed, vpW, vpH, (postprocessActive || particleActive || seamlessActive || flowActive) ? ctx.normalFbo : null);
      if (postprocessActive) applyPostprocessStack(ctx.normalTexture, vpW, vpH);
      else if (particleActive) particleSourceTexture = ctx.normalTexture;
      else if (seamlessActive) seamlessSourceTexture = ctx.normalTexture;
    } else if (postprocessActive) {
      applyPostprocessStack(ctx.gradTexture, vpW, vpH);
    } else if (particleActive) {
      particleSourceTexture = ctx.gradTexture;
    } else if (seamlessActive) {
      seamlessSourceTexture = ctx.gradTexture;
    }
    if (flowActive && flowSourceTexture == null) {
      flowSourceTexture = stretchActive ? ctx.normalTexture : ctx.gradTexture;
    }
  }

  if (flowActive && normalizedFlowGradient) {
    const sourceTexture = flowSourceTexture
      ?? seamlessSourceTexture
      ?? particleSourceTexture
      ?? ctx.gradTexture;
    const flowNeedsTexture = particleActive || seamlessActive;
    const target = flowNeedsTexture ? choosePostprocessTarget(ctx, sourceTexture) : null;
    const rendered = drawFlowGradientPass(
      ctx,
      sourceTexture,
      normalizedFlowGradient,
      flowNormalizedTime,
      flowLoopEnabled,
      vpW,
      vpH,
      width,
      height,
      tileOx,
      tileOy,
      target?.fbo ?? null,
      flowSessionId,
    );
    if (rendered && target) {
      if (particleActive) particleSourceTexture = target.texture;
      if (seamlessActive) seamlessSourceTexture = target.texture;
    }
  }

  if (seamlessActive) {
    let sourceTexture = seamlessSourceTexture ?? particleSourceTexture ?? ctx.gradTexture;
    if (particleActive) {
      const particleTarget = choosePostprocessTarget(ctx, sourceTexture);
      copyTextureToFramebuffer(ctx, sourceTexture, particleTarget.fbo, vpW, vpH);
      drawParticleOverlay(ctx, sourceTexture, gradient, postprocess, vpW, vpH, width, height, tileOx, tileOy, time, particleTarget.fbo);
      sourceTexture = particleTarget.texture;
    }
    renderSeamlessPass(ctx, sourceTexture, vpW, vpH, seamless, null);
  } else if (particleActive) {
    drawParticleOverlay(ctx, particleSourceTexture ?? ctx.gradTexture, gradient, postprocess, vpW, vpH, width, height, tileOx, tileOy, time);
  }
}
