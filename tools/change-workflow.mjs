import { existsSync, readFileSync } from 'node:fs';
import { readdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const docsDir = path.join(root, 'docs');
const currentSpecDir = path.join(docsDir, 'specs', 'current');
const changeDir = path.join(docsDir, 'changes');
const allowedStatuses = new Set([
  'draft',
  'review',
  'approved',
  'implemented',
  'archived',
  'cancelled',
]);
const allowedKinds = new Set(['S', 'B', 'F', 'A', 'X']);
const allowedOutcomes = new Set([
  'merged',
  'follow-up',
  'cancelled',
  'superseded',
]);
const knownChangeFiles = new Set([
  'proposal.md',
  'delta.md',
  'design.md',
  'tasks.md',
  'validation.md',
]);

function parseList(value) {
  const trimmed = value.trim();
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return null;
  const body = trimmed.slice(1, -1).trim();
  if (!body) return [];
  return body.split(',').map(item => item.trim().replace(/^['"]|['"]$/g, ''));
}

function parseScalar(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) return trimmed.slice(1, -1).replaceAll("''", "'");
  return trimmed;
}

export function parseFrontmatter(content, file = 'document') {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`${file}: frontmatter is missing`);

  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const separator = line.indexOf(':');
    if (separator < 1) throw new Error(`${file}: invalid frontmatter line: ${line}`);
    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();
    const value = rawValue.startsWith('[') ? parseList(rawValue) : parseScalar(rawValue);
    if (value === null) throw new Error(`${file}: ${key} must use a one-line YAML list`);
    data[key] = value;
  }
  return { data, body: content.slice(match[0].length) };
}

export function updateFrontmatter(content, updates) {
  return content.replace(/^---\r?\n([\s\S]*?)\r?\n---(?=\r?\n|$)/, (full, body) => {
    const lines = body.split(/\r?\n/);
    const seen = new Set();
    const updatedLines = lines.map(line => {
      const separator = line.indexOf(':');
      if (separator < 1) return line;
      const key = line.slice(0, separator).trim();
      if (!Object.hasOwn(updates, key)) return line;
      seen.add(key);
      return `${key}: ${formatScalar(updates[key])}`;
    });
    for (const [key, value] of Object.entries(updates)) {
      if (!seen.has(key)) updatedLines.push(`${key}: ${formatScalar(value)}`);
    }
    return `---\n${updatedLines.join('\n')}\n---`;
  });
}

function formatScalar(value) {
  if (typeof value !== 'string') return value;
  return /:\s|[\r\n]/.test(value) ? JSON.stringify(value) : value;
}

function currentDate() {
  return process.env.CHANGE_DATE ?? new Date().toISOString().slice(0, 10);
}

function parseOptions(argv) {
  const options = { positional: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--require-empty') {
      options.requireEmpty = true;
    } else if (argument === '--migration') {
      options.migration = true;
    } else if (argument.startsWith('--outcome=')) {
      options.outcome = argument.slice('--outcome='.length);
    } else if (argument === '--outcome') {
      options.outcome = argv[++index];
    } else if (argument.startsWith('--follow-up=')) {
      options.followUp = argument.slice('--follow-up='.length);
    } else if (argument === '--follow-up') {
      options.followUp = argv[++index];
    } else if (argument === '--help' || argument === '-h') {
      options.help = true;
    } else {
      options.positional.push(argument);
    }
  }
  return options;
}

function currentBranch() {
  if (process.env.GITHUB_REF_NAME) return process.env.GITHUB_REF_NAME;
  try {
    return execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function shouldRequireEmpty(options) {
  return options.requireEmpty ?? currentBranch() === 'main';
}

function validateDate(value, label, errors) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) {
    errors.push(`${label}: date must be YYYY-MM-DD`);
  }
}

function validateList(value, label, errors, allowEmpty = true) {
  if (!Array.isArray(value)) {
    errors.push(`${label}: must be a one-line YAML list`);
  } else if (!allowEmpty && value.length === 0) {
    errors.push(`${label}: must not be empty`);
  }
}

function validateDelta(content, relativePath, errors) {
  if (!content) return;
  for (const heading of ['ADDED Requirements', 'MODIFIED Requirements', 'REMOVED Requirements']) {
    if (!new RegExp(`^##\\s+${heading}$`, 'm').test(content)) {
      errors.push(`${relativePath}: missing "## ${heading}"`);
    }
  }
}

