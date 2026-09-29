import type { SimulatorDevicePayload } from './devicePayload.js';

type Rule = (value: unknown, path: string) => void;
const fail = (path: string, expected: string): never => {
    throw new Error(`Invalid simulator JSON at ${path}: expected ${expected}.`);
};
const record = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value);
const text: Rule = (v, p) => {
    if (typeof v !== 'string') fail(p, 'a string');
};
const boolean: Rule = (v, p) => {
    if (typeof v !== 'boolean') fail(p, 'a boolean');
};
const number: Rule = (v, p) => {
    if (typeof v !== 'number' || !Number.isFinite(v)) fail(p, 'a finite number');
};
const oneOf =
    (...values: readonly string[]): Rule =>
    (v, p) => {
        if (typeof v !== 'string' || !values.includes(v)) fail(p, values.join(' | '));
    };
const nullable =
    (rule: Rule): Rule =>
    (v, p) => {
        if (v !== null) rule(v, p);
    };
const object =
    (fields: Record<string, Rule>, required: readonly string[] = []): Rule =>
    (v, p) => {
        if (!record(v)) return fail(p, 'an object');
        for (const key of required) if (!(key in v)) fail(`${p}.${key}`, 'a value');
        for (const [key, rule] of Object.entries(fields))
            if (v[key] !== undefined) rule(v[key], `${p}.${key}`);
    };
const array =
    (rule: Rule, identities = false): Rule =>
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
    };
const app = oneOf('phone', 'email', 'messages', 'internet', 'home');
const link = object({ href: text, text, title: text }, ['href', 'text']);
const emailFields = {
    id: text,
    subject: text,
    from: text,
    from_addr: text,
    from_display_name: text,
    to: text,
    cc: text,
    date_at: text,
    unread: boolean,
    body: text,
    snippet: text,
    bcc: text,
    reply_to: text,
    return_path: text,
    links: array(link),
    attachment_name: text,
    attachment_type: text,
    attachment_behavior: text,
};
const schema = object(
    {
        schema_version: (v, p) => {
            if (v !== 1) fail(p, 'schema version 1');
        },
        entry_point: object({ app, screen: text }, ['app', 'screen']),
        device: object({
            main_menu_items: array(object({ id: text, label: text, app }, ['id', 'label']), true),
            secondary_defaults: object({
                phone: text,
                email: text,
                messages: text,
                internet: text,
                home: text,
            }),
        }),
        contacts: array(
            object(
                {
                    id: text,
                    display_name: text,
                    number: text,
                    email: text,
                    phone_numbers: array(
                        object({ label: text, value: text, number: text }, ['label', 'value']),
                    ),
                    email_addresses: array(
                        object({ label: text, value: text, number: text }, ['label', 'value']),
                    ),
                },
                ['id', 'display_name'],
            ),
            true,
        ),
        directory: array(
            object(
                {
                    id: text,
                    label: text,
                    contact_id: nullable(text),
                    number: nullable(text),
                    url: nullable(text),
                    description: nullable(text),
                },
                ['id', 'label'],
            ),
            true,
        ),
        phone: object({
            history: array(
                object(
                    {
                        id: text,
                        number: text,
                        name: text,
                        direction: oneOf('in', 'out', 'missed', 'voicemail'),
                        timestamp: text,
                    },
                    ['id'],
                ),
                true,
            ),
            contacts: array(text),
            dial: object({ digits: text }),
            incoming_call: nullable(
                object({
                    phone_number: text,
                    caller_name: text,
                    caller_title: text,
                    transcript: text,
                    avatar_url: text,
                }),
            ),
            voicemail: object({
                transcript: text,
                caller_name: text,
                timestamp: text,
            }),
            voicemail_transcript: text,
        }),
        email: object({
            messages: array(
                object({ ...emailFields, folder_id: text }, ['id', 'folder_id', 'subject', 'from']),
                true,
            ),
            detail: nullable(object(emailFields, ['id', 'subject', 'from', 'body'])),
        }),
        messages: object({
            threads: array(
                object(
                    {
                        id: text,
                        contact_name: text,
                        contact_number: text,
                        snippet: text,
                        last_at: text,
                        unread: boolean,
                    },
                    ['id'],
                ),
                true,
            ),
            thread_detail: nullable(
                object(
                    {
                        id: text,
                        sender_display_name: text,
                        sender_number: text,
                        last_at: text,
                        unread: boolean,
                        messages: array(
                            object(
                                {
                                    id: text,
                                    from: oneOf('them', 'me'),
                                    text,
                                    delay_seconds: number,
                                    timestamp: text,
                                    attachment: object({ label: text, url: text }, ['label']),
                                },
                                ['from', 'text'],
                            ),
                        ),
                    },
                    ['messages'],
                ),
            ),
        }),
        internet: object({
            pages: array(
                object(
                    {
                        id: text,
                        url: text,
                        title: text,
                        layout: text,
                        content: text,
                        submit_target_page_id: nullable(text),
                        logo_url: nullable(text),
                        warning_banner: nullable(text),
                        show_media_placeholder: boolean,
                        buttons: array(
                            object({
                                label: text,
                                href: text,
                                targetPageId: text,
                                target_page_id: text,
                            }),
                        ),
                    },
                    ['id', 'url', 'title'],
                ),
                true,
            ),
            forms: array(
                object(
                    {
                        id: text,
                        page_id: text,
                        fields: array(
                            object(
                                {
                                    name: text,
                                    type: oneOf('text', 'password', 'email'),
                                    label: text,
                                },
                                ['name', 'type', 'label'],
                            ),
                        ),
                    },
                    ['id', 'fields'],
                ),
                true,
            ),
        }),
        home: object({
            home: object({
                widgets: array(object({ id: text, type: text, label: text }, ['id']), true),
            }),
            store: object({
                featured_apps: array(object({ id: text, name: text }, ['id', 'name']), true),
            }),
            settings: object({
                sections: array(object({ id: text, title: text }, ['id', 'title']), true),
            }),
        }),
    },
    ['entry_point'],
);

/** Validate the existing full-device JSON format (unversioned or schema_version: 1). */
export function validateDeviceJson(value: unknown): asserts value is SimulatorDevicePayload {
    schema(value, '$');
}
