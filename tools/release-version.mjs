import { readFile, writeFile } from 'node:fs/promises';
import process from 'node:process';

const VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const PLACEHOLDER_PUBLIC_KEY = 'REPLACE_WITH_TAURI_UPDATER_PUBLIC_KEY';

const paths = {
  packageJson: new URL('../package.json', import.meta.url),
  packageLock: new URL('../package-lock.json', import.meta.url),
  cargoToml: new URL('../src-tauri/Cargo.toml', import.meta.url),
  cargoLock: new URL('../src-tauri/Cargo.lock', import.meta.url),
  tauriConfig: new URL('../src-tauri/tauri.conf.json', import.meta.url),
};

function fail(message) {
  console.error(`release-version: ${message}`);
  process.exitCode = 1;
}

function replacePackageVersion(toml, name, version) {
  const packagePattern = new RegExp(
    `(\\[\\[package\\]\\]\\r?\\nname = "${name}"\\r?\\nversion = ")[^"]+(")`,
  );
  if (!packagePattern.test(toml)) {
    throw new Error(`${name} package entry was not found`);
  }
  return toml.replace(packagePattern, `$1${version}$2`);
}

async function readProject() {
  const [packageJsonText, packageLockText, cargoToml, cargoLock, tauriConfigText] =
    await Promise.all([
      readFile(paths.packageJson, 'utf8'),
      readFile(paths.packageLock, 'utf8'),
      readFile(paths.cargoToml, 'utf8'),
      readFile(paths.cargoLock, 'utf8'),
      readFile(paths.tauriConfig, 'utf8'),
    ]);

  return {
    packageJson: JSON.parse(packageJsonText),
    packageLock: JSON.parse(packageLockText),
    cargoToml,
    cargoLock,
    tauriConfig: JSON.parse(tauriConfigText),
  };
}

function cargoManifestVersion(toml) {
  const packageSection = toml.match(/\[package\]([\s\S]*?)(?:\r?\n\[|$)/)?.[1];
  return packageSection?.match(/^\s*version\s*=\s*"([^"]+)"/m)?.[1] ?? null;
}

function cargoLockVersion(lock) {
  return lock.match(
    /\[\[package\]\]\r?\nname = "kagaribi_grad"\r?\nversion = "([^"]+)"/,
  )?.[1] ?? null;
}

async function setVersion(version) {
  if (!VERSION_PATTERN.test(version)) {
    throw new Error(`"${version}" is not a stable SemVer value such as 0.1.0`);
  }

  const project = await readProject();
  project.packageJson.version = version;
  project.packageLock.version = version;
  if (!project.packageLock.packages?.['']) {
    throw new Error('package-lock.json does not contain the root package');
  }
  project.packageLock.packages[''].version = version;
  project.tauriConfig.version = version;

  const cargoToml = project.cargoToml.replace(
    /(\[package\][\s\S]*?^\s*version\s*=\s*")[^"]+(")/m,
    `$1${version}$2`,
  );
  const cargoLock = replacePackageVersion(
    project.cargoLock,
    'kagaribi_grad',
    version,
  );

  await Promise.all([
    writeFile(paths.packageJson, `${JSON.stringify(project.packageJson, null, 2)}\n`),
    writeFile(paths.packageLock, `${JSON.stringify(project.packageLock, null, 2)}\n`),
    writeFile(paths.cargoToml, cargoToml),
    writeFile(paths.cargoLock, cargoLock),
    writeFile(paths.tauriConfig, `${JSON.stringify(project.tauriConfig, null, 2)}\n`),
  ]);

  console.log(`K-GG version synchronized to ${version}.`);
}

async function checkVersion() {
  const project = await readProject();
  const canonicalVersion = project.tauriConfig.version;
  const versions = {
    'src-tauri/tauri.conf.json': canonicalVersion,
    'package.json': project.packageJson.version,
    'package-lock.json': project.packageLock.version,
    'package-lock.json packages[""]': project.packageLock.packages?.['']?.version,
    'src-tauri/Cargo.toml': cargoManifestVersion(project.cargoToml),
    'src-tauri/Cargo.lock': cargoLockVersion(project.cargoLock),
  };

  if (!VERSION_PATTERN.test(canonicalVersion)) {
    fail(`tauri.conf.json version "${canonicalVersion}" is not stable SemVer`);
  }

  for (const [source, version] of Object.entries(versions)) {
    if (version !== canonicalVersion) {
      fail(`${source} has version "${version}", expected "${canonicalVersion}"`);
    }
  }

  const tag = process.env.GITHUB_REF_TYPE === 'tag'
    ? process.env.GITHUB_REF_NAME
    : undefined;
  if (tag && tag !== `v${canonicalVersion}`) {
    fail(`tag "${tag}" does not match application version "v${canonicalVersion}"`);
  }

  if (project.tauriConfig.plugins?.updater?.pubkey === PLACEHOLDER_PUBLIC_KEY) {
    fail(
      'the updater public key is still a placeholder; generate the release key and update tauri.conf.json',
    );
  }

  if (!process.exitCode) {
    console.log(`Release configuration is valid for v${canonicalVersion}.`);
  }
}

const [command, value] = process.argv.slice(2);

try {
  if (command === 'set' && value) {
    await setVersion(value);
  } else if (command === 'check' && !value) {
    await checkVersion();
  } else {
    throw new Error(
      'usage: node tools/release-version.mjs set <version> | check',
    );
  }
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
