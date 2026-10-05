import { describe, expect, it } from 'vitest';
import { SimulatorApp, isSimulatorApp } from '../src/simulatorApp.js';
import { isSimulatorDevicePayload } from '../src/devicePayloadGuards.js';

// Explicit wire values catch accidental changes to persisted payloads and links.
const wireApps = ['email', 'messages', 'internet', 'phone', 'home'];

describe('canonical simulator app IDs', () => {
    it('preserves the existing JSON values and diagnostic traversal order', () => {
        expect(Object.values(SimulatorApp)).toEqual(wireApps);
        expect(Object.isFrozen(SimulatorApp)).toBe(true);
    });

    it.each(wireApps)('accepts %s at both app and device payload boundaries', (app) => {
        expect(isSimulatorApp(app)).toBe(true);
        expect(isSimulatorDevicePayload({ entry_point: { app, screen: 'example' } })).toBe(true);
    });

    it.each([
        undefined,
        null,
        0,
        {},
        [],
        '',
        'Phone',
        'PHONE',
        ' phone ',
        'sms',
        'browser',
        'contacts',
        'history',
        'photos',
        'toString',
        'constructor',
        '__proto__',
    ])('rejects invalid app ID %j', (app) => {
        expect(isSimulatorApp(app)).toBe(false);
        expect(isSimulatorDevicePayload({ entry_point: { app, screen: 'example' } })).toBe(false);
    });

    it('validates menu apps using the same closed set', () => {
        const payload = {
            entry_point: { app: SimulatorApp.Home, screen: 'home' },
            device: { main_menu_items: [{ id: 'custom-label', label: 'Mail', app: 'sms' }] },
        };
        expect(isSimulatorDevicePayload(payload)).toBe(false);
        payload.device.main_menu_items[0]!.app = SimulatorApp.Email;
        expect(isSimulatorDevicePayload(payload)).toBe(true);
        expect(JSON.parse(JSON.stringify(payload)).entry_point.app).toBe('home');
    });
});
