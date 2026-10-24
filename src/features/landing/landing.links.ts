// Where the two calls to action lead. One place to change them (L-11).
//
// Until the landing is hosted next to the app they keep the mockup's hash routes. Hosted beside it, build with
// VITE_APP_ROUTES=path to use the app's real path routes (docs/FE/fe-architecture.md §6): /campaigns, and /sign-in
// with an internal returnTo (the mockup's ?account= switch is a demo control the app does not have).
const ROUTES = {
  hash: { fund: '/#/campaigns', becomePlanter: '/#/sign-in?account=planter&returnTo=%2Fapp' },
  path: { fund: '/campaigns', becomePlanter: '/sign-in?returnTo=%2Fapp' },
};

// `?.`: Vite fills `import.meta.env` in the app and the unit tests, but the Playwright specs import this file
// in plain Node, where it does not exist
export const LINKS = import.meta.env?.VITE_APP_ROUTES === 'path' ? ROUTES.path : ROUTES.hash;
