import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
const open = async (page: import('@playwright/test').Page) => {
  await page.goto('/decision.html', { waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('decision-runtime')).toHaveText('Z3 ready.', { timeout: 20_000 })
  await expect(page.getByTestId('decision-runtime')).toHaveAttribute('data-z3-version', '5.1.0')
  await expect(page.getByRole('heading', { name: 'DoSAT 1.0', exact: true })).toBeVisible()
  await expect(page.locator('.decision-subtitle')).toHaveText('A Decision Procedure for Do Calculus.')
}
for (const [example, answer] of [['0', 'ENTAILS —'], ['1', 'DOES NOT ENTAIL'], ['2', 'DOES NOT ENTAIL'], ['3', 'ENTAILS —'], ['4', 'INCONSISTENT PREMISES'], ['5', 'SAT —'], ['6', 'UNSAT —'], ['7', 'ENTAILS —'], ['8', 'ENTAILS —']] as const) {
  test(`decision example ${example}: ${answer}`, async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message))
    await open(page)
    await expect(page.getByTestId('decision-seconds')).toBeDisabled()
    await page.getByTestId('decision-example').selectOption(example)
    await page.getByTestId('decision-run').click()
    await expect(page.getByTestId('decision-status')).toContainText(answer, { timeout: 20_000 })
    if (example === '2') await expect(page.getByTestId('decision-query-table')).toContainText('undefined')
    if (example === '4') await expect(page.getByTestId('decision-results')).toContainText('vacuously')
    expect(errors).toEqual([])
  })
}
test('saves and restores a decision problem without trusting its answer', async ({ page }) => {
  await open(page)
  const downloading = page.waitForEvent('download')
  await page.getByTestId('decision-save').click()
  const path = await (await downloading).path(); if (!path) throw new Error('Missing saved file')
  const value = JSON.parse((await readFile(path)).toString())
  value.answer = 'entailed'
  await page.getByTestId('decision-conclusion').fill('Pr(Y)=0')
  await page.getByLabel('Load saved decision problem').setInputFiles({ name: 'decision.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value)) })
  await expect(page.getByTestId('decision-conclusion')).toHaveValue('Pr(Y | do(X)) = 1/2')
  await expect(page.getByTestId('decision-results')).toBeEmpty()
  await expect(page.getByTestId('decision-save-smt')).toBeDisabled()
})
test('solver export contains two polynomial checks and input edits invalidate it', async ({ page }) => {
  await open(page); await page.getByTestId('decision-run').click()
  await expect(page.getByTestId('decision-status')).toContainText('ENTAILS —')
  const downloading = page.waitForEvent('download'); await page.getByTestId('decision-save-smt').click()
  const path = await (await downloading).path(); if (!path) throw new Error('Missing solver file')
  const text = (await readFile(path)).toString()
  expect(text.match(/\(check-sat-using qfnra-nlsat\)/g)).toHaveLength(2)
  expect(text).toContain('time-capped QF_NRA')
  expect(text).toContain('(reset)'); expect(text).not.toMatch(/\(\/|\(\^/)
  await page.getByTestId('decision-graph').fill('X -> Y; Y -> X')
  await expect(page.getByTestId('decision-run')).toBeDisabled()
  await expect(page.getByTestId('decision-save-smt')).toBeDisabled()
  await expect(page.getByTestId('decision-results')).toBeEmpty()
})
test('bounded mode accepts fractional seconds and runs the same decision', async ({ page }) => {
  await open(page); await page.getByTestId('decision-mode').selectOption('bounded')
  await page.getByTestId('decision-seconds').fill('16.1')
  await page.getByTestId('decision-run').click()
  await expect(page.getByTestId('decision-status')).toContainText('ENTAILS —')
})
test('empty premises test validity and regularity handles support explicitly', async ({ page }) => {
  await open(page)
  await page.getByTestId('decision-graph').fill('Z -> Y')
  await page.getByTestId('decision-premises').fill('')
  await page.getByTestId('decision-conclusion').fill('Pr(Y | do(Z=1)) = Pr(Y | Z)')
  await page.getByTestId('decision-run').click()
  await expect(page.getByTestId('decision-status')).toContainText('DOES NOT ENTAIL')
  await page.getByTestId('decision-regular').check()
  await page.getByTestId('decision-run').click()
  await expect(page.getByTestId('decision-status')).toContainText('ENTAILS —')
})
for (const width of [320, 390, 1280]) test(`decision results fit a ${width}px viewport`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); await open(page)
  await page.getByTestId('decision-example').selectOption('2')
  await page.getByTestId('decision-run').click()
  await expect(page.getByTestId('decision-status')).toContainText('DOES NOT ENTAIL')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
})
test('causal interface links to the decision procedure and back', async ({ page }) => {
  await page.goto('/causal.html')
  await page.getByRole('link', { name: 'Decide causal satisfiability or entailment' }).click()
  await expect(page).toHaveURL(/decision\.html/)
  await page.getByRole('link', { name: 'Open causal model finder' }).click()
  await expect(page).toHaveURL(/causal\.html/)
})

test('DoSAT landing page has the requested branding and fits narrow screens', async ({ page }) => {
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/webpage/dosat.html')
    await expect(page).toHaveTitle('DoSAT 1.0 — A Decision Procedure for Do Calculus.')
    await expect(page.locator('.subtitle')).toHaveText('A Decision Procedure for Do Calculus.')
    await expect(page.getByRole('link', { name: 'Run DoSAT 1.0' })).toHaveAttribute('href', './dist/decision.html')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  }
})

for (const timing of ['boundary', 'task'] as const) for (const action of ['cancel', 'edit'] as const) {
  test(`a ${timing}-scheduled ${action} at countermodel search settles and allows reuse`, async ({ page }) => {
    if (timing === 'task') {
      // Observe the real low-level check call without adding application hooks.
      await page.route('**/src/z3_integration.ts*', async route => {
        const response = await route.fetch()
        const source = await response.text()
        const marker = 'return z3_interface;'
        expect(source).toContain(marker)
        const hook = `
          const originalCheck = z3_interface.Z3.solver_check_assumptions;
          let checkNumber = 0;
          z3_interface.Z3.solver_check_assumptions = (...args) => {
            const number = ++checkNumber;
            const pending = Reflect.apply(originalCheck, z3_interface.Z3, args);
            if (number === 2) {
              document.documentElement.dataset.nativeCheckPending = 'true';
              const settled = () => { document.documentElement.dataset.nativeCheckPending = 'false'; };
              Promise.resolve(pending).then(settled, settled);
            }
            return pending;
          };
          return z3_interface;
        `
        await route.fulfill({ response, body: source.replace(marker, hook) })
      })
    }
    await open(page)
    const nodes = ['A', 'B', 'C', 'D', 'E', 'F']
    const graph = nodes.flatMap((parent, index) => nodes.slice(index + 1).map(child => `${parent} -> ${child}`)).join('; ')
    await page.getByTestId('decision-graph').fill(graph)
    await page.getByTestId('decision-premises').fill('')
    await page.getByTestId('decision-conclusion').fill('Pr(F | do(A=1)) = Pr(F | A)')
    await page.getByTestId('decision-regular').check()
    await page.evaluate(({ how, when }) => {
      const status = document.querySelector('[data-testid=decision-status]')!
      const observer = new MutationObserver(() => {
        if (!status.textContent?.includes('Searching for a countermodel')) return
        observer.disconnect()
        const act = () => {
          // A task fires after the stage's microtask yield and native check call.
          // Confirm search is still pending, rather than cancelling settled work.
          document.documentElement.dataset.searchPendingAtAction = String(status.textContent?.includes('Searching for a countermodel'))
          document.documentElement.dataset.nativePendingAtAction = document.documentElement.dataset.nativeCheckPending ?? 'unobserved'
          document.documentElement.dataset.boundaryActionAt = String(performance.now())
          if (how === 'cancel') (document.querySelector('[data-testid=decision-cancel]') as HTMLButtonElement).click()
          else {
            const premises = document.querySelector('[data-testid=decision-premises]') as HTMLTextAreaElement
            premises.value = 'Pr(A) > 0'
            premises.dispatchEvent(new Event('input', { bubbles: true }))
          }
        }
        if (when === 'task') setTimeout(act, 50)
        else act()
      })
      observer.observe(status, { childList: true, characterData: true, subtree: true })
    }, { how: action, when: timing })
    await page.getByTestId('decision-run').click()
    await expect(page.locator('html')).toHaveAttribute('data-boundary-action-at', /\d/, { timeout: 10_000 })
    await expect(page.locator('html')).toHaveAttribute('data-search-pending-at-action', 'true')
    if (timing === 'task') await expect(page.locator('html')).toHaveAttribute('data-native-pending-at-action', 'true')
    // An instance regression threshold, not a universal physical deadline.
    const threshold = timing === 'task' ? 10_000 : 3000
    await expect(page.getByTestId('decision-status')).toHaveText(action === 'cancel' ? 'Cancelled — no decision established.' : 'Input changed; decide the current problem.', { timeout: threshold })
    const elapsed = await page.evaluate(() => performance.now() - Number(document.documentElement.dataset.boundaryActionAt))
    expect(elapsed).toBeLessThan(threshold)
    await expect(page.getByTestId('decision-run')).toBeEnabled()
    await page.getByTestId('decision-example').selectOption('0')
    await page.getByTestId('decision-run').click()
    await expect(page.getByTestId('decision-status')).toContainText('ENTAILS —', { timeout: 20_000 })
  })
}

test('Simpson example entails its four exact observed and intervened recovery rates', async ({ page }) => {
  await open(page)
  await page.getByTestId('decision-example').selectOption('7')
  await page.getByTestId('decision-conclusion').fill('(Pr(Y | X) = 63/100) & (Pr(Y | ~X) = 77/100) & (Pr(Y | do(X)) = 3/4) & (Pr(Y | do(~X)) = 13/20)')
  await page.getByTestId('decision-run').click()
  await expect(page.getByTestId('decision-status')).toContainText('ENTAILS —', { timeout: 20_000 })
})
