import { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import {
  KGG_CONTROL_PROTOCOL_VERSION,
  type RuntimeResult,
} from '../../../packages/kgg-control/src/index.js';

export type RuntimeRequester = {
  request(method: string, params?: Record<string, unknown>): Promise<RuntimeResult<unknown>>;
};

const effectKinds = [
  'noise',
  'slit',
  'stretch',
  'distort',
  'mirror',
  'kaleidoscope',
  'voronoi',
  'glass',
  'diffuse',
] as const;

const effectKindSchema = z.enum(effectKinds);
const jsonValueSchema: z.ZodType<unknown> = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.unknown()),
  z.record(z.string(), z.unknown()),
]);

const emptyInput = z.object({});
const readAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
} as const;
const mutationAnnotations = {
  readOnlyHint: false,
  // The generic execute/control surface includes delete, export, toggle, and
  // append operations. Advertise the conservative contract so hosts do not
  // silently retry or auto-approve a mutation that may be destructive.
  destructiveHint: true,
  idempotentHint: false,
} as const;

function textResult(value: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) ?? 'null' }],
  };
}

function runtimeResult(result: RuntimeResult<unknown>) {
  if (!result.ok) {
    return {
      isError: true,
      content: [{ type: 'text' as const, text: JSON.stringify({ error: result.error }, null, 2) }],
    };
  }
  return textResult(result.value);
}

function previewResult(result: RuntimeResult<unknown>) {
  if (!result.ok) return runtimeResult(result);
  const value = result.value as { dataUrl?: unknown; mimeType?: unknown; width?: unknown; height?: unknown };
  if (typeof value.dataUrl !== 'string' || typeof value.mimeType !== 'string') return textResult(result.value);
  const comma = value.dataUrl.indexOf(',');
  if (comma < 0) return textResult(result.value);
  const data = value.dataUrl.slice(comma + 1);
  return {
    content: [
      {
        type: 'image' as const,
        data,
        mimeType: value.mimeType,
      },
      {
        type: 'text' as const,
        text: JSON.stringify({ width: value.width, height: value.height, mimeType: value.mimeType }, null, 2),
      },
    ],
  };
}

