import { describe, expect, it, vi } from 'vitest';
import { VjWindowController, type VjWindowHost } from './vjWindow';

function host(overrides: Partial<VjWindowHost> = {}): VjWindowHost {
  return {
    readSize: vi.fn(async () => ({ width: 1440, height: 960 })),
    isMaximized: vi.fn(async () => false), unmaximize: vi.fn(async () => {}), maximize: vi.fn(async () => {}),
    setMinSize: vi.fn(async () => {}), setSize: vi.fn(async () => {}), ...overrides,
  };
}

describe('VJ native window size', () => {
  it('leaves the default window alone and restores its size after a compact performance', async () => {
    const window = host();
    const controller = new VjWindowController(window);
    await controller.setMode(false);
    expect(window.setSize).not.toHaveBeenCalled();
    await controller.setMode(true);
    expect(window.setMinSize).toHaveBeenCalledWith({ width: 640, height: 270 });
    expect(window.setSize).toHaveBeenLastCalledWith({ width: 1440, height: 270 });
    await controller.setMode(false);
    expect(window.setMinSize).toHaveBeenLastCalledWith({ width: 640, height: 480 });
    expect(window.setSize).toHaveBeenLastCalledWith({ width: 1440, height: 960 });
  });

  it('serializes a quick toggle and restores maximization', async () => {
    const window = host({ isMaximized: vi.fn(async () => true) });
    const controller = new VjWindowController(window);
    await Promise.all([controller.setMode(true), controller.setMode(false)]);
    expect(window.unmaximize).toHaveBeenCalledOnce();
    expect(window.maximize).toHaveBeenCalledOnce();
    expect(window.setSize).toHaveBeenLastCalledWith({ width: 1440, height: 960 });
  });

  it('restores the editor constraints when resizing fails and permits a retry', async () => {
    const window = host({ setSize: vi.fn().mockRejectedValueOnce(new Error('resize failed')).mockResolvedValue(undefined) });
    const controller = new VjWindowController(window);
    await expect(controller.setMode(true)).rejects.toThrow('resize failed');
    expect(window.setMinSize).toHaveBeenLastCalledWith({ width: 640, height: 480 });
    await controller.setMode(true);
    expect(window.setSize).toHaveBeenLastCalledWith({ width: 1440, height: 270 });
  });
});
