import { describe, expect, it } from 'vitest';
import { END_NODE_ID, type TreeSpecWire } from '@signalsafe/tree-spec';
import {
    MAX_ASSET_BYTES,
    assetSchema,
    emptySimulatorStore,
    mailSchema,
    photoAssetSchema,
    photoMetadataSchema,
} from '../src/apps/contracts.js';
import { summarizeDevice } from '../src/apps/deviceData.js';
import { localEmailService } from '../src/apps/emailService.js';
import { addresses, mailTime, newMail, replyMail, sortMail } from '../src/apps/mail.js';
import { isEmailScreen, isHomeScreen, isMessagesScreen } from '../src/devicePayload.js';
import { expectTerminalOutcome } from '../src/guards.js';
import { getTreeSpecNodeView, resolveFeedbackForTransition } from '../src/nodeView.js';
import { createInitialTreeSpecSession, restoreTreeSpecSession } from '../src/session.js';
import { validateDeviceJson } from '../src/validateDeviceJson.js';
import { findTransitionForChoice, getWireChoices, parseTreeSpecRuntime } from '../src/wire.js';

const entry = { app: 'phone', screen: 'history' };

describe('validateDeviceJson rules', () => {
    it.each([
        ['text', { entry_point: { app: 'phone', screen: 5 } }, 'a string'],
        ['app', { entry_point: { app: 'nope', screen: 'x' } }, 'phone'],
        ['object', { entry_point: 'phone' }, 'an object'],
        ['required', { entry_point: { app: 'phone' } }, 'a value'],
        ['array', { entry_point: entry, contacts: {} }, 'an array'],
        [
            'duplicate ids',
            {
                entry_point: entry,
                contacts: [
                    { id: 'c', display_name: 'A' },
                    { id: 'c', display_name: 'B' },
                ],
            },
            'unique',
        ],
        ['empty id', { entry_point: entry, contacts: [{ id: '', display_name: 'A' }] }, 'unique'],
        [
            'boolean',
            {
                entry_point: entry,
                email: { detail: { id: '1', subject: 's', from: 'f', body: 'b', unread: 'yes' } },
            },
            'a boolean',
        ],
        [
            'number',
            {
                entry_point: entry,
                messages: {
                    thread_detail: { messages: [{ from: 'me', text: 't', delay_seconds: 'x' }] },
                },
            },
            'a finite number',
        ],
        [
            'oneOf',
            {
                entry_point: entry,
                messages: { thread_detail: { messages: [{ from: 'you', text: 't' }] } },
            },
            'them',
        ],
        ['schema version', { entry_point: entry, schema_version: 2 }, 'schema version 1'],
        [
            'removed field',
            { entry_point: entry, phone: { voicemail_transcript: 'x' } },
            'voicemail.transcript',
        ],
    ])('rejects %s', (_name, payload, message) => {
        expect(() => validateDeviceJson(payload)).toThrow(message);
    });

    it('accepts null for nullable fields and valid typed values', () => {
        expect(() =>
            validateDeviceJson({
                schema_version: 1,
                entry_point: entry,
                email: { detail: null },
                messages: {
                    thread_detail: {
                        unread: true,
                        messages: [{ from: 'them', text: 't', delay_seconds: 2 }],
                    },
                },
            }),
        ).not.toThrow();
    });
});

