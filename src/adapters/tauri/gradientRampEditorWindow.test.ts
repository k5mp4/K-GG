import { describe, expect, it, vi } from 'vitest';
import { create } from 'zustand';
import {
  createSyncChannel,
  pickChangedSyncSlice,
  sanitizeSyncPatch,
  type GradientRampSyncMessage,
} from './gradientRampEditorWindow';
import type { GradientStore } from '../../store/gradientStore';

type TestState = Pick<GradientStore, 'gradient' | 'keyframeTracks' | 'selectedStops' | 'selectedGradientAnchors' | 'currentTime'> & {
  presetName: string;
};

function createTestStore() {
  return create<TestState>(() => ({
    gradient: { stops: [] } as unknown as GradientStore['gradient'],
    keyframeTracks: {},
    selectedStops: [],
    selectedGradientAnchors: [],
    currentTime: 0,
    presetName: 'a',
  }));
}

type SyncStoreArg = Parameters<typeof createSyncChannel>[0];

describe('gradient ramp editor window sync', () => {
  it('picks only synced keys whose references changed', () => {
    const prev = { gradient: {}, selectedStops: [], currentTime: 0, presetName: 'a' } as unknown as GradientStore;
    const next = { ...prev, selectedStops: [1], presetName: 'b' } as unknown as GradientStore;
    expect(pickChangedSyncSlice(next, prev)).toEqual({ selectedStops: [1] });
    expect(pickChangedSyncSlice(prev, prev)).toBeNull();
  });

  it('drops unknown keys and non-object payloads', () => {
    expect(sanitizeSyncPatch({ selectedStops: [2], presetName: 'x' })).toEqual({ selectedStops: [2] });
    expect(sanitizeSyncPatch({ presetName: 'x' })).toBeNull();
    expect(sanitizeSyncPatch('nope')).toBeNull();
    expect(sanitizeSyncPatch(null)).toBeNull();
  });

  function createChannel(options: Parameters<typeof createSyncChannel>[2] = {}) {
    const store = createTestStore();
    const sent: GradientRampSyncMessage[] = [];
    const acks: number[] = [];
    const channel = createSyncChannel(
      store as unknown as SyncStoreArg,
      { send: message => sent.push(message), ack: seq => acks.push(seq) },
      { afterApply: callback => callback(), ...options },
    );
    return { store, sent, acks, channel };
  }

  it('forwards local changes and applies remote patches without echoing them', () => {
    const { store, sent, acks, channel } = createChannel();

    store.setState({ selectedStops: [0] });
    expect(sent).toEqual([{ seq: 1, patch: { selectedStops: [0] } }]);
    channel.handleAck(1);

    channel.applyRemote({ seq: 7, patch: { currentTime: 1.5 } });
    expect(store.getState().currentTime).toBe(1.5);
    expect(acks).toEqual([7]);
    expect(sent).toHaveLength(1);

    store.setState({ presetName: 'b' });
    expect(sent).toHaveLength(1);

    channel.dispose();
    store.setState({ selectedStops: [1] });
    expect(sent).toHaveLength(1);
  });

  it('keeps one message in flight and merges newer changes until acked', () => {
    const { store, sent, channel } = createChannel();

    store.setState({ currentTime: 1 });
    store.setState({ currentTime: 2 });
    store.setState({ selectedStops: [3] });
    store.setState({ currentTime: 3 });
    expect(sent).toEqual([{ seq: 1, patch: { currentTime: 1 } }]);

    channel.handleAck(99);
    expect(sent).toHaveLength(1);

    channel.handleAck(1);
    expect(sent).toEqual([
      { seq: 1, patch: { currentTime: 1 } },
      { seq: 2, patch: { currentTime: 3, selectedStops: [3] } },
    ]);
  });

  it('resends unacknowledged values after the ack timeout', () => {
    vi.useFakeTimers();
    try {
      const { store, sent } = createChannel({ ackTimeoutMs: 50 });
      store.setState({ selectedStops: [1] });
      store.setState({ currentTime: 4 });
      vi.advanceTimersByTime(50);
      expect(sent[1]).toEqual({ seq: 2, patch: { selectedStops: [1], currentTime: 4 } });
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not send while the peer is unavailable', () => {
    let open = false;
    const { store, sent, channel } = createChannel({ canSend: () => open });

    store.setState({ currentTime: 1 });
    expect(sent).toHaveLength(0);
    open = true;
    store.setState({ currentTime: 2 });
    expect(sent).toEqual([{ seq: 1, patch: { currentTime: 2 } }]);

    channel.reset();
    channel.sendSnapshot({ selectedStops: [0] });
    expect(sent[1]).toEqual({ seq: 2, patch: { selectedStops: [0] } });
  });

  it('ignores malformed remote messages', () => {
    const { store, acks, channel } = createChannel();
    channel.applyRemote({ selectedStops: [9] });
    channel.applyRemote('nope');
    expect(store.getState().selectedStops).toEqual([]);
    expect(acks).toEqual([]);
  });
});
