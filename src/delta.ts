import { isRecord } from '@signalsafe/tree-spec';
import type { ScoreDelta } from './types.js';

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
    const add = (key: keyof ScoreDelta): number => {
        const value = delta[key];
        if (typeof value !== 'number' || !Number.isFinite(value)) return base[key];
        const result = base[key] + value;
        // Ignore invalid deltas, including finite additions that overflow.
        return Number.isFinite(result) ? result : base[key];
    };
    return {
        total: add('total'),
        awareness: add('awareness'),
        verification: add('verification'),
        impulse_control: add('impulse_control'),
        damage_containment: add('damage_containment'),
    };
}
