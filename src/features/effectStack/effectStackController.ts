import { createStore, type StoreApi } from 'zustand/vanilla';
import { applicationCommands } from '../../application/commands';
import {
  captureEffectStackEnabledState,
  moveEffectStackLayer,
  normalizeEffectStack,
  randomizeEffectStackOrder,
  restoreEffectStackEnabledState,
  soloEffectStackLayer,
  updateEffectStackLayer,
} from '../../lib/effectPipeline';
import {
  EFFECT_STACK_TRANSITION_DURATION_MS,
  beginEffectStackTransition,
  finishEffectStackTransition,
  isEffectStackTransitionActive,
} from '../../lib/effectStackTransition';
import { renderBridge } from '../../lib/renderBridge';
import { prefetchEffectStackLayer } from '../../lib/shaderWarmup';
import { useGradientStore, type GradientStore } from '../../store/gradientStore';
import type { EffectStackKind, PostprocessStackKind } from '../../types/distortion';
import {
  buildEffectStackView,
  type EffectStackActions,
  type EffectStackView,
  type LazyProgramKey,
  type LazyProgramStatus,
  type SoloSnapshot,
} from './effectStackView';

/**
 * Main-window Effect Stack controller. It owns the panel's actions and the
 * transient state they need (solo snapshot, randomize animation, lazy program
 * status) so the inline panel and a native Effect Stack window drive the same
 * logic. Only the main window imports this module: it talks to the renderer.
 */

const RANDOMIZE_FINISH_MARGIN_MS = 100;

type ControllerState = {
  soloSnapshot: SoloSnapshot | null;
  randomizing: boolean;
  previousOrder: EffectStackKind[];
  programStatus: Partial<Record<LazyProgramKey, LazyProgramStatus>>;
};

export type EffectStackViewState = { view: EffectStackView };

const controllerStore = createStore<ControllerState>(() => ({
  soloSnapshot: null,
  randomizing: false,
  previousOrder: [],
  programStatus: {},
}));

function viewInput(document: GradientStore, controller: ControllerState) {
  return {
    effectPipeline: document.effectPipeline,
    normalMapEnabled: document.normalMap.enabled,
    imageGradientEnabled: document.imageGradient.enabled,
    ...controller,
  };
}

let viewStore: StoreApi<EffectStackViewState> | null = null;

/**
 * The view derived from the document and the controller state. Updates are
 * coalesced into a microtask so a randomize (order + animation flag) reaches
 * the panel and a native window as one view.
 */
export function getEffectStackViewStore(): StoreApi<EffectStackViewState> {
  if (viewStore) return viewStore;
  const store = createStore<EffectStackViewState>(() => ({
    view: buildEffectStackView(viewInput(useGradientStore.getState(), controllerStore.getState())),
  }));
  viewStore = store;

  let lastDocument = useGradientStore.getState();
  let scheduled = false;
  const rebuild = () => {
    scheduled = false;
    const document = useGradientStore.getState();
    lastDocument = document;
    store.setState({ view: buildEffectStackView(viewInput(document, controllerStore.getState())) });
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(rebuild);
  };
  useGradientStore.subscribe(document => {
    // The document store changes every frame during playback; rebuild only
    // when an input of the view changed.
    if (document.effectPipeline === lastDocument.effectPipeline
      && document.normalMap.enabled === lastDocument.normalMap.enabled
      && document.imageGradient.enabled === lastDocument.imageGradient.enabled) return;
    lastDocument = document;
    schedule();
  });
  controllerStore.subscribe(schedule);
  installProgramStatusListener();
  return store;
}

let programStatusListenerInstalled = false;

function installProgramStatusListener() {
  if (programStatusListenerInstalled || typeof window === 'undefined') return;
  programStatusListenerInstalled = true;
  window.addEventListener('kgg:webgl-lazy-program-state', (event: Event) => {
    const detail = (event as CustomEvent<{ key?: LazyProgramKey; state?: LazyProgramStatus }>).detail;
    if (!detail?.key || !detail.state) return;
    const { key, state } = detail;
    controllerStore.setState(current => ({ programStatus: { ...current.programStatus, [key]: state } }));
  });
}

