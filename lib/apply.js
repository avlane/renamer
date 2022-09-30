import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

// Carry out a checked plan. A file whose target is the current name of
// another file in the plan is parked under a temporary name first, so swaps
// (a <-> b) and chains (a -> b, b -> c) work in any order. `rename` is
// injectable for tests.
export function applyPlan(plan, { rename = fs.renameSync } = {}) {
  const sources = new Set(plan.map(step => path.resolve(step.from)));
  const parked = [];
  for (const step of plan) {
    if (sources.has(path.resolve(step.to))) {
      const suffix = randomBytes(4).toString('hex');
      const temp = path.join(path.dirname(step.from), `.renamer-${suffix}-${path.basename(step.from)}`);
      rename(step.from, temp);
      parked.push({ temp, to: step.to });
    } else {
      rename(step.from, step.to);
    }
  }
  for (const { temp, to } of parked) rename(temp, to);
}
