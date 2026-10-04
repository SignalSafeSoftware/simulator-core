import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Renames/removals must not leave obsolete JavaScript or declarations in the package.
rmSync(fileURLToPath(new URL('../dist/', import.meta.url)), { recursive: true, force: true });
