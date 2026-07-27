import { existsSync, readFileSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const docsDir = path.join(root, 'docs');
const specDir = path.join(docsDir, 'specs');
const currentSpecDir = path.join(specDir, 'current');
const changeDir = path.join(docsDir, 'changes');
const adrDir = path.join(docsDir, 'adr');

const allowedLegacySpecStatuses = new Set([
  'draft',
  'review',
  'approved',
  'implemented',
  'deprecated',
]);
const allowedAdrStatuses = new Set([
  'proposed',
  'accepted',
  'deprecated',
  'superseded',
]);
const allowedChangeStatuses = new Set([
  'draft',
  'review',
  'approved',
  'implemented',
  'archived',
  'cancelled',
]);

function parseList(value) {
  const trimmed = value.trim();
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return null;
  const body = trimmed.slice(1, -1).trim();
  if (!body) return [];
  return body.split(',').map(item => item.trim().replace(/^['"]|['"]$/g, ''));
}

function parseFrontmatter(content, file) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`${file}: frontmatter is missing`);

  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const separator = line.indexOf(':');
    if (separator < 1) throw new Error(`${file}: invalid frontmatter line: ${line}`);
    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();
    data[key] = rawValue.startsWith('[') ? parseList(rawValue) : rawValue;
    if (data[key] === null) {
      throw new Error(`${file}: ${key} must use a one-line YAML list`);
    }
  }
  return data;
}

function relativeDocPath(...parts) {
  return path.posix.join('docs', ...parts);
}

async function loadDirectMarkdown(directory, relativeDirectory, kind, excluded = new Set(['index.md', '_template.md'])) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.md') && !excluded.has(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name));
  return Promise.all(files.map(async entry => {
    const relativePath = relativeDocPath(relativeDirectory, entry.name);
    const content = await readFile(path.join(directory, entry.name), 'utf8');
    return {
      name: entry.name,
      relativePath,
      data: parseFrontmatter(content, relativePath),
      content,
      kind,
    };
  }));
}

async function loadChanges() {
  const changes = [];
  for (const bucket of ['active', 'archive']) {
    const bucketPath = path.join(changeDir, bucket);
    const entries = await readdir(bucketPath, { withFileTypes: true });
    const directories = entries.filter(entry => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of directories) {
      const directory = path.join(bucketPath, entry.name);
      const relativeDirectory = relativeDocPath('changes', bucket, entry.name);
      const files = {};
      for (const name of ['proposal.md', 'delta.md', 'design.md', 'tasks.md', 'validation.md']) {
        const filePath = path.join(directory, name);
        files[name] = existsSync(filePath) ? await readFile(filePath, 'utf8') : null;
      }
      changes.push({
        bucket,
        directory: entry.name,
        relativeDirectory,
        files,
        data: files['proposal.md']
          ? parseFrontmatter(files['proposal.md'], `${relativeDirectory}/proposal.md`)
          : {},
      });
    }
  }
  return changes;
}

function requireFields(document, fields, errors) {
  for (const field of fields) {
    const value = document.data[field];
    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0 && field === 'owners')) {
      errors.push(`${document.relativePath}: required field "${field}" is missing`);
    }
  }
}

function requireList(document, field, errors) {
  if (!Array.isArray(document.data[field])) {
    errors.push(`${document.relativePath}: "${field}" must be a one-line YAML list`);
  }
}

function validateDate(value, document, field, errors) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) {
    errors.push(`${document.relativePath}: "${field}" must be YYYY-MM-DD`);
  }
}

function validateUnique(values, label, file, errors) {
  if (!Array.isArray(values)) return;
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) errors.push(`${file}: duplicate ${label} "${value}"`);
    seen.add(value);
  }
}

function validateExistingReferences(values, label, file, errors) {
  if (!Array.isArray(values)) return;
  for (const value of values) {
    if (typeof value !== 'string' || value.startsWith('manual:')) continue;
    const normalized = value.replace(/[\\/]$/, '');
    if (!normalized || !existsSync(path.join(root, normalized))) {
      errors.push(`${file}: missing ${label} reference "${value}"`);
    }
  }
}

