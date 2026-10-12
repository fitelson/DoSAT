"""Approved single-page release transport; one SSH session, no cleanup/deletion."""
from pathlib import Path
import hashlib,json,shlex,subprocess,sys
review=Path(__file__).resolve().parent
package=Path(sys.argv[1]).resolve();manifest=json.loads((package/'release-manifest.json').read_text());files=manifest['files']
assert manifest['target']=='https://fitelson.org/DoSAT/' and manifest['pages']==['index.html']
assert sum(name.endswith('.html') for name in files)==1
allowed={'.htaccess','dist/.htaccess','index.html','z3-built.js','z3-built.wasm','coi-serviceworker.js'}
for name,expected in files.items():
 assert name in allowed or (name.startswith('assets/') and len(Path(name).parts)==2)
 assert '..' not in Path(name).parts and not Path(name).is_absolute()
 data=(package/name).read_bytes();assert len(data)==expected['bytes'] and hashlib.sha256(data).hexdigest()==expected['sha256']
headers=(package/'.htaccess').read_bytes().split(b'# One public DoSAT page.',1)[0]
bootstrap={'bytes':len(headers),'sha256':hashlib.sha256(headers).hexdigest()}
remote=r'''
import pathlib,json,hashlib,sys,uuid,os,shutil
root=pathlib.Path('/home/fitelson/www/www/DoSAT');root.mkdir(parents=True,exist_ok=True)
files=json.loads(sys.argv[1]);bootstrap=json.loads(sys.argv[2])
def digest(p):
 d=p.read_bytes();return {'bytes':len(d),'sha256':hashlib.sha256(d).hexdigest()}
needs=[name for name,v in files.items() if not (root/name).is_file() or digest(root/name)!=v]
plan=[{'name':n,**files[n]} for n in sorted(needs) if n not in ['index.html','.htaccess','dist/.htaccess']]
if 'index.html' in needs:
 plan.append({'name':'.htaccess','bootstrap':True,**bootstrap})
 plan.append({'name':'index.html',**files['index.html']})
if '.htaccess' in needs or 'index.html' in needs:plan.append({'name':'.htaccess',**files['.htaccess']})
if 'dist/.htaccess' in needs:plan.append({'name':'dist/.htaccess',**files['dist/.htaccess']})
print(json.dumps(plan),flush=True)
backup=root/'.release-backups';backup.mkdir(exist_ok=True)
guard=backup/'.htaccess'
if not guard.exists():guard.write_text('Require all denied\n')
else:assert guard.read_text()=='Require all denied\n'
for item in plan:
 header=json.loads(sys.stdin.buffer.readline());assert header==item
 name=item['name'];target=root/name;target.parent.mkdir(parents=True,exist_ok=True)
 temporary=target.with_name(target.name+'.upload-'+uuid.uuid4().hex);remaining=item['bytes'];hash=hashlib.sha256()
 with temporary.open('xb') as out:
  while remaining:
   chunk=sys.stdin.buffer.read(min(remaining,262144));assert chunk,'Incomplete upload'
   out.write(chunk);hash.update(chunk);remaining-=len(chunk)
  out.flush();os.fsync(out.fileno())
 assert hash.hexdigest()==item['sha256'];temporary.chmod(0o644)
 if target.exists():
  old=digest(target);saved=backup/(name.replace('/','_')+'.'+old['sha256'])
  if not saved.exists():shutil.copy2(target,saved)
  else:assert digest(saved)==old
 temporary.replace(target)
rows=[]
for name,v in files.items():
 actual=digest(root/name);assert actual==v,name;rows.append({'file':name,**actual})
print(json.dumps({'steps':len(plan),'verified':len(rows),'files':rows}),flush=True)
'''
command='python3 -c '+shlex.quote(remote)+' '+shlex.quote(json.dumps(files))+' '+shlex.quote(json.dumps(bootstrap))
process=subprocess.Popen(['ssh','-o','BatchMode=yes','-o','ConnectTimeout=10','fitelson@fitelson.org',command],stdin=subprocess.PIPE,stdout=subprocess.PIPE)
line=process.stdout.readline();assert line,'No SSH inventory';plan=json.loads(line)
for item in plan:
 process.stdin.write((json.dumps(item)+'\n').encode())
 if item.get('bootstrap'):process.stdin.write(headers)
 else:
  with (package/item['name']).open('rb') as source:
   for chunk in iter(lambda:source.read(262144),b''):process.stdin.write(chunk)
process.stdin.close();result=process.stdout.read();assert process.wait()==0,'Publication failed'
data=json.loads(result);assert data['verified']==len(files)
(review/'remote-verification.json').write_text(json.dumps(data,indent=2)+'\n')
print(json.dumps({'steps':data['steps'],'verified':data['verified'],'target':manifest['target']}))
