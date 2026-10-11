# DoSAT 1.0 development tools

Main compiler: TypeScript7.0.2. Node26.11.1 is pinned by .nvmrc. Package manager:
npm12.2.0. Application/build/test packages are pinned to current releases in
package.json and package-lock.json. The deployed browser engine is Z3 5.1.0
from z3-solver5.2.0; native Z3 is a separate optional audit executable.

Install through npm12, for example `npx --yes npm@12.2.0 ci`. The root postinstall
script uses that same npm CLI to install the independently locked tools/lint
package. Typed ESLint currently needs TypeScript's older compiler API, so that
private tool uses6.0.3 while the actual project compiles with7.0.2. No lint rule
was weakened. Run npm run lint, npm run build and npm test as usual.

On this Mac, npm12 is preserved separately under
~/.local/share/dosat-toolchain/npm-12.2.0/node_modules/.bin. Use that prefix for
release commands. Homebrew's bundled npm11 remains untouched. Latest nativeZ3
is /opt/homebrew/bin/z3 (5.1.0); old /usr/local/bin/z3 (4.16.0) is retained.
Reproduction records distinguish earlier native4.16 checks from later5.1 checks.

TypeScript7 requires an explicit callback return type in one inherited numeric
division evaluator. This is a type-only compatibility change; the function body
and runtime behavior are unchanged. Separate lint installation is intentional:
TypeScript7 does not expose the compiler API used by the current typed-lint tool.
Both compiler checking and typed lint pass, with the original rules enabled.