function validateLegacySpecifications(specs, adrs, errors) {
  const ids = new Map();
  for (const document of [...specs, ...adrs]) {
    requireFields(
      document,
      document.kind === 'spec'
        ? ['id', 'title', 'status', 'owners', 'created', 'updated', 'depends_on', 'related_adrs', 'related_code', 'related_tests', 'human_review']
        : ['id', 'title', 'status', 'date', 'deciders', 'related_specs', 'supersedes'],
      errors,
    );
    if (document.kind === 'spec') {
      for (const field of ['owners', 'depends_on', 'related_adrs', 'related_code', 'related_tests']) requireList(document, field, errors);
    } else {
      for (const field of ['deciders', 'related_specs', 'supersedes']) requireList(document, field, errors);
    }

    const expectedPattern = document.kind === 'spec' ? /^SPEC-\d{3}$/ : /^ADR-\d{4}$/;
    if (!expectedPattern.test(document.data.id ?? '')) {
      errors.push(`${document.relativePath}: invalid ${document.kind} id "${document.data.id}"`);
    }
    if (ids.has(document.data.id)) {
      errors.push(`${document.relativePath}: duplicate id "${document.data.id}" also used by ${ids.get(document.data.id)}`);
    } else {
      ids.set(document.data.id, document.relativePath);
    }

    const expectedFilePrefix = document.kind === 'spec' ? document.data.id : document.data.id?.replace('ADR-', '');
    if (!document.name.startsWith(expectedFilePrefix ?? '')) {
      errors.push(`${document.relativePath}: filename must start with "${expectedFilePrefix}"`);
    }

    if (document.kind === 'spec') {
      if (!allowedLegacySpecStatuses.has(document.data.status)) errors.push(`${document.relativePath}: invalid status "${document.data.status}"`);
      if (!['required', 'completed'].includes(document.data.human_review)) errors.push(`${document.relativePath}: human_review must be required or completed`);
      if (['approved', 'implemented', 'deprecated'].includes(document.data.status) && document.data.human_review !== 'completed') {
        errors.push(`${document.relativePath}: ${document.data.status} specifications require completed human review`);
      }
      validateDate(document.data.created, document, 'created', errors);
      validateDate(document.data.updated, document, 'updated', errors);
    } else {
      if (!allowedAdrStatuses.has(document.data.status)) errors.push(`${document.relativePath}: invalid status "${document.data.status}"`);
      validateDate(document.data.date, document, 'date', errors);
    }
  }

  const specById = new Map(specs.map(spec => [spec.data.id, spec]));
  for (const spec of specs) {
    for (const dependency of spec.data.depends_on ?? []) {
      if (!specById.has(dependency)) errors.push(`${spec.relativePath}: unknown specification dependency "${dependency}"`);
      if (dependency === spec.data.id) errors.push(`${spec.relativePath}: a specification cannot depend on itself`);
    }
    for (const adr of spec.data.related_adrs ?? []) {
      if (!adrs.some(candidate => candidate.data.id === adr)) errors.push(`${spec.relativePath}: unknown ADR reference "${adr}"`);
    }
  }

  const visiting = new Set();
  const visited = new Set();
  function visitSpecification(spec, chain = []) {
    if (visited.has(spec.data.id)) return;
    if (visiting.has(spec.data.id)) {
      errors.push(`${spec.relativePath}: circular specification dependency: ${[...chain, spec.data.id].join(' -> ')}`);
      return;
    }
    visiting.add(spec.data.id);
    for (const dependencyId of spec.data.depends_on ?? []) {
      const dependency = specById.get(dependencyId);
      if (dependency) visitSpecification(dependency, [...chain, spec.data.id]);
    }
    visiting.delete(spec.data.id);
    visited.add(spec.data.id);
  }
  for (const spec of specs) visitSpecification(spec);

  for (const adr of adrs) {
    for (const spec of adr.data.related_specs ?? []) {
      if (!specById.has(spec)) errors.push(`${adr.relativePath}: unknown specification reference "${spec}"`);
    }
    for (const previous of adr.data.supersedes ?? []) {
      if (!adrs.some(candidate => candidate.data.id === previous)) errors.push(`${adr.relativePath}: unknown superseded ADR "${previous}"`);
    }
  }
}

