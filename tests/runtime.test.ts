import { describe, expect, it } from "vitest";
import {
    END_NODE_ID,
    LEGACY_END_NODE_ID,
    type TreeSpecWire,
} from "@signalsafe/tree-spec";
import {
    createInitialTreeSpecSession,
    dispatchTreeSpecChoice,
    findTransitionForChoice,
    getTreeSpecNodeView,
    getWireChoices,
    mergeScoreDelta,
    parseTreeSpecRuntime,
    resolveFeedbackForTransition,
    treeSpecRuntimeIssues,
} from "../src/index";
import { TreeSpecRuntimeError } from "../src/errors";

const minimalWire = (): TreeSpecWire => ({
    start_node: "a",
    nodes: {
        a: {
            type: "prompt",
            prompt: "Hi",
            choices: [{ id: "c1", label: "Go" }],
        },
    },
    transitions: [{ from: ["a", "c1"], to: END_NODE_ID, outcome: "safe" }],
});

describe("parseTreeSpecRuntime", () => {
    it("accepts a valid wire", () => {
        const w = minimalWire();
        expect(parseTreeSpecRuntime(w).start_node).toBe("a");
    });

    it("rejects blank start nodes, non-object nodes, and non-array transitions", () => {
        expect(() =>
            parseTreeSpecRuntime({
                ...minimalWire(),
                start_node: "   ",
            }),
        ).toThrow("tree_spec.start_node must be a non-empty string.");

        expect(() =>
            parseTreeSpecRuntime({
                ...minimalWire(),
                nodes: [] as unknown as TreeSpecWire["nodes"],
            }),
        ).toThrow("tree_spec.nodes must be an object.");

        expect(() =>
            parseTreeSpecRuntime({
                ...minimalWire(),
                transitions: {} as unknown as TreeSpecWire["transitions"],
            }),
        ).toThrow("tree_spec.transitions must be an array.");
    });

    it("rejects missing transition target node", () => {
        const bad: TreeSpecWire = {
            start_node: "a",
            nodes: {
                a: { choices: [{ id: "c1", label: "x" }] },
            },
            transitions: [{ from: ["a", "c1"], to: "missing" }],
        };
        expect(() => parseTreeSpecRuntime(bad)).toThrow(TreeSpecRuntimeError);
    });

    it("rejects transitions when a node key exists but the node payload is missing", () => {
        const bad: TreeSpecWire = {
            start_node: "a",
            nodes: { a: undefined as unknown as TreeSpecWire["nodes"][string] },
            transitions: [{ from: ["a", "c1"], to: END_NODE_ID }],
        };
        expect(() => parseTreeSpecRuntime(bad)).toThrow(TreeSpecRuntimeError);
    });

    it("rejects unknown choice when node key exists but payload is missing", () => {
        expect(() =>
            parseTreeSpecRuntime({
                start_node: "a",
                nodes: {
                    a: undefined as unknown as TreeSpecWire["nodes"][string],
                    b: { choices: [] },
                },
                transitions: [{ from: ["a", "c1"], to: "b" }],
            }),
        ).toThrow("Transition references unknown choice 'c1' on node 'a'.");
    });

    it("exposes issues via treeSpecRuntimeIssues", () => {
        const bad: TreeSpecWire = {
            start_node: "a",
            nodes: { a: { choices: [{ id: "c1", label: "x" }] } },
            transitions: [{ from: ["a", "c1"], to: "nope" }],
        };
        const issues = treeSpecRuntimeIssues(bad);
        expect(issues.length).toBeGreaterThan(0);
        expect(issues[0]?.severity).toBe("error");
    });

    it("normalizes legacy END tokens and legacy node options", () => {
        const parsed = parseTreeSpecRuntime({
            start_node: "a",
            nodes: {
                a: { options: [{ id: "c1", label: "Go" }] },
            },
            transitions: [
                { from: ["a", "c1"], to: LEGACY_END_NODE_ID, outcome: "safe" },
            ],
        });

        expect(parsed.transitions[0]?.to).toBe(END_NODE_ID);
        expect(getWireChoices(parsed.nodes.a)).toEqual([
            { id: "c1", label: "Go" },
        ]);
    });

    it("accepts known non-END target nodes", () => {
        const parsed = parseTreeSpecRuntime({
            start_node: "a",
            nodes: {
                a: { choices: [{ id: "c1", label: "Go" }] },
                b: { choices: [] },
            },
            transitions: [{ from: ["a", "c1"], to: "b" }],
        });
        expect(parsed.transitions[0]?.to).toBe("b");
    });

    it("preserves _ab and object _meta, but ignores invalid _meta payloads", () => {
        const parsed = parseTreeSpecRuntime({
            ...minimalWire(),
            _ab: { variant: "b" },
            _meta: { source: "test" },
        });
        expect(parsed._ab).toEqual({ variant: "b" });
        expect(parsed._meta).toEqual({ source: "test" });

        const withoutMeta = parseTreeSpecRuntime({
            ...minimalWire(),
            _meta: "invalid" as unknown as Record<string, unknown>,
        });
        expect("_meta" in withoutMeta).toBe(false);
    });

    it("rejects missing start nodes and malformed transition pairs", () => {
        expect(() =>
            parseTreeSpecRuntime({
                ...minimalWire(),
                start_node: "missing",
            }),
        ).toThrow("Missing node 'missing' referenced by start_node.");

        expect(() =>
            parseTreeSpecRuntime({
                ...minimalWire(),
                transitions: [
                    { from: ["a"], to: END_NODE_ID, outcome: "safe" },
                ] as unknown as TreeSpecWire["transitions"],
            }),
        ).toThrow("Each transition.from must be a [node_id, choice_id] pair.");

        expect(() =>
            parseTreeSpecRuntime({
                ...minimalWire(),
                transitions: [
                    { from: "a:c1", to: END_NODE_ID, outcome: "safe" },
                ] as unknown as TreeSpecWire["transitions"],
            }),
        ).toThrow("Each transition.from must be a [node_id, choice_id] pair.");
    });

    it("rejects unknown transition source nodes and choices", () => {
        expect(() =>
            parseTreeSpecRuntime({
                ...minimalWire(),
                transitions: [
                    {
                        from: ["missing", "c1"],
                        to: END_NODE_ID,
                        outcome: "safe",
                    },
                ],
            }),
        ).toThrow("Transition references unknown node 'missing'.");

        expect(() =>
            parseTreeSpecRuntime({
                ...minimalWire(),
                transitions: [
                    {
                        from: ["a", "missing"],
                        to: END_NODE_ID,
                        outcome: "safe",
                    },
                ],
            }),
        ).toThrow(
            "Transition references unknown choice 'missing' on node 'a'.",
        );

        expect(() =>
            parseTreeSpecRuntime({
                ...minimalWire(),
                transitions: [
                    {
                        from: ["a", "c1"],
                    } as unknown as TreeSpecWire["transitions"][number],
                ],
            }),
        ).toThrow("Transition references unknown target node ''.");

        expect(() =>
            parseTreeSpecRuntime({
                ...minimalWire(),
                transitions: [
                    {
                        from: [undefined, undefined],
                        to: END_NODE_ID,
                        outcome: "safe",
                    } as unknown as TreeSpecWire["transitions"][number],
                ],
            }),
        ).toThrow("Transition references unknown node ''.");

        expect(() =>
            parseTreeSpecRuntime({
                ...minimalWire(),
                transitions: [
                    {
                        from: ["a", "c1"],
                        to: null,
                    } as unknown as TreeSpecWire["transitions"][number],
                ],
            }),
        ).toThrow("Transition references unknown target node ''.");
    });

    it("surfaces structural lint errors before runtime traversal", () => {
        expect(() =>
            parseTreeSpecRuntime({
                start_node: "a",
                nodes: {
                    a: { choices: [{ id: "c1", label: "Go" }] },
                },
                transitions: [{ from: ["a", "c1"], to: END_NODE_ID }],
            }),
        ).toThrow("Transition to END is missing required outcome");
    });
});