async function loadChange(bucket, directory) {
  const absoluteDirectory = path.join(changeDir, bucket, directory);
  const relativeDirectory = path.posix.join('docs', 'changes', bucket, directory);
  const fileContents = {};
  for (const name of knownChangeFiles) {
    const filePath = path.join(absoluteDirectory, name);
    fileContents[name] = existsSync(filePath) ? await readFile(filePath, 'utf8') : null;
  }
  const errors = [];
  if (!fileContents['proposal.md']) {
    errors.push(`${relativeDirectory}: proposal.md is required for a Change Capsule`);
    return { bucket, directory, absoluteDirectory, relativeDirectory, files: fileContents, data: {}, errors };
  }

  let parsed;
  try {
    parsed = parseFrontmatter(fileContents['proposal.md'], `${relativeDirectory}/proposal.md`);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
    return { bucket, directory, absoluteDirectory, relativeDirectory, files: fileContents, data: {}, errors };
  }

  const data = parsed.data;
  for (const field of ['type', 'id', 'title', 'status', 'change_kind', 'owners', 'created', 'updated', 'current_specs', 'related_adrs', 'human_review']) {
    if (data[field] === undefined || data[field] === '' || (field === 'owners' && Array.isArray(data[field]) && data[field].length === 0)) {
      errors.push(`${relativeDirectory}/proposal.md: required field "${field}" is missing`);
    }
  }
  if (data.type !== 'change') errors.push(`${relativeDirectory}/proposal.md: type must be change`);
  if (!/^CHANGE-\d{3}$/.test(data.id ?? '')) errors.push(`${relativeDirectory}/proposal.md: invalid change id "${data.id ?? ''}"`);
  if (!allowedStatuses.has(data.status)) errors.push(`${relativeDirectory}/proposal.md: invalid status "${data.status ?? ''}"`);
  if (!allowedKinds.has(data.change_kind)) errors.push(`${relativeDirectory}/proposal.md: invalid change_kind "${data.change_kind ?? ''}"`);
  if (!['required', 'completed'].includes(data.human_review)) errors.push(`${relativeDirectory}/proposal.md: human_review must be required or completed`);
  validateList(data.owners, `${relativeDirectory}/proposal.md: owners`, errors, false);
  validateList(data.current_specs, `${relativeDirectory}/proposal.md: current_specs`, errors);
  validateList(data.related_adrs, `${relativeDirectory}/proposal.md: related_adrs`, errors);
  validateDate(data.created, `${relativeDirectory}/proposal.md: created`, errors);
  validateDate(data.updated, `${relativeDirectory}/proposal.md: updated`, errors);
  if (bucket === 'archive' && data.status !== 'archived') errors.push(`${relativeDirectory}/proposal.md: archive entries must have status archived`);
  if (bucket === 'active' && data.status === 'archived') errors.push(`${relativeDirectory}/proposal.md: archived entries belong under docs/changes/archive`);
  if (data.outcome !== undefined && !allowedOutcomes.has(data.outcome)) errors.push(`${relativeDirectory}/proposal.md: invalid outcome "${data.outcome}"`);
  if (data.outcome === 'follow-up' && !data.follow_up) errors.push(`${relativeDirectory}/proposal.md: outcome follow-up requires follow_up`);
  if (data.migration !== undefined && data.migration !== 'historical') errors.push(`${relativeDirectory}/proposal.md: invalid migration "${data.migration}"`);
  const historicalMigration = data.status === 'archived'
    && data.outcome === 'follow-up'
    && data.migration === 'historical';
  if (['approved', 'implemented'].includes(data.status) && data.human_review !== 'completed') {
    errors.push(`${relativeDirectory}/proposal.md: ${data.status} changes require completed human review`);
  }
  if (data.status === 'archived' && !historicalMigration && data.human_review !== 'completed') {
    errors.push(`${relativeDirectory}/proposal.md: archived changes require completed human review unless marked as historical migration`);
  }
  validateDelta(fileContents['delta.md'], `${relativeDirectory}/delta.md`, errors);

  return { bucket, directory, absoluteDirectory, relativeDirectory, files: fileContents, data, errors };
}

