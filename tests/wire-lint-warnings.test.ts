import { describe, expect, it, vi } from 'vitest';

vi.mock('@signalsafe/tree-spec', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@signalsafe/tree-spec')>()),
    lintTreeSpecWire: () => [{ severity: 'warning', message: 'advisory only' }],
}));

describe('parseTreeSpecRuntime lint handling', () => {
    it('ignores advisory lint issues', async () => {
        const { parseTreeSpecRuntime } = await import('../src/wire.js');
        const spec = parseTreeSpecRuntime({
            start_node: 'a',
            nodes: { a: { type: 'prompt', prompt: 'x', choices: [{ id: 'go', label: 'Go' }] } },
            transitions: [{ from: ['a', 'go'], to: 'END', outcome: 'safe' }],
        });
        expect(spec.start_node).toBe('a');
    });
});
