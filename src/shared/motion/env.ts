const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

/** The visitor's setting right now; it can change while the page is open. */
export const prefersReducedMotion = (): boolean => matchMedia(REDUCE_QUERY).matches;

/** Calls `onChange` whenever the visitor turns reduced motion on or off. Returns what stops listening. */
export function watchReducedMotion(onChange: (reduce: boolean) => void): () => void {
  const query = matchMedia(REDUCE_QUERY);
  const listener = (event: MediaQueryListEvent): void => onChange(event.matches);
  query.addEventListener('change', listener);

  return () => query.removeEventListener('change', listener);
}

/** Phone-class device: fewer trees, lower pixel ratio, shorter scroll per beat. */
export const MOBILE = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
