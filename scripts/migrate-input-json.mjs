/** Offline, non-destructive migration. Never loaded by the simulator runtime. */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

export function migrateSimulatorInput(input) {
    const value = structuredClone(input);
    const changes = [];
    function move(object, oldKey, newKey, path) {
        if (!Object.hasOwn(object, oldKey)) return;
        if (object[newKey] != null && JSON.stringify(object[newKey]) !== JSON.stringify(object[oldKey])) {
            throw new Error(`Conflicting fields at ${path}: ${oldKey} and ${newKey}; review manually.`);
        }
        object[newKey] ??= object[oldKey];
        delete object[oldKey];
        changes.push(`${path}.${oldKey} -> ${newKey}`);
    }
    function visit(node, path) {
        if (Array.isArray(node)) {
            node.forEach((item, i) => visit(item, `${path}[${i}]`));
            return;
        }
        if (!record(node)) return;
        if (typeof node.start_node === 'string' && record(node.nodes) && Array.isArray(node.transitions)) {
            for (const [id, entry] of Object.entries(node.nodes)) {
                if (record(entry)) move(entry, 'options', 'choices', `${path}.nodes.${id}`);
            }
            for (const [i, transition] of node.transitions.entries()) {
                if (record(transition) && transition.to === '__END__') {
                    transition.to = 'END';
                    changes.push(`${path}.transitions[${i}].to -> END`);
                }
            }
        }
        if (record(node.entry_point)) {
            if (record(node.phone) && Object.hasOwn(node.phone, 'voicemail_transcript')) {
                if (node.phone.voicemail != null && !record(node.phone.voicemail)) {
                    throw new Error(`Invalid voicemail object at ${path}.phone; review manually.`);
                }
                node.phone.voicemail ??= {};
                const current = node.phone.voicemail.transcript;
                if (current != null && current !== node.phone.voicemail_transcript) {
                    throw new Error(`Conflicting voicemail transcripts at ${path}.phone; review manually.`);
                }
                node.phone.voicemail.transcript ??= node.phone.voicemail_transcript;
                delete node.phone.voicemail_transcript;
                changes.push(`${path}.phone.voicemail_transcript -> voicemail.transcript`);
            }
            if (record(node.internet) && Array.isArray(node.internet.pages)) {
                for (const [i, page] of node.internet.pages.entries()) {
                    if (!record(page) || !Array.isArray(page.buttons)) continue;
                    for (const [j, button] of page.buttons.entries()) {
                        if (record(button)) move(button, 'targetPageId', 'target_page_id', `${path}.internet.pages[${i}].buttons[${j}]`);
                    }
                }
            }
        }
        // Session snapshots have camelCase identity and view-model fields.
        if (Object.hasOwn(node, 'templateId') && record(node.phone) && Array.isArray(node.phone.callHistory)) {
            for (const [i, row] of node.phone.callHistory.entries()) {
                if (!record(row)) continue;
                if (row.kind == null) {
                    const label = typeof row.label === 'string' ? row.label.toLowerCase() : '';
                    row.kind = label.includes('missed') ? 'missed' : label.includes('voicemail') ? 'voicemail' : label.includes('out') ? 'outgoing' : label.includes('in') ? 'incoming' : 'unknown';
                    changes.push(`${path}.phone.callHistory[${i}].kind`);
                }
                if (Object.hasOwn(row, 'duration')) {
                    const raw = typeof row.duration === 'string' ? row.duration.trim() : row.duration;
                    let seconds = null;
                    if (raw != null && raw !== '') {
                        if (typeof raw !== 'string' || !/^\d+:[0-5]\d$/.test(raw)) {
                            throw new Error(`Unrecognized duration at ${path}.phone.callHistory[${i}]; review manually.`);
                        }
                        const [minutes, remainder] = raw.split(':').map(Number);
                        seconds = minutes * 60 + remainder;
                        if (!Number.isSafeInteger(seconds)) throw new Error(`Duration is too large at ${path}.phone.callHistory[${i}].`);
                    }
                    if (row.durationSeconds != null && row.durationSeconds !== seconds) {
                        throw new Error(`Conflicting durations at ${path}.phone.callHistory[${i}]; review manually.`);
                    }
                    row.durationSeconds ??= seconds;
                    delete row.duration;
                    changes.push(`${path}.phone.callHistory[${i}].duration -> durationSeconds`);
                }
            }
        }
        for (const [key, child] of Object.entries(node)) visit(child, `${path}.${key}`);
    }
    visit(value, '$');
    return { value, changes };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const [source, flag, destination, ...extra] = process.argv.slice(2);
    if (!source || (flag && flag !== '--output') || (flag && !destination) || extra.length) {
        console.error('Usage: node scripts/migrate-input-json.mjs INPUT.json [--output NEW.json]');
        process.exitCode = 2;
    } else {
        try {
            const { value, changes } = migrateSimulatorInput(JSON.parse(readFileSync(source, 'utf8')));
            if (destination) writeFileSync(destination, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
            console.log(`${changes.length} migration(s)${destination ? `; wrote ${destination}` : '; input unchanged'}.`);
            for (const change of changes) console.log(change);
            if (!destination && changes.length) process.exitCode = 1;
        } catch (error) {
            console.error(error instanceof Error ? error.message : String(error));
            process.exitCode = 2;
        }
    }
}
