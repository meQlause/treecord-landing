// The eight beats of the story, in order: markup (a component) and build() for everything animated inside each.
// The camera poses and the moves between beats live in camera.ts; story.ts assembles them.
import type { Beat } from '../types';
import { carbon } from './carbon';
import { hero } from './hero';
import { pipeline } from './pipeline';
import { problems } from './problems';
import { proof } from './proof';
import { roles } from './roles';
import { seedling } from './seedling';
import { survival } from './survival';

export const BEATS: Beat[] = [hero, seedling, problems, proof, pipeline, survival, carbon, roles];
