import { describe, expect, it } from 'vitest';
import { useGradientStore } from '../store/gradientStore';
import { KggControlRuntime } from './kggControlRuntime';

describe('KggControlRuntime', () => {
  const canvas = {
    width: 320,
    height: 180,
    toDataURL: () => 'data:image/png;base64,ZmFrZQ==',
  } as unknown as HTMLCanvasElement;

  const runtime = new KggControlRuntime({
    canvas,
    getWebGLContext: () => null,
  });

  it('sets registered parameters through Zustand normalization', () => {
    const before = runtime.getParameter('gradient.angle');
    expect(before.ok).toBe(true);
    const result = runtime.setParameter('gradient.angle', 725);
    expect(result).toMatchObject({ ok: true, value: { path: 'gradient.angle', value: 5 } });
  });

  it('rejects unknown paths and exposes preview metadata', () => {
    expect(runtime.setParameter('gradient.unknown', 1)).toMatchObject({ ok: false, error: { code: 'unknown_parameter' } });
    expect(runtime.capturePreview()).toMatchObject({
      ok: true,
      value: { mimeType: 'image/png', width: 320, height: 180 },
    });
  });

  it('sets gradient colors through the dedicated MCP-safe operation', () => {
    const captured = runtime.captureSnapshot();
    expect(captured.ok).toBe(true);
    if (!captured.ok) return;
    expect(runtime.setGradientColors(['#0066FF', '#00AA66'])).toMatchObject({
      ok: true,
      value: {
        colors: ['#0066FF', '#00AA66'],
        stops: [
          { position: 0, color: '#0066FF' },
          { position: 1, color: '#00AA66' },
        ],
      },
    });
    expect(runtime.setGradientColors(['blue', '#00AA66'])).toMatchObject({
      ok: false,
      error: { code: 'invalid_gradient_colors' },
    });
    runtime.restoreSnapshot(captured.value.snapshotId);
  });

  it('captures and restores serializable state', () => {
    const original = useGradientStore.getState().gradient.angle;
    const captured = runtime.captureSnapshot();
    expect(captured.ok).toBe(true);
    if (!captured.ok) return;
    runtime.setParameter('gradient.angle', 180);
    expect(runtime.restoreSnapshot(captured.value.snapshotId)).toEqual({
      ok: true,
      value: { snapshotId: captured.value.snapshotId },
    });
    expect(useGradientStore.getState().gradient.angle).toBe(original);
  });

  it('runs allowlisted scenarios with rollback on failure', async () => {
    const original = useGradientStore.getState().gradient.angle;
    const result = await runtime.runScenario([
      { type: 'setParameter', path: 'gradient.angle', value: 120 },
      { type: 'setParameter', path: 'gradient.notRegistered', value: 1 },
    ], true);
    expect(result).toMatchObject({ ok: false, error: { code: 'scenario_failed' } });
    expect(useGradientStore.getState().gradient.angle).toBe(original);
  });

  it('executes semantic ramp, mesh, and group controls through store setters', async () => {
    const result = await runtime.executeControl('set_gradient_stops', {
      stops: [
        { position: 0, color: '#0066ff' },
        { position: 1, color: '#00c853' },
      ],
    });
    expect(result).toMatchObject({ ok: true, value: { groups: { gradient: { stops: [{ color: '#0066FF' }, { color: '#00C853' }] } } } });
    expect(await runtime.executeControl('set_mesh_corner', { index: 0, position: [-0.25, 0.1] })).toMatchObject({ ok: true });
    expect(useGradientStore.getState().gradient.mesh?.corners[0]).toEqual([-0.25, 0.1]);
  });

  it('exposes the control registry and rejects unknown fields', async () => {
    const controls = runtime.listControls();
    expect(controls).toMatchObject({ ok: true, value: { groups: expect.any(Array), operations: expect.any(Array) } });
    expect(await runtime.executeControl('set_group', { group: 'gradient', patch: { notAUiField: true } })).toMatchObject({ ok: false, error: { code: 'unknown_control_field' } });
  });

  it('rejects malformed group values before calling resource-sensitive setters', async () => {
    expect(await runtime.executeControl('set_group', {
      group: 'gradient',
      patch: { angle: 'fast' },
    })).toMatchObject({ ok: false, error: { code: 'invalid_control_input' } });
    expect(await runtime.executeControl('set_group', {
      group: 'manualDistort',
      patch: { mapResolution: 10_000 },
    })).toMatchObject({ ok: false, error: { code: 'invalid_control_input' } });
  });

  it('requires an app-owned approval callback for destructive project operations', async () => {
    let deleted = false;
    const project = { deletePreset: () => { deleted = true; } };
    const guarded = new KggControlRuntime({ canvas, getWebGLContext: () => null, project });
    await expect(guarded.executeControl('delete_preset', { presetId: 'preset-1', confirm: true }))
      .resolves.toMatchObject({ ok: false, error: { code: 'approval_required' } });
    expect(deleted).toBe(false);

    const approved = new KggControlRuntime({
      canvas,
      getWebGLContext: () => null,
      ui: {
        getState: () => ({}),
        setState: () => undefined,
        requestApproval: () => true,
      },
      project,
    });
    await expect(approved.executeControl('delete_preset', { presetId: 'preset-1', confirm: true }))
      .resolves.toMatchObject({ ok: true, value: { deleted: true } });
    expect(deleted).toBe(true);
  });

  it('fails closed for non-serializable adapter results and oversized previews', async () => {
    const adapterRuntime = new KggControlRuntime({
      canvas,
      getWebGLContext: () => null,
      project: { listPresets: () => ({ callback: () => undefined }) },
    });
    await expect(adapterRuntime.executeControl('list_presets'))
      .resolves.toMatchObject({ ok: false, error: { code: 'non_serializable_result' } });
    const largeCanvas = { width: 5_000, height: 5_000, toDataURL: () => 'data:image/png;base64,ZmFrZQ==' } as unknown as HTMLCanvasElement;
    expect(new KggControlRuntime({ canvas: largeCanvas, getWebGLContext: () => null }).capturePreview())
      .toMatchObject({ ok: false, error: { code: 'preview_too_large' } });
  });
});
