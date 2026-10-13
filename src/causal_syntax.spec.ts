import { describe, expect, test } from 'vitest'
import { assert_parse_constraint, assert_parse_sentence } from './parser'
import {
  CAUSAL_LIMITS,
  normalize_causal_variable,
  parse_causal_document,
  parse_causal_graph,
  validate_causal_query_identifiers,
} from './causal_syntax'

describe('causal graph syntax', () => {
  test('preserves declared order, roots, isolated nodes, and deduplicated parents', () => {
    expect(parse_causal_graph('Z -> X; Z -> Y\nX -> Y; Z -> X\nW # independent')).toEqual({
      nodes: ['Z', 'X', 'Y', 'W'],
      parents: { Z: [], X: ['Z'], Y: ['Z', 'X'], W: [] },
    })
  })

  test('accepts comments, blank declarations, CRLF, and Unicode arrows', () => {
    expect(parse_causal_graph('# graph\r\n\r\nX1 → Y; ; # edge\r\nZ')).toEqual({
      nodes: ['X1', 'Y', 'Z'],
      parents: { X1: [], Y: ['X1'], Z: [] },
    })
  })

  test.each([
    ['', /at least one/],
    ['# only a comment', /at least one/],
    ['X -> X', /Self edge/],
    ['X -> Y; Y -> Z; Z -> X', /acyclic.*cycle/],
    ['W; X -> Y; Y -> X', /acyclic.*cycle/],
    ['X ->', /Invalid causal variable/],
    ['X -> Y -> Z', /one edge per declaration/],
    ['Latent -> X', /Invalid causal variable/],
    ['X <-> Y', /Invalid causal variable/],
    ['X0 -> Y', /Invalid causal variable/],
    ['X01', /Invalid causal variable/],
    ['X9007199254740993', /too large/],
    ['A; B; C; D; E; F; G; H; I', /At most 8/],
  ])('rejects graph %j', (source, error) => {
    expect(() => parse_causal_graph(source)).toThrow(error)
  })

  test('graph syntax errors retain their original line number', () => {
    expect(() => parse_causal_graph('# first\nX\nfoo')).toThrow(/Graph line 3:/)
  })

  test('normalizes canonical letter names without rounding their indices', () => {
    expect(normalize_causal_variable(' X1 ')).toBe('X1')
    expect(normalize_causal_variable('X')).toBe('X')
    expect(normalize_causal_variable('X9007199254740991')).toBe('X9007199254740991')
    expect(() => normalize_causal_variable('X9007199254740992')).toThrow(/too large/)
  })
})

