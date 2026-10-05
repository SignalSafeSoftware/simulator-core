import {
    END_NODE_ID,
    TERMINAL_OUTCOME,
    TREESPEC_WIRE_VERSION,
    isRecord,
    lintTreeSpecWire,
    type TreeSpecNodeWire,
    type TreeSpecTransitionWire,
    type TreeSpecWire,
} from '@signalsafe/tree-spec';
import { TreeSpecRuntimeError } from './errors.js';
import { expectRuntimeObject, hasOwn } from './guards.js';
import type { NodeChoice } from './types.js';

function expectStartNode(raw: Record<string, unknown>): string {
    if (typeof raw.start_node !== 'string' || raw.start_node.trim() === '') {
        throw new TreeSpecRuntimeError('tree_spec.start_node must be a non-empty string.');
    }
    return raw.start_node;
}

function expectNodes(raw: Record<string, unknown>): Record<string, TreeSpecNodeWire> {
    if (!isRecord(raw.nodes)) {
        throw new TreeSpecRuntimeError('tree_spec.nodes must be an object.');
    }
    for (const [id, node] of Object.entries(raw.nodes)) {
        if (isRecord(node) && hasOwn(node, 'options')) {
            throw new TreeSpecRuntimeError(
                `Node '${id}' uses removed field 'options'; migrate it to 'choices'.`,
            );
        }
    }
    // Node structure is validated by lintTreeSpecWire in parseTreeSpecRuntime.
    return raw.nodes as Record<string, TreeSpecNodeWire>;
}

function idText(value: unknown): string {
    if (typeof value === 'string') return value;
    return typeof value === 'number' || typeof value === 'boolean' ? String(value) : '';
}

function describeValue(value: unknown): string {
    return typeof value === 'string' || typeof value === 'number'
        ? String(value)
        : JSON.stringify(value);
}

function expectTransitions(raw: Record<string, unknown>): TreeSpecTransitionWire[] {
    if (!Array.isArray(raw.transitions)) {
        throw new TreeSpecRuntimeError('tree_spec.transitions must be an array.');
    }
    return raw.transitions.map((value: unknown, index): TreeSpecTransitionWire => {
        if (!isRecord(value)) {
            throw new TreeSpecRuntimeError(`tree_spec.transitions[${index}] must be an object.`);
        }
        if (!Array.isArray(value.from) || value.from.length !== 2) {
            throw new TreeSpecRuntimeError(
                'Each transition.from must be a [node_id, choice_id] pair.',
            );
        }
        const outcome = value.outcome;
        if (
            outcome !== undefined &&
            outcome !== TERMINAL_OUTCOME.SAFE &&
            outcome !== TERMINAL_OUTCOME.AT_RISK &&
            outcome !== TERMINAL_OUTCOME.COMPROMISED
        ) {
            throw new TreeSpecRuntimeError(`tree_spec.transitions[${index}].outcome is invalid.`);
        }
        return {
            ...value,
            from: [String(value.from[0] ?? ''), String(value.from[1] ?? '')],
            to: idText(value.to),
            ...(outcome === undefined ? {} : { outcome }),
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
        if (issue.severity === 'error') {
            throw new TreeSpecRuntimeError(issue.message);
        }
    }
}

function choiceIdsForNode(nodes: Record<string, TreeSpecNodeWire>, nodeId: string): Set<string> {
    const node = nodes[nodeId];
    if (!node) {
        return new Set<string>();
    }
    return new Set(getWireChoices(node).map((choice) => choice.id));
}

function validateTransitionFrom(
    nodes: Record<string, TreeSpecNodeWire>,
    transition: TreeSpecTransitionWire,
): void {
    const [nodeId, choiceId] = transition.from;
    if (!hasOwn(nodes, nodeId)) {
        throw new TreeSpecRuntimeError(`Transition references unknown node '${nodeId}'.`);
    }
    if (!choiceIdsForNode(nodes, nodeId).has(choiceId)) {
        throw new TreeSpecRuntimeError(
            `Transition references unknown choice '${choiceId}' on node '${nodeId}'.`,
        );
    }
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
    throw new TreeSpecRuntimeError(`Transition references unknown target node '${to}'.`);
}

/** Read choices from the canonical wire format. */
export function getWireChoices(node: TreeSpecNodeWire): NodeChoice[] {
    const raw = node.choices ?? [];
    return raw.map((c) => ({ id: String(c.id), label: String(c.label) }));
}

/** Validate canonical TreeSpec structure and references. */
export function parseTreeSpecRuntime(raw: unknown): TreeSpecWire {
    const runtime = expectRuntimeObject(raw);
    const version = runtime.wire_version;
    if (version !== undefined && version !== TREESPEC_WIRE_VERSION) {
        throw new TreeSpecRuntimeError(
            `Unsupported wire_version ${describeValue(version)}; only ${TREESPEC_WIRE_VERSION} is supported.`,
        );
    }
    const startNode = expectStartNode(runtime);
    const nodes = expectNodes(runtime);
    const transitions = expectTransitions(runtime);
    const spec: TreeSpecWire = {
        ...(version === undefined ? {} : { wire_version: version }),
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
    throw new TreeSpecRuntimeError(`Missing node '${spec.start_node}' referenced by start_node.`);
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
    throw new TreeSpecRuntimeError(`Missing transition for (${nodeId}, ${choiceId}).`);
}
