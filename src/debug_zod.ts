import { z } from 'zod';
import packageJson from '../package.json';

console.log('Zod Version:', packageJson.dependencies.zod);

const schema = z.record(z.string(), z.object({ a: z.string() }));
const data = { key: { a: "val" } };
const result = schema.safeParse(data);
console.log('Test Parse:', JSON.stringify(result, null, 2));
