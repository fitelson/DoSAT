"""Independent Fraction enumeration of the presets' specified Boolean kernels.

Uses no application parser, compiler, evaluator, or solver. The exported inputs
are checked against separately specified mechanisms, followed by exact risks.
"""
from fractions import Fraction as F
from itertools import product
from pathlib import Path
import json
import re

HERE = Path(__file__).resolve().parent
presets = json.loads((HERE / 'presets.json').read_text())


def model(parents, mechanisms):
    return parents, mechanisms


def rows(m, intervention=None):
    intervention = intervention or {}
    parents, mechanisms = m
    output = []
    for values in product((False, True), repeat=len(parents)):
        row = dict(zip(parents, values))
        mass = F(1)
        for node in parents:
            if node in intervention:
                if row[node] != intervention[node]:
                    mass = F(0)
                    break
            else:
                q = mechanisms[node](row)
                mass *= q if row[node] else 1-q
        output.append((row, mass))
    assert sum((mass for _, mass in output), F(0)) == 1
    return output


def conjunction(text):
    parts = [part.strip() for part in text.split('&')]
    return lambda row: all(row[part.lstrip('~')] != part.startswith('~') for part in parts)


def probability(m, event, evidence='', intervention=None):
    selected = [(row, mass) for row, mass in rows(m, intervention) if not evidence or conjunction(evidence)(row)]
    denominator = sum((mass for _, mass in selected), F(0))
    assert denominator > 0
    return sum((mass for row, mass in selected if conjunction(event)(row)), F(0))/denominator


def risk(m, evidence='', intervention=None):
    return probability(m, 'Y', evidence, intervention)


def contrast(m, variable):
    return risk(m, intervention={variable: True}) - risk(m, intervention={variable: False})


def standardized(m, treatment, adjustment):
    return sum(((risk(m, f'{treatment} & '+(adjustment if z else '~'+adjustment)) -
                 risk(m, f'~{treatment} & '+(adjustment if z else '~'+adjustment))) *
                probability(m, adjustment if z else '~'+adjustment) for z in (False, True)), F(0))


berkson = model({'X': [], 'Y': [], 'S': ['X', 'Y']}, {
    'X': lambda r: F(1, 2), 'Y': lambda r: F(1, 2), 'S': lambda r: F(r['X'] or r['Y']),
})
m_bias = model({'U': [], 'V': [], 'X': ['U'], 'Y': ['V'], 'Z': ['U', 'V']}, {
    'U': lambda r: F(1, 2), 'V': lambda r: F(1, 2),
    'X': lambda r: F(1, 4)+F(1, 2)*r['U'], 'Y': lambda r: F(1, 4)+F(1, 2)*r['V'],
    'Z': lambda r: F(1, 10)+F(2, 5)*(r['U']+r['V']),
})
instrument = model({'Z': [], 'U': [], 'X': ['Z', 'U'], 'Y': ['U', 'X']}, {
    'Z': lambda r: F(1, 2), 'U': lambda r: F(1, 2),
    'X': lambda r: F(1, 10)+F(1, 5)*r['U']+F(3, 5)*r['Z'],
    'Y': lambda r: F(1, 10)+F(1, 5)*r['X']+F(3, 5)*r['U'],
})
feedback = model({'A': [], 'L': ['A'], 'B': ['L'], 'Y': ['L', 'B']}, {
    'A': lambda r: F(1, 2), 'L': lambda r: F(1, 4)+F(1, 2)*r['A'],
    'B': lambda r: F(1, 4)+F(1, 2)*r['L'],
    'Y': lambda r: F(1, 10)+F(1, 5)*r['B']+F(3, 5)*r['L'],
})
frontdoor = model({'U': [], 'X': ['U'], 'M': ['X'], 'Y': ['U', 'M']}, {
    'U': lambda r: F(1, 2), 'X': lambda r: F(1, 4)+F(1, 2)*r['U'],
    'M': lambda r: F(1, 4)+F(1, 2)*r['X'],
    'Y': lambda r: F(1, 10)+F(1, 5)*r['M']+F(3, 5)*r['U'],
})


