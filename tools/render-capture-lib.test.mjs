import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assertFixedGpuManifest, compareCaptureManifests } from './render-capture-lib.mjs';

async function writeCapture(directory, name, overrides = {}, bytes = [1, 2, 3, 4]) {
  const rawName = `${name}.rgba`;
  await writeFile(path.join(directory, rawName), Uint8Array.from(bytes));
  const sha256 = createHash('sha256').update(Uint8Array.from(bytes)).digest('hex');
  const manifest = {
    schemaVersion: 1,
    kind: 'kgg-render-rgba-capture',
    commitSha: '0123456789abcdef0123456789abcdef01234567',
    runner: { id: 'runner-a', platform: 'win32', arch: 'x64', environmentFingerprint: 'runner-fingerprint-a' },
    browser: { name: 'chromium', version: '123.0', gpuMode: 'swiftshader', binaryPath: 'C:/pw/chrome.exe', launchArgs: ['--use-angle=swiftshader'] },
    playwrightVersion: '1.62.1',
    canvas: { width: 1, height: 1 },
    renderContract: { id: 'default-stack-v2' },
    webgl: {
      executionMode: 'software',
      gpu: {
        webgl: { vendor: 'Google Inc.', renderer: 'ANGLE', unmaskedVendor: 'Google Inc.', unmaskedRenderer: 'SwiftShader Device' },
      },
    },
    errors: [],
    frames: [{ index: 0, normalizedTime: 0, width: 1, height: 1, byteLength: bytes.length, sha256, file: rawName }],
    ...overrides,
  };
  const manifestPath = path.join(directory, `${name}.json`);
  await writeFile(manifestPath, JSON.stringify(manifest));
  return manifestPath;
}

