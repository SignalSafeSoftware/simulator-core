import { z } from 'zod';

export const SIMULATOR_STORAGE_VERSION = 1;
export const MAX_ASSET_BYTES = 5 * 1024 * 1024;
export const MAX_PHOTO_BYTES = 25 * 1024 * 1024;
export const MAX_BACKUP_BYTES = 64 * 1024 * 1024;
const id = z.string().min(1).max(200);
const label = z.string().trim().min(1).max(200);
const timestamp = z.iso.datetime();
export const DEFAULT_VAULT_FOLDER = 'Unfiled';
export const SECRET_TYPES = ['note', 'secret', 'credentials'] as const;
export const secretTypeSchema = z.enum(SECRET_TYPES);
export const secretSchema = z
    .object({
        id,
        title: label,
        type: secretTypeSchema.default('secret'),
        folder: label.default(DEFAULT_VAULT_FOLDER),
        username: z.string().max(500),
        value: z.string().max(10000),
        site: z.string().max(2000),
        notes: z.string().max(10000),
        createdAt: timestamp,
        updatedAt: timestamp,
    })
    .refine((secret) => secret.type === 'note' || secret.value.length > 0, {
        message: 'A secret value is required for secrets and credentials.',
        path: ['value'],
    });
export const photoMetadataSchema = z.object({
    capturedAt: z.union([
        z.literal(''),
        z.iso
            .datetime({ local: true })
            .refine(
                (value) => !value.endsWith('Z'),
                'Use a local capture time and specify its zone separately.',
            ),
    ]),
    timeZone: z
        .string()
        .max(100)
        .refine((value) => {
            if (!value || /^[+-]((0\d|1[0-3]):[0-5]\d|14:00)$/.test(value)) return true;
            try {
                new Intl.DateTimeFormat('en', { timeZone: value });
                return true;
            } catch {
                return false;
            }
        }, 'Use a valid time zone or UTC offset.'),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
});
const storedAssetSchema = z
    .object({
        name: label,
        mime: z.enum(['image/png', 'image/jpeg', 'image/webp', 'text/plain', 'application/pdf']),
        data: z
            .string()
            .regex(
                /^data:(image\/(png|jpeg|webp)|text\/plain|application\/pdf);base64,[A-Za-z0-9+/]*={0,2}$/,
            )
            .max(Math.ceil((MAX_PHOTO_BYTES * 4) / 3) + 100),
    })
    .refine(
        (asset) => asset.data.startsWith(`data:${asset.mime};base64,`),
        'Asset type does not match its data.',
    );
export const assetSchema = storedAssetSchema.refine(
    (asset) => asset.data.length <= Math.ceil((MAX_ASSET_BYTES * 4) / 3) + 100,
    'Attachments must be at most 5 MiB.',
);
export const photoAssetSchema = storedAssetSchema.refine(
    (asset) => asset.mime.startsWith('image/'),
    'Photo must be an image.',
);
export const photoSchema = z.object({
    id,
    title: label,
    caption: z.string().max(10000),
    asset: photoAssetSchema,
    original: photoMetadataSchema,
    metadata: photoMetadataSchema,
    createdAt: timestamp,
    updatedAt: timestamp,
});
export const mailFolderSchema = z.enum(['inbox', 'drafts', 'sent', 'trash']);
export const mailSchema = z.object({
    id,
    threadId: id,
    sourceRecordId: z.string().nullable().default(null),
    folder: mailFolderSchema,
    previousFolder: mailFolderSchema.exclude(['trash']).default(mailFolderSchema.enum.inbox),
    from: z.string().max(500),
    to: z.string().max(2000),
    cc: z.string().max(2000),
    bcc: z.string().max(2000),
    subject: z.string().max(500),
    body: z.string().max(1000000),
    attachments: z.array(assetSchema).max(20),
    read: z.boolean(),
    createdAt: timestamp,
    updatedAt: timestamp,
});
export const lockSchema = z
    .object({
        salt: z.string().regex(/^[a-f0-9]{32}$/),
        digest: z.string().regex(/^[a-f0-9]{64}$/),
    })
    .nullable();
export const simulatorStoreSchema = z
    .object({
        version: z.literal(SIMULATOR_STORAGE_VERSION),
        revision: z.number().int().nonnegative(),
        secrets: z.array(secretSchema).max(1000),
        vaultFolders: z.array(label).max(1000).default([DEFAULT_VAULT_FOLDER]),
        photos: z.array(photoSchema).max(500),
        mail: z.array(mailSchema).max(10000),
        identity: z.email(),
        lock: lockSchema,
    })
    .refine(
        (value) =>
            [value.secrets, value.photos, value.mail].every(
                (records) => new Set(records.map((record) => record.id)).size === records.length,
            ),
        'Duplicate record IDs are not allowed.',
    );
export type SimulatorStore = z.infer<typeof simulatorStoreSchema>;
export type Secret = z.infer<typeof secretSchema>;
export type Photo = z.infer<typeof photoSchema>;
export type PhotoMetadata = z.infer<typeof photoMetadataSchema>;
export type Mail = z.infer<typeof mailSchema>;
export type Asset = z.infer<typeof assetSchema>;
export const emptyMetadata: PhotoMetadata = {
    capturedAt: '',
    timeZone: '',
    latitude: null,
    longitude: null,
};
export function emptySimulatorStore(): SimulatorStore {
    return {
        version: SIMULATOR_STORAGE_VERSION,
        revision: 0,
        secrets: [],
        vaultFolders: [DEFAULT_VAULT_FOLDER],
        photos: [],
        mail: [],
        identity: 'learner@example.test',
        lock: null,
    };
}
