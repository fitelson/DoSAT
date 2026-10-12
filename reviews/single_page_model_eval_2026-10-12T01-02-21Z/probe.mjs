import {chromium} from 'playwright';import fs from 'node:fs';import assert from 'node:assert/strict';import path from 'node:path'
const base=process.env.PROBE_URL??'http://127.0.0.1:4175/DoSAT/'
const out=process.env.PROBE_OUTPUT??new URL('./package-probe.json',import.meta.url).pathname
const capture=process.env.PROBE_CAPTURE==='1',b=await chromium.launch({headless:true}),rows=[]
for(const width of [1280,390,320]){
 for(let example=0;example<9;example++){
  const p=await b.newPage({viewport:{width,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(base)
  await p.waitForFunction(()=>document.querySelector('[data-testid=decision-runtime]')?.textContent==='Z3 ready.');await p.evaluate(()=>document.fonts.ready)
  assert.equal(await p.getByTestId('decision-runtime').getAttribute('data-z3-version'),'5.1.0');assert.equal(await p.getByTestId('decision-graph-preview').isVisible(),true)
  assert.equal(await p.locator('nav a[href*=causal]').count(),0)
  if(example===0){const box=await p.getByTestId('decision-run').boundingBox();if(width!==320)assert.ok(box.y<=(width===1280?800:950));if(capture)await p.screenshot({path:path.join(path.dirname(out),`initial-${width}.png`),fullPage:true});rows.push({kind:'initial',width,runY:box.y,isolated:await p.evaluate(()=>crossOriginIsolated)})}
  await p.getByTestId('decision-example').selectOption(String(example));await p.getByTestId('decision-run').click()
  const expected=['ENTAILS —','DOES NOT ENTAIL','DOES NOT ENTAIL','ENTAILS —','INCONSISTENT PREMISES','SAT —','UNSAT —','ENTAILS —','ENTAILS —'][example]
  await p.waitForFunction(x=>document.querySelector('[data-testid=decision-status]')?.textContent.includes(x),expected)
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth)<=width);assert.deepEqual(errors,[])
  if(example===1){await p.getByTestId('model-evaluate-input').fill('Pr(Y | do(~X))');await p.getByTestId('model-evaluate-run').click();await p.waitForFunction(()=>document.querySelector('[data-testid=model-evaluate-result]')?.textContent.includes('Exact value in this model: 1/2'));if(capture)await p.screenshot({path:path.join(path.dirname(out),`countermodel-eval-${width}.png`),fullPage:true})}
  if(example===5){for(const [source,value] of [['Pr(Y|do(~X))','Exact value in this model: 0'],['Pr(Y|do(X,~Y))','Exact value in this model: 0'],['Pr(Y|do(X))>Pr(Y)','True in this model.'],['Pr(X|do(~Y),Y)','undefined (zero denominator)']]){await p.getByTestId('model-evaluate-input').fill(source);await p.getByTestId('model-evaluate-run').click();await p.waitForFunction(x=>document.querySelector('[data-testid=model-evaluate-result]')?.textContent.includes(x),value)}if(capture)await p.screenshot({path:path.join(path.dirname(out),`sat-undefined-eval-${width}.png`),fullPage:true})}
  rows.push({kind:'example',width,example,expected,errors});await p.close()
 }
 const p=await b.newPage({viewport:{width,height:900}});await p.goto(base);await p.waitForFunction(()=>document.querySelector('[data-testid=decision-runtime]')?.textContent==='Z3 ready.')
 await p.getByTestId('decision-graph').fill('X -> Y; Y -> X');assert.equal(await p.getByTestId('decision-graph-preview').isVisible(),false);assert.ok((await p.locator('#decision-graph-error').textContent()).includes('Syntax error: not a DAG'));assert.equal(await p.getByTestId('decision-run').isDisabled(),true)
 await p.getByTestId('decision-graph').fill('A; B; C; D; E; F9007199254740991');assert.equal(await p.getByTestId('decision-graph-preview').locator('[data-node]').count(),6);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth)<=width);if(capture)await p.screenshot({path:path.join(path.dirname(out),`dag-${width}.png`),fullPage:true})
 rows.push({kind:'dag-recovery-and-isolates',width,passed:true});await p.close()
}
const p=await b.newPage();await p.goto(base);await p.waitForFunction(()=>document.querySelector('[data-testid=decision-runtime]')?.textContent==='Z3 ready.')
await p.getByTestId('decision-task-satisfiability').check();await p.getByTestId('decision-graph').fill('A');await p.getByTestId('decision-clear').click();await p.getByTestId('decision-premise-1').fill('Pr(A)^2=1/2');await p.getByTestId('decision-run').click();await p.waitForFunction(()=>document.querySelector('[data-testid=decision-status]')?.textContent.includes('SAT —'))
await p.getByTestId('model-evaluate-input').fill('Pr(A)^2');await p.getByTestId('model-evaluate-run').click();await p.waitForFunction(()=>document.querySelector('[data-testid=model-evaluate-result]')?.textContent.includes('Exact value in this model: 1/2'));rows.push({kind:'algebraic-model',passed:true})
await p.getByTestId('decision-premise-1').fill('Pr(A)=a & a=1/3');await p.getByTestId('decision-run').click();await p.waitForFunction(()=>document.querySelector('[data-testid=decision-status]')?.textContent.includes('SAT —'))
await p.getByTestId('model-evaluate-input').fill('Pr(A)+a');await p.getByTestId('model-evaluate-run').click();await p.waitForFunction(()=>document.querySelector('[data-testid=model-evaluate-result]')?.textContent.includes('Exact value in this model: 2/3'))
await p.getByTestId('model-evaluate-input').fill('newVariable');await p.getByTestId('model-evaluate-run').click();await p.waitForFunction(()=>document.querySelector('[data-testid=model-evaluate-status]')?.textContent.includes('Unassigned free real variable'));rows.push({kind:'free-variable-and-unknown',passed:true})
const saved={version:1,graph:'X -> Y',constraints:'Pr(X)=0\nPr(Y)=0\nPr(Y|do(X))=1',regular:false}
await p.getByLabel('Load saved decision problem').setInputFiles({name:'legacy.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});await p.waitForFunction(()=>document.querySelector('[data-testid=decision-graph]')?.value==='X -> Y');assert.equal(await p.getByTestId('decision-task-satisfiability').isChecked(),true);assert.equal(await p.getByTestId('model-evaluation').isVisible(),false);await p.getByTestId('decision-run').click();await p.waitForFunction(()=>document.querySelector('[data-testid=decision-status]')?.textContent.includes('SAT —'));rows.push({kind:'legacy-import',passed:true})
await b.close();fs.writeFileSync(out,JSON.stringify({base,checks:rows.length,rows},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({checks:rows.length,out}))
