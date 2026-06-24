import { END_NODE_ID, type TreeSpecWire } from "@signalsafe/tree-spec";
import {
    createInitialTreeSpecSession,
    dispatchTreeSpecChoice,
    getTreeSpecNodeView,
} from "@signalsafe/simulator-core";

const wire: TreeSpecWire = {
    start_node: "start",
    nodes: {
        start: {
            type: "prompt",
            prompt: "Open the attachment?",
            choices: [{ id: "open", label: "Open it" }],
        },
    },
    transitions: [
        {
            from: ["start", "open"],
            to: END_NODE_ID,
            outcome: "compromised",
            delta: { total: -10, verification: -2 },
        },
    ],
};

const session = createInitialTreeSpecSession(wire);
const currentNode = getTreeSpecNodeView(session.spec, session.currentNodeId);

console.log(currentNode.prompt);
console.log(currentNode.choices.map((choice) => choice.label));

const result = dispatchTreeSpecChoice(session, "start", "open");
if (result.status !== "ended") {
    throw new Error("Expected a terminal outcome.");
}

console.log(result.outcome);
console.log(result.state.cumulativeScore);
