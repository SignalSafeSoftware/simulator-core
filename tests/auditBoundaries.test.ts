import { describe, expect, it } from 'vitest';
import { summarizeDevice } from '../src/apps/deviceData.js';
import { emptySimulatorStore, secretSchema } from '../src/apps/contracts.js';
import { emptyScoreDelta, mergeScoreDelta } from '../src/delta.js';
import { SimulatorPhoneScreenId, isPhoneScreen } from '../src/devicePayload.js';

describe('audited domain boundaries', () => {
    it.each(['constructor', 'toString', '__proto__'])(
        'counts arbitrary folder %s safely',
        (folder) => {
            const store = emptySimulatorStore();
            const record = secretSchema.parse({
                id: 'one',
                title: 'Note',
                folder,
                type: 'note',
                username: '',
                value: '',
                site: '',
                notes: '',
                createdAt: '2026-10-03T00:00:00Z',
                updatedAt: '2026-10-03T00:00:00Z',
            });
            store.secrets.push(record, { ...record, id: 'two' });
            const counts = summarizeDevice(store).counts.secrets;
            expect(Object.getOwnPropertyDescriptor(counts, folder)?.value).toBe(2);
            expect(JSON.parse(JSON.stringify(counts))[folder]).toBe(2);
        },
    );
    it.each([Infinity, -Infinity, NaN])('ignores nonfinite delta %s', (total) => {
        const base = { ...emptyScoreDelta(), total: 3 };
        expect(mergeScoreDelta(base, { total })).toEqual(base);
    });
    it('ignores overflow while applying other valid dimensions', () => {
        const base = { ...emptyScoreDelta(), total: Number.MAX_VALUE };
        expect(mergeScoreDelta(base, { total: Number.MAX_VALUE, awareness: 2 })).toEqual({
            ...base,
            awareness: 2,
        });
    });
    it('validates every canonical phone screen including add contact', () => {
        for (const screen of Object.values(SimulatorPhoneScreenId))
            expect(isPhoneScreen(screen)).toBe(true);
        expect(isPhoneScreen('unknown')).toBe(false);
        expect(isPhoneScreen(null)).toBe(false);
    });
});
