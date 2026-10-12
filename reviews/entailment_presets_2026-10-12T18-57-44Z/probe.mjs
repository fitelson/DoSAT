import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'

const here = path.dirname(new URL(import.meta.url).pathname)
const base = process.env.PROBE_URL ?? 'http://127.0.0.1:4173/'
const out = process.env.PROBE_OUTPUT ?? path.join(here, 'package-probe.json')
const capture = process.env.PROBE_CAPTURE === '1'
const presets = JSON.parse(fs.readFileSync(path.join(here, 'presets.json'), 'utf8'))
const browser = await chromium.launch({ headless: true })
const rows = []
try {
  for (const width of [1280, 390, 320]) {
    for (const [index, example] of presets.entries()) {
      const page = await browser.newPage({ viewport: { width, height: 900 } })
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.goto(base, { waitUntil: 'domcontentloaded' })
      await page.getByTestId('decision-runtime').getByText('Z3 ready.', { exact: true }).waitFor({timeout:60_000})
      assert.equal(await page.getByTestId('decision-runtime').getAttribute('data-z3-version'), '5.1.0')
      assert.equal(await page.evaluate(() => crossOriginIsolated), true)
      assert.equal(await page.getByTestId('decision-status').textContent(), 'Choose a decision problem.')
      assert.equal(await page.getByTestId('decision-example-guide').isVisible(), true)
      assert.equal(await page.getByTestId('decision-example-guide').getAttribute('open'), null)
      const names = await page.getByTestId('decision-example').locator('option').allTextContents()
      assert.deepEqual(names, ['Choose an example…', ...presets.map(item => item.name)])
      await page.getByTestId('decision-example').selectOption(String(index))
      const guide = page.getByTestId('decision-example-guide')
      await guide.locator('summary').click()
      assert.ok((await guide.textContent()).includes(example.description))
      assert.equal(await guide.locator('a').getAttribute('href'), example.source.url)
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth) <= width)
      await page.getByTestId('decision-run').click()
      const verdict = example.expectedStatus === 'SAT' ? 'SAT —'
        : example.expectedStatus === 'ENTAILS' ? 'ENTAILS —' : 'DOES NOT ENTAIL'
      await page.waitForFunction(value => document.querySelector('[data-testid=decision-status]')?.textContent.includes(value), verdict, {timeout:90_000})
      assert.equal(await page.getByTestId('decision-conclusion').inputValue(), example.conclusion)
      assert.equal(await page.getByTestId('decision-task-entailment').isChecked(), true)
      if (capture && (index === 0 || index === 6)) {
        await page.evaluate(() => document.fonts.ready)
        await page.screenshot({ path: path.join(here, `${process.env.PROBE_CAPTURE_PREFIX ?? ''}${index === 0 ? 'berkson' : 'simpson'}-${width}.png`), fullPage: true })
      }
      const evaluations = []
      if (example.expectedStatus === 'ENTAILS' && example.evaluations.length) {
        assert.equal(await page.getByTestId('model-evaluate-input').isVisible(), false)
        await page.getByTestId('decision-task-satisfiability').check()
        await page.getByTestId('decision-run').click()
        await page.waitForFunction(() => document.querySelector('[data-testid=decision-status]')?.textContent.includes('SAT —'))
      }
      for (const item of example.evaluations) {
        await page.getByTestId('model-evaluate-input').fill(item.expression)
        await page.getByTestId('model-evaluate-run').click()
        const expected = typeof item.value === 'boolean' ? `${item.value ? 'True' : 'False'} in this model.`
          : `Exact value in this model: ${item.value}`
        await page.waitForFunction(value => document.querySelector('[data-testid=model-evaluate-result] .model-evaluation-value')?.textContent === value, expected)
        if (example.expectedStatus === 'DOES NOT ENTAIL') {
          const terms = page.getByTestId('model-evaluate-probabilities')
          assert.equal(await terms.isVisible(), true)
          assert.equal(await terms.locator('tbody tr').count(), 1)
          assert.ok(!(await terms.textContent()).includes('undefined'))
        }
        evaluations.push({ expression: item.expression, expected, passed: true })
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth) <= width)
      assert.deepEqual(errors, [])

      await page.getByTestId('decision-example').selectOption('')
      assert.equal(await page.getByTestId('decision-example-guide').isVisible(), false)
      await page.getByTestId('decision-example').selectOption(String(index))
      assert.equal(await page.getByTestId('decision-example-guide').isVisible(), true)
      await page.getByTestId('decision-clear').click()
      assert.equal(await page.getByTestId('decision-example-guide').isVisible(), false)
      rows.push({ width, example: example.name, verdict, evaluations, guideClearAndBlank: true, errors })
      console.log(JSON.stringify({width,example:example.name,verdict,evaluations:evaluations.length,passed:true}))
      await page.close()
    }
  }
} finally { await browser.close() }
fs.writeFileSync(out, JSON.stringify({ base, cases: rows.length, evaluations: rows.reduce((n, row) => n+row.evaluations.length, 0), rows }, null, 2)+'\n', { flag: 'wx' })
console.log(JSON.stringify({ cases: rows.length, evaluations: rows.reduce((n, row) => n+row.evaluations.length, 0), out }))
