import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const RENDER_CAPTURE_SCHEMA_VERSION = 1;
export const RENDER_CAPTURE_KIND = 'kgg-render-rgba-capture';

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]));
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(stableValue(value));
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function fail(message) {
  throw new Error(`Invalid render capture: ${message}`);
}

function requireString(value, field) {
  if (typeof value !== 'string' || value.length === 0) fail(`${field} must be a non-empty string`);
  return value;
}

function requirePositiveInteger(value, field) {
  if (!Number.isInteger(value) || value < 1) fail(`${field} must be a positive integer`);
  return value;
}

function validateManifest(manifest) {
  if (!isRecord(manifest)) fail('manifest must be an object');
  if (manifest.schemaVersion !== RENDER_CAPTURE_SCHEMA_VERSION) fail('unsupported schemaVersion');
  if (manifest.kind !== RENDER_CAPTURE_KIND) fail('unexpected kind');
  requireString(manifest.commitSha, 'commitSha');
  if (!/^[0-9a-f]{7,64}$/i.test(manifest.commitSha)) fail('commitSha must be a hexadecimal Git commit');
  if (!isRecord(manifest.runner)) fail('runner is missing');
  requireString(manifest.runner.id, 'runner.id');
  requireString(manifest.runner.platform, 'runner.platform');
  requireString(manifest.runner.arch, 'runner.arch');
  if (!isRecord(manifest.browser)) fail('browser is missing');
  requireString(manifest.browser.name, 'browser.name');
  requireString(manifest.browser.version, 'browser.version');
  requireString(manifest.playwrightVersion, 'playwrightVersion');
  if (!isRecord(manifest.canvas)) fail('canvas is missing');
  requirePositiveInteger(manifest.canvas.width, 'canvas.width');
  requirePositiveInteger(manifest.canvas.height, 'canvas.height');
  if (!isRecord(manifest.renderContract)) fail('renderContract is missing');
  if (!Array.isArray(manifest.frames) || manifest.frames.length === 0) fail('frames must be non-empty');
  if (!Array.isArray(manifest.errors)) fail('errors must be an array');
  for (const [index, frame] of manifest.frames.entries()) {
    if (!isRecord(frame)) fail(`frames[${index}] must be an object`);
    if (frame.index !== index) fail(`frames[${index}].index must be ${index}`);
    if (!Number.isFinite(frame.normalizedTime)) fail(`frames[${index}].normalizedTime must be finite`);
    requirePositiveInteger(frame.width, `frames[${index}].width`);
    requirePositiveInteger(frame.height, `frames[${index}].height`);
    if (frame.width !== manifest.canvas.width || frame.height !== manifest.canvas.height) {
      fail(`frames[${index}] dimensions must match canvas dimensions`);
    }
    requirePositiveInteger(frame.byteLength, `frames[${index}].byteLength`);
    if (frame.byteLength !== frame.width * frame.height * 4) {
      fail(`frames[${index}].byteLength must equal width × height × 4 for RGBA8`);
    }
    if (!/^[0-9a-f]{64}$/i.test(frame.sha256 ?? '')) fail(`frames[${index}].sha256 must be SHA-256`);
    const file = requireString(frame.file, `frames[${index}].file`);
    if (path.isAbsolute(file) || file.includes('\\') || file.split('/').includes('..')) {
      fail(`frames[${index}].file must be a relative path inside the capture directory`);
    }
  }
}

export async function readCaptureManifest(manifestPath) {
  const absoluteManifestPath = path.resolve(manifestPath);
  let manifest;
  try {
    manifest = JSON.parse(await readFile(absoluteManifestPath, 'utf8'));
  } catch (error) {
    fail(`cannot read ${absoluteManifestPath} (${error instanceof Error ? error.message : String(error)})`);
  }
  validateManifest(manifest);
  const directory = path.dirname(absoluteManifestPath);
  const frames = [];
  for (const frame of manifest.frames) {
    const framePath = path.resolve(directory, frame.file);
    const relative = path.relative(directory, framePath);
    if (relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      fail(`frame path escapes the capture directory: ${frame.file}`);
    }
    let bytes;
    try {
      bytes = await readFile(framePath);
    } catch (error) {
      fail(`cannot read frame ${frame.file} (${error instanceof Error ? error.message : String(error)})`);
    }
    const actualSha256 = sha256(bytes);
    const integrityErrors = [];
    if (bytes.byteLength !== frame.byteLength) integrityErrors.push(`byte length ${bytes.byteLength} !== ${frame.byteLength}`);
    if (actualSha256.toLowerCase() !== frame.sha256.toLowerCase()) integrityErrors.push('SHA-256 does not match');
    frames.push({ manifest: frame, path: framePath, bytes, actualSha256, integrityErrors });
  }
  return { path: absoluteManifestPath, directory, manifest, frames };
}

