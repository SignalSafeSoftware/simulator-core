import { runSmokePackage } from './smoke-package-lib.mjs';

runSmokePackage({
    runtimeChecks: [
        {
            subpath: '.',
            exports: ['createInitialTreeSpecSession', 'TreeSpecRuntimeError', 'parseTreeSpecRuntime'],
        },
    ],
    typecheckSubpaths: ['.'],
});
