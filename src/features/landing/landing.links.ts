// Where the call to action leads. One place to change it (L-11).
//
// The landing and the app are separate sites, so the build names the app: VITE_APP_URL is its origin (no trailing
// slash). Unset, the link is the path alone, for a landing hosted beside the app.
const APP_URL = (import.meta.env?.VITE_APP_URL ?? '').replace(/\/$/u, '');

// `?.`: Vite fills `import.meta.env` in the app and the unit tests, but the Playwright specs import this file
// in plain Node, where it does not exist
export const LINKS = { join: `${APP_URL}/sign-in` };