function currentStack() {
  return normalizeEffectStack(useGradientStore.getState().effectPipeline.effectStack);
}

export function selectEffectStackLayer(
  kind: EffectStackKind,
  solo: boolean,
  onSelectEffectStack?: (kind: EffectStackKind) => void,
) {
  onSelectEffectStack?.(kind);
  const stack = currentStack();
  const snapshot = controllerStore.getState().soloSnapshot;
  let effectStack: typeof stack | undefined;
  if (solo) {
    if (snapshot?.targetKind === kind) {
      effectStack = restoreEffectStackEnabledState(stack, snapshot.enabledState);
      controllerStore.setState({ soloSnapshot: null });
    } else {
      controllerStore.setState({
        soloSnapshot: snapshot
          ? { ...snapshot, targetKind: kind }
          : { targetKind: kind, enabledState: captureEffectStackEnabledState(stack) },
      });
      effectStack = soloEffectStackLayer(stack, kind);
    }
  } else if (snapshot) {
    controllerStore.setState({ soloSnapshot: null });
  }
  applicationCommands.setEffectPipeline({
    selectedKind: kind,
    ...(effectStack ? { effectStack } : {}),
  });
  if (kind === 'distort' || kind === 'mirror' || kind === 'kaleidoscope' || kind === 'voronoi' || kind === 'glass' || kind === 'glassTile') {
    applicationCommands.setPostprocess({ effectMode: kind === 'glass' ? 'glassV2' : kind as PostprocessStackKind });
  }
}

export function toggleEffectStackLayer(
  kind: EffectStackKind,
  enabled: boolean,
  onSelectEffectStack?: (kind: EffectStackKind) => void,
) {
  selectEffectStackLayer(kind, false, onSelectEffectStack);
  applicationCommands.setEffectPipeline({
    effectStack: updateEffectStackLayer(currentStack(), kind, { enabled }),
  });
}

export function moveEffectStackLayerTo(kind: EffectStackKind, targetIndex: number) {
  applicationCommands.setEffectPipeline({
    selectedKind: kind,
    effectStack: moveEffectStackLayer(useGradientStore.getState().effectPipeline.effectStack, kind, targetIndex),
  });
}

/** Randomizes the order and renders the canvas transition until it settles. */
export function randomizeEffectStack() {
  if (controllerStore.getState().randomizing || isEffectStackTransitionActive()) return;
  const current = useGradientStore.getState().effectPipeline;
  const nextStack = randomizeEffectStackOrder(current.effectStack);
  controllerStore.setState({
    randomizing: true,
    previousOrder: normalizeEffectStack(current.effectStack).map(layer => layer.kind),
  });
  beginEffectStackTransition(current.effectStack, nextStack);
  applicationCommands.setEffectPipeline({ effectStack: nextStack });

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    finishEffectStackTransition();
    renderBridge.renderAtTime(renderBridge.getCurrentTime(), renderBridge.getCurrentNormalizedTime());
    controllerStore.setState({ randomizing: false, previousOrder: [] });
  };
  const tick = () => {
    if (finished) return;
    renderBridge.renderAtTime(renderBridge.getCurrentTime(), renderBridge.getCurrentNormalizedTime());
    if (!isEffectStackTransitionActive()) {
      finish();
      return;
    }
    window.requestAnimationFrame(tick);
  };
  window.requestAnimationFrame(tick);
  // rAF pauses while the main window is minimized or covered, which can
  // happen when the stack is operated from its own window.
  window.setTimeout(finish, EFFECT_STACK_TRANSITION_DURATION_MS + RANDOMIZE_FINISH_MARGIN_MS);
}

/** Actions against this window's document; `onSelectEffectStack` opens the property module. */
export function createLocalEffectStackActions(
  onSelectEffectStack: () => ((kind: EffectStackKind) => void) | undefined,
): EffectStackActions {
  return {
    select: (kind, solo) => selectEffectStackLayer(kind, solo, onSelectEffectStack()),
    toggle: (kind, enabled) => toggleEffectStackLayer(kind, enabled, onSelectEffectStack()),
    move: moveEffectStackLayerTo,
    randomize: randomizeEffectStack,
    prefetch: prefetchEffectStackLayer,
  };
}