describe('causal probability syntax', () => {
  const graph = 'Z -> X; Z -> Y; X -> Y'

  test('parses observational, conditional, and simultaneous interventional queries together', () => {
    const document = parse_causal_document(graph, [
      'Pr(Y) = 1/2',
      'Pr(Y | X) > Pr(Y | do(X=1))',
      'Pr(Y | do(X=0), Z) = 1/4',
      'Pr(Y & Z | do(X=1, Z=0)) = 0',
    ].join('\n'))
    expect(document.probabilities).toEqual({
      CausalQueryA: { event: assert_parse_sentence('Y'), intervention: [], source: 'Pr(Y)' },
      CausalQueryB: { event: assert_parse_sentence('Y'), given: assert_parse_sentence('X'), intervention: [], source: 'Pr(Y | X)' },
      CausalQueryC: { event: assert_parse_sentence('Y'), intervention: [{ variable: 'X', value: true }], source: 'Pr(Y | do(X=1))' },
      CausalQueryD: { event: assert_parse_sentence('Y'), given: assert_parse_sentence('Z'), intervention: [{ variable: 'X', value: false }], source: 'Pr(Y | do(X=0), Z)' },
      CausalQueryE: { event: assert_parse_sentence('Y & Z'), intervention: [{ variable: 'X', value: true }, { variable: 'Z', value: false }], source: 'Pr(Y & Z | do(X=1, Z=0))' },
    })
    expect(document.constraints).toEqual([
      assert_parse_constraint('CausalQueryA = 1/2'),
      assert_parse_constraint('CausalQueryB > CausalQueryC'),
      assert_parse_constraint('CausalQueryD = 1/4'),
      assert_parse_constraint('CausalQueryE = 0'),
    ])
  })

  test('balanced scanning keeps propositional parentheses distinct from query parentheses', () => {
    const document = parse_causal_document(graph, 'Pr((Y & (Z v ~X)) | do(X=1), (Z -> Y)) = 1/2')
    expect(document.probabilities.CausalQueryA).toEqual({
      event: assert_parse_sentence('(Y & (Z v ~X))'),
      given: assert_parse_sentence('(Z -> Y)'),
      intervention: [{ variable: 'X', value: true }],
      source: 'Pr((Y & (Z v ~X)) | do(X=1), (Z -> Y))',
    })
  })

  test('accepts P and p aliases and optional whitespace before opening parentheses', () => {
    const document = parse_causal_document(graph, 'P(Y) + p (Y | do (X = 0)) = Pr (Y | X)')
    expect(Object.values(document.probabilities).map((probability) => probability.intervention)).toEqual([
      [], [{ variable: 'X', value: false }], [],
    ])
    expect(document.constraints[0]).toEqual(assert_parse_constraint('CausalQueryA + CausalQueryB = CausalQueryC'))
  })

  test('Boolean intervention literals are exactly the existing hard assignments', () => {
    const document = parse_causal_document(graph, 'Pr(Y | do(X)) = Pr(Y | do(X=1))\nPr(Y | do(~X)) = Pr(Y | do(X=0))')
    expect(Object.values(document.probabilities).map(query => query.intervention)).toEqual([
      [{ variable: 'X', value: true }], [{ variable: 'X', value: true }],
      [{ variable: 'X', value: false }], [{ variable: 'X', value: false }],
    ])
    expect(document.probabilities.CausalQueryA.source).toBe('Pr(Y | do(X))')
    expect(document.probabilities.CausalQueryC.source).toBe('Pr(Y | do(~X))')
  })

  test('accepts simultaneous literals, mixed numeric assignments and surrounding whitespace', () => {
    const document = parse_causal_document(graph, 'P(Y | do ( X , ~ Z )) = p (Y | do(X=1, Z=0))\nPr(Y | do(~ X, Z=1)) = 1/2')
    expect(Object.values(document.probabilities).map(query => query.intervention)).toEqual([
      [{ variable: 'X', value: true }, { variable: 'Z', value: false }],
      [{ variable: 'X', value: true }, { variable: 'Z', value: false }],
      [{ variable: 'X', value: false }, { variable: 'Z', value: true }],
    ])
  })

  test('intervention literals preserve exact canonical indexed-variable names', () => {
    const document = parse_causal_document('X1 -> Y; Z9007199254740991', 'Pr(Y | do(X1, ~Z9007199254740991)) = 1/2')
    expect(document.probabilities.CausalQueryA.intervention).toEqual([
      { variable: 'X1', value: true }, { variable: 'Z9007199254740991', value: false },
    ])
  })

  test('ordinary conditioning after a literal intervention still accepts propositional formulas', () => {
    const document = parse_causal_document(graph, 'Pr(Y | do(X), (Z v ~Y)) = 1/2')
    expect(document.probabilities.CausalQueryA.intervention).toEqual([{ variable: 'X', value: true }])
    expect(document.probabilities.CausalQueryA.given).toEqual(assert_parse_sentence('Z v ~Y'))
  })

  test('preserves exact numerals, fractions, arithmetic, free reals, and constraint Boolean structure', () => {
    const source = '~(Pr(Y | do(X=1)) = 9007199254740993/100000000000000000000) & (q + Pr(Y)^2 > 0.10000000000000000001 -> p = 2)'
    const expected = '~(CausalQueryA = 9007199254740993/100000000000000000000) & (q + CausalQueryB^2 > 0.10000000000000000001 -> p = 2)'
    const document = parse_causal_document(graph, source)
    expect(document.constraints).toEqual([assert_parse_constraint(expected)])
    expect(Object.keys(document.probabilities)).toEqual(['CausalQueryA', 'CausalQueryB'])
  })

  test('does not misread alphabetic real variables containing probability aliases', () => {
    const source = 'SomePr + Purple + apple = Pr(Y) + p'
    const document = parse_causal_document(graph, source)
    expect(document.constraints[0]).toEqual(assert_parse_constraint('SomePr + Purple + apple = CausalQueryA + p'))
    expect(Object.keys(document.probabilities)).toEqual(['CausalQueryA'])
  })

  test('accepts Boolean constants and canonical indexed variables', () => {
    const document = parse_causal_document('X1 -> Y2', 'Pr(true | do(X1=1), ~Y2) = 1\nPr(false) = 0')
    expect(document.probabilities.CausalQueryA.event).toEqual({ tag: 'value', value: true })
    expect(document.probabilities.CausalQueryA.given).toEqual(assert_parse_sentence('~Y2'))
    expect(document.probabilities.CausalQueryA.intervention).toEqual([{ variable: 'X1', value: true }])
  })

  test('keeps input query order and original line numbers after comments', () => {
    const document = parse_causal_document(graph, '# query constraints\n\nPr(Y) = 1/2 # marginal\n\n Pr(X) = 1/3 ')
    expect(document.source).toEqual(['Pr(Y) = 1/2', 'Pr(X) = 1/3'])
    expect(Object.keys(document.probabilities)).toEqual(['CausalQueryA', 'CausalQueryB'])
    expect(() => parse_causal_document(graph, '# first\n\nPr(U)=1')).toThrow(/Constraint line 3:.*U.*not declared/)
  })

  test('permits graph-only model searches', () => {
    expect(parse_causal_document('X', '# no constraints')).toEqual({
      graph: { nodes: ['X'], parents: { X: [] } }, constraints: [], probabilities: {}, source: [],
    })
  })

  test.each([
    'Pr(X & Y) != Pr(X)Pr(Y)',
    'Pr(X)x=5',
    'Pr(X)P(Y)=5',
    'Pr(X)e=5',
    'Pr(X)(Y)=5',
    'Pr(X) (Y)=5',
  ])('rejects adjacent probability tokens without an arithmetic operator: %s', (source) => {
    expect(() => parse_causal_document('X; Y', source)).toThrow(/Invalid constraint/)
  })

  test('rejects a same-line alias even when its target query is already registered', () => {
    // Without delimiters, Pr(X)A becomes CausalQueryAA, an exact key created
    // later on this same line. The reserved-name validator alone cannot help.
    const line = 'Pr(X)A + ' + Array(26).fill('Pr(X | do(X=1))').join(' + ') + ' = 1/3 + 26'
    expect(() => parse_causal_document('X', line)).toThrow(/Invalid constraint: At column/)
  })

  test('rejects adjacency that previously aliased the twenty-seventh probability query', () => {
    const source = ['Pr(X)A=1/3', ...Array(26).fill('Pr(X | do(X=1))=1')].join('\n')
    expect(() => parse_causal_document('X', source)).toThrow(/Constraint line 1: Invalid constraint/)
  })

  test.each([
    ['Pr(X)*Pr(Y)=1/4', 'CausalQueryA*CausalQueryB=1/4'],
    ['Pr(X)^2=1/4', 'CausalQueryA^2=1/4'],
    ['-Pr(X)=-1/2', '-CausalQueryA=-1/2'],
    ['~(Pr(X)=1/2)', '~(CausalQueryA=1/2)'],
  ])('preserves the AST with explicit arithmetic and logical operators: %s', (source, expected) => {
    const document = parse_causal_document('X; Y', source)
    expect(document.constraints).toEqual([assert_parse_constraint(expected)])
  })

  test('postparse reserved-name validation accepts exact query keys and rejects merged names', () => {
    const probabilities = parse_causal_document('X', 'Pr(X)=1/2').probabilities
    expect(() => validate_causal_query_identifiers(['x', 'CausalQueryA'], probabilities)).not.toThrow()
    for (const identifier of ['CausalQueryAx', 'fooCausalQueryA', 'CausalQueryACausalQueryB']) {
      expect(() => validate_causal_query_identifiers([identifier], probabilities)).toThrow(/reserved causal query identifier/)
    }
  })

  test.each([
    ['Pr(U) = 1', /U.*not declared/],
    ['Pr(Y | U) = 1', /U.*not declared/],
    ['Pr(Y | do(U=1)) = 1', /U.*not declared/],
    ['Pr(Y | do(U)) = 1', /U.*not declared/],
    ['Pr(Y | do(~U)) = 1', /U.*not declared/],
    ['Pr(Y | do(X=1), U) = 1', /U.*not declared/],
    ['Pr(Y | do()) = 1', /at least one assignment/],
    ['Pr(Y | do(X & Z)) = 1', /only literal assignments/],
    ['Pr(Y | do(X v Z)) = 1', /only literal assignments/],
    ['Pr(Y | do(X -> Z)) = 1', /only literal assignments/],
    ['Pr(Y | do(X <-> Z)) = 1', /only literal assignments/],
    ['Pr(Y | do(~(X & Z))) = 1', /only literal assignments/],
    ['Pr(Y | do((X))) = 1', /only literal assignments/],
    ['Pr(Y | do(~(X))) = 1', /only literal assignments/],
    ['Pr(Y | do(~~X)) = 1', /only literal assignments/],
    ['Pr(Y | do(!X)) = 1', /only literal assignments/],
    ['Pr(Y | do(-X)) = 1', /only literal assignments/],
    ['Pr(Y | do(x)) = 1', /only literal assignments/],
    ['Pr(Y | do(X0)) = 1', /only literal assignments/],
    ['Pr(Y | do(X01)) = 1', /only literal assignments/],
    ['Pr(Y | do(X9007199254740992)) = 1', /too large/],
    ['Pr(Y | do(~X9007199254740992)) = 1', /too large/],
    ['Pr(Y | do(~X=0)) = 1', /only literal assignments/],
    ['Pr(Y | do(X=2)) = 1', /only literal assignments/],
    ['Pr(Y | do(X=true)) = 1', /only literal assignments/],
    ['Pr(Y | do(X=1.0)) = 1', /only literal assignments/],
    ['Pr(Y | do(X=1,)) = 1', /only literal assignments/],
    ['Pr(Y | do(X,)) = 1', /only literal assignments/],
    ['Pr(Y | do(,~X)) = 1', /only literal assignments/],
    ['Pr(Y | do(X, X)) = 1', /Repeated intervention/],
    ['Pr(Y | do(X, ~X)) = 1', /Repeated intervention/],
    ['Pr(Y | do(~X, ~X)) = 1', /Repeated intervention/],
    ['Pr(Y | do(X, X=1)) = 1', /Repeated intervention/],
    ['Pr(Y | do(~X, X=0)) = 1', /Repeated intervention/],
    ['Pr(Y | do(X=0, X)) = 1', /Repeated intervention/],
    ['Pr(Y | do(X=1, X=0)) = 1', /Repeated intervention/],
    ['Pr(Y | do(X=1, X=1)) = 1', /Repeated intervention/],
    ['Pr(Y | do(X=1) & Z) = 1', /with a comma/],
    ['Pr(Y | do(X=1),) = 1', /Invalid conditioning event/],
    ['Pr(Y | do(X=1), Z, X) = 1', /Invalid conditioning event/],
    ['Pr(Y | X | Z) = 1', /only one conditioning bar/],
    ['Pr(do(X=1)) = 1', /Invalid probability event/],
    ['Pr(Pr(Y)) = 1', /Invalid probability event/],
    ['Pr(Y | Do(X=1)) = 1', /Invalid conditioning event/],
    ['Pr(Y = 1', /Missing closing parenthesis/],
    ['Pr(Y)) = 1', /Unexpected closing parenthesis/],
    ['Pr(Y) >', /Invalid constraint/],
    ['CausalQueryA = Pr(Y)', /reserved/],
    ['fooCausalQueryA = 1', /reserved/],
    ['Pr(X9007199254740993) = 1', /safe integers/],
  ])('rejects probability or constraint %j', (source, error) => {
    expect(() => parse_causal_document(graph, source)).toThrow(error)
  })
})

