/**
 * Controller（OSC入力）の設定モデル。受信設定とコントローラー入力→操作のマッピングを持つ。
 * Presetには保存せず、アプリ設定としてlocalStorageへ保存する。
 */

export const CONTROLLER_BUTTONS = [
  'a', 'b', 'x', 'y', 'start', 'z', 'l', 'r',
  'dpad/left', 'dpad/right', 'dpad/up', 'dpad/down',
] as const;
export type ControllerButton = typeof CONTROLLER_BUTTONS[number];

export const CONTROLLER_AXES = [
  'stick/x', 'stick/y', 'cstick/x', 'cstick/y', 'trigger/l', 'trigger/r',
] as const;
export type ControllerAxis = typeof CONTROLLER_AXES[number];

/** ボタンで実行する操作。 */
export const CONTROLLER_BUTTON_ACTIONS = [
  'presetConfirm', 'togglePlayback', 'resetTime', 'folderPrev', 'folderNext', 'folderRoot', 'toggleSpout',
  'beatRateDown', 'beatRateUp',
] as const;
export type ControllerButtonAction = typeof CONTROLLER_BUTTON_ACTIONS[number];

/** 軸の値でパラメータを動かす対象。範囲はParameter Limitsの値を使う。 */
export const CONTROLLER_PARAMETER_TARGETS = [
  'noise.amount', 'noise.scale', 'noise.speed', 'diffuse.grain', 'postprocess.glassRefraction',
] as const;
export type ControllerParameterTarget = typeof CONTROLLER_PARAMETER_TARGETS[number];

export type ControllerParameterBinding = {
  source: ControllerAxis;
  target: ControllerParameterTarget;
};

export type ControllerSettings = {
  /** OSC受信を有効にする。既定は無効（ポートを開かない）。 */
  enabled: boolean;
  port: number;
  /** Presetを選ぶスティック。 */
  browseStick: 'stick' | 'cstick';
  buttons: Record<ControllerButtonAction, ControllerButton | null>;
  parameters: ControllerParameterBinding[];
  scrub: { source: ControllerAxis | null; /** 最大に倒した時の1秒あたりのループ割合 */ speed: number };
  /** OSCで届くBPMをLoop TimingのBeat Syncへ反映し、拍の先頭リセットで再生位置を先頭へ戻す。 */
  bpm: { enabled: boolean; address: string; resetAddress: string };
};

export const CONTROLLER_PORT_MIN = 1024;
export const CONTROLLER_PORT_MAX = 65535;
export const CONTROLLER_SCRUB_SPEED_MIN = 0.05;
export const CONTROLLER_SCRUB_SPEED_MAX = 2;
export const MAX_PARAMETER_BINDINGS = 8;

export const DEFAULT_CONTROLLER_SETTINGS: ControllerSettings = {
  enabled: false,
  port: 9000,
  browseStick: 'stick',
  buttons: {
    presetConfirm: 'z',
    togglePlayback: 'a',
    resetTime: 'y',
    folderPrev: 'dpad/left',
    folderNext: 'dpad/right',
    folderRoot: 'b',
    toggleSpout: 'start',
    beatRateDown: 'dpad/down',
    beatRateUp: 'dpad/up',
  },
  parameters: [
    { source: 'trigger/l', target: 'noise.amount' },
    { source: 'trigger/r', target: 'postprocess.glassRefraction' },
  ],
  scrub: { source: 'cstick/x', speed: 0.25 },
  bpm: { enabled: false, address: '/bpm', resetAddress: '/beat/reset' },
};

/** BPMと拍リセットを受け取るOSCアドレス。`/`で始まる印字可能なASCIIで、OSCの特殊文字を含まない。 */
const BPM_ADDRESS = /^\/[!-~]{1,63}$/;

