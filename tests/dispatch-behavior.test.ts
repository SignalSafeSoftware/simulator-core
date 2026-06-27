import { describe, expect, it } from "vitest";
import {
    END_NODE_ID,
    TERMINAL_OUTCOME,
    type TreeSpecWire,
} from "@signalsafe/tree-spec";
import {
    createInitialTreeSpecSession,
    dispatchTreeSpecChoice,
    emptyScoreDelta,
    mergeScoreDelta,
    treeSpecRuntimeIssues,
} from "../src/index";
import { TreeSpecRuntimeError } from "../src/errors";

function singleChoiceWire(
    overrides: Partial<TreeSpecWire["transitions"][number]> = {},
): TreeSpecWire {
    return {
        start_node: "a",
        nodes: {
            a: {
                type: "prompt",
                prompt: "Choose",
                choices: [{ id: "c1", label: "Go" }],
            },
        },
        transitions: [
            {
                from: ["a", "c1"],
                to: END_NODE_ID,
                outcome: TERMINAL_OUTCOME.SAFE,
                ...overrides,
            },
        ],
    };
}

describe("dispatchTreeSpecChoice behavior", () => {
    it("rejects stale node ids with a decision state mismatch error", () => {
        const session = createInitialTreeSpecSession(singleChoiceWire());
        expect(() => dispatchTreeSpecChoice(session, "wrong", "c1")).toThrow(
            TreeSpecRuntimeError,
        );
        expect(() => dispatchTreeSpecChoice(session, "wrong", "c1")).toThrow(
            "Decision state mismatch: expected current node 'a', got 'wrong'.",
        );
    });

    it("rejects invalid choices at the current node", () => {
        const session = createInitialTreeSpecSession(singleChoiceWire());
        expect(() => dispatchTreeSpecChoice(session, "a", "missing")).toThrow(
            "Missing transition for (a, missing).",
        );
    });

    it.each([
        TERMINAL_OUTCOME.SAFE,
        TERMINAL_OUTCOME.AT_RISK,
        TERMINAL_OUTCOME.COMPROMISED,
    ] as const)("ends with outcome %s and lands on END", (outcome) => {
        const session = createInitialTreeSpecSession(
            singleChoiceWire({ outcome }),
        );
        const result = dispatchTreeSpecChoice(session, "a", "c1");
        expect(result.status).toBe("ended");
        if (result.status !== "ended") return;
        expect(result.outcome).toBe(outcome);
        expect(result.state.currentNodeId).toBe(END_NODE_ID);
    });

    it("continues with the next node view and preserves immutable history", () => {
        const wire: TreeSpecWire = {
            start_node: "a",
            nodes: {
                a: {
                    type: "prompt",
                    prompt: "Start",
                    choices: [{ id: "go", label: "Go" }],
                },
                b: {
                    type: "info",
                    prompt: "Next step",
                    choices: [{ id: "done", label: "Done" }],
                },
            },
            transitions: [{ from: ["a", "go"], to: "b" }],
        };
        const session = createInitialTreeSpecSession(wire);
        const result = dispatchTreeSpecChoice(session, "a", "go");

        expect(result.status).toBe("continue");
        if (result.status !== "continue") return;

        expect(result.node).toMatchObject({
            id: "b",
            type: "info",
            prompt: "Next step",
        });
        expect(result.state.history).toEqual([{ nodeId: "a", choiceId: "go" }]);
        expect(session.history).toEqual([]);
        expect(session.currentNodeId).toBe("a");
    });

    it("merges finite score deltas and ignores non-finite numbers", () => {
        const base = emptyScoreDelta();
        expect(
            mergeScoreDelta(base, {
                total: Number.POSITIVE_INFINITY,
                awareness: Number.NaN,
                verification: 2,
            }),
        ).toEqual({
            ...base,
            total: Number.POSITIVE_INFINITY,
            verification: 2,
        });

        const session = createInitialTreeSpecSession({
            start_node: "a",
            nodes: {
                a: {
                    choices: [{ id: "c1", label: "Go" }],
                },
            },
            transitions: [
                {
                    from: ["a", "c1"],
                    to: END_NODE_ID,
                    outcome: TERMINAL_OUTCOME.SAFE,
                    delta: { total: 4, impulse_control: Number.NaN },
                },
            ],
        });
        const result = dispatchTreeSpecChoice(session, "a", "c1");
        expect(result.status).toBe("ended");
        if (result.status !== "ended") return;
        expect(result.appliedDelta.total).toBe(4);
        expect(result.appliedDelta.impulse_control).toBe(0);
        expect(result.state.cumulativeScore.total).toBe(4);
    });

    it("ignores unknown transition fields such as lessons_triggered", () => {
        const wire = {
            ...singleChoiceWire(),
            transitions: [
                {
                    from: ["a", "c1"],
                    to: END_NODE_ID,
                    outcome: TERMINAL_OUTCOME.SAFE,
                    lessons_triggered: ["lesson-1"],
                },
            ],
        } as TreeSpecWire;

        const session = createInitialTreeSpecSession(wire);
        const result = dispatchTreeSpecChoice(session, "a", "c1");
        expect(result.status).toBe("ended");
    });

    it("reports malformed wire through treeSpecRuntimeIssues without throwing", () => {
        expect(treeSpecRuntimeIssues(null as unknown as TreeSpecWire)).toEqual([
            {
                severity: "error",
                message: "tree_spec must be a non-null object.",
            },
        ]);
    });
});
