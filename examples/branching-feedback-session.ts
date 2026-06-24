import { END_NODE_ID, type TreeSpecWire } from "@signalsafe/tree-spec";
import {
    createInitialTreeSpecSession,
    dispatchTreeSpecChoice,
    parseTreeSpecRuntime,
    treeSpecRuntimeIssues,
} from "@signalsafe/simulator-core";

const wire: TreeSpecWire = {
    start_node: "start",
    nodes: {
        start: {
            type: "prompt",
            prompt: "A caller asks for a password reset code. What do you do?",
            choices: [
                {
                    id: "verify",
                    label: "Verify their identity first",
                    feedback: {
                        key: "good-check",
                        title: "Good instinct",
                        takeaway:
                            "Ask for a trusted callback or verified channel before sharing account details.",
                    },
                },
            ],
        },
        wrap_up: {
            type: "info",
            prompt: "You prevented an account takeover.",
            choices: [{ id: "done", label: "Finish" }],
            render_hints: { layout: "callout" },
        },
    },
    transitions: [
        {
            from: ["start", "verify"],
            to: "wrap_up",
            delta: { total: 5, verification: 3 },
        },
        {
            from: ["wrap_up", "done"],
            to: END_NODE_ID,
            outcome: "safe",
            feedback: {
                key: "complete",
                title: "Wrap-up",
                body: "Document the interaction and escalate if the request still looks suspicious.",
            },
        },
    ],
};

const runtimeIssues = treeSpecRuntimeIssues(wire);
if (runtimeIssues.length > 0) {
    throw new Error(runtimeIssues.map((issue) => issue.message).join("\n"));
}

const parsed = parseTreeSpecRuntime(wire);

const firstState = createInitialTreeSpecSession(parsed);
const firstStep = dispatchTreeSpecChoice(firstState, "start", "verify");

if (firstStep.status !== "continue") {
    throw new Error("Expected an intermediate step.");
}

console.log(firstStep.feedback);
console.log(firstStep.node.render_hints);

const finalStep = dispatchTreeSpecChoice(firstStep.state, "wrap_up", "done");
if (finalStep.status !== "ended") {
    throw new Error("Expected a terminal step.");
}

console.log(finalStep.outcome);
console.log(finalStep.feedback);
