"""Independent Fraction enumeration: no app parser/compiler/evaluator/solver."""
from fractions import Fraction as F
from itertools import product
from pathlib import Path
import json, re

HERE = Path(__file__).resolve().parent
example = json.loads((HERE / 'presets.json').read_text())[6]
counts = {(1,1,1):60,(1,1,0):20,(1,0,1):40,(1,0,0):10,
          (0,1,1):10,(0,1,0):40,(0,0,1):20,(0,0,0):60}  # E,M,A
expected_edges = {('M','Z'),('U','Z'),('M','E'),('Z','E'),('U','A'),('E','A')}

def rows(do=None):
    do = do or {}
    out = []
    for m,u,z,e,a in product((False,True), repeat=5):
        row = dict(zip(('M','U','Z','E','A'), (m,u,z,e,a)))
        qs = {
            'M': F(1,2), 'U': F(1,2),
            'Z': {(0,0):F(1,16),(0,1):F(161,208),(1,0):F(47,208),(1,1):F(15,16)}[m,u],
            'E': {(0,0):F(1,20),(0,1):F(17,20),(1,0):F(3,20),(1,1):F(19,20)}[m,z],
            'A': {(0,0):F(17,111),(0,1):F(19,37),(1,0):F(18,37),(1,1):F(94,111)}[e,u],
        }
        mass = F(1)
        for node,q in qs.items():
            assert 0 < q < 1
            if node in do:
                if row[node] != do[node]:
                    mass = F(0)
                    break
            else:
                mass *= q if row[node] else 1-q
        out.append((row,mass))
    assert sum(w for _,w in out) == 1
    return out

def event(text,row):
    return all(row[p.strip().lstrip('~')] != p.strip().startswith('~') for p in text.split('&'))

def probability(text):
    parts = text.split('|')
    target, evidence, do = parts[0].strip(), '', {}
    if len(parts) > 1:
        evidence = parts[1].strip()
        intervention = re.match(r'do\(([^)]+)\)(?:\s*,\s*(.*))?$', evidence)
        if intervention:
            assignments, evidence = intervention.groups()
            evidence = evidence or ''
            do = {p.strip().lstrip('~'):not p.strip().startswith('~') for p in assignments.split(',')}
    selected = [(r,w) for r,w in rows(do) if not evidence or event(evidence,r)]
    denominator = sum(w for _,w in selected)
    assert denominator > 0
    return sum(w for r,w in selected if event(target,r))/denominator

def evaluate(text):
    replaced = re.sub(r'Pr\(((?:[^()]|do\([^()]*\))*)\)',
                      lambda m:repr(probability(m[1])), text)
    replaced = re.sub(r'(?<![<>=!])=(?!=)', '==', replaced).replace(' & ', ' and ')
    replaced = re.sub(r'(?<![\w])(\d+)/(\d+)(?![\w])', r'F(\1,\2)', replaced)
    return eval(replaced, {'__builtins__':{}, 'Fraction':F, 'F':F})

assert set(re.findall(r'(\w+)\s*->\s*(\w+)',example['graph'])) == expected_edges
assert example['regular'] is True and example['task'] == 'entailment'
for bits,count in counts.items():
    assert sum(w for r,w in rows() if (r['E'],r['M'],r['A']) == bits) == F(count,260)
for premise in example['premises'].splitlines():
    assert evaluate(premise), premise
assert evaluate(example['conclusion'])
assert len(re.findall(r'\) & \(', example['conclusion'])) + 1 == 8
checks = []
for item in example['evaluations']:
    actual = evaluate(item['expression'])
    assert actual == F(item['value']), (item,actual)
    checks.append({'expression':item['expression'],'value':str(actual)})
assert probability('A | do(M, E)') == probability('A | do(~M, E)') == F(2,3)
assert probability('A | do(M, ~E)') == probability('A | do(~M, ~E)') == F(1,3)
assert probability('A | do(~M, E)') <= probability('A | do(M, E)')
assert probability('A | do(M), E') == F(3,4) != probability('A | do(~M), E') == F(4,5)
report = {'all_eight_supplied_cells_preserved':True,'all_14_mechanism_premises':True,
          'all_eight_conclusion_clauses':True,'regular_positive':True,
          'evaluations':checks,'department_fixed_female_advantage':False,
          'postintervention_department_conditioning_differs_from_fixing':True}
(HERE/'independent-arithmetic.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS: 32 rows, eight supplied cells, 14 positive mechanism premises, eight conclusion clauses, '
      + str(len(checks)) + ' evaluations and the conditioning/fixing distinction.')
