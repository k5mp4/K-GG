import type { EffectStackKind } from '../../types/distortion';
import { isEffectStackKind, type EffectStackActions } from './effectStackView';

/** User actions a native Effect Stack window asks the main window to run. */
export type EffectStackIntent =
  | { type: 'select'; kind: EffectStackKind; solo: boolean }
  | { type: 'toggle'; kind: EffectStackKind; enabled: boolean }
  | { type: 'move'; kind: EffectStackKind; targetIndex: number }
  | { type: 'randomize' }
  | { type: 'prefetch'; kind: EffectStackKind };

const MAX_TARGET_INDEX = 64;

/** Validates an untrusted event payload; returns null for anything unexpected. */
export function parseEffectStackIntent(payload: unknown): EffectStackIntent | null {
  if (!payload || typeof payload !== 'object') return null;
  const intent = payload as Record<string, unknown>;
  switch (intent.type) {
    case 'randomize':
      return { type: 'randomize' };
    case 'select':
      return isEffectStackKind(intent.kind) && typeof intent.solo === 'boolean'
        ? { type: 'select', kind: intent.kind, solo: intent.solo }
        : null;
    case 'toggle':
      return isEffectStackKind(intent.kind) && typeof intent.enabled === 'boolean'
        ? { type: 'toggle', kind: intent.kind, enabled: intent.enabled }
        : null;
    case 'move':
      return isEffectStackKind(intent.kind)
        && Number.isInteger(intent.targetIndex)
        && (intent.targetIndex as number) >= 0
        && (intent.targetIndex as number) <= MAX_TARGET_INDEX
        ? { type: 'move', kind: intent.kind, targetIndex: intent.targetIndex as number }
        : null;
    case 'prefetch':
      return isEffectStackKind(intent.kind) ? { type: 'prefetch', kind: intent.kind } : null;
    default:
      return null;
  }
}

export function runEffectStackIntent(intent: EffectStackIntent, actions: EffectStackActions) {
  switch (intent.type) {
    case 'select': actions.select(intent.kind, intent.solo); break;
    case 'toggle': actions.toggle(intent.kind, intent.enabled); break;
    case 'move': actions.move(intent.kind, intent.targetIndex); break;
    case 'randomize': actions.randomize(); break;
    case 'prefetch': actions.prefetch(intent.kind); break;
  }
}

/** Actions of a native Effect Stack window: every action becomes an intent. */
export function createRemoteEffectStackActions(send: (intent: EffectStackIntent) => void): EffectStackActions {
  return {
    select: (kind, solo) => send({ type: 'select', kind, solo }),
    toggle: (kind, enabled) => send({ type: 'toggle', kind, enabled }),
    move: (kind, targetIndex) => send({ type: 'move', kind, targetIndex }),
    randomize: () => send({ type: 'randomize' }),
    prefetch: kind => send({ type: 'prefetch', kind }),
  };
}
