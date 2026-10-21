import { hasOwn } from './guards.js';
import { deviceJsonRule } from './internal/deviceJsonRules.js';
import type { SimulatorDevicePayload } from './devicePayload.js';

const record = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

/** Validate the existing full-device JSON format (unversioned or schema_version: 1). */
export function validateDeviceJson(value: unknown): asserts value is SimulatorDevicePayload {
    if (record(value) && record(value.phone) && hasOwn(value.phone, 'voicemail_transcript')) {
        throw new Error(
            'Removed simulator field phone.voicemail_transcript; migrate it to phone.voicemail.transcript.',
        );
    }
    deviceJsonRule(value, '$');
}
