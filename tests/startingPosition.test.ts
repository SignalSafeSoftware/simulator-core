import { expect, it } from 'vitest';
import { entryTarget } from '../src/internal/simulatorEntryTargetRule.js';
import { validateDeviceJson } from '../src/validateDeviceJson.js';
it.each([
    undefined,
    { kind: 'conversation', id: 'thread-2' },
    { kind: 'email', id: 'mail-2' },
    { kind: 'contact', id: 'contact-2' },
    { kind: 'call', id: 'call-2' },
    { kind: 'photo', id: 'photo-2' },
    { kind: 'vault-entry', id: 'secret-2' },
    { kind: 'vault-folder', folder: 'Unfiled' },
    { kind: 'vault-folder', folder: null },
])('preserves optional starting target %j', (target) => {
    const value = { entry_point: { app: 'home', screen: 'home', target } };
    const before = JSON.stringify(value);
    expect(() => validateDeviceJson(value)).not.toThrow();
    expect(JSON.stringify(value)).toBe(before);
});
it.each([
    null,
    [],
    {},
    { kind: 'unknown', id: 'x' },
    { kind: 'call' },
    { kind: 'call', id: 2 },
    { kind: 'call', id: '' },
    { kind: 'call', id: '   ' },
    { kind: 'vault-folder' },
    { kind: 'vault-folder', folder: 2 },
])('rejects malformed starting target %j', (target) => {
    expect(() =>
        validateDeviceJson({ entry_point: { app: 'home', screen: 'home', target } }),
    ).toThrow('entry_point.target');
});

it('keeps exported starting-target patterns and runtime record-id validation equivalent', () => {
    const targets = entryTarget.jsonSchema.anyOf;
    if (!Array.isArray(targets)) throw new Error('Starting-target schemas must be listed.');
    const first: unknown = targets[0];
    if (!first || typeof first !== 'object' || !('properties' in first)) {
        throw new Error('A record target must declare its properties.');
    }
    const properties = first.properties;
    if (!properties || typeof properties !== 'object' || !('id' in properties)) {
        throw new Error('A record target must declare its identifier.');
    }
    const idSchema = properties.id;
    if (!idSchema || typeof idSchema !== 'object' || !('pattern' in idSchema)) {
        throw new Error('A record identifier must declare its pattern.');
    }
    const pattern = idSchema.pattern;
    if (typeof pattern !== 'string') throw new Error('The identifier pattern must be a string.');
    const expression = new RegExp(pattern);
    for (const [id, accepted] of [
        ['record-1', true],
        ['  padded-id  ', true],
        [String.raw`\S`, true],
        ['', false],
        ['   ', false],
        ['\n\t', false],
    ] as const) {
        expect(expression.test(id)).toBe(accepted);
        const validate = () =>
            validateDeviceJson({
                entry_point: { app: 'phone', screen: 'history', target: { kind: 'call', id } },
            });
        if (accepted) expect(validate).not.toThrow();
        else expect(validate).toThrow('entry_point.target');
    }
});
