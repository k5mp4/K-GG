import { mkdtemp, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { compareCaptureManifests } from './render-capture-lib.mjs';

async function writeCapture(directory, name, overrides = {}, bytes = [1, 2, 3, 4]) {
  const rawName = `${name}.rgba`;
  await writeFile(path.join(directory, rawName), Uint8Array.from(bytes));
  const sha256 = createHash('sha256').update(Uint8Array.from(bytes)).digest('hex');
  const manifest = {
    schemaVersion: 1,
    kind: 'kgg-render-rgba-capture',
    commitSha: '0123456789abcdef0123456789abcdef01234567',
    runner: { id: 'runner-a', platform: 'win32', arch: 'x64' },
    browser: { name: 'chromium', version: '123.0' },
    playwrightVersion: '1.62.1',
    canvas: { width: 1, height: 1 },
    renderContract: { id: 'default-stack-v2' },
    errors: [],
    frames: [{ index: 0, normalizedTime: 0, width: 1, height: 1, byteLength: bytes.length, sha256, file: rawName }],
    ...overrides,
  };
  const manifestPath = path.join(directory, `${name}.json`);
  await writeFile(manifestPath, JSON.stringify(manifest));
  return manifestPath;
}

describe('render capture comparison', () => {
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
