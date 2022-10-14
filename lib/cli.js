import { USAGE, UsageError, readArgs } from './args.js';
import { applyPlan } from './apply.js';
import { checkPlan } from './check.js';
import { buildPlan } from './plan.js';

// io is { stdout, stderr }. Returns the exit status.
export function run(argv, io) {
  let opts;
  try {
    opts = readArgs(argv);
  } catch (err) {
    if (!(err instanceof UsageError)) throw err;
    io.stderr.write(`renamer: ${err.message}\n`);
    return 2;
  }
  if (opts.help) {
    io.stdout.write(USAGE);
    return 0;
  }
  if (opts.files.length === 0) {
    io.stderr.write(USAGE);
    return 2;
  }
  let plan;
  try {
    plan = buildPlan(opts.files, opts).filter(step => step.changed);
  } catch (err) {
    if (!(err instanceof SyntaxError) && !/^(the text to find|nothing to do)/.test(err.message)) throw err;
    io.stderr.write(`renamer: ${err.message}\n`);
    return 2;
  }
  const problems = checkPlan(plan);
  if (problems.length > 0) {
    for (const problem of problems) io.stderr.write(`renamer: ${problem}\n`);
    io.stderr.write('renamer: nothing was renamed\n');
    return 1;
  }
  for (const step of plan) io.stdout.write(`${opts.dryRun ? '(dry run) ' : ''}${step.from} -> ${step.to}\n`);
  if (!opts.dryRun) applyPlan(plan);
  if (plan.length === 0) io.stdout.write('nothing to rename\n');
  return 0;
}
