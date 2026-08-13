import { describe, expect, it } from 'vitest';
import {
  CONTROL_GROUP_DEFINITIONS,
  getControlOperationDefinition,
  isJsonValue,
  listControlOperationDefinitions,
} from './controls.js';

describe('K-GG semantic control registry', () => {
  it('advertises every renderer group and the semantic mutation operations', () => {
    expect(CONTROL_GROUP_DEFINITIONS).toHaveLength(21);
    expect(getControlOperationDefinition('set_group')).toMatchObject({ scenarioSafe: true, requiresNativeCapability: false });
    expect(getControlOperationDefinition('delete_preset')).toMatchObject({ requiresApproval: true });
    expect(getControlOperationDefinition('export_preset_package')).toMatchObject({ requiresNativeCapability: true });
    expect(listControlOperationDefinitions().some(operation => operation.id === 'set_mesh_handle')).toBe(true);
    expect(listControlOperationDefinitions().some(operation => operation.id === 'set_animation_transport')).toBe(true);
  });

  it('rejects values that could cross the JSON-only control boundary', () => {
    expect(isJsonValue({ ok: true, values: [1, 'two', null] })).toBe(true);
    expect(isJsonValue({ __proto__: { polluted: true } })).toBe(true);
    expect(isJsonValue({ value: undefined })).toBe(false);
    expect(isJsonValue(() => undefined)).toBe(false);
  });
});
