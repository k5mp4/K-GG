import { describe, expect, it, vi } from 'vitest';
import type { GradientStore } from '../store/gradientStore';
import { bindApplicationCommands, createApplicationCommands } from './commands';

describe('application command boundary', () => {
  it('delegates document mutations through the injected store accessor', () => {
    const setGradient = vi.fn();
    const setEffectPipeline = vi.fn();
    const store = { setGradient, setEffectPipeline } as unknown as GradientStore;
    const commands = createApplicationCommands(() => store);
    const gradientPatch = { angle: 42 };
    const effectPatch = { effectStack: [] };

    commands.setGradient(gradientPatch);
    commands.setEffectPipeline(effectPatch);

    expect(setGradient).toHaveBeenCalledWith(gradientPatch);
    expect(setEffectPipeline).toHaveBeenCalledWith(effectPatch);
  });

  it('resolves the latest store state for every command invocation', () => {
    const first = vi.fn();
    const second = vi.fn();
    let store = { setCurrentTime: first } as unknown as GradientStore;
    const commands = createApplicationCommands(() => store);

    commands.setCurrentTime(0.25);
    store = { setCurrentTime: second } as unknown as GradientStore;
    commands.setCurrentTime(0.75);

    expect(first).toHaveBeenCalledWith(0.25);
    expect(second).toHaveBeenCalledWith(0.75);
  });

  it('binds stable action references for the default command bus', () => {
    const setCurrentTime = vi.fn();
    const store = { setCurrentTime } as unknown as GradientStore;
    const commands = bindApplicationCommands(store);

    commands.setCurrentTime(0.5);

    expect(commands.setCurrentTime).toBe(setCurrentTime);
    expect(setCurrentTime).toHaveBeenCalledWith(0.5);
  });
});
