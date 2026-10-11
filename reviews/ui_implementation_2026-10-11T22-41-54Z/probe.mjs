import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
const base = process.env.PROBE_URL ?? 'http://127.0.0.1:4173/'
const out = process.env.PROBE_OUTPUT ?? new URL('./package-probe.json', import.meta.url).pathname
const capture = process.env.PROBE_CAPTURE === '1'
const browser = await chromium.launch({ headless: true })
const rows = []
for (const width of [1280, 390, 320]) {
  for (let example = 0; example < 9; example++) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    const errors = []; page.on('pageerror', error => errors.push(error.message))
    await page.goto(base); await page.getByRole('link', { name: 'Run DoSAT 1.0' }).click()
    await page.waitForFunction(() => document.querySelector('[data-testid=decision-runtime]')?.textContent === 'Z3 ready.')
    await page.evaluate(() => document.fonts.ready)
    assert.equal(await page.getByTestId('decision-runtime').getAttribute('data-z3-version'), '5.1.0')
    if (example === 0) {
      const box = await page.getByTestId('decision-run').boundingBox()
      if (width !== 320) assert.ok(box.y <= (width === 1280 ? 800 : 950))
      if (capture) await page.screenshot({ path: path.join(path.dirname(out), `final-initial-${width}.png`), fullPage: true })
      const cdp = await page.context().newCDPSession(page); await cdp.send('DOM.enable'); await cdp.send('CSS.enable')
      const { root } = await cdp.send('DOM.getDocument')
      const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '[data-testid=decision-run]' })
      const fonts = await cdp.send('CSS.getPlatformFontsForNode', { nodeId })
      rows.push({ kind: 'initial', width, runY: box.y, fonts: fonts.fonts, version: '5.1.0' })
    }
    await page.getByTestId('decision-example').selectOption(String(example)); await page.getByTestId('decision-run').click()
    const expected = ['ENTAILS —','DOES NOT ENTAIL','DOES NOT ENTAIL','ENTAILS —','INCONSISTENT PREMISES','SAT —','UNSAT —','ENTAILS —','ENTAILS —'][example]
    await page.waitForFunction(expected => document.querySelector('[data-testid=decision-status]')?.textContent.includes(expected), expected)
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    assert.ok(documentWidth <= width); assert.deepEqual(errors, [])
    assert.ok(!(await page.getByTestId('decision-results').textContent()).includes('CausalQuery'))
    if ([1,2,5].includes(example)) { assert.equal(await page.getByTestId('decision-distribution-table').isVisible(), true) }
    if (capture && [1,2,5,8].includes(example)) await page.screenshot({ path: path.join(path.dirname(out), `final-example-${example}-${width}.png`), fullPage: true })
    rows.push({ kind: 'example', width, example, expected, documentWidth, isolated: await page.evaluate(() => crossOriginIsolated), errors })
    await page.close()
  }
}
const page = await browser.newPage({ viewport: { width: 390, height: 900 } })
await page.goto(new URL('dist/decision.html', base).href)
await page.waitForFunction(() => document.querySelector('[data-testid=decision-runtime]')?.textContent === 'Z3 ready.')
await page.getByTestId('decision-example').selectOption('1'); await page.getByTestId('decision-run').click()
await page.waitForFunction(() => document.querySelector('[data-testid=decision-status]')?.textContent.includes('DOES NOT ENTAIL'))
await page.getByTestId('decision-batch-toggle').click(); await page.getByTestId('decision-premises').fill('Pr(Z)=1/2\n\n# comment\nPr(Q)=0')
assert.equal(await page.getByTestId('decision-run').isDisabled(), true)
assert.equal(await page.getByTestId('decision-save-smt').isDisabled(), true)
assert.equal(await page.getByTestId('decision-results').textContent(), '')
await page.getByTestId('decision-batch-toggle').click(); assert.equal(await page.getByTestId('decision-run').isDisabled(), true)
await page.getByTestId('decision-batch-toggle').click(); await page.getByTestId('decision-parse').click()
assert.equal(await page.getByTestId('decision-premise-4').getAttribute('aria-invalid'), 'true')
assert.ok((await page.getByTestId('decision-validation').textContent()).includes('Premise 4'))
await page.getByRole('link', { name: 'Fix Premise 4.' }).click()
assert.equal(await page.getByTestId('decision-premise-4').evaluate(e => e === document.activeElement), true)
if (capture) await page.screenshot({ path: path.join(path.dirname(out), 'final-batch-error-390.png'), fullPage: true })
await page.getByTestId('decision-clear').click(); assert.equal(await page.getByTestId('decision-conclusion').inputValue(), 'Pr(Y | do(X)) = 3/4')
await page.getByTestId('decision-task-satisfiability').check(); assert.equal(await page.getByTestId('decision-conclusion').isVisible(), false)
await page.getByTestId('decision-task-entailment').check(); assert.equal(await page.getByTestId('decision-conclusion').inputValue(), 'Pr(Y | do(X)) = 3/4')
rows.push({ kind: 'batch-error-clear-task', width: 390, passed: true })
await browser.close(); fs.writeFileSync(out, JSON.stringify({ base, checks: rows.length, rows }, null, 2)+'\n', { flag: 'wx' }); console.log(JSON.stringify({ checks: rows.length, output: out }))