describe('mail helpers', () => {
    const source = {
        ...newMail('me@example.test'),
        from: 'a@example.test',
        to: 'me@example.test, b@example.test',
        cc: 'c@example.test',
        subject: 'Re: Plan',
        body: 'Body',
        threadId: 'thread-1',
    };

    it('builds reply, reply-all and forward drafts', () => {
        const reply = replyMail(source, 'me@example.test', 'reply');
        expect(reply.to).toBe('a@example.test');
        expect(reply.threadId).toBe('thread-1');
        expect(reply.subject).toBe('Re: Plan');
        const outgoing = replyMail(
            { ...source, from: 'me@example.test' },
            'me@example.test',
            'reply',
        );
        expect(outgoing.to).toBe('b@example.test');
        const all = replyMail(source, 'me@example.test', 'reply-all');
        expect(all.cc).toBe('b@example.test, c@example.test');
        const forward = replyMail(source, 'me@example.test', 'forward');
        expect(forward.to).toBe('');
        expect(forward.subject).toBe('Fwd: Plan');
        expect(forward.threadId).not.toBe('thread-1');
    });

    it('orders mail by the time that matters for its folder', () => {
        const base = newMail('me@example.test');
        const draft = {
            ...base,
            id: 'a',
            folder: 'drafts' as const,
            updatedAt: '2026-02-01T00:00:00.000Z',
            createdAt: '2026-01-01T00:00:00.000Z',
        };
        const trashedDraft = {
            ...draft,
            id: 'b',
            folder: 'trash' as const,
            previousFolder: 'drafts' as const,
        };
        const inbox = { ...draft, id: 'c', folder: 'inbox' as const };
        expect(mailTime(draft)).toBe(draft.updatedAt);
        expect(mailTime(trashedDraft)).toBe(draft.updatedAt);
        expect(mailTime(inbox)).toBe(draft.createdAt);
        expect(sortMail([inbox, draft, trashedDraft]).map((item) => item.id)).toEqual([
            'a',
            'b',
            'c',
        ]);
    });

    it('splits address lists', () => {
        expect(addresses(' a@x.test, ,b@x.test ')).toEqual(['a@x.test', 'b@x.test']);
    });

    it('sends only mail with valid recipients', async () => {
        const draft = { ...newMail('me@example.test'), to: 'not an address' };
        await expect(localEmailService.send(draft)).rejects.toThrow('valid email recipients');
        const sent = await localEmailService.send({ ...draft, to: 'A@Example.test' });
        expect(sent.folder).toBe('sent');
        expect(() => mailSchema.parse(sent)).not.toThrow();
    });
});

describe('store contracts', () => {
    it('validates photo time zones and offsets', () => {
        const base = { capturedAt: '', latitude: null, longitude: null };
        expect(photoMetadataSchema.safeParse({ ...base, timeZone: '' }).success).toBe(true);
        expect(photoMetadataSchema.safeParse({ ...base, timeZone: '+05:30' }).success).toBe(true);
        expect(photoMetadataSchema.safeParse({ ...base, timeZone: 'Europe/Paris' }).success).toBe(
            true,
        );
        expect(photoMetadataSchema.safeParse({ ...base, timeZone: 'Not/AZone' }).success).toBe(
            false,
        );
        expect(
            photoMetadataSchema.safeParse({
                ...base,
                capturedAt: '2026-01-01T10:00:00Z',
                timeZone: '',
            }).success,
        ).toBe(false);
    });

    it('rejects mismatched, oversized and non-image assets', () => {
        const png = { name: 'a.png', mime: 'image/png', data: 'data:image/png;base64,AAAA' };
        expect(assetSchema.safeParse(png).success).toBe(true);
        expect(assetSchema.safeParse({ ...png, mime: 'image/jpeg' }).success).toBe(false);
        const huge = `data:application/pdf;base64,${'A'.repeat(Math.ceil((MAX_ASSET_BYTES * 4) / 3) + 200)}`;
        expect(
            assetSchema.safeParse({ name: 'a.pdf', mime: 'application/pdf', data: huge }).success,
        ).toBe(false);
        const pdf = {
            name: 'a.pdf',
            mime: 'application/pdf',
            data: 'data:application/pdf;base64,AAAA',
        };
        expect(photoAssetSchema.safeParse(pdf).success).toBe(false);
        expect(photoAssetSchema.safeParse(png).success).toBe(true);
    });

    it('counts secrets and mail per folder', () => {
        const store = emptySimulatorStore();
        store.mail.push(
            { ...newMail('me@example.test'), folder: 'inbox' },
            { ...newMail('me@example.test'), id: 'two', folder: 'inbox' },
        );
        expect(summarizeDevice(store).counts.mail).toMatchObject({ inbox: 2 });
    });
});

describe('screen id guards', () => {
    it('recognize built-in ids only', () => {
        expect(isEmailScreen('list')).toBe(true);
        expect(isEmailScreen('nope')).toBe(false);
        expect(isMessagesScreen('threads')).toBe(true);
        expect(isMessagesScreen(4)).toBe(false);
        expect(isHomeScreen('store')).toBe(true);
        expect(isHomeScreen('page-1')).toBe(false);
    });
});

const wire = (): TreeSpecWire => ({
    start_node: 'a',
    nodes: {
        a: { type: 'prompt', prompt: 'Start', choices: [{ id: 'go', label: 'Go' }] },
        plain: {},
    },
    transitions: [{ from: ['a', 'go'], to: END_NODE_ID, outcome: 'safe', delta: { total: 1 } }],
});

