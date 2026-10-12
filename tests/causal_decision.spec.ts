import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { loadDecisionFixture } from './decision_helpers'
const open = async (page: import('@playwright/test').Page) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('decision-runtime')).toHaveText('Z3 ready.', { timeout: 20_000 })
  await expect(page.getByTestId('decision-runtime')).toHaveAttribute('data-z3-version', '5.1.0')
  await expect(page.getByRole('heading', { name: 'DoSAT 1.0', exact: true })).toBeVisible()
  await expect(page.locator('.decision-subtitle')).toHaveText('A Decision Procedure for Do Calculus.')
  await loadDecisionFixture(page, 0)
}
for (const [example, answer] of [['0', 'ENTAILS —'], ['1', 'DOES NOT ENTAIL'], ['2', 'DOES NOT ENTAIL'], ['3', 'ENTAILS —'], ['4', 'INCONSISTENT PREMISES'], ['5', 'SAT —'], ['6', 'UNSAT —'], ['7', 'ENTAILS —'], ['8', 'ENTAILS —']] as const) {
  test(`retained decision regression ${example}: ${answer}`, async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message))
    await open(page)
    await expect(page.getByTestId('decision-seconds')).toBeDisabled()
    await loadDecisionFixture(page, Number(example))
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
  await open(page); await page.getByTestId('decision-mode').check()
  await page.getByTestId('decision-seconds').fill('16.1')
  await page.getByTestId('decision-run').click()
  await expect(page.getByTestId('decision-status')).toContainText('ENTAILS —')
})
test('empty premises test validity and regularity handles support explicitly', async ({ page }) => {
  await open(page)
  await page.getByTestId('decision-graph').fill('Z -> Y')
  await page.getByTestId('decision-clear').click()
  await page.getByTestId('decision-conclusion').fill('Pr(Y | do(Z=1)) = Pr(Y | Z)')
  await page.getByTestId('decision-run').click()
  await expect(page.getByTestId('decision-status')).toContainText('DOES NOT ENTAIL')
  await page.getByTestId('decision-regular').check()
  await page.getByTestId('decision-run').click()
  await expect(page.getByTestId('decision-status')).toContainText('ENTAILS —')
})
for (const width of [320, 390, 1280]) test(`decision results fit a ${width}px viewport`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); await open(page)
  await loadDecisionFixture(page, 2)
  await page.getByTestId('decision-run').click()
  await expect(page.getByTestId('decision-status')).toContainText('DOES NOT ENTAIL')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
})
test('the root is the single DoSAT interface with no auxiliary navigation', async ({ page }) => {
  for (const width of [320,390,1280]) {
    await page.setViewportSize({width,height:900}); await open(page)
    await expect(page).toHaveTitle('DoSAT 1.0 — A Decision Procedure for Do Calculus.')
    await expect(page.getByRole('link',{name:'GitHub'})).toHaveAttribute('href','https://github.com/fitelson/DoSAT')
    await expect(page.locator('a[href*=causal\\.html],a[href*=do_calculus]')).toHaveCount(0)
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
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
    await page.getByTestId('decision-clear').click()
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
            const premises = document.querySelector('[data-testid=decision-premise-1]') as HTMLInputElement
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
    await loadDecisionFixture(page, 0)
    await page.getByTestId('decision-run').click()
    await expect(page.getByTestId('decision-status')).toContainText('ENTAILS —', { timeout: 20_000 })
  })
}

test('the E/M/A Simpson example entails the supplied table and its exact intervention rates', async ({ page }) => {
  await open(page)
  await page.getByTestId('decision-example').selectOption('6')
  await expect(page.getByTestId('decision-graph')).toHaveValue('E -> M; E -> A; M -> A')
  await page.getByTestId('decision-conclusion').fill('(Pr(A | M) = 7/13) & (Pr(A | ~M) = 6/13) & (Pr(A | E) = 10/13) & (Pr(A | ~E) = 3/13) & (Pr(A) = 1/2) & (Pr(A | do(M)) = 19/40) & (Pr(A | do(~M)) = 21/40)')
  await page.getByTestId('decision-run').click()
  await expect(page.getByTestId('decision-status')).toContainText('ENTAILS —', { timeout: 20_000 })
})

