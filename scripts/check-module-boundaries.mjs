import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageName = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).name;
const sourceRoot = join(root, 'src');
const files = readdirSync(sourceRoot, { recursive: true }).filter((file) => /\.tsx?$/.test(file));
const sources = new Set(files.map((file) => join(sourceRoot, file)));
const failures = [];
// This rule concerns explicit module forwarding, not exports of locally declared symbols.
const forwarding =
    /\bexport\s+(?:type\s+)?(?:\*(?:\s+as\s+\w+)?|\{[^}]*\})\s+from\s+['"][^'"]+['"]/g;
const imports = /\b(?:from\s*|import\s*\(\s*|import\s*)['"]([^'"]+)['"]/g;

for (const file of files) {
    const location = join(sourceRoot, file);
    const text = readFileSync(location, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    if ([...text.matchAll(forwarding)].length) {
        failures.push(`${file}: import from the owning module instead of forwarding exports`);
    }
    if (/(?:^|\/)index\.tsx?$/.test(file)) {
        failures.push(`${file}: internal barrel files are not allowed`);
    }
    if (
        packageName === '@signalsafe/simulator-react' &&
        /^(?:apps|components)\/[^/]+\.tsx?$/.test(file)
    ) {
        failures.push(`${file}: place app or UI modules in their feature directory`);
    }
    for (const [, specifier] of text.matchAll(imports)) {
        if (specifier === packageName || specifier.startsWith(`${packageName}/`)) {
            failures.push(`${file}: package internals must import their owners directly`);
        }
        if (!specifier.startsWith('.')) continue;
        const target = resolve(dirname(location), specifier).replace(/\.js$/, '');
        const resolved = [target, `${target}.ts`, `${target}.tsx`].find((candidate) =>
            sources.has(candidate),
        );
        if (!resolved) failures.push(`${file}: unresolved source import ${specifier}`);
        if (resolved === join(sourceRoot, 'index.ts')) {
            failures.push(
                `${file}: do not import the public package entry from inside the package`,
            );
        }
    }
}
if (failures.length) {
    console.error(failures.join('\n'));
    process.exitCode = 1;
} else {
    console.log(
        `Module boundaries: ${files.length} source modules; no internal re-exports or unresolved imports (${relative(root, sourceRoot)}).`,
    );
}
