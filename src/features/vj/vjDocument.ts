import { applicationCommands } from '../../application/commands';
import { STORE_DEFAULTS, useGradientStore, type GradientStore } from '../../store/gradientStore';
import { createDocumentActions } from '../../store/documentActions';
import { resolvePreparedPresetPatch, type PreparedPreset } from '../../lib/applyPreset';
import { createVjRandomValues, getVjParameters, type VjParameter, type VjParameterRule } from './vjParameters';
import type { EffectStackKind } from '../../types/distortion';

const GROUPS = ['noiseDistortion', 'diffuse', 'slitScan', 'stretch', 'postprocess', 'coneView', 'datamosh', 'texture', 'distortChroma'] as const;
type Group = typeof GROUPS[number];
export type VjDocumentSnapshot = Pick<GradientStore, Group | 'keyframeTracks'>;
export type VjValues = Record<string, number | string | boolean>;

/** Store actions replace these objects; retaining references avoids copying displacement maps per gesture. */
export function captureVjDocument(): VjDocumentSnapshot {
  const state = useGradientStore.getState();
  return { ...Object.fromEntries(GROUPS.map(group => [group, state[group]])), keyframeTracks: state.keyframeTracks } as VjDocumentSnapshot;
}

type ValueCommands = Pick<GradientStore, 'setNoiseDistortion' | 'setDiffuse' | 'setSlitScan' | 'setStretch'
  | 'setPostprocess' | 'setConeView' | 'setDatamosh' | 'setTexture' | 'setDistortChroma' | 'setKeyframeTracks'>;

function applyGroup(group: Group, patch: Record<string, unknown>, commands: ValueCommands = applicationCommands,
  state: GradientStore = useGradientStore.getState()): void {
  switch (group) {
    case 'noiseDistortion':
      // Type switches apply editor defaults; live controls must preserve every untouched value.
      commands.setNoiseDistortion({ ...state.noiseDistortion, ...patch });
      break;
    case 'diffuse': commands.setDiffuse(patch); break;
    case 'slitScan': commands.setSlitScan(patch); break;
    case 'stretch': commands.setStretch(patch); break;
    case 'postprocess': commands.setPostprocess(patch); break;
    case 'coneView': commands.setConeView(patch); break;
    case 'datamosh': commands.setDatamosh(patch); break;
    case 'texture': commands.setTexture(patch); break;
    case 'distortChroma': commands.setDistortChroma(patch); break;
  }
}

/** Only catalogued fields enter the normal application command / normalizer boundary. */
export function applyVjValues(parameters: readonly VjParameter[], values: VjValues): void {
  applyValues(parameters, values, useGradientStore.getState(), applicationCommands);
}

function applyValues(parameters: readonly VjParameter[], values: VjValues, state: GradientStore, commands: ValueCommands): void {
  const patches = new Map<Group, Record<string, unknown>>();
  const tracks = { ...state.keyframeTracks };
  for (const parameter of parameters) {
    const value = values[parameter.id];
    if (value === undefined || !GROUPS.includes(parameter.group as Group)) continue;
    if (parameter.type === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) continue;
    if (parameter.type === 'boolean' && typeof value !== 'boolean') continue;
    if (parameter.type === 'enum' && !parameter.values?.includes(value as string | boolean)) continue;
    if (parameter.type === 'color' && (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value))) continue;
    const group = parameter.group as Group;
    const patch = patches.get(group) ?? {};
    patch[parameter.field] = value;
    patches.set(group, patch);
    // Static tracks also override legacy Auto flags, without deleting the saved keyframes.
    tracks[parameter.id] = {
      ...tracks[parameter.id], propertyId: parameter.id, label: parameter.label,
      keyframes: tracks[parameter.id]?.keyframes ?? [], mode: 'static', enabled: false,
    };
  }
  for (const [group, patch] of patches) applyGroup(group, patch, commands, state);
  if (patches.size) commands.setKeyframeTracks(tracks);
}

/** Include fields revealed by randomized selectors before taking over their tracks. */
export function createVjRandomization(state: GradientStore, rules: Record<string, VjParameterRule>,
  mode: 'full' | 'bounded', kind?: EffectStackKind, rng: () => number = Math.random) {
  const kinds = kind ? [kind] : state.effectPipeline.effectStack.filter(layer => layer.enabled).map(layer => layer.kind);
  const parameters = kinds.flatMap(kind => getVjParameters(kind, state));
  const values = createVjRandomValues(parameters, state, rules, mode, rng);
  const resolved = { ...state };
  for (const [id, value] of Object.entries(values)) {
    const [group, field] = id.split('.');
    if (GROUPS.includes(group as Group)) Object.assign(resolved, { [group]: { ...resolved[group as Group], [field]: value } });
  }
  const allParameters = [...new Map([...parameters, ...kinds.flatMap(kind => getVjParameters(kind, resolved))]
    .map(parameter => [parameter.id, parameter])).values()];
  return { parameters: allParameters, values };
}

/** Randomize and normalize the next automatic cue without publishing either intermediate document. */
export function prepareBoundedVjPreset(prepared: PreparedPreset, rules: Record<string, VjParameterRule>,
  rng: () => number = Math.random): PreparedPreset {
  const basePatch = resolvePreparedPresetPatch(prepared);
  const state = { ...useGradientStore.getState(), ...basePatch };
  const { parameters, values } = createVjRandomization(state, rules, 'bounded', undefined, rng);
  let staged = state;
  let randomPatch: Partial<GradientStore> = {};
  const commands = createDocumentActions(update => {
    const next = typeof update === 'function' ? update(staged) : update;
    randomPatch = { ...randomPatch, ...next };
    staged = { ...staged, ...next };
  }, STORE_DEFAULTS);
  applyValues(parameters, values, state, commands);
  const patch = { ...basePatch, ...randomPatch, effectPipeline: state.effectPipeline };
  return { ...prepared, patch, inputs: { ...prepared.inputs,
    ...(randomPatch.noiseDistortion ? { noiseDistortion: patch.noiseDistortion } : {}),
    ...(randomPatch.slitScan ? { slitScan: patch.slitScan } : {}),
    ...(randomPatch.stretch ? { stretch: patch.stretch } : {}),
  } };
}

export function restoreVjDocument(snapshot: VjDocumentSnapshot): void {
  const state = useGradientStore.getState();
  for (const group of GROUPS) {
    // A value reset must not undo a separately toggled layer or reordered stack.
    const live = state[group];
    applyGroup(group, { ...snapshot[group], ...('enabled' in live ? { enabled: live.enabled } : {}) });
  }
  applicationCommands.setKeyframeTracks(snapshot.keyframeTracks);
}

export function restoreVjAnimation(snapshot: VjDocumentSnapshot): void {
  applicationCommands.setKeyframeTracks(snapshot.keyframeTracks);
}
