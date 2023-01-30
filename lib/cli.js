import path from 'node:path';
import { USAGE, UsageError, readArgs } from './args.js';
import { applyPlan } from './apply.js';
import { checkPlan, existingTargets } from './check.js';
import { PlanError } from './errors.js';
import { buildPlan } from './plan.js';
import { TemplateError } from './template.js';
import { LOG_NAME, readLog, removeLog, undoPlan, writeLog } from './undo.js';
import { collectFiles, WalkError } from './walk.js';

// Print the steps (text or JSON). `replaced` are steps that overwrite a file.
function show(opts, io, plan, replaced = []) {
  if (opts.json) {
    const steps = plan.map(({ from, to }) => ({ from, to }));
    io.stdout.write(JSON.stringify({ dryRun: opts.dryRun, steps, problems: [] }, null, 2) + '\n');
    return;
  }
  for (const step of plan) {
    const note = replaced.includes(step) ? '  (replaces an existing file)' : '';
    io.stdout.write(`${opts.dryRun ? '(dry run) ' : ''}${step.from} -> ${step.to}${note}\n`);
  }
  if (plan.length === 0) io.stdout.write('nothing to rename\n');
}

// The checks failed: say why and that nothing was done. Returns the exit status.
function refuse(opts, io, problems, verb) {
  if (opts.json) {
    io.stdout.write(JSON.stringify({ dryRun: opts.dryRun, steps: [], problems }, null, 2) + '\n');
  } else {
    for (const problem of problems) io.stderr.write(`renamer: ${problem}\n`);
    io.stderr.write(`renamer: nothing was ${verb}\n`);
  }
  return 1;
}

// io is { stdout, stderr, cwd?, now? }. Returns the exit status.
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
      err instanceof PlanError;
    if (!expected) throw err;
    io.stderr.write(`renamer: ${err.message}\n`);
    return 2;
  }
  const problems = checkPlan(plan, { force: opts.force });
  if (problems.length > 0) return refuse(opts, io, problems, 'renamed');
  const replaced = opts.force ? existingTargets(plan) : [];
  show(opts, io, plan, replaced);
  if (!opts.dryRun && plan.length > 0) {
    applyPlan(plan);
    writeLog(cwd, plan, io.now ? io.now() : new Date(), replaced.map(step => path.resolve(step.to)));
  }
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
  if (log.overwritten !== undefined) {
    io.stderr.write(`renamer: note: ${log.overwritten.length} file(s) replaced by that run cannot be restored\n`);
  }
  const problems = checkPlan(plan);
  if (problems.length > 0) return refuse(opts, io, problems, 'undone');
  show(opts, io, plan);
  if (!opts.dryRun) {
    applyPlan(plan);
    removeLog(cwd);
  }
  return 0;
}
