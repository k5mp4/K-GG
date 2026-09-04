import { describe, expect, it } from 'vitest';
import {
  createSerialAsyncQueue,
  selectShaderCompileExtension,
  selectShaderCompileExtensionForSnapshot,
} from './webgl';
import webglSource from './webgl.ts?raw';

function functionSource(name: string): string {
  const start = webglSource.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Missing function: ${name}`);
  let parameterDepth = 0;
  let bodyStart = -1;
  for (let index = start; index < webglSource.length; index++) {
    if (webglSource[index] === '(') parameterDepth++;
    if (webglSource[index] === ')') parameterDepth--;
    if (parameterDepth === 0 && webglSource[index] === '{') {
      bodyStart = index;
      break;
    }
  }
  if (bodyStart < 0) throw new Error(`Missing body: ${name}`);
  let depth = 0;
  for (let index = bodyStart; index < webglSource.length; index++) {
    if (webglSource[index] === '{') depth++;
    if (webglSource[index] === '}') depth--;
    if (depth === 0) return webglSource.slice(start, index + 1);
  }
  throw new Error(`Unterminated function: ${name}`);
}

describe('WebGL lazy compile policy', () => {
  it('disables parallel linking only while validation is enabled', () => {
    const extension = { COMPLETION_STATUS_KHR: 0x91b1 };

    expect(selectShaderCompileExtension(extension, true)).toBeNull();
    expect(selectShaderCompileExtension(extension, false)).toBe(extension);
  });

  it('keeps parallel linking when validation is available but disabled', () => {
    const extension = { COMPLETION_STATUS_KHR: 0x91b1 };

    expect(selectShaderCompileExtensionForSnapshot(extension, {
      validationAvailable: true,
      validationEnabled: false,
    })).toBe(extension);
    expect(selectShaderCompileExtensionForSnapshot(extension, {
      validationAvailable: true,
      validationEnabled: true,
    })).toBeNull();
    expect(selectShaderCompileExtensionForSnapshot(extension, undefined)).toBe(extension);
  });

  it('serializes lazy shader compilation requests on one WebGL context', async () => {
    const queue = createSerialAsyncQueue();
    let active = 0;
    let maximumActive = 0;
    let releaseFirst: () => void = () => {
      throw new Error('first task did not start');
    };
    let firstStartedResolve: (() => void) | null = null;
    const firstStarted = new Promise<void>((resolve) => {
      firstStartedResolve = resolve;
    });

    const first = queue.enqueue(async () => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      firstStartedResolve?.();
      await new Promise<void>((resolve) => {
        releaseFirst = resolve;
      });
      active -= 1;
    });
    const second = queue.enqueue(async () => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      active -= 1;
    });

    await firstStarted;
    expect(active).toBe(1);
    expect(maximumActive).toBe(1);

    releaseFirst();
    await Promise.all([first, second]);
    expect(maximumActive).toBe(1);
  });

  it('routes lazy program requests through the context-local compile queue', () => {
    const source = functionSource('requestLazyProgram');

    expect(source).toContain('ctx.lazyProgramCompileQueue.enqueue');
  });

  it('falls back to synchronous status reads when parallel completion watchdog expires', () => {
    const source = functionSource('createProgramAsync');
    const completionCheck = source.indexOf('ext.COMPLETION_STATUS_KHR');
    const timeoutFallback = source.indexOf('Parallel shader compile completion watchdog expired');
    const compileStatus = source.indexOf('gl.COMPILE_STATUS');
    const linkStatus = source.indexOf('gl.LINK_STATUS');

    expect(source).not.toContain('frames > 600');
    expect(completionCheck).toBeGreaterThanOrEqual(0);
    expect(timeoutFallback).toBeGreaterThan(completionCheck);
    expect(compileStatus).toBeGreaterThan(timeoutFallback);
    expect(linkStatus).toBeGreaterThan(compileStatus);
    expect(source.slice(timeoutFallback - 100, timeoutFallback + 260)).toContain('resolve();');
    expect(source).not.toContain('gl.deleteProgram(program)');
  });

  it('keeps Glass compilation asynchronous without turning a slow driver into a permanent failure', () => {
    const compileSource = functionSource('compileLazyProgram');
    const asyncSource = functionSource('createProgramAsync');

    expect(compileSource).toContain("key === 'glass' || key === 'glassV2'");
    expect(compileSource).toContain('GLASS_PARALLEL_SHADER_COMPILE_TIMEOUT_MS');
    expect(asyncSource).toContain('Number.isFinite(compileTimeoutMs)');
  });

  it('does not chain the larger general fallback after a Glass timeout', () => {
    const source = functionSource('requestGlassProgram');
    const timeoutGuard = source.indexOf('if (glassState.timedOut) return false;');
    const fallbackRequest = source.indexOf("requestLazyProgram(ctx, 'postprocess')");

    expect(timeoutGuard).toBeGreaterThanOrEqual(0);
    expect(fallbackRequest).toBeGreaterThan(timeoutGuard);
  });

  it('queues the V2-backed Glass program without gating other ready stages', () => {
    const source = functionSource('render');

    expect(source).toContain("stackCoreReady && noiseStackReady && requestGlassProgram(ctx, 'glassV2')");
    expect(source).not.toContain("requestGlassProgram(ctx, 'glass')");
    const readinessGate = source.match(/if \(!stackCoreReady \|\|[^\n]+\) \{/)?.[0] ?? '';
    expect(readinessGate).not.toContain('glassReady');
    expect(readinessGate).not.toContain('glassV2Ready');
  });

  it('prepares required Glass programs before export starts', () => {
    const prepareSource = functionSource('prepareExportPrograms');
    const planSource = functionSource('getRequiredExportProgramKeys');

    expect(planSource).toContain("add('glassV2',");
    expect(prepareSource).toContain('for (const key of required) await waitForLazyProgram');
  });

  it('keeps ping-pong sources separate and rejects destination feedback', () => {
    const passSource = functionSource('drawPostprocessPass');

    expect(webglSource).toContain('sourceTexture === ctx.postprocessTextureA');
    expect(webglSource).toContain('fbo: ctx.postprocessFboB');
    expect(passSource).toContain('Postprocess pass cannot sample from its destination texture');
    expect(passSource).toContain('gl.disable(gl.BLEND)');
    expect(passSource).toContain('gl.disable(gl.SCISSOR_TEST)');
  });

  it('publishes a lazy program only after uniform reflection succeeds', () => {
    const source = functionSource('compileLazyProgram');
    const installSource = functionSource('installLazyProgram');

    expect(source).toContain('installLazyProgram(ctx, key, program)');
    expect(source).toContain('if (program) gl.deleteProgram(program)');
    expect(installSource).toContain('const uniforms = getPostprocessUniforms(gl, program)');
    expect(installSource).toContain('ctx.noiseStackProgram = program');
  });

  it('reflects only active postprocess uniforms and restores the previous program after a failed pass', () => {
    const uniformsSource = functionSource('getPostprocessUniforms');
    const passSource = functionSource('drawPostprocessPass');

    expect(uniformsSource).toContain('gl.getActiveUniform(program, index)');
    expect(uniformsSource).toContain("locations.u_resolution = location");
    expect(uniformsSource).not.toContain("gl.getUniformLocation(program, 'u_noiseStack')");
    expect(passSource).toContain('if (!selectedProgram || !selectedUniforms) return false;');
    expect(passSource).toContain('} finally {');
    expect(passSource).toContain('ctx.postprocessUniforms = previousUniforms;');
  });

  it('keeps Noise usable through the general postprocess fallback after a specialized compile failure', () => {
    const source = functionSource('requestNoiseStackProgram');
    const compileSource = functionSource('compileLazyProgram');

    expect(source).toContain("if (!noiseState.failed) return requestLazyProgram(ctx, 'noiseStack');");
    expect(source).toContain("const fallbackReady = requestLazyProgram(ctx, 'postprocess');");
    expect(source).toContain("state: 'fallback' as const");
    expect(compileSource).not.toContain("key === 'glass' || key === 'glassV2' || key === 'noiseStack'");
  });
});
