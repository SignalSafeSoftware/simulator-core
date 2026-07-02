import { isRecord } from "@signalsafe/tree-spec";
import type { SimulatorDevicePayload } from "./devicePayload.js";

/** True when payload has a full-device `entry_point.app` string. */
export function hasDeviceEntryPoint(payload: Record<string, unknown>): boolean {
    const entryPoint = payload.entry_point;
    return isRecord(entryPoint) && typeof entryPoint.app === "string";
}

/** Non-empty device payload with a valid entry point. */
export function isSimulatorDevicePayload(payload: unknown): payload is SimulatorDevicePayload {
    return isRecord(payload) && Object.keys(payload).length > 0 && hasDeviceEntryPoint(payload);
}
