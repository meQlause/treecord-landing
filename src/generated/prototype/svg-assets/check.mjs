// Run: node check.mjs
import assert from 'node:assert/strict';
import { treeSVG } from './src/tree.js';
import * as O from './src/objects.js';
import { forgottenSVG, fieldCheckSVG } from './src/scenes.js';
import { iconSVG, ICONS } from './src/icons.js';
import { pipelineSVG, milestonesSVG, MILESTONES, smoothPath } from './src/diagrams.js';
import { STORY, FX_KINDS } from './src/story.js';

const assets = {
  tree: treeSVG(),
  logo: O.logoSVG(),
  coin: O.coinSVG(),
  coinGreen: O.coinSVG({ tone: 'green' }),
  blind: O.blindFundingSVG(),
  certificate: O.certificateSVG(),
  phone: O.phoneSVG(),
  gps: O.gpsSVG(),
  shield: O.shieldSVG(),
  serial: O.serialSVG(),
  forgotten: forgottenSVG(),
  fieldCheck: fieldCheckSVG(),
  pipeline: pipelineSVG(),
  milestones: milestonesSVG(),
  ...Object.fromEntries(Object.keys(ICONS).map((k) => [`icon-${k}`, iconSVG(k)])),
};

/** Minimal well-formedness: every open tag is closed in order. */
function wellFormed(markup) {
  const stack = [];
  for (const [, close, name, selfClose] of markup.matchAll(/<(\/?)([a-zA-Z]+)[^>]*?(\/?)>/g)) {
    if (selfClose) continue;
    if (close) assert.equal(stack.pop(), name, `closing </${name}>`);
    else stack.push(name);
  }
  assert.equal(stack.length, 0, `unclosed: ${stack.join(', ')}`);
}

for (const [name, markup] of Object.entries(assets)) {
  assert.ok(markup.startsWith('<svg') || markup.startsWith('<g'), `${name} is svg markup`);
  wellFormed(markup);
  assert.ok(!/NaN|undefined/.test(markup), `${name} has no NaN/undefined`);
}
assert.equal(treeSVG(), treeSVG(), 'tree is deterministic');
assert.equal(pipelineSVG(), pipelineSVG(), 'pipeline is deterministic');

// tree parts mirror three-assets/src/hero-tree.js
const parts = [
  ...assets.tree.matchAll(/class="part (\w+)" data-pivot="[\d. ]+" data-grow="([\d.]+) ([\d.]+)"/g),
];
const count = (k) => parts.filter((p) => p[1] === k).length;
assert.deepEqual(
  [count('branch'), count('blob'), count('sprout')],
  [2, 6, 2],
  '2 branches, 6 crown blobs, 2 sprouts',
);
for (const [, , s, e] of parts)
  assert.ok(+s >= 0 && +e <= 0.72 && +s < +e, 'every part finishes by 0.72 of growth');

// milestones match PRODUCT_KNOWLEDGE.md §3
assert.deepEqual(
  MILESTONES.map((m) => m.month),
  [0, 3, 6, 12, 24, 36],
);
assert.equal(
  MILESTONES.reduce((s, m) => s + m.share, 0),
  100,
  'shares sum to 100%',
);

assert.match(
  smoothPath([
    [0, 0],
    [10, 10],
    [20, 0],
  ]),
  /^M0,0 C.* 10,10 C.* 20,0$/,
  'smooth path passes through every point',
);

// story: headlines only (no description fields) and only known inline marks
const strings = [];
const walk = (v, key) => {
  assert.ok(
    !['sub', 'kicker', 'description'].includes(key),
    `story has no "${key}" fields: headlines only`,
  );
  if (typeof v === 'string') strings.push(v);
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, k);
};
walk(STORY);
for (const s of strings) {
  for (const [, kind, body] of s.matchAll(/\{(\w+):([^}]*)\}/g)) {
    assert.ok(FX_KINDS.includes(kind), `unknown mark {${kind}:…} in "${s}"`);
    if (kind === 'swap') assert.equal(body.split('|').length, 2, `swap needs "old|new" in "${s}"`);
  }
  assert.equal(
    (s.match(/\{/g) || []).length,
    (s.match(/\}/g) || []).length,
    `unbalanced braces in "${s}"`,
  );
}

console.log(
  `ok: ${Object.keys(assets).length} assets well-formed, tree schedule, milestones, ${strings.length} story strings`,
);
