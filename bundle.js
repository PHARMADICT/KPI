#!/usr/bin/env node
/**
 * scripts/bundle.js
 * Produces a self-contained single-file HTML bundle.
 * Usage:  node scripts/bundle.js [--version v1.2.3] [--out dist/app.html]
 *
 * Reads all JS modules in dependency order, strips ES module
 * import/export syntax (replacing with vanilla assignments),
 * inlines all CSS, and writes a standalone HTML file that works
 * by double-click without a server.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── CLI args ──────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag, def) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : def;
};
const version = getArg('--version', 'dev');
const outPath = getArg('--out', join(ROOT, 'dist', 'no7-analytics-bundle.html'));

mkdirSync(dirname(outPath), { recursive: true });

// ── Read helper ───────────────────────────────────────────────────
const read = p => readFileSync(join(ROOT, p), 'utf8');

// ── Strip ES module syntax ────────────────────────────────────────
function stripModules(code) {
  // Multi-line imports: import { a, b } from '...'
  code = code.replace(/import\s*\{[^}]*\}\s*from\s*['"][^'"]*['"];?/gs, '');
  // Default imports: import X from '...'
  code = code.replace(/import\s+\w+\s+from\s*['"][^'"]*['"];?/g, '');
  // export async function / export function / export const / etc.
  code = code.replace(/^export\s+async\s+function\s+/gm, 'async function ');
  code = code.replace(/^export\s+function\s+/gm,         'function ');
  code = code.replace(/^export\s+const\s+/gm,            'const ');
  code = code.replace(/^export\s+let\s+/gm,              'let ');
  code = code.replace(/^export\s+class\s+/gm,            'class ');
  code = code.replace(/^export\s*\{[^}]*\};?\s*$/gm,     '');
  code = code.replace(/^export\s+default\s+/gm,          '');
  return code;
}

// ── CSS ───────────────────────────────────────────────────────────
const css = [
  'css/tokens.css', 'css/base.css', 'css/layout.css',
  'css/components.css', 'css/animations.css',
].map(read).join('\n');

// ── JS modules (dependency order) ────────────────────────────────
const MODULE_ORDER = [
  'js/data/bp.js',
  'js/services/db.js',
  'js/services/auth.js',
  'js/services/ocr.js',
  'js/services/sync.js',
  'js/services/teams.js',
  'js/utils/calc.js',
  'js/utils/format.js',
  'js/utils/ui.js',
  'js/utils/export.js',
  'js/store/index.js',
  'js/views/login.js',
  'js/views/entry.js',
  'js/views/analysis.js',
  'js/views/staff.js',
  'js/views/admin.js',
  'js/app.js',
];

const jsParts = [
  `/* No7 Analytics ${version} — ${new Date().toISOString()} */`,
  `/* Built from: ${process.env.GITHUB_SHA || 'local'} */`,
];

for (const mod of MODULE_ORDER) {
  const stripped = stripModules(read(mod)).trim();
  jsParts.push(`\n// ═══ ${mod} ═══\n${stripped}`);
}

const js = jsParts.join('\n');

// ── HTML template ─────────────────────────────────────────────────
let html = read('index.html');

// Remove module-specific tags (we're inlining everything)
html = html.replace(/<link rel="stylesheet"[^>]*>\s*/g, '');
html = html.replace(/<script type="module"[^>]*>[^<]*<\/script>\s*/g, '');
html = html.replace(/<link rel="preconnect"[^>]*>\s*/g, '');
html = html.replace(/<link[^>]*fonts\.googleapis[^>]*>\s*/g, '');
html = html.replace(/<script src="https:\/\/cdn[^>]*><\/script>\s*/g, '');

const headInject = [
  '  <!-- Fonts (CDN — cached after first load) -->',
  '  <link rel="preconnect" href="https://fonts.googleapis.com">',
  '  <link href="https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">',
  '  <!-- Chart.js + Confetti (CDN) -->',
  '  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>',
  '  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js"></script>',
  '  <!-- Inlined styles -->',
  `  <style>\n${css}\n  </style>`,
].join('\n');

html = html.replace('</head>', headInject + '\n</head>');
html = html.replace('</body>', `\n<script>\n${js}\n</script>\n</body>`);

// ── Write ─────────────────────────────────────────────────────────
writeFileSync(outPath, html);
const kb = (readFileSync(outPath).length / 1024).toFixed(1);
console.log(`✅  Bundle written → ${outPath}  (${kb} KB)`);
console.log(`    Version : ${version}`);
console.log(`    Modules : ${MODULE_ORDER.length}`);