export function isValidBpmAddress(address: string): boolean {
  return BPM_ADDRESS.test(address) && !/[#*,?[\]{}]/.test(address);
}

function oneOf<T extends string>(values: readonly T[], value: unknown): T | undefined {
  return values.find(candidate => candidate === value);
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

/** 保存値や外部から読んだ値を、安全な設定へ整える。 */
export function normalizeControllerSettings(input: unknown): ControllerSettings {
  const defaults = DEFAULT_CONTROLLER_SETTINGS;
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const rawButtons = (raw.buttons && typeof raw.buttons === 'object' ? raw.buttons : {}) as Record<string, unknown>;
  const buttons = { ...defaults.buttons };
  for (const action of CONTROLLER_BUTTON_ACTIONS) {
    if (!(action in rawButtons)) continue;
    // nullは「割り当てなし」。不正な値は既定へ戻す。
    buttons[action] = rawButtons[action] === null ? null : oneOf(CONTROLLER_BUTTONS, rawButtons[action]) ?? defaults.buttons[action];
  }
  const parameters = Array.isArray(raw.parameters)
    ? raw.parameters.flatMap((entry): ControllerParameterBinding[] => {
      const binding = (entry ?? {}) as Record<string, unknown>;
      const source = oneOf(CONTROLLER_AXES, binding.source);
      const target = oneOf(CONTROLLER_PARAMETER_TARGETS, binding.target);
      return source && target ? [{ source, target }] : [];
    }).slice(0, MAX_PARAMETER_BINDINGS)
    : defaults.parameters.map(binding => ({ ...binding }));
  const rawBpm = (raw.bpm && typeof raw.bpm === 'object' ? raw.bpm : {}) as Record<string, unknown>;
  const rawScrub = (raw.scrub && typeof raw.scrub === 'object' ? raw.scrub : {}) as Record<string, unknown>;
  return {
    enabled: raw.enabled === true,
    port: Math.round(clampNumber(raw.port, CONTROLLER_PORT_MIN, CONTROLLER_PORT_MAX, defaults.port)),
    browseStick: raw.browseStick === 'cstick' ? 'cstick' : 'stick',
    buttons,
    parameters,
    scrub: {
      source: 'source' in rawScrub
        ? rawScrub.source === null ? null : oneOf(CONTROLLER_AXES, rawScrub.source) ?? defaults.scrub.source
        : defaults.scrub.source,
      speed: clampNumber(rawScrub.speed, CONTROLLER_SCRUB_SPEED_MIN, CONTROLLER_SCRUB_SPEED_MAX, defaults.scrub.speed),
    },
    bpm: {
      enabled: rawBpm.enabled === true,
      address: typeof rawBpm.address === 'string' && isValidBpmAddress(rawBpm.address) ? rawBpm.address : defaults.bpm.address,
      resetAddress: typeof rawBpm.resetAddress === 'string' && isValidBpmAddress(rawBpm.resetAddress)
        ? rawBpm.resetAddress
        : defaults.bpm.resetAddress,
    },
  };
}

/** 軸の値を0..1へ正規化する。スティックは-1..1、トリガーは0..1で届く。 */
export function normalizeAxisValue(axis: ControllerAxis, value: number): number {
  const unit = axis.startsWith('trigger/') ? value : (value + 1) / 2;
  return Math.min(1, Math.max(0, unit));
}

const STORAGE_KEY = 'kgg_controller_settings';

type Listener = () => void;

let current: ControllerSettings | null = null;
const listeners = new Set<Listener>();

function load(): ControllerSettings {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) return normalizeControllerSettings(JSON.parse(saved));
  } catch { /* 保存値が読めなければ既定値を使う */ }
  return normalizeControllerSettings(undefined);
}

export function getControllerSettings(): ControllerSettings {
  current ??= load();
  return current;
}

export function subscribeControllerSettings(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function updateControllerSettings(patch: Partial<ControllerSettings>): void {
  current = normalizeControllerSettings({ ...getControllerSettings(), ...patch });
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current)); } catch { /* 保存できなくても現在の設定は使う */ }
  for (const listener of listeners) listener();
}
