/**
 * @packageDocumentation
 * Headless TreeSpec session runtime: parse, step, scores, terminal outcomes.
 * Depends on `@signalsafe/tree-spec` for the wire format only.
 */

export { TreeSpecRuntimeError } from "./errors.js";

export type {
    DispatchContinue,
    DispatchEnded,
    DispatchResult,
    MicroFeedback,
    NodeView,
    ScoreDelta,
    TreeSpecSessionState,
} from "./types.js";

export { emptyScoreDelta, mergeScoreDelta } from "./delta.js";

export {
    findTransitionForChoice,
    getWireChoices,
    parseTreeSpecRuntime,
} from "./wire.js";

export {
    getTreeSpecNodeView,
    resolveFeedbackForTransition,
} from "./nodeView.js";

export {
    createInitialTreeSpecSession,
    dispatchTreeSpecChoice,
    treeSpecRuntimeIssues,
} from "./session.js";
