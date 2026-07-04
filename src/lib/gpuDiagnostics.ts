import type {
  NoiseDistortionConfig,
  NormalMapConfig,
  PostprocessConfig,
  StretchConfig,
} from '../types/distortion';

declare global {
  interface WindowEventMap {
    'kagaribi:gpu-diagnostics': CustomEvent<GpuDiagnostics>;
  }

  interface Window {
    __TAURI_INTERNALS__?: unknown;
    __KAGARIBI_GPU_DIAGNOSTICS__?: GpuDiagnostics;
  }
}

export type NativeGpuAdapter = {
  name: string;
  adapter_ram: number | null;
  driver_version: string | null;
  driver_date: string | null;
  video_processor: string | null;
  pnp_device_id: string | null;
  status: string | null;
};

export type NativeGpuDiagnostics = {
  platform: string;
  adapters: NativeGpuAdapter[];
  error: string | null;
};

export type WebGLGpuCaps = {
  vendor: string;
  renderer: string;
  unmaskedVendor: string | null;
  unmaskedRenderer: string | null;
  maxTextureSize: number;
  maxRenderbufferSize: number;
  maxViewportDims: [number, number];
  maxTextureImageUnits: number;
  maxCombinedTextureImageUnits: number;
  maxFragmentUniformVectors: number;
  maxVaryingVectors: number;
};

export type GpuPerformanceTier = 'low' | 'medium' | 'high';

export type RenderOptimization = {
  tier: GpuPerformanceTier;
  reasons: string[];
  maxNoiseOctaves: number;
  maxCurlSteps: number;
  maxBlurRadius: number;
  maxPrismRays: number;
  maxKaleidoscopeSlices: number;
  maxGlassComplexity: number;
  maxStretchGlowRadius: number;
};

export type GpuDiagnostics = {
  native: NativeGpuDiagnostics | null;
  webgl: WebGLGpuCaps;
  optimization: RenderOptimization;
};

type DebugRendererInfo = {
  UNMASKED_VENDOR_WEBGL: number;
  UNMASKED_RENDERER_WEBGL: number;
};

function getStringParameter(gl: WebGL2RenderingContext, parameter: number): string {
  const value = gl.getParameter(parameter);
  return typeof value === 'string' ? value : String(value ?? '');
}

export function collectWebGLGpuCaps(gl: WebGL2RenderingContext): WebGLGpuCaps {
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info') as DebugRendererInfo | null;
  const maxViewportDimsValue = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array | number[];
  const maxViewportDims: [number, number] = [
    Number(maxViewportDimsValue[0] ?? 0),
    Number(maxViewportDimsValue[1] ?? 0),
  ];

  return {
    vendor: getStringParameter(gl, gl.VENDOR),
    renderer: getStringParameter(gl, gl.RENDERER),
    unmaskedVendor: debugInfo ? getStringParameter(gl, debugInfo.UNMASKED_VENDOR_WEBGL) : null,
    unmaskedRenderer: debugInfo ? getStringParameter(gl, debugInfo.UNMASKED_RENDERER_WEBGL) : null,
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE) as number,
    maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number,
    maxViewportDims,
    maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) as number,
    maxCombinedTextureImageUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS) as number,
    maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) as number,
    maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS) as number,
  };
}

function textIncludesAny(text: string, needles: string[]): boolean {
  const source = text.toLowerCase();
  return needles.some((needle) => source.includes(needle));
}

function maxAdapterRam(native: NativeGpuDiagnostics | null): number | null {
  const values = native?.adapters
    .map((adapter) => adapter.adapter_ram ?? 0)
    .filter((value) => value > 0) ?? [];
  return values.length > 0 ? Math.max(...values) : null;
}

function tierSettings(tier: GpuPerformanceTier, reasons: string[]): RenderOptimization {
  if (tier === 'low') {
    return {
      tier,
      reasons,
      maxNoiseOctaves: 4,
      maxCurlSteps: 3,
      maxBlurRadius: 18,
      maxPrismRays: 32,
      maxKaleidoscopeSlices: 24,
      maxGlassComplexity: 3,
      maxStretchGlowRadius: 24,
    };
  }

  if (tier === 'medium') {
    return {
      tier,
      reasons,
      maxNoiseOctaves: 6,
      maxCurlSteps: 5,
      maxBlurRadius: 48,
      maxPrismRays: 64,
      maxKaleidoscopeSlices: 48,
      maxGlassComplexity: 4,
      maxStretchGlowRadius: 48,
    };
  }

  return {
    tier,
    reasons,
    maxNoiseOctaves: 8,
    maxCurlSteps: 8,
    maxBlurRadius: 100,
    maxPrismRays: 96,
    maxKaleidoscopeSlices: 64,
    maxGlassComplexity: 5,
    maxStretchGlowRadius: 80,
  };
}

