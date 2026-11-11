import { define, fail, object, oneOf, nullable, text, type Rule } from './deviceJsonRule.js';
const entryId = define(
    (value, path) => {
        if (typeof value !== 'string' || !value.trim()) fail(path, 'a nonempty record id');
    },
    { type: 'string', minLength: 1, pattern: '\\S' },
);
const entryTargets: Readonly<Record<string, Rule>> = Object.fromEntries(
    ['conversation', 'email', 'contact', 'call', 'photo', 'vault-entry'].map((kind) => [
        kind,
        object({ kind: oneOf(kind), id: entryId }, ['kind', 'id']),
    ]),
);
const folderTarget = object({ kind: oneOf('vault-folder'), folder: nullable(text) }, [
    'kind',
    'folder',
]);
export const entryTarget = define(
    (value, path) => {
        if (
            value === null ||
            typeof value !== 'object' ||
            !('kind' in value) ||
            typeof value.kind !== 'string'
        )
            return fail(path, 'a starting-position target');
        const rule = value.kind === 'vault-folder' ? folderTarget : entryTargets[value.kind];
        if (!rule) return fail(path, 'a supported starting-position target');
        rule(value, path);
    },
    { anyOf: [...Object.values(entryTargets), folderTarget].map((rule) => rule.jsonSchema) },
);