function validateCurrentSpecifications(currentSpecs, currentChanges, adrs, errors) {
  const currentById = new Map();
  const adrIds = new Set(adrs.map(adr => adr.data.id));
  for (const spec of currentSpecs) {
    requireFields(spec, ['type', 'id', 'title', 'status', 'owners', 'created', 'updated', 'requirement_ids', 'related_adrs', 'related_changes', 'related_code', 'related_tests'], errors);
    for (const field of ['owners', 'requirement_ids', 'related_adrs', 'related_changes', 'related_code', 'related_tests']) requireList(spec, field, errors);
    if (spec.data.type !== 'current') errors.push(`${spec.relativePath}: type must be current`);
    if (!/^CURRENT-[A-Z0-9-]+$/.test(spec.data.id ?? '')) errors.push(`${spec.relativePath}: invalid current specification id "${spec.data.id}"`);
    if (spec.data.status !== 'current') errors.push(`${spec.relativePath}: current specification status must be current`);
    if (currentById.has(spec.data.id)) errors.push(`${spec.relativePath}: duplicate current specification id "${spec.data.id}"`);
    currentById.set(spec.data.id, spec);
    validateDate(spec.data.created, spec, 'created', errors);
    validateDate(spec.data.updated, spec, 'updated', errors);
    validateUnique(spec.data.requirement_ids, 'requirement ID', spec.relativePath, errors);
    validateExistingReferences(spec.data.related_code, 'related_code', spec.relativePath, errors);
    validateExistingReferences(spec.data.related_tests, 'related_tests', spec.relativePath, errors);
    for (const adr of spec.data.related_adrs ?? []) if (!adrIds.has(adr)) errors.push(`${spec.relativePath}: unknown ADR reference "${adr}"`);
    for (const change of spec.data.related_changes ?? []) if (!currentChanges.some(candidate => candidate.data.id === change)) errors.push(`${spec.relativePath}: unknown change reference "${change}"`);
    for (const requirementId of spec.data.requirement_ids ?? []) {
      if (!new RegExp(`^###\\s+${requirementId}\\b`, 'm').test(spec.content)) errors.push(`${spec.relativePath}: requirement ID "${requirementId}" is not a level-3 heading`);
    }
  }
  return currentById;
}

