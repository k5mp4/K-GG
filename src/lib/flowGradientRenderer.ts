import type { FlowGradientConfig } from '../types/flowGradient';
import {
  getFlowConfigSignature,
  getFlowFrameKey,
  getFlowLoopPhase,
  getFlowResetPhases,
  getTrailRetention,
} from './flowSimulation';
import { createWebGLFramebufferWithTexture, createWebGLTexture2D } from './webglResources';

type FlowUniforms = Record<string, WebGLUniformLocation | null>;

export type FlowGradientResources = {
  splatProgram: WebGLProgram | null;
  splatUniforms: FlowUniforms;
  trailProgram: WebGLProgram | null;
  trailUniforms: FlowUniforms;
  compositeProgram: WebGLProgram | null;
  compositeUniforms: FlowUniforms;
  vao: WebGLVertexArrayObject | null;
  quadBuffer: WebGLBuffer | null;
  densityFbo: WebGLFramebuffer;
  densityTexture: WebGLTexture;
  trailFboA: WebGLFramebuffer;
  trailTextureA: WebGLTexture;
  trailFboB: WebGLFramebuffer;
  trailTextureB: WebGLTexture;
  size: [number, number];
  trailIndex: 0 | 1;
  hasTrail: boolean;
  available: boolean;
  format: 'rgba8';
  lastConfigSignature: string;
  lastPhase: number;
  lastRegionKey: string;
  lastFrameKey: string;
  lastSessionId: string;
  lastLoopEnabled: boolean;
};

export type FlowGradientRenderOptions = {
  config: FlowGradientConfig;
  normalizedTime: number;
  loopEnabled: boolean;
  sourceTexture: WebGLTexture;
  gradientRampTexture: WebGLTexture;
  targetFramebuffer: WebGLFramebuffer | null;
  viewport: [number, number];
  fullResolution: [number, number];
  tileOffset: [number, number];
  sessionId?: string;
  regionKey?: string;
};

function createRenderTarget(gl: WebGL2RenderingContext): { fbo: WebGLFramebuffer; texture: WebGLTexture } {
  const texture = createWebGLTexture2D(gl, 'Failed to create Flow Gradient texture');
  try {
    return {
      texture,
      fbo: createWebGLFramebufferWithTexture(gl, texture, 'Failed to create Flow Gradient framebuffer'),
    };
  } catch (error) {
    gl.deleteTexture(texture);
    throw error;
  }
}