test('the PrSAT-style action is reachable and the regression row previews render', async ({ page }) => {
  for (const [width, maximumY] of [[1280, 800], [390, 950]]) {
    await page.setViewportSize({ width, height: 900 }); await open(page)
    await page.evaluate(() => document.fonts.ready)
    const box = await page.getByTestId('decision-run').boundingBox()
    expect(box?.y).toBeLessThanOrEqual(maximumY)
    const lastInput = await page.getByTestId('decision-conclusion').boundingBox()
    expect(box!.y - lastInput!.y - lastInput!.height).toBeLessThanOrEqual(125)
    await expect(page.getByTestId('decision-premise-1')).toHaveAccessibleName('Premise 1')
    await expect(page.locator('.decision-premise-rows math')).toHaveCount(4)
    await expect(page.locator('.decision-conclusion-row .causal-intervention')).toContainText('do')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  }
})

test('row keys split, navigate and merge without losing focus', async ({ page }) => {
  await open(page)
  const first = page.getByTestId('decision-premise-1')
  await first.focus(); await first.press('End'); await first.press('Enter')
  await expect(page.getByTestId('decision-premise-2')).toBeFocused()
  await expect(page.getByTestId('decision-premise-2')).toHaveValue('')
  await page.getByTestId('decision-premise-2').press('ArrowUp'); await expect(first).toBeFocused()
  await first.press('ArrowDown'); await expect(page.getByTestId('decision-premise-2')).toBeFocused()
  await page.getByTestId('decision-premise-2').press('Backspace'); await expect(first).toBeFocused()
  await expect(page.locator('.decision-premise-rows input.text')).toHaveCount(4)
  await expect(page.getByTestId('decision-run')).toBeEnabled()
})

test('unapplied batch changes invalidate results and remain blocked when hidden', async ({ page }) => {
  await open(page); await page.getByTestId('decision-run').click()
  await expect(page.getByTestId('decision-status')).toContainText('ENTAILS —')
  await page.getByTestId('decision-batch-toggle').click()
  await page.getByTestId('decision-premises').fill('Pr(Z)=1/2\n\n# comment\nPr(Q)=0')
  await expect(page.getByTestId('decision-results')).toBeEmpty()
  await expect(page.getByTestId('decision-save-smt')).toBeDisabled()
  await expect(page.getByTestId('decision-run')).toBeDisabled()
  await page.getByTestId('decision-batch-toggle').click()
  await expect(page.getByTestId('decision-premises')).toBeHidden()
  await expect(page.getByTestId('decision-validation')).toContainText('unapplied')
  await expect(page.getByTestId('decision-run')).toBeDisabled()
  await page.getByTestId('decision-batch-toggle').click(); await page.getByTestId('decision-parse').click()
  await expect(page.getByTestId('decision-premise-4')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByTestId('decision-validation')).toContainText('Premise 4')
  await page.getByRole('link', { name: 'Fix Premise 4.' }).click()
  await expect(page.getByTestId('decision-premise-4')).toBeFocused()
  await expect(page.getByTestId('decision-conclusion')).toHaveValue('Pr(Y | do(X)) = 1/2')
})

test('clear and batch discard preserve the graph, conclusion and options', async ({ page }) => {
  await open(page); await page.getByTestId('decision-regular').check(); await page.getByTestId('decision-mode').check()
  await page.getByTestId('decision-batch-toggle').click(); await page.getByTestId('decision-premises').fill('Pr(Q)=0')
  await page.getByTestId('decision-discard-batch').click()
  await expect(page.getByTestId('decision-run')).toBeEnabled()
  await page.getByTestId('decision-clear').click()
  await expect(page.getByTestId('decision-graph')).toHaveValue('Z -> X; Z -> Y')
  await expect(page.getByTestId('decision-conclusion')).toHaveValue('Pr(Y | do(X)) = 1/2')
  await expect(page.getByTestId('decision-regular')).toBeChecked()
  await expect(page.getByTestId('decision-mode')).toBeChecked()
  await expect(page.getByTestId('decision-validation')).toHaveText('No premises: checks validity.')
  await expect(page.getByTestId('decision-run')).toBeEnabled()
})

