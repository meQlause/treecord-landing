// L8 ship checks on the built site (run `npm run build` first): chunk budgets, the 3D layer loads lazily,
// and the page asks for its fonts politely.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const BYTES_PER_KB = 1000;
const APP_BUDGET_KB = 500; // our own code, per chunk, minified
const THREE_BUDGET_KB = 560; // three.js alone is 539 kB: its own floor
const LAZY = ['three-', 'stage3d-']; // chunks that must not be needed to paint the first screen

const problems: string[] = [];
const html = readFileSync(join(DIST, 'index.html'), 'utf8');
const chunks = readdirSync(join(DIST, 'assets')).filter((name) => name.endsWith('.js'));

for (const name of chunks) {
  const kilobytes = statSync(join(DIST, 'assets', name)).size / BYTES_PER_KB;
  const budget = name.startsWith('three-') ? THREE_BUDGET_KB : APP_BUDGET_KB;
  if (kilobytes > budget) {
    problems.push(`${name}: ${kilobytes.toFixed(0)} kB is over its ${budget} kB budget`);
  }
}

for (const prefix of LAZY) {
  if (!chunks.some((name) => name.startsWith(prefix))) {
    problems.push(`no ${prefix}* chunk: the 3D layer should be its own lazily loaded chunk`);
  }
  if (html.includes(`/assets/${prefix}`)) {
    problems.push(`index.html loads ${prefix}* up front instead of on demand`);
  }
}

if (!html.includes('display=swap')) {
  problems.push('the fonts stylesheet lacks display=swap');
}
for (const host of ['https://fonts.googleapis.com', 'https://fonts.gstatic.com']) {
  if (!html.includes(`rel="preconnect" href="${host}"`)) {
    problems.push(`no preconnect to ${host}`);
  }
}

for (const problem of problems) {
  console.error(problem);
}

process.exitCode = problems.length > 0 ? 1 : 0;
