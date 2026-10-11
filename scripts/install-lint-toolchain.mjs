import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Install through npm so the invoking npm CLI is available.');
const folder = fileURLToPath(new URL('../tools/lint/', import.meta.url));
const result = spawnSync(process.execPath, [npmCli, '--prefix', folder, 'ci', '--ignore-scripts'], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
