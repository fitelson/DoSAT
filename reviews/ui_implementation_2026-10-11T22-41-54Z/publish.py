"""Scoped DoSAT upload/verification helper. Run only after the UI gate passes."""
from pathlib import Path
import hashlib, json, subprocess, sys, urllib.request
review = Path(__file__).resolve().parent
package = Path(sys.argv[1]).resolve()
manifest = json.loads((package / 'release-manifest.json').read_text())
assert manifest['target'] == 'https://fitelson.org/DoSAT/'
files = manifest['files']
assert all(p == 'index.html' or (p.startswith('dist/') and '..' not in p.split('/')) for p in files)
for name, expected in files.items():
    data = (package / name).read_bytes()
    assert len(data) == expected['bytes'] and hashlib.sha256(data).hexdigest() == expected['sha256']
if sys.argv[2] == 'upload':
    subprocess.run(['ssh', '-o', 'BatchMode=yes', 'fitelson@fitelson.org', 'mkdir -p /home/fitelson/www/www/DoSAT/dist/assets'], check=True)
    ordered = sorted(files, key=lambda name: (2 if name == 'index.html' else 1 if name.endswith('.html') else 0, name))
    for name in ordered:
        subprocess.run(['scp', '-o', 'BatchMode=yes', str(package / name), 'fitelson@fitelson.org:/home/fitelson/www/www/DoSAT/' + name], check=True)
    print(json.dumps({'uploaded': len(files), 'target': manifest['target']}))
else:
    assert sys.argv[2] == 'verify'
    code = '''import pathlib,hashlib,json
files=JSONFILES
root=pathlib.Path('/home/fitelson/www/www/DoSAT')
rows=[]
for name,expected in files.items():
 data=(root/name).read_bytes(); actual={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
 assert actual==expected,(name,actual,expected)
 rows.append({'file':name,**actual})
print(json.dumps({'target':'https://fitelson.org/DoSAT/','verified':len(rows),'files':rows}))
'''.replace('JSONFILES', repr(files))
    result = subprocess.run(['ssh', '-o', 'BatchMode=yes', 'fitelson@fitelson.org', 'python3 -'], input=code, text=True, capture_output=True, check=True)
    remote = json.loads(result.stdout)
    (review / 'live-remote-verification.json').write_text(json.dumps(remote, indent=2)+'\n')
    rows = []
    for name, expected in files.items():
        if name.endswith('/.htaccess'): continue
        url = manifest['target'] + name + '?release=' + expected['sha256'][:16]
        with urllib.request.urlopen(url) as response:
            data = response.read()
            assert len(data) == expected['bytes'] and hashlib.sha256(data).hexdigest() == expected['sha256'], name
            headers = {key:response.headers.get(key) for key in ['Content-Type','Cross-Origin-Opener-Policy','Cross-Origin-Embedder-Policy']}
            if name.startswith('dist/'):
                assert headers['Cross-Origin-Opener-Policy'] == 'same-origin', (name,headers)
                assert headers['Cross-Origin-Embedder-Policy'] == 'require-corp', (name,headers)
            if name.endswith('.wasm'): assert headers['Content-Type'].split(';',1)[0] == 'application/wasm'
            rows.append({'file':name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'headers':headers})
    (review / 'live-http-verification.json').write_text(json.dumps({'verified':len(rows),'files':rows}, indent=2)+'\n')
    print(json.dumps({'remote':remote['verified'],'https':len(rows),'headers':'verified'}))
