import { expect, it } from 'vitest';
import { newMail } from '../src/apps/mail';
import { mailFolderNameSchema, mailSchema } from '../src/apps/contracts';

it('preserves custom folders while reserving system folder aliases', () => {
    expect(mailFolderNameSchema.parse('  Projects  ')).toBe('Projects');
    expect(mailFolderNameSchema.parse('INBOX')).toBe('inbox');
    expect(mailFolderNameSchema.parse('Draft')).toBe('drafts');
    expect(mailFolderNameSchema.parse('outbox')).toBe('sent');
    expect(mailFolderNameSchema.safeParse(' ').success).toBe(false);
    const message = {
        ...newMail('learner@example.test'),
        id: 'custom',
        folder: 'Projects',
        from: 'a@example.test',
        to: 'b@example.test',
        subject: 'Hello',
        body: '',
    };
    expect(mailSchema.parse(message).folder).toBe('Projects');
    expect(
        mailSchema.parse({ ...message, folder: 'trash', previousFolder: 'Projects' })
            .previousFolder,
    ).toBe('Projects');
    expect(mailSchema.safeParse({ ...message, previousFolder: 'TRASH' }).success).toBe(false);
});