describe("session dispatch", () => {
    it("steps to END with outcome", () => {
        const session = createInitialTreeSpecSession(minimalWire());
        expect(session.currentNodeId).toBe("a");
        const r = dispatchTreeSpecChoice(session, "a", "c1");
        expect(r.status).toBe("ended");
        if (r.status === "ended") {
            expect(r.outcome).toBe("safe");
            expect(r.state.cumulativeScore.total).toBe(0);
        }
    });

    it("refuses wrong current node", () => {
        const session = createInitialTreeSpecSession(minimalWire());
        expect(() => dispatchTreeSpecChoice(session, "wrong", "c1")).toThrow(
            TreeSpecRuntimeError,
        );
    });

    it("rejects missing transitions at the current node", () => {
        const session = createInitialTreeSpecSession(minimalWire());
        expect(() => dispatchTreeSpecChoice(session, "a", "missing")).toThrow(
            "Missing transition for (a, missing).",
        );
    });

    it("continues to the next node, merges score delta, and falls back to choice feedback", () => {
        const session = createInitialTreeSpecSession({
            start_node: "a",
            nodes: {
                a: {
                    type: "prompt",
                    prompt: "Start",
                    choices: [
                        {
                            id: "c1",
                            label: "Continue",
                        },
                    ],
                },
                b: {
                    type: "info",
                    prompt: "Next",
                    choices: [],
                    render_hints: { layout: "modal" },
                },
            },
            transitions: [
                {
                    from: ["a", "c1"],
                    to: "b",
                    delta: {
                        total: 2,
                        awareness: 1,
                        impulse_control: Number.NaN,
                    },
                    feedback: {
                        title: "Transition feedback",
                        red_flags: ["flag", 42],
                    },
                },
            ],
        });

        const result = dispatchTreeSpecChoice(session, "a", "c1");
        expect(result.status).toBe("continue");
        if (result.status === "continue") {
            expect(result.state.currentNodeId).toBe("b");
            expect(result.state.history).toEqual([
                { nodeId: "a", choiceId: "c1" },
            ]);
            expect(result.appliedDelta).toEqual({
                total: 2,
                awareness: 1,
                verification: 0,
                impulse_control: 0,
                damage_containment: 0,
            });
            expect(result.feedback).toEqual({
                title: "Transition feedback",
                red_flags: ["flag"],
            });
            expect(result.node.render_hints).toEqual({ layout: "modal" });
        }
    });

    it("rejects END transitions with invalid outcomes", () => {
        const session = createInitialTreeSpecSession({
            start_node: "a",
            nodes: {
                a: {
                    type: "prompt",
                    prompt: "Hi",
                    choices: [{ id: "c1", label: "Go" }],
                },
            },
            transitions: [
                {
                    from: ["a", "c1"],
                    to: END_NODE_ID,
                    outcome: "oops" as "safe",
                },
            ],
        });

        expect(() => dispatchTreeSpecChoice(session, "a", "c1")).toThrow(
            "Transition to END must include a valid outcome.",
        );
    });

    it("supports other valid END outcomes", () => {
        const session = createInitialTreeSpecSession({
            start_node: "a",
            nodes: {
                a: {
                    type: "prompt",
                    prompt: "Hi",
                    choices: [
                        {
                            id: "c1",
                            label: "Go",
                            feedback: { key: "choice", title: "Choice title" },
                        },
                    ],
                },
            },
            transitions: [
                { from: ["a", "c1"], to: END_NODE_ID, outcome: "compromised" },
            ],
        });

        const result = dispatchTreeSpecChoice(session, "a", "c1");
        expect(result.status).toBe("ended");
        if (result.status === "ended") {
            expect(result.outcome).toBe("compromised");
            expect(result.feedback).toEqual({
                key: "choice",
                title: "Choice title",
            });
        }
    });

    it("throws when an invalid session state points to a missing target node", () => {
        expect(() =>
            dispatchTreeSpecChoice(
                {
                    spec: {
                        start_node: "a",
                        nodes: {
                            a: { choices: [{ id: "c1", label: "Go" }] },
                        },
                        transitions: [
                            {
                                from: ["a", "c1"],
                            } as unknown as TreeSpecWire["transitions"][number],
                        ],
                    },
                    currentNodeId: "a",
                    cumulativeScore: {
                        total: 0,
                        awareness: 0,
                        verification: 0,
                        impulse_control: 0,
                        damage_containment: 0,
                    },
                    history: [],
                },
                "a",
                "c1",
            ),
        ).toThrow("Missing node ''.");
    });
});

