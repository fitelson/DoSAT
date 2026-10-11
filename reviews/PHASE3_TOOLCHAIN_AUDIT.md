# DoSAT release toolchain audit — October 11, 2026

Official Z3 latest release:5.1.0. Browser/WASMengine already5.1.0 via current
npm z3-solver5.2.0. Its copied JS/WASMassets will be version/hash verified at
release and again in the live browser after deployment.

Native `/opt/homebrew/bin/z3` is now5.1.0. Old `/usr/local/bin/z3`4.16.0 remains
preserved. Earlier native replay provenance remains4.16.0,not retroactively
upgraded. Repaired native replay will use the latest explicit binary.

Node v26.11.1 is current latest release (current branch,not LTS).
Global/Homebrew-bundled npm11.20.0 is preserved. Latest npm12.2.0 is installed
separately at ~/.local/share/dosat-toolchain/npm-12.2.0; release commands use
its node_modules/.bin prefix. This avoids replacing a Homebrew-owned npm.
Node/npm are build/test tools; the deployed site serves a browser solver.

Registry audit reports newer Vite8.3.4,Vitest5.0.3,Playwright1.64.0,
jsdom30.1.2,ESLint10.12.0,typescript-eslint8.71.1 and updatedtypepackages.
Source dependency updates wait until the currently frozen initial debate ends,
then are tested in the repaired candidate and included in its consensus recheck.

Latest TypeScript7.0.2 conflicts with the latest typescript-eslint peer range
>=4.8.4 <6.1.0. Branden explicitly requested the latest TypeScript. The main project compiler is
now7.0.2. Typed lint runs in a separate tools/lint package using the supported
privateTypeScript6.0.3 API; all original lint rules remain enabled. Rootnpm
postinstall reproducibly installs that separate locked lint environment.
Registry package versions and runtime versions are distinct.

Sources: https://github.com/Z3Prover/z3/releases/tag/z3-5.1.0 ;
https://nodejs.org/en/about/previous-releases ; live npm registry metadata.
No old files,checkpoints or review artifacts were deleted.

Verification: main tsc --version reports7.0.2; main typecheck and fullESLint
pass. Both lint parser and ts-api-utils resolve privateTypeScript6.0.3. One
explicit return-type annotation in the inherited numeric division evaluator
fixes TypeScript7 generic inference, with no runtime change. Direct app/build
package audit reports no outdated packages; dependency audit reports0vulnerabilities.
A fresh updated Chromium runtime is installed with browserGC disabled, retaining
older browser binaries. Rootnpm11.20 remains preserved; projectcommands use12.2.
