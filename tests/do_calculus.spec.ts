import { test, expect, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const open = async (page: Page) => {
  await page.goto('/reference-ui/do_calculus.html', { waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('do-check')).toBeEnabled()
}
const check = async (page: Page, applies: boolean) => {
  await page.getByTestId('do-check').click()
  await expect(page.getByTestId('do-status')).toContainText(applies ? 'applies under' : 'not certified')
}
for (const [example, applies] of [['0', true], ['1', true], ['2', false], ['3', true], ['4', false], ['5', true], ['6', false]] as const) {
  test(`rule example ${example} is ${applies ? 'certified' : 'uncertified'}`, async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message))
    await open(page)
    await page.getByTestId('do-example').selectOption(example)
    await check(page, applies)
    await expect(page.getByTestId('do-equality')).toContainText('Pr(')
    await expect(page.getByTestId('do-results')).toContainText(applies ? 'Numerical definedness has not been checked' : 'may still hold in particular numerical models')
    if (example === '4') await expect(page.getByTestId('do-eligible-z')).toContainText('Z(W): ∅')
    if (example === '5') {
      await expect(page.getByTestId('do-eligible-z')).toContainText('Z(W): Z')
      await expect(page.getByTestId('do-removed-edges')).toContainText('Z → X')
      await expect(page.getByTestId('do-removed-edges')).toContainText('A → Z')
    }
    expect(errors).toEqual([])
  })
}

test('graph diagrams show exactly the required arrow deletion', async ({ page }) => {
  await open(page); await check(page, true)
  await expect(page.getByTestId('do-original-graph').locator('[data-edge="Z->Y"]')).toHaveAttribute('data-cut', 'true')
  await expect(page.getByTestId('do-modified-graph').locator('[data-edge]')).toHaveCount(0)
  await page.locator('summary').filter({ hasText: 'Inspect the d-separation certificate' }).click()
  await expect(page.getByTestId('do-certificate-result')).toContainText('d-separated')
})

test('cycles and overlapping groups invalidate a certificate immediately', async ({ page }) => {
  await open(page); await check(page, true)
  await page.getByTestId('do-graph').fill('Z -> Y; Y -> Z')
  await expect(page.getByTestId('do-check')).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Save step', exact: true })).toBeDisabled()
  await expect(page.getByTestId('do-export-challenge')).toBeDisabled()
  await expect(page.getByTestId('do-results')).toBeEmpty()
  await expect(page.getByTestId('do-validation')).toContainText('acyclic')
  await page.getByTestId('do-graph').fill('Z -> Y')
  await page.getByTestId('do-z').fill('Y=1')
  await expect(page.getByTestId('do-validation')).toContainText('overlap')
})

test('saved steps restore the input and require a new check', async ({ page }) => {
  await open(page); await check(page, true)
  const downloading = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Save step', exact: true }).click()
  const download = await downloading
  const path = await download.path(); if (!path) throw new Error('Missing saved step')
  const saved = await readFile(path)
  await page.getByTestId('do-y').fill('Y=0')
  await page.getByLabel('Load saved do-calculus step').setInputFiles({ name: 'step.json', mimeType: 'application/json', buffer: saved })
  await expect(page.getByTestId('do-y')).toHaveValue('Y=1')
  await expect(page.getByTestId('do-results')).toBeEmpty()
  await check(page, true)
})

test('exported certified step is UNSAT as a counterexample in the model finder', async ({ page }) => {
  await open(page); await check(page, true)
  const downloading = page.waitForEvent('download')
  await page.getByTestId('do-export-challenge').click()
  const download = await downloading
  const path = await download.path(); if (!path) throw new Error('Missing counterexample problem')
  const problem = await readFile(path)
  await page.getByRole('link', { name: 'Open causal model finder' }).click()
  await expect(page.getByTestId('causal-z3-status')).toHaveText('Z3 ready.', { timeout: 20_000 })
  await page.getByLabel('Load saved causal problem').setInputFiles({ name: 'counterexample.json', mimeType: 'application/json', buffer: problem })
  await expect(page.getByTestId('causal-constraints')).toHaveValue('Pr(Y | do(Z=1)) != Pr(Y | Z)')
  await page.getByTestId('causal-find').click()
  await expect(page.getByTestId('causal-status')).toContainText('UNSAT —', { timeout: 20_000 })
})

