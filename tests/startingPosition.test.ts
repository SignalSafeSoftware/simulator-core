import { expect, it } from 'vitest';
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
