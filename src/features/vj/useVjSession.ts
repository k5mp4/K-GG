import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGradientStore } from '../../store/gradientStore';
import { applicationCommands } from '../../application/commands';
import { builtinPresetLibrary, getPresetLibrarySnapshot, subscribePresetLibrary } from '../../lib/presetLibraryCache';
import { getShaderWarmupContext, subscribeShaderWarmup } from '../../lib/shaderWarmup';
import { VjPresetCache } from './vjPresetCache';
import { getVjPerformanceIds } from './vjPresetSource';
import { getVjSettings, subscribeVjSettings, updateVjSettings } from './vjSettings';
import { advanceVjQueue, createVjQueue, VjBeatClock, type VjBeatPosition } from './vjPlayback';
import { getVjParameters, makeVjCenteredRules, type VjParameter } from './vjParameters';
import { applyVjValues, captureVjDocument, createVjRandomization, prepareBoundedVjPreset, restoreVjAnimation, restoreVjDocument, type VjDocumentSnapshot } from './vjDocument';
import type { Preset } from '../../lib/presetModel';
import type { EffectStackKind } from '../../types/distortion';

const INITIAL_POSITION: VjBeatPosition = { beat: 0, progress: 0, bar: 0, shouldAdvance: false };

export function useVjSession() {
  const settings = useSyncExternalStore(subscribeVjSettings, getVjSettings, getVjSettings);
  const { library, status: libraryStatus } = useSyncExternalStore(subscribePresetLibrary, getPresetLibrarySnapshot, getPresetLibrarySnapshot);
  const document = useGradientStore(useShallow(state => ({
    noiseDistortion: state.noiseDistortion, diffuse: state.diffuse, slitScan: state.slitScan,
    stretch: state.stretch, postprocess: state.postprocess, coneView: state.coneView,
    datamosh: state.datamosh, texture: state.texture, distortChroma: state.distortChroma,
    effectPipeline: state.effectPipeline, presetName: state.presetName,
  })));
  const enabled = settings.layoutMode === 'vj';
  const presets = useMemo(() => [...builtinPresetLibrary.presets, ...library.presets], [library]);
  const availableIds = useMemo(() => getVjPerformanceIds(settings, presets, library), [settings, presets, library]);
  const idsKey = availableIds.join('\0');
  const performancePresets = useMemo(() => idsKey ? idsKey.split('\0').flatMap(id => {
    const preset = presets.find(preset => preset.id === id);
    return preset ? [preset] : [];
  }) : [], [idsKey, presets]);
  const [cache] = useState(() => new VjPresetCache());
  // A live four-beat deadline cannot wait for requestIdleCallback's 1s timeout.
  // Reuse normalized base maps and prepare one small random patch between frames.
  const [autoCache] = useState(() => new VjPresetCache(callback => {
    const frame = window.requestAnimationFrame(() => callback());
    return () => window.cancelAnimationFrame(frame);
  }));
  const preparation = useSyncExternalStore(cache.subscribe, cache.getSnapshot, cache.getSnapshot);
  const autoPreparation = useSyncExternalStore(autoCache.subscribe, autoCache.getSnapshot, autoCache.getSnapshot);
  const context = useSyncExternalStore(subscribeShaderWarmup, getShaderWarmupContext, getShaderWarmupContext);
  const allReady = preparation.total === availableIds.length && preparation.total > 0 && preparation.ready === preparation.total;
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [queue, setQueue] = useState<string[]>([]);
  const nextAutoPreset = performancePresets.find(preset => preset.id === queue[0]);
  const autoReady = !!nextAutoPreset && autoPreparation.ready === 1 && autoCache.isReady(nextAutoPreset.id);
  const prepareAutomatic = useMemo(() => (preset: Preset) =>
    prepareBoundedVjPreset(cache.getPrepared(preset.id)!, settings.rules), [cache, settings.rules]);
  const [running, setRunning] = useState(false);
  const [position, setPosition] = useState(INITIAL_POSITION);
  const [error, setError] = useState<'missing' | 'prepare' | 'apply' | null>(null);
  const [hasUndo, setHasUndo] = useState(false);
  const [hasTakeover, setHasTakeover] = useState(false);
  const queueRef = useRef(queue);
  const currentIdRef = useRef(currentId);
  const loadingRef = useRef(false);
  const clock = useRef(new VjBeatClock());
  const baseline = useRef<VjDocumentSnapshot | null>(null);
  const animationBaseline = useRef<VjDocumentSnapshot | null>(null);
  const baselineTakeover = useRef(false);
  const undo = useRef<VjDocumentSnapshot | null>(null);
  const undoTakeover = useRef(false);

  const publishQueue = useCallback((next: string[]) => { queueRef.current = next; setQueue(next); }, []);

  const initializeRanges = useCallback(() => {
    const state = useGradientStore.getState();
    const fresh = getVjSettings();
    const defaults = makeVjCenteredRules(state.effectPipeline.effectStack.flatMap(layer => getVjParameters(layer.kind, state)), state);
    if (Object.keys(defaults).some(id => !(id in fresh.rules))) {
      updateVjSettings({ rules: { ...defaults, ...fresh.rules } });
    }
  }, []);

  useEffect(() => {
    loadingRef.current = false;
    clock.current.stop();
    setRunning(false);
    setPosition(INITIAL_POSITION);
    currentIdRef.current = null;
    setCurrentId(null);
    setError(null);
    if (enabled) {
      baseline.current = captureVjDocument();
      animationBaseline.current = baseline.current;
      baselineTakeover.current = false;
      undo.current = null;
      setHasUndo(false);
      setHasTakeover(false);
      initializeRanges();
    }
  }, [enabled, initializeRanges]);

  useEffect(() => {
    if (enabled) void cache.sync(performancePresets);
    else cache.clear();
  }, [enabled, cache, performancePresets, context]);
  useEffect(() => () => cache.clear(), [cache]);
  useEffect(() => {
    if (enabled && allReady && nextAutoPreset) void autoCache.sync([nextAutoPreset], prepareAutomatic);
    else autoCache.clear();
  }, [enabled, allReady, nextAutoPreset, autoCache, prepareAutomatic, context]);
  useEffect(() => () => autoCache.clear(), [autoCache]);
  useEffect(() => {
    if (!allReady) { clock.current.stop(); setRunning(false); }
  }, [allReady]);

  useEffect(() => {
    publishQueue(createVjQueue(idsKey ? idsKey.split('\0') : [], currentIdRef.current, settings.shuffle));
    if (availableIds.length < 2) { clock.current.stop(); setRunning(false); }
    // Rules/BPM edits do not reshuffle the already previewed cue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, idsKey, settings.shuffle, presets, publishQueue]);

  useEffect(() => {
    if (enabled) initializeRanges();
  }, [enabled, document, initializeRanges]);

  useEffect(() => { clock.current.setBpm(performance.now(), settings.bpm); }, [settings.bpm]);

  const loadPreset = useCallback((id: string, { consumeQueue = false, automatic = false }: { consumeQueue?: boolean; automatic?: boolean } = {}) => {
    if (loadingRef.current || getVjSettings().layoutMode !== 'vj') return;
    const preset = performancePresets.find(item => item.id === id);
    if (!preset) { setError('missing'); return; }
    loadingRef.current = true;
    setError(null);
    try {
      if (consumeQueue && queueRef.current[0] !== id) return;
      if (!(automatic ? autoCache : cache).apply(id)) {
        if (automatic) { clock.current.stop(); setRunning(false); }
        setError('prepare'); return;
      }
      baseline.current = captureVjDocument();
      animationBaseline.current = automatic
        ? { ...baseline.current, keyframeTracks: cache.getPrepared(id)!.patch.keyframeTracks ?? baseline.current.keyframeTracks }
        : baseline.current;
      baselineTakeover.current = automatic;
      initializeRanges();
      undo.current = null;
      setHasUndo(false);
      setHasTakeover(automatic);
      currentIdRef.current = id;
      setCurrentId(id);
      const fresh = getVjSettings();
      const ids = getVjPerformanceIds(fresh, presets, library);
      publishQueue(consumeQueue
        ? advanceVjQueue(queueRef.current, ids, id, fresh.shuffle)
        : createVjQueue(ids, id, fresh.shuffle));
      setError(null);
    } catch {
      if (automatic) { clock.current.stop(); setRunning(false); }
      setError('apply');
    } finally {
      loadingRef.current = false;
    }
  }, [presets, performancePresets, library, cache, autoCache, publishQueue, initializeRanges]);

  const advanceNext = useCallback(() => {
    const id = queueRef.current[0];
    if (id && id !== currentIdRef.current) loadPreset(id, { consumeQueue: true });
  }, [loadPreset]);
  const next = advanceNext;

  useEffect(() => {
    if (!enabled || !running) return;
    const tick = () => {
      const nextPosition = clock.current.poll(performance.now());
      setPosition(previous => previous.beat === nextPosition.beat && previous.bar === nextPosition.bar ? previous : nextPosition);
      if (nextPosition.shouldAdvance && queueRef.current[0]) loadPreset(queueRef.current[0], { consumeQueue: true, automatic: true });
    };
    let frame = 0;
    const onFrame = () => { tick(); frame = window.requestAnimationFrame(onFrame); };
    frame = window.requestAnimationFrame(onFrame);
    window.addEventListener('focus', tick);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener('focus', tick); };
  }, [enabled, running, loadPreset]);

  const toggleRunning = () => {
    if (running) {
      clock.current.stop(); setRunning(false);
    }
    else if (availableIds.length >= 2 && allReady && autoReady) {
      clock.current.start(performance.now(), settings.bpm);
      setPosition(INITIAL_POSITION);
      setRunning(true);
    }
  };

  const editParameter = (parameter: VjParameter, value: number | string | boolean) => {
    applyVjValues([parameter], { [parameter.id]: value });
    setHasTakeover(true);
  };

  const randomize = (mode: 'full' | 'bounded', kind?: EffectStackKind) => {
    const state = useGradientStore.getState();
    const { parameters, values } = createVjRandomization(state, settings.rules, mode, kind);
    undo.current = captureVjDocument();
    undoTakeover.current = hasTakeover;
    applyVjValues(parameters, values);
    setHasUndo(true);
    setHasTakeover(true);
  };

  const centerRanges = (kind?: EffectStackKind) => {
    const state = useGradientStore.getState();
    const kinds = kind ? [kind] : state.effectPipeline.effectStack.filter(layer => layer.enabled).map(layer => layer.kind);
    const rules = makeVjCenteredRules(kinds.flatMap(item => getVjParameters(item, state)), state);
    for (const id of Object.keys(rules)) rules[id].locked = settings.rules[id]?.locked;
    updateVjSettings({ rules: { ...settings.rules, ...rules } });
  };

  const resetValues = () => {
    if (!baseline.current) return;
    restoreVjDocument(baseline.current);
    undo.current = null;
    setHasUndo(false);
    setHasTakeover(baselineTakeover.current);
  };

  const undoRandomize = () => {
    if (!undo.current) return;
    restoreVjDocument(undo.current);
    undo.current = null;
    setHasUndo(false);
    setHasTakeover(undoTakeover.current);
  };

  const restoreAnimation = () => {
    if (!animationBaseline.current) return;
    restoreVjAnimation(animationBaseline.current);
    setHasTakeover(false);
  };

  const previous = () => {
    if (!availableIds.length) return;
    const index = availableIds.indexOf(currentIdRef.current ?? '');
    void loadPreset(availableIds[index < 0 ? availableIds.length - 1 : (index - 1 + availableIds.length) % availableIds.length]);
  };

  const movePreset = (id: string, direction: -1 | 1) => {
    const ids = [...settings.presetIds];
    const index = ids.indexOf(id);
    const destination = index + direction;
    if (index < 0 || destination < 0 || destination >= ids.length) return;
    [ids[index], ids[destination]] = [ids[destination], ids[index]];
    updateVjSettings({ presetIds: ids });
  };

  return { settings, enabled, document, presets, performancePresets, library, libraryStatus, availableIds, currentId, queue,
    preparation, autoPreparation, autoReady, allReady, isPresetReady: cache.isReady, retryPreparation: () => {
      setError(null); void cache.sync(performancePresets);
      if (nextAutoPreset && allReady) void autoCache.sync([nextAutoPreset], prepareAutomatic);
    },
    running, position, error, hasUndo, hasTakeover, loadPreset, next, previous, toggleRunning,
    editParameter, randomize, centerRanges, resetValues, undoRandomize, restoreAnimation, movePreset,
    updateSettings: updateVjSettings,
    selectEffect: (kind: EffectStackKind) => applicationCommands.setEffectPipeline({ selectedKind: kind }),
  };
}

export type VjSession = ReturnType<typeof useVjSession>;
