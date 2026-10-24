// Run: node build.mjs   Writes every asset (final state) to dist/*.svg, e.g. for Figma or design review.
import { mkdirSync, writeFileSync } from 'node:fs';
import { treeSVG } from './src/tree.js';
import * as O from './src/objects.js';
import { forgottenSVG, fieldCheckSVG } from './src/scenes.js';
import { iconSVG, ICONS } from './src/icons.js';
import { pipelineSVG, milestonesSVG } from './src/diagrams.js';

const files = {
  tree: treeSVG(),
  logo: O.logoSVG(),
  'coin-gold': O.coinSVG(),
  'coin-green': O.coinSVG({ tone: 'green' }),
  'blind-funding': O.blindFundingSVG(),
  certificate: O.certificateSVG(),
  phone: O.phoneSVG(),
  gps: O.gpsSVG(),
  shield: O.shieldSVG(),
  serial: O.serialSVG(),
  forgotten: forgottenSVG(),
  'field-check': fieldCheckSVG(),
  pipeline: pipelineSVG(),
  milestones: milestonesSVG(),
  ...Object.fromEntries(Object.keys(ICONS).map((k) => [`icon-${k}`, iconSVG(k)])),
};

mkdirSync(new URL('./dist/', import.meta.url), { recursive: true });
for (const [name, markup] of Object.entries(files)) {
  // show the final state of text that is scrambled in at runtime
  const final = markup.replace(/(data-text="([^"]*)"[^>]*>)[^<]*</g, '$1$2<');
  writeFileSync(new URL(`./dist/${name}.svg`, import.meta.url), final);
}
console.log(`wrote ${Object.keys(files).length} files to dist/`);