function uploadTargetTexture(gl: WebGL2RenderingContext, texture: WebGLTexture, width: number, height: number): void {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

export function createFlowGradientResources(gl: WebGL2RenderingContext): FlowGradientResources {
  let density: { fbo: WebGLFramebuffer; texture: WebGLTexture } | null = null;
  let trailA: { fbo: WebGLFramebuffer; texture: WebGLTexture } | null = null;
  let trailB: { fbo: WebGLFramebuffer; texture: WebGLTexture } | null = null;
  let vao: WebGLVertexArrayObject | null = null;
  let quadBuffer: WebGLBuffer | null = null;
  try {
    density = createRenderTarget(gl);
    trailA = createRenderTarget(gl);
    trailB = createRenderTarget(gl);
    vao = gl.createVertexArray();
    quadBuffer = gl.createBuffer();
    if (!vao || !quadBuffer) throw new Error('Failed to create Flow Gradient geometry');
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1,
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return {
      splatProgram: null,
      splatUniforms: {},
      trailProgram: null,
      trailUniforms: {},
      compositeProgram: null,
      compositeUniforms: {},
      vao,
      quadBuffer,
      densityFbo: density.fbo,
      densityTexture: density.texture,
      trailFboA: trailA.fbo,
      trailTextureA: trailA.texture,
      trailFboB: trailB.fbo,
      trailTextureB: trailB.texture,
      size: [0, 0],
      trailIndex: 0,
      hasTrail: false,
      available: true,
      format: 'rgba8',
      lastConfigSignature: '',
      lastPhase: 0,
      lastRegionKey: '',
      lastFrameKey: '',
      lastSessionId: '',
      lastLoopEnabled: false,
    };
  } catch (error) {
    if (vao) gl.deleteVertexArray(vao);
    if (quadBuffer) gl.deleteBuffer(quadBuffer);
    for (const target of [density, trailA, trailB]) {
      if (!target) continue;
      gl.deleteFramebuffer(target.fbo);
      gl.deleteTexture(target.texture);
    }
    throw error;
  }
}

function clearTarget(gl: WebGL2RenderingContext, framebuffer: WebGLFramebuffer, width: number, height: number): void {
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.viewport(0, 0, width, height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

export function resizeFlowGradientResources(
  gl: WebGL2RenderingContext,
  resources: FlowGradientResources,
  width: number,
  height: number,
): void {
  const nextWidth = Math.max(1, Math.floor(width));
  const nextHeight = Math.max(1, Math.floor(height));
  if (resources.size[0] === nextWidth && resources.size[1] === nextHeight) return;
  for (const texture of [
    resources.densityTexture,
    resources.trailTextureA,
    resources.trailTextureB,
  ]) uploadTargetTexture(gl, texture, nextWidth, nextHeight);
  gl.bindTexture(gl.TEXTURE_2D, null);
  resources.size = [nextWidth, nextHeight];
  const previousFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;
  const framebuffers = [resources.densityFbo, resources.trailFboA, resources.trailFboB];
  resources.available = framebuffers.every(framebuffer => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    return gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  });
  gl.bindFramebuffer(gl.FRAMEBUFFER, previousFramebuffer);
  if (!resources.available) {
    console.error('[Flow Gradient] RGBA8 framebuffer is incomplete; Flow stage is disabled for this context');
  }
  resetFlowGradientResources(gl, resources);
}

export function resetFlowGradientResources(
  gl: WebGL2RenderingContext,
  resources: FlowGradientResources,
): void {
  const [width, height] = resources.size;
  if (width > 0 && height > 0) {
    clearTarget(gl, resources.densityFbo, width, height);
    clearTarget(gl, resources.trailFboA, width, height);
    clearTarget(gl, resources.trailFboB, width, height);
  }
  resources.trailIndex = 0;
  resources.hasTrail = false;
  resources.lastConfigSignature = '';
  resources.lastPhase = 0;
  resources.lastRegionKey = '';
  resources.lastFrameKey = '';
  resources.lastSessionId = '';
  resources.lastLoopEnabled = false;
}

/** Releases every GPU object owned by the Flow Gradient stage. */
export function disposeFlowGradientResources(
  gl: WebGL2RenderingContext,
  resources: FlowGradientResources,
): void {
  for (const program of [resources.splatProgram, resources.trailProgram, resources.compositeProgram]) {
    if (program) gl.deleteProgram(program);
  }
  if (resources.vao) gl.deleteVertexArray(resources.vao);
  if (resources.quadBuffer) gl.deleteBuffer(resources.quadBuffer);
  for (const framebuffer of [resources.densityFbo, resources.trailFboA, resources.trailFboB]) {
    gl.deleteFramebuffer(framebuffer);
  }
  for (const texture of [resources.densityTexture, resources.trailTextureA, resources.trailTextureB]) {
    gl.deleteTexture(texture);
  }
  resources.splatProgram = null;
  resources.trailProgram = null;
  resources.compositeProgram = null;
  resources.vao = null;
  resources.quadBuffer = null;
  resources.available = false;
  resources.hasTrail = false;
}

function getUniform(uniforms: FlowUniforms, name: string): WebGLUniformLocation | null {
  return uniforms[name] ?? null;
}

function drawQuad(gl: WebGL2RenderingContext, resources: FlowGradientResources): void {
  gl.bindVertexArray(resources.vao);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.bindVertexArray(null);
}

function drawDensity(
  gl: WebGL2RenderingContext,
  resources: FlowGradientResources,
  config: FlowGradientConfig,
  phase: number,
  fullResolution: [number, number],
  tileOffset: [number, number],
): void {
  const program = resources.splatProgram;
  if (!program) return;
  const [width, height] = resources.size;
  const scale = width / Math.max(1, fullResolution[0]);
  const uniforms = resources.splatUniforms;
  gl.bindFramebuffer(gl.FRAMEBUFFER, resources.densityFbo);
  gl.viewport(0, 0, width, height);
  gl.disable(gl.SCISSOR_TEST);
  gl.colorMask(true, true, true, true);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);
  gl.uniform2f(getUniform(uniforms, 'u_resolution'), width, height);
  gl.uniform2f(getUniform(uniforms, 'u_fullResolution'), fullResolution[0] * scale, fullResolution[1] * scale);
  gl.uniform2f(getUniform(uniforms, 'u_tileOffset'), tileOffset[0] * scale, tileOffset[1] * scale);
  gl.uniform1f(getUniform(uniforms, 'u_phase'), phase);
  gl.uniform1f(getUniform(uniforms, 'u_seed'), config.seed);
  gl.uniform1f(getUniform(uniforms, 'u_curlScale'), config.curlScale);
  gl.uniform1f(getUniform(uniforms, 'u_curlStrength'), config.curlStrength);
  gl.uniform1f(getUniform(uniforms, 'u_speed'), config.speed);
  gl.uniform1f(getUniform(uniforms, 'u_ribbonWidth'), Math.max(0.5, config.ribbonWidth * scale));
  gl.uniform1f(getUniform(uniforms, 'u_stretch'), config.stretch);
  gl.uniform1f(getUniform(uniforms, 'u_particleSize'), config.particleSize);
  // Density is accumulated in the reduced-resolution FBO. Without this area
  // compensation, the same particle count saturates a 400x400 target much
  // earlier than Full HD and turns the scalar field into a flat white block.
  // Keep the user density and particle overlap semantics intact while making
  // the per-pixel response comparable across supported output sizes.
  const densityResolutionScale = Math.min(1, Math.max(0.05, (width * height) / (960 * 540)));
  gl.uniform1f(getUniform(uniforms, 'u_density'), config.density * densityResolutionScale);
  gl.uniform1f(getUniform(uniforms, 'u_particleOpacity'), config.particleOpacity);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  gl.bindVertexArray(resources.vao);
  gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, Math.max(1, Math.floor(config.particleCount)));
  gl.bindVertexArray(null);
  gl.disable(gl.BLEND);
}