export function createKggMcpServer(runtime: RuntimeRequester): McpServer {
  const server = new McpServer(
    { name: 'kgg-mcp', version: '0.1.0' },
    {
      instructions: [
        'K-GG developer interface for observing and modifying the connected local K-GG renderer.',
        `Control API protocol: ${KGG_CONTROL_PROTOCOL_VERSION}.`,
        'Use read-only tools to inspect state and diagnostics before mutation tools.',
        'Mutation tools are limited to registered parameters, semantic UI control operations, effect stack operations, snapshots, and allowlisted scenarios.',
        'Semantic controls are discovered through kgg_list_controls and execute only JSON-shaped allowlisted operations; this server does not execute arbitrary code or provide shell, arbitrary file-system, network, or operating-system control.',
        'The connected UI must be running with the authenticated loopback Runtime Bridge for renderer operations to succeed.',
      ].join(' '),
    },
  );

  server.registerTool('kgg_get_state', {
    title: 'Get K-GG State',
    description: 'Read the serializable K-GG state and renderer readiness.',
    inputSchema: emptyInput,
    annotations: readAnnotations,
  }, async () => runtimeResult(await runtime.request('getState')));

  server.registerTool('kgg_get_gradient_state', {
    title: 'Get Gradient State',
    description: 'Read the gradient, noise, diffuse, image-gradient, and slit-scan state.',
    inputSchema: emptyInput,
    annotations: readAnnotations,
  }, async () => runtimeResult(await runtime.request('getGradientState')));

  server.registerTool('kgg_list_controls', {
    title: 'List K-GG UI Controls',
    description: 'Discover the semantic UI/store control groups, allowlisted operations, live fields, and safety/native capability boundaries.',
    inputSchema: emptyInput,
    annotations: readAnnotations,
  }, async () => runtimeResult(await runtime.request('listControls')));

  server.registerTool('kgg_get_control_state', {
    title: 'Get K-GG Control State',
    description: 'Read the live state of all semantic UI/store control groups or a selected subset.',
    inputSchema: z.object({ groups: z.array(z.string().min(1)).max(32).optional() }),
    annotations: readAnnotations,
  }, async ({ groups }) => runtimeResult(await runtime.request('getControlState', { groups })));

  server.registerTool('kgg_list_parameters', {
    title: 'List K-GG Parameters',
    description: 'List registered writable parameter paths, limits, and current values.',
    inputSchema: z.object({ prefix: z.string().optional() }),
    annotations: readAnnotations,
  }, async ({ prefix }) => runtimeResult(await runtime.request('listParameters', { prefix })));

  server.registerTool('kgg_get_parameter', {
    title: 'Get K-GG Parameter',
    description: 'Read one registered parameter by its stable path.',
    inputSchema: z.object({ path: z.string().min(1) }),
    annotations: readAnnotations,
  }, async ({ path }) => runtimeResult(await runtime.request('getParameter', { path })));

  server.registerTool('kgg_list_effects', {
    title: 'List Effect Stack',
    description: 'Read the normalized Unified Effect Stack order and enabled state.',
    inputSchema: emptyInput,
    annotations: readAnnotations,
  }, async () => runtimeResult(await runtime.request('listEffects')));

  server.registerTool('kgg_get_render_diagnostics', {
    title: 'Get Render Diagnostics',
    description: 'Read on-demand GPU, WebGL, profiler, resource, and lazy-program diagnostics.',
    inputSchema: emptyInput,
    annotations: readAnnotations,
  }, async () => runtimeResult(await runtime.request('getRenderDiagnostics')));

  server.registerTool('kgg_get_shader_errors', {
    title: 'Get Shader Errors',
    description: 'Read the bounded shader error ring buffer.',
    inputSchema: emptyInput,
    annotations: readAnnotations,
  }, async () => runtimeResult(await runtime.request('getShaderErrors')));

  server.registerTool('kgg_dev_get_render_passes', {
    title: 'Get Render Passes',
    description: 'Developer diagnostic view of measured render passes and effect timings.',
    inputSchema: emptyInput,
    annotations: readAnnotations,
  }, async () => runtimeResult(await runtime.request('getDevRenderPasses')));

  server.registerTool('kgg_dev_get_webgl_state', {
    title: 'Get WebGL State',
    description: 'Developer diagnostic view of context, GPU limits, FBO readiness, and lazy programs.',
    inputSchema: emptyInput,
    annotations: readAnnotations,
  }, async () => runtimeResult(await runtime.request('getDevWebGLState')));

  server.registerTool('kgg_dev_get_uniforms', {
    title: 'Get Uniforms',
    description: 'Developer diagnostic list of reflected uniform names.',
    inputSchema: emptyInput,
    annotations: readAnnotations,
  }, async () => runtimeResult(await runtime.request('getDevUniforms')));

  server.registerTool('kgg_dev_get_performance', {
    title: 'Get Performance',
    description: 'Developer diagnostic snapshot of FPS, frame time, draw calls, resources, and benchmark status.',
    inputSchema: emptyInput,
    annotations: readAnnotations,
  }, async () => runtimeResult(await runtime.request('getDevPerformance')));

  server.registerTool('kgg_set_parameter', {
    title: 'Set K-GG Parameter',
    description: 'Set a registered parameter through the K-GG normalizer and return the resulting value.',
    inputSchema: z.object({ path: z.string().min(1), value: jsonValueSchema }),
    annotations: mutationAnnotations,
  }, async ({ path, value }) => runtimeResult(await runtime.request('setParameter', { path, value })));

  server.registerTool('kgg_execute_control', {
    title: 'Execute K-GG UI Control',
    description: 'Execute one operation returned by kgg_list_controls. Mutations are conservatively marked destructive; operations requiring human approval reject caller-supplied confirm flags without an app approval callback. DOM replay, arbitrary code, arbitrary file paths, and network access are not available.',
    inputSchema: z.object({
      operationId: z.string().min(1),
      input: z.record(z.string(), z.unknown()).optional(),
    }),
    annotations: mutationAnnotations,
  }, async ({ operationId, input }) => runtimeResult(await runtime.request('executeControl', { operationId, input: input ?? {} })));

  server.registerTool('kgg_set_gradient_colors', {
    title: 'Set Gradient Colors',
    description: 'Replace the gradient color stops with evenly spaced six-digit hex colors.',
    inputSchema: z.object({
      colors: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).min(2).max(16),
    }),
    annotations: mutationAnnotations,
  }, async ({ colors }) => runtimeResult(await runtime.request('setGradientColors', { colors })));

  server.registerTool('kgg_enable_effect', {
    title: 'Enable Effect',
    description: 'Enable or disable one Unified Effect Stack layer.',
    inputSchema: z.object({ kind: effectKindSchema, enabled: z.boolean() }),
    annotations: mutationAnnotations,
  }, async ({ kind, enabled }) => runtimeResult(await runtime.request('enableEffect', { kind, enabled })));

  server.registerTool('kgg_reorder_effect', {
    title: 'Reorder Effect',
    description: 'Move one Unified Effect Stack layer to a target index.',
    inputSchema: z.object({ kind: effectKindSchema, targetIndex: z.number().int().min(0).max(32) }),
    annotations: mutationAnnotations,
  }, async ({ kind, targetIndex }) => runtimeResult(await runtime.request('reorderEffect', { kind, targetIndex })));

  server.registerTool('kgg_reset_effect', {
    title: 'Reset Effect',
    description: 'Reset one effect layer or the complete effect pipeline to its safe defaults.',
    inputSchema: z.object({ kind: effectKindSchema.optional() }),
    annotations: mutationAnnotations,
  }, async ({ kind }) => runtimeResult(await runtime.request('resetEffect', { kind })));

  server.registerTool('kgg_capture_preview', {
    title: 'Capture Preview',
    description: 'Capture the current preview as an MCP image content block.',
    inputSchema: z.object({ format: z.enum(['png', 'webp']).optional() }),
    annotations: readAnnotations,
  }, async ({ format }) => previewResult(await runtime.request('capturePreview', { format: format ?? 'png' })));

  server.registerTool('kgg_capture_snapshot', {
    title: 'Capture Snapshot',
    description: 'Capture a serializable rollback snapshot of the connected K-GG state.',
    inputSchema: emptyInput,
    annotations: mutationAnnotations,
  }, async () => runtimeResult(await runtime.request('captureSnapshot')));

  server.registerTool('kgg_restore_snapshot', {
    title: 'Restore Snapshot',
    description: 'Restore a previously captured serializable K-GG state snapshot.',
    inputSchema: z.object({ snapshotId: z.string().min(1) }),
    annotations: mutationAnnotations,
  }, async ({ snapshotId }) => runtimeResult(await runtime.request('restoreSnapshot', { snapshotId })));

  server.registerTool('kgg_dev_run_scenario', {
    title: 'Run Safe Developer Scenario',
    description: 'Run an ordered allowlisted scenario of parameter, effect, snapshot, and bounded wait commands.',
    inputSchema: z.object({
      commands: z.array(z.record(z.string(), z.unknown())).max(32),
      rollbackOnFailure: z.boolean().optional(),
    }),
    annotations: mutationAnnotations,
  }, async ({ commands, rollbackOnFailure }) => runtimeResult(await runtime.request('runScenario', { commands, rollbackOnFailure })));

  return server;
}
