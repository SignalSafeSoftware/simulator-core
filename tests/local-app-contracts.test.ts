import { describe, expect, it } from 'vitest';
import {
    emptySimulatorStore,
    simulatorStoreSchema,
    secretSchema,
    photoMetadataSchema,
} from '../src/apps/contracts.js';
import {
    browserActionSchema,
    BROWSER_ACTION_TYPE,
    BROWSER_ACTION_VERSION,
} from '../src/apps/browserProtocol.js';
import { newMail, replyMail } from '../src/apps/mail.js';
import { localEmailService } from '../src/apps/emailService.js';
import { summarizeDevice } from '../src/apps/deviceData.js';

describe('portable local-app contracts', () => {
    it('retains versioned records, counts and source-independent validation', () => {
        const state = emptySimulatorStore();
        const secret = secretSchema.parse({
            id: 's',
            title: 'Synthetic',
            username: '',
            value: 'test-only',
            site: '',
            notes: '',
            createdAt: '2026-09-29T00:00:00Z',
            updatedAt: '2026-09-29T00:00:00Z',
        });
        state.secrets = [secret];
        expect(summarizeDevice(state).counts.secrets.Unfiled).toBe(1);
        expect(
            simulatorStoreSchema.safeParse({ ...state, secrets: [secret, secret] }).success,
        ).toBe(false);
        expect(
            photoMetadataSchema.parse({ capturedAt: '', timeZone: '', latitude: 0, longitude: 0 })
                .latitude,
        ).toBe(0);
    });
    it('sends locally under the draft identity and excludes self/BCC from reply-all', async () => {
        const draft = {
            ...newMail('self@example.test'),
            to: 'friend@example.test',
            cc: 'other@example.test',
            bcc: 'private@example.test',
        };
        const sent = await localEmailService.send(draft);
        expect(sent.id).toBe(draft.id);
        expect(sent.folder).toBe('sent');
        const reply = replyMail(
            { ...sent, from: 'friend@example.test', to: 'self@example.test, friend@example.test' },
            'self@example.test',
            'reply-all',
        );
        expect(reply.to).not.toContain('self@example.test');
        expect(reply.bcc).toBe('');
        expect(reply.cc).toBe('other@example.test');
    });
    it('validates the browser bridge envelope without DOM or host imports', () => {
        const action = {
            type: BROWSER_ACTION_TYPE,
            version: BROWSER_ACTION_VERSION,
            pageId: 'test',
            session: 's',
            action: 'search',
            event: 'submit',
            values: { query: 'synthetic' },
        };
        expect(browserActionSchema.safeParse(action).success).toBe(true);
        expect(browserActionSchema.safeParse({ ...action, version: 999 }).success).toBe(false);
        expect(browserActionSchema.safeParse({ ...action, unwanted: true }).success).toBe(false);
    });
});
