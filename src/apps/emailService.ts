import { mailFolderSchema, mailSchema, type Mail } from './contracts.js';
import { addresses, validateRecipients } from './mail.js';

/** A host adapter must preserve the draft ID as its idempotency key. */
export interface SimulatorEmailService {
    send(draft: Mail): Promise<Mail>;
}
/** Local transition only. Persistence is committed by the device repository. */
export const localEmailService: SimulatorEmailService = {
    async send(draft) {
        if (!validateRecipients(draft))
            throw new Error('Enter valid email recipients separated by commas.');
        const sentAt = new Date().toISOString();
        return mailSchema.parse({
            ...draft,
            folder: mailFolderSchema.enum.sent,
            previousFolder: mailFolderSchema.enum.sent,
            to: addresses(draft.to).join(', '),
            cc: addresses(draft.cc).join(', '),
            bcc: addresses(draft.bcc).join(', '),
            createdAt: sentAt,
            updatedAt: sentAt,
        });
    },
};
