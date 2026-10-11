# Corrected regression-test assumption

The first repaired-source browser run passed 48/49 tests. The new desktop test
incorrectly required the SVG boxes to start at the same vertical position.
The original graph has an extra explanatory paragraph above its box, so their
37.4375px difference is expected in the preexisting desktop layout. The grid
sections, rather than the boxes, must be side by side. The assertion now checks
section alignment and nonoverlap. No runtime repair was needed for this finding.

Captured failing context follows:

# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: do_calculus.spec.ts >> diagrams stay contained at 1280px with internal scrolling when needed
- Location: tests/do_calculus.spec.ts:105:3

# Error details

```
Error: expect(received).toBeLessThan(expected)

Expected: < 1
Received:   37.4375
```

# Page snapshot

```yaml
- main [ref=e3]:
  - generic [ref=e4]:
    - 'heading "PrSATdo: do-calculus step checker" [level=1] [ref=e5]'
    - paragraph [ref=e6]: Check one application of Pearl’s three rules on an observed-variable acyclic causal graph. The graphical condition applies uniformly to values where both displayed conditionals are defined.
    - paragraph [ref=e7]: This phase checks proposed rule steps. Automatic identification and graphs with latent confounding are later work.
    - link "Open causal model finder" [ref=e8] [cursor=pointer]:
      - /url: ./causal.html
  - generic [ref=e9]:
    - text: Example
    - combobox "Do-calculus example" [ref=e10]:
      - 'option "Rule 2: replace observation by intervention" [selected]'
      - 'option "Rule 1: delete a blocked observation"'
      - 'option "Rule 2: a common cause blocks exchange"'
      - 'option "Rule 3: delete an irrelevant intervention"'
      - 'option "Rule 3: observing a descendant changes the test"'
      - 'option "Rule 3: compute ancestry after the existing intervention"'
      - 'option "Rule 1: conditioning opens a collider path"'
  - generic [ref=e11]: Causal graph
  - textbox "Causal graph" [ref=e12]: Z -> Y
  - paragraph [ref=e13]: Edges or isolated variables, separated by newlines or semicolons. Up to six observed Boolean variables.
  - generic [ref=e14]: Rule
  - combobox "Rule" [ref=e15]:
    - option "1 — insert/delete observations"
    - option "2 — exchange actions and observations" [selected]
    - option "3 — insert/delete actions"
  - generic [ref=e16]:
    - generic [ref=e17]:
      - generic [ref=e18]: Existing interventions X (optional)
      - textbox "Existing interventions X (optional)" [ref=e19]
    - generic [ref=e20]:
      - generic [ref=e21]: Outcome assignments Y
      - textbox "Outcome assignments Y" [ref=e22]: Y=1
    - generic [ref=e23]:
      - generic [ref=e24]: Changed assignments Z
      - textbox "Changed assignments Z" [ref=e25]: Z=1
    - generic [ref=e26]:
      - generic [ref=e27]: Other observations W (optional)
      - textbox "Other observations W (optional)" [ref=e28]
  - paragraph [ref=e29]: Use assignments such as X=1, M=0. Y and Z must be nonempty, and all four variable groups must be pairwise disjoint.
  - status [ref=e30]: Assignments are valid and pairwise disjoint. The check concerns the supplied observed-variable DAG.
  - generic [ref=e31]:
    - button "Check rule step" [active] [ref=e32]
    - button "Save step" [ref=e33]
    - button "Load saved do-calculus step" [ref=e34]
    - button "Save counterexample problem" [ref=e35]
  - status [ref=e36]: Rule 2 applies under its graphical condition.
  - generic [ref=e38]:
    - heading "Proposed equality" [level=2] [ref=e39]
    - generic [ref=e40]: Pr(Y | do(Z=1)) = Pr(Y | Z)
    - paragraph [ref=e41]: This rule certifies the equality wherever the displayed conditional probabilities are defined. Numerical definedness has not been checked.
    - heading "Definedness obligations" [level=3] [ref=e42]
    - list [ref=e43]:
      - listitem [ref=e44]: Pr(Z) > 0
    - heading "Graphical check" [level=3] [ref=e45]
    - paragraph [ref=e46]: "{Y} ⟂ {Z} given ∅ in G_bar(X),underline(Z). The rule certifies equality wherever both sides are defined."
    - paragraph [ref=e47]: G_bar(X),underline(Z)
    - paragraph [ref=e48]: "Removed directed edges: Z → Y"
    - generic [ref=e49]:
      - generic [ref=e50]:
        - heading "Original graph" [level=3] [ref=e51]
        - paragraph [ref=e52]: Red dashed arrows are removed for this rule test.
        - img "Directed causal graph" [ref=e54]:
          - generic "Z → Y (removed for the rule test)"
          - generic "Z" [ref=e55]:
            - generic [ref=e57]: Z
          - generic "Y" [ref=e58]:
            - generic [ref=e60]: "Y"
      - generic [ref=e61]:
        - heading "Graph used by the rule" [level=3] [ref=e62]
        - img "Directed causal graph" [ref=e64]:
          - generic "Z" [ref=e65]:
            - generic [ref=e67]: Z
          - generic "Y" [ref=e68]:
            - generic [ref=e70]: "Y"
    - paragraph [ref=e71]: "Node colors: outcome Y blue; changed Z yellow; existing intervention X purple; other observation W green."
    - group [ref=e72]:
      - generic "Inspect the d-separation certificate" [ref=e73] [cursor=pointer]
  - paragraph [ref=e74]: The counterexample file loads in the causal model finder. Its unequal-probability constraint requires both terms to be defined. Check premise consistency before interpreting an UNSAT counterexample search as a consequence.
  - paragraph [ref=e75]:
    - text: "Reference:"
    - link "Pearl, Causality, Chapter 3, Theorem 3.4.1" [ref=e76] [cursor=pointer]:
      - /url: https://web.cs.ucla.edu/~kaoru/CAUSALITY-REPRINTED-W-CORRECTIONS-2013/causality-ch3-june2013.pdf
```

