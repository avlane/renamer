#!/usr/bin/env node
import fs from 'node:fs';
import { buildPlan } from '../lib/plan.js';

const [find, replacement, ...files] = process.argv.slice(2);
if (find === undefined || replacement === undefined || files.length === 0) {
  console.error('usage: renamer <find> <replacement> <file>...');
  process.exit(1);
}

for (const step of buildPlan(files, { find, replacement }).filter(s => s.changed)) {
  fs.renameSync(step.from, step.to);
  console.log(`${step.from} -> ${step.to}`);
}
