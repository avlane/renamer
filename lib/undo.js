import fs from 'node:fs';
import path from 'node:path';

export const LOG_NAME = '.renamer-undo.json';

// `overwritten` lists the files a --force run replaced; they cannot be restored.
export function writeLog(dir, plan, now = new Date(), overwritten = []) {
  const log = {
    version: 1,
    createdAt: now.toISOString(),
    steps: plan.map(step => ({ from: path.resolve(step.from), to: path.resolve(step.to) }))
  };
  if (overwritten.length > 0) log.overwritten = overwritten;
  fs.writeFileSync(path.join(dir, LOG_NAME), JSON.stringify(log, null, 2) + '\n');
}

// The saved log, or null when there is none. Throws if the file is damaged.
export function readLog(dir) {
  let text;
  try {
    text = fs.readFileSync(path.join(dir, LOG_NAME), 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
  let log;
  try {
    log = JSON.parse(text);
  } catch {
    throw new Error(`${LOG_NAME} is damaged (not valid JSON)`);
  }
  const valid = log && log.version === 1 && Array.isArray(log.steps) &&
    log.steps.every(step => typeof step.from === 'string' && typeof step.to === 'string') &&
    (log.overwritten === undefined || (Array.isArray(log.overwritten) && log.overwritten.every(item => typeof item === 'string')));
  if (!valid) throw new Error(`${LOG_NAME} is damaged (unexpected contents)`);
  return log;
}

export function removeLog(dir) {
  fs.rmSync(path.join(dir, LOG_NAME), { force: true });
}

// The plan that puts every file back where it was.
export function undoPlan(log) {
  return log.steps.map(step => ({ from: step.to, to: step.from, changed: true }));
}