describe('render capture comparison', () => {
  it('requires a fingerprinted non-software renderer for fixed GPU captures', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'kgg-render-capture-'));
    const gpuFingerprint = 'a'.repeat(64);
    const fixed = await writeCapture(directory, 'fixed', {
      runner: {
        id: 'runner-a',
        platform: 'win32',
        arch: 'x64',
        environmentFingerprint: gpuFingerprint,
        inventory: {
          fingerprint: gpuFingerprint,
          condition: {
            os: 'Windows 11',
            osVersion: '10.0.26100',
            gpu: [{ Name: 'NVIDIA RTX 4090', DriverVersion: '1.2.3' }],
          },
        },
      },
      browser: { name: 'chromium', version: '123.0', gpuMode: 'fixed-gpu', binaryPath: 'C:/pw/chrome.exe', launchArgs: ['--enable-gpu'] },
      webgl: {
        executionMode: 'fixed-gpu',
        gpu: {
          webgl: { vendor: 'Google Inc.', renderer: 'ANGLE', unmaskedVendor: 'NVIDIA', unmaskedRenderer: 'NVIDIA RTX 4090' },
        },
      },
    });
    const manifest = JSON.parse(await readFile(fixed, 'utf8'));

    expect(() => assertFixedGpuManifest(manifest)).not.toThrow();
    const reproducible = await compareCaptureManifests(fixed, fixed, { mode: 'reproducibility' });
    expect(reproducible.status).toBe('pass');
    expect(() => assertFixedGpuManifest({
      ...manifest,
      runner: { ...manifest.runner, environmentFingerprint: '' },
    })).toThrow(/fingerprint/i);
    expect(() => assertFixedGpuManifest({
      ...manifest,
      runner: {
        ...manifest.runner,
        inventory: { ...manifest.runner.inventory, fingerprint: 'different-gpu' },
      },
    })).toThrow(/does not match/i);
    const invalidManifest = {
      ...manifest,
      webgl: { ...manifest.webgl, gpu: { webgl: { ...manifest.webgl.gpu.webgl, unmaskedRenderer: 'SwiftShader Device' } } },
    };
    expect(() => assertFixedGpuManifest(invalidManifest)).toThrow(/software renderer/i);
    const invalidPath = path.join(directory, 'fixed-invalid.json');
    await writeFile(invalidPath, JSON.stringify(invalidManifest));
    const invalidComparison = await compareCaptureManifests(fixed, invalidPath, { mode: 'reproducibility' });
    expect(invalidComparison.status).toBe('not-eligible');
    expect(invalidComparison.eligibility.reasons).toContain('second fixed GPU environment is invalid: Fixed GPU capture resolved to a software renderer: SwiftShader Device');
    expect(() => assertFixedGpuManifest({
      ...manifest,
      webgl: { ...manifest.webgl, gpu: { webgl: { ...manifest.webgl.gpu.webgl, unmaskedRenderer: {} } } },
    })).toThrow(/unmasked WebGL renderer/i);
  });

  it('rejects base/head comparison when runner hardware identity changes', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'kgg-render-capture-'));
    const base = await writeCapture(directory, 'base');
    const head = await writeCapture(directory, 'head', {
      commitSha: 'fedcba9876543210fedcba9876543210fedcba98',
      runner: { id: 'runner-a', platform: 'win32', arch: 'x64', environmentFingerprint: 'runner-fingerprint-b' },
    });
    const repeat = await writeCapture(directory, 'repeat');
    const repeatAgain = await writeCapture(directory, 'repeat-again');
    const eligibility = await compareCaptureManifests(repeat, repeatAgain, { mode: 'reproducibility' });

    const report = await compareCaptureManifests(base, head, {
      mode: 'base-head',
      eligibilityReport: eligibility,
    });

    expect(report.status).toBe('not-eligible');
    expect(report.eligibility.reasons).toContain('runner.environmentFingerprint differs');
  });

  it('accepts exact same-commit RGBA captures as reproducible', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'kgg-render-capture-'));
    const first = await writeCapture(directory, 'first');
    const second = await writeCapture(directory, 'second');

    const report = await compareCaptureManifests(first, second, { mode: 'reproducibility' });

    expect(report.status).toBe('pass');
    expect(report.eligibility.status).toBe('pass');
    expect(report.frames[0].equal).toBe(true);
  });

  it('does not compare base/head captures when the eligibility evidence is absent', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'kgg-render-capture-'));
    const first = await writeCapture(directory, 'base');
    const second = await writeCapture(directory, 'head', {
      commitSha: 'fedcba9876543210fedcba9876543210fedcba98',
    });

    const report = await compareCaptureManifests(first, second, { mode: 'base-head' });

    expect(report.status).toBe('not-eligible');
    expect(report.eligibility.status).toBe('not-eligible');
    expect(report.eligibility.reasons).toContain('A prior same-runner reproducibility report is required');
  });

  it('does not treat the same commit as a base/head comparison', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'kgg-render-capture-'));
    const first = await writeCapture(directory, 'base');
    const second = await writeCapture(directory, 'head');
    const repeat = await writeCapture(directory, 'repeat');
    const repeatAgain = await writeCapture(directory, 'repeat-again');
    const eligibility = await compareCaptureManifests(repeat, repeatAgain, { mode: 'reproducibility' });

    const report = await compareCaptureManifests(first, second, {
      mode: 'base-head',
      eligibilityReport: eligibility,
    });

    expect(report.status).toBe('not-eligible');
    expect(report.eligibility.reasons).toContain('base/head commitSha must differ');
  });

  it('reports exact RGBA mismatches after eligible base/head comparison', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'kgg-render-capture-'));
    const base = await writeCapture(directory, 'base');
    const head = await writeCapture(directory, 'head', {
      commitSha: 'fedcba9876543210fedcba9876543210fedcba98',
    }, [1, 2, 3, 5]);
    const first = await writeCapture(directory, 'repeat-a');
    const second = await writeCapture(directory, 'repeat-b');
    const eligibility = await compareCaptureManifests(first, second, { mode: 'reproducibility' });

    const report = await compareCaptureManifests(base, head, {
      mode: 'base-head',
      eligibilityReport: eligibility,
    });

    expect(report.status).toBe('mismatch');
    expect(report.frames[0].equal).toBe(false);
  });

  it('rejects a passing reproducibility report from another runner', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'kgg-render-capture-'));
    const base = await writeCapture(directory, 'base');
    const head = await writeCapture(directory, 'head', {
      commitSha: 'fedcba9876543210fedcba9876543210fedcba98',
    });
    const prior = await writeCapture(directory, 'prior', {
      runner: { id: 'different-runner', platform: 'win32', arch: 'x64' },
    });
    const priorRepeat = await writeCapture(directory, 'prior-repeat', {
      runner: { id: 'different-runner', platform: 'win32', arch: 'x64' },
    });
    const eligibility = await compareCaptureManifests(prior, priorRepeat, { mode: 'reproducibility' });

    const report = await compareCaptureManifests(base, head, {
      mode: 'base-head',
      eligibilityReport: eligibility,
    });

    expect(report.status).toBe('not-eligible');
    expect(report.eligibility.reasons).toContain('The prior reproducibility report does not describe the current runner');
  });

  it('rejects a passing reproducibility report from another Playwright version', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'kgg-render-capture-'));
    const base = await writeCapture(directory, 'base');
    const head = await writeCapture(directory, 'head', {
      commitSha: 'fedcba9876543210fedcba9876543210fedcba98',
    });
    const prior = await writeCapture(directory, 'prior');
    const priorRepeat = await writeCapture(directory, 'prior-repeat');
    const eligibility = await compareCaptureManifests(prior, priorRepeat, { mode: 'reproducibility' });
    eligibility.first.playwrightVersion = '1.63.0';
    eligibility.second.playwrightVersion = '1.63.0';

    const report = await compareCaptureManifests(base, head, {
      mode: 'base-head',
      eligibilityReport: eligibility,
    });

    expect(report.status).toBe('not-eligible');
    expect(report.eligibility.reasons).toContain('The prior reproducibility report does not describe the current Playwright version');
  });

  it('rejects a manifest whose raw RGBA length does not match its dimensions', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'kgg-render-capture-'));
    const invalid = await writeCapture(directory, 'invalid', {
      frames: [{
        index: 0,
        normalizedTime: 0,
        width: 1,
        height: 1,
        byteLength: 3,
        sha256: createHash('sha256').update(Uint8Array.from([1, 2, 3, 4])).digest('hex'),
        file: 'invalid.rgba',
      }],
    });

    await expect(compareCaptureManifests(invalid, invalid, { mode: 'reproducibility' }))
      .rejects.toThrow(/width.*height.*4/i);
  });
});