describe('causal input bounds', () => {
  test('supports every query up to the query bound with alphabetic, unique names', () => {
    const source = Array(CAUSAL_LIMITS.max_probabilities).fill('Pr(X)=1/2').join('\n')
    const document = parse_causal_document('X', source)
    const names = Object.keys(document.probabilities)
    expect(names).toHaveLength(CAUSAL_LIMITS.max_probabilities)
    expect(new Set(names).size).toBe(names.length)
    expect(names.every((name) => /^[A-Za-z]+$/.test(name))).toBe(true)
    expect(names[25]).toBe('CausalQueryZ')
    expect(names[26]).toBe('CausalQueryAA')
  })

  test('bounds total probability occurrences independently of constraint count', () => {
    const source = `${Array(CAUSAL_LIMITS.max_probabilities + 1).fill('Pr(X)').join('+')}=1`
    expect(() => parse_causal_document('X', source)).toThrow(/At most 64 probability queries/)
  })

  test('bounds nonempty constraint lines', () => {
    const source = Array(CAUSAL_LIMITS.max_constraints + 1).fill('q=1').join('\n')
    expect(() => parse_causal_document('X', source)).toThrow(/At most 64 causal constraint lines/)
  })

  test('bounds the entire supplied input, including comments', () => {
    expect(() => parse_causal_document('X', '#'.repeat(CAUSAL_LIMITS.max_input_characters))).toThrow(/50000 characters/)
  })

  test('bounds individual expression lengths', () => {
    expect(() => parse_causal_document('X', '1'.repeat(CAUSAL_LIMITS.max_line_characters + 1))).toThrow(/4096 characters/)
  })

  test('bounds nesting before invoking the recursive parser', () => {
    const nesting = CAUSAL_LIMITS.max_parenthesis_depth + 1
    const source = `${'('.repeat(nesting)}Pr(X)=1${')'.repeat(nesting)}`
    expect(() => parse_causal_document('X', source)).toThrow(/64 nested parentheses/)
  })

  test('bounds token chains before invoking the recursive parser', () => {
    const source = `${Array(CAUSAL_LIMITS.max_tokens_per_line).fill('1').join('+')}=1`
    expect(() => parse_causal_document('X', source)).toThrow(/512 tokens/)
  })
})
