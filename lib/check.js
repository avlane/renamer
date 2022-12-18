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

// Problems that would stop the plan from working, as a list of messages.
// `exists` and `sameFile` are injectable for tests.
export function checkPlan(plan, { exists = fs.existsSync, sameFile = isSameFile } = {}) {
  const problems = [];
  const sources = new Set(plan.map(step => key(step.from)));
  const claimed = new Map();
  for (const step of plan) {
    if (!exists(step.from)) problems.push(`${step.from}: no such file`);
    const other = claimed.get(key(step.to));
    if (other !== undefined) {
      problems.push(`${other} and ${step.from} would both be renamed to ${step.to}`);
    } else {
      claimed.set(key(step.to), step.from);
    }
    if (exists(step.to) && !sources.has(key(step.to)) && !sameFile(step.from, step.to)) {
      problems.push(`${step.to} already exists (needed for ${step.from})`);
    }
  }
  return problems;
}
