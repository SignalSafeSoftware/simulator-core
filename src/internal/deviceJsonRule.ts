type SchemaValue =
    | string
    | number
    | boolean
    | null
    | readonly SchemaValue[]
    | { readonly [key: string]: SchemaValue };
export type DeviceJsonSchema = { readonly [key: string]: SchemaValue };
type Check = (value: unknown, path: string) => void;
export interface Rule extends Check {
    readonly jsonSchema: DeviceJsonSchema;
}
export const define = (check: Check, jsonSchema: DeviceJsonSchema): Rule =>
    Object.assign(check, { jsonSchema });
export const fail = (path: string, expected: string): never => {
    throw new Error(`Invalid simulator JSON at ${path}: expected ${expected}.`);
};
const record = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value);
export const text = define(
    (v, p) => {
        if (typeof v !== 'string') fail(p, 'a string');
    },
    { type: 'string' },
);
export const boolean = define(
    (v, p) => {
        if (typeof v !== 'boolean') fail(p, 'a boolean');
    },
    { type: 'boolean' },
);
export const number = define(
    (v, p) => {
        if (typeof v !== 'number' || !Number.isFinite(v)) fail(p, 'a finite number');
    },
    { type: 'number' },
);
export const durationSeconds = define(
    (v, p) => {
        if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 0)
            fail(p, 'a nonnegative integer duration in seconds');
    },
    { type: 'integer', minimum: 0, maximum: Number.MAX_SAFE_INTEGER },
);
export const oneOf = (...values: readonly string[]): Rule =>
    define(
        (v, p) => {
            if (typeof v !== 'string' || !values.includes(v)) fail(p, values.join(' | '));
        },
        { type: 'string', enum: values },
    );
export const nullable = (rule: Rule): Rule =>
    define(
        (v, p) => {
            if (v !== null) rule(v, p);
        },
        {
            anyOf: [{ type: 'null' }, rule.jsonSchema],
        },
    );
export const object = (fields: Record<string, Rule>, required: readonly string[] = []): Rule => {
    const properties: Record<string, DeviceJsonSchema> = {};
    for (const [name, rule] of Object.entries(fields)) properties[name] = rule.jsonSchema;
    return define(
        (v, p) => {
            if (!record(v)) return fail(p, 'an object');
            for (const key of required)
                if (!(key in v) || v[key] === undefined) fail(`${p}.${key}`, 'a value');
            for (const [key, rule] of Object.entries(fields))
                if (v[key] !== undefined) rule(v[key], `${p}.${key}`);
        },
        { type: 'object', properties, required, additionalProperties: true },
    );
};
export const array = (rule: Rule, identities = false): Rule =>
    define(
        (v, p) => {
            if (!Array.isArray(v)) return fail(p, 'an array');
            const ids = new Set<string>();
            v.forEach((item: unknown, i: number) => {
                rule(item, `${p}[${i}]`);
                if (identities && record(item) && typeof item.id === 'string') {
                    if (!item.id || ids.has(item.id)) fail(`${p}[${i}].id`, 'a unique nonempty id');
                    ids.add(item.id);
                }
            });
        },
        { type: 'array', items: rule.jsonSchema, 'x-simulator-unique-id': identities },
    );
