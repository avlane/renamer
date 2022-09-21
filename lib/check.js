import fs from 'node:fs';
import path from 'node:path';

const key = file => path.resolve(file);

// Problems that would stop the plan from working, as a list of messages.
// `exists` is injectable for tests.
export function checkPlan(plan, { exists = fs.existsSync } = {}) {
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
    if (exists(step.to) && !sources.has(key(step.to))) {
      problems.push(`${step.to} already exists (needed for ${step.from})`);
    }
  }
  return problems;
}
