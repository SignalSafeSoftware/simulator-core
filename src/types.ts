import type { TerminalOutcome, TreeSpecWire } from '@signalsafe/tree-spec';

/** Score delta applied when taking a transition (matches backend Delta shape). */
export type ScoreDelta = {
    total: number;
    awareness: number;
    verification: number;
    impulse_control: number;
    damage_containment: number;
};

/** Optional micro-feedback on a transition or choice (matches API feedback payload). */
export type MicroFeedback = {
    key?: string;
    title?: string;
    body?: string;
    takeaway?: string;
    red_flags?: string[];
};

/** One selectable choice on a node. */
export type NodeChoice = { id: string; label: string };

/** One traversed step in a session. */
export type SessionHistoryEntry = { nodeId: string; choiceId: string };

/** Node shape aligned with training API `node` objects. */
export type NodeView = {
    id: string;
    type: string;
    prompt: string;
    choices: NodeChoice[];
    render_hints: Record<string, unknown>;
};

/** Immutable session state for a walk through a TreeSpec. */
export type TreeSpecSessionState = {
    spec: TreeSpecWire;
    currentNodeId: string;
    cumulativeScore: ScoreDelta;
    history: SessionHistoryEntry[];
};

/** Versioned, graph-only session snapshot. Derived state is intentionally omitted. */
export type TreeSpecSessionSnapshot = {
    readonly version: 1;
    readonly history: readonly SessionHistoryEntry[];
};

export type DispatchContinue = {
    status: 'continue';
    state: TreeSpecSessionState;
    node: NodeView;
    appliedDelta: ScoreDelta;
    feedback?: MicroFeedback | null;
};

export type DispatchEnded = {
    status: 'ended';
    state: TreeSpecSessionState;
    outcome: TerminalOutcome;
    appliedDelta: ScoreDelta;
    feedback?: MicroFeedback | null;
};

export type DispatchResult = DispatchContinue | DispatchEnded;
