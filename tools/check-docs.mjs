import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const specDir = path.join(root, 'docs', 'specs');
const adrDir = path.join(root, 'docs', 'adr');
const allowedSpecStatuses = new Set([
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

async function loadDocuments(directory, kind) {
  const names = (await readdir(directory))
    .filter(name => name.endsWith('.md') && name !== 'index.md' && name !== '_template.md')
    .sort();
  return Promise.all(names.map(async name => {
    const relativePath = path.posix.join(
      'docs',
      kind === 'spec' ? 'specs' : 'adr',
      name,
    );
    const content = await readFile(path.join(directory, name), 'utf8');
    return { kind, name, relativePath, data: parseFrontmatter(content, relativePath) };
  }));
}

function requireFields(document, fields, errors) {
  for (const field of fields) {
    const value = document.data[field];
    if (value === undefined || value === '') {
      errors.push(`${document.relativePath}: required field "${field}" is missing`);
    }
  }
}

function validateDate(value, document, field, errors) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) {
    errors.push(`${document.relativePath}: "${field}" must be YYYY-MM-DD`);
  }
}

const specs = await loadDocuments(specDir, 'spec');
const adrs = await loadDocuments(adrDir, 'adr');
const documents = [...specs, ...adrs];
const errors = [];
const ids = new Map();

for (const document of documents) {
  requireFields(
    document,
    document.kind === 'spec'
      ? [
          'id',
          'title',
          'status',
          'owners',
          'created',
          'updated',
          'depends_on',
          'related_adrs',
          'related_code',
          'related_tests',
          'human_review',
        ]
      : [
          'id',
          'title',
          'status',
          'date',
          'deciders',
          'related_specs',
          'supersedes',
        ],
    errors,
  );

  const expectedPattern = document.kind === 'spec' ? /^SPEC-\d{3}$/ : /^ADR-\d{4}$/;
  if (!expectedPattern.test(document.data.id ?? '')) {
    errors.push(`${document.relativePath}: invalid ${document.kind} id "${document.data.id}"`);
  }
  if (ids.has(document.data.id)) {
    errors.push(
      `${document.relativePath}: duplicate id "${document.data.id}" also used by ${ids.get(document.data.id)}`,
    );
  } else {
    ids.set(document.data.id, document.relativePath);
  }

  const expectedFilePrefix = document.kind === 'spec'
    ? document.data.id
    : document.data.id?.replace('ADR-', '');
  if (!document.name.startsWith(expectedFilePrefix ?? '')) {
    errors.push(`${document.relativePath}: filename must start with "${expectedFilePrefix}"`);
  }

  if (document.kind === 'spec') {
    if (!allowedSpecStatuses.has(document.data.status)) {
      errors.push(`${document.relativePath}: invalid status "${document.data.status}"`);
    }
    if (!['required', 'completed'].includes(document.data.human_review)) {
      errors.push(`${document.relativePath}: human_review must be required or completed`);
    }
    if (
      ['approved', 'implemented', 'deprecated'].includes(document.data.status) &&
      document.data.human_review !== 'completed'
    ) {
      errors.push(
        `${document.relativePath}: ${document.data.status} specifications require completed human review`,
      );
    }
    validateDate(document.data.created, document, 'created', errors);
    validateDate(document.data.updated, document, 'updated', errors);
  } else {
    if (!allowedAdrStatuses.has(document.data.status)) {
      errors.push(`${document.relativePath}: invalid status "${document.data.status}"`);
    }
    validateDate(document.data.date, document, 'date', errors);
  }
}

for (const spec of specs) {
  for (const dependency of spec.data.depends_on ?? []) {
    if (!ids.has(dependency) || !dependency.startsWith('SPEC-')) {
      errors.push(`${spec.relativePath}: unknown specification dependency "${dependency}"`);
    }
    if (dependency === spec.data.id) {
      errors.push(`${spec.relativePath}: a specification cannot depend on itself`);
    }
  }
  for (const adr of spec.data.related_adrs ?? []) {
    if (!ids.has(adr) || !adr.startsWith('ADR-')) {
      errors.push(`${spec.relativePath}: unknown ADR reference "${adr}"`);
    }
  }
}

const specById = new Map(specs.map(spec => [spec.data.id, spec]));
const visiting = new Set();
const visited = new Set();

function visitSpecification(spec, chain = []) {
  if (visited.has(spec.data.id)) return;
  if (visiting.has(spec.data.id)) {
    errors.push(
      `${spec.relativePath}: circular specification dependency: ${[...chain, spec.data.id].join(' -> ')}`,
    );
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
    if (!ids.has(spec) || !spec.startsWith('SPEC-')) {
      errors.push(`${adr.relativePath}: unknown specification reference "${spec}"`);
    }
  }
  for (const previous of adr.data.supersedes ?? []) {
    if (!ids.has(previous) || !previous.startsWith('ADR-')) {
      errors.push(`${adr.relativePath}: unknown superseded ADR "${previous}"`);
    }
  }
}

if (errors.length > 0) {
  console.error('Documentation checks failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Documentation checks passed (${specs.length} specs, ${adrs.length} ADRs).`);
}