async function loadChanges() {
  const changes = [];
  for (const bucket of ['active', 'archive']) {
    const bucketPath = path.join(changeDir, bucket);
    if (!existsSync(bucketPath)) {
      changes.push({ bucket, directory: '', relativeDirectory: `docs/changes/${bucket}`, files: {}, data: {}, errors: [`docs/changes/${bucket}: directory is missing`] });
      continue;
    }
    const entries = await readdir(bucketPath, { withFileTypes: true });
    for (const entry of entries.filter(item => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
      changes.push(await loadChange(bucket, entry.name));
    }
  }
  return changes;
}

async function loadCurrentSpecs() {
  const specs = new Map();
  if (!existsSync(currentSpecDir)) return specs;
  const entries = await readdir(currentSpecDir, { withFileTypes: true });
  for (const entry of entries.filter(item => item.isFile() && item.name.endsWith('.md') && !['_template.md', 'index.md'].includes(item.name))) {
    const filePath = path.join(currentSpecDir, entry.name);
    const content = await readFile(filePath, 'utf8');
    try {
      const parsed = parseFrontmatter(content, path.posix.join('docs', 'specs', 'current', entry.name));
      specs.set(parsed.data.id, { path: filePath, relativePath: path.posix.join('docs', 'specs', 'current', entry.name), data: parsed.data });
    } catch {
      // docs:check reports malformed current spec metadata; this tool only checks resolvable reverse references.
    }
  }
  return specs;
}

function parseIndexRows(content) {
  return content.split(/\r?\n/).flatMap(line => {
    const match = line.match(/^\|\s*([^|]+?)\s*\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|\s*([^|]+?)\s*\|$/);
    if (!match) return [];
    return [{ id: match[1].trim(), title: match[2].trim(), link: match[3].trim(), status: match[4].trim() }];
  });
}

export function hasMergeGatePass(content) {
  const header = content.match(/^##[ \t]+Merge Gate[ \t]*\r?\n/m);
  if (!header || header.index === undefined) return false;
  const sectionStart = header.index + header[0].length;
  const remainder = content.slice(sectionStart);
  const nextHeading = remainder.search(/^##[ \t]+/m);
  const section = nextHeading === -1 ? remainder : remainder.slice(0, nextHeading);
  const statuses = [...section.matchAll(/\|\s*(pass|fail|partial|manual|not-run|pending|not-applicable)\s*\|/gi)].map(item => item[1].toLowerCase());
  return statuses.length > 0 && statuses.every(status => status === 'pass' || status === 'not-applicable');
}

function candidateDocPaths(filePath, target) {
  const withoutFragment = target.split('#', 1)[0].trim();
  if (!withoutFragment || /^(?:https?:|mailto:|data:|javascript:)/i.test(withoutFragment)) return [];
  let basePath;
  if (withoutFragment.startsWith('/')) {
    basePath = withoutFragment === '/' ? docsDir : path.join(docsDir, withoutFragment.slice(1));
  } else {
    basePath = path.resolve(path.dirname(filePath), withoutFragment);
  }
  return [
    basePath,
    `${basePath}.md`,
    path.join(basePath, 'index.md'),
  ];
}

export function findBrokenMarkdownLinks(filePath, content) {
  const broken = [];
  for (const match of content.matchAll(/\]\(([^)]+)\)/g)) {
    const target = match[1].trim().replace(/^<|>$/g, '');
    const candidates = candidateDocPaths(filePath, target);
    if (candidates.length > 0 && !candidates.some(candidate => existsSync(candidate))) {
      broken.push(target);
    }
  }
  return broken;
}

async function listMarkdownFiles(directory) {
  const result = [];
  if (!existsSync(directory)) return result;
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '.vitepress' || entry.name === 'dist') continue;
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await listMarkdownFiles(filePath));
    else if (entry.isFile() && entry.name.endsWith('.md')) result.push(filePath);
  }
  return result;
}

async function validateLinks(errors) {
  for (const filePath of await listMarkdownFiles(docsDir)) {
    const content = await readFile(filePath, 'utf8');
    for (const target of findBrokenMarkdownLinks(filePath, content)) {
      errors.push(`${path.relative(root, filePath).replaceAll('\\', '/')}: broken local link "${target}"`);
    }
  }
}