test('a countermodel shows visible exact regime rows and the submitted claim', async ({ page }) => {
  await open(page); await loadDecisionFixture(page, 1); await page.getByTestId('decision-run').click()
  await expect(page.getByTestId('decision-status')).toContainText('DOES NOT ENTAIL')
  await expect(page.getByTestId('decision-distribution-table')).toBeVisible()
  await expect(page.getByTestId('decision-distribution-table')).toContainText('⊤')
  await expect(page.getByTestId('decision-distribution-table')).toContainText('⊥')
  await expect(page.getByTestId('decision-submitted-conclusion')).toContainText('do')
  await expect(page.getByTestId('decision-query-table')).toContainText('1/2')
  await expect(page.getByTestId('decision-results')).not.toContainText('CausalQuery')
  await expect(page.getByTestId('decision-mechanism-table')).toBeHidden()
})

test('task switching hides but saves the inactive conclusion draft', async ({ page }) => {
  await open(page); await page.getByTestId('decision-task-satisfiability').check()
  await expect(page.getByTestId('decision-conclusion')).toBeHidden()
  await expect(page.getByTestId('decision-run')).toHaveText('Find Model')
  const downloading = page.waitForEvent('download'); await page.getByTestId('decision-save').click()
  const path = await (await downloading).path(); if (!path) throw new Error('Missing saved problem')
  const value = JSON.parse((await readFile(path)).toString())
  expect(value.task).toBe('satisfiability'); expect(value.conclusion).toBe('Pr(Y | do(X)) = 1/2')
  await page.getByTestId('decision-task-entailment').check()
  await expect(page.getByTestId('decision-conclusion')).toBeVisible()
  await expect(page.getByTestId('decision-conclusion')).toHaveValue(value.conclusion)
})

