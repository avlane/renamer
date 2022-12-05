import { USAGE, UsageError, readArgs } from './args.js';
import { applyPlan } from './apply.js';
import { checkPlan } from './check.js';
import { buildPlan } from './plan.js';
import { TemplateError } from './template.js';
import { LOG_NAME, readLog, removeLog, undoPlan, writeLog } from './undo.js';
import { collectFiles, WalkError } from './walk.js';

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
  const cwd = io.cwd ?? process.cwd();
  if (opts.undo) return undo(opts, io, cwd);
  if (opts.files.length === 0) {
    io.stderr.write(USAGE);
    return 2;
  }
  let plan;
  try {
    const files = collectFiles(opts.files, opts);
    plan = buildPlan(files, opts).filter(step => step.changed);
  } catch (err) {
    const expected = err instanceof SyntaxError || err instanceof TemplateError || err instanceof WalkError ||
      /^(the text to find|nothing to do|use either|cannot read the modification time)/.test(err.message);
    if (!expected) throw err;
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
  if (!opts.dryRun && plan.length > 0) {
    applyPlan(plan);
    writeLog(cwd, plan, io.now ? io.now() : new Date());
  }
  if (plan.length === 0) io.stdout.write('nothing to rename\n');
  return 0;
}

// Put back the files renamed by the previous run.
function undo(opts, io, cwd) {
  let log;
  try {
    log = readLog(cwd);
  } catch (err) {
    io.stderr.write(`renamer: ${err.message}\n`);
    return 1;
  }
  if (log === null) {
    io.stderr.write(`renamer: nothing to undo (no ${LOG_NAME} in ${cwd})\n`);
    return 1;
  }
  const plan = undoPlan(log);
  const problems = checkPlan(plan);
  if (problems.length > 0) {
    for (const problem of problems) io.stderr.write(`renamer: ${problem}\n`);
    io.stderr.write('renamer: nothing was undone\n');
    return 1;
  }
  for (const step of plan) io.stdout.write(`${opts.dryRun ? '(dry run) ' : ''}${step.from} -> ${step.to}\n`);
  if (!opts.dryRun) {
    applyPlan(plan);
    removeLog(cwd);
  }
  return 0;
}
