import { isRecord } from "@signalsafe/tree-spec";
import type { ScoreDelta } from "./types.js";

export function emptyScoreDelta(): ScoreDelta {
    return {
        total: 0,
        awareness: 0,
        verification: 0,
        impulse_control: 0,
        damage_containment: 0,
    };
}

export function mergeScoreDelta(base: ScoreDelta, delta: unknown): ScoreDelta {
    if (!isRecord(delta)) {
        return { ...base };
    }
    const d = delta;
    const n = (k: keyof ScoreDelta) => {
        const v = d[k as string];
        return typeof v === "number" && !Number.isNaN(v) ? v : 0;
    };
    return {
        total: base.total + n("total"),
        awareness: base.awareness + n("awareness"),
        verification: base.verification + n("verification"),
        impulse_control: base.impulse_control + n("impulse_control"),
        damage_containment: base.damage_containment + n("damage_containment"),
    };
}
