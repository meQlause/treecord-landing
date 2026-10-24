// Headlines as React: marked words become the spans the words engine measures and draws on.
import type { Say } from '../landing.copy';
import { parseRich, type Piece } from './rich.rules';

function Part({ piece }: { piece: Piece }) {
  if (piece.kind === 'text') {
    return <>{piece.text}</>;
  }
  if (piece.kind === 'num') {
    return <span className="num">{piece.text}</span>;
  }
  if (piece.kind === 'swap') {
    return (
      <>
        <span className="fx" data-fx="strike">
          {piece.was}
        </span>{' '}
        <span className="fx fx--new" data-fx="new">
          {piece.now}
        </span>
      </>
    );
  }

  return (
    <span className="fx" data-fx={piece.mark}>
      {piece.text}
    </span>
  );
}

export function Rich({ text }: { text: string }) {
  return (
    <>
      {parseRich(text).map((piece, index) => (
        <Part key={index} piece={piece} />
      ))}
    </>
  );
}

type Heading = 'h1' | 'h2';

function SayLine({ say, heading }: { say: Say; heading?: Heading }) {
  const Line = heading ?? 'p';

  return (
    <div className="say">
      <Line className={say.size ? `big big--${say.size}` : 'big'}>
        <Rich text={say.big} />
      </Line>
    </div>
  );
}

/** One .copy block: its headlines, one after another. `heading` makes the first one a heading in the outline. */
export function Copy({
  says,
  className = '',
  heading,
}: {
  says: Say[];
  className?: string;
  heading?: Heading;
}) {
  return (
    <div className={className ? `copy ${className}` : 'copy'}>
      {says.map((say, index) => (
        <SayLine key={say.big} say={say} heading={index === 0 ? heading : undefined} />
      ))}
    </div>
  );
}
