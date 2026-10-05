import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HISTORY_DEBOUNCE_MS } from './constants';
import { canRedo, canUndo, recordHistoryCommand, redo, resetHistoryForTest, undo } from './history';
import { useGradientStore } from '../store/gradientStore';

const settle = async () => { await vi.advanceTimersByTimeAsync(0); };

describe('history commands', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useGradientStore.setState(useGradientStore.getInitialState(), true);
    resetHistoryForTest();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('undoes and redoes a recorded command', async () => {
    const calls: string[] = [];
    recordHistoryCommand({ undo: () => { calls.push('undo'); }, redo: () => { calls.push('redo'); } });
    expect(canUndo()).toBe(true);

    undo();
    await settle();
    expect(canRedo()).toBe(true);
    redo();
    await settle();

    expect(calls).toEqual(['undo', 'redo']);
    expect(canRedo()).toBe(false);
  });

  it('keeps commands and state edits in the order they happened', async () => {
    const calls: string[] = [];
    const initialDuration = useGradientStore.getState().animation.duration;
    useGradientStore.getState().setAnimation({ ...useGradientStore.getState().animation, duration: initialDuration + 3 });
    recordHistoryCommand({ undo: () => { calls.push('undo'); }, redo: () => { calls.push('redo'); } });

    undo();
    await settle();
    expect(calls).toEqual(['undo']);
    expect(useGradientStore.getState().animation.duration).toBe(initialDuration + 3);

    undo();
    expect(useGradientStore.getState().animation.duration).toBe(initialDuration);

    redo();
    expect(useGradientStore.getState().animation.duration).toBe(initialDuration + 3);
    redo();
    await settle();
    expect(calls).toEqual(['undo', 'redo']);
  });

  it('clears redo entries when a new command is recorded', async () => {
    recordHistoryCommand({ undo: () => undefined, redo: () => undefined });
    undo();
    await settle();
    expect(canRedo()).toBe(true);

    recordHistoryCommand({ undo: () => undefined, redo: () => undefined });
    expect(canRedo()).toBe(false);
  });

  it('runs asynchronous commands one at a time in the order they were requested', async () => {
    const calls: string[] = [];
    const slow = (label: string, ms: number) => () => new Promise<void>(resolve => {
      setTimeout(() => { calls.push(label); resolve(); }, ms);
    });
    recordHistoryCommand({ undo: slow('first', 50), redo: () => undefined });
    recordHistoryCommand({ undo: slow('second', 10), redo: () => undefined });

    undo();
    undo();
    await vi.advanceTimersByTimeAsync(HISTORY_DEBOUNCE_MS);

    expect(calls).toEqual(['second', 'first']);
  });
});
