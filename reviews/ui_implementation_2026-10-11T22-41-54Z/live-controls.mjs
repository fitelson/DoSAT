import { chromium } from 'playwright'
import fs from 'node:fs'
import assert from 'node:assert/strict'
const browser = await chromium.launch({ headless: true })
const rows = []
for (const action of ['cancel', 'edit']) {
  const page = await browser.newPage()
  const errors = []; page.on('pageerror', error => errors.push(error.message))
  await page.goto('https://fitelson.org/DoSAT/dist/decision.html')
  await page.waitForFunction(() => document.querySelector('[data-testid=decision-runtime]')?.textContent === 'Z3 ready.')
  const names = ['A','B','C','D','E','F']
  const graph = names.flatMap((parent,i) => names.slice(i+1).map(child => `${parent} -> ${child}`)).join('; ')
  await page.getByTestId('decision-graph').fill(graph); await page.getByTestId('decision-clear').click()
  await page.getByTestId('decision-conclusion').fill('Pr(F | do(A)) = Pr(F | A)'); await page.getByTestId('decision-regular').check()
  await page.evaluate(how => {
    const status = document.querySelector('[data-testid=decision-status]')
    const observer = new MutationObserver(() => {
      if (!status.textContent.includes('Searching for a countermodel')) return
      observer.disconnect()
      setTimeout(() => {
        document.documentElement.dataset.pendingAtAction = String(status.textContent.includes('Searching for a countermodel'))
        document.documentElement.dataset.actionAt = String(performance.now())
        if (how === 'cancel') document.querySelector('[data-testid=decision-cancel]').click()
        else {
          const input = document.querySelector('[data-testid=decision-premise-1]')
          input.value = 'Pr(A) > 0'; input.dispatchEvent(new Event('input',{bubbles:true}))
        }
      },50)
    })
    observer.observe(status,{childList:true,subtree:true,characterData:true})
  }, action)
  await page.getByTestId('decision-run').click()
  await page.waitForFunction(() => !!document.documentElement.dataset.actionAt)
  assert.equal(await page.locator('html').getAttribute('data-pending-at-action'),'true')
  const expected = action === 'cancel' ? 'Cancelled — no decision established.' : 'Input changed; decide the current problem.'
  await page.waitForFunction(text => document.querySelector('[data-testid=decision-status]')?.textContent === text, expected, {timeout:20000})
  const elapsedMs = await page.evaluate(() => performance.now()-Number(document.documentElement.dataset.actionAt))
  assert.equal(await page.getByTestId('decision-run').isDisabled(),false)
  if (action === 'edit') assert.equal(await page.getByTestId('decision-save-smt').isDisabled(),true)
  await page.getByTestId('decision-example').selectOption('0'); await page.getByTestId('decision-run').click()
  await page.waitForFunction(() => document.querySelector('[data-testid=decision-status]')?.textContent.includes('ENTAILS —'))
  assert.deepEqual(errors,[])
  rows.push({action,taskDelayMs:50,pendingAtAction:true,settled:true,elapsedMs,reuse:'ENTAILED',errors})
  await page.close()
}
await browser.close()
fs.writeFileSync(new URL('./live-controls.json',import.meta.url), JSON.stringify({checks:rows.length,qualification:'Instance observations; no universal physical settlement bound is claimed.',rows},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify(rows))
