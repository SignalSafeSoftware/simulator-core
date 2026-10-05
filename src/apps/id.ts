/** Sets the RFC 4122 version (4) and variant bits on their bytes. */
function uuidByte(value: number, index: number): number {
    if (index === 6) return (value & 0x0f) | 0x40;
    if (index === 8) return (value & 0x3f) | 0x80;
    return value;
}

/** Custom HTTP development domains do not expose crypto.randomUUID. */
export function createSimulatorId(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    const hex = Array.from(bytes, (value, index) =>
        uuidByte(value, index).toString(16).padStart(2, '0'),
    ).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
