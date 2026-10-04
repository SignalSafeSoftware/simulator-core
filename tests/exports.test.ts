import { TreeSpecRuntimeError } from '@signalsafe/simulator-core/errors';
import { emptyScoreDelta } from '@signalsafe/simulator-core/delta';
import { mergeScoreDelta } from '@signalsafe/simulator-core/delta';
import { findTransitionForChoice } from '@signalsafe/simulator-core/wire';
import { getWireChoices } from '@signalsafe/simulator-core/wire';
import { parseTreeSpecRuntime } from '@signalsafe/simulator-core/wire';
import { getTreeSpecNodeView } from '@signalsafe/simulator-core/nodeView';
import { resolveFeedbackForTransition } from '@signalsafe/simulator-core/nodeView';
import { createInitialTreeSpecSession } from '@signalsafe/simulator-core/session';
import { dispatchTreeSpecChoice } from '@signalsafe/simulator-core/session';
import { treeSpecRuntimeIssues } from '@signalsafe/simulator-core/session';
const publicValues = {
    TreeSpecRuntimeError,
    emptyScoreDelta,
    mergeScoreDelta,
    findTransitionForChoice,
    getWireChoices,
    parseTreeSpecRuntime,
    getTreeSpecNodeView,
    resolveFeedbackForTransition,
    createInitialTreeSpecSession,
    dispatchTreeSpecChoice,
    treeSpecRuntimeIssues,
};
import { describe, expect, it } from 'vitest';

const EXPECTED_FUNCTIONS = [
    'emptyScoreDelta',
    'mergeScoreDelta',
    'findTransitionForChoice',
    'getWireChoices',
    'parseTreeSpecRuntime',
    'getTreeSpecNodeView',
    'resolveFeedbackForTransition',
    'createInitialTreeSpecSession',
    'dispatchTreeSpecChoice',
    'treeSpecRuntimeIssues',
] as const;

describe('public owner modules', () => {
    it('exposes documented runtime functions', () => {
        for (const name of EXPECTED_FUNCTIONS) {
            expect(typeof publicValues[name]).toBe('function');
        }
    });

    it('exposes TreeSpecRuntimeError', () => {
        expect(typeof TreeSpecRuntimeError).toBe('function');
    });
});
