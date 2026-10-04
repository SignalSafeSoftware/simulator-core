import { copyFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const target = process.argv[2];
if (!target) throw new Error('Provide the runtime artifact destination directory.');
mkdirSync(target, { recursive: true });
const manifest = resolve(root, 'vendor/npm/manifest.json');
if (existsSync(manifest)) {
    for (const file of Object.keys(JSON.parse(readFileSync(manifest, 'utf8')))) {
        copyFileSync(resolve(root, file), resolve(target, basename(file)));
    }
}
