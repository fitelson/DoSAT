# Exact reconstruction of the admissions table

This is a constructed Boolean specialization of Pearl's graph, with the direct
M->A arrow absent. It supplies aptitude mechanisms as additional assumptions;
their values are not identified from the three-event table.

M and U are independent fair Boolean roots. Marginalizing career objectives Z
in the supplied M,U->Z and M,Z->E mechanisms gives:

| M | U | Pr(E given M,U) |
|---|---|---|
| false | false | 1/10 |
| false | true | 87/130 |
| true | false | 43/130 |
| true | true | 9/10 |

Thus Pr(E given M)=8/13 and Pr(E given not-M)=5/13. In a population of
260, the four E/M counts are respectively 80,50,50,80.

The admission mechanism can be written as

    Pr(A given E=e,U=u) = (17 + 37e + 40u)/111,

where e and u are 0 or 1. Admission has no M or Z argument.
Department selection produces the aptitude posterior probabilities:

| Department | Pr(U given male, department) | Pr(U given female, department) |
|---|---|---|
| easy | 117/160 | 87/100 |
| hard | 13/100 | 43/160 |

Substitution into the admission mechanism gives 3/4 versus 4/5 in the easy
department, and 1/5 versus 1/4 in the hard department. Multiplying by the
four department/gender counts gives exactly the eight supplied counts
60,20,40,10,10,40,20,60. Male admission overall is 7/13, female 6/13.
Pr(A)=Pr(E)=1/2.

Under do(E=e), aptitude stays fair. Therefore

    Pr(A given do(E=e)) = (37 + 37e)/111 = (1+e)/3.

Jointly intervening on M as well cannot change aptitude or the admission
mechanism. Both gender assignments give 2/3 for fixed easy department and 1/3
for fixed hard department. This is the zero controlled direct gender effect.

Without fixing E, gender still changes its choice probabilities:

    Pr(A given do(M)) = 1/3 + (1/3)(8/13) = 7/13,
    Pr(A given do(not-M)) = 1/3 + (1/3)(5/13) = 6/13.

M remains a fair root under either department intervention or admission
intervention. No incoming edge to M, and no outgoing edge from A, is required.

Conditioning on E after do(M) selects aptitude profiles again, so it retains
the observed rates 3/4 versus 4/5. Jointly fixing E does not perform that
selection. This is why the preset's zero-effect claim uses do(M,E), not
do(M) followed by observational conditioning on E.

All 14 mechanism probabilities lie strictly between zero and one. Each
observational parent configuration consequently has positive support.
Each mechanism premise uniquely specifies its corresponding CPT parameter,
so all asserted observational and intervention probabilities hold in every
model satisfying the expanded graph and premises, not just in the enumerated
witness. audit_pearl.py independently verifies all rows and displayed claims
using Fraction arithmetic.
