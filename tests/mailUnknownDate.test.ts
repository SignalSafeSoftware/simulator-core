import { expect, it } from 'vitest';
import { newMail, mailTime, sortMail } from '../src/apps/mail';
import { mailSchema } from '../src/apps/contracts';
import { localEmailService } from '../src/apps/emailService';
it('preserves an explicit unknown date, retains existing mail dates, and dates a sent draft', async () => {
    const normal = { ...newMail('learner@example.test'), folder: 'inbox' as const };
    const unknown = mailSchema.parse({ ...normal, id: 'unknown', sentAt: null });
    expect(mailTime(unknown)).toBe('');
    expect(mailTime(normal)).toBe(normal.createdAt);
    expect(sortMail([unknown, normal]).map((mail) => mail.id)).toEqual([normal.id, unknown.id]);
    const sent = await localEmailService.send({ ...unknown, to: 'recipient@example.test' });
    expect(sent.sentAt).toBe(sent.createdAt);
    expect(mailTime(sent)).not.toBe('');
});