export function chooseRenderOptimization(
  webgl: WebGLGpuCaps,
  native: NativeGpuDiagnostics | null,
): RenderOptimization {
  const adapterText = [
    webgl.renderer,
    webgl.unmaskedRenderer,
    webgl.vendor,
    webgl.unmaskedVendor,
    ...(native?.adapters.flatMap((adapter) => [
      adapter.name,
      adapter.video_processor,
      adapter.pnp_device_id,
    ]) ?? []),
  ].filter(Boolean).join(' ');
  const reasons: string[] = [];
  const ram = maxAdapterRam(native);
  const lowCap = Math.min(webgl.maxTextureSize, webgl.maxRenderbufferSize, ...webgl.maxViewportDims) < 8192;
  const softwareRenderer = textIncludesAny(adapterText, [
    'swiftshader',
    'llvmpipe',
    'warp',
    'microsoft basic render',
    'software',
  ]);
  const integratedRenderer = textIncludesAny(adapterText, [
    'intel(r) hd graphics',
    'intel(r) uhd graphics',
    'intel(r) iris',
    'intel uhd',
    'intel hd',
    'radeon graphics',
  ]);

  if (softwareRenderer) reasons.push('software renderer');
  if (lowCap) reasons.push('low WebGL caps');
  if (integratedRenderer) reasons.push('integrated GPU');
  if (ram !== null && ram < 2 * 1024 ** 3) reasons.push('VRAM under 2GB');
  if (ram !== null && ram >= 6 * 1024 ** 3) reasons.push('VRAM 6GB+');

  if (softwareRenderer || lowCap || (ram !== null && ram < 2 * 1024 ** 3)) {
    return tierSettings('low', reasons);
  }

  if (integratedRenderer || (ram !== null && ram < 6 * 1024 ** 3)) {
    return tierSettings('medium', reasons);
  }

  return tierSettings('high', reasons.length > 0 ? reasons : ['dedicated or high-cap GPU profile']);
}

export async function collectGpuDiagnostics(gl: WebGL2RenderingContext): Promise<GpuDiagnostics> {
  const webgl = collectWebGLGpuCaps(gl);
  const native = null;
  const optimization = chooseRenderOptimization(webgl, native);
  const diagnostics = { native, webgl, optimization };

  if (typeof window !== 'undefined') {
    window.__KAGARIBI_GPU_DIAGNOSTICS__ = diagnostics;
    window.dispatchEvent(new CustomEvent('kagaribi:gpu-diagnostics', { detail: diagnostics }));
  }
  console.info('[GPU diag]', diagnostics);

  return diagnostics;
}

export function optimizeNoiseDistortion(
  config: NoiseDistortionConfig,
  optimization: RenderOptimization,
): NoiseDistortionConfig {
  if (optimization.tier === 'high') return config;
  return {
    ...config,
    octaves: Math.min(config.octaves, optimization.maxNoiseOctaves),
    curlSteps: Math.min(config.curlSteps, optimization.maxCurlSteps),
  };
}

export function optimizeStretch(
  config: StretchConfig,
  optimization: RenderOptimization,
): StretchConfig {
  if (optimization.tier === 'high') return config;
  return {
    ...config,
    glowRadius: Math.min(config.glowRadius ?? 18, optimization.maxStretchGlowRadius),
  };
}

export function optimizeNormalMap(
  config: NormalMapConfig,
  optimization: RenderOptimization,
): NormalMapConfig {
  if (optimization.tier === 'high') return config;
  return {
    ...config,
    blur: Math.min(config.blur, optimization.maxBlurRadius),
  };
}

export function optimizePostprocess(
  config: PostprocessConfig,
  optimization: RenderOptimization,
): PostprocessConfig {
  if (optimization.tier === 'high') return config;
  return {
    ...config,
    prismRayCount: Math.min(config.prismRayCount ?? 24, optimization.maxPrismRays),
    prismGlowRadius: Math.min(config.prismGlowRadius ?? 0, optimization.maxBlurRadius),
    kaleidoscopeSlices: Math.min(config.kaleidoscopeSlices ?? 8, optimization.maxKaleidoscopeSlices),
    glassComplexity: Math.min(config.glassComplexity ?? 4, optimization.maxGlassComplexity),
  };
}
