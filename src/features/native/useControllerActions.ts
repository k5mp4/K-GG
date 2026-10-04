import { useEffect, useRef } from 'react';
import { applicationCommands } from '../../application/commands';
import { stepBeatSyncRate } from '../../lib/animationConfig';
import type { AnimationConfig } from '../../types/animation';
import type { ControllerParameterTarget } from '../../lib/controllerSettings';
import type { GcCommand } from '../../lib/gcInput';
import { getParameterLimit, type ParameterLimitKey } from '../../lib/parameterLimits';
import { renderBridge } from '../../lib/renderBridge';
import { useGradientStore } from '../../store/gradientStore';
import { useGcInput } from './useGcInput';
import { getSpoutOutputController } from './useSpoutOutput';

/** 軸で動かせるパラメータ。UIの表示名と、値の反映先を対応づける。 */
export const CONTROLLER_PARAMETER_INFO: Record<ControllerParameterTarget, {
  label: string;
  limitKey: ParameterLimitKey;
  apply: (value: number) => void;
}> = {
  'noise.amount': { label: 'Noise / Amount', limitKey: 'noise.amount', apply: amount => applicationCommands.setNoiseDistortion({ amount }) },
  'noise.scale': { label: 'Noise / Scale', limitKey: 'noise.scale', apply: scale => applicationCommands.setNoiseDistortion({ scale }) },
  'noise.speed': { label: 'Noise / Speed', limitKey: 'noise.speed', apply: speed => applicationCommands.setNoiseDistortion({ speed }) },
  'diffuse.grain': { label: 'Diffuse / Grain', limitKey: 'diffuse.grain', apply: grain => applicationCommands.setDiffuse({ grain }) },
  'postprocess.glassRefraction': { label: 'Glass / Refraction', limitKey: 'postprocess.glassRefraction', apply: glassRefraction => applicationCommands.setPostprocess({ glassRefraction }) },
};

/** 0..1の値を、パラメータの許容範囲へ割り当てる。 */
export function controllerParameterValue(target: ControllerParameterTarget, unit: number): number {
  const { min, max } = getParameterLimit(CONTROLLER_PARAMETER_INFO[target].limitKey);
  return min + (max - min) * Math.min(1, Math.max(0, unit));
}

type BeatSyncPatch = Partial<NonNullable<AnimationConfig['easing']['beatSync']>>;

/** Loop TimingのBeat Syncを部分的に更新する。Beat Syncがオンなら、ループ長はstoreが再計算する。 */
function updateBeatSync(patch: (current: NonNullable<AnimationConfig['easing']['beatSync']>) => BeatSyncPatch) {
  const { easing } = useGradientStore.getState().animation;
  const current = easing.beatSync ?? { enabled: false, bpm: 120, beatsPerBar: 4, subdivision: 4 as const };
  applicationCommands.setAnimation({ easing: { ...easing, beatSync: { ...current, ...patch(current) } } });
}

/** OSCで届くBPMを、Beat Syncの許容範囲（1〜999）へ収め、0.1刻みへ丸める。 */
export function normalizeOscBpm(bpm: number): number {
  return Math.min(999, Math.max(1, Math.round(bpm * 10) / 10));
}

function scrubTime(delta: number) {
  const loop = useGradientStore.getState().animation.previewLoop ?? true;
  const next = renderBridge.getCurrentNormalizedTime() + delta;
  renderBridge.seekTo(loop ? ((next % 1) + 1) % 1 : next);
}

/** 連続入力の反映間隔。ストア更新は全パネルの再描画を伴うため、入力頻度のまま反映しない。 */
export const CONTROLLER_APPLY_INTERVAL_MS = 33;

/** パラメータの値を、スライダーと同じ刻み幅へ丸める。 */
function quantizeParameter(target: ControllerParameterTarget, value: number): number {
  const { min, max, step } = getParameterLimit(CONTROLLER_PARAMETER_INFO[target].limitKey);
  const snapped = min + Math.round((value - min) / step) * step;
  return Math.min(max, Math.max(min, Number(snapped.toFixed(6))));
}

type SchedulerDeps = {
  now: () => number;
  schedule: (callback: () => void) => number;
  cancel: (handle: number) => void;
  applyParameter: (target: ControllerParameterTarget, value: number) => void;
  applyScrub: (delta: number) => void;
  applyBpm: (bpm: number) => void;
};

