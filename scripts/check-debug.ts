// L8: no debug leftovers in the source (foundation.md §5): console.log, debugger, ScrollTrigger markers.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const SOURCE_FILE = /\.(ts|tsx)$/;
const LEFTOVERS: [RegExp, string][] = [
  [/console\.log\(/, 'console.log'],
  [/\bdebugger\b/, 'debugger'],
  [/\bmarkers\s*:\s*(true|\{)/, 'ScrollTrigger markers'],
];

const walk = (dir: string): string[] =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
      )
    : [];

const problems = walk('src')
  .filter((file) => SOURCE_FILE.test(file))
  .flatMap((file) => {
    const text = readFileSync(file, 'utf8');

    return LEFTOVERS.filter(([pattern]) => pattern.test(text)).map(
      ([, name]) => `${relative('.', file).split(sep).join('/')}: ${name}`,
    );
  });

for (const problem of problems) {
  console.error(problem);
}

process.exitCode = problems.length > 0 ? 1 : 0;
