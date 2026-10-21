import { deviceJsonSchema } from '../dist/internal/deviceJsonRules.js';
process.stdout.write(JSON.stringify(deviceJsonSchema, null, 2) + '\n');
