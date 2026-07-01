import { readFile, writeFile } from 'node:fs/promises';
import process from 'node:process';

const publicKeyPath = process.argv[2];
if (!publicKeyPath) {
  console.error('usage: npm run updater:key -- <path-to-public-key.pub>');
  process.exit(1);
}

const configPath = new URL('../src-tauri/tauri.conf.json', import.meta.url);

try {
  const publicKey = (await readFile(publicKeyPath, 'utf8')).trim();
  const decodedKey = Buffer.from(publicKey, 'base64').toString('utf8');
  if (!publicKey || !decodedKey.includes('minisign public key')) {
    throw new Error('the selected file does not look like a Tauri public key');
  }

  const config = JSON.parse(await readFile(configPath, 'utf8'));
  if (!config.plugins?.updater) {
    throw new Error('tauri.conf.json does not contain updater configuration');
  }

  config.plugins.updater.pubkey = publicKey;
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
  console.log('Updater public key was written to src-tauri/tauri.conf.json.');
  console.log('Only the public key was copied. Keep the .key file private.');
} catch (error) {
  console.error(
    `set-updater-public-key: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
}
