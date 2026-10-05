import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migrateSimulatorInput } from './migrate-input-json.mjs';

test('migrates exported tree, device and session data without mutating the original', () => {
    const input = {
        tree: {
            start_node: 'a',
            nodes: { a: { options: [{ id: 'go', label: 'Go' }] } },
            transitions: [{ from: ['a', 'go'], to: '__END__' }],
        },
        simulator: {
            entry_point: { app: 'phone', screen: 'voicemail' },
            phone: { voicemail_transcript: 'Keep me' },
            internet: { pages: [{ buttons: [{ targetPageId: 'Next' }] }] },
        },
        session: {
            templateId: 1,
            phone: {
                callHistory: [
                    { id: 'a', label: 'Missed' },
                    { id: 'b', kind: 'outgoing', label: 'Missed' },
                ],
            },
        },
        unrelated: { options: ['Keep'], targetPageId: 'Keep' },
    };
    const before = structuredClone(input);
    const result = migrateSimulatorInput(input);
    assert.deepEqual(input, before);
    assert.equal(result.changes.length, 5);
    assert.equal(result.value.tree.transitions[0].to, 'END');
    assert.deepEqual(result.value.tree.nodes.a.choices, input.tree.nodes.a.options);
    assert.deepEqual(result.value.simulator.phone, { voicemail: { transcript: 'Keep me' } });
    assert.equal(result.value.simulator.internet.pages[0].buttons[0].target_page_id, 'Next');
    assert.equal(result.value.session.phone.callHistory[0].kind, 'missed');
    assert.equal(result.value.session.phone.callHistory[1].kind, 'outgoing');
    assert.deepEqual(result.value.unrelated, input.unrelated);
    assert.deepEqual(migrateSimulatorInput(result.value).changes, []);
});

test('refuses conflicting data instead of dropping it', () => {
    assert.throws(
        () =>
            migrateSimulatorInput({
                start_node: 'a',
                nodes: { a: { options: [1], choices: [2] } },
                transitions: [],
            }),
        /Conflicting/,
    );
    assert.throws(
        () =>
            migrateSimulatorInput({
                entry_point: {},
                phone: { voicemail: { transcript: 'New' }, voicemail_transcript: 'Old' },
            }),
        /Conflicting/,
    );
    assert.throws(
        () =>
            migrateSimulatorInput({
                entry_point: {},
                internet: { pages: [{ buttons: [{ targetPageId: 'A', target_page_id: 'B' }] }] },
            }),
        /Conflicting/,
    );
});

test('migrates durations without guessing invalid values and marks unknown directions explicitly', () => {
    const result = migrateSimulatorInput({
        templateId: 1,
        phone: {
            callHistory: [
                { id: 'a', duration: '1:05', label: 'Imported' },
                { id: 'b', kind: 'incoming', duration: ' ' },
            ],
        },
    });
    assert.deepEqual(result.value.phone.callHistory, [
        { id: 'a', durationSeconds: 65, kind: 'unknown', label: 'Imported' },
        { id: 'b', kind: 'incoming', durationSeconds: null },
    ]);
    assert.deepEqual(migrateSimulatorInput(result.value).changes, []);
    assert.throws(
        () =>
            migrateSimulatorInput({
                templateId: 1,
                phone: { callHistory: [{ duration: 'forever' }] },
            }),
        /Unrecognized/,
    );
    assert.throws(
        () =>
            migrateSimulatorInput({
                templateId: 1,
                phone: { callHistory: [{ duration: '0:20', durationSeconds: 40 }] },
            }),
        /Conflicting/,
    );
});
