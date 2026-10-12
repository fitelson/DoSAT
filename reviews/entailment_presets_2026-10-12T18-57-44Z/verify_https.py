from pathlib import Path
from urllib.parse import quote
import hashlib
import json
import re
import subprocess
import time

here = Path(__file__).resolve().parent
manifest = json.loads((here / 'release-manifest.json').read_text())
base = 'https://fitelson.org/DoSAT/'
stamp = str(int(time.time()))
rows = []

def curl(*args):
    return subprocess.run(['curl', '--silent', '--show-error', '--max-time', '90', *args],
                          check=True, capture_output=True).stdout

for name, expected in manifest['files'].items():
    if name.endswith('.htaccess'):
        continue
    url = base + quote(name, safe='/') + '?release_check=' + stamp
    data = curl('--fail', '-H', 'Cache-Control: no-cache', url)
    actual = {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
    assert actual == expected, (name, actual, expected)
    rows.append({'file': name, **actual, 'passed': True})

root_headers = curl('--head', base+'?release_check='+stamp).decode('utf8')
assert re.search(r'HTTP/\S+\s+200', root_headers)
assert 'cross-origin-opener-policy: same-origin' in root_headers.lower()
assert 'cross-origin-embedder-policy: require-corp' in root_headers.lower()
wasm_headers = curl('--head', base+'z3-built.wasm?release_check='+stamp).decode('utf8')
assert 'content-type: application/wasm' in wasm_headers.lower()
redirects = []
for suffix in ('dist/', 'dist/index.html', 'dist/decision.html', 'dist/causal.html', 'dist/do_calculus.html'):
    headers = curl('--head', base+suffix+'?release_check='+stamp).decode('utf8')
    assert re.search(r'HTTP/\S+\s+301', headers), suffix
    assert 'location: https://fitelson.org/DoSAT/' in headers, suffix
    redirects.append({'path': suffix, 'status': 301, 'passed': True})
backup_headers = curl('--head', base+'.release-backups/?release_check='+stamp).decode('utf8')
assert re.search(r'HTTP/\S+\s+403', backup_headers)
result = {'public_files': len(rows), 'files': rows, 'root_status': 200,
          'root_headers': root_headers, 'wasm_headers': wasm_headers,
          'redirects': redirects, 'backup_status': 403}
(here / 'live-http-verification.json').write_text(json.dumps(result, indent=2)+'\n')
print('HTTPS PASS: six file hashes/byte counts, root 200 and isolation, WASM MIME, five redirects, backup 403.')
