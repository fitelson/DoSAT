# Archived exponent and large-literal probes

These historical exploratory files were moved out of src/**/*.spec.ts, preserving
all probe bodies. Relative imports now point to ../../src/. The two exponent
files log observations without checking their stated behavior; they are not
routine regressions or promises of variable-exponent support in DoSAT.
The meaningful large-literal serialization assertions from tmp_repro_claim now
live in src/pr_sat.spec.ts under a descriptive test name, without console noise.
Git history retains the exact pre-move files. No mathematical regression was removed.
