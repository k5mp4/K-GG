import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const catalog = JSON.parse(await readFile(new URL('src/generated/thirdPartyLicenses.json', root), 'utf8'));
for (const [path, expected] of Object.entries(catalog.inputs)) {
  const actual = createHash('sha256').update((await readFile(new URL(path, root), 'utf8')).replaceAll('\r\n', '\n')).digest('hex');
  if (actual !== expected) throw new Error(`License inventory is stale: ${path}. Run npm run licenses:generate.`);
}
const vendor = JSON.parse(await readFile(new URL('vendor/tweeq/THIRD_PARTY_LICENSES.json', root), 'utf8'));
const vendorPackage = JSON.parse(await readFile(new URL('vendor/tweeq/package.json', root), 'utf8'));
if (vendor.upstreamCommit !== vendorPackage.gitHead) throw new Error('Refresh Tweeq dependency notices for its new upstream commit.');
const identities = new Set();
for (const entry of catalog.entries) {
  const identity = `${entry.ecosystem}:${entry.name}@${entry.version}`;
  if (identities.has(identity) || !entry.license || !entry.source || !entry.notices.length
    || entry.notices.some(notice => !notice.text.trim())) throw new Error(`Invalid license inventory: ${identity}`);
  identities.add(identity);
  if (entry.name === 'gsap') throw new Error('GSAP must not be redistributed by this build.');
}
console.log(`Offline license catalog is current: ${catalog.entries.length} components.`);
