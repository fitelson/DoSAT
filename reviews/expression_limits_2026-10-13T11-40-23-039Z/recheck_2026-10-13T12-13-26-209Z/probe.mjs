import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const here = path.dirname(fileURLToPath(import.meta.url))
const manifest = JSON.parse(fs.readFileSync(path.join(here, 'release-manifest.json'), 'utf8'))
const problem = JSON.parse(fs.readFileSync(path.join(here, 'independencies-nonregular.json'), 'utf8'))
const live = process.argv[2] === 'live'
let server, base = 'https://fitelson.org/DoSAT/'
if (!live) {
  const packagePath = fs.readFileSync(path.join(here, 'package-path.txt'), 'utf8').trim()
  server = http.createServer((req, res) => {
    const name = new URL(req.url, 'http://localhost').pathname.slice(1) || 'index.html'
    if (!Object.hasOwn(manifest.files, name) || name.endsWith('.htaccess')) { res.writeHead(404); res.end(); return }
    const type = name.endsWith('.html') ? 'text/html' : name.endsWith('.js') ? 'text/javascript' : name.endsWith('.css') ? 'text/css' : name.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream'
    res.writeHead(200, { 'Content-Type': type, 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp' })
    res.end(fs.readFileSync(path.join(packagePath, name)))
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  base = `http://127.0.0.1:${server.address().port}/`
}
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
const errors = [], checks = []
page.on('pageerror', e => errors.push(e.message))
const run = async expected => {
  const start = performance.now()
  await page.getByTestId('decision-run').click()
  await page.waitForFunction(value => document.querySelector('[data-testid=decision-status]')?.textContent.startsWith(value), expected, { timeout: 90000 })
  return Math.round(performance.now() - start)
}
try {
  const response = await page.goto(base)
  const asset = Object.keys(manifest.files).find(name => name.startsWith('assets/') && name.endsWith('.js'))
  assert.ok((await response.text()).includes(asset))
  await page.getByTestId('decision-runtime').getByText('Z3 ready.', { exact: true }).waitFor({ timeout: 60000 })
  assert.equal(await page.evaluate(() => crossOriginIsolated), true)
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    await page.getByLabel('Load saved decision problem').setInputFiles({ name: 'independencies.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(problem)) })
    assert.equal(await page.getByTestId('decision-regular').isChecked(), false)
    assert.equal(await page.getByTestId('decision-conclusion').inputValue(), problem.conclusion)
    checks.push({ width, case: 'graph alone, Regular off', result: 'ENTAILS', milliseconds: await run('ENTAILS —') })
    await page.getByTestId('decision-premise-1').fill('Pr(U) = 0')
    checks.push({ width, case: 'zero-support premise, Regular off', result: 'ENTAILS', milliseconds: await run('ENTAILS —') })
    await page.getByTestId('decision-task-satisfiability').check()
    checks.push({ width, case: 'zero-support premises have a model', result: 'SAT', milliseconds: await run('SAT —') })
    await page.getByTestId('decision-task-entailment').check()
    await page.getByTestId('decision-conclusion').fill(problem.conclusion + ' & (Pr(M) = 2)')
    checks.push({ width, case: 'false appended clause is checked', result: 'DOES NOT ENTAIL', milliseconds: await run('DOES NOT ENTAIL') })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth) <= width)
  }
  await page.getByTestId('decision-conclusion').fill(Array(1024).fill('1').join('+') + '=1')
  await page.getByText(/Each causal constraint or expression is limited to 2048 tokens/).waitFor()
  assert.equal(await page.getByTestId('decision-run').isDisabled(), true)
  await page.getByTestId('decision-conclusion').fill(Array(129).fill('Pr(M)').join('+') + '=1')
  await page.getByText(/At most 128 probability queries/).waitFor()
  assert.equal(await page.getByTestId('decision-run').isDisabled(), true)
  assert.deepEqual(errors, [])
  const prefixMilliseconds = await page.evaluate(() => {
    const input = document.querySelector('[data-testid=decision-conclusion]')
    const regular = document.querySelector('[data-testid=decision-regular]')
    const start = performance.now()
    input.value = '-'.repeat(2045) + '=0'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    regular.checked = !regular.checked
    regular.dispatchEvent(new Event('input', { bubbles: true }))
    return performance.now() - start
  })
  await page.getByText(/limit 128 unary prefix operators per AST root/).waitFor()
  assert.ok(prefixMilliseconds < 1000)
  await page.getByTestId('decision-conclusion').fill('0=0')
  assert.equal(await page.getByTestId('decision-run').isEnabled(), true)
  assert.deepEqual(errors, [])
  fs.writeFileSync(path.join(here, live ? 'live-probe.json' : 'package-probe.json'), JSON.stringify({ base, checks, budgetRejections: ['2049 tokens', '129 probability queries'], prefixMilliseconds, recoversAfterPrefixError: true, errors }, null, 2) + '\n', { flag: 'wx' })
  console.log(JSON.stringify({ passed: true, verdictChecks: checks.length, budgetRejections: 2, live }))
} finally {
  await browser.close()
  if (server) await new Promise(resolve => server.close(resolve))
}
