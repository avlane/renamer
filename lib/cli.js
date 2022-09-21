import fs from 'node:fs';
import { buildPlan } from './plan.js';
import { checkPlan } from './check.js';

const USAGE = 'usage: renamer [-n] <find> <replacement> <file>...\n';

// io is { stdout, stderr }. Returns the exit status.
export function run(argv, io) {
  let dryRun = false;
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-n' || arg === '--dry-run') dryRun = true;
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
  const plan = buildPlan(files, { find, replacement }).filter(step => step.changed);
  const problems = checkPlan(plan);
  if (problems.length > 0) {
    for (const problem of problems) io.stderr.write(`renamer: ${problem}\n`);
    io.stderr.write('renamer: nothing was renamed\n');
    return 1;
  }
  for (const step of plan) {
    io.stdout.write(`${dryRun ? '(dry run) ' : ''}${step.from} -> ${step.to}\n`);
    if (!dryRun) fs.renameSync(step.from, step.to);
  }
  if (plan.length === 0) io.stdout.write('nothing to rename\n');
  return 0;
}