def unseen(value):
    return model({'X': [], 'Y': ['X']}, {'X': lambda r: F(0), 'Y': lambda r: F(value) if r['X'] else F(1, 2)})


simpson = model({'Z': [], 'X': ['Z'], 'Y': ['Z', 'X']}, {
    'Z': lambda r: F(1, 2), 'X': lambda r: F(9, 10) if r['Z'] else F(1, 10),
    'Y': lambda r: (F(3, 5) if r['X'] else F(1, 2)) if r['Z'] else (F(9, 10) if r['X'] else F(4, 5)),
})
models = [berkson, m_bias, instrument, feedback, frontdoor, unseen(0), simpson]

for example, m in zip(presets, models):
    actual_edges = set(re.findall(r'(\w+)\s*->\s*(\w+)', example['graph']))
    assert actual_edges == {(parent, child) for child, parents in m[0].items() for parent in parents}
    if example['regular']:
        assert all(0 < mechanism(row) < 1 for row, _ in rows(m) for mechanism in m[1].values())
    for line in example['premises'].splitlines():
        if '<->' in line:
            assert probability(m, 'S') == F(3, 4)
            assert all(row['S'] == (row['X'] or row['Y']) for row, mass in rows(m) if mass)
            continue
        match = re.fullmatch(r'Pr\((\w+)(?:\s*\|\s*([^)]*))?\)\s*=\s*([0-9]+(?:/[0-9]+)?)', line)
        assert match, line
        node, evidence, value = match.groups()
        assert probability(m, node, evidence or '') == F(value), line

frontdoor_value = sum((probability(frontdoor, 'M' if z else '~M', 'X') *
    sum((risk(frontdoor, ('M' if z else '~M')+' & '+('X' if x else '~X')) *
         probability(frontdoor, 'X' if x else '~X') for x in (False, True)), F(0))
    for z in (False, True)), F(0))
feedback_adjusted = sum(((risk(feedback, 'A & B & '+('L' if z else '~L')) -
    risk(feedback, '~A & ~B & '+('L' if z else '~L'))) *
    probability(feedback, 'L' if z else '~L') for z in (False, True)), F(0))
values = [
    [contrast(berkson, 'X'), risk(berkson, 'X & S')-risk(berkson, '~X & S')],
    [contrast(m_bias, 'X'), risk(m_bias, 'X')-risk(m_bias, '~X'), risk(m_bias, 'X & Z')-risk(m_bias, '~X & Z')],
    [contrast(instrument, 'X'), risk(instrument, 'X')-risk(instrument, '~X'), standardized(instrument, 'X', 'Z')],
    [risk(feedback, intervention={'A': True, 'B': True})-risk(feedback, intervention={'A': False, 'B': False}),
     risk(feedback, 'A & B')-risk(feedback, '~A & ~B'), feedback_adjusted],
    [risk(frontdoor, intervention={'X': True}), risk(frontdoor, 'X'), frontdoor_value],
    [risk(unseen(0), intervention={'X': True}) == F(1, 2)],
    [],
]
assert rows(unseen(0)) == rows(unseen(1))
assert risk(unseen(0), intervention={'X': True}) == 0
assert risk(unseen(1), intervention={'X': True}) == 1
assert risk(simpson, 'X') == F(63, 100) and risk(simpson, '~X') == F(77, 100)
assert risk(simpson, intervention={'X': True}) == F(3, 4) and risk(simpson, intervention={'X': False}) == F(13, 20)

report = []
for example, actual in zip(presets, values):
    actual = [value if isinstance(value, bool) else str(value) for value in actual]
    expected = [item['value'] for item in example['evaluations']]
    assert actual == expected, (example['name'], actual, expected)
    report.append({'example': example['name'], 'mechanisms_and_premises': 'PASS', 'exact_evaluation_values': actual})
(HERE / 'independent-arithmetic.json').write_text(json.dumps(report, indent=2)+'\n')
print('Independent exact enumeration: seven kernels, all premises, all 15 evaluation values, positivity countermodels and retained Simpson rates PASS.')