for (const width of [390, 320]) test(`long formulas scroll by keyboard within their own regions at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); await open(page)
  await loadDecisionFixture(page, 8)
  const backdoor = 'Pr(Y | do(X)) = Pr(Y | X & Z)*Pr(Z) + Pr(Y | X & ~Z)*Pr(~Z)'
  await page.getByTestId('decision-premise-1').fill(backdoor)
  const preview = page.getByRole('region', { name: 'Premise 1 preview', exact: true })
  const assertScroll = async (region: typeof preview) => {
    const size = await region.evaluate(e => ({ client: e.clientWidth, scroll: e.scrollWidth }))
    expect(size.client).toBeGreaterThan(0); expect(size.scroll).toBeGreaterThan(size.client)
    await region.focus(); await region.press('ArrowRight')
    await expect.poll(() => region.evaluate(e => e.scrollLeft)).toBeGreaterThan(0)
    await region.evaluate(e => { e.scrollLeft = e.scrollWidth })
    const end = await region.evaluate(e => {
      const leaves = e.querySelectorAll('mi,mn,mo')
      return { end: leaves[leaves.length - 1].getBoundingClientRect().right, containerEnd: e.getBoundingClientRect().right }
    })
    expect(end.end).toBeLessThanOrEqual(end.containerEnd + 2)
  }
  await assertScroll(preview)
  const incorrect = 'Pr(Y | do(X)) = Pr(Y | X & Z)*Pr(Z) + Pr(Y | X & ~Z)*Pr(Z)'
  await page.getByTestId('decision-clear').click(); await page.getByTestId('decision-conclusion').fill(incorrect)
  await assertScroll(page.getByRole('region', { name: 'Conclusion preview', exact: true }))
  await page.getByTestId('decision-run').click(); await expect(page.getByTestId('decision-status')).toContainText('DOES NOT ENTAIL')
  await assertScroll(page.getByRole('region', { name: 'Submitted conclusion formula', exact: true }))
  expect(await page.locator('.decision-action-panel').evaluate(e => e.scrollLeft)).toBe(0)
  expect(await page.locator('.decision-action-panel').evaluate(e => e.scrollWidth - e.clientWidth)).toBeLessThanOrEqual(1)
  const action = await page.getByTestId('decision-run').boundingBox()
  expect(action!.x).toBeGreaterThanOrEqual(0); expect(action!.x + action!.width).toBeLessThanOrEqual(width)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
})

test('loads validate normalized line endings before replacing any input', async ({ page }) => {
  await open(page)
  const data = { version: 1, kind: 'DoSAT-decision', task: 'entailment', graph: 'A', premises: 'Pr(A)=1/2', conclusion: 'Pr(A)>0', regular: false, mode: 'complete', seconds: 30 }
  for (const overrides of [{ graph: 'A ->\rB' }, { premises: 'Pr(A)\r=1/2' }, { conclusion: 'Pr(A)\r=1/2' }]) {
    await page.getByLabel('Load saved decision problem').setInputFiles({ name: 'bad-lines.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ ...data, ...overrides })) })
    await expect(page.getByTestId('decision-status')).toContainText('Load error')
    await expect(page.getByTestId('decision-graph')).toHaveValue('Z -> X; Z -> Y')
    await expect(page.getByTestId('decision-conclusion')).toHaveValue('Pr(Y | do(X)) = 1/2')
    await expect(page.getByTestId('decision-premise-1')).toHaveValue('Pr(Z) = 1/2')
    await expect(page.getByTestId('decision-run')).toBeEnabled()
    await expect(page.getByTestId('decision-save')).toBeEnabled()
    await expect(page.getByTestId('decision-copy')).toBeEnabled()
  }
  const good = { ...data, graph: 'Z -> X;\r\nZ -> Y', premises: 'Pr(Z)=1/2\r\n\r\n# note\r\nPr(X | Z)=3/4', conclusion: 'Pr(Y | do(X))=1/2\r\n' }
  await page.getByLabel('Load saved decision problem').setInputFiles({ name: 'crlf.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(good)) })
  await expect(page.getByTestId('decision-premise-4')).toHaveValue('Pr(X | Z)=3/4')
  await expect(page.getByTestId('decision-run')).toBeEnabled()
  await page.getByTestId('decision-batch-toggle').click()
  await expect(page.getByTestId('decision-premises')).toHaveValue('Pr(Z)=1/2\n\n# note\nPr(X | Z)=3/4')
  await expect(page.getByTestId('decision-discard-batch')).toBeDisabled()
})

test('the graph preview follows DAG input independently of probability syntax', async ({ page }) => {
  await open(page)
  const preview=page.getByTestId('decision-graph-preview')
  await expect(preview.getByRole('img',{name:'Input causal DAG'})).toBeVisible()
  await expect(preview.locator('[data-node]')).toHaveCount(3)
  await expect(preview.locator('[data-edge]')).toHaveCount(2)
  await page.getByTestId('decision-conclusion').fill('unfinished constraint')
  await expect(preview).toBeVisible();await expect(page.getByTestId('decision-run')).toBeDisabled()
  await page.getByTestId('decision-graph').fill('X -> Y; Y -> X')
  await expect(preview).toBeHidden();await expect(preview.locator('svg')).toHaveCount(0)
  await expect(page.locator('#decision-graph-error')).toContainText('Syntax error: not a DAG')
  await page.getByTestId('decision-graph').fill('X -> Y; Z')
  await expect(preview).toBeVisible();await expect(preview.locator('[data-edge]')).toHaveCount(1)
  await expect(preview.locator('[data-node="Z"]')).toBeVisible()
  await expect(page.getByTestId('decision-run')).toBeDisabled()
})

for (const width of [320,390,1280]) test(`dense DAG preview remains readable and scrollable at ${width}px`, async ({ page }) => {
  await page.setViewportSize({width,height:900});await open(page)
  const names=['A','B','C','D','E','F9007199254740991']
  const graph=names.flatMap((parent,index)=>names.slice(index+1).map(child=>`${parent} -> ${child}`)).join('; ')
  await page.getByTestId('decision-graph').fill(graph)
  const preview=page.getByTestId('decision-graph-preview')
  await expect(preview.locator('[data-node]')).toHaveCount(6)
  await expect(preview.locator('[data-edge]')).toHaveCount(15)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  const size=await preview.evaluate(e=>({client:e.clientWidth,scroll:e.scrollWidth,display:getComputedStyle(e).overflowX}))
  expect(size.client).toBeGreaterThan(0);expect(size.scroll).toBeGreaterThan(size.client)
  await preview.focus();await preview.press('ArrowRight')
  await expect.poll(()=>preview.evaluate(e=>e.scrollLeft)).toBeGreaterThan(0)
  const labelsFit=await preview.evaluate(e=>[...e.querySelectorAll('[data-node]')].every(n=>{
    const text=(n.querySelector('text') as SVGGraphicsElement).getBBox(),shape=(n.querySelector('ellipse') as SVGGraphicsElement).getBBox()
    return text.x>=shape.x&&text.x+text.width<=shape.x+shape.width&&text.y>=shape.y&&text.y+text.height<=shape.y+shape.height
  }))
  expect(labelsFit).toBe(true)
})

test('evaluates new intervention regimes and guarded constraints in a returned model', async ({ page }) => {
  await open(page);await loadDecisionFixture(page, 5);await page.getByTestId('decision-run').click()
  await expect(page.getByTestId('decision-status')).toContainText('SAT —')
  const input=page.getByTestId('model-evaluate-input'), output=page.getByTestId('model-evaluate-result')
  for(const [source,value] of [
    ['Pr(Y | do(~X))','Exact value in this model: 0'],
    ['Pr(Y | do(X)) - Pr(Y | do(~X))','Exact value in this model: 1'],
    ['Pr(Y | do(X, ~Y))','Exact value in this model: 0'],
    ['Pr(Y | do(X)) > Pr(Y)','True in this model.'],
  ]) {await input.fill(source);await page.getByTestId('model-evaluate-run').click();await expect(output).toContainText(value)}
  await input.fill('Pr(X | do(~Y), Y)');await page.getByTestId('model-evaluate-run').click()
  await expect(output).toContainText('undefined (zero denominator)')
  await expect(page.getByTestId('decision-status')).toContainText('SAT —')
  await expect(page.getByTestId('decision-save-smt')).toBeEnabled()
  await page.getByTestId('decision-graph').fill('A')
  await expect(page.getByTestId('model-evaluation')).toBeHidden();await expect(page.getByTestId('model-evaluate-result')).toBeEmpty()
})

test('evaluates exact algebraic values and assigned free variables without model completion', async ({ page }) => {
  await open(page);await page.getByTestId('decision-task-satisfiability').check()
  await page.getByTestId('decision-graph').fill('A');await page.getByTestId('decision-clear').click()
  await page.getByTestId('decision-premise-1').fill('Pr(A)^2 = 1/2')
  await page.getByTestId('decision-run').click();await expect(page.getByTestId('decision-status')).toContainText('SAT —')
  await page.getByTestId('model-evaluate-input').fill('Pr(A)^2');await page.getByTestId('model-evaluate-run').click()
  await expect(page.getByTestId('model-evaluate-result')).toContainText('Exact value in this model: 1/2')
  await page.getByTestId('decision-premise-1').fill('Pr(A) = a & a = 1/3')
  await page.getByTestId('decision-run').click();await expect(page.getByTestId('decision-status')).toContainText('SAT —')
  await page.getByTestId('model-evaluate-input').fill('Pr(A) + a');await page.getByTestId('model-evaluate-run').click()
  await expect(page.getByTestId('model-evaluate-result')).toContainText('Exact value in this model: 2/3')
  await page.getByTestId('model-evaluate-input').fill('newRealVariable');await page.getByTestId('model-evaluate-run').click()
  await expect(page.getByTestId('model-evaluate-status')).toContainText('Unassigned free real variable')
  await expect(page.getByTestId('decision-save-smt')).toBeEnabled()
})

test('new expressions also evaluate in the exact countermodel', async ({ page }) => {
  await open(page);await loadDecisionFixture(page, 1);await page.getByTestId('decision-run').click()
  await expect(page.getByTestId('decision-status')).toContainText('DOES NOT ENTAIL')
  await page.getByTestId('model-evaluate-input').fill('Pr(Y | do(~X))');await page.getByTestId('model-evaluate-run').click()
  await expect(page.getByTestId('model-evaluate-result')).toContainText('Exact value in this model: 1/2')
  await expect(page.getByTestId('decision-status')).toContainText('DOES NOT ENTAIL')
  await page.getByTestId('model-evaluate-input').fill('Pr(Q)')
  await expect(page.getByTestId('model-evaluate-run')).toBeDisabled()
  await expect(page.getByTestId('model-evaluate-input')).toHaveAttribute('aria-invalid','true')
})

for(const width of [320,390,1280]) test(`evaluation input and results stay contained at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});await open(page)
  await loadDecisionFixture(page, 5);await page.getByTestId('decision-run').click()
  await expect(page.getByTestId('decision-status')).toContainText('SAT —')
  await page.getByTestId('model-evaluate-input').fill(Array.from({length:12},()=> 'Pr(Y | do(X))').join(' + '))
  await page.getByTestId('model-evaluate-run').click();await expect(page.getByTestId('model-evaluate-result')).toContainText('Exact value in this model: 12')
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  await page.getByTestId('model-evaluate-preview').focus();await page.getByTestId('model-evaluate-preview').press('ArrowRight')
  if(width<600)await expect.poll(()=>page.getByTestId('model-evaluate-preview').evaluate(e=>e.scrollLeft)).toBeGreaterThan(0)
})

