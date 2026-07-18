import { describe, expect, it } from 'vitest';
import webglSource from './webgl.ts?raw';

function functionSource(name: string): string {
  const start = webglSource.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Missing function: ${name}`);
  const bodyStart = webglSource.indexOf('{', start);
  let depth = 0;
  for (let index = bodyStart; index < webglSource.length; index++) {
    if (webglSource[index] === '{') depth++;
    if (webglSource[index] === '}') depth--;
    if (depth === 0) return webglSource.slice(start, index + 1);
  }
  throw new Error(`Unterminated function: ${name}`);
}

describe('WebGL lazy compile policy', () => {
  it('never advances to synchronous status reads before parallel completion', () => {
    const source = functionSource('createProgramAsync');
    const completionCheck = source.indexOf('ext.COMPLETION_STATUS_KHR');
    const timeoutReject = source.indexOf('Parallel shader compile timed out');
    const compileStatus = source.indexOf('gl.COMPILE_STATUS');
    const linkStatus = source.indexOf('gl.LINK_STATUS');

    expect(source).not.toContain('frames > 600');
    expect(completionCheck).toBeGreaterThanOrEqual(0);
    expect(timeoutReject).toBeGreaterThan(completionCheck);
    expect(compileStatus).toBeGreaterThan(timeoutReject);
    expect(linkStatus).toBeGreaterThan(compileStatus);
    expect(source.slice(timeoutReject - 80, timeoutReject + 120)).toContain('reject(');
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

  it('queues both Glass modes sequentially without gating other ready stages', () => {
    const source = functionSource('render');

    expect(source).toContain("stackCoreReady && noiseStackReady && requestGlassProgram(ctx, 'glass')");
    expect(source).toContain("stackCoreReady && noiseStackReady && glassCompileSettled && requestGlassProgram(ctx, 'glassV2')");
    const readinessGate = source.match(/if \(!stackCoreReady \|\|[^\n]+\) \{/)?.[0] ?? '';
    expect(readinessGate).not.toContain('glassReady');
    expect(readinessGate).not.toContain('glassV2Ready');
  });
});