describe("runtime helpers", () => {
    it("surfaces non-runtime parse failures through treeSpecRuntimeIssues", () => {
        expect(treeSpecRuntimeIssues(null as unknown as TreeSpecWire)).toEqual([
            {
                severity: "error",
                message: "tree_spec must be a non-null object.",
            },
        ]);
    });

    it("stringifies unexpected thrown errors through treeSpecRuntimeIssues", () => {
        const bad = {
            get start_node() {
                throw new Error("boom");
            },
            nodes: {},
            transitions: [],
        };
        expect(treeSpecRuntimeIssues(bad as unknown as TreeSpecWire)).toEqual([
            { severity: "error", message: "Error: boom" },
        ]);
    });

    it("returns transition feedback when present and ignores empty payloads", () => {
        const spec = minimalWire();
        expect(
            resolveFeedbackForTransition(spec, "a", "c1", {
                key: "k1",
                body: "Body",
                red_flags: ["x", 2],
            }),
        ).toEqual({ key: "k1", body: "Body", red_flags: ["x"] });
        expect(
            resolveFeedbackForTransition(spec, "missing", "c1", {}),
        ).toBeNull();
    });

    it("returns null for invalid or non-matching choice feedback payloads", () => {
        const spec = parseTreeSpecRuntime({
            start_node: "a",
            nodes: {
                a: {
                    choices: [
                        {
                            id: "c0",
                            label: "Other",
                            feedback: { key: "other" },
                        },
                        {
                            id: "c1",
                            label: "Chosen",
                            feedback: "invalid" as unknown as undefined,
                        },
                        { id: "c2", label: "Empty", feedback: {} },
                    ],
                },
            },
            transitions: [
                { from: ["a", "c1"], to: END_NODE_ID, outcome: "safe" },
            ],
        });

        expect(
            resolveFeedbackForTransition(spec, "a", "missing", {}),
        ).toBeNull();
        expect(resolveFeedbackForTransition(spec, "a", "c1", {})).toBeNull();
        expect(resolveFeedbackForTransition(spec, "a", "c2", {})).toBeNull();
    });

    it("returns null when the node has no matching choices or options", () => {
        const spec = parseTreeSpecRuntime({
            start_node: "a",
            nodes: {
                a: {
                    choices: [],
                },
            },
            transitions: [],
        });
        expect(
            resolveFeedbackForTransition(spec, "a", "missing", {}),
        ).toBeNull();
    });

    it("falls back to choice feedback and exposes default node view values", () => {
        const spec = parseTreeSpecRuntime({
            start_node: "a",
            nodes: {
                a: {
                    options: [
                        {
                            id: "skip",
                            label: "Skip",
                            feedback: { title: "Not selected" },
                        },
                        {
                            id: "c1",
                            label: "Legacy option",
                            feedback: {
                                key: "choice-feedback",
                                title: "Choice feedback",
                                body: "Body text",
                                takeaway: "Remember this",
                                red_flags: ["flag", 9],
                            },
                        },
                    ],
                },
            },
            transitions: [
                { from: ["a", "c1"], to: END_NODE_ID, outcome: "safe" },
            ],
        });

        expect(getTreeSpecNodeView(spec, "a")).toEqual({
            id: "a",
            type: "prompt",
            prompt: "",
            choices: [
                { id: "skip", label: "Skip" },
                { id: "c1", label: "Legacy option" },
            ],
            render_hints: {},
        });
        expect(resolveFeedbackForTransition(spec, "a", "c1", {})).toEqual({
            key: "choice-feedback",
            title: "Choice feedback",
            body: "Body text",
            takeaway: "Remember this",
            red_flags: ["flag"],
        });
    });

    it("finds matching transitions, throws on missing node views, and preserves base delta for invalid input", () => {
        const spec = parseTreeSpecRuntime(minimalWire());
        expect(findTransitionForChoice(spec, "a", "c1")).toMatchObject({
            from: ["a", "c1"],
            to: END_NODE_ID,
        });
        expect(() => getTreeSpecNodeView(minimalWire(), "missing")).toThrow(
            "Missing node 'missing'.",
        );
        expect(() => findTransitionForChoice(spec, "a", "missing")).toThrow(
            "Missing transition for (a, missing).",
        );
        expect(
            mergeScoreDelta(
                {
                    total: 1,
                    awareness: 2,
                    verification: 3,
                    impulse_control: 4,
                    damage_containment: 5,
                },
                "bad",
            ),
        ).toEqual({
            total: 1,
            awareness: 2,
            verification: 3,
            impulse_control: 4,
            damage_containment: 5,
        });
    });
});
