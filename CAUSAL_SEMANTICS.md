# Causal semantics and verification

The first causal extension decides satisfiability of observational and hard
interventional probability constraints in a specified acyclic graph of observed
Boolean variables. A causal interpretation assumes an independent private
disturbance for each node. Missing edges restrict mechanisms; present edges are
permitted influences and need not have a nonzero effect. No faithfulness
assumption is imposed.

This is Pearl's Markovian setting. The relevant intervention semantics and
truncated factorization appear in [*Causality*, Chapter 3,
Section 3.2](https://web.cs.ucla.edu/~kaoru/CAUSALITY-REPRINTED-W-CORRECTIONS-2013/causality-ch3-june2013.pdf).
The implementation does not yet produce do-calculus rule derivations or implement
ID/IDC identification algorithms. Those algorithms address a further problem,
described by [Shpitser and Pearl
(2008)](https://jmlr.org/papers/volume9/shpitser08a/shpitser08a.pdf).

## Shared mechanisms

Let the graph have Boolean nodes `X_1, ..., X_n`. For each node `X_i` and each
Boolean assignment `p` to its parents, introduce a real parameter

```
q_i(p) = probability that X_i = 1 when its parent assignment is p.
```

Require `0 <= q_i(p) <= 1`. The probability of `X_i=0` under that parent
assignment is `1-q_i(p)`. The parameter exists even when that parent assignment
has observational probability zero. In that case `q_i(p)` denotes a mechanism
value, rather than an observational conditional probability.

For a complete assignment `x`, put

```
k_i(x) = q_i(x_parents)       if x_i=1,
         1-q_i(x_parents)     if x_i=0.
```

The observational probability of `x` is `product_i k_i(x)`. For a simultaneous
hard intervention assigning a set `I` of nodes to values `a`, use

```
P^I(x) = 0                                 if x_I differs from a,
         product over i outside I of k_i(x) otherwise.
```

Every regime uses the same parameters for the retained mechanisms. Intervention
order is immaterial. If all nodes are intervened on, the empty product is `1`,
giving a point mass at the imposed assignment.

All row masses are nonnegative. Their sum is `1`: sum first over a terminal
nonintervened node in the graph after removing incoming edges to the intervened
nodes. Its two mechanism values sum to `q_i(p)+(1-q_i(p))=1`, and that terminal
node occurs in no other retained factor. Repeat this elimination. Intervened
nodes have only their imposed value in the support. The final product is `1`.
Thus no additional normalization equation is needed.

## What the parameterization represents

The parameterization covers exactly the observational and intervention
distributions of Boolean acyclic structural causal models with independent
private disturbances and mechanisms restricted by the supplied graph. This
statement concerns the model class, independently of whether Z3 finishes a
particular search.

To see that every parameter assignment yields such a model, for each node `i`
and each parent assignment `p` create a Boolean random bit `U_i,p` with
probability `q_i(p)` of being `1`. Choose these bits independently, and let the
private disturbance `U_i` be the finite tuple of its bits. Define

```
f_i(p, U_i) = U_i,p.
```

The disturbances of distinct nodes are independent. The acyclic structural
equations `X_i=f_i(X_parents,U_i)` have a unique solution for every disturbance
assignment, by evaluation in topological order. Since `U_i` is independent of
the disturbances determining its parents, its output probability at each parent
assignment is the stipulated `q_i(p)`. Replacing intervened equations by
constants leaves the remaining equations and disturbance distributions
unchanged, producing the products above in every requested regime.

Conversely, take a Boolean acyclic structural model with independent private
disturbances. Define `q_i(p)=P(f_i(p,U_i)=1)` for each parent assignment, including
assignments absent from its observational support. Topological evaluation and
disturbance independence give the same observational product and every truncated
intervention product. Hence each such structural model supplies a parameter
assignment represented by the compiler.

The private tuple construction is one possible structural realization. The
parameterization does not determine how potential outcomes under different
parent assignments are jointly coupled. Cross-world counterfactual probabilities
are outside the current language. Shared hidden causes, correlated private
disturbances, cycles, non-Boolean variables, stochastic interventions, and
interventions on arbitrary propositions are also outside this version.

## Conditioning and regularity

For Boolean events `A,B`, ordinary or interventional conditioning means

```
P^I(A | B) = P^I(A & B) / P^I(B), provided P^I(B)>0.
```

If the conditioning event has probability zero, the conditional is undefined.
The compiler preserves PrSAT's handling of definedness: an atomic comparison,
or its explicit negation, must have defined arithmetic terms to hold. A
disjunction may still hold through its other, defined branch. This applies to
ordinary arithmetic division as well as conditional probabilities. The witness
display reports an undefined query separately.

The **regular** option requires `0<q_i(p)<1` for every node and parent
assignment. It gives positive probability to every observational row. Hard
interventions nevertheless force incompatible rows to zero; these structural
zeros are allowed under regularity. In the nonregular setting, observationally
unseen parent configurations keep their own mechanism parameters, which an
intervention can reveal.

## Exact regression witnesses

`src/causal_solver.spec.ts` checks consequences against independently derived
examples, using the real Z3 solver. In particular, take `Z -> X; Z -> Y` and

```
P(Z)=1/2,
P(X|Z)=3/4, P(X|~Z)=1/4,
P(Y|Z)=1,   P(Y|~Z)=0.
```

Then `Y=Z` almost surely. We have `P(X)=3/8+1/8=1/2` and
`P(X & Y)=3/8`, so `P(Y|X)=3/4`. Intervention on `X` removes its mechanism and
leaves `Z,Y` unchanged, giving `P(Y|do(X=1))=1/2`. The tests verify both exact
values in a satisfying model.

A collider example uses independent fair `X,Y` and `Z=X v Y` in
`X -> Z; Y -> Z`. Since `P(Z)=3/4`, `P(X & Y & Z)=1/4`, and
`P(X & Z)=1/2`, conditioning gives `P(X & Y|Z)=1/3` and `P(X|Z)=2/3`.
This guards against incorrectly imposing root independence after conditioning
on a collider.

Other regressions check shared mechanisms, effects on ancestors, mediator
intervention, simultaneous assignments, evidence within an intervention regime,
zero-probability conditioning, regularity, absent parent configurations,
normalization, chain independence, exact decimal arithmetic, and exact witnesses
whose numerators exceed JavaScript's safe integer range. The exact evaluator
returns solver numeral strings without passing them through JavaScript numbers.

Run the focused solver checks with

```sh
npx vitest --run src/causal_solver.spec.ts
```

SAT supplies a model within the stated class. UNSAT rules out such a model for
the supported input. A timeout or `unknown` does not establish either result.
For entailment, use the Phase 3 decision interface described in
DECISION_SEMANTICS.md. It checks premise consistency, then searches for failure
of the already interpreted conclusion. This includes required undefined terms.
Explicit source negation alone can exclude those cases and is not a general
substitute for that countermodel search. When all required terms are defined,
the familiar assumptions-plus-negated-conclusion test applies.

The current implementation bounds the graph at six nodes and the document at
64 probability occurrences, and bounds input and expanded SMT expressions.
These are implementation resource limits, not mathematical restrictions of the
parameterization.
