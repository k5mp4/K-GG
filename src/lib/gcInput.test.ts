import { describe, expect, it } from 'vitest';
import {
  GC_STICK_REPEAT_DELAY_MS,
  GC_STICK_REPEAT_INTERVAL_MS,
  GcInputController,
  moveListCursor,
  type OscMessage,
} from './gcInput';
import { DEFAULT_CONTROLLER_SETTINGS, normalizeControllerSettings, type ControllerSettings } from './controllerSettings';

const msg = (address: string, value: number): OscMessage => ({ address, args: [value] });
const create = (settings: ControllerSettings = DEFAULT_CONTROLLER_SETTINGS) => new GcInputController(() => settings);

describe('GcInputController stick browsing', () => {
  it('emits one move when the stick is pushed past the threshold', () => {
    const controller = create();
    expect(controller.handleMessages([msg('/gc/1/stick/x', 0.3)], 0)).toEqual([]);
    expect(controller.handleMessages([msg('/gc/1/stick/x', 0.9)], 10)).toEqual([{ type: 'move', direction: 'right' }]);
    expect(controller.handleMessages([msg('/gc/1/stick/x', 1)], 20)).toEqual([]);
  });

  it('picks the dominant axis and treats +Y as up', () => {
    const commands = create().handleMessages([msg('/gc/1/stick/x', -0.4), msg('/gc/1/stick/y', 0.9)], 0);
    expect(commands).toEqual([{ type: 'move', direction: 'up' }]);
  });

  it('repeats while held and stops after release with hysteresis', () => {
    const controller = create();
    controller.handleMessages([msg('/gc/1/stick/y', -1)], 0);
    expect(controller.tick(GC_STICK_REPEAT_DELAY_MS - 1)).toEqual([]);
    expect(controller.tick(GC_STICK_REPEAT_DELAY_MS)).toEqual([{ type: 'move', direction: 'down' }]);
    expect(controller.tick(GC_STICK_REPEAT_DELAY_MS + GC_STICK_REPEAT_INTERVAL_MS - 1)).toEqual([]);
    expect(controller.tick(GC_STICK_REPEAT_DELAY_MS + GC_STICK_REPEAT_INTERVAL_MS)).toHaveLength(1);
    controller.handleMessages([msg('/gc/1/stick/y', -0.4)], 1000);
    expect(controller.tick(2000)).toHaveLength(1);
    controller.handleMessages([msg('/gc/1/stick/y', 0)], 2100);
    expect(controller.tick(5000)).toEqual([]);
  });

  it('browses with the C stick when configured', () => {
    const settings = normalizeControllerSettings({ browseStick: 'cstick', scrub: { source: null } });
    const controller = create(settings);
    expect(controller.handleMessages([msg('/gc/1/stick/x', 1)], 0)).toEqual([]);
    expect(controller.handleMessages([msg('/gc/1/cstick/x', -1)], 10)).toEqual([{ type: 'move', direction: 'left' }]);
  });

  it('drops the held direction when the controller disconnects', () => {
    const controller = create();
    controller.handleMessages([msg('/gc/1/stick/x', 1)], 0);
    controller.handleMessages([msg('/gc/1/connected', 0)], 10);
    expect(controller.tick(5000)).toEqual([]);
  });
});

