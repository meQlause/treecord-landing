import { useLayoutEffect, useRef } from 'react';

/**
 * Mounts one of the art generators' <svg> strings. They are trusted, local and static, and parsed as SVG (not
 * injected as HTML). The wrapper takes no space (`display: contents`), so the grid or flex it sits in is
 * unchanged. ponytail: the art stays as string generators (tested for the classes, ids and viewBoxes the
 * timelines rely on); the upgrade path is one JSX component per asset.
 */
export function Art({ markup }: { markup: string }) {
  const host = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml').documentElement;
    host.current?.replaceChildren(document.importNode(parsed, true));
  }, [markup]);

  return <span ref={host} className="art" />;
}
