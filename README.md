# `@signalsafe/simulator-core`

Headless **TreeSpec session runtime**: step scenarios, accumulate scores, resolve outcomes — no UI, React, routing, or transport.

| | |
|---|---|
| **npm** | `@signalsafe/simulator-core` |
| **GitHub** | [SignalSafeSoftware/simulator-core](https://github.com/SignalSafeSoftware/simulator-core) |
| **Depends on** | `@signalsafe/tree-spec` |

## What this package does

- Parse and validate runtime-ready **`TreeSpecWire`** payloads.
- Run an immutable **session state machine**: `createInitialTreeSpecSession` → `dispatchTreeSpecChoice`.
- Resolve **node views**, **score deltas**, and **micro-feedback** for renderers.

## What this package does not do

- React components, device shells, or Bootstrap UI — use `@signalsafe/simulator-react`.
- HTTP APIs, authentication, routing, or persistence — host app owns transport and storage.
- Deep content security review — treat wire JSON as trusted authoring content unless the host validates it first.

## State lifecycle

1. **`parseTreeSpecRuntime(wire)`** / **`treeSpecRuntimeIssues(wire)`** — validate before play.
2. **`createInitialTreeSpecSession(wire)`** — initial `currentNodeId`, empty history, zeroed scores.
3. **`dispatchTreeSpecChoice(state, nodeId, choiceId)`** — returns `continue` (next node + delta) or `ended` (terminal outcome).
4. Session **`history`** is append-only; **`cumulativeScore`** merges deltas via `mergeScoreDelta`.

## Decision / transition flow

For each choice, the runtime finds the matching transition (`findTransitionForChoice`), applies optional **score delta**, resolves **feedback** (transition overrides choice), and either lands on the next node or a terminal **outcome** when `to` is END.

## Install

```bash
npm install @signalsafe/simulator-core @signalsafe/tree-spec
```

`simulator-core` depends on `@signalsafe/tree-spec` for the wire format and shared types.

## Repository

Source code and issues are available at:
https://github.com/SignalSafeSoftware/simulator-core

## What It Provides

- Parse and validate a runtime-ready `TreeSpecWire`
- Create an initial session state
- Dispatch a choice from the current node
- Accumulate score deltas across the session
- Resolve node views for rendering
- Return transition-level or choice-level micro-feedback

## Quick Start

```ts
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

// Expected output:
// Open the attachment?
console.log(currentNode.prompt);

// Expected output:
// ["Open it"]
console.log(currentNode.choices.map((choice) => choice.label));

const result = dispatchTreeSpecChoice(session, "start", "open");
if (result.status !== "ended") {
    throw new Error("Expected a terminal outcome.");
}

// Expected output:
// compromised
console.log(result.outcome);

// Expected output:
// {
//     total: -10,
//     awareness: 0,
//     verification: -2,
//     impulse_control: 0,
//     damage_containment: 0,
// }
console.log(result.state.cumulativeScore);
```

## Common Flows

### Validate a wire payload before starting a session

Use `treeSpecRuntimeIssues()` when you want a non-throwing validation pass that returns user-facing issues. Use `parseTreeSpecRuntime()` when invalid payloads should fail immediately.

```ts
import {
    parseTreeSpecRuntime,
    treeSpecRuntimeIssues,
} from "@signalsafe/simulator-core";
import type { TreeSpecWire } from "@signalsafe/tree-spec";

const raw = someUnknownValue as TreeSpecWire;
const issues = treeSpecRuntimeIssues(raw);

if (issues.length > 0) {
    console.error(issues);
} else {
    const spec = parseTreeSpecRuntime(raw);
    console.log(spec.start_node);
}
```

### Walk a multi-step session

```ts
import { END_NODE_ID, type TreeSpecWire } from "@signalsafe/tree-spec";
import {
    createInitialTreeSpecSession,
    dispatchTreeSpecChoice,
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

const firstState = createInitialTreeSpecSession(wire);
const firstStep = dispatchTreeSpecChoice(firstState, "start", "verify");

if (firstStep.status !== "continue") {
    throw new Error("Expected an intermediate step.");
}

// Expected output:
// {
//     key: "good-check",
//     title: "Good instinct",
//     takeaway: "Ask for a trusted callback or verified channel before sharing account details.",
// }
console.log(firstStep.feedback);

// Expected output:
// {
//     layout: "callout",
// }
console.log(firstStep.node.render_hints);

const finalStep = dispatchTreeSpecChoice(firstStep.state, "wrap_up", "done");
if (finalStep.status !== "ended") {
    throw new Error("Expected a terminal step.");
}

// Expected output:
// safe
console.log(finalStep.outcome);

// Expected output:
// {
//     key: "complete",
//     title: "Wrap-up",
//     body: "Document the interaction and escalate if the request still looks suspicious.",
// }
console.log(finalStep.feedback);
```

### Inspect the current node and raw choices

```ts
import {
    getTreeSpecNodeView,
    getWireChoices,
    parseTreeSpecRuntime,
} from "@signalsafe/simulator-core";

const spec = parseTreeSpecRuntime(wire);
const currentNode = getTreeSpecNodeView(spec, spec.start_node);
const rawChoices = getWireChoices(spec.nodes[spec.start_node]);

console.log(currentNode.render_hints);
console.log(rawChoices.map((choice) => choice.label));
```

`getTreeSpecNodeView()` returns the simplified shape most renderers need:

- `id`
- `type`
- `prompt`
- `choices`
- `render_hints`

`getWireChoices()` returns the original choice array from the source node so you can inspect metadata that is not present on `NodeView`.

## Core API

### Session Lifecycle

- `createInitialTreeSpecSession(wire)`: validates the wire payload and creates initial immutable state
- `dispatchTreeSpecChoice(state, nodeId, choiceId)`: applies one choice from the current node and returns either a continue result or an ended result
- `treeSpecRuntimeIssues(wire)`: returns structural/runtime issues without throwing

### Runtime Helpers

- `parseTreeSpecRuntime(wire)`: validates and normalizes the runtime payload
- `getTreeSpecNodeView(spec, nodeId)`: returns a renderer-friendly node view
- `findTransitionForChoice(spec, nodeId, choiceId)`: returns the matching transition for a selected choice
- `getWireChoices(node)`: returns the raw choices/options array from a node
- `resolveFeedbackForTransition(spec, nodeId, choiceId, transitionFeedback)`: resolves transition feedback first, then falls back to choice feedback

### Utility Exports

- `emptyScoreDelta()`
- `mergeScoreDelta()`
- `TreeSpecRuntimeError`

## Result Shapes

`dispatchTreeSpecChoice()` returns one of two result shapes:

- `status: 'continue'`: includes `state`, `node`, `appliedDelta`, and optional `feedback`
- `status: 'ended'`: includes `state`, `outcome`, `appliedDelta`, and optional `feedback`

Session state tracks:

- `currentNodeId`
- `cumulativeScore`
- `history`
- `spec`

## Example Files

- `examples/basic-terminal-session.ts`: minimal terminal flow with an outcome and score delta
- `examples/branching-feedback-session.ts`: multi-step flow with validation, intermediate feedback, render hints, and terminal feedback

Examples are documentation-focused TypeScript files. They illustrate package usage, but they are not part of the published runtime bundle.

## Development

Requires Node.js **>=18** (`engines.node`). CI runs checks, tests, and smoke across Node **18**, **20**, **22**, and **24**; publish uses Node **24**.

`yarn build` uses `tsconfig.build.json` and resolves `@signalsafe/*` from `node_modules`. Ecosystem sibling `paths` in `tsconfig.json` apply to local typecheck/tests only.

```bash
yarn install
yarn build
yarn test
yarn typecheck
```

## Security

See [SECURITY.md](./SECURITY.md). Scenario payloads are **authoring/trusted content** unless the host validates them first. This library does not sandbox execution beyond stepping the scenario graph.

## Changelog and releases

- [CHANGELOG.md](./CHANGELOG.md)
- [RELEASING.md](./RELEASING.md)