function environmentDifferences(first, second) {
  const differences = [];
  const pairs = [
    ['runner.id', first.runner.id, second.runner.id],
    ['runner.platform', first.runner.platform, second.runner.platform],
    ['runner.arch', first.runner.arch, second.runner.arch],
    ['browser.name', first.browser.name, second.browser.name],
    ['browser.version', first.browser.version, second.browser.version],
    ['browser.headless', first.browser.headless ?? null, second.browser.headless ?? null],
    ['browser.gpuMode', first.browser.gpuMode ?? null, second.browser.gpuMode ?? null],
    ['playwrightVersion', first.playwrightVersion, second.playwrightVersion],
    ['canvas', stableJson(first.canvas), stableJson(second.canvas)],
    ['renderContract', stableJson(first.renderContract ?? null), stableJson(second.renderContract ?? null)],
    ['webgl.executionMode', first.webgl?.executionMode ?? null, second.webgl?.executionMode ?? null],
    ['webgl.gpu', stableJson(first.webgl?.gpu ?? null), stableJson(second.webgl?.gpu ?? null)],
  ];
  for (const [field, firstValue, secondValue] of pairs) {
    if (firstValue !== secondValue) differences.push(`${field} differs`);
  }
  return differences;
}

function captureErrors(capture, label) {
  const errors = [];
  if (capture.manifest.errors.length > 0) errors.push(`${label} capture includes errors`);
  for (const frame of capture.frames) {
    for (const error of frame.integrityErrors) errors.push(`${label} frame ${frame.manifest.index}: ${error}`);
  }
  return errors;
}

function eligibilityFor(first, second, mode, eligibilityReport) {
  const reasons = [
    ...captureErrors(first, 'first'),
    ...captureErrors(second, 'second'),
    ...environmentDifferences(first.manifest, second.manifest),
  ];
  if (first.frames.length !== second.frames.length) reasons.push('frame count differs');
  if (mode === 'reproducibility' && first.manifest.commitSha !== second.manifest.commitSha) {
    reasons.push('commitSha differs for reproducibility comparison');
  }
  if (mode === 'base-head') {
    if (!eligibilityReport) {
      reasons.push('A prior same-runner reproducibility report is required');
    } else if (eligibilityReport.status !== 'pass' || eligibilityReport.mode !== 'reproducibility') {
      reasons.push('The prior reproducibility report did not pass');
    } else if (!isRecord(eligibilityReport.first) || !isRecord(eligibilityReport.second)) {
      reasons.push('The prior reproducibility report is missing capture identities');
    } else {
      const priorFirst = eligibilityReport.first;
      const priorSecond = eligibilityReport.second;
      if (priorFirst.commitSha !== first.manifest.commitSha || priorSecond.commitSha !== first.manifest.commitSha) {
        reasons.push('The prior reproducibility report does not describe the current base commit');
      }
      if (stableJson(priorFirst.runner ?? null) !== stableJson(first.manifest.runner)
        || stableJson(priorSecond.runner ?? null) !== stableJson(first.manifest.runner)) {
        reasons.push('The prior reproducibility report does not describe the current runner');
      }
      if (stableJson(priorFirst.browser ?? null) !== stableJson(first.manifest.browser)
        || stableJson(priorSecond.browser ?? null) !== stableJson(first.manifest.browser)) {
        reasons.push('The prior reproducibility report does not describe the current browser');
      }
    }
  }
  return {
    status: reasons.length === 0 ? 'pass' : 'not-eligible',
    reasons,
  };
}

function frameComparison(first, second) {
  const count = Math.max(first.frames.length, second.frames.length);
  return Array.from({ length: count }, (_, index) => {
    const firstFrame = first.frames[index];
    const secondFrame = second.frames[index];
    if (!firstFrame || !secondFrame) {
      return { index, equal: false, reason: 'frame is missing from one capture' };
    }
    const metadataEqual = firstFrame.manifest.width === secondFrame.manifest.width
      && firstFrame.manifest.height === secondFrame.manifest.height
      && firstFrame.manifest.normalizedTime === secondFrame.manifest.normalizedTime;
    const equal = metadataEqual
      && firstFrame.bytes.byteLength === secondFrame.bytes.byteLength
      && Buffer.from(firstFrame.bytes).equals(Buffer.from(secondFrame.bytes));
    return {
      index,
      normalizedTime: firstFrame.manifest.normalizedTime,
      equal,
      metadataEqual,
      firstSha256: firstFrame.actualSha256,
      secondSha256: secondFrame.actualSha256,
      firstByteLength: firstFrame.bytes.byteLength,
      secondByteLength: secondFrame.bytes.byteLength,
    };
  });
}

export async function compareCaptureManifests(firstPath, secondPath, options = {}) {
  const mode = options.mode ?? 'reproducibility';
  if (mode !== 'reproducibility' && mode !== 'base-head') throw new Error(`Unsupported comparison mode: ${mode}`);
  const [first, second] = await Promise.all([
    readCaptureManifest(firstPath),
    readCaptureManifest(secondPath),
  ]);
  const eligibility = eligibilityFor(first, second, mode, options.eligibilityReport);
  const frames = eligibility.status === 'pass' ? frameComparison(first, second) : [];
  const status = eligibility.status !== 'pass'
    ? 'not-eligible'
    : frames.every(frame => frame.equal) ? 'pass' : 'mismatch';
  return {
    schemaVersion: RENDER_CAPTURE_SCHEMA_VERSION,
    kind: 'kgg-render-rgba-comparison',
    mode,
    status,
    first: {
      manifest: first.path,
      commitSha: first.manifest.commitSha,
      runner: first.manifest.runner,
      browser: first.manifest.browser,
    },
    second: {
      manifest: second.path,
      commitSha: second.manifest.commitSha,
      runner: second.manifest.runner,
      browser: second.manifest.browser,
    },
    eligibility,
    frames,
  };
}

export async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
