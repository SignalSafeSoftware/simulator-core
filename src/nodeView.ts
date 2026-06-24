import { isRecord, type TreeSpecWire } from "@signalsafe/tree-spec";
import { TreeSpecRuntimeError } from "./errors.js";
import { getWireChoices } from "./wire.js";
import type { MicroFeedback, NodeView } from "./types.js";

function getChoiceFeedback(choice: unknown): unknown {
    return isRecord(choice) && "feedback" in choice
        ? choice.feedback
        : undefined;
}

function parseMicroFeedback(x: unknown): MicroFeedback | null {
    if (!isRecord(x)) return null;
    const o = x;
    const red = o.red_flags;
    const feedback: MicroFeedback = {
        ...(typeof o.key === "string" ? { key: o.key } : {}),
        ...(typeof o.title === "string" ? { title: o.title } : {}),
        ...(typeof o.body === "string" ? { body: o.body } : {}),
        ...(typeof o.takeaway === "string" ? { takeaway: o.takeaway } : {}),
        ...(Array.isArray(red)
            ? {
                  red_flags: red.filter(
                      (item): item is string => typeof item === "string",
                  ),
              }
            : {}),
    };
    return Object.keys(feedback).length > 0 ? feedback : null;
}

export function getTreeSpecNodeView(
    spec: TreeSpecWire,
    nodeId: string,
): NodeView {
    const n = spec.nodes[nodeId];
    if (!n) {
        throw new TreeSpecRuntimeError(`Missing node '${nodeId}'.`);
    }
    const choices = getWireChoices(n).map((c) => ({
        id: c.id,
        label: c.label,
    }));
    return {
        id: nodeId,
        type: String(n.type ?? "prompt"),
        prompt: String(n.prompt ?? ""),
        choices,
        render_hints: isRecord(n.render_hints) ? n.render_hints : {},
    };
}

export function resolveFeedbackForTransition(
    spec: TreeSpecWire,
    nodeId: string,
    choiceId: string,
    transitionFeedback: unknown,
): MicroFeedback | null {
    const fb = parseMicroFeedback(transitionFeedback);
    if (fb && Object.keys(fb).length > 0) return fb;
    const n = spec.nodes[nodeId];
    if (!n) return null;
    const rawChoices = (n.choices?.length ? n.choices : n.options) ?? [];
    for (const choice of rawChoices) {
        if (String(choice.id) !== choiceId) continue;
        const raw = getChoiceFeedback(choice);
        const cf = parseMicroFeedback(raw);
        if (cf) return cf;
    }
    return null;
}