test('the single page imports a retired model-finder problem as SAT',async({page})=>{
 await open(page)
 const legacy={version:1,graph:'X -> Y',constraints:'Pr(X)=0\nPr(Y)=0\nPr(Y|do(X))=1',regular:false}
 await page.getByLabel('Load saved decision problem').setInputFiles({name:'PrSATdo-problem.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(legacy))})
 await expect(page.getByTestId('decision-task-satisfiability')).toBeChecked()
 await expect(page.getByTestId('decision-conclusion')).toBeHidden()
 await page.getByTestId('decision-run').click();await expect(page.getByTestId('decision-status')).toContainText('SAT —')
 await page.getByTestId('model-evaluate-input').fill('Pr(Y|do(~X))');await page.getByTestId('model-evaluate-run').click()
 await expect(page.getByTestId('model-evaluate-result')).toContainText('Exact value in this model: 0')
})

test('malformed evaluation parentheses cannot be repaired by the adapter',async({page})=>{
 await open(page);await loadDecisionFixture(page, 1);await page.getByTestId('decision-run').click()
 await expect(page.getByTestId('decision-status')).toContainText('DOES NOT ENTAIL')
 for(const source of ['Pr(Y)) + (Pr(X)','a) * (b','1) / (0']){
  await page.getByTestId('model-evaluate-input').fill(source)
  await expect(page.getByTestId('model-evaluate-input')).toHaveAttribute('aria-invalid','true')
  await expect(page.getByTestId('model-evaluate-run')).toBeDisabled()
  await expect(page.getByTestId('model-evaluate-preview')).toBeEmpty()
 }
 await page.getByTestId('model-evaluate-input').fill('Pr(Y) + Pr(X)');await page.getByTestId('model-evaluate-run').click()
 await expect(page.getByTestId('model-evaluate-result')).toContainText('Exact value in this model: 1')
})

test('oversized node indices are support errors with no DAG drawing',async({page})=>{
 await open(page);await page.getByTestId('decision-graph').fill('F9007199254740992 -> Y')
 await expect(page.locator('#decision-graph-error')).toContainText('Unsupported')
 await expect(page.locator('#decision-graph-error')).not.toContainText('not a DAG')
 await expect(page.getByTestId('decision-graph-preview')).toBeHidden()
 await expect(page.getByTestId('decision-graph-preview').locator('svg')).toHaveCount(0)
 await expect(page.getByTestId('decision-run')).toBeDisabled()
})
