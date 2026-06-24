import type { TerminalOutcome, TreeSpecWire } from "@signalsafe/tree-spec";

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

/** Node shape aligned with training API `node` objects. */
export type NodeView = {
    id: string;
    type: string;
    prompt: string;
    choices: Array<{ id: string; label: string }>;
    render_hints: Record<string, unknown>;
};

/** Immutable session state for a walk through a TreeSpec. */
export type TreeSpecSessionState = {
    spec: TreeSpecWire;
    currentNodeId: string;
    cumulativeScore: ScoreDelta;
    history: Array<{ nodeId: string; choiceId: string }>;
};

export type DispatchContinue = {
    status: "continue";
    state: TreeSpecSessionState;
    node: NodeView;
    appliedDelta: ScoreDelta;
    feedback?: MicroFeedback | null;
};

export type DispatchEnded = {
    status: "ended";
    state: TreeSpecSessionState;
    outcome: TerminalOutcome;
    appliedDelta: ScoreDelta;
    feedback?: MicroFeedback | null;
};

export type DispatchResult = DispatchContinue | DispatchEnded;
