import { describe, expect, it } from 'vitest';
import { migratePhoneCalls, SimulatorCallType, unifyPhoneCalls } from '../src/phoneCalls.js';
import { validateDeviceJson } from '../src/validateDeviceJson.js';

describe('unified authored calls', () => {
    it('accepts each type and rejects unsupported types and malformed durations', () => {
        for (const type of Object.values(SimulatorCallType))
            expect(() =>
                validateDeviceJson({
                    entry_point: { app: 'phone', screen: 'history' },
                    phone: { calls: [{ id: 'c', type }] },
                }),
            ).not.toThrow();
        for (const call of [
            { id: 'c', type: 'placed' },
            { id: 'c', type: 'received', duration_seconds: -1 },
        ])
            expect(() =>
                validateDeviceJson({
                    entry_point: { app: 'phone', screen: 'history' },
                    phone: { calls: [call] },
                }),
            ).toThrow();
    });
    it('preserves unknown outgoing outcomes and merges a matching voicemail without duplicates', () => {
        const source = {
            history: [
                { id: 'one', direction: 'out' as const, number: '1' },
                {
                    id: 'two',
                    direction: 'voicemail' as const,
                    name: 'Bank',
                    number: '2',
                    timestamp: 'Today',
                },
            ],
            voicemail: { caller_name: 'Bank', timestamp: 'Today', transcript: 'Hello' },
        };
        const result = migratePhoneCalls(source);
        expect(result.calls).toMatchObject([
            { id: 'one', type: 'outgoing' },
            { id: 'two', type: 'voicemail', number: '2', transcript: 'Hello' },
        ]);
        expect(result.history).toBeUndefined();
        expect(source.history).toHaveLength(2);
        expect(migratePhoneCalls(result)).toEqual(result);
    });
    it('retains multiple voicemail records and creates collision-free legacy ids', () => {
        expect(
            unifyPhoneCalls({
                history: [{ id: 'incoming-call', direction: 'in' }],
                incoming_call: { caller_name: 'Caller' },
            }).map((c) => c.id),
        ).toEqual(['incoming-call', 'incoming-call-1']);
        const calls = [
            { id: 'a', type: SimulatorCallType.Voicemail, transcript: 'One' },
            { id: 'b', type: SimulatorCallType.Voicemail, transcript: 'Two' },
        ];
        expect(unifyPhoneCalls({ calls })).toEqual(calls);
        expect(() => unifyPhoneCalls({ calls, history: [] })).toThrow();
    });
});

it('rejects mixing legacy and unified phone data instead of silently losing records', () => {
    expect(() =>
        validateDeviceJson({
            entry_point: { app: 'phone', screen: 'history' },
            phone: { calls: [], history: [] },
        }),
    ).toThrow(/legacy/);
});

it('does not attach a singleton transcript to an ambiguous historical voicemail', () => {
    const calls = unifyPhoneCalls({
        history: [
            { id: 'a', direction: 'voicemail', name: 'Bank' },
            { id: 'b', direction: 'voicemail', name: 'Bank' },
        ],
        voicemail: { caller_name: 'Bank', transcript: 'Keep separate' },
    });
    expect(calls).toHaveLength(3);
    expect(calls[2]?.transcript).toBe('Keep separate');
    expect(calls[0]?.transcript).toBeUndefined();
});

it('migrates answered, missed and live calls while retaining unrelated phone data', () => {
    const original = {
        contacts: ['contact'],
        dial: { digits: '123' },
        history: [
            { id: 'received', direction: 'in' as const },
            { id: 'accepted', direction: 'out' as const, duration_seconds: 2 },
            { id: 'missed', direction: 'missed' as const },
        ],
        incoming_call: {
            caller_name: 'Live caller',
            phone_number: '123',
            avatar_url: 'photo',
            caller_title: 'Legacy metadata',
            transcript: 'Hello',
        },
    };
    const result = migratePhoneCalls(original);
    expect(result.calls?.map((call) => call.type)).toEqual([
        'received',
        'accepted',
        'missed',
        'incoming',
    ]);
    expect(result.calls?.[3]).toMatchObject({
        name: 'Live caller',
        number: '123',
        avatar_url: 'photo',
        caller_title: 'Legacy metadata',
        transcript: 'Hello',
    });
    expect(result.contacts).toEqual(['contact']);
    expect(result.dial).toEqual({ digits: '123' });
    expect(original.incoming_call.caller_name).toBe('Live caller');
});

it('matches voicemail by explicit number, keeps conflicting dates separate and allocates stable ids', () => {
    expect(
        unifyPhoneCalls({
            history: [{ id: 'voicemail', direction: 'voicemail', number: '123' }],
            voicemail: { phone_number: '123', transcript: 'Linked' },
        }),
    ).toHaveLength(1);
    const separate = unifyPhoneCalls({
        history: [{ id: 'voicemail', direction: 'voicemail', number: '123', timestamp: 'Old' }],
        voicemail: { phone_number: '123', timestamp: 'New', transcript: 'Separate' },
    });
    expect(separate).toHaveLength(2);
    expect(separate[1]?.id).toBe('voicemail-1');
    expect(unifyPhoneCalls({ voicemail: { transcript: 'Unknown caller' } })).toMatchObject([
        { type: 'voicemail', transcript: 'Unknown caller' },
    ]);
    expect(unifyPhoneCalls({})).toEqual([]);
    expect(
        unifyPhoneCalls({ history: [{ id: 'c', direction: 'out', duration_seconds: 0 }] }),
    ).toMatchObject([{ type: 'outgoing' }]);
});
