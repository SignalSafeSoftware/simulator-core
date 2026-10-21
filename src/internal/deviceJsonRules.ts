import { SimulatorApp } from '../simulatorApp.js';
import {
    define,
    fail,
    text,
    boolean,
    number,
    durationSeconds,
    oneOf,
    nullable,
    object,
    array,
} from './deviceJsonRule.js';
import type { DeviceJsonSchema } from './deviceJsonRule.js';

const app = oneOf(...Object.values(SimulatorApp));
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
export const deviceJsonRule = object(
    {
        schema_version: define(
            (v, p) => {
                if (v !== 1) fail(p, 'schema version 1');
            },
            { const: 1 },
        ),
        entry_point: object({ app, screen: text }, ['app', 'screen']),
        device: object({
            main_menu_items: array(object({ id: text, label: text, app }, ['id', 'label']), true),
            secondary_defaults: object(
                Object.fromEntries(Object.values(SimulatorApp).map((id) => [id, text])),
            ),
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
                        duration_seconds: durationSeconds,
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

/** Offline schema export from the same rule declarations used by the public validator. */
export const deviceJsonSchema: DeviceJsonSchema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    ...deviceJsonRule.jsonSchema,
    not: {
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
    },
};
