import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const groups = [pkg.dependencies, pkg.devDependencies, pkg.resolutions];
const local = new Set(
    groups.flatMap((group) =>
        Object.values(group ?? {}).filter((range) => range.startsWith('file:')),
    ),
);
if (process.argv.includes('--release') && local.size) {
    throw new Error(
        'Local file dependencies must be replaced with published versions before release.',
    );
}
const expected = local.size
    ? JSON.parse(readFileSync(resolve(root, 'vendor/npm/manifest.json'), 'utf8'))
    : {};
for (const range of local) {
    if (!range.startsWith('file:vendor/npm/'))
        throw new Error(`Unmanaged local artifact: ${range}`);
    const file = range.slice(5);
    const actual = createHash('sha256')
        .update(readFileSync(resolve(root, file)))
        .digest('hex');
    if (actual !== expected[file]) throw new Error(`Missing or changed artifact checksum: ${file}`);
}
for (const file of Object.keys(expected)) {
    if (!local.has(`file:${file}`)) throw new Error(`Stale artifact manifest entry: ${file}`);
}
console.log(`Verified ${local.size} local artifacts for ${pkg.name}.`);
