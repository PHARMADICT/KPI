#!/usr/bin/env node
/**
 * scripts/lint.js
 * Parses every JS file in js/ with acorn to catch syntax errors.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
let acorn;
// Try local, then npm-global fallback
const candidates = [
  'acorn',
  '/home/claude/.npm-global/lib/node_modules/ts-node/node_modules/acorn',
];
for (const c of candidates) {
  try { acorn = require(c); break; } catch {}
}
if (!acorn) { console.error('acorn not found — run: npm install'); process.exit(1); }

let pass = 0, fail = 0;

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) { walk(full); continue; }
    if (!entry.endsWith('.js')) continue;
    const code = readFileSync(full, 'utf8');
    try {
      acorn.parse(code, { ecmaVersion: 2022, sourceType: 'module' });
      console.log('✅', full);
      pass++;
    } catch (e) {
      console.error('❌', full, '—', e.message, `(line ${e.loc?.line})`);
      fail++;
    }
  }
}

walk(new URL('../js', import.meta.url).pathname);
console.log(`\nResult: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
