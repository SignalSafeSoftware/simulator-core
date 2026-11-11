import { validateDeviceJson } from '../src/validateDeviceJson.js';
import { describe, expect, it } from 'vitest';
import { hasDeviceEntryPoint, isSimulatorDevicePayload } from '../src/devicePayloadGuards.js';
import type { SimulatorDevicePayload } from '../src/devicePayload.js';

describe('device payload guards', () => {
    it('hasDeviceEntryPoint requires entry_point.app string', () => {
        expect(hasDeviceEntryPoint({ entry_point: { app: 'email', screen: 'list' } })).toBe(true);
        expect(hasDeviceEntryPoint({ entry_point: { screen: 'list' } })).toBe(false);
        expect(hasDeviceEntryPoint({})).toBe(false);
    });

    it('isSimulatorDevicePayload requires non-empty object with entry point', () => {
        const payload: SimulatorDevicePayload = {
            entry_point: { app: 'phone', screen: 'history' },
        };
        expect(isSimulatorDevicePayload(payload)).toBe(true);
        expect(isSimulatorDevicePayload({})).toBe(false);
        expect(isSimulatorDevicePayload(null)).toBe(false);
    });
});

describe('device payload exports', () => {
    it('re-exports payload types and guards from the public modules', () => {
        expect(typeof hasDeviceEntryPoint).toBe('function');
        expect(typeof isSimulatorDevicePayload).toBe('function');
    });
});

it('rejects invalid applications, missing screens and malformed nested payloads', () => {
    for (const payload of [
        { entry_point: { app: 'bogus', screen: 'list' } },
        { entry_point: { app: 'phone' } },
        { entry_point: { app: 'phone', screen: 'history' }, contacts: 42 },
        { entry_point: { app: 'email', screen: 'list' }, email: { messages: [null] } },
    ])
        expect(isSimulatorDevicePayload(payload)).toBe(false);
});

it.each([
    [undefined, true],
    [0, true],
    [184, true],
    [-1, false],
    [1.5, false],
    [NaN, false],
    [Infinity, false],
    ['184', false],
    [null, false],
])('validates optional call duration %s', (duration, valid) => {
    expect(
        isSimulatorDevicePayload({
            entry_point: { app: 'phone', screen: 'history' },
            phone: { history: [{ id: 'call', duration_seconds: duration }] },
        }),
    ).toBe(valid);
});

it.each([
    ['111', true],
    ['', true],
    [undefined, true],
    [123, false],
    [null, false],
    [['111'], false],
])('validates a single optional SMS sender number %s', (sender_number, valid) => {
    expect(
        isSimulatorDevicePayload({
            entry_point: { app: 'messages', screen: 'thread_detail' },
            messages: {
                thread_detail: {
                    messages: [
                        {
                            from: 'them',
                            text: 'Hello',
                            ...(sender_number === undefined ? {} : { sender_number }),
                        },
                    ],
                },
            },
        }),
    ).toBe(valid);
});

it('validates an optional voicemail phone number without accepting non-text values', () => {
    const payload: SimulatorDevicePayload = {
        entry_point: { app: 'phone', screen: 'voicemail' },
        phone: {
            voicemail: { caller_name: 'Bank', phone_number: '+12025550123', transcript: 'Hello' },
        },
    };
    expect(() => validateDeviceJson(payload)).not.toThrow();
    expect(() =>
        validateDeviceJson({ ...payload, phone: { voicemail: { phone_number: 123 } } }),
    ).toThrow();
});
