import { describe, expect, it } from 'vitest';
import {
    array,
    boolean,
    durationSeconds,
    nullable,
    object,
    oneOf,
    text,
} from '../src/internal/deviceJsonRule.js';
import { deviceJsonSchema } from '../src/internal/deviceJsonRules.js';

describe('one device rule declaration for runtime and offline schema', () => {
    it('retains required fields, types and extension behavior in both representations', () => {
        const rule = object({ name: text, enabled: boolean }, ['name']);
        expect(rule.jsonSchema).toEqual({
            type: 'object',
            properties: { name: { type: 'string' }, enabled: { type: 'boolean' } },
            required: ['name'],
            additionalProperties: true,
        });
        expect(() =>
            rule({ name: 'Exact text', future_extension: { enabled: true } }, '$'),
        ).not.toThrow();
        expect(() => rule({ enabled: true }, '$')).toThrow('$.name');
        expect(() => rule({ name: 5 }, '$')).toThrow('a string');
    });
    it('represents nullable enums without coercion', () => {
        const rule = nullable(oneOf('one', 'two'));
        expect(rule.jsonSchema).toEqual({
            anyOf: [{ type: 'null' }, { type: 'string', enum: ['one', 'two'] }],
        });
        expect(() => rule(null, '$')).not.toThrow();
        expect(() => rule('one', '$')).not.toThrow();
        expect(() => rule(true, '$')).toThrow();
    });
    it('retains unique nonempty IDs without changing case or normalizing values', () => {
        const rule = array(object({ id: text }, ['id']), true);
        expect(rule.jsonSchema['x-simulator-unique-id']).toBe(true);
        expect(() => rule([{ id: 'A' }, { id: 'a' }], '$')).not.toThrow();
        expect(() => rule([{ id: 'A' }, { id: 'A' }], '$')).toThrow('unique');
        expect(() => rule([{ id: '' }], '$')).toThrow('unique');
    });
    it('exports the exact nonnegative safe-integer duration boundary', () => {
        expect(durationSeconds.jsonSchema).toEqual({
            type: 'integer',
            minimum: 0,
            maximum: Number.MAX_SAFE_INTEGER,
        });
        for (const value of [0, Number.MAX_SAFE_INTEGER])
            expect(() => durationSeconds(value, '$')).not.toThrow();
        for (const value of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity, true])
            expect(() => durationSeconds(value, '$')).toThrow();
    });
    it('exports the deprecated voicemail rejection alongside the same device rules', () => {
        expect(deviceJsonSchema.not).toEqual({
            type: 'object',
            required: ['phone'],
            properties: {
                phone: {
                    type: 'object',
                    properties: { voicemail_transcript: true },
                    required: ['voicemail_transcript'],
                    additionalProperties: true,
                },
            },
        });
        expect(() => JSON.stringify(deviceJsonSchema)).not.toThrow();
    });
});
