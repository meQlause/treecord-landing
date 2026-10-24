// The landing page script, beat by beat (foundation.md §3). Headlines only: no descriptions, no kickers.
// Every claim traces to prd.md or PRODUCT_KNOWLEDGE.md. No invented numbers.
//
// Inline marks, drawn on the word as you scroll:
//   {mark:x}    highlighter swipe behind x          {under:x}  green hand-drawn underline
//   {circle:x}  green hand-drawn loop around x      {ring:x}   red loop around x (a problem)
//   {alarm:x}   x turns red, red scribble under it  {strike:x} red scribble through x, x fades
//   {swap:a|b}  strike a, then b appears in green (put b's punctuation inside b)
//   {num:x}     step number in front of a headline
// Green marks what Treecord gets right, red marks the problem. A marked phrase never wraps.
// say = { big, size? }   size "m" = medium headline for denser beats.
// ghost = huge outlined word drifting behind the beat.

export const FX_KINDS = ['mark', 'under', 'circle', 'ring', 'alarm', 'strike', 'swap', 'num'];

export const STORY = {
  // B0: the hook greets on load, then the mark assembles
  hero: {
    ghost: 'ALIVE',
    hook: [
      { big: 'Anyone can {mark:plant} a tree.' },
      { big: 'Keeping it {circle:alive} is the hard part.' },
    ],
    tagline: { big: 'Every tree, {under:proven}.', size: 'm' },
  },

  // B1: zoom in on one seedling
  seedling: {
    ghost: 'DAY ONE',
    says: [
      { big: 'Every campaign starts with a {mark:seedling}.' },
      { big: 'Most stop counting on {circle:day one}.' },
    ],
  },

  // B2: pan right across the three problems (prd.md "The Problem"), two headlines per panel
  problems: {
    ghost: 'LOST',
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
    ],
  },

  // B3: zoom into the planter's phone
  proof: {
    ghost: 'PROOF',
    says: [
      { big: "Don't take {strike:our word} for it." },
      { big: "Take the {mark:tree's}." },
      { big: 'Signed on the phone. {under:GPS and time} locked in.', size: 'm' },
      { big: 'Edited clips? {alarm:Rejected.}' },
    ],
  },

  // B4: pan right along the pipeline, one headline per node
  pipeline: {
    ghost: 'PAID',
    says: [
      { big: 'Proof in. {mark:Payment out.}' },
      { big: '{num:01} Filmed and signed {under:under the tree}.', size: 'm' },
      { big: '{num:02} AI checks {circle:liveness}, duplicates, growth.', size: 'm' },
      { big: '{num:03} Any donor can {alarm:flag} it.', size: 'm' },
      { big: '{num:04} The planter gets {mark:paid}. On-chain.', size: 'm' },
    ],
  },

  // B5: 36 months, six milestone payouts (PRODUCT_KNOWLEDGE.md §3)
  survival: {
    ghost: '36 MONTHS',
    says: [
      { big: 'We pay for {swap:planting|staying alive.}' },
      { big: 'Six check-ins. {circle:36 months}.' },
      { big: "Each one pays only if it's {under:alive}." },
      { big: '{mark:40%} waits for month 36.' },
    ],
  },

  // B6: zoom out to carbon
  carbon: {
    ghost: 'ONE OWNER',
    says: [
      { big: 'Then the forest {under:pays it forward}.' },
      { big: 'Every tonne has exactly {circle:one} owner.' },
      { big: 'Mirrored on-chain. {mark:Linked to its trees.}', size: 'm' },
    ],
  },

  // B7: roles, then the call to action
  roles: {
    ghost: 'TRUST',
    title: { big: 'One proof. {mark:Five} reasons to believe it.', size: 'm' },
    items: [
      ['donorRole', 'Donors {under:see} it.'],
      ['planter', 'Planters {under:earn} it.'],
      ['developer', 'Developers {under:report} it.'],
      ['verifier', 'Verifiers {under:audit} it.'],
      ['buyer', 'Buyers {under:trust} it.'],
    ],
    cta: {
      big: 'Every tree, {circle:proven}.',
      primary: 'Fund a tree',
      secondary: 'Become a planter',
    },
  },
};