function drawTrail(
  gl: WebGL2RenderingContext,
  resources: FlowGradientResources,
  config: FlowGradientConfig,
): void {
  const program = resources.trailProgram;
  if (!program) return;
  const [width, height] = resources.size;
  const previousTexture = resources.trailIndex === 0 ? resources.trailTextureA : resources.trailTextureB;
  const targetFramebuffer = resources.trailIndex === 0 ? resources.trailFboB : resources.trailFboA;
  const uniforms = resources.trailUniforms;
  gl.bindFramebuffer(gl.FRAMEBUFFER, targetFramebuffer);
  gl.viewport(0, 0, width, height);
  gl.disable(gl.BLEND);
  gl.disable(gl.SCISSOR_TEST);
  gl.colorMask(true, true, true, true);
  gl.useProgram(program);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, resources.densityTexture);
  gl.uniform1i(getUniform(uniforms, 'u_densityTex'), 0);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, previousTexture);
  gl.uniform1i(getUniform(uniforms, 'u_previousTrailTex'), 1);
  gl.uniform2f(getUniform(uniforms, 'u_resolution'), width, height);
  gl.uniform1f(getUniform(uniforms, 'u_retention'), getTrailRetention(config.trail));
  drawQuad(gl, resources);
  resources.trailIndex = resources.trailIndex === 0 ? 1 : 0;
  resources.hasTrail = true;
}

