// Which source each smoke section exercises, for `scripts/verify --changed`. `entries` are the route modules the section
// visits: a section runs when a changed file is one of them or anything they import. `always` sections run on every
// localized check, because they cover the whole site cheaply. smoke.mjs fails if this list and its sections disagree.
const LANDING = "src/site/landing.tsx";
const GALLERY = "src/site/gallery.tsx";
const COLLECTIONS = "src/site/collections.tsx";
const EXAMPLES = "src/site/examples/index.tsx";
const ENCYCLOPEDIA = "src/site/encyclopedia.tsx";
const EXPORT = "src/site/export.tsx";
const MOBILE_APP = "src/site/mobile-app-page.tsx";
const MOBILE_SCREENS = "src/site/mobile-screens-page.tsx";

export const SECTIONS = {
  routes: { always: true },
  "phone-widths": { always: true },
  defaults: { always: true },
  flap: { entries: [LANDING] },
  landing: { entries: [LANDING] },
  "ai-composer": { entries: [COLLECTIONS] },
  "phone-customize": { entries: [LANDING] },
  "inline-edit": { entries: [EXAMPLES] },
  "press-scale": { entries: [EXAMPLES, GALLERY] },
  "nav-tabs": { entries: [GALLERY] },
  encyclopedia: { entries: [ENCYCLOPEDIA] },
  "components-index": { entries: [GALLERY, COLLECTIONS] },
  "footer-tablet": { entries: [LANDING, GALLERY, COLLECTIONS, EXPORT, EXAMPLES] },
  "examples-nav": { entries: [EXAMPLES] },
  "palette-config": { entries: [LANDING, GALLERY] },
  "select-menu": { entries: [GALLERY] },
  "orders-settings": { entries: [EXAMPLES] },
  "page-semantics": { entries: [LANDING, EXAMPLES, GALLERY] },
  "scroll-through": { entries: [GALLERY] },
  "component-pages": { entries: [GALLERY] },
  "motion-set": { entries: [GALLERY] },
  "chart-switch-pill": { entries: [GALLERY] },
  "mobile-index": { entries: [GALLERY, MOBILE_SCREENS] },
  "mobile-gestures": { entries: [GALLERY, MOBILE_APP] },
  "mobile-flows": { entries: [GALLERY, MOBILE_APP] },
  "mobile-sweep": { entries: [GALLERY, MOBILE_APP, MOBILE_SCREENS] },
  "classic-scrollbars": { entries: [LANDING, GALLERY, COLLECTIONS, EXAMPLES, ENCYCLOPEDIA] },
};

/** The route module that renders a path. smoke.mjs checks every page a section really visits against its `entries`. */
export const routeEntry = (path) => {
  if (path === "/") return LANDING;
  if (path === "/mobile/screens") return MOBILE_SCREENS;
  if (/^\/mobile\/app(\/|$)/.test(path)) return MOBILE_APP;
  if (/^\/(components|gallery|mobile)(\/|$)/.test(path)) return GALLERY;
  if (/^\/(ai|backgrounds)(\/|$)/.test(path)) return COLLECTIONS;
  if (/^\/examples(\/|$)/.test(path)) return EXAMPLES;
  if (path === "/encyclopedia") return ENCYCLOPEDIA;
  if (path === "/export") return EXPORT;
  return null;
};