test('step checker and model finder link in both directions', async ({ page }) => {
  await page.goto('/reference-ui/causal.html')
  await page.getByRole('link', { name: 'Check a do-calculus step' }).click()
  await expect(page).toHaveURL(/do_calculus\.html/)
  await page.getByRole('link', { name: 'Open causal model finder' }).click()
  await expect(page).toHaveURL(/causal\.html/)
})

test('long supported node labels fit inside their graph shapes', async ({ page }) => {
  await open(page)
  const name = 'Y9007199254740991'
  await page.getByTestId('do-graph').fill(`Z -> ${name}`)
  await page.getByTestId('do-y').fill(`${name}=1`)
  await check(page, true)
  const fit = await page.getByTestId('do-original-graph').evaluate((element, nodeName) => {
    const node = element.querySelector(`[data-node="${nodeName}"]`)!
    const text = (node.querySelector('text') as SVGGraphicsElement).getBBox()
    const shape = (node.querySelector('ellipse') as SVGGraphicsElement).getBBox()
    const svg = element.querySelector('svg')!.viewBox.baseVal
    return text.x >= shape.x && text.x + text.width <= shape.x + shape.width && shape.x >= 0 && shape.x + shape.width <= svg.width
  }, name)
  expect(fit).toBe(true)
})

for (const width of [320, 360, 390, 1280]) {
  test(`diagrams stay contained at ${width}px with internal scrolling when needed`, async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message))
    await page.setViewportSize({ width, height: 900 })
    await open(page)
    for (let example = 0; example < 8; example++) {
      if (example < 7) {
        await page.getByTestId('do-example').selectOption(String(example))
      } else {
        const name = 'Y9007199254740991'
        await page.getByTestId('do-graph').fill(`Z -> ${name}; Z -> W; W -> ${name}`)
        await page.getByTestId('do-rule').selectOption('2')
        await page.getByTestId('do-x').fill('')
        await page.getByTestId('do-y').fill(`${name}=1`)
        await page.getByTestId('do-z').fill('Z=1')
        await page.getByTestId('do-w').fill('')
      }
      await check(page, ![2, 4, 6].includes(example))
      const layout = await page.evaluate(async () => {
        await document.fonts.ready
        return {
          pageWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
          diagrams: [...document.querySelectorAll<HTMLElement>('.do-graph-scroll')].map(box => ({
            width: box.getBoundingClientRect().width,
            parentWidth: box.parentElement!.clientWidth,
            clientWidth: box.clientWidth,
            scrollWidth: box.scrollWidth,
            svgWidth: box.querySelector('svg')!.getBoundingClientRect().width,
            sectionTop: box.parentElement!.getBoundingClientRect().top,
            sectionLeft: box.parentElement!.getBoundingClientRect().left,
            sectionRight: box.parentElement!.getBoundingClientRect().right,
          })),
        }
      })
      expect(layout.pageWidth, `example ${example} at ${width}px`).toBeLessThanOrEqual(layout.viewportWidth)
      expect(layout.diagrams).toHaveLength(2)
      for (const diagram of layout.diagrams) {
        expect(diagram.width).toBeLessThanOrEqual(diagram.parentWidth + 1)
        if (diagram.svgWidth > diagram.clientWidth + 1) expect(diagram.scrollWidth).toBeGreaterThan(diagram.clientWidth)
      }
      if (width === 1280) {
        expect(Math.abs(layout.diagrams[0].sectionTop - layout.diagrams[1].sectionTop)).toBeLessThan(1)
        expect(layout.diagrams[1].sectionLeft).toBeGreaterThanOrEqual(layout.diagrams[0].sectionRight)
      }
    }
    expect(errors).toEqual([])
  })
}
