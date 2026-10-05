import { createSimulatorId } from './id.js';
import { z } from 'zod';
import { mailFolderSchema, type Mail } from './contracts.js';
export function addresses(value: string): string[] {
    return [
        ...new Set(
            value
                .split(/[,;]/)
                .map((item) => item.trim().toLowerCase())
                .filter(Boolean),
        ),
    ];
}
export function validateRecipients(mail: Pick<Mail, 'to' | 'cc' | 'bcc'>): boolean {
    const all = [...addresses(mail.to), ...addresses(mail.cc), ...addresses(mail.bcc)];
    return all.length > 0 && all.every((address) => z.email().safeParse(address).success);
}
export function newMail(identity: string): Mail {
    const now = new Date().toISOString();
    const id = createSimulatorId();
    return {
        id,
        threadId: id,
        sourceRecordId: null,
        folder: mailFolderSchema.enum.drafts,
        previousFolder: mailFolderSchema.enum.drafts,
        from: identity,
        to: '',
        cc: '',
        bcc: '',
        subject: '',
        body: '',
        attachments: [],
        read: true,
        createdAt: now,
        updatedAt: now,
    };
}
/** How a reply draft relates to its source message. */
export const ReplyKind = Object.freeze({
    Reply: 'reply',
    ReplyAll: 'reply-all',
    Forward: 'forward',
} as const);
export type ReplyKind = (typeof ReplyKind)[keyof typeof ReplyKind];

function replyRecipients(source: Mail, own: string, kind: ReplyKind) {
    if (kind === ReplyKind.Forward) return [];
    const origin = addresses(source.from).includes(own) ? source.to : source.from;
    return addresses(origin).filter((value) => value !== own);
}
export function replyMail(source: Mail, identity: string, kind: ReplyKind): Mail {
    const own = identity.toLowerCase();
    const to = replyRecipients(source, own, kind);
    const cc =
        kind === ReplyKind.ReplyAll
            ? [...new Set([...addresses(source.to), ...addresses(source.cc)])].filter(
                  (value) => value !== own && !to.includes(value),
              )
            : [];
    return {
        ...newMail(identity),
        sourceRecordId: source.sourceRecordId,
        threadId: kind === ReplyKind.Forward ? createSimulatorId() : source.threadId,
        to: to.join(', '),
        cc: cc.join(', '),
        subject: `${kind === ReplyKind.Forward ? 'Fwd' : 'Re'}: ${source.subject.replace(/^(Re|Fwd):\s*/i, '')}`,
        body: `\n\n--- ${source.from} ---\n${source.body}`,
        attachments: kind === ReplyKind.Forward ? source.attachments : [],
    };
}

/** Draft edits change their order; read state and folder moves do not. */
export function mailTime(mail: Mail): string {
    return mail.folder === mailFolderSchema.enum.drafts ||
        (mail.folder === mailFolderSchema.enum.trash &&
            mail.previousFolder === mailFolderSchema.enum.drafts)
        ? mail.updatedAt
        : mail.createdAt;
}
export function sortMail(mail: readonly Mail[]): Mail[] {
    return [...mail].sort(
        (a, b) => Date.parse(mailTime(b)) - Date.parse(mailTime(a)) || a.id.localeCompare(b.id),
    );
}
