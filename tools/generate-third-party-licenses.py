"""Generate the offline notice catalog (Python 3.11+, installed npm/Rust dependencies).

Conservatively includes production npm dependencies and the Windows Cargo graph,
including build dependencies. Missing texts fail closed. Upstream supplements are
cached with immutable URLs in tools/license-overrides.json. No package code runs.
"""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
os.chdir(ROOT)
CACHE = ROOT / 'tools/license-overrides.json'
cache = json.loads(CACHE.read_text(encoding='utf-8')) if CACHE.exists() else {}


def fetch(url):
    with urllib.request.urlopen(url, timeout=30) as response:
        return response.read().decode('utf-8')


def notices(directory):
    result = []
    for base, dirs, files in os.walk(directory, followlinks=False):
        dirs[:] = sorted(d for d in dirs if d not in ('node_modules', '.git', 'target'))
        for name in sorted(files):
            if not name.lower().startswith(('license', 'licence', 'unlicense', 'copying', 'notice', 'copyright')):
                continue
            path = Path(base) / name
            if path.suffix in ('.rs', '.c', '.h', '.py', '.js', '.html', '.json'):
                continue
            try:
                text = path.read_text(encoding='utf-8-sig').strip()
            except UnicodeError:
                continue
            if text:
                result.append({'file': path.relative_to(directory).as_posix(), 'text': text})
    return result


def rust_supplement(package, directory):
    key = f"cargo:{package['name']}@{package['version']}"
    if key in cache:
        return cache[key]
    vcs = json.loads((directory / '.cargo_vcs_info.json').read_text())
    repository = package['repository'].rstrip('/').removesuffix('.git')
    if not repository.startswith('https://github.com/'):
        raise RuntimeError(f'Need reviewed license supplement: {key}')
    base = repository.replace('https://github.com/', 'https://raw.githubusercontent.com/') + '/' + vcs['git']['sha1'] + '/'
    result = []
    if package['name'] == 'selectors' and package['license'] == 'MPL-2.0':
        url = 'https://www.mozilla.org/media/MPL/2.0/index.txt'
        header = (directory / 'lib.rs').read_text(encoding='utf-8').split('\n\n', 1)[0]
        result = [{'file': 'lib.rs (source notice)', 'text': header, 'url': base + 'selectors/lib.rs'},
                  {'file': 'MPL-2.0', 'text': fetch(url).strip(), 'url': url}]
    for filename in ([] if result else ['LICENSE', 'LICENSE.txt', 'LICENSE.md', 'LICENSE_MIT', 'LICENSE_APACHE-2.0', 'LICENSE-MIT', 'LICENSE-APACHE', 'LICENSE-MIT.txt', 'LICENSE-APACHE.txt', 'COPYING', 'LICENSE-MPL-2.0']):
        try:
            text = fetch(base + filename).strip()
        except urllib.error.HTTPError as error:
            if error.code == 404:
                continue
            raise
        if text:
            result.append({'file': filename, 'text': text, 'url': base + filename})
    if not result:
        raise RuntimeError(f'No license text: {key} ({base})')
    cache[key] = result
    CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    return result


entries = []
lock = json.loads(Path('package-lock.json').read_text())
for location, package in sorted(lock['packages'].items()):
    if not location or package.get('dev') or package.get('link') or location.startswith('vendor/'):
        continue
    directory = ROOT / location
    if not directory.exists():
        if package.get('optional'):
            continue
        raise RuntimeError(f'Missing dependency {location}; run npm ci')
    metadata = json.loads((directory / 'package.json').read_text(encoding='utf-8'))
    texts = notices(directory)
    if not texts and metadata['name'] == 'ogl':
        readme = (directory / 'README.md').read_text(encoding='utf-8')
        texts = [{'file': 'README.md (Unlicense)', 'text': readme[readme.index('This is free and unencumbered software'):].strip()}]
    if not texts:
        raise RuntimeError(f'No license text: {location}')
    entries.append({'ecosystem': 'npm', 'name': metadata['name'], 'version': metadata['version'],
                    'license': metadata.get('license', package.get('license', 'See license text')),
                    'source': f"https://www.npmjs.com/package/{metadata['name']}/v/{metadata['version']}", 'notices': texts})

vendor = json.loads(Path('vendor/tweeq/package.json').read_text())
entries.append({'ecosystem': 'vendor', 'name': 'tweeq', 'version': vendor['gitHead'], 'license': 'MIT',
                'source': vendor['repository'] + '/tree/' + vendor['gitHead'], 'notices': notices(ROOT / 'vendor/tweeq')})
vendor_notices = Path('vendor/tweeq/THIRD_PARTY_LICENSES.json')
if not vendor_notices.exists():
    raise RuntimeError('Missing audited Tweeq dependency notices')
entries.extend(json.loads(vendor_notices.read_text(encoding='utf-8'))['entries'])

metadata = json.loads(subprocess.check_output(['cargo', 'metadata', '--locked', '--offline', '--format-version', '1',
                                               '--filter-platform', 'x86_64-pc-windows-msvc', '--manifest-path', 'src-tauri/Cargo.toml']))
resolved = {node['id'] for node in metadata['resolve']['nodes']}
for package in metadata['packages']:
    if package['id'] not in resolved or not (package.get('source') or '').startswith('registry+'):
        continue
    directory = Path(package['manifest_path']).parent
    texts = notices(directory) or rust_supplement(package, directory)
    entries.append({'ecosystem': 'cargo', 'name': package['name'], 'version': package['version'],
                    'license': package['license'] or 'See license text',
                    'source': f"https://crates.io/api/v1/crates/{package['name']}/{package['version']}/download", 'notices': texts})

entries = list({(entry['ecosystem'], entry['name'], entry['version']): entry for entry in entries}.values())
entries.sort(key=lambda entry: (entry['ecosystem'], entry['name'], entry['version']))
inputs = ['package-lock.json', 'src-tauri/Cargo.lock', 'vendor/tweeq/package.json',
          'vendor/tweeq/index.es.js', 'vendor/tweeq/index.cjs', 'vendor/tweeq/style.css',
          'vendor/tweeq/THIRD_PARTY_LICENSES.json', 'LICENSE', 'NOTICE']
result = {'schemaVersion': 1, 'inputs': {name: hashlib.sha256(Path(name).read_bytes().replace(b'\r\n', b'\n')).hexdigest() for name in inputs},
          'applicationLicense': Path('LICENSE').read_text(encoding='utf-8'),
          'applicationNotice': Path('NOTICE').read_text(encoding='utf-8'), 'entries': entries}
output = Path('src/generated/thirdPartyLicenses.json')
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
print(f'Generated {len(entries)} component notices ({output.stat().st_size} bytes).')
