import { runSmokePackage } from './smoke-package-lib.mjs';

runSmokePackage({
    examples: ['basic-terminal-session.ts', 'branching-feedback-session.ts'],
    runtimeChecks: [
        {
            subpath: '.',
            exports: [
                'createInitialTreeSpecSession',
                'TreeSpecRuntimeError',
                'parseTreeSpecRuntime',
                'serializeTreeSpecSession',
                'restoreTreeSpecSession',
            ],
        },
    ],
    typecheckSubpaths: ['.'],
});
