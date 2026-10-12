import { expect, test } from '@playwright/test'
import { DECISION_EXAMPLES } from '../src/causal_decision_examples'

test.setTimeout(120_000)

for (const [index, example] of DECISION_EXAMPLES.entries()) {
  test(`literature preset: ${example.name}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('decision-runtime')).toHaveText('Z3 ready.', { timeout: 20_000 })
    await page.getByTestId('decision-example').selectOption(String(index))
    await expect(page.getByTestId('decision-graph')).toHaveValue(example.graph)
    await expect(page.getByTestId(`decision-task-${example.task}`)).toBeChecked()
    await expect(page.getByTestId('decision-regular')).toBeChecked({ checked: example.regular })
    await page.getByTestId('decision-example-guide').locator('summary').click()
    await expect(page.getByTestId('decision-example-guide')).toContainText(example.description)
    await expect(page.getByTestId('decision-example-guide').getByRole('link')).toHaveAttribute('href', example.source.url)
    await page.getByTestId('decision-run').click()
    const verdict = example.expectedStatus === 'SAT' ? 'SAT —'
      : example.expectedStatus === 'ENTAILS' ? 'ENTAILS —' : 'DOES NOT ENTAIL'
    await expect(page.getByTestId('decision-status')).toContainText(verdict, { timeout: 60_000 })
    for (const item of example.evaluations) {
      await page.getByTestId('model-evaluate-input').fill(item.expression)
      await expect(page.getByTestId('model-evaluate-run')).toBeEnabled()
      await page.getByTestId('model-evaluate-run').click()
      const expected = typeof item.value === 'boolean' ? `${item.value ? 'True' : 'False'} in this model.`
        : `Exact value in this model: ${item.value}`
      await expect(page.getByTestId('model-evaluate-result').locator('.model-evaluation-value')).toHaveText(expected, { timeout: 15_000 })
      if (example.expectedStatus === 'DOES NOT ENTAIL') {
        await expect(page.getByTestId('model-evaluate-probabilities')).toBeVisible()
        await expect(page.getByTestId('model-evaluate-probabilities').locator('tbody tr')).toHaveCount(1)
        await expect(page.getByTestId('model-evaluate-probabilities')).not.toContainText('undefined')
      }
      await expect(page.getByTestId('decision-status')).toContainText(verdict)
    }
    expect(errors).toEqual([])
  })
}

for (const width of [320, 390, 1280]) {
  test(`literature guidance and DAGs stay contained at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('decision-runtime')).toHaveText('Z3 ready.', { timeout: 20_000 })
    for (const [index, example] of DECISION_EXAMPLES.entries()) {
      await page.getByTestId('decision-example').selectOption(String(index))
      const guide = page.getByTestId('decision-example-guide')
      if (await guide.getAttribute('open') === null) {
        await guide.locator('summary').click()
      }
      await expect(guide).toContainText(example.description)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      await expect(page.getByTestId('decision-graph-preview').locator('[data-node]')).toHaveCount(
        new Set(example.graph.match(/[A-Za-z][A-Za-z0-9]*/g)).size,
      )
      await guide.locator('summary').click()
    }
  })
}
