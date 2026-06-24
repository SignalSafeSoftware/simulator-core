import {
    END_NODE_ID,
    isRecord,
    LEGACY_END_NODE_ID,
    lintTreeSpecWire,
    type TreeSpecNodeWire,
    type TreeSpecTransitionWire,
    type TreeSpecWire,
} from "@signalsafe/tree-spec";
import { TreeSpecRuntimeError } from "./errors.js";
import { expectRuntimeObject } from "./guards.js";

const ObjectWithHasOwn = Object as ObjectConstructor & {
    hasOwn(target: object, property: PropertyKey): boolean;
};

function hasOwn(target: object, property: PropertyKey): boolean {
    return ObjectWithHasOwn.hasOwn(target, property);
}

function expectStartNode(raw: Record<string, unknown>): string {
    if (typeof raw.start_node !== "string" || raw.start_node.trim() === "") {
        throw new TreeSpecRuntimeError(
            "tree_spec.start_node must be a non-empty string.",
        );
    }
    return raw.start_node;
}

function expectNodes(
    raw: Record<string, unknown>,
): Record<string, TreeSpecNodeWire> {
    if (!isRecord(raw.nodes)) {
        throw new TreeSpecRuntimeError("tree_spec.nodes must be an object.");
    }
    return raw.nodes as Record<string, TreeSpecNodeWire>;
}

function expectTransitions(
    raw: Record<string, unknown>,
): TreeSpecTransitionWire[] {
    if (Array.isArray(raw.transitions)) {
        return raw.transitions as TreeSpecTransitionWire[];
    }
    throw new TreeSpecRuntimeError("tree_spec.transitions must be an array.");
}

function normalizeTransitions(
    transitions: TreeSpecTransitionWire[],
): TreeSpecTransitionWire[] {
    return transitions.map((transition) => {
        const to = String(transition.to ?? "");
        return {
            ...transition,
            to: to === LEGACY_END_NODE_ID ? END_NODE_ID : to,
        };
    });
}

function optionalMeta(raw: Record<string, unknown>): {
    _meta?: Record<string, unknown>;
} {
    if (!isRecord(raw._meta)) {
        return {};
    }
    return { _meta: raw._meta };
}

function optionalAb(raw: Record<string, unknown>): { _ab?: unknown } {
    if (raw._ab === undefined) {
        return {};
    }
    return { _ab: raw._ab };
}

function throwOnLintErrors(spec: TreeSpecWire): void {
    for (const issue of lintTreeSpecWire(spec)) {
        if (issue.severity === "error") {
            throw new TreeSpecRuntimeError(issue.message);
        }
    }
}

function choiceIdsForNode(
    nodes: Record<string, TreeSpecNodeWire>,
    nodeId: string,
): Set<string> {
    const node = nodes[nodeId];
    if (!node) {
        return new Set<string>();
    }
    return new Set(getWireChoices(node).map((choice) => choice.id));
}

function validateTransitionFrom(
    nodes: Record<string, TreeSpecNodeWire>,
    transition: TreeSpecTransitionWire,
): { nodeId: string; choiceId: string } {
    const from = transition.from;
    if (Array.isArray(from) && from.length === 2) {
        const nodeId = String(from[0] ?? "");
        const choiceId = String(from[1] ?? "");

        if (hasOwn(nodes, nodeId)) {
            if (choiceIdsForNode(nodes, nodeId).has(choiceId)) {
                return { nodeId, choiceId };
            }
            throw new TreeSpecRuntimeError(
                `Transition references unknown choice '${choiceId}' on node '${nodeId}'.`,
            );
        }

        throw new TreeSpecRuntimeError(
            `Transition references unknown node '${nodeId}'.`,
        );
    }
    throw new TreeSpecRuntimeError(
        "Each transition.from must be a [node_id, choice_id] pair.",
    );
}

function validateTransitionTarget(
    nodes: Record<string, TreeSpecNodeWire>,
    transition: TreeSpecTransitionWire,
): void {
    const to = transition.to;
    if (to === END_NODE_ID) {
        return;
    }
    if (hasOwn(nodes, to)) {
        return;
    }
    throw new TreeSpecRuntimeError(
        `Transition references unknown target node '${to}'.`,
    );
}

/** Wire choices: `choices` or legacy `options`. */
export function getWireChoices(
    node: TreeSpecNodeWire,
): Array<{ id: string; label: string }> {
    const raw = (node.choices?.length ? node.choices : node.options) ?? [];
    return raw.map((c) => ({ id: String(c.id), label: String(c.label) }));
}

/** Normalize legacy END token and validate structure (matches backend TreeSpecBuilder expectations). */
export function parseTreeSpecRuntime(raw: unknown): TreeSpecWire {
    const runtime = expectRuntimeObject(raw);
    const startNode = expectStartNode(runtime);
    const nodes = expectNodes(runtime);
    const transitions = normalizeTransitions(expectTransitions(runtime));
    const spec: TreeSpecWire = {
        start_node: startNode,
        nodes,
        transitions,
        ...optionalAb(runtime),
        ...optionalMeta(runtime),
    };

    throwOnLintErrors(spec);

    if (hasOwn(nodes, spec.start_node)) {
        for (const transition of spec.transitions) {
            validateTransitionFrom(nodes, transition);
            validateTransitionTarget(nodes, transition);
        }

        return spec;
    }
    throw new TreeSpecRuntimeError(
        `Missing node '${spec.start_node}' referenced by start_node.`,
    );
}

export function findTransitionForChoice(
    spec: TreeSpecWire,
    nodeId: string,
    choiceId: string,
): TreeSpecTransitionWire {
    for (const t of spec.transitions) {
        const f = t.from;
        if (
            Array.isArray(f) &&
            f.length === 2 &&
            String(f[0]) === nodeId &&
            String(f[1]) === choiceId
        ) {
            return t;
        }
    }
    throw new TreeSpecRuntimeError(
        `Missing transition for (${nodeId}, ${choiceId}).`,
    );
}
