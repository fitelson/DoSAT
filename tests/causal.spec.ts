import { test, expect, type Page } from '@playwright/test'

const open = async (page: Page) => {
  await page.goto('/reference-ui/causal.html', { waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('causal-z3-status')).toHaveText('Z3 ready.', { timeout: 20_000 })
}
const solve = async (page: Page, expected: 'SAT' | 'UNSAT') => {
  await page.getByTestId('causal-find').click()
  await expect(page.getByTestId('causal-status')).toContainText(`${expected} —`, { timeout: 20_000 })
}

test('confounding distinguishes association and intervention and displays mechanisms', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await open(page)
  await solve(page, 'SAT')
  const queries = page.getByTestId('causal-query-table')
  await expect(queries.getByRole('row').filter({ hasText: 'Pr(Y | X)' })).toContainText('3/4')
  await expect(queries.getByRole('row').filter({ hasText: 'Pr(Y | do(X=1))' })).toContainText('1/2')
  await expect(page.getByTestId('causal-mechanism-table')).toBeVisible()
  await expect(page.getByTestId('causal-distribution-table')).toHaveCount(2)
  expect(errors).toEqual([])
})

test('positive mediation model works and its incorrect intervention value is UNSAT', async ({ page }) => {
  await open(page)
  await page.getByTestId('causal-example').selectOption('1')
  await expect(page.getByTestId('causal-regular')).toBeChecked()
  await solve(page, 'SAT')
  await expect(page.getByTestId('causal-query-table').getByRole('row').filter({ hasText: 'Pr(Y | do(X=1))' })).toContainText('13/20')
  const input = page.getByTestId('causal-constraints')
  await input.fill((await input.inputValue()).replace('13/20', '14/20'))
  await expect(page.getByTestId('causal-query-table')).toHaveCount(0)
  await solve(page, 'UNSAT')
})

test('zero observational support retains an intervention mechanism', async ({ page }) => {
  await open(page)
  await page.getByTestId('causal-example').selectOption('2')
  await solve(page, 'SAT')
  await expect(page.getByTestId('causal-query-table').getByRole('row').filter({ hasText: 'Pr(Y | do(X=1))' }).getByRole('cell').nth(1)).toHaveText('1')
  await page.getByTestId('causal-regular').check()
  await solve(page, 'UNSAT')
})

test('cycles and undeclared intervention variables invalidate the model immediately', async ({ page }) => {
  await open(page)
  await solve(page, 'SAT')
  await page.getByTestId('causal-graph').fill('X -> Y; Y -> X')
  await expect(page.getByTestId('causal-find')).toBeDisabled()
  await expect(page.getByTestId('causal-validation')).toContainText('acyclic')
  await expect(page.getByTestId('causal-query-table')).toHaveCount(0)
  await page.getByTestId('causal-graph').fill('X -> Y')
  await page.getByTestId('causal-constraints').fill('Pr(Y | do(Z=1)) = 1')
  await expect(page.getByTestId('causal-validation')).toContainText('not declared')
  await expect(page.getByTestId('causal-find')).toBeDisabled()
})

test('simultaneous assignments and impossible observation stay distinct', async ({ page }) => {
  await open(page)
  await page.getByTestId('causal-graph').fill('X -> Y')
  await page.getByTestId('causal-constraints').fill('Pr(X & ~Y | do(X=1, Y=0)) = 1\n(Pr(Y | do(X=0), X) = 1) v (1 = 1)')
  await solve(page, 'SAT')
  await expect(page.getByTestId('causal-query-table')).toContainText('undefined (zero conditioning probability)')
  await page.getByTestId('causal-constraints').fill('Pr(Y | do(X=0), X) = 1')
  await solve(page, 'UNSAT')
})

test('exact model probabilities do not round large rational numerators', async ({ page }) => {
  await open(page)
  await page.getByTestId('causal-graph').fill('X')
  await page.getByTestId('causal-constraints').fill('Pr(X) = 9007199254740993 / 18014398509481984')
  await solve(page, 'SAT')
  await expect(page.getByTestId('causal-query-table')).toContainText('9007199254740993/18014398509481984')
})

test('saved problems restore graph, constraints and positivity', async ({ page }) => {
  await open(page)
  const saved = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Save problem', exact: true }).click()
  const download = await saved
  expect(download.suggestedFilename()).toBe('PrSATdo-problem.json')
  expect(await download.failure()).toBeNull()
  await page.getByLabel('Load saved causal problem').setInputFiles({
    name: 'test.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ version: 1, graph: 'X -> Y', constraints: 'Pr(X) = 1/2\nPr(Y | do(X=1)) = 1/3', regular: true })),
  })
  await expect(page.getByTestId('causal-regular')).toBeChecked()
  await expect(page.getByTestId('causal-graph')).toHaveValue('X -> Y')
  await solve(page, 'SAT')
  await expect(page.getByTestId('causal-query-table')).toContainText('1/3')
})

test('classical and causal interfaces link to each other', async ({ page }) => {
  await page.goto('/reference-ui/classical.html')
  await page.getByRole('link', { name: 'Open the causal model finder' }).click()
  await expect(page).toHaveURL(/causal\.html/)
  await page.getByRole('link', { name: 'Open classical PrSAT 3.0' }).click()
  await expect(page).toHaveURL(/classical\.html/)
})


test('free real variables appear as inspectable exact witness values', async ({ page }) => {
  await open(page)
  await page.getByTestId('causal-graph').fill('X')
  await page.getByTestId('causal-constraints').fill('Pr(X) = x\nx = 1/3')
  await solve(page, 'SAT')
  await expect(page.getByTestId('causal-real-table')).toContainText('x')
  await expect(page.getByTestId('causal-real-table')).toContainText('1/3')
})


test('malformed adjacent probabilities never reach the solver', async ({ page }) => {
  await open(page)
  await page.getByTestId('causal-graph').fill('X; Y')
  await page.getByTestId('causal-constraints').fill('Pr(X & Y) != Pr(X)Pr(Y)')
  await expect(page.getByTestId('causal-validation')).toContainText('Invalid constraint')
  await expect(page.getByTestId('causal-find')).toBeDisabled()
  await page.getByTestId('causal-constraints').fill('Pr(X & Y) != Pr(X)*Pr(Y)')
  await solve(page, 'UNSAT')
})

for (const seconds of ['16.1', '32.2', '1.0005']) {
  test(`accepted ${seconds}s search limit solves with native Z3`, async ({ page }) => {
    await open(page)
    await page.getByTestId('causal-graph').fill('X')
    await page.getByTestId('causal-constraints').fill('Pr(X) = 1/2')
    await page.getByTestId('causal-timeout').fill(seconds)
    await solve(page, 'SAT')
    await expect(page.getByTestId('causal-query-table').getByRole('cell').nth(1)).toHaveText('1/2')
  })
}
