"""Collect notices from the pinned upstream lockfile; verifies npm archive integrity.

Requires installed js-yaml for parsing the upstream pnpm lockfile. Includes the
runtime closure conservatively, even components eliminated by tree shaking.
"""
import base64
import hashlib
import io
import json
from pathlib import Path
import subprocess
import tarfile
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
vendor = json.loads((ROOT / 'vendor/tweeq/package.json').read_text())
commit = vendor['gitHead']
url = vendor['repository'].replace('https://github.com/', 'https://raw.githubusercontent.com/') + '/' + commit + '/pnpm-lock.yaml'
lock_text = urllib.request.urlopen(url, timeout=30).read()
lock = json.loads(subprocess.check_output(['node', '--input-type=module', '-e',
    "import yaml from 'js-yaml';import fs from 'node:fs';console.log(JSON.stringify(yaml.load(fs.readFileSync(0,'utf8'))))"], input=lock_text, cwd=ROOT))
queue = [(name, item['version']) for group in ('core', 'dom', 'react')
         for name, item in lock['importers']['packages/' + group].get('dependencies', {}).items()
         if not item['version'].startswith('link:')]
seen = set()
entries = {}
while queue:
    name, version = queue.pop()
    key = name + '@' + version
    if key in seen or name in ('react', 'react-dom'):
        continue
    seen.add(key)
    queue.extend(lock['snapshots'].get(key, {}).get('dependencies', {}).items())
    version = version.split('(')[0]
    key = name + '@' + version
    if key in entries:
        continue
    metadata = json.load(urllib.request.urlopen('https://registry.npmjs.org/' + name + '/' + version, timeout=30))
    data = urllib.request.urlopen(metadata['dist']['tarball'], timeout=30).read()
    integrity = lock['packages'][key]['resolution']['integrity']
    algorithm, digest = integrity.split('-', 1)
    if base64.b64encode(hashlib.new(algorithm, data).digest()).decode() != digest:
        raise RuntimeError('Package integrity mismatch: ' + key)
    notices = []
    with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as archive:
        for member in archive.getmembers():
            path = Path(member.name)
            if (member.isfile() and path.name.lower().startswith(('license', 'licence', 'unlicense', 'notice', 'copying', 'copyright'))
                    and member.size < 2_000_000 and path.suffix not in ('.js', '.json', '.html')):
                notices.append({'file': member.name, 'text': archive.extractfile(member).read().decode('utf-8-sig').strip()})
    if not notices:
        raise RuntimeError('Missing license text: ' + key)
    entries[key] = {'ecosystem': 'vendor/npm', 'name': name, 'version': version,
                    'license': metadata.get('license', 'See license text'), 'source': metadata['dist']['tarball'],
                    'integrity': integrity, 'notices': notices}
result = {'upstreamCommit': commit, 'lockSha256': hashlib.sha256(lock_text).hexdigest(),
          'coverage': 'Conservative runtime dependency closure of core/dom/react before tree shaking; React peers excluded.',
          'entries': sorted(entries.values(), key=lambda entry: (entry['name'], entry['version']))}
(ROOT / 'vendor/tweeq/THIRD_PARTY_LICENSES.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
print(f'Collected {len(entries)} vendored component licenses.')
