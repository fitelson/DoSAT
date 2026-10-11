# First repaired browser run

65/67 passed. Both newly added boundary cancellation assertions exhausted their
3-second wait measured from Run, including premise checking. The acceptance
bound is measured from actual abort. Capture preserved below; targeted rerun
will determine whether this is only a timing-assertion issue or a runtime issue.


test-results/causal_decision-a-cancel-a-833a2-s-promptly-and-allows-reuse-chromium/error-context.md

# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: causal_decision.spec.ts >> a cancel at countermodel startup settles promptly and allows reuse
- Location: tests/causal_decision.spec.ts:93:3

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  getByTestId('decision-status')
Expected: "Cancelled — no decision established."
Received: "Searching for a countermodel…"
Timeout:  3000ms

Call log:
  - Expect "toHaveText" getByTestId('decision-status') with timeout 3000ms
  - waiting for getByTestId('decision-status')
    3 × locator resolved to <div role="status" aria-live="polite" data-testid="decision-status">Checking the premises…</div>
      - unexpected value "Checking the premises…"
    7 × locator resolved to <div role="status" aria-live="polite" data-testid="decision-status">Searching for a countermodel…</div>
      - unexpected value "Searching for a countermodel…"

```

```yaml
- status: Searching for a countermodel…
```

# Test source

```ts
  17  |     await expect(page.getByTestId('decision-status')).toContainText(answer, { timeout: 20_000 })
  18  |     if (example === '2') await expect(page.getByTestId('decision-query-table')).toContainText('undefined')
  19  |     if (example === '4') await expect(page.getByTestId('decision-results')).toContainText('vacuously')
  20  |     expect(errors).toEqual([])
  21  |   })
  22  | }
  23  | test('saves and restores a decision problem without trusting its answer', async ({ page }) => {
  24  |   await open(page)
  25  |   const downloading = page.waitForEvent('download')
  26  |   await page.getByTestId('decision-save').click()
  27  |   const path = await (await downloading).path(); if (!path) throw new Error('Missing saved file')
  28  |   const value = JSON.parse((await readFile(path)).toString())
  29  |   value.answer = 'entailed'
  30  |   await page.getByTestId('decision-conclusion').fill('Pr(Y)=0')
  31  |   await page.getByLabel('Load saved decision problem').setInputFiles({ name: 'decision.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value)) })
  32  |   await expect(page.getByTestId('decision-conclusion')).toHaveValue('Pr(Y | do(X=1)) = 1/2')
  33  |   await expect(page.getByTestId('decision-results')).toBeEmpty()
  34  |   await expect(page.getByTestId('decision-save-smt')).toBeDisabled()
  35  | })
  36  | test('solver export contains two polynomial checks and input edits invalidate it', async ({ page }) => {
  37  |   await open(page); await page.getByTestId('decision-run').click()
  38  |   await expect(page.getByTestId('decision-status')).toContainText('ENTAILS —')
  39  |   const downloading = page.waitForEvent('download'); await page.getByTestId('decision-save-smt').click()
  40  |   const path = await (await downloading).path(); if (!path) throw new Error('Missing solver file')
  41  |   const text = (await readFile(path)).toString()
  42  |   expect(text.match(/\(check-sat\)/g)).toHaveLength(2)
  43  |   expect(text).toContain('(reset)'); expect(text).not.toMatch(/\(\/|\(\^/)
  44  |   await page.getByTestId('decision-graph').fill('X -> Y; Y -> X')
  45  |   await expect(page.getByTestId('decision-run')).toBeDisabled()
  46  |   await expect(page.getByTestId('decision-save-smt')).toBeDisabled()
  47  |   await expect(page.getByTestId('decision-results')).toBeEmpty()
  48  | })
  49  | test('bounded mode accepts fractional seconds and runs the same decision', async ({ page }) => {
  50  |   await open(page); await page.getByTestId('decision-mode').selectOption('bounded')
  51  |   await page.getByTestId('decision-seconds').fill('16.1')
  52  |   await page.getByTestId('decision-run').click()
  53  |   await expect(page.getByTestId('decision-status')).toContainText('ENTAILS —')
  54  | })
  55  | test('empty premises test validity and regularity handles support explicitly', async ({ page }) => {
  56  |   await open(page)
  57  |   await page.getByTestId('decision-graph').fill('Z -> Y')
  58  |   await page.getByTestId('decision-premises').fill('')
  59  |   await page.getByTestId('decision-conclusion').fill('Pr(Y | do(Z=1)) = Pr(Y | Z)')
  60  |   await page.getByTestId('decision-run').click()
  61  |   await expect(page.getByTestId('decision-status')).toContainText('DOES NOT ENTAIL')
  62  |   await page.getByTestId('decision-regular').check()
  63  |   await page.getByTestId('decision-run').click()
  64  |   await expect(page.getByTestId('decision-status')).toContainText('ENTAILS —')
  65  | })
  66  | for (const width of [320, 390, 1280]) test(`decision results fit a ${width}px viewport`, async ({ page }) => {
  67  |   await page.setViewportSize({ width, height: 900 }); await open(page)
  68  |   await page.getByTestId('decision-example').selectOption('2')
  69  |   await page.getByTestId('decision-run').click()
  70  |   await expect(page.getByTestId('decision-status')).toContainText('DOES NOT ENTAIL')
  71  |   expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  72  | })
  73  | test('causal interface links to the decision procedure and back', async ({ page }) => {
  74  |   await page.goto('/causal.html')
  75  |   await page.getByRole('link', { name: 'Decide causal satisfiability or entailment' }).click()
  76  |   await expect(page).toHaveURL(/decision\.html/)
  77  |   await page.getByRole('link', { name: 'Open causal model finder' }).click()
  78  |   await expect(page).toHaveURL(/causal\.html/)
  79  | })
  80  | 
  81  | test('DoSAT landing page has the requested branding and fits narrow screens', async ({ page }) => {
  82  |   for (const width of [320, 390, 1280]) {
  83  |     await page.setViewportSize({ width, height: 900 })
  84  |     await page.goto('/webpage/dosat.html')
  85  |     await expect(page).toHaveTitle('DoSAT 1.0 — A Decision Procedure for Do Calculus.')
  86  |     await expect(page.locator('.subtitle')).toHaveText('A Decision Procedure for Do Calculus.')
  87  |     await expect(page.getByRole('link', { name: 'Run DoSAT 1.0' })).toHaveAttribute('href', './dist/decision.html')
  88  |     expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  89  |   }
  90  | })
  91  | 
  92  | for (const action of ['cancel', 'edit'] as const) {
  93  |   test(`a ${action} at countermodel startup settles promptly and allows reuse`, async ({ page }) => {
  94  |     await open(page)
  95  |     const nodes = ['A', 'B', 'C', 'D', 'E', 'F']
  96  |     const graph = nodes.flatMap((parent, index) => nodes.slice(index + 1).map(child => `${parent} -> ${child}`)).join('; ')
  97  |     await page.getByTestId('decision-graph').fill(graph)
  98  |     await page.getByTestId('decision-premises').fill('')
  99  |     await page.getByTestId('decision-conclusion').fill('Pr(F | do(A=1)) = Pr(F | A)')
  100 |     await page.getByTestId('decision-regular').check()
  101 |     await page.evaluate(how => {
  102 |       const status = document.querySelector('[data-testid=decision-status]')!
  103 |       const observer = new MutationObserver(() => {
  104 |         if (!status.textContent?.includes('Searching for a countermodel')) return
  105 |         observer.disconnect()
  106 |         document.documentElement.dataset.boundaryActionAt = String(performance.now())
  107 |         if (how === 'cancel') (document.querySelector('[data-testid=decision-cancel]') as HTMLButtonElement).click()
  108 |         else {
  109 |           const premises = document.querySelector('[data-testid=decision-premises]') as HTMLTextAreaElement
  110 |           premises.value = 'Pr(A) > 0'
  111 |           premises.dispatchEvent(new Event('input', { bubbles: true }))
  112 |         }
  113 |       })
  114 |       observer.observe(status, { childList: true, characterData: true, subtree: true })
  115 |     }, action)
  116 |     await page.getByTestId('decision-run').click()
> 117 |     await expect(page.getByTestId('decision-status')).toHaveText(action === 'cancel' ? 'Cancelled — no decision established.' : 'Input changed; decide the current problem.', { timeout: 3000 })
      |                                                       ^ Error: expect(locator).toHaveText(expected) failed
  118 |     const elapsed = await page.evaluate(() => performance.now() - Number(document.documentElement.dataset.boundaryActionAt))
  119 |     expect(elapsed).toBeLessThan(3000)
  120 |     await expect(page.getByTestId('decision-run')).toBeEnabled()
  121 |     await page.getByTestId('decision-example').selectOption('0')
  122 |     await page.getByTestId('decision-run').click()
  123 |     await expect(page.getByTestId('decision-status')).toContainText('ENTAILS —', { timeout: 20_000 })
  124 |   })
  125 | }
  126 | 
```
test-results/causal_decision-a-edit-at--c1105-s-promptly-and-allows-reuse-chromium/error-context.md

# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: causal_decision.spec.ts >> a edit at countermodel startup settles promptly and allows reuse
- Location: tests/causal_decision.spec.ts:93:3

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  getByTestId('decision-status')
Expected: "Input changed; decide the current problem."
Received: "Input changed; cancelling the previous decision…"
Timeout:  3000ms

Call log:
  - Expect "toHaveText" getByTestId('decision-status') with timeout 3000ms
  - waiting for getByTestId('decision-status')
    3 × locator resolved to <div role="status" aria-live="polite" data-testid="decision-status">Checking the premises…</div>
      - unexpected value "Checking the premises…"
    7 × locator resolved to <div role="status" aria-live="polite" data-testid="decision-status">Input changed; cancelling the previous decision…</div>
      - unexpected value "Input changed; cancelling the previous decision…"

```

```yaml
- status: Input changed; cancelling the previous decision…
```

# Test source

```ts
  17  |     await expect(page.getByTestId('decision-status')).toContainText(answer, { timeout: 20_000 })
  18  |     if (example === '2') await expect(page.getByTestId('decision-query-table')).toContainText('undefined')
  19  |     if (example === '4') await expect(page.getByTestId('decision-results')).toContainText('vacuously')
  20  |     expect(errors).toEqual([])
  21  |   })
  22  | }
  23  | test('saves and restores a decision problem without trusting its answer', async ({ page }) => {
  24  |   await open(page)
  25  |   const downloading = page.waitForEvent('download')
  26  |   await page.getByTestId('decision-save').click()
  27  |   const path = await (await downloading).path(); if (!path) throw new Error('Missing saved file')
  28  |   const value = JSON.parse((await readFile(path)).toString())
  29  |   value.answer = 'entailed'
  30  |   await page.getByTestId('decision-conclusion').fill('Pr(Y)=0')
  31  |   await page.getByLabel('Load saved decision problem').setInputFiles({ name: 'decision.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value)) })
  32  |   await expect(page.getByTestId('decision-conclusion')).toHaveValue('Pr(Y | do(X=1)) = 1/2')
  33  |   await expect(page.getByTestId('decision-results')).toBeEmpty()
  34  |   await expect(page.getByTestId('decision-save-smt')).toBeDisabled()
  35  | })
  36  | test('solver export contains two polynomial checks and input edits invalidate it', async ({ page }) => {
  37  |   await open(page); await page.getByTestId('decision-run').click()
  38  |   await expect(page.getByTestId('decision-status')).toContainText('ENTAILS —')
  39  |   const downloading = page.waitForEvent('download'); await page.getByTestId('decision-save-smt').click()
  40  |   const path = await (await downloading).path(); if (!path) throw new Error('Missing solver file')
  41  |   const text = (await readFile(path)).toString()
  42  |   expect(text.match(/\(check-sat\)/g)).toHaveLength(2)
  43  |   expect(text).toContain('(reset)'); expect(text).not.toMatch(/\(\/|\(\^/)
  44  |   await page.getByTestId('decision-graph').fill('X -> Y; Y -> X')
  45  |   await expect(page.getByTestId('decision-run')).toBeDisabled()
  46  |   await expect(page.getByTestId('decision-save-smt')).toBeDisabled()
  47  |   await expect(page.getByTestId('decision-results')).toBeEmpty()
  48  | })
  49  | test('bounded mode accepts fractional seconds and runs the same decision', async ({ page }) => {
  50  |   await open(page); await page.getByTestId('decision-mode').selectOption('bounded')
  51  |   await page.getByTestId('decision-seconds').fill('16.1')
  52  |   await page.getByTestId('decision-run').click()
  53  |   await expect(page.getByTestId('decision-status')).toContainText('ENTAILS —')
  54  | })
  55  | test('empty premises test validity and regularity handles support explicitly', async ({ page }) => {
  56  |   await open(page)
  57  |   await page.getByTestId('decision-graph').fill('Z -> Y')
  58  |   await page.getByTestId('decision-premises').fill('')
  59  |   await page.getByTestId('decision-conclusion').fill('Pr(Y | do(Z=1)) = Pr(Y | Z)')
  60  |   await page.getByTestId('decision-run').click()
  61  |   await expect(page.getByTestId('decision-status')).toContainText('DOES NOT ENTAIL')
  62  |   await page.getByTestId('decision-regular').check()
  63  |   await page.getByTestId('decision-run').click()
  64  |   await expect(page.getByTestId('decision-status')).toContainText('ENTAILS —')
  65  | })
  66  | for (const width of [320, 390, 1280]) test(`decision results fit a ${width}px viewport`, async ({ page }) => {
  67  |   await page.setViewportSize({ width, height: 900 }); await open(page)
  68  |   await page.getByTestId('decision-example').selectOption('2')
  69  |   await page.getByTestId('decision-run').click()
  70  |   await expect(page.getByTestId('decision-status')).toContainText('DOES NOT ENTAIL')
  71  |   expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  72  | })
  73  | test('causal interface links to the decision procedure and back', async ({ page }) => {
  74  |   await page.goto('/causal.html')
  75  |   await page.getByRole('link', { name: 'Decide causal satisfiability or entailment' }).click()
  76  |   await expect(page).toHaveURL(/decision\.html/)
  77  |   await page.getByRole('link', { name: 'Open causal model finder' }).click()
  78  |   await expect(page).toHaveURL(/causal\.html/)
  79  | })
  80  | 
  81  | test('DoSAT landing page has the requested branding and fits narrow screens', async ({ page }) => {
  82  |   for (const width of [320, 390, 1280]) {
  83  |     await page.setViewportSize({ width, height: 900 })
  84  |     await page.goto('/webpage/dosat.html')
  85  |     await expect(page).toHaveTitle('DoSAT 1.0 — A Decision Procedure for Do Calculus.')
  86  |     await expect(page.locator('.subtitle')).toHaveText('A Decision Procedure for Do Calculus.')
  87  |     await expect(page.getByRole('link', { name: 'Run DoSAT 1.0' })).toHaveAttribute('href', './dist/decision.html')
  88  |     expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  89  |   }
  90  | })
  91  | 
  92  | for (const action of ['cancel', 'edit'] as const) {
  93  |   test(`a ${action} at countermodel startup settles promptly and allows reuse`, async ({ page }) => {
  94  |     await open(page)
  95  |     const nodes = ['A', 'B', 'C', 'D', 'E', 'F']
  96  |     const graph = nodes.flatMap((parent, index) => nodes.slice(index + 1).map(child => `${parent} -> ${child}`)).join('; ')
  97  |     await page.getByTestId('decision-graph').fill(graph)
  98  |     await page.getByTestId('decision-premises').fill('')
  99  |     await page.getByTestId('decision-conclusion').fill('Pr(F | do(A=1)) = Pr(F | A)')
  100 |     await page.getByTestId('decision-regular').check()
  101 |     await page.evaluate(how => {
  102 |       const status = document.querySelector('[data-testid=decision-status]')!
  103 |       const observer = new MutationObserver(() => {
  104 |         if (!status.textContent?.includes('Searching for a countermodel')) return
  105 |         observer.disconnect()
  106 |         document.documentElement.dataset.boundaryActionAt = String(performance.now())
  107 |         if (how === 'cancel') (document.querySelector('[data-testid=decision-cancel]') as HTMLButtonElement).click()
  108 |         else {
  109 |           const premises = document.querySelector('[data-testid=decision-premises]') as HTMLTextAreaElement
  110 |           premises.value = 'Pr(A) > 0'
  111 |           premises.dispatchEvent(new Event('input', { bubbles: true }))
  112 |         }
  113 |       })
  114 |       observer.observe(status, { childList: true, characterData: true, subtree: true })
  115 |     }, action)
  116 |     await page.getByTestId('decision-run').click()
> 117 |     await expect(page.getByTestId('decision-status')).toHaveText(action === 'cancel' ? 'Cancelled — no decision established.' : 'Input changed; decide the current problem.', { timeout: 3000 })
      |                                                       ^ Error: expect(locator).toHaveText(expected) failed
  118 |     const elapsed = await page.evaluate(() => performance.now() - Number(document.documentElement.dataset.boundaryActionAt))
  119 |     expect(elapsed).toBeLessThan(3000)
  120 |     await expect(page.getByTestId('decision-run')).toBeEnabled()
  121 |     await page.getByTestId('decision-example').selectOption('0')
  122 |     await page.getByTestId('decision-run').click()
  123 |     await expect(page.getByTestId('decision-status')).toContainText('ENTAILS —', { timeout: 20_000 })
  124 |   })
  125 | }
  126 | 
```
Follow-up: targeted tests now wait for the actual boundary-action marker before
starting their 3-second assertion. Both still fail, so this is a browser liveness
issue requiring investigation, not merely the initial timing-assertion scope.
The backend owner is debugging with the browser slot; no review gate passed.