function validateIndexes(changes, errors) {
  for (const bucket of ['active', 'archive']) {
    const indexPath = path.join(changeDir, bucket, 'index.md');
    if (!existsSync(indexPath)) {
      errors.push(`docs/changes/${bucket}/index.md: index is missing`);
      continue;
    }
    const rows = parseIndexRows(readFileSync(indexPath, 'utf8'));
    const entries = changes.filter(change => change.bucket === bucket && change.data.id);
    const expected = new Map(entries.map(change => [change.data.id, {
      title: change.data.title,
      link: `./${change.directory}/proposal`,
      status: change.data.status,
    }]));
    const seen = new Set();
    for (const row of rows) {
      if (seen.has(row.id)) errors.push(`docs/changes/${bucket}/index.md: duplicate index entry "${row.id}"`);
      seen.add(row.id);
      if (/^CHANGE-\d{3}$/.test(row.id) && !expected.has(row.id)) errors.push(`docs/changes/${bucket}/index.md: stale index entry "${row.id}"`);
      const expectedRow = expected.get(row.id);
      if (expectedRow && (row.title !== expectedRow.title || row.link !== expectedRow.link || row.status !== expectedRow.status)) {
        errors.push(`docs/changes/${bucket}/index.md: entry for ${row.id} does not match proposal metadata`);
      }
    }
    for (const [id, expectedRow] of expected) {
      if (!seen.has(id)) errors.push(`docs/changes/${bucket}/index.md: missing index entry for ${id}`);
      if (!expectedRow.title) errors.push(`docs/changes/${bucket}/${id}: title is empty`);
    }
  }
}

async function validateCurrentSpecReferences(changes, errors, warnings) {
  const specs = await loadCurrentSpecs();
  for (const change of changes) {
    if (!change.data.id || !Array.isArray(change.data.current_specs)) continue;
    for (const specId of change.data.current_specs) {
      const spec = specs.get(specId);
      if (!spec) {
        errors.push(`${change.relativeDirectory}/proposal.md: unknown current specification "${specId}"`);
        continue;
      }
      const related = Array.isArray(spec.data.related_changes) ? spec.data.related_changes : [];
      if (!related.includes(change.data.id)) {
        const message = `${spec.relativePath}: related_changes does not include ${change.data.id}`;
        if (change.data.outcome) errors.push(message);
        else warnings.push(message);
      }
    }
  }
}

export async function inspectRepository({ requireEmptyActive = false } = {}) {
  const changes = await loadChanges();
  const errors = changes.flatMap(change => change.errors ?? []);
  const warnings = [];
  await validateCurrentSpecReferences(changes, errors, warnings);
  validateIndexes(changes, errors);
  await validateLinks(errors);
  const active = changes.filter(change => change.bucket === 'active' && change.data.id);
  if (requireEmptyActive && active.length > 0) {
    errors.push(`main must not contain Active Changes (${active.map(change => change.data.id).join(', ')})`);
  }
  return { changes, active, archive: changes.filter(change => change.bucket === 'archive' && change.data.id), errors, warnings };
}

function changeIndexContent(bucket, changes) {
  const rows = changes
    .filter(change => change.bucket === bucket && change.data.id)
    .sort((a, b) => a.data.id.localeCompare(b.data.id, 'en'))
    .map(change => `| ${change.data.id} | [${change.data.title}](./${change.directory}/proposal) | ${change.data.status} |`);
  const body = rows.length > 0 ? rows.join('\n') : '| なし | Active Changeはありません | - |';
  if (bucket === 'active') {
    return `---\ntitle: 進行中の変更\n---\n\n# 進行中の変更\n\nActive ChangeはDesigned ChangeのPR中だけに置きます。mainへマージする前にCurrent Spec/ADRを同期し、\`npm run change:finalize CHANGE-###\`でArchiveへ移動してください。Quick ChangeにはChange directoryを作りません。\n\n| ID | 変更 | 状態 |\n| --- | --- | --- |\n${body}\n`;
  }
  return `---\ntitle: 完了済み変更\n---\n\n# 完了済み変更\n\nArchiveは過去の変更履歴です。現在の動作を確認するときは先に[現行仕様](../../specs/current/)を読みます。\`outcome: follow-up\`の記録は、未完了AC、Release Gate、ObservationなどをIssueへ移すための追跡情報です。\n\n| ID | 変更 | 状態 |\n| --- | --- | --- |\n${body}\n`;
}

async function rebuildIndexes() {
  const changes = await loadChanges();
  for (const bucket of ['active', 'archive']) {
    await writeFile(path.join(changeDir, bucket, 'index.md'), changeIndexContent(bucket, changes));
  }
}

function appendFinalization(content, { outcome, followUp, migration }) {
  const marker = '\n## Finalization\n';
  const lines = [
    marker,
    `- Finalized: ${currentDate()}`,
    `- Outcome: \`${outcome}\``,
    migration ? '- Mode: historical migration; this move does not claim that every acceptance criterion passed.' : '- Mode: normal implementation finalization.',
  ];
  if (followUp) lines.push(`- Follow-up: ${followUp}`);
  return content.includes(marker) ? content : `${content.trimEnd()}\n${lines.join('\n')}\n`;
}