# Test source

```ts
  43  |   await expect(page.getByTestId('do-export-challenge')).toBeDisabled()
  44  |   await expect(page.getByTestId('do-results')).toBeEmpty()
  45  |   await expect(page.getByTestId('do-validation')).toContainText('acyclic')
  46  |   await page.getByTestId('do-graph').fill('Z -> Y')
  47  |   await page.getByTestId('do-z').fill('Y=1')
  48  |   await expect(page.getByTestId('do-validation')).toContainText('overlap')
  49  | })
  50  | 
  51  | test('saved steps restore the input and require a new check', async ({ page }) => {
  52  |   await open(page); await check(page, true)
  53  |   const downloading = page.waitForEvent('download')
  54  |   await page.getByRole('button', { name: 'Save step', exact: true }).click()
  55  |   const download = await downloading
  56  |   const path = await download.path(); if (!path) throw new Error('Missing saved step')
  57  |   const saved = await readFile(path)
  58  |   await page.getByTestId('do-y').fill('Y=0')
  59  |   await page.getByLabel('Load saved do-calculus step').setInputFiles({ name: 'step.json', mimeType: 'application/json', buffer: saved })
  60  |   await expect(page.getByTestId('do-y')).toHaveValue('Y=1')
  61  |   await expect(page.getByTestId('do-results')).toBeEmpty()
  62  |   await check(page, true)
  63  | })
  64  | 
  65  | test('exported certified step is UNSAT as a counterexample in the model finder', async ({ page }) => {
  66  |   await open(page); await check(page, true)
  67  |   const downloading = page.waitForEvent('download')
  68  |   await page.getByTestId('do-export-challenge').click()
  69  |   const download = await downloading
  70  |   const path = await download.path(); if (!path) throw new Error('Missing counterexample problem')
  71  |   const problem = await readFile(path)
  72  |   await page.getByRole('link', { name: 'Open causal model finder' }).click()
  73  |   await expect(page.getByTestId('causal-z3-status')).toHaveText('Z3 ready.', { timeout: 20_000 })
  74  |   await page.getByLabel('Load saved causal problem').setInputFiles({ name: 'counterexample.json', mimeType: 'application/json', buffer: problem })
  75  |   await expect(page.getByTestId('causal-constraints')).toHaveValue('Pr(Y | do(Z=1)) != Pr(Y | Z)')
  76  |   await page.getByTestId('causal-find').click()
  77  |   await expect(page.getByTestId('causal-status')).toContainText('UNSAT —', { timeout: 20_000 })
  78  | })
  79  | 
  80  | test('step checker and model finder link in both directions', async ({ page }) => {
  81  |   await page.goto('/causal.html')
  82  |   await page.getByRole('link', { name: 'Check a do-calculus step' }).click()
  83  |   await expect(page).toHaveURL(/do_calculus\.html/)
  84  |   await page.getByRole('link', { name: 'Open causal model finder' }).click()
  85  |   await expect(page).toHaveURL(/causal\.html/)
  86  | })
  87  | 
  88  | test('long supported node labels fit inside their graph shapes', async ({ page }) => {
  89  |   await open(page)
  90  |   const name = 'Y9007199254740991'
  91  |   await page.getByTestId('do-graph').fill(`Z -> ${name}`)
  92  |   await page.getByTestId('do-y').fill(`${name}=1`)
  93  |   await check(page, true)
  94  |   const fit = await page.getByTestId('do-original-graph').evaluate((element, nodeName) => {
  95  |     const node = element.querySelector(`[data-node="${nodeName}"]`)!
  96  |     const text = (node.querySelector('text') as SVGGraphicsElement).getBBox()
  97  |     const shape = (node.querySelector('ellipse') as SVGGraphicsElement).getBBox()
  98  |     const svg = element.querySelector('svg')!.viewBox.baseVal
  99  |     return text.x >= shape.x && text.x + text.width <= shape.x + shape.width && shape.x >= 0 && shape.x + shape.width <= svg.width
  100 |   }, name)
  101 |   expect(fit).toBe(true)
  102 | })
  103 | 
  104 | for (const width of [320, 360, 390, 1280]) {
  105 |   test(`diagrams stay contained at ${width}px with internal scrolling when needed`, async ({ page }) => {
  106 |     const errors: string[] = []; page.on('pageerror', error => errors.push(error.message))
  107 |     await page.setViewportSize({ width, height: 900 })
  108 |     await open(page)
  109 |     for (let example = 0; example < 8; example++) {
  110 |       if (example < 7) {
  111 |         await page.getByTestId('do-example').selectOption(String(example))
  112 |       } else {
  113 |         const name = 'Y9007199254740991'
  114 |         await page.getByTestId('do-graph').fill(`Z -> ${name}; Z -> W; W -> ${name}`)
  115 |         await page.getByTestId('do-rule').selectOption('2')
  116 |         await page.getByTestId('do-x').fill('')
  117 |         await page.getByTestId('do-y').fill(`${name}=1`)
  118 |         await page.getByTestId('do-z').fill('Z=1')
  119 |         await page.getByTestId('do-w').fill('')
  120 |       }
  121 |       await check(page, ![2, 4, 6].includes(example))
  122 |       const layout = await page.evaluate(async () => {
  123 |         await document.fonts.ready
  124 |         return {
  125 |           pageWidth: document.documentElement.scrollWidth,
  126 |           viewportWidth: window.innerWidth,
  127 |           diagrams: [...document.querySelectorAll<HTMLElement>('.do-graph-scroll')].map(box => ({
  128 |             width: box.getBoundingClientRect().width,
  129 |             parentWidth: box.parentElement!.clientWidth,
  130 |             clientWidth: box.clientWidth,
  131 |             scrollWidth: box.scrollWidth,
  132 |             svgWidth: box.querySelector('svg')!.getBoundingClientRect().width,
  133 |             top: box.getBoundingClientRect().top,
  134 |           })),
  135 |         }
  136 |       })
  137 |       expect(layout.pageWidth, `example ${example} at ${width}px`).toBeLessThanOrEqual(layout.viewportWidth)
  138 |       expect(layout.diagrams).toHaveLength(2)
  139 |       for (const diagram of layout.diagrams) {
  140 |         expect(diagram.width).toBeLessThanOrEqual(diagram.parentWidth + 1)
  141 |         if (diagram.svgWidth > diagram.clientWidth + 1) expect(diagram.scrollWidth).toBeGreaterThan(diagram.clientWidth)
  142 |       }
> 143 |       if (width === 1280) expect(Math.abs(layout.diagrams[0].top - layout.diagrams[1].top)).toBeLessThan(1)
      |                                                                                             ^ Error: expect(received).toBeLessThan(expected)
  144 |     }
  145 |     expect(errors).toEqual([])
  146 |   })
  147 | }
  148 | 
```