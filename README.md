# Treecord landing

The scroll story: one pinned stage where a 3D forest, SVG art and headlines move on one scrubbed timeline. React 19, Vite, TypeScript (strict), GSAP, three.js. The plan and its exit criteria are in [`phases.md`](phases.md); it began as a port of an earlier prototype, which has since been removed: this app is the source of truth.

| Command                | What it does                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| `npm run dev`          | Dev server on `127.0.0.1:5178`. `?at=<beat>,<progress>` jumps to a point (development only)  |
| `npm run build`        | Production build; prerenders the article so the page reads without JavaScript                |
| `npm run check`        | pspt's gate: prettier, eslint (`--max-warnings=0`), `tsc`, knip. The pre-commit hook runs it |
| `npm test`             | Unit tests (Vitest, jsdom)                                                                   |
| `npm run check:parity` | `tests/` mirrors `src/` (SR-2)                                                               |
| `npm run check:debug`  | No `console.log`, `debugger` or ScrollTrigger markers in the source                          |
| `npm run check:build`  | After a build: chunk budgets, lazy 3D layer, font hints                                      |
| `npm run e2e`          | Chromium journeys against the dev server                                                     |
| `npm run e2e:preview`  | The production build as a visitor gets it: no-JS article, first paint, `?at=` ignored        |

Build with `VITE_APP_URL=<app origin>` to point the call to action at the app (`/sign-in`); unset, the link is the path alone.

## Deploy

A static site, served by nginx in a container on **Google Cloud Run** (project `treecord-512605`, region `asia-southeast1`, service `treecord-landing`). `.github/workflows/ci-cd.yml` checks every pull request and every merge to `master`; a merge that passes `verify` and `e2e-preview` builds the image, pushes it to Artifact Registry and deploys it. GitHub signs in to Google Cloud with workload identity federation, limited to this repo's `master` branch, so there are no stored keys.

One-off setup, as a project Owner: `bash deploy/gcp-setup.sh`. To try the image locally: `docker build -t landing . && docker run -p 8080:8080 landing`.
