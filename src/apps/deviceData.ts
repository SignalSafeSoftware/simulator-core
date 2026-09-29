import type { SimulatorStore, Secret, Photo, Mail } from './contracts.js';
export type DeviceCollection = 'secrets' | 'photos' | 'mail';
export interface DeviceRecords {
    secrets: Secret;
    photos: Photo;
    mail: Mail;
}
export type DeviceMetadata = Omit<SimulatorStore, DeviceCollection>;
export interface DeviceSummary {
    metadata: DeviceMetadata;
    counts: {
        secrets: Record<string, number>;
        photos: number;
        mail: Record<string, number>;
    };
}
export interface DeviceQuery {
    folder?: string;
    search?: string;
    threadId?: string;
    offset?: number;
    limit?: number;
}
export interface DeviceRecordPage<T> {
    records: T[];
    total: number;
    revision: number;
}
export interface DeviceCollectionRepository {
    summary(): Promise<DeviceSummary>;
    page<K extends DeviceCollection>(
        this: void,
        collection: K,
        query: DeviceQuery,
    ): Promise<DeviceRecordPage<DeviceRecords[K]>>;
    get<K extends DeviceCollection>(
        this: void,
        collection: K,
        id: string,
    ): Promise<DeviceRecords[K] | null>;
    put<K extends DeviceCollection>(
        this: void,
        revision: number,
        collection: K,
        record: DeviceRecords[K],
    ): Promise<DeviceSummary>;
    remove(revision: number, collection: DeviceCollection, id: string): Promise<DeviceSummary>;
    metadata(revision: number, metadata: DeviceMetadata): Promise<DeviceSummary>;
    folder(
        revision: number,
        from: string | null,
        to: string | null,
        destination: string,
    ): Promise<DeviceSummary>;
}
export function deviceMetadata({
    secrets: _secrets,
    photos: _photos,
    mail: _mail,
    ...metadata
}: SimulatorStore): DeviceMetadata {
    return metadata;
}
export function summarizeDevice(state: SimulatorStore): DeviceSummary {
    const secrets: Record<string, number> = {};
    const mail: Record<string, number> = {};
    for (const record of state.secrets) secrets[record.folder] = (secrets[record.folder] ?? 0) + 1;
    for (const record of state.mail) mail[record.folder] = (mail[record.folder] ?? 0) + 1;
    return {
        metadata: deviceMetadata(state),
        counts: { secrets, mail, photos: state.photos.length },
    };
}
