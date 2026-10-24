# Treecord landing

The scroll story: one pinned stage where a 3D forest, SVG art and headlines move on one scrubbed timeline. React 19, Vite, TypeScript (strict), GSAP, three.js. The plan and its exit criteria are in [`phases.md`](phases.md); the prototype it clones is [`../landing`](../landing).

| Command                | What it does                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| `npm run dev`          | Dev server on `127.0.0.1:5178`. `?at=<beat>,<progress>` jumps to a point (development only)  |
| `npm run build`        | Production build; prerenders the article so the page reads without JavaScript                |
| `npm run check`        | pspt's gate: prettier, eslint (`--max-warnings=0`), `tsc`, knip. The pre-commit hook runs it |
| `npm test`             | Unit tests (Vitest, jsdom); many compare against the prototype's own modules                 |
| `npm run check:parity` | `tests/` mirrors `src/` (SR-2)                                                               |
| `npm run check:debug`  | No `console.log`, `debugger` or ScrollTrigger markers in the source                          |
| `npm run check:build`  | After a build: chunk budgets, lazy 3D layer, font hints                                      |
| `npm run e2e`          | Chromium journeys against the dev server (needs `python` for the prototype server)           |
| `npm run e2e:preview`  | The production build as a visitor gets it: no-JS article, first paint, `?at=` ignored        |
| `npm run e2e:fidelity` | Paired screenshots, prototype and app, in `test-results/fidelity/` (slow: about 30 minutes)  |

Build with `VITE_APP_ROUTES=path` to point the two calls to action at the app's path routes.
