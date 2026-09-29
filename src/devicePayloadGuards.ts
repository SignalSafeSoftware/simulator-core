import { validateDeviceJson } from './validateDeviceJson.js';
import { isRecord } from '@signalsafe/tree-spec';
import type { SimulatorDevicePayload } from './devicePayload.js';

/** True when payload has a full-device `entry_point.app` string. */
export function hasDeviceEntryPoint(payload: Record<string, unknown>): boolean {
    const entryPoint = payload.entry_point;
    return isRecord(entryPoint) && typeof entryPoint.app === 'string';
}

/** Validate all known device fields before promising the canonical payload type. */
export function isSimulatorDevicePayload(payload: unknown): payload is SimulatorDevicePayload {
    try {
        validateDeviceJson(payload);
        return true;
    } catch {
        return false;
    }
}
