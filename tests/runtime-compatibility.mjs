import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createInitialTreeSpecSession, dispatchTreeSpecChoice, serializeTreeSpecSession, restoreTreeSpecSession } from '@signalsafe/simulator-core';

const require = createRequire(import.meta.url);
const manifest = JSON.parse(readFileSync(resolve(dirname(require.resolve('@signalsafe/simulator-core')), '../package.json'), 'utf8'));
assert.equal(manifest.version, '0.3.2');
assert.equal(manifest.engines.node, '>=19.0.0');
const wire = {
    start_node: 'a',
    nodes: {
        a: { type: 'prompt', prompt: 'Start', choices: [{ id: 'go', label: 'Go' }] },
        b: { type: 'prompt', prompt: 'Finish', choices: [{ id: 'end', label: 'End' }] },
    },
    transitions: [
        { from: ['a', 'go'], to: 'b', delta: { total: 2 } },
        { from: ['b', 'end'], to: 'END', outcome: 'safe', delta: { total: 3 } },
    ],
};
const initial = createInitialTreeSpecSession(wire);
const continued = dispatchTreeSpecChoice(initial, 'a', 'go');
assert.equal(continued.status, 'continue');
assert.equal(initial.currentNodeId, 'a');
assert.equal(continued.state.currentNodeId, 'b');
const ended = dispatchTreeSpecChoice(continued.state, 'b', 'end');
assert.equal(ended.status, 'ended');
assert.equal(ended.outcome, 'safe');
assert.equal(ended.state.cumulativeScore.total, 5);
const restored = restoreTreeSpecSession(wire, serializeTreeSpecSession(continued.state));
assert.equal(restored.currentNodeId, 'b');
assert.deepEqual(restored.history, continued.state.history);
assert.throws(() => restoreTreeSpecSession(wire, { version: 2, history: [] }));
assert.equal(manifest.dependencies['@signalsafe/tree-spec'], '^0.4.1');
console.log(`Runtime compatibility passed on ${process.version}`);
