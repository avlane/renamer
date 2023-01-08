import fs from 'node:fs';
import path from 'node:path';

const key = file => path.resolve(file);

// Is this the same file on disk? True for "a.txt" and "A.txt" on a
// case-insensitive file system.
function isSameFile(a, b) {
  try {
    const first = fs.statSync(a);
    const second = fs.statSync(b);
    return first.dev === second.dev && first.ino === second.ino;
  } catch {
    return false;
  }
}

function isFolder(file) {
  try {
    return fs.statSync(file).isDirectory();
  } catch {
    return false;
  }
}

// The steps whose target already exists and is not about to be renamed away,
// so carrying them out would replace something.
export function existingTargets(plan, { exists = fs.existsSync, sameFile = isSameFile } = {}) {
  const sources = new Set(plan.map(step => key(step.from)));
  return plan.filter(step => exists(step.to) && !sources.has(key(step.to)) && !sameFile(step.from, step.to));
}

// Problems that would stop the plan from working, as a list of messages. With
// `force`, replacing an existing file is allowed (replacing a folder is not).
// `exists`, `sameFile` and `folder` are injectable for tests.
export function checkPlan(plan, { exists = fs.existsSync, sameFile = isSameFile, force = false, folder = isFolder } = {}) {
  const problems = [];
  const taken = new Set(existingTargets(plan, { exists, sameFile }));
  const claimed = new Map();
  for (const step of plan) {
    if (!exists(step.from)) problems.push(`${step.from}: no such file`);
    const other = claimed.get(key(step.to));
    if (other !== undefined) {
      problems.push(`${other} and ${step.from} would both be renamed to ${step.to}`);
    } else {
      claimed.set(key(step.to), step.from);
    }
    if (!taken.has(step)) continue;
    if (!force) problems.push(`${step.to} already exists (needed for ${step.from})`);
    else if (folder(step.to)) problems.push(`${step.to} is a folder; --force does not replace folders`);
  }
  return problems;
}
