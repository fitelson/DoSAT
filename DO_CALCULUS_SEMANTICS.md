# Checking individual do-calculus steps

Phase 2 checks one proposed application of a do-calculus rule against a supplied
causal graph. Its output includes the two probability expressions, graph
surgery, d-separation condition, and a graph certificate. The probability model
class remains the one described in `CAUSAL_SEMANTICS.md`: acyclic graphs of
observed Boolean variables with independent private disturbances and shared
mechanisms.

The input specifies four pairwise disjoint groups `X,Y,Z,W`, each through Boolean
assignments such as `X=1, M=0`. The outcome group `Y` and the group `Z` to be
inserted, deleted, or exchanged must be nonempty. The fixed intervention group
`X` and retained observation group `W` may be empty. A group assignment denotes
the conjunction of its literals; for example, `Y=1, M=0` denotes `Y & ~M`.
Assignment values determine the displayed equality, while the graphical test
depends on group membership.

## The three rule conditions

Write `G_bar(X)` for removal of incoming arrows to `X`, and `G_underline(Z)`
for removal of outgoing arrows from `Z`. The rules implemented are those of
[Pearl, *Causality*, Theorem 3.4.1, pp. 85–86](https://web.cs.ucla.edu/~kaoru/CAUSALITY-REPRINTED-W-CORRECTIONS-2013/causality-ch3-june2013.pdf).
Each row requires d-separation of `Y` and `Z`, conditional on `X union W`, in
the graph in the last column.

| Rule | Certified equality | Graph used |
|---|---|---|
| 1: observation insertion/deletion | `P(y | do(x), z, w) = P(y | do(x), w)` | `G_bar(X)` |
| 2: action/observation exchange | `P(y | do(x), do(z), w) = P(y | do(x), z, w)` | `G_bar(X),underline(Z)` |
| 3: action insertion/deletion | `P(y | do(x), do(z), w) = P(y | do(x), w)` | `G_bar(X),bar(Z(W))` |

For Rule 3, `Z(W)` consists of the `Z` nodes outside the inclusive ancestry of
`W` **in `G_bar(X)`**. Compute that ancestry after the `X` surgery and before
the further `Z(W)` surgery. Only those eligible `Z` nodes have their incoming
arrows removed.

The general justification for these sufficient conditions is Pearl's theorem.
The checker reports whether its chosen condition holds. A failed condition
leaves the proposed equality uncertified; particular mechanism values may
still make that equality true.

## Definedness

An equality between conditional probabilities is asserted only where both
sides are defined. With the ordinary ratio semantics of Phase 1, this requires
positive evidence mass in each side's regime. The result lists those evidence
conditions explicitly. For example, Rule 2 requires

```
P(w | do(x), do(z)) > 0,
P(z & w | do(x)) > 0,
```

with an empty evidence conjunction having probability `1`. Removing observation
or exchanging it for an intervention can change the relevant conditioning
regime, so both requirements matter.

Graphical applicability itself does not depend on the numerical model or its
support. If a conditional probability is undefined in a compatible model, the
graphical certificate does not assign it a value. The optional causal
counterexample problem uses the original graph and the inequality between the
two displayed expressions. Phase 1's definedness guards restrict a satisfying
counterexample to models in which both sides are defined. UNSAT for that
problem therefore rules out a defined counterexample in the stated model
class, subject to the solver returning a settled result.

## D-separation and its certificate

The implementation uses separation in an ancestral moral graph. Restrict the
directed graph to the inclusive ancestors of the two endpoint groups and the
conditioning group; connect the parents of each retained child; forget edge
directions; remove conditioned nodes; and test undirected connectivity.
This criterion is equivalent to d-separation by
[Lauritzen, *Causal inference from graphical models*, Proposition 4,
pp. 12–13](https://people.csail.mit.edu/tdanford/discovering-causal-graphs-papers/lauritzen-causal-inference-graphical-models.pdf).

The certificate records the retained ancestral nodes, moral edges, conditioned
nodes, and remaining edges. A failed separation test also supplies a connecting
path in that remaining moral graph. Such a path can contain an edge introduced
when connecting co-parents. It is a certificate of undirected connectivity in
the graph used by the criterion.

Restricting to ancestors before moralization is essential. For a collider
`A -> C <- B`, conditioning on neither `C` nor a descendant leaves `C` outside
the ancestral graph for endpoints `A,B`. Its parents are therefore not joined.
If `C` or a descendant is conditioned on, `C` enters the ancestral graph and its
co-parent edge permits connectivity after removal of the conditioned node.

## Independent verification

`src/do_calculus_audit.spec.ts` supplies an independent d-separation oracle.
It enumerates simple paths in the original graph with edge directions ignored.
An internal collider permits an active path exactly when that collider or a
directed descendant is conditioned on. Each internal noncollider blocks the
path when conditioned on. Directed reachability is computed through child
links independently of the implementation's ancestry helper. The oracle uses
no moralization or implementation graph helper. These are the path conditions
in [Pearl, *Causality*, Definition 1.2.3](https://web.cs.ucla.edu/~kaoru/CAUSALITY-REPRINTED-W-CORRECTIONS-2013/causality-ch1-june2013.pdf).

We enumerate every DAG on four named nodes consistent with a fixed topological
order. Its six potential forward edges give `2^6=64` graphs. For d-separation,
assign each node to the left endpoint group, right endpoint group, conditioning
group, or unused group. Requiring both endpoint groups to be nonempty leaves

```
4^4 - 2*3^4 + 2^4 = 110 assignments per graph,
64*110 = 7,040 comparisons.
```

The same complete enumeration is repeated with indexed variable names and a
reversed, nontopological storage order, for another 7,040 comparisons. Six-node
examples check collider activation by descendants and blocking by observed
noncolliders.

For rule surgery, assign each node to `X,Y,Z,W`, or unused. Requiring nonempty
`Y,Z` leaves

```
5^4 - 2*4^4 + 3^4 = 194 assignments per graph,
64*194 = 12,416 comparisons for each rule.
```

Independent directed-edge filtering constructs each manipulated graph. For
Rule 3, independent forward reachability tests whether each `Z` node reaches
`W` after the incoming-`X` cut. We compare eligible nodes, manipulated graphs,
and applicability against the checker. All three rules are covered, giving
37,248 rule comparisons and 51,328 exhaustive graphical comparisons in total.
These checks cover the stated four-node enumeration; the general graphical
criterion is justified by the cited theorem.

Five generated, certified equalities are also checked with the actual Phase 1
compiler and real Z3. Their inequality has no model under strictly positive
mechanisms. This includes all three rules, the Rule 3 ancestry-after-`X` case,
and a conjunction of multiple outcomes with both positive and negative
literals. Strict mechanism probabilities guarantee positive evidence in these
disjoint assignments' regimes, so these UNSAT results cannot come solely from
undefined conditioning.

Another numerical regression uses `Z -> Y` with a fair root `Z` and both
`Y` mechanism probabilities equal to `1/2`. Rule 3's graphical condition fails
because `Z -> Y` remains, but both `P(Y | do(Z=1))` and `P(Y)` equal `1/2` in
this regular model. The test establishes that lack of a certificate does not
make the displayed equality false in every compatible model.

### Why Rule 3 retains ancestors of W

Consider `A -> Z; A -> Y; Z -> W`. Let `A` be a fair Boolean root and set
`Z=A`, `Y=A`, and `W=Z`. Observationally, only the following rows have mass:

| A | Z | Y | W | Probability |
|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 1/2 |
| 1 | 1 | 1 | 1 | 1/2 |

Under `do(Z=1)`, the rows instead are:

| A | Z | Y | W | Probability |
|---|---|---|---|---|
| 0 | 1 | 0 | 1 | 1/2 |
| 1 | 1 | 1 | 1 | 1/2 |

Since observational `W=1` entails `A=1` and `Y=1`, we have `P(Y | W)=1`.
Under `do(Z=1)`, the evidence `W=1` has probability `1`; the root `A` remains
fair and `Y=A`, giving `P(Y | do(Z=1), W)=1/2`. Both conditional probabilities
are defined and differ. The test verifies this satisfying counterexample in
Z3 and verifies that the Rule 3 checker does not certify the equality.

Here `Z` is an ancestor of `W`, so `Z(W)` is empty. Its incoming arrow from
`A` must be retained in the graphical test. The path `Z <- A -> Y` remains
active when conditioning on `W`. Removing that incoming arrow indiscriminately
would yield an invalid certificate. ▪

### Why ancestry follows the X surgery

Consider `U -> Z; U -> Y; Z -> X; X -> W` (all listed nodes, including U,
are observed), with fixed `X=1`, outcome `Y=1`,
action `Z=1`, and evidence `W=1`. The incoming-`X` surgery removes `Z -> X`.
After that removal, `Z` no longer reaches `W`, so it belongs to `Z(W)`.
Removing `U -> Z` then isolates `Z` from `Y`; the Rule 3 condition holds.
The graphical regression checks those two cuts explicitly, and a separate Z3
test verifies the certified equality for arbitrary strictly positive
mechanisms. Computing ancestry in the original graph would incorrectly exclude
`Z` and miss this applicable step.

Run the independent audit with

```sh
npx vitest --run src/do_calculus_audit.spec.ts
```

## Current scope

The checker handles a single user-specified rule instance in either direction
through its displayed equality. It does not search for a sequence of rules or
implement ID/IDC identification. Latent confounding, mixed graphs, correlated
disturbances, cross-world counterfactuals, cycles, non-Boolean variables,
stochastic interventions, and interventions on arbitrary propositions remain
outside this phase. The existing six-node resource limit still applies.
