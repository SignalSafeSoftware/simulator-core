/** Stable app IDs shared by device payloads, navigation and rendering. */
export const SimulatorApp = Object.freeze({
    Email: 'email',
    Messages: 'messages',
    Internet: 'internet',
    Phone: 'phone',
    Home: 'home',
} as const);

/** Retains string-literal compatibility for JSON payloads and existing callers. */
export type SimulatorApp = (typeof SimulatorApp)[keyof typeof SimulatorApp];

const simulatorApps: ReadonlySet<string> = new Set(Object.values(SimulatorApp));

/** Validate untrusted app IDs without casting or accepting channel/screen names. */
export function isSimulatorApp(value: unknown): value is SimulatorApp {
    return typeof value === 'string' && simulatorApps.has(value);
}
