import { promises as fs, constants } from 'node:fs'
import { createHash, randomUUID } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const tag = new Date().toISOString().replace(/[:.]/g, '-') + '-' + randomUUID().slice(0, 8)
const destination = path.join(root, 'releases', 'DoSAT-1.0-' + tag)
const queue = ['index.html', 'causal.html', 'do_calculus.html', 'decision.html']
const seen = new Set()
while (queue.length) {
  const relative = queue.pop()
  if (seen.has(relative)) continue
  const source = path.join(dist, relative)
  const stat = await fs.lstat(source)
  if (!stat.isFile() || stat.isSymbolicLink()) throw Error('Expected a regular built file: ' + relative)
  seen.add(relative)
  const text = await fs.readFile(source, 'utf8')
  const pattern = relative.endsWith('.html')
    ? /(?:src|href)=["'](?:\.\/|\/)?(assets\/[A-Za-z0-9_.-]+)["']/g
    : /["'](?:\.\/)?([A-Za-z0-9_-]+\.(?:js|css))["']/g
  for (const match of text.matchAll(pattern)) queue.push(relative.endsWith('.html') ? match[1] : path.posix.join(path.posix.dirname(relative), match[1]))
}
for (const stable of ['.htaccess', 'coi-serviceworker.js', 'z3-built.js', 'z3-built.wasm']) {
  const stat = await fs.lstat(path.join(dist, stable))
  if (!stat.isFile() || stat.isSymbolicLink()) throw Error('Expected stable runtime file: ' + stable)
  seen.add(stable)
}
const title = 'DoSAT 1.0'
const subtitle = 'A Decision Procedure for Do Calculus.'
const landing = path.join(root, 'webpage', 'dosat.html')
const landingText = await fs.readFile(landing, 'utf8')
if (!landingText.includes(title) || !landingText.includes(subtitle)) throw Error('Landing page branding is missing.')
await fs.mkdir(path.join(root, 'releases'), { recursive: true })
await fs.mkdir(destination)
await fs.mkdir(path.join(destination, 'dist'))
const files = {}
const copy = async (source, relative) => {
  const target = path.join(destination, relative)
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.copyFile(source, target, constants.COPYFILE_EXCL)
  const data = await fs.readFile(target)
  files[relative] = { bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') }
}
await copy(landing, 'index.html')
for (const relative of [...seen].sort()) await copy(path.join(dist, relative), 'dist/' + relative)
const manifest = { product: title, subtitle, target: 'https://fitelson.org/DoSAT/', state: 'prepared; publication requires completed phase review', createdAt: new Date().toISOString(), files }
await fs.writeFile(path.join(destination, 'release-manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ destination, files: Object.keys(files).length, target: manifest.target }))