function findChangeById(changes, id) {
  return changes.find(change => change.bucket === 'active' && change.data.id === id);
}

async function finalizeChange(id, options) {
  if (!/^CHANGE-\d{3}$/.test(id ?? '')) throw new Error(`usage: change:finalize CHANGE-### [--migration --outcome=... --follow-up=...]`);
  const changes = await loadChanges();
  const change = findChangeById(changes, id);
  if (!change) {
    const archived = changes.find(candidate => candidate.bucket === 'archive' && candidate.data.id === id);
    if (archived) {
      console.log(`${id} is already archived at ${archived.relativeDirectory}.`);
      return;
    }
    throw new Error(`${id} was not found under docs/changes/active`);
  }
  if (change.errors.length > 0) throw new Error(change.errors.join('\n'));

  const outcome = options.outcome ?? (options.migration ? 'follow-up' : 'merged');
  if (!allowedOutcomes.has(outcome)) throw new Error(`invalid outcome "${outcome}"`);
  if (outcome === 'follow-up' && !options.followUp && !change.data.follow_up) {
    throw new Error('outcome follow-up requires --follow-up="..."');
  }
  if (!options.migration) {
    if (change.data.status !== 'implemented') throw new Error(`${id} must have status implemented before normal finalize`);
    if (change.data.human_review !== 'completed') throw new Error(`${id} requires human_review: completed before normal finalize`);
    if (!change.files['validation.md'] || !hasMergeGatePass(change.files['validation.md'])) {
      throw new Error(`${id} requires a passing ## Merge Gate in validation.md before normal finalize`);
    }
    const specs = await loadCurrentSpecs();
    for (const specId of change.data.current_specs ?? []) {
      const spec = specs.get(specId);
      if (!spec) throw new Error(`${id} references unknown current specification ${specId}`);
      if (!(spec.data.related_changes ?? []).includes(id)) throw new Error(`${spec.relativePath} must include ${id} in related_changes before finalize`);
    }
  }

  const followUp = options.followUp ?? change.data.follow_up;
  const archiveDirectory = path.join(changeDir, 'archive', change.directory);
  if (existsSync(archiveDirectory)) throw new Error(`archive target already exists: ${path.posix.join('docs', 'changes', 'archive', change.directory)}`);
  const proposalPath = path.join(change.absoluteDirectory, 'proposal.md');
  let proposal = await readFile(proposalPath, 'utf8');
  proposal = updateFrontmatter(proposal, {
    status: 'archived',
    updated: currentDate(),
    outcome,
    ...(options.migration ? { migration: 'historical' } : {}),
    ...(followUp ? { follow_up: followUp } : {}),
  });
  proposal = appendFinalization(proposal, { outcome, followUp, migration: Boolean(options.migration) });
  await writeFile(proposalPath, proposal);

  await rename(change.absoluteDirectory, archiveDirectory);
  await rebuildIndexes();
  console.log(`${id} finalized to docs/changes/archive/${change.directory} (${outcome}).`);
}

function printCheck(result, requireEmpty) {
  const branch = currentBranch() || '(unknown)';
  console.log(`Change check on ${branch}: ${result.active.length} active, ${result.archive.length} archive entries.`);
  if (!requireEmpty && result.active.length > 0) console.log('Active Change is allowed here because this is not main.');
  for (const warning of result.warnings) console.warn(`warning: ${warning}`);
  if (result.errors.length > 0) {
    console.error('Change checks failed:');
    for (const error of result.errors) console.error(`- ${error}`);
    return false;
  }
  console.log('Change checks passed.');
  return true;
}

function printHelp() {
  console.log(`Usage:\n  npm run change:check [-- --require-empty]\n  npm run change:finalize CHANGE-###\n  npm run change:finalize CHANGE-### -- --migration --outcome=follow-up --follow-up="issue-needed: ..."`);
}

export async function main(argv = process.argv.slice(2)) {
  const [command = 'check', ...rest] = argv;
  const options = parseOptions(rest);
  if (options.help) {
    printHelp();
    return 0;
  }
  if (command === 'check') {
    const result = await inspectRepository({ requireEmptyActive: shouldRequireEmpty(options) });
    return printCheck(result, shouldRequireEmpty(options)) ? 0 : 1;
  }
  if (command === 'finalize') {
    await finalizeChange(options.positional[0], options);
    return 0;
  }
  printHelp();
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    process.exitCode = await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
