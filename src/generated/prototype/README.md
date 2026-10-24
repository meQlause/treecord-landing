# Frozen prototype

A complete copy of the original `/landing` prototype and the two asset libraries it imported (`svg-assets`, `three-assets`), kept with their relative layout so they still run: `landing/index.html` imports `../svg-assets/src` and `../three-assets/src`.

It exists for two things, and nothing in `src/` imports it:

- **Oracles.** Many unit tests import these modules and check that the app's TypeScript produces the same output for the same input.
- **The reference page.** `npm run e2e:fidelity` serves this folder and takes paired screenshots of the prototype and the app. The mockup app in `FE-implementation` also serves `/landing/` from here.

Do not edit these files. They are the reference the port is measured against; the built `svg-assets/dist` was left out because it can be rebuilt with `svg-assets/build.mjs`.
