// The landing page script, beat by beat (foundation.md §3). Headlines only: no descriptions, no kickers.
// Every claim traces to prd.md or PRODUCT_KNOWLEDGE.md. No invented numbers. The copy was approved
// with the first prototype and ships here word for word.
//
// Inline marks, drawn on the word as you scroll:
//   {mark:x}    highlighter swipe behind x          {under:x}  green hand-drawn underline
//   {circle:x}  green hand-drawn loop around x      {ring:x}   red loop around x (a problem)
//   {alarm:x}   x turns red, red scribble under it  {strike:x} red scribble through x, x fades
//   {swap:a|b}  strike a, then b appears in green (put b's punctuation inside b)
//   {num:x}     step number in front of a headline
// Green marks what Treecord gets right, red marks the problem. A marked phrase never wraps.
// say = { big, size? }   size "m" = medium headline for denser beats.
import type { IconName } from '../../shared/art/icons';

export interface Say {
  big: string;
  size?: 'm';
}

export const COPY = {
  // the page around the story: the skip link, the stage's label and the footer
  shell: {
    skip: 'Skip the story',
    label: 'Treecord, every tree proven',
    name: 'Treecord',
    footer: 'Every tree, proven.',
  },

  // B0: the hook greets on load, then the mark assembles
  hero: {
    hook: [
      { big: 'Anyone can {mark:plant} a tree.' },
      { big: 'Keeping it {circle:alive} is the hard part.' },
    ] satisfies Say[],
    tagline: { big: 'Every tree, {under:proven}.', size: 'm' } satisfies Say,
  },

  // B1: zoom in on one seedling
  seedling: {
    says: [
      { big: 'Every campaign starts with a {mark:seedling}.' },
      { big: 'Most stop counting on {circle:day one}.' },
    ] satisfies Say[],
  },

  // B2: pan right across the three problems (prd.md "The Problem"), two headlines per panel
  problems: {
    panels: [
      [
        { big: 'Planted. Photographed. {alarm:Forgotten.}' },
        { big: 'Many die in their {ring:first year}.', size: 'm' },
      ],
      [
        { big: 'Your money goes in. Then it goes {alarm:quiet}.' },
        { big: 'What did it achieve? {mark:Hard to say.}', size: 'm' },
      ],
      [
        { big: 'A credit is only as good as its {under:proof}.' },
        { big: 'Most projects never reach {alarm:issuance}.', size: 'm' },
      ],
    ] satisfies Say[][],
  },

  // B3: zoom into the planter's phone
  proof: {
    says: [
      { big: "Don't take {strike:our word} for it." },
      { big: "Take the {mark:tree's}." },
      { big: 'Signed on the phone. {under:GPS and time} locked in.', size: 'm' },
      { big: 'Edited clips? {alarm:Rejected.}' },
    ] satisfies Say[],
  },

  // B4: pan right along the pipeline, one headline per node
  pipeline: {
    says: [
      { big: 'Proof in. {mark:Payment out.}' },
      { big: '{num:01} Filmed and signed {under:under the tree}.', size: 'm' },
      { big: '{num:02} AI checks {circle:liveness}, duplicates, growth.', size: 'm' },
      { big: '{num:03} Any donor can {alarm:flag} it.', size: 'm' },
      { big: '{num:04} The planter gets {mark:paid}. On-chain.', size: 'm' },
    ] satisfies Say[],
  },

  // B5: 36 months, six milestone payouts (PRODUCT_KNOWLEDGE.md §3)
  survival: {
    says: [
      { big: 'We pay for {swap:planting|staying alive.}' },
      { big: 'Six check-ins. {circle:36 months}.' },
      { big: "Each one pays only if it's {under:alive}." },
      { big: '{mark:40%} waits for month 36.' },
    ] satisfies Say[],
  },

  // B6: zoom out to carbon
  carbon: {
    says: [
      { big: 'Then the forest {under:pays it forward}.' },
      { big: 'Every tonne has exactly {circle:one} owner.' },
      { big: 'Mirrored on-chain. {mark:Linked to its trees.}', size: 'm' },
    ] satisfies Say[],
  },

  // B7: roles, then the call to action
  roles: {
    title: { big: 'One proof. {mark:Five} reasons to believe it.', size: 'm' } satisfies Say,
    items: [
      { icon: 'donorRole', line: 'Donors {under:see} it.' },
      { icon: 'planter', line: 'Planters {under:earn} it.' },
      { icon: 'developer', line: 'Developers {under:report} it.' },
      { icon: 'verifier', line: 'Verifiers {under:audit} it.' },
      { icon: 'buyer', line: 'Buyers {under:trust} it.' },
    ] satisfies { icon: IconName; line: string }[],
    cta: {
      big: 'Every tree, {circle:proven}.',
      join: 'Join Treecord',
    },
  },
};
