# DoSAT 1.0: causal satisfiability and consequence by real algebra

A Decision Procedure for Do Calculus.

Phase 3 decides whether a finite set of causal probability constraints has a
model and whether every model satisfying those premises also satisfies a
specified conclusion. It uses the causal models already defined in
[CAUSAL_SEMANTICS.md](CAUSAL_SEMANTICS.md). The new work is a division-free
polynomial reduction, a consequence operation that treats undefined conclusions
correctly, and a solver interface that distinguishes settled answers from
resource-limited searches. This is a semantic decision procedure; it does not
search for do-calculus derivations.

## Model class and language

Fix a finite acyclic directed graph `G` whose nodes are observed Boolean
variables. For each node `i` and each assignment `p` to its parents, a mechanism
parameter `q_i(p)` belongs to `[0,1]`. With regularity selected, every parameter
instead belongs to `(0,1)`. The graph restricts which variables a mechanism may
use. An edge permits an influence but does not require one. There is no
faithfulness assumption.

A valuation consists of those parameters and values for the finitely many free
real variables in the input. All observational and hard-intervention queries
use the same mechanisms. Conditioning is the ordinary ratio, defined only when
the evidence has positive mass in that query's regime. This includes evidence
observed after an intervention. Regularity does not make impossible
post-intervention evidence possible.

Boolean intervention literals abbreviate hard assignments: `do(X)` means
`do(X=1)`, and `do(~X)` means `do(X=0)`. A comma-separated list such as
`do(X, ~Z)` means the simultaneous assignment `do(X=1, Z=0)`. Literal and
numeric assignments may be mixed. For example,
`Pr(Y | do(X, Z=0), W)` conditions on `W` after setting `X=1, Z=0`.
Ordinary `Pr(Y | X)` still denotes observational conditioning.
Only declared Boolean-variable literals and numeric 0/1 assignments are
accepted inside `do(...)`; this shorthand does not introduce interventions
on arbitrary propositional formulas. Repeating a variable is rejected even
when the repeated assignments agree. Query displays retain the user's spelling.

Numeric input literals denote exact rationals from their written decimal or
integer spelling. Arithmetic permits addition, subtraction, multiplication,
division, unary minus, and signed integer-literal powers. Free real variables
are unrestricted real values unless the premises restrict them. They are
existential in satisfiability and universally quantified, together with the
mechanisms, in consequence. Input and expansion limits define the currently
accepted implementation fragment; they are not extra mathematical axioms.

The implementation accepts at most eight graph nodes, 64 combined premise and
conclusion lines, 64 probability occurrences, and 50,000 total source
characters. Each constraint line has limits of 4,096 characters, 512 tokens,
and 64 nested parentheses. The inherited causal compiler also bounds input to
20,000 AST nodes and depth 128, and bounds expanded SMT cost to 1,000,000 units.
Integer powers have magnitude at most 1,024. The polynomial reduction adds at
most 20,000 auxiliary variables and emits at most 2,000,000 characters per SMT
problem. Entailment requires one conclusion line; it may be a compound
constraint. Empty premises are permitted.

Shared hidden causes, correlated disturbances, cycles, non-Boolean nodes,
stochastic or propositional interventions, and probabilities connecting
different counterfactual worlds remain outside this language. In particular,
the result concerns the specified observed-variable DAG, rather than every
possible causal model that could generate the observational distribution.

## Why do-calculus is included

For a complete Boolean assignment `v`, write `k_i(v)` for `q_i(v_parents)` when
`v_i=1`, and for `1-q_i(v_parents)` when `v_i=0`. Under the hard intervention
`do(I=a)`, the row mass is zero if `v_I` disagrees with `a`; otherwise it is

```text
P^(I=a)(v) = product over i outside I of k_i(v).
```

These nonnegative masses sum to one by elimination of terminal nonintervened
nodes. The finite private-disturbance construction and its converse in
`CAUSAL_SEMANTICS.md` prove that this parameterization covers exactly the
observational and intervention distributions of the stated structural model
class. Parameters for observationally absent parent configurations remain
mechanism values and can affect an intervention.

