import { readFileSync } from 'node:fs';
import { runSmokePackage } from './smoke-package-lib.mjs';
const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const subpaths = Object.keys(manifest.exports).filter((p) => p !== '.' && p !== './package.json');
runSmokePackage({
    examples: ['basic-terminal-session.ts', 'branching-feedback-session.ts'],
    runtimeChecks: subpaths.map((subpath) => ({
        subpath,
        exports:
            {
                './session': [
                    'createInitialTreeSpecSession',
                    'serializeTreeSpecSession',
                    'restoreTreeSpecSession',
                ],
                './errors': ['TreeSpecRuntimeError'],
                './wire': ['parseTreeSpecRuntime'],
            }[subpath] ?? [],
    })),
    typecheckSubpaths: subpaths,
});
