# Explicit preset conclusions and the E/M/A Simpson table

Baseline: 55ff015823aec68673d1480c25f771b2abfae2f7.
All seven presets now have active, saved entailment conclusions.

The first five retain their previously reviewed graphs, all premises, Regular
settings, literature links and exact evaluation recipes. Only the task and
conclusions change. The first five should ENTAIL their conclusions:

- Berkson: zero causal effect, with a negative selected association. The two
  differences are 0 and -1/2.
- M-bias: zero causal and marginal differences; conditioning on Z creates a
  negative difference (-1/24).
- Instrument adjustment: causal difference < observational difference <
  Z-standardized difference (1/5 < 8/25 < 31/80). The conclusion fixes the eight
  individual risks: 3/5, 2/5, 33/50, 17/50, 51/80, 1/4, 3/4, 29/80. Both
  Z-stratum differences are 31/80, hence so is their standardization. Both biases are positive, so
  this ordering also establishes amplification of their absolute magnitude.
- Treatment-confounder feedback: observational joint-treatment contrast > true
  intervention contrast > population-L-standardized contrast
  (17/25 > 1/2 > 1/5).
- Front-door: the conclusion fixes the intervention probability (11/20) and
  the observational probability (7/10). The full front-door expression is
  retained as an independently checked optional model-evaluation recipe.
  U remains an explicit Boolean node; this is not general latent identification.

The earlier numbers were already audited. Entailment here also follows from
uniqueness of the compatible kernels: every node's entire parent-conditioned
mechanism and every independent root probability is specified, with positive
parent contexts. Berkson's positive independent roots make every X/Y context
reachable, and its deterministic selection premise fixes S in all four contexts.
Thus truncated factorization fixes all intervention probabilities in the claims,
not merely in one convenient witness. The real browser tests check these actual
compound claims and independently inspect the numeric values in SAT mode.

Positivity failure is unchanged, and should still DOES NOT ENTAIL its claim.

## User-supplied Simpson table

The input cells are (E,M): A/total = 60/80; (E,~M): 40/50;
(~E,M): 10/50; (~E,~M): 20/80. Marginals are A|M=70/130,
A|~M=60/130, A|E=100/130, A|~E=30/130 and A=130/260.
The preset keeps these unsimplified ratios for recognition.

The reversal concerns M and A, stratified by E. The assumed DAG is
E -> M; E -> A; M -> A, with Pr(E)=130/260, Pr(M|E)=80/130 and
Pr(M|~E)=50/130. In each E stratum, M lowers the A rate by 1/20.
The observational rates are 7/13 > 6/13, but under this assumed DAG the
intervention rates are 19/40 < 21/40. The conclusion conjoins those inequalities.
The guide explicitly says that the counts alone do not determine the DAG.

Independent Fraction enumeration reconstructs all eight joint cell counts and
all five displayed marginal/conditional rates plus the two intervention rates.
The actual browser regression checks all seven rates in a single entailment
conclusion. The old Simpson numbers remain in historical regression fixtures.

## Model inspection

ENTAILS returns a proof verdict without a witness. The guide therefore describes
the listed numbers as supporting exact values and instructs users to copy the
expressions, choose Satisfiability, then Find Model for optional inspection.
Changing task retains the inactive conclusion draft; Save/Load preserve the
whole problem. The first-five save/load regressions require an active, visible
nonempty conclusion and preserve it through the real JSON round trip.

## Resource repair before review

The first candidate put weighted adjustment expressions directly in the
entailment conclusions. The instrument comparison caused a browser WASM
out-of-memory error, and the front-door symbolic formula exceeded the 60-second
browser assertion. A first reduction to instrument difference equalities still
exceeded that assertion. These inputs/results are preserved in initial_formulas/
and reduced-formulas.ts.txt, with the logs.

The final instrument conclusion uses eight individual risk equalities, avoiding
products of conditional denominators. Together these establish exactly the
intended contrast ordering and bias amplification. The front-door conclusion
uses the two intervention/observational risk equalities; the full formula's
numeric recovery remains a model-evaluation check, not part of the formal
entailment conclusion. Targeted final browser checks pass in 15.7 and 1.0 seconds.
No backend change or runtime-cause diagnosis is claimed.