/**
 * パラメータとスクラブの連続入力をまとめ、一定間隔で最新値だけを反映する。
 * 同じ値の再設定は行わない。
 */
export class ControllerApplyScheduler {
  private readonly parameters = new Map<ControllerParameterTarget, number>();
  private readonly applied = new Map<ControllerParameterTarget, number>();
  private scrubDelta = 0;
  private bpm: number | null = null;
  private lastFlushAt = Number.NEGATIVE_INFINITY;
  private frame: number | null = null;

  private readonly deps: SchedulerDeps;

  constructor(deps: Partial<SchedulerDeps> = {}) {
    this.deps = {
      now: () => performance.now(),
      schedule: callback => requestAnimationFrame(callback),
      cancel: handle => cancelAnimationFrame(handle),
      applyParameter: (target, value) => CONTROLLER_PARAMETER_INFO[target].apply(value),
      applyScrub: scrubTime,
      // 手動で入力したBPMと同じ値が届いても、不要なstore更新をしない。
      applyBpm: bpm => {
        if (useGradientStore.getState().animation.easing.beatSync?.bpm !== bpm) updateBeatSync(() => ({ bpm }));
      },
      ...deps,
    };
  }

  setParameter(target: ControllerParameterTarget, unit: number): void {
    this.parameters.set(target, quantizeParameter(target, controllerParameterValue(target, unit)));
    this.request();
  }

  setBpm(bpm: number): void {
    this.bpm = normalizeOscBpm(bpm);
    this.request();
  }

  scrub(delta: number): void {
    this.scrubDelta += delta;
    this.request();
  }

  dispose(): void {
    if (this.frame !== null) this.deps.cancel(this.frame);
    this.frame = null;
    this.parameters.clear();
    this.scrubDelta = 0;
    this.bpm = null;
  }

  private request(): void {
    if (this.frame === null) this.frame = this.deps.schedule(this.flush);
  }

  private readonly flush = (): void => {
    this.frame = null;
    // 間隔に満たない間は次のフレームへ持ち越し、入力を捨てずに最新値へまとめる。
    if (this.deps.now() - this.lastFlushAt < CONTROLLER_APPLY_INTERVAL_MS) {
      this.request();
      return;
    }
    this.lastFlushAt = this.deps.now();
    for (const [target, value] of this.parameters) {
      if (this.applied.get(target) === value) continue;
      this.applied.set(target, value);
      this.deps.applyParameter(target, value);
    }
    this.parameters.clear();
    if (this.bpm !== null) this.deps.applyBpm(this.bpm);
    this.bpm = null;
    if (this.scrubDelta !== 0) {
      const delta = this.scrubDelta;
      this.scrubDelta = 0;
      this.deps.applyScrub(delta);
    }
  };
}

/**
 * Presetの選択以外のコントローラー操作（再生、時間、出力、パラメータ）を実行する。
 * PresetやフォルダーのコマンドはPresetPanelが扱うため、ここでは無視する。
 */
export function useControllerActions(): void {
  const schedulerRef = useRef<ControllerApplyScheduler | null>(null);
  useEffect(() => {
    schedulerRef.current = new ControllerApplyScheduler();
    return () => {
      schedulerRef.current?.dispose();
      schedulerRef.current = null;
    };
  }, []);

  useGcInput((command: GcCommand) => {
    switch (command.type) {
      case 'action':
        if (command.action === 'togglePlayback') renderBridge.togglePause();
        else if (command.action === 'resetTime') renderBridge.seekTo(0);
        else if (command.action === 'toggleSpout') {
          const output = getSpoutOutputController();
          void output.setEnabled(!output.getState().enabled);
        } else if (command.action === 'beatRateDown' || command.action === 'beatRateUp') {
          const direction = command.action === 'beatRateUp' ? 1 : -1;
          updateBeatSync(current => ({ rate: stepBeatSyncRate(current.rate, direction) }));
        }
        break;
      case 'parameter':
        schedulerRef.current?.setParameter(command.target, command.value);
        break;
      case 'scrub':
        schedulerRef.current?.scrub(command.delta);
        break;
      case 'bpm':
        schedulerRef.current?.setBpm(command.bpm);
        break;
      case 'move':
        break;
    }
  });
}
