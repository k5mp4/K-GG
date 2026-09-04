import { readdir, readFile } from 'node:fs/promises';

const distRoot = new URL('../dist/', import.meta.url);
const markers = ['__KGG_E2E__', 'prepareZipSmoke', 'e2eBridge'];

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directory);
    if (entry.isDirectory()) files.push(...await listFiles(path));
    else files.push(path);
  }
  return files;
}

const matches = [];
for (const file of await listFiles(distRoot)) {
  const contents = await readFile(file, 'utf8');
  for (const marker of markers) {
    if (contents.includes(marker)) matches.push(`${file.pathname}: ${marker}`);
  }
}

if (matches.length > 0) {
  throw new Error(`Production bundle contains E2E bridge markers:\n${matches.join('\n')}`);
}

console.log('Production bundle contains no E2E bridge markers.');
