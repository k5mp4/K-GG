import type { AnimationMode, AutoModifier, PropertyTrack } from '../types/keyframe';

export type AnimationPropertyDefinition = {
  propertyId: string;
  label: string;
  group: string;
  autoCapable: boolean;
  defaultAuto?: AutoModifier;
};

const DEFINITIONS: AnimationPropertyDefinition[] = [
  {
    propertyId: 'noiseDistortion.evolution',
    label: 'Evolution',
    group: 'Noise Distortion',
    autoCapable: true,
    defaultAuto: { kind: 'loop', speed: 1, direction: 0, phase: 0 },
  },
  {
    propertyId: 'radon.evolution',
    label: 'Evolution',
    group: 'Radon Warp',
    autoCapable: true,
    defaultAuto: { kind: 'loop', speed: 1, direction: 0, phase: 0 },
  },
  {
    propertyId: 'iridescence.__time',
    label: 'Motion Phase',
    group: 'Iridescence',
    autoCapable: true,
    defaultAuto: { kind: 'loop', speed: 1, direction: 0, phase: 0 },
  },
  {
    propertyId: 'slitScan.offset',
    label: 'Offset Motion',
    group: 'Slit Scan',
    autoCapable: true,
    defaultAuto: { kind: 'pingpong', speed: 1, direction: 0, phase: 0 },
  },
  {
    propertyId: 'slitScan.slitPhase',
    label: 'Phase Motion',
    group: 'Slit Scan',
    autoCapable: true,
    defaultAuto: { kind: 'loop', speed: 1, direction: 0, phase: 0 },
  },
  {
    propertyId: 'stretch.__scan',
    label: 'Scan Position',
    group: 'Stretch',
    autoCapable: true,
    defaultAuto: { kind: 'loop', speed: 1, direction: 0, phase: 0 },
  },
  {
    propertyId: 'diffuse.seed',
    label: 'Seed Motion',
    group: 'Diffuse',
    autoCapable: true,
    defaultAuto: { kind: 'seed', speed: 1, direction: 0, phase: 0 },
  },
  {
    propertyId: 'postprocess.__time',
    label: 'Effect Motion',
    group: 'Postprocess',
    autoCapable: true,
    defaultAuto: { kind: 'loop', speed: 1, direction: 0, phase: 0 },
  },
];

const DEFINITION_MAP = new Map(DEFINITIONS.map(definition => [definition.propertyId, definition]));

export function getAnimationDefinition(propertyId: string): AnimationPropertyDefinition | undefined {
  return DEFINITION_MAP.get(propertyId);
}

export function isAutoCapableProperty(propertyId: string): boolean {
  return getAnimationDefinition(propertyId)?.autoCapable ?? false;
}

export function getAnimationGroup(propertyId: string, fallback = 'Properties'): string {
  const registered = getAnimationDefinition(propertyId);
  if (registered) return registered.group;
  if (propertyId.startsWith('gradientStop.') || propertyId.startsWith('opacityStop.')) return 'Gradient Ramp';
  if (propertyId.startsWith('gradientAnchor.')) return 'Gradient Anchors';
  const category = propertyId.split('.')[0];
  const labels: Record<string, string> = {
    noiseDistortion: 'Noise Distortion',
    slitScan: 'Slit Scan',
    stretch: 'Stretch',
    radon: 'Radon Warp',
    iridescence: 'Iridescence',
    diffuse: 'Diffuse',
    postprocess: 'Postprocess',
  };
  return labels[category] ?? fallback;
}

export function createAnimationTrack(
  propertyId: string,
  label: string,
  mode: AnimationMode,
  keyframes: PropertyTrack['keyframes'] = [],
): PropertyTrack {
  const definition = getAnimationDefinition(propertyId);
  return {
    propertyId,
    label: definition?.label ?? label,
    group: definition?.group ?? getAnimationGroup(propertyId),
    mode,
    enabled: mode === 'keys',
    auto: definition?.defaultAuto ? { ...definition.defaultAuto } : undefined,
    keyframes,
  };
}

export const AUTO_PROPERTY_DEFINITIONS = DEFINITIONS;
