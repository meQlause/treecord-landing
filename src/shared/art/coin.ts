import { HEX } from '../palette';
import { fan, leaf, mix, ramp, shadeFaces, svg, type Point } from './lowpoly';

const TONES = {
  gold: ['#A8741F', '#F4D27A', HEX.leafMid], // planter incentive (USDC payout)
  green: [HEX.leafDark, HEX.leafLight, '#FFFFFF'], // carbon credit, twin of the 3D particle coin
};

export type CoinTone = keyof typeof TONES;

const COIN = {
  middle: 50,
  outer: 46,
  inner: 35,
  sides: 10,
  innerTurn: 0.5,
  faceMix: 0.45,
  shineMix: 0.3,
  emblemMix: 0.35,
};
const EMBLEM = { x: 38, y: 64, length: 30, width: 15, angle: -0.85 };
const WHITE = '#FFFFFF';

const ring = (centre: Point, radius: number, sides: number, turn = 0): Point[] =>
  Array.from({ length: sides }, (_item, index) => {
    const angle = ((index + turn) / sides) * Math.PI * 2 - Math.PI / 2;

    return [centre[0] + Math.cos(angle) * radius, centre[1] + Math.sin(angle) * radius];
  });

export function coinSVG({ tone = 'gold' }: { tone?: CoinTone } = {}): string {
  const [dark, light, emblem] = TONES[tone];
  const centre: Point = [COIN.middle, COIN.middle];
  const outer = ring(centre, COIN.outer, COIN.sides);
  const inner = ring(centre, COIN.inner, COIN.sides, COIN.innerTurn);
  const rim: Point[][] = [];
  for (let index = 0; index < COIN.sides; index += 1) {
    const next = (index + 1) % COIN.sides;
    rim.push([outer[index], outer[next], inner[index]], [inner[index], outer[next], inner[next]]);
  }
  const face = ramp(mix(dark, light, COIN.faceMix), mix(light, WHITE, COIN.shineMix));
  const body =
    shadeFaces(rim, centre, ramp(dark, light)) +
    fan(inner, centre, face) +
    leaf([EMBLEM.x, EMBLEM.y], EMBLEM, emblem, mix(emblem, dark, COIN.emblemMix));

  return svg('0 0 100 100', `<g class="coin-body">${body}</g>`, `tc-coin tc-coin--${tone}`);
}
