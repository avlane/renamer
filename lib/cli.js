import { buildPlan } from './plan.js';
import { applyPlan } from './apply.js';
import { checkPlan } from './check.js';

const USAGE = 'usage: renamer [-n] [-e [--flags FLAGS]] <find> <replacement> <file>...\n';

// io is { stdout, stderr }. Returns the exit status.
export function run(argv, io) {
  let dryRun = false;
  let regex = false;
  let flags;
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-n' || arg === '--dry-run') dryRun = true;
    else if (arg === '-e' || arg === '--regex') regex = true;
    else if (arg === '--flags') flags = argv[++i];
    else positional.push(arg);
  }
  const [find, replacement, ...files] = positional;
  if (find === undefined || replacement === undefined || files.length === 0) {
    io.stderr.write(USAGE);
    return 2;
  }
  if (find === '') {
    io.stderr.write('renamer: the text to find cannot be empty\n');
    return 2;
  }
  let plan;
  try {
    plan = buildPlan(files, { find, replacement, regex, flags }).filter(step => step.changed);
  } catch (err) {
    if (!(err instanceof SyntaxError)) throw err;
    io.stderr.write(`renamer: ${err.message}\n`);
    return 2;
  }
  const problems = checkPlan(plan);
  if (problems.length > 0) {
    for (const problem of problems) io.stderr.write(`renamer: ${problem}\n`);
    io.stderr.write('renamer: nothing was renamed\n');
    return 1;
  }
  for (const step of plan) io.stdout.write(`${dryRun ? '(dry run) ' : ''}${step.from} -> ${step.to}\n`);
  if (!dryRun) applyPlan(plan);
  if (plan.length === 0) io.stdout.write('nothing to rename\n');
  return 0;
}
