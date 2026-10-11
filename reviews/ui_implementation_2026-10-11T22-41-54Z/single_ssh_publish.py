"""Publish approved DoSAT files over one SSH session, preserving old versions."""
from pathlib import Path
import hashlib, json, shlex, subprocess, sys
package = Path(sys.argv[1]).resolve()
manifest = json.loads((package / 'release-manifest.json').read_text())
assert manifest['target'] == 'https://fitelson.org/DoSAT/'
files = manifest['files']
for name, expected in files.items():
    assert name == 'index.html' or (name.startswith('dist/') and '..' not in name.split('/'))
    data = (package / name).read_bytes()
    assert len(data) == expected['bytes'] and hashlib.sha256(data).hexdigest() == expected['sha256']
remote = r'''
import pathlib,json,hashlib,sys,uuid,shutil,os
root=pathlib.Path('/home/fitelson/www/www/DoSAT')
files=json.loads(sys.argv[1])
def digest(p):
 data=p.read_bytes();return {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
needs=[name for name,expected in files.items() if not (root/name).is_file() or digest(root/name)!=expected]
needs.sort(key=lambda name:(2 if name=='index.html' else 1 if name.endswith('.html') else 0,name))
print(json.dumps(needs),flush=True)
stream=sys.stdin.buffer
for wanted in needs:
 header=json.loads(stream.readline());name=header['file'];size=header['bytes']
 assert name==wanted and size==files[name]['bytes']
 target=root/name;target.parent.mkdir(parents=True,exist_ok=True)
 temporary=target.with_name(target.name+'.upload-'+uuid.uuid4().hex)
 remaining=size;hash=hashlib.sha256()
 with temporary.open('xb') as out:
  while remaining:
   chunk=stream.read(min(remaining,262144));assert chunk,'Incomplete upload'
   out.write(chunk);hash.update(chunk);remaining-=len(chunk)
  out.flush();os.fsync(out.fileno())
 assert hash.hexdigest()==files[name]['sha256'],name
 temporary.chmod(0o644)
 if target.exists():
  previous=target.with_name(target.name+'.before-'+digest(target)['sha256'][:16])
  if not previous.exists():shutil.copy2(target,previous)
 temporary.replace(target)
rows=[]
for name,expected in files.items():
 actual=digest(root/name);assert actual==expected,name;rows.append({'file':name,**actual})
print(json.dumps({'uploaded':len(needs),'verified':len(rows),'files':rows}),flush=True)
'''
command = 'python3 -c ' + shlex.quote(remote) + ' ' + shlex.quote(json.dumps(files))
process = subprocess.Popen(['ssh','-o','BatchMode=yes','-o','ConnectTimeout=10','fitelson@fitelson.org',command],stdin=subprocess.PIPE,stdout=subprocess.PIPE)
line = process.stdout.readline()
assert line, 'SSH did not return its file inventory'
needs = json.loads(line)
for name in needs:
    process.stdin.write((json.dumps({'file':name,'bytes':files[name]['bytes']})+'\n').encode())
    with (package/name).open('rb') as source:
        for chunk in iter(lambda:source.read(262144),b''):process.stdin.write(chunk)
process.stdin.close()
result = process.stdout.read()
assert process.wait()==0, 'SSH publication failed'
data = json.loads(result)
assert data['verified']==len(files)
review=Path(__file__).resolve().parent
(review/'single-session-publication.json').write_text(json.dumps(data,indent=2)+'\n')
print(json.dumps({'uploaded':data['uploaded'],'verified':data['verified'],'target':manifest['target']}))
