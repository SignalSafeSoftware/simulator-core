import { describe, expect, it } from "vitest";
import { END_NODE_ID, type TreeSpecWire } from "@signalsafe/tree-spec";
import {
    createInitialTreeSpecSession,
    dispatchTreeSpecChoice,
    emptyScoreDelta,
    mergeScoreDelta,
    resolveFeedbackForTransition,
} from "../src/index";

const multiStepWire = (): TreeSpecWire => ({
    start_node: "a",
    nodes: {
        a: {
            type: "prompt",
            prompt: "Start",
            choices: [{ id: "go", label: "Go" }],
        },
        b: {
            type: "prompt",
            prompt: "Finish",
            choices: [{ id: "end", label: "End" }],
        },
    },
    transitions: [
        {
            from: ["a", "go"],
            to: "b",
            delta: { total: 2, awareness: 1 },
        },
        {
            from: ["b", "end"],
            to: END_NODE_ID,
            outcome: "at_risk",
            delta: { total: 3 },
        },
    ],
});

describe("session lifecycle", () => {
    it("walks continue then END with cumulative score and history", () => {
        let session = createInitialTreeSpecSession(multiStepWire());
        expect(session.currentNodeId).toBe("a");
        expect(session.history).toEqual([]);

        const step1 = dispatchTreeSpecChoice(session, "a", "go");
        expect(step1.status).toBe("continue");
        if (step1.status !== "continue") return;

        expect(step1.state.currentNodeId).toBe("b");
        expect(step1.state.history).toEqual([{ nodeId: "a", choiceId: "go" }]);
        expect(step1.state.cumulativeScore.total).toBe(2);
        expect(step1.state.cumulativeScore.awareness).toBe(1);

        const step2 = dispatchTreeSpecChoice(step1.state, "b", "end");
        expect(step2.status).toBe("ended");
        if (step2.status !== "ended") return;

        expect(step2.outcome).toBe("at_risk");
        expect(step2.state.currentNodeId).toBe(END_NODE_ID);
        expect(step2.state.history).toEqual([
            { nodeId: "a", choiceId: "go" },
            { nodeId: "b", choiceId: "end" },
        ]);
        expect(step2.state.cumulativeScore.total).toBe(5);
    });

    it("does not mutate the prior session object on dispatch", () => {
        const session = createInitialTreeSpecSession(multiStepWire());
        const step1 = dispatchTreeSpecChoice(session, "a", "go");
        if (step1.status !== "continue") return;

        expect(session.currentNodeId).toBe("a");
        expect(session.history).toEqual([]);

        const step2 = dispatchTreeSpecChoice(step1.state, "b", "end");
        if (step2.status !== "ended") return;

        expect(session.currentNodeId).toBe("a");
        expect(session.history).toEqual([]);
        expect(step1.state.history).toEqual([{ nodeId: "a", choiceId: "go" }]);
    });

    it("prefers transition feedback over choice feedback when both exist", () => {
        const wire: TreeSpecWire = {
            start_node: "a",
            nodes: {
                a: {
                    choices: [
                        {
                            id: "c1",
                            label: "Go",
                            feedback: { key: "choice", title: "Choice wins?" },
                        },
                    ],
                },
            },
            transitions: [
                {
                    from: ["a", "c1"],
                    to: END_NODE_ID,
                    outcome: "safe",
                    feedback: { key: "transition", title: "Transition wins" },
                },
            ],
        };

        const session = createInitialTreeSpecSession(wire);
        const result = dispatchTreeSpecChoice(session, "a", "c1");
        expect(result.status).toBe("ended");
        if (result.status !== "ended") return;

        expect(result.feedback).toEqual({
            key: "transition",
            title: "Transition wins",
        });
        expect(
            resolveFeedbackForTransition(wire, "a", "c1", {
                key: "transition",
                title: "Transition wins",
            }),
        ).toEqual({ key: "transition", title: "Transition wins" });
    });
});

describe("score delta helpers", () => {
    it("returns zeroed deltas from emptyScoreDelta", () => {
        expect(emptyScoreDelta()).toEqual({
            total: 0,
            awareness: 0,
            verification: 0,
            impulse_control: 0,
            damage_containment: 0,
        });
    });

    it("treats NaN as zero when merging and ignores non-record deltas", () => {
        const base = emptyScoreDelta();
        expect(
            mergeScoreDelta(base, {
                total: Number.NaN,
                awareness: 3,
            }),
        ).toEqual({
            ...base,
            awareness: 3,
        });
        expect(mergeScoreDelta(base, "not-a-record")).toEqual(base);
    });
});