function validateChanges(changes, currentById, adrs, errors) {
  const changeById = new Map();
  const adrIds = new Set(adrs.map(adr => adr.data.id));
  for (const change of changes) {
    const file = `${change.relativeDirectory}/proposal.md`;
    const proposal = { relativePath: file, data: change.data };
    requireFields(proposal, ['type', 'id', 'title', 'status', 'change_kind', 'owners', 'created', 'updated', 'current_specs', 'related_adrs', 'human_review'], errors);
    for (const field of ['owners', 'current_specs', 'related_adrs']) requireList(proposal, field, errors);
    if (change.data.type !== 'change') errors.push(`${file}: type must be change`);
    if (!/^CHANGE-\d{3}$/.test(change.data.id ?? '')) errors.push(`${file}: invalid change id "${change.data.id}"`);
    if (changeById.has(change.data.id)) errors.push(`${file}: duplicate change id "${change.data.id}"`);
    changeById.set(change.data.id, change);
    if (!allowedChangeStatuses.has(change.data.status)) errors.push(`${file}: invalid status "${change.data.status}"`);
    if (!['S', 'B', 'F', 'A', 'X'].includes(change.data.change_kind)) errors.push(`${file}: invalid change_kind "${change.data.change_kind}"`);
    if (!['required', 'completed'].includes(change.data.human_review)) errors.push(`${file}: human_review must be required or completed`);
    if (['approved', 'implemented', 'archived'].includes(change.data.status) && change.data.human_review !== 'completed') errors.push(`${file}: ${change.data.status} changes require completed human review`);
    validateDate(change.data.created, proposal, 'created', errors);
    validateDate(change.data.updated, proposal, 'updated', errors);
    if (change.bucket === 'archive' && change.data.status !== 'archived') errors.push(`${file}: archived changes must have status archived`);
    if (change.bucket === 'active' && change.data.status === 'archived') errors.push(`${file}: archived changes belong under docs/changes/archive`);
    for (const currentSpec of change.data.current_specs ?? []) if (!currentById.has(currentSpec)) errors.push(`${file}: unknown current specification "${currentSpec}"`);
    for (const adr of change.data.related_adrs ?? []) if (!adrIds.has(adr)) errors.push(`${file}: unknown ADR reference "${adr}"`);
    if (!change.files['delta.md']) {
      errors.push(`${change.relativeDirectory}: delta.md is missing`);
    } else {
      for (const heading of ['ADDED Requirements', 'MODIFIED Requirements', 'REMOVED Requirements']) {
        if (!new RegExp(`^##\\s+${heading}$`, 'm').test(change.files['delta.md'])) errors.push(`${change.relativeDirectory}/delta.md: missing "## ${heading}"`);
      }
    }
    if (['implemented', 'archived'].includes(change.data.status)) {
      if (!change.files['tasks.md']) errors.push(`${change.relativeDirectory}: tasks.md is required for ${change.data.status} changes`);
      if (!change.files['validation.md']) errors.push(`${change.relativeDirectory}: validation.md is required for ${change.data.status} changes`);
      if (change.files['tasks.md'] && /- \[ \]/.test(change.files['tasks.md'])) errors.push(`${change.relativeDirectory}/tasks.md: completed changes cannot have unchecked tasks`);
      if (change.files['validation.md']) {
        const results = [...change.files['validation.md'].matchAll(/\|\s*(pass|fail|partial|manual|not-run)\s*\|/gi)];
        if (results.length === 0) errors.push(`${change.relativeDirectory}/validation.md: a validation result is required`);
        if (/\|\s*pending\s*\|/i.test(change.files['validation.md'])) errors.push(`${change.relativeDirectory}/validation.md: completed changes cannot have pending validation results`);
      }
    }
    if (change.files['validation.md']) {
      const ids = [...change.files['validation.md'].matchAll(/\bAC-\d{3}\b/g)].map(match => match[0]);
      validateUnique(ids, 'acceptance criterion ID', `${change.relativeDirectory}/validation.md`, errors);
    }
  }
  return changeById;
}

function parseIndexTableRows(content) {
  return content.split(/\r?\n/).flatMap(line => {
    const match = line.match(/^\|\s*([^|]+?)\s*\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|\s*([^|]+?)\s*\|$/);
    if (!match) return [];
    return [{
      id: match[1].trim(),
      title: match[2].trim(),
      link: match[3].trim(),
      status: match[4].trim(),
    }];
  });
}

function validateIndexEntries(indexPath, content, documents, expectedLink, errors) {
  const rows = parseIndexTableRows(content);
  const rowsById = new Map();
  const expectedIds = new Set(documents.map(document => document.data.id));
  for (const row of rows) {
    if (rowsById.has(row.id)) errors.push(`${indexPath}: duplicate index entry "${row.id}"`);
    if (!expectedIds.has(row.id) && /^(CURRENT|SPEC|CHANGE)-/.test(row.id)) errors.push(`${indexPath}: stale index entry "${row.id}"`);
    rowsById.set(row.id, row);
  }

  for (const document of documents) {
    const id = document.data.id;
    const row = rowsById.get(id);
    if (!row) {
      errors.push(`${indexPath}: missing index entry for ${id}`);
      continue;
    }
    if (row.title !== document.data.title) errors.push(`${indexPath}: title for ${id} does not match ${document.relativePath}`);
    if (row.status !== document.data.status) errors.push(`${indexPath}: status for ${id} does not match ${document.relativePath}`);
    const expected = expectedLink(document);
    if (row.link !== expected) errors.push(`${indexPath}: link for ${id} must be "${expected}"`);
  }
}

