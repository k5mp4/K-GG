import { commitPreparedPresetToDocument, preparePresetToDocument, resolvePreparedPresetPatch, type PreparedPreset } from '../../lib/applyPreset';
import { collectSceneWarmupTargets } from '../../lib/presetShaderWarmup';
import { useGradientStore } from '../../store/gradientStore';
import { areShaderWarmupTargetsReady, createShaderWarmupRetention, defaultIdleScheduler,
  getShaderWarmupContext, getShaderWarmupSnapshot, prepareShaderWarmupTargets, type IdleScheduler, type ShaderWarmupHost, type ShaderWarmupTarget } from '../../lib/shaderWarmup';
import type { Preset } from '../../lib/presetModel';

type PresetPreparer = (preset: Preset) => PreparedPreset;
type Entry = { preset: Preset; prepare: PresetPreparer; document?: PreparedPreset; targets: ShaderWarmupTarget[];
  context: ShaderWarmupHost | null; error?: 'prepare' | 'apply' };
export type VjPreparation = { ready: number; total: number; error: 'prepare' | 'apply' | null };

/** Prepares the complete set between frames; the performance path only commits ready documents. */
export class VjPresetCache {
  private entries = new Map<string, Entry>();
  private listeners = new Set<() => void>();
  private version = 0;
  private cancelIdle: (() => void) | null = null;
  private retention = createShaderWarmupRetention();
  private snapshot: VjPreparation = { ready: 0, total: 0, error: null };
  private readonly schedule: IdleScheduler;
  constructor(schedule: IdleScheduler = defaultIdleScheduler) { this.schedule = schedule; }

  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getSnapshot = () => this.snapshot;
  getPrepared = (id: string) => this.entries.get(id)?.document;
  isReady = (id: string) => {
    const entry = this.entries.get(id);
    return !!entry?.document && !entry.error && areShaderWarmupTargetsReady(entry.targets, entry.context);
  };
  private publish() {
    const next = { total: this.entries.size, ready: [...this.entries.keys()].filter(this.isReady).length,
      error: [...this.entries.values()].find(entry => entry.error)?.error ?? null };
    if (next.total === this.snapshot.total && next.ready === this.snapshot.ready && next.error === this.snapshot.error) return;
    this.snapshot = next;
    for (const listener of this.listeners) listener();
  }
  private idle() {
    return new Promise<void>(resolve => {
      const cancel = this.schedule(() => { this.cancelIdle = null; resolve(); });
      this.cancelIdle = () => { cancel(); resolve(); };
    });
  }
  private targetsFor(patch: PreparedPreset['patch']): ShaderWarmupTarget[] {
    const state = { ...useGradientStore.getState(), ...patch };
    return getShaderWarmupContext()?.getTargetsForDocument?.(state)
      ?? collectSceneWarmupTargets({ ...state, width: 1, height: 1, animDirection: 0 }, true);
  }
  async sync(presets: readonly Preset[], prepare: PresetPreparer = preparePresetToDocument) {
    const version = ++this.version;
    this.cancelIdle?.();
    this.cancelIdle = null;
    this.entries = new Map(presets.map(preset => {
      const previous = this.entries.get(preset.id);
      return [preset.id, previous?.preset === preset && previous.prepare === prepare ? previous : { preset, prepare, targets: [], context: null }];
    }));
    this.retention.update([...this.entries.values()].flatMap(entry => entry.targets));
    this.publish();
    const context = getShaderWarmupContext();
    if (!context) {
      if (getShaderWarmupSnapshot().status === 'unavailable') {
        for (const entry of this.entries.values()) entry.error = 'prepare';
        this.publish();
      }
      return;
    }
    const current = () => version === this.version && context === getShaderWarmupContext();
    for (const entry of this.entries.values()) {
      if (entry.document) {
        entry.targets = this.targetsFor(resolvePreparedPresetPatch(entry.document));
        continue;
      }
      await this.idle();
      if (!current()) return;
      try {
        entry.document = entry.prepare(entry.preset);
        entry.targets = this.targetsFor(resolvePreparedPresetPatch(entry.document));
        entry.error = undefined;
      } catch { entry.error = 'apply'; }
    }
    if (!current()) return;
    this.retention.update([...this.entries.values()].flatMap(entry => entry.targets));
    this.publish();
    for (const entry of this.entries.values()) {
      if (!entry.document || this.isReady(entry.preset.id)) continue;
      await this.idle();
      if (!current()) return;
      try {
        const ready = await prepareShaderWarmupTargets(entry.targets);
        if (!current()) return;
        entry.context = ready ? context : null;
        entry.error = ready ? undefined : 'prepare';
      } catch { if (current()) entry.error = 'prepare'; }
      if (!current()) return;
      this.publish();
    }
  }
  apply(id: string): boolean {
    if (!this.isReady(id)) return false;
    const entry = this.entries.get(id)!;
    // A legacy cue may inherit a newly edited live mode or a session-only external input.
    // Keep the current frame until that effective render plan is prepared as well.
    const patch = resolvePreparedPresetPatch(entry.document!);
    const targets = this.targetsFor(patch);
    if (!areShaderWarmupTargetsReady(targets, entry.context)) {
      entry.context = null;
      entry.targets = targets;
      void this.sync([...this.entries.values()].map(item => item.preset), entry.prepare);
      return false;
    }
    commitPreparedPresetToDocument(entry.document!, patch);
    return true;
  }
  clear() {
    ++this.version;
    this.cancelIdle?.();
    this.cancelIdle = null;
    this.entries.clear();
    this.retention.dispose();
    this.publish();
  }
}
