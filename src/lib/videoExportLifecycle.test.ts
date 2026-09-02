import { describe, expect, it } from 'vitest';
import { completeVideoExport } from './videoExportLifecycle';

describe('completeVideoExport', () => {
  it('releases and completes the export without waiting for After Effects', async () => {
    const events: string[] = [];
    let resolveSend!: () => void;
    const sendPromise = new Promise<void>(resolve => { resolveSend = resolve; });

    const completion = completeVideoExport({
      save: async () => {
        events.push('saved');
        return true;
      },
      onSaved: () => events.push('marked-saved'),
      releaseExport: () => events.push('released'),
      sendToAe: async () => {
        events.push('ae-send-started');
        await sendPromise;
        events.push('ae-send-finished');
      },
    });

    await expect(completion).resolves.toBe(true);
    expect(events).toEqual(['saved', 'marked-saved', 'released', 'ae-send-started']);

    resolveSend();
    await sendPromise;
    await Promise.resolve();
    expect(events).toContain('ae-send-finished');
  });

  it('does not mark or send a video when saving is cancelled', async () => {
    let markedSaved = false;
    let releaseCount = 0;
    let sent = false;

    await expect(completeVideoExport({
      save: async () => false,
      onSaved: () => { markedSaved = true; },
      releaseExport: () => { releaseCount += 1; },
      sendToAe: async () => { sent = true; },
    })).resolves.toBe(false);

    expect(markedSaved).toBe(false);
    expect(releaseCount).toBe(1);
    expect(sent).toBe(false);
  });

  it('releases the export session when saving fails', async () => {
    const saveError = new Error('save failed');
    let markedSaved = false;
    let releaseCount = 0;
    let sent = false;

    await expect(completeVideoExport({
      save: async () => { throw saveError; },
      onSaved: () => { markedSaved = true; },
      releaseExport: () => { releaseCount += 1; },
      sendToAe: async () => { sent = true; },
    })).rejects.toBe(saveError);

    expect(markedSaved).toBe(false);
    expect(releaseCount).toBe(1);
    expect(sent).toBe(false);
  });

  it('contains a detached After Effects failure after releasing the export session', async () => {
    const aeError = new Error('AE failed');
    let releaseCount = 0;
    let receivedError: unknown;

    await expect(completeVideoExport({
      save: async () => true,
      onSaved: () => undefined,
      releaseExport: () => { releaseCount += 1; },
      sendToAe: async () => { throw aeError; },
      onSendError: error => { receivedError = error; },
    })).resolves.toBe(true);

    await Promise.resolve();

    expect(releaseCount).toBe(1);
    expect(receivedError).toBe(aeError);
  });
});
