# Fixed-model evaluation and single-page scope

The new Evaluate model panel is available only when a SAT model or exact countermodel has been returned. It evaluates a new expression in that one model; it does not establish entailment, search for another model or assume an observational constraint identifies an effect. The model class remains the approved finite observed Boolean DAG with independent private disturbances.

## Data and algorithm

The evaluator captures a defensive frozen copy of the complete shared conditional kernel (all node/parent assignments) and the returned user real-variable assignments. Model tokens are instance branded. Internal CPT parameter spelling is not semantic: lookup uses the observed node and its ordered parent values. This permits new probability terms and intervention regimes not queried in the original problem, including interventions into observationally absent configurations. Unknown user real variables are rejected rather than given an arbitrary completion.

The authoritative causal parser reads one active real expression or constraint. It preserves exact literal spelling and validates graph variables/interventions. The approved causal compiler supplies probability ASTs for each regime. Those ASTs use the captured kernel; intervened nodes are fixed and their own kernel factors omitted. Existing parameters remain shared across regimes. The evaluator substitutes exact kernel/user-variable constants and simplifies the resulting ground arithmetic or Boolean expression with Z3. It never checks satisfiability or creates/retains a native Model. No original premise is asserted during evaluation.

Exact strings are checked against a bounded grammar of rationals and algebraic root objects before a short-lived parser Solver is used to obtain the numeric AST. That Solver is released in finally, without check()/model(). A single lazy context is reused by the service. The binding manages contexts, expression and AST-vector lifetimes through its finalizers; there is no unsupported explicit-dispose claim. No conversion of returned numbers to floating point is made. Algebraic results retain exact Z3 notation; rationals are formatted losslessly.

## Definedness

Real expressions and required probability terms are undefined at zero evidence mass, zero arithmetic denominators or negative powers of zero. They return an undefined marker, not an invented numeric value. Constraint evaluation uses the compiler's already guarded user constraint. Thus True/False means satisfaction in this model under DoSAT's existing scoped guards, including explicit negation. An unused undefined branch may coexist with a true disjunction; a required undefined term can make a constraint False. Probability term values and undefined markers are listed alongside the Boolean result, and the UI explains this distinction.

## Lifecycle

No new evaluation begins while another is unsettled. New expression edits, model replacement and problem edits abort/suppress older work. Cancellation is cooperative across native simplification boundaries; an in-flight operation is awaited before ownership is released and busy cleared. The UI keeps the main Run disabled during evaluation, including after an original-problem edit has hidden the panel. Original problem edits clear the witness, export and evaluator together. Evaluator edits do not change the original problem/witness/export/verdict. Final acceptance checks the abort signal after numeral extraction too. Native interruption speed is not promised.

## Single public page and DAG preview

Production builds only index.html. The package serves that app directly at https://fitelson.org/DoSAT/ with root runtime assets and isolation/MIME headers. The old /dist/decision.html, /dist/causal.html, /dist/do_calculus.html, /dist/index.html and /dist/ routes redirect to the root. Old source entries are preserved under reference-ui/ and their regression tests use local reference URLs; they are not production entries. A retired model-finder v1 saved problem is imported as the corresponding modern SAT problem, with validation before mutation. Modern DoSAT v1 JSON remains unchanged.

The input graph uses the existing renderer's default-preserving compact option and an 8px conservative crop of node ellipses/edge control hulls. It renders independently of probability syntax only after parse_causal_graph accepts the graph. Cyclic/malformed input clears the old SVG and reports Syntax error: not a DAG plus the reason; size/support limits are labelled separately. Large/long-labelled DAGs remain readable in a named keyboard scroll region. It shows the supplied DAG, not an intervention-modified graph. The parser, causal compiler, decision reduction and decision solver are unchanged from their prior approvals.

Resource bounds remain explicit: six observed nodes; parser/compiler AST/input limits; exact-value 32768 characters, 4096 tokens, depth64; snapshot2000000 characters and4096 free variables; bounded root-polynomial degree/expansion. Unsupported snapshots/expressions give errors, never approximate values or verdicts. Browser QA is Chromium-only.