export function renderFlowGradient(
  gl: WebGL2RenderingContext,
  resources: FlowGradientResources,
  options: FlowGradientRenderOptions,
): boolean {
  if (!resources.available || !resources.splatProgram || !resources.trailProgram || !resources.compositeProgram) return false;
  const viewportWidth = Math.max(1, Math.floor(options.viewport[0]));
  const viewportHeight = Math.max(1, Math.floor(options.viewport[1]));
  // Simulate in full-output space even when the caller is rendering one tile.
  // The composite pass crops this shared field to the local viewport; this
  // prevents a tile boundary from changing the Density/Trail neighbourhood.
  const fullWidth = Math.max(1, Math.floor(options.fullResolution[0]));
  const fullHeight = Math.max(1, Math.floor(options.fullResolution[1]));
  const flowWidth = Math.max(1, Math.floor(fullWidth * 0.4));
  const flowHeight = Math.max(1, Math.floor(fullHeight * 0.4));
  resizeFlowGradientResources(gl, resources, flowWidth, flowHeight);
  if (!resources.available) return false;

  const phase = getFlowLoopPhase(options.normalizedTime, options.loopEnabled);
  const regionKey = options.regionKey ?? (
    'viewport:' + viewportWidth + 'x' + viewportHeight
    + '/full:' + options.fullResolution[0] + 'x' + options.fullResolution[1]
    + '@' + options.tileOffset[0] + ',' + options.tileOffset[1]
  );
  const configSignature = getFlowConfigSignature(options.config);
  const sessionId = options.sessionId ?? 'default';
  const frameKey = getFlowFrameKey({ sessionId, phase, config: options.config, region: regionKey });
  const regionChanged = resources.lastRegionKey !== regionKey;
  const configChanged = resources.lastConfigSignature !== configSignature;
  const phaseRewound = phase + 0.000001 < resources.lastPhase;
  const phaseJumped = phase - resources.lastPhase > 0.1;
  const previousPhase = resources.lastPhase;
  const sessionChanged = resources.lastSessionId !== sessionId;
  const loopModeChanged = resources.lastLoopEnabled !== options.loopEnabled;
  const needsReset = !resources.hasTrail || configChanged || regionChanged || phaseRewound || phaseJumped || sessionChanged || loopModeChanged;
  if (needsReset) {
    resetFlowGradientResources(gl, resources);
  }

  const resetPhases = getFlowResetPhases({
    phase,
    previousPhase,
    loopEnabled: options.loopEnabled,
    reset: needsReset,
  });
  const incrementalSteps = !needsReset && phase > resources.lastPhase + 0.000001
    ? Math.max(1, Math.min(24, Math.ceil((phase - resources.lastPhase) * 24)))
    : 0;
  const steps = resetPhases.length || incrementalSteps;
  for (let step = 0; step < steps; step += 1) {
    const stepPhase = needsReset
      ? resetPhases[step]
      : resources.lastPhase + (phase - resources.lastPhase) * ((step + 1) / incrementalSteps);
    drawDensity(gl, resources, options.config, stepPhase, options.fullResolution, [0, 0]);
    drawTrail(gl, resources, options.config);
  }
  resources.lastConfigSignature = configSignature;
  resources.lastPhase = phase;
  resources.lastRegionKey = regionKey;
  resources.lastFrameKey = frameKey;
  resources.lastSessionId = sessionId;
  resources.lastLoopEnabled = options.loopEnabled;

  const trailTexture = resources.trailIndex === 0 ? resources.trailTextureA : resources.trailTextureB;
  const uniforms = resources.compositeUniforms;
  gl.bindFramebuffer(gl.FRAMEBUFFER, options.targetFramebuffer);
  gl.viewport(0, 0, viewportWidth, viewportHeight);
  gl.disable(gl.BLEND);
  gl.disable(gl.SCISSOR_TEST);
  gl.colorMask(true, true, true, true);
  gl.useProgram(resources.compositeProgram);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, options.sourceTexture);
  gl.uniform1i(getUniform(uniforms, 'u_sourceTex'), 0);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, trailTexture);
  gl.uniform1i(getUniform(uniforms, 'u_trailTex'), 1);
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, options.gradientRampTexture);
  gl.uniform1i(getUniform(uniforms, 'u_gradientRamp'), 2);
  gl.uniform2f(getUniform(uniforms, 'u_resolution'), viewportWidth, viewportHeight);
  gl.uniform2f(getUniform(uniforms, 'u_fullResolution'), fullWidth, fullHeight);
  gl.uniform2f(getUniform(uniforms, 'u_tileOffset'), options.tileOffset[0], options.tileOffset[1]);
  gl.uniform1f(getUniform(uniforms, 'u_contrast'), options.config.contrast);
  gl.uniform1f(getUniform(uniforms, 'u_flowOpacity'), options.config.flowOpacity);
  drawQuad(gl, resources);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return true;
}