describe('GcInputController buttons', () => {
  it('runs the bound action only on the press edge', () => {
    const controller = create();
    controller.handleMessages([msg('/gc/2/z', 0)], 0);
    expect(controller.handleMessages([msg('/gc/2/z', 1)], 10)).toEqual([{ type: 'action', action: 'presetConfirm' }]);
    expect(controller.handleMessages([msg('/gc/2/z', 1)], 20)).toEqual([]);
    expect(controller.handleMessages([msg('/gc/2/z', 0)], 30)).toEqual([]);
    expect(controller.handleMessages([msg('/gc/2/z', 1)], 40)).toHaveLength(1);
  });

  it('does not fire for a button that is already held when the first value arrives', () => {
    expect(create().handleMessages([msg('/gc/1/a', 1)], 0)).toEqual([]);
  });

  it('maps default buttons and ignores unassigned ones', () => {
    const controller = create();
    controller.handleMessages([msg('/gc/1/a', 0), msg('/gc/1/start', 0), msg('/gc/1/x', 0)], 0);
    const commands = controller.handleMessages([msg('/gc/1/a', 1), msg('/gc/1/start', 1), msg('/gc/1/x', 1)], 10);
    expect(commands).toEqual([
      { type: 'action', action: 'togglePlayback' },
      { type: 'action', action: 'toggleSpout' },
    ]);
  });

  it('follows a changed binding and an unassigned action', () => {
    const settings = normalizeControllerSettings({ buttons: { togglePlayback: 'x', resetTime: null } });
    const controller = create(settings);
    controller.handleMessages([msg('/gc/1/a', 0), msg('/gc/1/x', 0), msg('/gc/1/y', 0)], 0);
    expect(controller.handleMessages([msg('/gc/1/a', 1), msg('/gc/1/y', 1)], 10)).toEqual([]);
    expect(controller.handleMessages([msg('/gc/1/x', 1)], 20)).toEqual([{ type: 'action', action: 'togglePlayback' }]);
  });
});

describe('GcInputController analog parameters and scrub', () => {
  it('uses the first value as a baseline and then maps triggers 0..1', () => {
    const controller = create();
    expect(controller.handleMessages([msg('/gc/1/trigger/l', 0)], 0)).toEqual([]);
    expect(controller.handleMessages([msg('/gc/1/trigger/l', 0.5)], 10)).toEqual([
      { type: 'parameter', target: 'noise.amount', value: 0.5 },
    ]);
  });

  it('maps stick axes from -1..1 and keeps only the latest value per batch', () => {
    const settings = normalizeControllerSettings({ parameters: [{ source: 'cstick/y', target: 'noise.scale' }] });
    const controller = create(settings);
    controller.handleMessages([msg('/gc/1/cstick/y', 0)], 0);
    const commands = controller.handleMessages([msg('/gc/1/cstick/y', -1), msg('/gc/1/cstick/y', 1)], 10);
    expect(commands).toEqual([{ type: 'parameter', target: 'noise.scale', value: 1 }]);
  });

  it('scrubs proportionally to the squared tilt and caps long gaps', () => {
    const controller = create();
    controller.handleMessages([msg('/gc/1/cstick/x', 1)], 0);
    expect(controller.tick(1000)).toEqual([]); // 最初のtickは基準
    expect(controller.tick(1050)).toEqual([{ type: 'scrub', delta: 0.25 * 0.05 }]);
    expect(controller.tick(6000)).toEqual([{ type: 'scrub', delta: 0.25 * 0.1 }]);
    controller.handleMessages([msg('/gc/1/cstick/x', -0.5)], 6010);
    const [backward] = controller.tick(6060);
    expect(backward).toMatchObject({ type: 'scrub' });
    expect((backward as { delta: number }).delta).toBeLessThan(0);
  });

  it('ignores unrelated or malformed messages', () => {
    const commands = create().handleMessages([
      msg('/other/stick/x', 1),
      { address: '/gc/1/stick/x', args: [] },
      msg('/gc/1/stick/x', Number.NaN),
      msg('/gc/x/z', 1),
    ], 0);
    expect(commands).toEqual([]);
  });
});

