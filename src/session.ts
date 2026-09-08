import {
    END_NODE_ID,
    type TreeSpecIssue,
    type TreeSpecWire,
} from "@signalsafe/tree-spec";
import { TreeSpecRuntimeError } from "./errors.js";
import { emptyScoreDelta, mergeScoreDelta } from "./delta.js";
import { expectTerminalOutcome } from "./guards.js";
import { findTransitionForChoice, parseTreeSpecRuntime } from "./wire.js";
import {
    getTreeSpecNodeView,
    resolveFeedbackForTransition,
} from "./nodeView.js";
import type {
    DispatchContinue,
    DispatchEnded,
    DispatchResult,
    TreeSpecSessionSnapshot,
    TreeSpecSessionState,
} from "./types.js";

export function createInitialTreeSpecSession(
    wire: TreeSpecWire,
): TreeSpecSessionState {
    const spec = parseTreeSpecRuntime(wire);
    return {
        spec,
        currentNodeId: spec.start_node,
        cumulativeScore: emptyScoreDelta(),
        history: [],
    };
}

function buildEndedDispatch(
    state: TreeSpecSessionState,
    transition: { outcome?: unknown; delta?: unknown },
    nextHistory: TreeSpecSessionState["history"],
    nextScore: TreeSpecSessionState["cumulativeScore"],
    appliedDelta: DispatchEnded["appliedDelta"],
    feedback: DispatchEnded["feedback"],
): DispatchEnded {
    const outcome = expectTerminalOutcome(transition.outcome);
    const endedState: TreeSpecSessionState = {
        spec: state.spec,
        currentNodeId: END_NODE_ID,
        cumulativeScore: nextScore,
        history: nextHistory,
    };
    return {
        status: "ended",
        state: endedState,
        outcome,
        appliedDelta,
        feedback,
    };
}

function buildContinueDispatch(
    state: TreeSpecSessionState,
    nextNodeId: string,
    nextHistory: TreeSpecSessionState["history"],
    nextScore: TreeSpecSessionState["cumulativeScore"],
    appliedDelta: DispatchContinue["appliedDelta"],
    feedback: DispatchContinue["feedback"],
): DispatchContinue {
    const continued: TreeSpecSessionState = {
        spec: state.spec,
        currentNodeId: nextNodeId,
        cumulativeScore: nextScore,
        history: nextHistory,
    };
    return {
        status: "continue",
        state: continued,
        node: getTreeSpecNodeView(continued.spec, nextNodeId),
        appliedDelta,
        feedback,
    };
}

/**
 * Apply one decision at the current node (same contract as `apply_decision` on the backend: node must match current).
 */
export function dispatchTreeSpecChoice(
    state: TreeSpecSessionState,
    nodeId: string,
    choiceId: string,
): DispatchResult {
    if (state.currentNodeId !== nodeId) {
        throw new TreeSpecRuntimeError(
            `Decision state mismatch: expected current node '${state.currentNodeId}', got '${nodeId}'.`,
        );
    }

    const transition = findTransitionForChoice(state.spec, nodeId, choiceId);
    const appliedDelta = mergeScoreDelta(
        emptyScoreDelta(),
        transition.delta,
    );
    const feedback = resolveFeedbackForTransition(
        state.spec,
        nodeId,
        choiceId,
        transition.feedback,
    );

    const nextHistory = [...state.history, { nodeId, choiceId }];
    const nextScore = mergeScoreDelta(state.cumulativeScore, transition.delta);

    const to = String(transition.to ?? "");
    if (to === END_NODE_ID) {
        return buildEndedDispatch(
            state,
            transition,
            nextHistory,
            nextScore,
            appliedDelta,
            feedback,
        );
    }

    return buildContinueDispatch(
        state,
        to,
        nextHistory,
        nextScore,
        appliedDelta,
        feedback,
    );
}

/** Serialize only the choices needed to replay a graph session; derived state is not trusted. */
export function serializeTreeSpecSession(
    state: TreeSpecSessionState,
): TreeSpecSessionSnapshot {
    return {
        version: 1,
        history: state.history.map((entry) => ({ ...entry })),
    };
}

function parseSessionSnapshot(raw: unknown): TreeSpecSessionSnapshot {
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
        throw new TreeSpecRuntimeError("TreeSpec session snapshot must be an object.");
    }
    const record = raw as Record<string, unknown>;
    if (record.version !== 1) {
        throw new TreeSpecRuntimeError("Unsupported TreeSpec session snapshot version.");
    }
    if (!Array.isArray(record.history)) {
        throw new TreeSpecRuntimeError("TreeSpec session snapshot history must be an array.");
    }
    const history: Array<{ nodeId: string; choiceId: string }> = [];
    for (const entry of record.history) {
        if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
            throw new TreeSpecRuntimeError("TreeSpec session history entries must be objects.");
        }
        const item = entry as Record<string, unknown>;
        if (typeof item.nodeId !== "string" || item.nodeId.trim() === "" || typeof item.choiceId !== "string" || item.choiceId.trim() === "") {
            throw new TreeSpecRuntimeError("TreeSpec session history entries require nodeId and choiceId.");
        }
        history.push({ nodeId: item.nodeId, choiceId: item.choiceId });
    }
    return { version: 1, history };
}

/** Restore a session by replaying every recorded choice through the graph dispatcher. */
export function restoreTreeSpecSession(
    wire: TreeSpecWire,
    rawSnapshot: unknown,
): TreeSpecSessionState {
    const snapshot = parseSessionSnapshot(rawSnapshot);
    let state = createInitialTreeSpecSession(wire);
    for (const entry of snapshot.history) {
        state = dispatchTreeSpecChoice(state, entry.nodeId, entry.choiceId).state;
    }
    return state;
}

/** Structural/runtime issues for editor UI (merge with lintTreeSpecWire). */
export function treeSpecRuntimeIssues(spec: TreeSpecWire): TreeSpecIssue[] {
    try {
        parseTreeSpecRuntime(spec);
        return [];
    } catch (e) {
        const msg = e instanceof TreeSpecRuntimeError ? e.message : String(e);
        return [{ severity: "error", message: msg }];
    }
}
