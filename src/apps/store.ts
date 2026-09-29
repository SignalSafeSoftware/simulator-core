import type { SimulatorStore } from './contracts.js';
import type {
    DeviceCollection,
    DeviceCollectionRepository,
    DeviceRecords,
    DeviceMetadata,
    DeviceSummary,
} from './deviceData.js';
/** A host owns persistence, revision conflicts, requests and error reporting. */
export interface DeviceStore {
    data: DeviceMetadata | null;
    counts?: DeviceSummary['counts'];
    error: string;
    busy: boolean;
    reload: () => Promise<void>;
    page: DeviceCollectionRepository['page'];
    get: DeviceCollectionRepository['get'];
    save: (metadata: DeviceMetadata) => Promise<boolean>;
    put: <K extends DeviceCollection>(collection: K, record: DeviceRecords[K]) => Promise<boolean>;
    remove: (collection: DeviceCollection, id: string) => Promise<boolean>;
    folder: (from: string | null, to: string | null, destination: string) => Promise<boolean>;
    exportBackup: () => Promise<SimulatorStore>;
    restore: (state: SimulatorStore) => Promise<boolean>;
}