describe('tree spec runtime guards', () => {
    it('rejects non-terminal outcomes', () => {
        expect(expectTerminalOutcome('safe')).toBe('safe');
        expect(() => expectTerminalOutcome('maybe')).toThrow('valid outcome');
    });

    it('describes nodes and reports missing ones', () => {
        expect(getTreeSpecNodeView(wire(), 'plain')).toMatchObject({
            type: 'prompt',
            prompt: '',
            choices: [],
        });
        expect(() => getTreeSpecNodeView(wire(), 'missing')).toThrow('Missing node');
        expect(resolveFeedbackForTransition(wire(), 'missing', 'go', undefined)).toBeNull();
        expect(resolveFeedbackForTransition(wire(), 'plain', 'go', undefined)).toBeNull();
    });

    it('rejects malformed session snapshots', () => {
        const spec = wire();
        for (const [snapshot, message] of [
            [null, 'must be an object'],
            [[], 'must be an object'],
            [{ version: 2, history: [] }, 'Unsupported'],
            [{ version: 1, history: 'x' }, 'must be an array'],
            [{ version: 1, history: [null] }, 'entries must be objects'],
            [{ version: 1, history: [[]] }, 'entries must be objects'],
            [{ version: 1, history: [{ nodeId: 'a' }] }, 'require nodeId and choiceId'],
            [
                { version: 1, history: [{ nodeId: ' ', choiceId: 'go' }] },
                'require nodeId and choiceId',
            ],
            [
                { version: 1, history: [{ nodeId: 'a', choiceId: '' }] },
                'require nodeId and choiceId',
            ],
        ] as const) {
            expect(() => restoreTreeSpecSession(spec, snapshot)).toThrow(message);
        }
        expect(createInitialTreeSpecSession(spec).currentNodeId).toBe('a');
    });

    it('validates transitions while parsing', () => {
        const base = wire();
        const parse = (transitions: unknown) => () =>
            parseTreeSpecRuntime({ ...base, transitions });
        expect(parse('x')).toThrow('must be an array');
        expect(parse([1])).toThrow('must be an object');
        expect(parse([{ from: ['a'], to: END_NODE_ID }])).toThrow('[node_id, choice_id]');
        expect(parse([{ from: ['a', 'go'], to: END_NODE_ID, outcome: 'maybe' }])).toThrow();
        expect(parse([{ from: ['ghost', 'go'], to: END_NODE_ID, outcome: 'safe' }])).toThrow(
            'unknown node',
        );
        expect(parse([{ from: ['a', 'nope'], to: END_NODE_ID, outcome: 'safe' }])).toThrow(
            'unknown choice',
        );
        expect(() =>
            parseTreeSpecRuntime({
                ...base,
                nodes: { ...base.nodes, empty: null },
                transitions: [{ from: ['empty', 'go'], to: END_NODE_ID, outcome: 'safe' }],
            }),
        ).toThrow('unknown choice');
        expect(parse([{ from: [undefined, 'go'], to: END_NODE_ID, outcome: 'safe' }])).toThrow(
            'unknown node',
        );
        expect(parse([{ from: ['a', 'go'], to: 'ghost' }])).toThrow('unknown target node');
        expect(parseTreeSpecRuntime({ ...base, wire_version: undefined })).toMatchObject({
            start_node: 'a',
        });
        expect(() => parseTreeSpecRuntime({ ...base, start_node: 'ghost' })).toThrow();
        expect(() => parseTreeSpecRuntime({ ...base, wire_version: 99 })).toThrow(
            'Unsupported wire_version',
        );
        expect(() => parseTreeSpecRuntime({ ...base, wire_version: { v: 1 } })).toThrow(
            'Unsupported wire_version {"v":1}',
        );
        expect(parse([{ from: ['a', 'go'], to: 5 }])).toThrow('unknown target node');
        expect(parse([{ from: ['a', 'go'], to: {} }])).toThrow('unknown target node');
    });

    it('reads choices and finds transitions', () => {
        expect(getWireChoices({})).toEqual([]);
        expect(findTransitionForChoice(wire(), 'a', 'go').to).toBe(END_NODE_ID);
        expect(() => findTransitionForChoice(wire(), 'a', 'nope')).toThrow('Missing transition');
    });
});
