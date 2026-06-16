// Client-rendered: ranking recomputes live as the user drags weight sliders,
// so there's no benefit to SSR here (and it keeps MapLibre out of the server).
export const ssr = false;
export const prerender = false;
