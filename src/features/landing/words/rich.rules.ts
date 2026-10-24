// Pure: turns a headline written with inline marks into the pieces a component renders. No I/O, no framework.
// {circle:alive} -> a marked word; {swap:was|now} -> a struck word and its replacement; {num:01} -> a step number.
export type Piece =
  | { kind: 'text'; text: string }
  | { kind: 'num'; text: string }
  | { kind: 'swap'; was: string; now: string }
  | { kind: 'mark'; mark: string; text: string };

const MARKUP = /\{(\w+):([^}]+)\}/g;

/** The text between marks stays as it is; every {kind:body} becomes one piece. */
export function parseRich(text: string): Piece[] {
  const pieces: Piece[] = [];
  let from = 0;
  for (const found of text.matchAll(MARKUP)) {
    const [whole, kind, body] = found;
    if (found.index > from) {
      pieces.push({ kind: 'text', text: text.slice(from, found.index) });
    }
    pieces.push(toPiece(kind, body));
    from = found.index + whole.length;
  }
  if (from < text.length) {
    pieces.push({ kind: 'text', text: text.slice(from) });
  }

  return pieces;
}

function toPiece(kind: string, body: string): Piece {
  if (kind === 'num') {
    return { kind: 'num', text: body };
  }
  if (kind === 'swap') {
    const [was, now] = body.split('|');

    return { kind: 'swap', was, now };
  }

  return { kind: 'mark', mark: kind, text: body };
}
