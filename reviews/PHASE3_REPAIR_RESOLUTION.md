# Phase 3 repairs and requested updates

Initial default-model consensus: FAIL for F1 lost interruption and F2 missing
negation-scope regression tests. Mathematics approved. Original snapshot is
preserved as phase3_initial_snapshot.json; no first-review reports were edited.

F1: operation-scoped100ms interrupt retries for stopped pending check/evaluation,
with captured session+operation identities, settle-before-release and timer/listener
cleanup. A queued old callback cannot reach later operations or runs. The
countermodel boundary yields one microtask before allocating/loading native work,
so queued cancel/edit actions are delivered before that work starts. Fake tests
cover dropped first interrupts for both check and witness extraction; native
microtask and already-running cancellation, cleanup and reuse pass. 40 solver
tests pass. Real Chromium boundary cancel/edit plus reuse pass. Debug records
show the first retry-only repair removed the lost interrupt but could encounter
about2.86s of early QF_NRA preprocessing latency. The boundary yield avoids that
unnecessary native work for queued UI cancellation. Timing bounds are concrete
regression checks,not universal physical guarantees.

F2: two explicitly negated implication/biconditional formulas added to the27-CPT
grid. Source cases378,pinned601,total607. Both mutants now fail; identity9/9
passes. Native Z3 5.1 replay607/607 matches. Old4.16 reports/probes preserved.
Lemma2 now includes the innermost-undefined guard argument (N1).

User's exact-job benchmark: same WASM5.1,input,parameters,serial runs:
plainSolver29.147s;Solver('QF_NRA')28.947s;explicitqfnra-nlsat69.849s.
All returned premiseSAT/counterexampleUNSAT. One-job measurements,not a claim
of universal speed superiority. Application now uses the PrSAT-style specialized
QF_NRA construction; polynomial decision completeness remains. Independent audit
uses explicit qfnra-nlsat as a separate route. The SMT export's set-logicQF_NRA
and plaincheck-sat match the specialized selection.

User requested latestZ3,npm,and all tools INCLUDING TypeScript. Browserengine
5.1.0 current;wrapper5.2.0 current. Native5.1 installed alongsideold4.16. Node
26.11.1 current;npm12.2 installedisolated forrelease,Homebrew11preserved.
MainTypeScript7.0.2 current. Latesttypedlint requiresoldercompilerAPI,so tools/lint
is a separate lockedpackage using privateTS6.0.3; alloriginalrules remain active.
Rootpostinstall reproducibly installs it using invokingnpm. BothTypeScript7
checking andtypedlintpass. Oneexplicitreturn-typeannotation inpr_sat.ts handles
newgenericinference;functionbody/runtime unchanged. Allother oldcoremath/parser/
causal/legacy-solver source remains unchanged. Latestdirectpackages pinned; app
andlint dependency audits report0vulnerabilities. SeeTOOLS.md andtoolchainaudit.

Naming: DoSAT1.0;subtitle A Decision Procedure for Do Calculus. Thread renamed.
Newlandingpreparedforfitelson.org/DoSAT/ andlaunchesdist/decision.html. Fresh
candidatepackage21files,manifesthashes verified; olderpackages/stalebundles retained.
No remotepublication yet. Requiredscopeconsensusrecheck pending.
