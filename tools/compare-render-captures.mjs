import { readFile } from 'node:fs/promises';
import { compareCaptureManifests, writeJson } from './render-capture-lib.mjs';

function argumentValue(name, required = true) {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value && required) throw new Error(`Missing required argument ${name}`);
  return value;
}

const mode = argumentValue('--mode') || 'reproducibility';
const first = argumentValue('--first');
const second = argumentValue('--second');
const eligibilityPath = argumentValue('--eligibility', false);
const output = argumentValue('--output', false);

try {
  const eligibilityReport = eligibilityPath
    ? JSON.parse(await readFile(eligibilityPath, 'utf8'))
    : undefined;
  const report = await compareCaptureManifests(first, second, { mode, eligibilityReport });
  if (output) await writeJson(output, report);
  console.log(JSON.stringify(report, null, 2));
  if (report.status === 'not-eligible') process.exitCode = 2;
  else if (report.status !== 'pass') process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
}