function validateIndexes(currentSpecs, changes, errors) {
  const currentIndexPath = path.join(currentSpecDir, 'index.md');
  const currentIndex = existsSync(currentIndexPath) ? readFileSync(currentIndexPath, 'utf8') : '';
  if (!currentIndex) errors.push('docs/specs/current/index.md: index is missing');
  for (const spec of currentSpecs) {
    const slug = path.basename(spec.name, '.md');
    if (!currentIndex.includes(`./${slug}`)) errors.push(`docs/specs/current/index.md: missing current specification link for ${spec.name}`);
  }

  const specsIndexPath = path.join(specDir, 'index.md');
  const specsIndex = existsSync(specsIndexPath) ? readFileSync(specsIndexPath, 'utf8') : '';
  for (const spec of currentSpecs) {
    const slug = path.basename(spec.name, '.md');
    if (!specsIndex.includes(`./current/${slug}`)) errors.push(`docs/specs/index.md: missing current specification link for ${spec.name}`);
  }
  for (const legacy of legacySpecs) {
    if (!specsIndex.includes(path.basename(legacy.name, '.md'))) errors.push(`docs/specs/index.md: missing Legacy SPEC link for ${legacy.name}`);
  }

  if (currentIndex) {
    validateIndexEntries(
      'docs/specs/current/index.md',
      currentIndex,
      currentSpecs,
      document => `./${path.basename(document.name, '.md')}`,
      errors,
    );
  }
  if (specsIndex) {
    validateIndexEntries(
      'docs/specs/index.md',
      specsIndex,
      [...currentSpecs, ...legacySpecs],
      document => document.data.id.startsWith('CURRENT-')
        ? `./current/${path.basename(document.name, '.md')}`
        : `./${document.name}`,
      errors,
    );
  }

  for (const bucket of ['active', 'archive']) {
    const indexPath = path.join(changeDir, bucket, 'index.md');
    const index = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : '';
    if (!index) errors.push(`docs/changes/${bucket}/index.md: index is missing`);
    for (const change of changes.filter(candidate => candidate.bucket === bucket)) {
      if (!index.includes(change.directory)) errors.push(`docs/changes/${bucket}/index.md: missing change link for ${change.directory}`);
    }
    if (index) {
      validateIndexEntries(
        `docs/changes/${bucket}/index.md`,
        index,
        changes.filter(candidate => candidate.bucket === bucket).map(change => ({
          name: 'proposal.md',
          relativePath: `${change.relativeDirectory}/proposal.md`,
          data: change.data,
        })),
        document => `./${path.basename(path.dirname(document.relativePath))}/proposal`,
        errors,
      );
    }
  }
}

const legacySpecs = await loadDirectMarkdown(specDir, 'specs', 'spec');
const adrs = await loadDirectMarkdown(adrDir, 'adr', 'adr');
const currentSpecs = await loadDirectMarkdown(currentSpecDir, 'specs/current', 'current');
const changes = await loadChanges();
const errors = [];

validateLegacySpecifications(legacySpecs, adrs, errors);
const currentById = validateCurrentSpecifications(currentSpecs, changes, adrs, errors);
const changeById = validateChanges(changes, currentById, adrs, errors);

for (const spec of currentSpecs) {
  for (const changeId of spec.data.related_changes ?? []) if (!changeById.has(changeId)) errors.push(`${spec.relativePath}: unknown change reference "${changeId}"`);
}

validateIndexes(currentSpecs, changes, errors);

if (errors.length > 0) {
  console.error('Documentation checks failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Documentation checks passed (${legacySpecs.length} legacy specs, ${currentSpecs.length} current specs, ${changes.length} changes, ${adrs.length} ADRs).`);
}
