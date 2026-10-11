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
await page.close()
for (const width of [390,320]) {
  const longPage = await browser.newPage({viewport:{width,height:900}})
  await longPage.goto(new URL('dist/decision.html',base).href)
  await longPage.waitForFunction(()=>document.querySelector('[data-testid=decision-runtime]')?.textContent==='Z3 ready.')
  await longPage.getByTestId('decision-example').selectOption('8')
  const backdoor='Pr(Y | do(X)) = Pr(Y | X & Z)*Pr(Z) + Pr(Y | X & ~Z)*Pr(~Z)'
  await longPage.getByTestId('decision-premise-1').fill(backdoor)
  const scrollEnd=async(name)=>{
    const region=longPage.getByRole('region',{name,exact:true})
    const size=await region.evaluate(e=>({client:e.clientWidth,scroll:e.scrollWidth}))
    assert.ok(size.client>0 && size.scroll>size.client)
    await region.focus();await region.press('ArrowRight');await longPage.waitForTimeout(150)
    assert.ok(await region.evaluate(e=>e.scrollLeft)>0)
    await region.evaluate(e=>{e.scrollLeft=e.scrollWidth})
    const end=await region.evaluate(e=>{const nodes=e.querySelectorAll('mi,mn,mo');return{right:nodes[nodes.length-1].getBoundingClientRect().right,bound:e.getBoundingClientRect().right}})
    assert.ok(end.right<=end.bound+2)
    return size
  }
  const premiseSize=await scrollEnd('Premise 1 preview')
  await longPage.getByTestId('decision-clear').click()
  await longPage.getByTestId('decision-conclusion').fill('Pr(Y | do(X)) = Pr(Y | X & Z)*Pr(Z) + Pr(Y | X & ~Z)*Pr(Z)')
  const conclusionSize=await scrollEnd('Conclusion preview')
  await longPage.getByTestId('decision-run').click()
  await longPage.waitForFunction(()=>document.querySelector('[data-testid=decision-status]')?.textContent.includes('DOES NOT ENTAIL'))
  const resultSize=await scrollEnd('Submitted conclusion formula')
  assert.ok(await longPage.locator('.decision-action-panel').evaluate(e=>e.scrollWidth-e.clientWidth)<=1)
  assert.equal(await longPage.locator('.decision-action-panel').evaluate(e=>e.scrollLeft),0)
  assert.ok(await longPage.evaluate(()=>document.documentElement.scrollWidth)<=width)
  if(capture)await longPage.screenshot({path:path.join(path.dirname(out),`repaired-long-${width}.png`),fullPage:true})
  rows.push({kind:'long-formulas-keyboard-scroll',width,premiseSize,conclusionSize,resultSize,passed:true})
  await longPage.close()
}
const loadPage=await browser.newPage({viewport:{width:390,height:900}})
await loadPage.goto(new URL('dist/decision.html',base).href)
await loadPage.waitForFunction(()=>document.querySelector('[data-testid=decision-runtime]')?.textContent==='Z3 ready.')
const saved={version:1,kind:'DoSAT-decision',task:'entailment',graph:'A',premises:'Pr(A)=1/2',conclusion:'Pr(A)>0',regular:false,mode:'complete',seconds:30}
for(const override of [{graph:'A ->\rB'},{premises:'Pr(A)\r=1/2'},{conclusion:'Pr(A)\r=1/2'}]){
  await loadPage.getByLabel('Load saved decision problem').setInputFiles({name:'lines.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...saved,...override}))})
  await loadPage.waitForFunction(()=>document.querySelector('[data-testid=decision-status]')?.textContent.includes('Load error'))
  assert.equal(await loadPage.getByTestId('decision-graph').inputValue(),'Z -> X; Z -> Y')
  assert.equal(await loadPage.getByTestId('decision-conclusion').inputValue(),'Pr(Y | do(X)) = 1/2')
  assert.equal(await loadPage.getByTestId('decision-run').isDisabled(),false)
  assert.equal(await loadPage.getByTestId('decision-save').isDisabled(),false)
  rows.push({kind:'lone-cr-load-rejected-atomically',field:Object.keys(override)[0],passed:true})
}
const crlf={...saved,graph:'Z -> X;\r\nZ -> Y',premises:'Pr(Z)=1/2\r\n\r\n# comment\r\nPr(X | Z)=3/4',conclusion:'Pr(Y | do(X))=1/2\r\n'}
await loadPage.getByLabel('Load saved decision problem').setInputFiles({name:'crlf.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(crlf))})
await loadPage.waitForFunction(()=>document.querySelector('[data-testid=decision-premise-4]')?.value==='Pr(X | Z)=3/4')
await loadPage.getByTestId('decision-batch-toggle').click()
assert.equal(await loadPage.getByTestId('decision-premises').inputValue(),'Pr(Z)=1/2\n\n# comment\nPr(X | Z)=3/4')
assert.equal(await loadPage.getByTestId('decision-discard-batch').isDisabled(),true)
assert.equal(await loadPage.getByTestId('decision-run').isDisabled(),false)
rows.push({kind:'crlf-load-physical-rows',passed:true})
await loadPage.close()
await browser.close(); fs.writeFileSync(out, JSON.stringify({ base, checks: rows.length, rows }, null, 2)+'\n', { flag: 'wx' }); console.log(JSON.stringify({ checks: rows.length, output: out }))