describe('GcInputController BPM', () => {
  const enabled = normalizeControllerSettings({ bpm: { enabled: true, address: '/bpm' } });

  it('ignores BPM messages unless following is enabled', () => {
    expect(create().handleMessages([msg('/bpm', 128)], 0)).toEqual([]);
  });

  it('emits the latest valid BPM from a batch', () => {
    const controller = create(enabled);
    expect(controller.handleMessages([msg('/bpm', 120), msg('/bpm', 127.5)], 0)).toEqual([{ type: 'bpm', bpm: 127.5 }]);
  });

  it('ignores non-positive and non-finite BPM values', () => {
    const controller = create(enabled);
    expect(controller.handleMessages([msg('/bpm', 0), msg('/bpm', -3), msg('/bpm', Number.NaN)], 0)).toEqual([]);
    expect(controller.handleMessages([{ address: '/bpm', args: [] }], 0)).toEqual([]);
  });

  it('follows a custom address and leaves other addresses alone', () => {
    const controller = create(normalizeControllerSettings({ bpm: { enabled: true, address: '/clock/tempo' } }));
    expect(controller.handleMessages([msg('/bpm', 90), msg('/clock/tempo', 140)], 0)).toEqual([{ type: 'bpm', bpm: 140 }]);
  });

  it('maps the beat rate buttons by default', () => {
    const controller = create();
    controller.handleMessages([msg('/gc/1/dpad/up', 0), msg('/gc/1/dpad/down', 0)], 0);
    expect(controller.handleMessages([msg('/gc/1/dpad/up', 1)], 10)).toEqual([{ type: 'action', action: 'beatRateUp' }]);
    expect(controller.handleMessages([msg('/gc/1/dpad/down', 1)], 20)).toEqual([{ type: 'action', action: 'beatRateDown' }]);
  });
});

describe('normalizeControllerSettings', () => {
  it('falls back to defaults for missing or invalid values', () => {
    expect(normalizeControllerSettings(undefined)).toEqual(DEFAULT_CONTROLLER_SETTINGS);
    const settings = normalizeControllerSettings({
      enabled: 'yes',
      port: 80,
      browseStick: 'dpad',
      buttons: { togglePlayback: 'nope', resetTime: null },
      parameters: [{ source: 'trigger/l', target: 'bad' }, { source: 'trigger/r', target: 'noise.speed' }],
      scrub: { source: 'x', speed: 99 },
    });
    expect(settings.enabled).toBe(false);
    expect(settings.port).toBe(1024);
    expect(settings.browseStick).toBe('stick');
    expect(settings.buttons.togglePlayback).toBe('a');
    expect(settings.buttons.resetTime).toBeNull();
    expect(settings.parameters).toEqual([{ source: 'trigger/r', target: 'noise.speed' }]);
    expect(settings.scrub).toEqual({ source: 'cstick/x', speed: 2 });
  });

  it('keeps a valid BPM address and rejects unsafe ones', () => {
    expect(normalizeControllerSettings({ bpm: { enabled: true, address: '/tempo/main' } }).bpm).toEqual({ enabled: true, address: '/tempo/main' });
    for (const address of ['bpm', '/', '/a b', '/a*', '/a#b', '/'.padEnd(80, 'x'), 3]) {
      expect(normalizeControllerSettings({ bpm: { enabled: true, address } }).bpm.address).toBe('/bpm');
    }
  });
});

describe('moveListCursor', () => {
  it('moves within a two column grid without wrapping', () => {
    expect(moveListCursor(0, 'right', 5, 2)).toBe(1);
    expect(moveListCursor(1, 'right', 5, 2)).toBe(2);
    expect(moveListCursor(0, 'left', 5, 2)).toBe(0);
    expect(moveListCursor(0, 'down', 5, 2)).toBe(2);
    expect(moveListCursor(2, 'up', 5, 2)).toBe(0);
    expect(moveListCursor(0, 'up', 5, 2)).toBe(0);
  });

  it('pulls down to the last item when the final row is short', () => {
    expect(moveListCursor(3, 'down', 5, 2)).toBe(4);
    expect(moveListCursor(4, 'down', 5, 2)).toBe(4);
  });

  it('clamps an out-of-range start and handles empty lists', () => {
    expect(moveListCursor(-1, 'right', 3, 1)).toBe(1);
    expect(moveListCursor(9, 'left', 3, 1)).toBe(1);
    expect(moveListCursor(0, 'down', 0, 2)).toBe(-1);
  });
});
