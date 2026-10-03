/**
 * GameCubeコントローラーのOSC入力（kg_GCcontrollerが送る`/gc/{port}/...`）を、
 * 設定（Controller）のマッピングに従ってアプリ操作のコマンドへ変換する。
 * Tauri/Reactには依存しない。
 */

import {
  CONTROLLER_BUTTONS,
  CONTROLLER_BUTTON_ACTIONS,
  normalizeAxisValue,
  type ControllerButton,
  type ControllerButtonAction,
  type ControllerParameterTarget,
  type ControllerSettings,
} from './controllerSettings';

export type OscMessage = { address: string; args: number[] };

export type GcDirection = 'left' | 'right' | 'up' | 'down';

export type GcCommand =
  | { type: 'move'; direction: GcDirection }
  | { type: 'action'; action: ControllerButtonAction }
  /** `value`は0..1に正規化した軸の値。 */
  | { type: 'parameter'; target: ControllerParameterTarget; value: number }
  /** 再生位置（ループ割合）を動かす量。 */
  | { type: 'scrub'; delta: number };

/** スティックをこの値以上倒すと入力、この値未満へ戻すと解除する（ヒステリシス）。 */
export const GC_STICK_PRESS_THRESHOLD = 0.6;
export const GC_STICK_RELEASE_THRESHOLD = 0.3;
/** 倒し続けた時の1回目のリピートまでと、その後のリピート間隔。 */
export const GC_STICK_REPEAT_DELAY_MS = 400;
export const GC_STICK_REPEAT_INTERVAL_MS = 160;
/** tick間隔が空いた時（タブの停止など）にスクラブが飛ばないよう上限を設ける。 */
const MAX_SCRUB_DT_MS = 100;

const GC_ADDRESS = /^\/gc\/(\d+)\/(.+)$/;

type PortState = {
  /** 受け取った最新値。 */
  values: Map<string, number>;
  /** ボタンの押下状態。最初の値は基準として扱い、操作にしない。 */
  pressed: Map<string, boolean>;
  held: GcDirection | null;
  nextRepeatAt: number;
  lastTickAt: number | null;
};

function createPortState(): PortState {
  return { values: new Map(), pressed: new Map(), held: null, nextRepeatAt: 0, lastTickAt: null };
}

function isButton(name: string): name is ControllerButton {
  return (CONTROLLER_BUTTONS as readonly string[]).includes(name);
}

/** 縦横の大きい方の軸を方向にする。スティックは上が+Yで届く。 */
function directionOf(x: number, y: number): GcDirection {
  if (Math.abs(x) >= Math.abs(y)) return x < 0 ? 'left' : 'right';
  return y > 0 ? 'up' : 'down';
}

/** コントローラーごとの状態を持ち、受信と時間経過からコマンドを作る。設定は呼び出しごとに読む。 */
export class GcInputController {
  private readonly ports = new Map<number, PortState>();

  private readonly getSettings: () => ControllerSettings;

  constructor(getSettings: () => ControllerSettings) {
    this.getSettings = getSettings;
  }

  handleMessages(messages: readonly OscMessage[], now: number): GcCommand[] {
    const settings = this.getSettings();
    const commands: GcCommand[] = [];
    const parameterValues = new Map<ControllerParameterTarget, number>();
    const stickTouched = new Set<number>();
    for (const message of messages) {
      const match = GC_ADDRESS.exec(message.address);
      const value = message.args[0];
      if (!match || typeof value !== 'number' || !Number.isFinite(value)) continue;
      const port = Number(match[1]);
      const name = match[2];
      if (name === 'connected') {
        if (value < 0.5) this.ports.delete(port);
        continue;
      }
      const state = this.ports.get(port) ?? createPortState();
      this.ports.set(port, state);
      const isFirst = !state.values.has(name);
      state.values.set(name, value);

      if (isButton(name)) {
        const pressed = value >= 0.5;
        const wasPressed = state.pressed.get(name) ?? pressed;
        state.pressed.set(name, pressed);
        if (pressed && !wasPressed) {
          for (const action of CONTROLLER_BUTTON_ACTIONS) {
            if (settings.buttons[action] === name) commands.push({ type: 'action', action });
          }
        }
        continue;
      }

      if (name === `${settings.browseStick}/x` || name === `${settings.browseStick}/y`) stickTouched.add(port);
      if (isFirst) continue; // 接続時に届く初期値は基準にするだけで、パラメータは動かさない。
      for (const binding of settings.parameters) {
        if (binding.source === name) parameterValues.set(binding.target, normalizeAxisValue(binding.source, value));
      }
    }
    for (const [target, value] of parameterValues) commands.push({ type: 'parameter', target, value });
    for (const port of stickTouched) {
      const state = this.ports.get(port);
      if (state) this.updateStick(state, settings.browseStick, now, commands);
    }
    return commands;
  }

  /** スティックを倒したままの間のリピートと、スクラブを返す。受信が止まっていても定期的に呼ぶ。 */
  tick(now: number): GcCommand[] {
    const { scrub } = this.getSettings();
    const commands: GcCommand[] = [];
    for (const state of this.ports.values()) {
      if (state.held && now >= state.nextRepeatAt) {
        commands.push({ type: 'move', direction: state.held });
        state.nextRepeatAt = now + GC_STICK_REPEAT_INTERVAL_MS;
      }
      const dt = state.lastTickAt === null ? 0 : Math.min(now - state.lastTickAt, MAX_SCRUB_DT_MS);
      state.lastTickAt = now;
      const value = scrub.source ? state.values.get(scrub.source) ?? 0 : 0;
      if (dt > 0 && value !== 0) {
        // 小さく倒した時に細かく動かせるよう、倒し量を2乗して使う。
        const delta = Math.sign(value) * value * value * scrub.speed * (dt / 1000);
        commands.push({ type: 'scrub', delta });
      }
    }
    return commands;
  }

  /** 接続中のコントローラーのポート番号。 */
  connectedPorts(): number[] {
    return [...this.ports.keys()].sort((a, b) => a - b);
  }

  private updateStick(state: PortState, stick: 'stick' | 'cstick', now: number, commands: GcCommand[]): void {
    const x = state.values.get(`${stick}/x`) ?? 0;
    const y = state.values.get(`${stick}/y`) ?? 0;
    const magnitude = Math.hypot(x, y);
    if (state.held) {
      if (magnitude < GC_STICK_RELEASE_THRESHOLD) state.held = null;
      return;
    }
    if (magnitude < GC_STICK_PRESS_THRESHOLD) return;
    state.held = directionOf(x, y);
    state.nextRepeatAt = now + GC_STICK_REPEAT_DELAY_MS;
    commands.push({ type: 'move', direction: state.held });
  }
}

/**
 * 一覧上のカーソルを動かす。端では止まり、折り返さない。
 * 列数が1（リスト表示）の時は左右も前後への移動として扱う。
 */
export function moveListCursor(index: number, direction: GcDirection, count: number, columns: number): number {
  if (count <= 0) return -1;
  const current = Math.min(Math.max(index, 0), count - 1);
  switch (direction) {
    case 'left': return Math.max(current - 1, 0);
    case 'right': return Math.min(current + 1, count - 1);
    case 'up': return current - columns >= 0 ? current - columns : current;
    case 'down': {
      const next = current + columns;
      if (next < count) return next;
      // 最終行が欠けている時は、下の行がある列から最後の項目へ寄せる。
      return Math.floor(current / columns) < Math.floor((count - 1) / columns) ? count - 1 : current;
    }
  }
}
