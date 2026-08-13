import type { ScenarioCommand } from './types.js';
import { getControlOperationDefinition, isJsonValue } from './controls.js';

export const MAX_SCENARIO_COMMANDS = 32;
export const MAX_SCENARIO_WAIT_MS = 5_000;
export const MAX_SCENARIO_TOTAL_WAIT_MS = 20_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).every(key => keys.includes(key));
}

function boundedString(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength;
}

function isEffectKind(value: unknown): boolean {
  return typeof value === 'string' && [
    'noise', 'slit', 'stretch', 'distort', 'mirror', 'kaleidoscope',
    'voronoi', 'glass', 'diffuse',
  ].includes(value);
}

export function validateScenario(commands: unknown):
  | { ok: true; commands: ScenarioCommand[] }
  | { ok: false; message: string } {
  if (!Array.isArray(commands)) return { ok: false, message: 'commands must be an array' };
  if (commands.length > MAX_SCENARIO_COMMANDS) {
    return { ok: false, message: `commands may contain at most ${MAX_SCENARIO_COMMANDS} items` };
  }
  let totalWaitMs = 0;
  for (const [index, command] of commands.entries()) {
    if (!isRecord(command) || typeof command.type !== 'string') {
      return { ok: false, message: `commands[${index}] must have a type` };
    }
    switch (command.type) {
      case 'setParameter':
        if (!hasOnlyKeys(command, ['type', 'path', 'value']) || !boundedString(command.path, 256) || !isJsonValue(command.value)) {
          return { ok: false, message: `commands[${index}] is not a valid setParameter command` };
        }
        break;
      case 'enableEffect':
        if (!hasOnlyKeys(command, ['type', 'kind', 'enabled']) || !isEffectKind(command.kind) || typeof command.enabled !== 'boolean') {
          return { ok: false, message: `commands[${index}] is not a valid enableEffect command` };
        }
        break;
      case 'reorderEffect':
        if (!hasOnlyKeys(command, ['type', 'kind', 'targetIndex']) || !isEffectKind(command.kind)
          || typeof command.targetIndex !== 'number' || !Number.isInteger(command.targetIndex)
          || command.targetIndex < 0 || command.targetIndex > 32) {
          return { ok: false, message: `commands[${index}] is not a valid reorderEffect command` };
        }
        break;
      case 'resetEffect':
        if (!hasOnlyKeys(command, ['type', 'kind']) || (command.kind !== undefined && !isEffectKind(command.kind))) {
          return { ok: false, message: `commands[${index}] is not a valid resetEffect command` };
        }
        break;
      case 'captureSnapshot':
        if (!hasOnlyKeys(command, ['type', 'snapshotId']) || (command.snapshotId !== undefined && !boundedString(command.snapshotId, 160))) {
          return { ok: false, message: `commands[${index}] is not a valid captureSnapshot command` };
        }
        break;
      case 'restoreSnapshot':
        if (!hasOnlyKeys(command, ['type', 'snapshotId']) || !boundedString(command.snapshotId, 160)) {
          return { ok: false, message: `commands[${index}] is not a valid restoreSnapshot command` };
        }
        break;
      case 'control': {
        if (!hasOnlyKeys(command, ['type', 'operationId', 'input']) || !boundedString(command.operationId, 160)) {
          return { ok: false, message: `commands[${index}] is not a valid control command` };
        }
        const operationId = command.operationId;
        const input = command.input;
        const definition = getControlOperationDefinition(operationId);
        if (!definition) return { ok: false, message: `commands[${index}].operationId is not a registered control operation` };
        if (!definition.scenarioSafe) return { ok: false, message: `commands[${index}].operationId is not scenario-safe` };
        if (!isRecord(input) || !isJsonValue(input)) {
          return { ok: false, message: `commands[${index}].input must be a JSON object` };
        }
        break;
      }
      case 'wait': {
        if (!hasOnlyKeys(command, ['type', 'milliseconds'])) {
          return { ok: false, message: `commands[${index}] is not a valid wait command` };
        }
        const milliseconds = command.milliseconds;
      if (typeof milliseconds !== 'number' || !Number.isFinite(milliseconds) || milliseconds < 0 || milliseconds > MAX_SCENARIO_WAIT_MS) {
        return { ok: false, message: `commands[${index}].milliseconds must be between 0 and ${MAX_SCENARIO_WAIT_MS}` };
      }
        totalWaitMs += milliseconds;
        if (totalWaitMs > MAX_SCENARIO_TOTAL_WAIT_MS) {
          return { ok: false, message: `scenario wait time may not exceed ${MAX_SCENARIO_TOTAL_WAIT_MS}ms` };
        }
        break;
      }
      default:
        return { ok: false, message: `commands[${index}].type is not supported` };
    }
  }
  return { ok: true, commands: commands as ScenarioCommand[] };
}