This is Pearl's truncated factorization. His do-calculus rules are valid for
these intervention distributions wherever the compared conditional
probabilities are defined. See [Pearl, *Causality*, Section 3.2 and Theorem
3.4.1](https://web.cs.ucla.edu/~kaoru/CAUSALITY-REPRINTED-W-CORRECTIONS-2013/causality-ch3-june2013.pdf).
Consequently the decision procedure includes their semantic consequences
without adding each graphical rule as an axiom or constructing its derivation.
The Phase 2 graphical checker remains useful for explaining a proposed rule
instance. Neither interface claims that an undefined equality is true merely
because its graph satisfies a rule condition.

## Satisfaction and undefined expressions

We retain the existing PrSAT constraint semantics, including its treatment of
compound constraints. This is a two-valued *satisfaction predicate* defined
from partially defined arithmetic; it is not a new three-valued logic.

For an arithmetic term `e`, let `D(e)` mean that each of its evaluated
subterms is defined. A division `n/d` additionally requires `d != 0`; a negative
integer power additionally requires a nonzero base. Nonnegative integer powers
retain the definedness requirements of their base, including at exponent zero.
The convention for a defined base at exponent zero is `e^0=1`, including
`0^0=1`. Arithmetic zero denominators can arise outside probabilities and need
not have a nonnegative sign.

For a constraint `C`, let `D_all(C)` require definedness of every arithmetic
term occurring anywhere within `C`. Let `R(C)` denote its ordinary Boolean
evaluation when those terms are all defined. Define satisfaction `S(C)` by:

| Source constraint | Satisfaction condition |
|---|---|
| Atomic comparison of `e,f` | `D(e) and D(f) and the comparison` |
| Explicit source negation `~C` | `D_all(C) and not R(C)` |
| `C & E` | `S(C) and S(E)` |
| `C v E` | `S(C) or S(E)` |
| `C -> E` | `not S(C) or S(E)` |
| `C <-> E` | `S(C)=S(E)` |

The negation row applies to its whole syntactic scope. When `D_all(C)` holds,
`R(C)=S(C)`, by induction on the connectives, so its equivalent condition is
`D_all(C) and not S(C)`. This equivalence does not permit dropping the
definedness conjunct.

For example, fix `Pr(X)=0`, put `U` for `Pr(Y|X)=1/2`, and put `T` for
`Pr(X)=0`. The following satisfaction values are forced:

| Constraint | Value | Reason |
|---|---|---|
| `U` | false | Its evidence mass is zero. |
| `~U` | false | Explicit negation also requires definedness. |
| `U v T` | true | The defined right branch holds. |
| `U -> T` | true | Its satisfaction antecedent is false. |
| `U <-> ~U` | true | Both satisfaction values are false. |
| `~(U & T)` | false | The negation's entire scope contains an undefined term. |

These examples specify the inherited contract. They are not claims about the
classical truth of an equality whose term has no value.

## Polynomial reduction

First substitute each probability query by its row-mass sum, or by the ratio
of its joint and evidence masses. Apply the satisfaction guards above before
eliminating division. All resulting arithmetic is rational in finitely many
mechanism parameters and free real variables.

The solver compiler inlines addition, subtraction, unary minus and multiplication,
folds constants using exact BigInt rational arithmetic, and structurally shares
identical total quotient definitions. Powers retain bounded repeated-squaring
chains. Large constant powers also use these chains rather than creating huge
numerals. Rational coefficients may use SMT-LIB division of integer constants;
no variable division is sent to either solver stage.

Before lowering, each mass is computed using only ancestors of its event in the
intervened graph, whose intervened nodes have incoming edges removed. Barren
nodes sum to one; fixed mechanism factors are extracted. Conditional masses
cancel common factors only inside the original nonzero-support guard. A child
intervention and descendant evidence are handled by the masses themselves.
Regularity removes guards only for nonempty compatible support. Contradictory
intervention evidence remains undefined.

Guarded fraction normalization combines recognized mass ratios with polynomial
terms, keeping factored numerators. Reduced mass denominators are nonnegative
under the mechanism bounds and positive wherever their original guards hold.
Thus cancellation, common-denominator arithmetic and cross-multiplication
preserve comparisons there. Arbitrary arithmetic quotients retain total
quotient definitions. Normalization falls back to that representation if its
denominator exceeds eight factors, or its comparison exceeds 64,000 characters
or degree 64. These are optimization budgets, not new semantic restrictions.
The denominator cap alone does not bound numerator complexity. Saturated
DAG-cost checks enforce the full SMT character budget before serialization;
source and inherited expansion limits continue to apply.

All these transformations affect solver expressions only. Complete original
mechanisms, distribution rows, queries and guarded constraints remain available
for witness inspection and exact model evaluation. The same polynomial encoding
is submitted to QF_NRA and its NLSat fallback.

For a division with translated numerator `n`, denominator `d`, and fresh result
variable `r`, add the polynomial relation

```text
d = 0 or r*d = n.
```

This relation is deliberately total. If `d=0`, it leaves `r` arbitrary. If
`d!=0`, it forces the unique value `n/d`, without an inequality sign change
assumption. The source satisfaction predicate supplies the nonzero-denominator
requirements where needed. Global division definitions must not assert those
requirements themselves: doing so would eliminate a model of a disjunction
whose satisfied branch is defined and whose other branch is undefined.

This also handles nested divisions. An undefined inner division may give its
auxiliary variable an arbitrary real value, and later auxiliary operations
remain total. Its source definedness guard is still false. Thus no arbitrary
choice can turn an undefined atomic comparison into a satisfied one.

Let `q` stand for all mechanisms and free real parameters, and let `r` stand
for all fresh arithmetic auxiliaries. Write `A(q,r)` for their defining
relations and `B(q)` for the mechanism bounds. Write `F_C(q,r)` for the
translated satisfaction formula of a source constraint `C`. All these formulas
are quantifier-free Boolean combinations of polynomial comparisons with exact
rational coefficients. Declared auxiliaries are existentially searched by the
SMT solver; they are not part of the causal model.

**Lemma 1 (arithmetic auxiliaries).** For every valuation `q` satisfying the mechanism bounds `B`, there is
an extension `r` satisfying `A(q,r)`. In every such extension, each defined
source term has its actual real value in its translated arithmetic variable.

**Proof.** Order the arithmetic operations so that operands precede the
operation that uses them. Such an order exists because the input expression
graph is acyclic. Inline polynomial terms already have their operation values; assign any
shared multiplication-chain alias its operation value. For a division, assign `n/d` when the already
assigned denominator is nonzero and assign an arbitrary real value otherwise.
This satisfies its stated relation in both cases. Nonnegative powers have
finite multiplication chains; negative powers add a reciprocal. The same
construction therefore supplies an extension for the entire graph.

Now assume that a source term is defined. Its operands are defined. Induction
in the same order gives their actual values in every extension satisfying the
relations. Inline polynomial operations and chain equations preserve the actual values. For
a defined division the denominator is nonzero, so `r*d=n` has precisely its
ordinary quotient as solution. The multiplication chains and reciprocal give
the actual integer power in the power cases. This proves both assertions. ▪

**Lemma 2 (satisfaction projection).** For every source constraint `C`, every
fixed valuation `q` satisfying `B`, and every extension `r` satisfying `A(q,r)`,

```text
F_C(q,r) holds if and only if S_q(C) holds.
```

**Proof.** We use structural induction on `C`. For an atomic comparison with
an undefined term, choose an innermost undefined division or negative power.
Its operands are defined, so Lemma 1 fixes its denominator or base to its actual
value, zero. The corresponding nonzero guard conjunct is therefore false in
every auxiliary extension, regardless of the arbitrary values assigned to
other undefined subterms. If both compared terms are defined, Lemma 1 gives
their actual values and each required nonzero guard holds, so the guarded
polynomial comparison has exactly the source satisfaction value. For explicit
source negation, the same innermost-undefined argument makes its whole-scope
guard false if a term in its scope is undefined. Otherwise
Lemma 1 fixes every arithmetic value and the raw Boolean scope has its source
value; its negation therefore has the stipulated satisfaction value. For
conjunction and disjunction, use the induction hypotheses on both subformulas.
For implication, take the ordinary Boolean complement of the antecedent's
guarded satisfaction and disjoin the consequent's guarded satisfaction. For
biconditional, compare those same two satisfaction values. These are exactly
the displayed definitions. The satisfaction value is consequently independent
of the arbitrary auxiliary choices at undefined divisions. ▪

**Proposition 3 (satisfiability).** A finite premise set `Gamma` has a model in
the stated causal class if and only if the following polynomial formula is
satisfiable:

```text
B(q) and A(q,r) and conjunction over C in Gamma of F_C(q,r).
```

**Proof.** Suppose that a causal model satisfies `Gamma`. Its mechanisms and
free real values give `q` satisfying `B`. By Lemma 1 choose an extension `r`
satisfying `A`. By Lemma 2 each `F_C` holds, so the polynomial formula is
satisfiable. Conversely, suppose that the polynomial formula has a real
assignment. Its projected mechanism values satisfy `B` and define a causal
model by the private-disturbance construction. Lemma 2 shows that this model
satisfies every premise. ▪

## Consequence and countermodels

We define `Gamma` to entail `C` when every compatible valuation satisfying
each premise also satisfies `C`. In particular, an undefined atomic conclusion
is not satisfied and is therefore a countermodel to entailment. A conclusion
that only fails definedness is not silently discarded from the search.

**Proposition 4 (consequence).** Entailment holds if and only if the following
countermodel formula is unsatisfiable:

```text
B(q) and A(q,r) and conjunction over E in Gamma of F_E(q,r)
     and not F_C(q,r).
```

The final `not` is ordinary Boolean complementation of the **already guarded
satisfaction formula**. It is not PrSAT's explicit source-negation operator.

**Proof.** A satisfying assignment of the displayed formula projects, by
Proposition 3 and Lemma 2, to a compatible causal valuation that satisfies
every premise and does not satisfy the conclusion. It is therefore a
countermodel. Conversely, a countermodel supplies values `q` satisfying the
bounds, all premise satisfaction predicates, and the complement of the
conclusion satisfaction predicate. Lemmas 1 and 2 extend these values to a
real assignment satisfying the displayed formula. Thus the countermodel
formula has a model exactly when entailment fails. ▪

As a decisive example, the premise `Pr(X)=0` does not entail
`Pr(Y|X)=1/2`. Every premise model makes the conclusion undefined. Appending
the source constraint `~(Pr(Y|X)=1/2)` produces UNSAT because that negation
itself requires positive evidence. Calling that UNSAT result an entailment
would be incorrect. The consequence compiler instead complements
`Pr(X)!=0 and Pr(Y & X)/Pr(X)=1/2`, allowing the zero-evidence countermodels.

Entailment performs one countermodel query, with no preliminary premise
consistency check. An unsatisfiable countermodel formula gives **entailed**;
a satisfying formula gives **not entailed** with an exact witness. Inconsistent
premises therefore entail every conclusion vacuously, under the same result.
An ENTAILS result does not assert that the premises have a model. Satisfiability
checks the active premise constraints directly and can be selected separately.

## Decidability and practical result meanings

The reduction produces a finite quantifier-free polynomial real-arithmetic
formula. Such satisfiability is decidable. Explicit NLSat supplies the complete
polynomial real-arithmetic search used for that guarantee. The decision
procedure is described in [Jovanović and de Moura,
*Solving Non-Linear Arithmetic*](https://dddejan.github.io/papers/jovanovic-ijcar2012.pdf);
the Z3 authors identify NLSat as a decision procedure for polynomial
quantifier-free real arithmetic in [*Programming Z3*, Section
6.5](https://theory.stanford.edu/~nikolaj/programmingz3.html#sec-nlsat).

The application uses a hybrid for its single task query: the active constraints
for satisfiability, or their conjunction with failure of the guarded conclusion
for entailment. It first
tries PrSAT's `Solver('QF_NRA')` configuration with a requested finite budget
of 60 seconds. The optional programmatic `fast_timeout_ms` setting can select
a different positive budget. This is a performance attempt, not the source of
the completeness guarantee: Z3 5.1's QF_NRA portfolio contains an uncapped SMT
strategy before its final unrestricted NLSat member. The latter's completeness
does not establish termination of that whole preceding portfolio. See the
[tagged QF_NRA implementation](https://github.com/Z3Prover/z3/blob/z3-5.1.0/src/tactic/smtlogics/qfnra_tactic.cpp).

A definitive result obtained within the fast attempt's local budget may settle
that stage. If it is UNKNOWN, or its local budget expires, the application
waits for the native operation to settle, clears its operation-owned timers and
interrupt retries, and releases that attempt's solver/model handles. Only then,
if the whole run remains active, it starts a fresh
`Tactic('qfnra-nlsat').solver()` on the same polynomial formula. A late result
from an expired fast attempt cannot settle the stage. In unlimited mode the
explicit NLSat fallback has no requested solver timeout. An UNKNOWN from that
complete-engine attempt remains an honest unresolved result.
If local cap interruption makes the native check reject, the settled expired
attempt follows the same fallback path. Other errors remain unresolved errors.

For an active unlimited run, assuming each budgeted native attempt settles and
sufficient resources remain, each required stage either settles on the fast
attempt or reaches the explicit complete NLSat engine. The mathematical
decidability and completeness claim concerns this finite polynomial problem
and NLSat algorithm. It does not assert a uniform practical time or memory
bound or that the application can forcibly terminate a pending native call.

A positive whole-run limit governs which verdicts the application accepts.
The fast attempt receives the smaller of its local budget and the remaining
whole-run time. A fallback receives only the residual whole-run time; it does
not receive a fresh deadline. This deadline also covers witness extraction.
User cancellation or whole-run expiry prevents fallback, even if the stopped
fast attempt later returns UNKNOWN or a decisive answer. A user stop gives
CANCELLED; whole-run expiry gives UNKNOWN. Timers keep retrying interruption
only for their own still-pending operation, and the wrapper stays occupied
until settlement and safe release. Thus a time limit is not a bound on physical
return or cleanup time: a QF_NRA portfolio can continue handling cancellation
through remaining strategies after the limit. The recheck measured roughly
2.8–2.9 seconds of post-interrupt delay on its six-node browser example and
6.6–6.7 seconds on a larger admitted input. Those measurements are instance
specific. Explicit NLSat removes the observed portfolio cascade, but does not
provide a universal physical cancellation bound either.

Finite time limits, cancellation, memory exhaustion, solver errors and UNKNOWN
responses must not be presented as SAT, UNSAT or an entailment decision. An
unlimited setting removes the requested whole-run timeout; it does not provide
unlimited computer resources.

The exported SMT problem uses `(check-sat-using qfnra-nlsat)` as a reproducible
complete reference route. It encodes the same graph theory and guarded
satisfaction/countermodel formulas as the application. It deliberately omits
the application's budgeted QF_NRA performance attempt and its lifecycle wrapper;
export timings therefore need not match in-app timings. The export contains
one check for the selected task, with no preliminary consistency check or reset.

Witnesses preserve exact Z3 numeral strings, including rational numbers and
algebraic roots. They show one compatible model or countermodel, not uniqueness
of the mechanism values. Undefined input queries are marked undefined and do
not receive their arbitrary auxiliary values as probabilistic answers.

Saved-problem loading validates the known fields and recompiles the problem.
Additional fields may be present; stored answers are ignored and the loaded
problem must be decided again.

Identifying an observational expression for a causal quantity is a further
problem. ID/IDC, latent-variable model classes, and explanations by derivation
remain outside Phase 3.

## Independent verification

`src/causal_decision_audit.spec.ts` checks the Phase 3 reduction against an
independent exact-rational semantic oracle. That oracle realizes private
disturbances explicitly, evaluates structural equations in topological order
under each intervention, sums the resulting event masses, and evaluates the
source satisfaction convention without calling the compiler's arithmetic or
definedness helpers. Its finite grids include deterministic mechanisms,
positive mechanisms, absent observational parent configurations, impossible
post-intervention evidence, signed arithmetic denominators, and negative
powers. The tests compare both satisfiability projection and the Boolean
complement used for consequence.

The current suite contains 601 pinned checks: 378 source satisfaction cases,
162 consequence-complement cases, 50 signed arithmetic/power cases, and 11
targeted causal or exact-coefficient cases. The main grid has the 27 mechanism
assignments for `X -> Y` with all three CPT values chosen independently from
`0, 1/2, 1`. It therefore includes boundary zeros and ones as well as positive
mechanisms. Six additional unpinned consequence checks quantify over real
parameters, including an algebraic premise `a^2=2, a>0` and impossible evidence
under regular mechanisms.

All 607 polynomial problems also have an opt-in native-Z3 replay, preserving
its complete input and result report. See
`reviews/PHASE3_INDEPENDENT_AUDIT.md` for commands, versions, hashes and counts.
These bounded regression grids test the implementation; Lemmas 1–2 and
Propositions 3–4 supply the general reduction argument. No exhaustive numerical
test over all six-node graphs or all real parameter valuations is claimed.


## Returned-model validation

After a SAT or countermodel result, the native model is evaluated against the
original mechanism bounds and all original guarded premises. A countermodel
must also falsify the original guarded conclusion. Failure returns ERROR, not a
verified verdict. Undefined terms in an unused disjunct remain allowed by the
original satisfaction predicate. Validation participates in the existing
cancellation/deadline ownership and waits for native settlement before reuse.
It is not a consistency preflight and does not certify UNSAT.
