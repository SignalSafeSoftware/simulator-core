import { deviceJsonSchema } from '../dist/internal/deviceJsonRules.js';
import { validateDeviceJson } from '../dist/validateDeviceJson.js';

function sample(schema) {
    if (schema.anyOf) return sample(schema.anyOf.find((entry) => entry.type !== 'null'));
    if ('const' in schema) return schema.const;
    if (schema.enum) return schema.enum[0];
    if (schema.type === 'object')
        return Object.fromEntries(
            Object.entries(schema.properties).map(([key, value]) => [key, sample(value)]),
        );
    if (schema.type === 'array') return [sample(schema.items)];
    if (schema.type === 'boolean') return true;
    if (schema.type === 'integer' || schema.type === 'number') return 1;
    return 'fixture';
}
const base = sample(deviceJsonSchema);
const cases = [];
function append(name, path, operation, value) {
    let input = structuredClone(base);
    if (path.length === 0) input = value;
    else {
        const parent = path.slice(0, -1).reduce((current, key) => current[key], input);
        if (operation === 'delete') delete parent[path.at(-1)];
        else parent[path.at(-1)] = value;
    }
    let accepted = true;
    try {
        validateDeviceJson(input);
    } catch {
        accepted = false;
    }
    cases.push({ name, path, operation, value, accepted });
}
function visit(schema, path) {
    if (schema.anyOf) {
        append('nullable', path, 'set', null);
        visit(
            schema.anyOf.find((entry) => entry.type !== 'null'),
            path,
        );
        return;
    }
    append(
        'wrong-type',
        path,
        'set',
        schema.type === 'object'
            ? []
            : schema.type === 'array'
              ? {}
              : schema.type === 'string'
                ? 7
                : 'invalid',
    );
    if (schema.enum) append('unknown-enum', path, 'set', 'unknown_simulator_value');
    if ('const' in schema) {
        append('changed-constant', path, 'set', 2);
        append('boolean-constant', path, 'set', true);
    }
    if (schema.type === 'integer') {
        append('fractional-integer', path, 'set', 1.5);
        append('negative-duration', path, 'set', -1);
        append('unsafe-integer', path, 'set', Number.MAX_SAFE_INTEGER + 1);
    }
    if (schema.type === 'object') {
        for (const key of schema.required)
            append('missing-required', [...path, key], 'delete', null);
        append('future-extension', [...path, 'future_extension'], 'set', { enabled: true });
        for (const [key, property] of Object.entries(schema.properties))
            visit(property, [...path, key]);
    }
    if (schema.type === 'array') {
        visit(schema.items, [...path, 0]);
        if (schema['x-simulator-unique-id']) {
            const item = sample(schema.items);
            append('duplicate-identities', path, 'set', [item, structuredClone(item)]);
            append('empty-identity', [...path, 0, 'id'], 'set', '');
        }
    }
}
visit(deviceJsonSchema, []);
append('removed-voicemail-field', ['phone', 'voicemail_transcript'], 'set', 'old reader');
process.stdout.write(JSON.stringify({ base, cases }, null, 2) + '\n');
